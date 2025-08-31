import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import User from '@/models/User';
import Task from '@/models/Task';
import WalletTransaction from '@/models/WalletTransaction';

export async function POST(request: NextRequest) {
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

    const { taskId, title } = await request.json();

    // Validation
    if (!taskId || !title) {
      return NextResponse.json(
        { error: 'Invalid task data' },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: 'VIP subscription required to complete tasks' },
        { status: 403 }
      );
    }

    // Get daily task limits and rewards
    let dailyTaskLimit = 0;
    let dailyEarnings = 0;
    let reward = 0;
    
    switch (user.vipLevel) {
      case 'VIP1':
        dailyTaskLimit = 5;
        dailyEarnings = 30;
        reward = 30 / 5;  // ₹30 daily ÷ 5 tasks = ₹6 per task
        break;
      case 'VIP2':
        dailyTaskLimit = 10;
        dailyEarnings = 100;
        reward = 100 / 10; // ₹100 daily ÷ 10 tasks = ₹10 per task
        break;
      case 'VIP3':
        dailyTaskLimit = 20;
        dailyEarnings = 370;
        reward = 370 / 20; // ₹370 daily ÷ 20 tasks = ₹18.5 per task
        break;
      default:
        dailyTaskLimit = 0;
        dailyEarnings = 0;
        reward = 0;
    }

    // Check daily task limit
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
    
    // Count tasks completed today from MongoDB (NO CACHING)
    let todayTasks = 0;
    try {
      // Use aggregation for better performance and accuracy
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
            taskCount: { $sum: 1 }
          }
        }
      ]).exec();

      if (todayTaskStats.length > 0) {
        todayTasks = todayTaskStats[0].taskCount;
      }
      
      console.log(`MongoDB: User ${userId} has completed ${todayTasks} tasks today`);
      
    } catch (countError) {
      console.error('Error counting today tasks from MongoDB:', countError);
      todayTasks = 0;
    }

    if (todayTasks >= dailyTaskLimit) {
      return NextResponse.json(
        { 
          error: `Daily task limit reached! You can only complete ${dailyTaskLimit} tasks per day with ${user.vipLevel}.`,
          dailyLimit: dailyTaskLimit,
          completedToday: todayTasks,
          dailyEarnings: dailyEarnings
        },
        { status: 429 } // Too Many Requests
      );
    }

    // Check if task already completed
    const existingTask = await Task.findOne({ userId, taskId });
    if (existingTask) {
      return NextResponse.json(
        { 
          error: 'Task already completed',
          message: 'You have already completed this task and earned the reward!',
          alreadyCompleted: true,
          existingReward: existingTask.reward
        },
        { status: 400 }
      );
    }

    // Store completed task in database
    const newTask = new Task({
      userId,
      taskId,
      title,
      reward,
      status: 'completed'
    });
    await newTask.save();

    // DO NOT update user.totalEarnings in memory - calculate from transactions
    // user.totalEarnings += reward;  // ❌ REMOVED - Dangerous memory storage
    // await user.save();             // ❌ REMOVED - No need to save user
    
    // Balance is calculated real-time from transactions in the balance API

    // Record wallet transaction
    const transaction = new WalletTransaction({
      userId,
      type: 'task_completion',
      amount: reward,
      description: `Completed task: ${title}`,
      balanceAfter: user.totalEarnings,
      reference: taskId
    });
    await transaction.save();

    return NextResponse.json({
      message: 'Task completed successfully',
      taskId: taskId,
      reward: reward,
      note: 'Balance updated in database. Use /api/wallet/balance for real-time balance.',
      dailyProgress: {
        completed: todayTasks + 1,
        limit: dailyTaskLimit,
        remaining: dailyTaskLimit - (todayTasks + 1),
        dailyEarnings: dailyEarnings
      }
    });

  } catch (error: any) {
    console.error('Task completion error:', error);
    return NextResponse.json(
      { error: 'Failed to complete task' },
      { status: 500 }
    );
  }
}
