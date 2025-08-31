import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';

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

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || !decoded.managerId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get manager details
    const manager = await Manager.findById(decoded.managerId)
      .select('-__v')
      .populate('assignedVips', 'name phone vipLevel')
      .populate('assignedWithdrawals', 'amount status submittedAt');

    if (!manager) {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      );
    }

    if (!manager.isActive) {
      return NextResponse.json(
        { error: 'Manager account is deactivated' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      manager: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        phone: manager.phone,
        role: manager.role,
        permissions: manager.permissions,
        isActive: manager.isActive,
        maxVipCapacity: manager.maxVipCapacity,
        currentVipCount: manager.currentVipCount,
        assignedVips: manager.assignedVips,
        assignedWithdrawals: manager.assignedWithdrawals,
        totalWithdrawalsProcessed: manager.totalWithdrawalsProcessed,
        totalAmountProcessed: manager.totalAmountProcessed,
        lastLoginAt: manager.lastLoginAt,
        isEmailVerified: manager.isEmailVerified,
        createdAt: manager.createdAt,
        updatedAt: manager.updatedAt
      },
      message: 'Authentication successful'
    });

  } catch (error: any) {
    console.error('Manager auth error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    if (error.name === 'TokenExpiredError') {
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
