import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
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

    // Find user with VIP information - start with basic fields first
    const user = await User.findById(userId).select('vipLevel subscriptionDate monthlyReturns profileImage');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('VIP Status API: User found:', {
      id: user._id,
      vipLevel: user.vipLevel,
      subscriptionDate: user.subscriptionDate,
      monthlyReturns: user.monthlyReturns
    });

    // Calculate VIP benefits based on level
    let dailyTaskLimit = 0;
    let dailyEarnings = 0;
    let monthlyTaskLimit = 0;
    
    if (user.vipLevel) {
      switch (user.vipLevel) {
        case 'VIP1':
          dailyTaskLimit = 5;
          dailyEarnings = 30;
          monthlyTaskLimit = 150;
          break;
        case 'VIP2':
          dailyTaskLimit = 10;
          dailyEarnings = 100;
          monthlyTaskLimit = 300;
          break;
        case 'VIP3':
          dailyTaskLimit = 20;
          dailyEarnings = 370;
          monthlyTaskLimit = 600;
          break;
      }
    }

    // Create VIP details object with calculated values
    const vipDetails = {
      level: user.vipLevel || 'none',
      status: user.vipLevel ? 'active' : 'none',
      dailyTaskLimit,
      dailyEarnings,
      monthlyTaskLimit,
      monthlyReturns: user.monthlyReturns || 0,
      subscriptionDate: user.subscriptionDate,
      expiryDate: null,
      isActive: !!user.vipLevel
    };

    // Get VIP purchase history from transactions
    const vipTransactions = await WalletTransaction.find({
      userId,
      type: 'vip_subscription'
    }).sort({ createdAt: -1 }).limit(10);

    // Get current month's earnings from transactions
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyEarnings = await WalletTransaction.aggregate([
      {
        $match: {
          userId: user._id,
          type: 'task_completion',
          createdAt: { $gte: thisMonth },
          amount: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$amount' }
        }
      }
    ]).exec();

    const currentMonthEarnings = monthlyEarnings.length > 0 ? monthlyEarnings[0].totalEarnings : 0;

    // Get today's task count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = await WalletTransaction.countDocuments({
      userId: user._id,
      type: 'task_completion',
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const response = {
      success: true,
      vip: vipDetails,
      currentStatus: {
        todayTasks: 0, // Simplified for now
        currentMonthEarnings: 0, // Simplified for now
        remainingDailyTasks: vipDetails.dailyTaskLimit,
        remainingMonthlyTasks: vipDetails.monthlyTaskLimit,
        dailyProgress: 0
      },
      purchaseHistory: [],
      recentTransactions: [],
      profileImage: user.profileImage,
      lastUpdated: new Date().toISOString(),
      note: 'Simplified VIP data retrieved from MongoDB'
    };

    console.log('VIP Status API: Response:', response);
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('VIP status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch VIP status' },
      { status: 500 }
    );
  }
}
