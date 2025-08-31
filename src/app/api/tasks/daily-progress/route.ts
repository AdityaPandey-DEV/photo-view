import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import User from '@/models/User';
import Task from '@/models/Task';
import WalletTransaction from '@/models/WalletTransaction';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get user from JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if VIP has expired and update status if needed
    if (user.vipExpiryDate && new Date() > new Date(user.vipExpiryDate)) {
      // VIP has expired - update user status
      await User.findByIdAndUpdate(userId, {
        vipStatus: 'expired',
        vipLevel: undefined,
        monthlyReturns: 0
      });
      
      // Update local user object
      user.vipLevel = undefined;
      user.vipStatus = 'expired';
      user.monthlyReturns = 0;
      
      console.log(`VIP expired for user ${userId} - status updated`);
    }

    // Check if user has VIP level
    if (!user.vipLevel) {
      return NextResponse.json({
        hasVip: false,
        message: 'VIP subscription required to complete tasks'
      });
    }

    // Get daily task limits and earnings
    let dailyTaskLimit = 0;
    let dailyEarnings = 0;
    let rewardPerTask = 0;
    
    switch (user.vipLevel) {
      case 'VIP1':
        dailyTaskLimit = 5;
        dailyEarnings = 30;
        rewardPerTask = 30 / 5;
        break;
      case 'VIP2':
        dailyTaskLimit = 10;
        dailyEarnings = 100;
        rewardPerTask = 100 / 10;
        break;
      case 'VIP3':
        dailyTaskLimit = 20;
        dailyEarnings = 370;
        rewardPerTask = 370 / 20;
        break;
      default:
        dailyTaskLimit = 0;
        dailyEarnings = 0;
        rewardPerTask = 0;
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count tasks completed today from MongoDB (NO CACHING)
    let todayTasks = 0;
    let todayEarnings = 0;
    
    try {
      // Get all tasks completed today with aggregation for better performance
      const todayTaskStats = await Task.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            completedAt: {
              $gte: today,
              $lt: tomorrow
            },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            taskCount: { $sum: 1 },
            totalReward: { $sum: '$reward' }
          }
        }
      ]).exec();

      if (todayTaskStats.length > 0) {
        todayTasks = todayTaskStats[0].taskCount;
        todayEarnings = todayTaskStats[0].totalReward;
      }
      
      console.log(`MongoDB: User ${userId} completed ${todayTasks} tasks today with ₹${todayEarnings} earnings`);
      
    } catch (countError) {
      console.error('Error counting today tasks from MongoDB:', countError);
      todayTasks = 0;
      todayEarnings = 0;
    }

    // Double-check with wallet transactions for accuracy
    try {
      const todayTransactions = await WalletTransaction.find({
        userId,
        type: 'task_completion',
        createdAt: {
          $gte: today,
          $lt: tomorrow
        }
      }).exec();

      const transactionEarnings = todayTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
      
      // Log discrepancy if any (for debugging)
      if (Math.abs(todayEarnings - transactionEarnings) > 0.01) {
        console.warn(`Earnings discrepancy: Tasks=${todayEarnings}, Transactions=${transactionEarnings}`);
      }
      
      // Use transaction earnings as source of truth
      todayEarnings = transactionEarnings;
      
    } catch (transactionError) {
      console.error('Error fetching today transactions:', transactionError);
      // Keep using task-based earnings as fallback
    }

    const remainingTasks = Math.max(0, dailyTaskLimit - todayTasks);
    const remainingEarnings = remainingTasks * rewardPerTask;

    // Get next reset time (tomorrow at midnight)
    const nextReset = new Date(tomorrow);

    return NextResponse.json({
      hasVip: true,
      vipLevel: user.vipLevel,
      dailyProgress: {
        completed: todayTasks,
        limit: dailyTaskLimit,
        remaining: remainingTasks,
        percentage: Math.round((todayTasks / dailyTaskLimit) * 100)
      },
      earnings: {
        today: todayEarnings,
        daily: dailyEarnings,
        remaining: remainingEarnings,
        perTask: rewardPerTask
      },
      nextReset: nextReset,
      canCompleteMore: todayTasks < dailyTaskLimit
    });

  } catch (error: any) {
    console.error('Daily progress error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily progress' },
      { status: 500 }
    );
  }
}
