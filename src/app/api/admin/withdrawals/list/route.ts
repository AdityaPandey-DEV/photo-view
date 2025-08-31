import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';
import WithdrawalRequest from '@/models/WithdrawalRequest';

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
    const assignedManagerId = searchParams.get('managerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (assignedManagerId) {
      filter.assignedManager = assignedManagerId;
    }

    // Fetch withdrawal requests with real-time data
    const withdrawalRequests = await WithdrawalRequest.find(filter)
      .populate('userId', 'name phone')
      .populate('assignedManager', 'name email phone')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalCount = await WithdrawalRequest.countDocuments(filter);

    // Calculate real-time statistics
    const stats = await WithdrawalRequest.aggregate([
      { $match: filter },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        processing: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        totalAmount: { $sum: '$amount' },
        totalNetAmount: { $sum: '$netAmount' }
      }}
    ]);

    const statsData = stats[0] || {
      total: 0, pending: 0, approved: 0, processing: 0, 
      completed: 0, rejected: 0, cancelled: 0, 
      totalAmount: 0, totalNetAmount: 0
    };

    // Format withdrawal requests
    const formattedRequests = withdrawalRequests.map(request => {
      const statusInfo = getStatusInfo(request.status);
      
      return {
        id: request._id,
        amount: request.amount,
        gst: request.gst,
        netAmount: request.netAmount,
        status: request.status,
        statusInfo,
        paymentMethod: request.paymentMethod,
        paymentDetails: request.paymentDetails,
        userId: {
          _id: request.userId._id,
          name: request.userId.name,
          phone: request.userId.phone
        },
        assignedManager: request.assignedManager ? {
          _id: request.assignedManager._id,
          name: request.assignedManager.name,
          email: request.assignedManager.email,
          phone: request.assignedManager.phone
        } : null,
        submittedAt: request.submittedAt,
        reviewedAt: request.reviewedAt,
        processedAt: request.processedAt,
        managerNotes: request.managerNotes,
        rejectionReason: request.rejectionReason,
        canCancel: request.status === 'pending'
      };
    });

    return NextResponse.json({
      withdrawalRequests: formattedRequests,
      stats: statsData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      },
      message: 'Withdrawal requests fetched successfully from MongoDB'
    });

  } catch (error: any) {
    console.error('Fetch withdrawal requests error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch withdrawal requests' 
    }, { status: 500 });
  }
}

// Helper function to get status information
function getStatusInfo(status: string) {
  switch (status) {
    case 'pending':
      return {
        message: 'Under review by manager',
        estimatedTime: '24-48 hours',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100'
      };
    case 'under_review':
      return {
        message: 'Being reviewed by manager',
        estimatedTime: '12-24 hours',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      };
    case 'approved':
      return {
        message: 'Approved and will be processed soon',
        estimatedTime: '24 hours',
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      };
    case 'processing':
      return {
        message: 'Payment being processed',
        estimatedTime: '2-4 hours',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      };
    case 'completed':
      return {
        message: 'Payment completed successfully',
        estimatedTime: 'Completed',
        color: 'text-green-700',
        bgColor: 'bg-green-200'
      };
    case 'rejected':
      return {
        message: 'Request was rejected',
        estimatedTime: 'N/A',
        color: 'text-red-600',
        bgColor: 'bg-red-100'
      };
    case 'cancelled':
      return {
        message: 'Request was cancelled',
        estimatedTime: 'N/A',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100'
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
