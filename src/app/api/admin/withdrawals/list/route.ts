import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';
import Withdrawal from '@/models/Withdrawal';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get('manager-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const managerId = decoded.managerId;
    
    // Check if manager exists
    const manager = await Manager.findById(managerId);
    if (!manager || !manager.isActive) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Fetch withdrawal requests with real-time data
    const withdrawals = await Withdrawal.find(filter)
      .populate('userId', 'name phone')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalCount = await Withdrawal.countDocuments(filter);

    // Calculate real-time statistics
    const stats = await Withdrawal.aggregate([
      { $match: filter },
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

    // Format withdrawal requests
    const formattedWithdrawals = withdrawals.map(withdrawal => {
      const statusInfo = getStatusInfo(withdrawal.status);
      
      return {
        id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        statusInfo,
        paymentMethod: withdrawal.paymentMethod,
        paymentDetails: withdrawal.paymentDetails,
        userId: {
          _id: withdrawal.userId._id,
          name: withdrawal.userName || withdrawal.userId.name,
          phone: withdrawal.userPhone || withdrawal.userId.phone
        },
        submittedAt: withdrawal.submittedAt,
        processedAt: withdrawal.processedAt,
        managerNotes: withdrawal.managerNotes,
        canProcess: withdrawal.status === 'pending' || withdrawal.status === 'approved'
      };
    });

    return NextResponse.json({
      withdrawals: formattedWithdrawals,
      stats: statsData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      },
      message: 'Withdrawals fetched successfully from MongoDB'
    });

  } catch (error: any) {
    console.error('Fetch withdrawals error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch withdrawals' 
    }, { status: 500 });
  }
}

// Helper function to get status information
function getStatusInfo(status: string) {
  switch (status) {
    case 'pending':
      return {
        message: 'Waiting for manager approval',
        estimatedTime: '24-48 hours',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100'
      };
    case 'approved':
      return {
        message: 'Approved - ready for payment',
        estimatedTime: '24 hours',
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      };
    case 'rejected':
      return {
        message: 'Request was rejected',
        estimatedTime: 'N/A',
        color: 'text-red-600',
        bgColor: 'bg-red-100'
      };
    case 'paid':
      return {
        message: 'Payment completed successfully',
        estimatedTime: 'Completed',
        color: 'text-green-700',
        bgColor: 'bg-green-200'
      };
    default:
      return {
        message: 'Unknown status',
        estimatedTime: 'N/A',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100'
      };
  }
}
