import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

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

    // Find user and check VIP status
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if VIP has expired
    let vipStatus = user.vipStatus || 'none';
    let vipLevel = user.vipLevel;
    let monthlyReturns = user.monthlyReturns || 0;

    if (user.vipExpiryDate && new Date() > new Date(user.vipExpiryDate)) {
      // VIP has expired
      vipStatus = 'expired';
      vipLevel = undefined;
      monthlyReturns = 0;

      // Update user with expired VIP status
      await User.findByIdAndUpdate(userId, {
        vipStatus: 'expired',
        vipLevel: undefined,
        monthlyReturns: 0
      });

      console.log(`VIP expired for user ${userId}`);
    }

    return NextResponse.json({
      success: true,
      vip: {
        level: vipLevel,
        status: vipStatus,
        monthlyReturns,
        expiryDate: user.vipExpiryDate,
        subscriptionDate: user.subscriptionDate
      },
      lastUpdated: new Date().toISOString(),
      note: 'VIP status checked and updated from MongoDB'
    });

  } catch (error: any) {
    console.error('VIP status update error:', error);
    return NextResponse.json(
      { error: 'Failed to update VIP status' },
      { status: 500 }
    );
  }
}
