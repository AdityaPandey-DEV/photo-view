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

    // Check if user has VIP level
    if (!user.vipLevel) {
      return NextResponse.json({
        hasVip: false,
        message: 'VIP subscription required to view analytics'
      });
    }

    // Get VIP level details
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

    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    const thisMonth = new Date(today);
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    // MongoDB Aggregation for comprehensive analytics
    const analytics = await Task.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$completedAt'
            }
          },
          taskCount: { $sum: 1 },
          totalReward: { $sum: '$reward' },
          tasks: { $push: { taskId: '$taskId', title: '$title', reward: '$reward' } }
        }
      },
      {
        $sort: { '_id': -1 }
      }
    ]).exec();

    // Calculate today's stats
    const todayStats = analytics.find(day => day._id === today.toISOString().split('T')[0]) || {
      taskCount: 0,
      totalReward: 0,
      tasks: []
    };

    // Calculate weekly stats
    const weeklyStats = analytics
      .filter(day => new Date(day._id) >= thisWeek)
      .reduce((acc, day) => ({
        taskCount: acc.taskCount + day.taskCount,
        totalReward: acc.totalReward + day.totalReward,
        days: acc.days + 1
      }), { taskCount: 0, totalReward: 0, days: 0 });

    // Calculate monthly stats
    const monthlyStats = analytics
      .filter(day => new Date(day._id) >= thisMonth)
      .reduce((acc, day) => ({
        taskCount: acc.taskCount + day.taskCount,
        totalReward: acc.totalReward + day.totalReward,
        days: acc.days + 1
      }), { taskCount: 0, totalReward: 0, days: 0 });

    // Get recent task history
    const recentTasks = await Task.find({ userId, status: 'completed' })
      .sort({ completedAt: -1 })
      .limit(20)
      .exec();

    // Get earnings from wallet transactions for verification
    const todayTransactions = await WalletTransaction.find({
      userId,
      type: 'task_completion',
      createdAt: { $gte: today, $lt: tomorrow }
    }).exec();

    const transactionEarnings = todayTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Calculate performance metrics
    const dailyProgress = {
      completed: todayStats.taskCount,
      limit: dailyTaskLimit,
      remaining: Math.max(0, dailyTaskLimit - todayStats.taskCount),
      percentage: Math.round((todayStats.taskCount / dailyTaskLimit) * 100)
    };

    const performance = {
      daily: {
        tasks: todayStats.taskCount,
        earnings: todayStats.totalReward,
        limit: dailyTaskLimit,
        efficiency: dailyTaskLimit > 0 ? Math.round((todayStats.taskCount / dailyTaskLimit) * 100) : 0
      },
      weekly: {
        tasks: weeklyStats.taskCount,
        earnings: weeklyStats.totalReward,
        averagePerDay: weeklyStats.days > 0 ? Math.round(weeklyStats.taskCount / weeklyStats.days) : 0
      },
      monthly: {
        tasks: monthlyStats.taskCount,
        earnings: monthlyStats.totalReward,
        averagePerDay: monthlyStats.days > 0 ? Math.round(monthlyStats.taskCount / monthlyStats.days) : 0
      }
    };

    return NextResponse.json({
      success: true,
      hasVip: true,
      vipLevel: user.vipLevel,
      dailyProgress,
      performance,
      analytics: {
        today: todayStats,
        weekly: weeklyStats,
        monthly: monthlyStats,
        recentTasks: recentTasks.map(t => ({
          taskId: t.taskId,
          title: t.title,
          reward: t.reward,
          completedAt: t.completedAt
        }))
      },
      limits: {
        daily: dailyTaskLimit,
        weekly: dailyTaskLimit * 7,
        monthly: dailyTaskLimit * 30
      },
      earnings: {
        today: todayStats.totalReward,
        weekly: weeklyStats.totalReward,
        monthly: monthlyStats.totalReward,
        perTask: rewardPerTask,
        dailyTarget: dailyEarnings
      },
      verification: {
        taskBasedEarnings: todayStats.totalReward,
        transactionBasedEarnings: transactionEarnings,
        discrepancy: Math.abs(todayStats.totalReward - transactionEarnings)
      },
      nextReset: tomorrow,
      lastUpdated: new Date().toISOString(),
      note: 'All analytics calculated real-time from MongoDB - no caching used'
    });

  } catch (error: any) {
    console.error('Task analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task analytics' },
      { status: 500 }
    );
  }
}
