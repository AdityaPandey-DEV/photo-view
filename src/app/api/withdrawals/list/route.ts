import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Withdrawal from '@/models/Withdrawal';
import Manager from '@/models/Manager';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get manager token
    const cookieStore = await cookies();
    const token = cookieStore.get('manager-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify manager
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const managerId = decoded.managerId;

    const manager = await Manager.findById(managerId);
    if (!manager || !manager.isActive) {
      return NextResponse.json({ error: 'Manager access denied' }, { status: 403 });
    }

    // Check permissions
    if (!manager.permissions.includes('manage_withdrawals')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Get withdrawals
    const withdrawals = await Withdrawal.find(filter)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const totalCount = await Withdrawal.countDocuments(filter);

    // Get statistics
    const stats = await Withdrawal.aggregate([
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
    console.error('List withdrawals error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch withdrawal requests' 
    }, { status: 500 });
  }
}
