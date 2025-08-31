import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    console.log('VIP Test API: Starting...');
    
    await connectDB();
    console.log('VIP Test API: Database connected');

    // Get user from JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      console.log('VIP Test API: No token found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('VIP Test API: Token found, verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;
    console.log('VIP Test API: User ID from token:', userId);

    // Find user with basic info
    const user = await User.findById(userId).select('vipLevel subscriptionDate monthlyReturns');
    if (!user) {
      console.log('VIP Test API: User not found');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('VIP Test API: User found:', {
      id: user._id,
      vipLevel: user.vipLevel,
      subscriptionDate: user.subscriptionDate,
      monthlyReturns: user.monthlyReturns
    });

    // Return simple response
    return NextResponse.json({
      success: true,
      message: 'VIP test successful',
      user: {
        vipLevel: user.vipLevel || 'none',
        subscriptionDate: user.subscriptionDate,
        monthlyReturns: user.monthlyReturns || 0
      }
    });

  } catch (error: any) {
    console.error('VIP Test API error:', error);
    return NextResponse.json(
      { error: 'VIP test failed', details: error.message },
      { status: 500 }
    );
  }
}
