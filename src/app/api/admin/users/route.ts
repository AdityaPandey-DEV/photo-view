import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Manager from '@/models/Manager';
import WalletTransaction from '@/models/WalletTransaction';
import { JwtPayload } from '@/types/jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get manager token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('manager-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify manager token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    if (!decoded || !decoded.managerId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Verify manager exists and is active
    const manager = await Manager.findById(decoded.managerId);
    if (!manager || !manager.isActive) {
      return NextResponse.json(
        { error: 'Manager access denied' },
        { status: 403 }
      );
    }

    // Check if manager has permission to manage users
    if (!manager.permissions.includes('manage_users')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Fetch all users with real-time earnings calculation
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    // Calculate real-time earnings for each user from WalletTransaction
    const usersWithEarnings = await Promise.all(
      users.map(async (user) => {
        // Calculate total earnings from task completions
        const totalEarnings = await WalletTransaction.aggregate([
          { $match: { userId: user._id, type: 'task_completion' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        // Calculate total withdrawals
        const totalWithdrawals = await WalletTransaction.aggregate([
          { $match: { userId: user._id, type: 'withdrawal' } },
          { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
        ]);
        
        // Calculate current balance
        const currentBalance = await WalletTransaction.aggregate([
          { $match: { userId: user._id } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const earnings = totalEarnings[0]?.total || 0;
        const withdrawals = totalWithdrawals[0]?.total || 0;
        const balance = currentBalance[0]?.total || 0;

        return {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          vipLevel: user.vipLevel,
          totalEarnings: Math.max(0, balance), // Current balance (never negative)
          totalEarned: earnings, // Total amount ever earned
          totalWithdrawn: withdrawals, // Total amount withdrawn
          monthlyReturns: user.monthlyReturns || 0,
          subscriptionDate: user.subscriptionDate,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };
      })
    );

    return NextResponse.json({
      users: usersWithEarnings
    });

  } catch (error: unknown) {
    console.error('Fetch users error:', error);
    
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
