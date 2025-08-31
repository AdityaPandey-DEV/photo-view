import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Withdrawal from '@/models/Withdrawal';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get user token
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify user
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is VIP
    if (!user.vipLevel) {
      return NextResponse.json({ error: 'Only VIP users can view withdrawal requests' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { userId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Get user's withdrawals
    const withdrawals = await Withdrawal.find(filter)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const totalCount = await Withdrawal.countDocuments(filter);

    // Get user statistics
    const stats = await Withdrawal.aggregate([
      { $match: { userId } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
        totalAmount: { $sum: '$amount' }
      }}
    ]);

    const statsData = stats[0] || {
      total: 0, pending: 0, approved: 0, rejected: 0, paid: 0, totalAmount: 0
    };

    return NextResponse.json({
      withdrawals,
      stats: statsData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      }
    });

  } catch (error: any) {
    console.error('Get user withdrawals error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch withdrawal requests' 
    }, { status: 500 });
  }
}
