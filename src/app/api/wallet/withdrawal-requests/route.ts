import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import WithdrawalRequest from '@/models/WithdrawalRequest';

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

    // Get user's withdrawal requests
    const withdrawalRequests = await WithdrawalRequest.find({ userId })
      .populate('assignedManager', 'name email phone')
      .sort({ submittedAt: -1 });

    // Calculate withdrawal statistics
    const stats = {
      total: withdrawalRequests.length,
      pending: withdrawalRequests.filter(w => w.status === 'pending').length,
      approved: withdrawalRequests.filter(w => w.status === 'approved').length,
      processing: withdrawalRequests.filter(w => w.status === 'processing').length,
      completed: withdrawalRequests.filter(w => w.status === 'completed').length,
      rejected: withdrawalRequests.filter(w => w.status === 'rejected').length,
      cancelled: withdrawalRequests.filter(w => w.status === 'cancelled').length,
      totalAmount: withdrawalRequests.reduce((sum, w) => sum + w.amount, 0),
      totalNetAmount: withdrawalRequests.reduce((sum, w) => sum + w.netAmount, 0)
    };

    // Format withdrawal requests for frontend
    const formattedRequests = withdrawalRequests.map(request => ({
      id: request._id,
      amount: request.amount,
      gst: request.gst,
      netAmount: request.netAmount,
      status: request.status,
      paymentMethod: request.paymentMethod,
      paymentDetails: request.paymentDetails,
      submittedAt: request.submittedAt,
      reviewedAt: request.reviewedAt,
      processedAt: request.processedAt,
      managerNotes: request.managerNotes,
      rejectionReason: request.rejectionReason,
      assignedManager: request.assignedManager ? {
        id: request.assignedManager._id,
        name: request.assignedManager.name,
        email: request.assignedManager.email,
        phone: request.assignedManager.phone
      } : null,
      // Status-specific information
      statusInfo: getStatusInfo(request.status, request.submittedAt, request.reviewedAt, request.processedAt)
    }));

    return NextResponse.json({
      withdrawalRequests: formattedRequests,
      stats,
      message: 'Withdrawal requests fetched successfully'
    });

  } catch (error: any) {
    console.error('Fetch withdrawal requests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawal requests' },
      { status: 500 }
    );
  }
}

// Helper function to get status-specific information
function getStatusInfo(status: string, submittedAt: Date, reviewedAt?: Date, processedAt?: Date) {
  const now = new Date();
  const submitted = new Date(submittedAt);
  
  switch (status) {
    case 'pending':
      const pendingHours = Math.floor((now.getTime() - submitted.getTime()) / (1000 * 60 * 60));
      return {
        message: 'Your withdrawal request is under review by a manager',
        estimatedTime: '24-48 hours',
        timeSinceSubmitted: pendingHours > 0 ? `${pendingHours} hours ago` : 'Just submitted',
        canCancel: true
      };
    
    case 'under_review':
      return {
        message: 'Your withdrawal request is being reviewed by a manager',
        estimatedTime: '2-4 hours',
        timeSinceSubmitted: 'Under review',
        canCancel: false
      };
    
    case 'approved':
      const approvedHours = reviewedAt ? Math.floor((now.getTime() - new Date(reviewedAt).getTime()) / (1000 * 60 * 60)) : 0;
      return {
        message: 'Your withdrawal request has been approved and will be processed soon',
        estimatedTime: '24 hours',
        timeSinceSubmitted: approvedHours > 0 ? `Approved ${approvedHours} hours ago` : 'Just approved',
        canCancel: false
      };
    
    case 'processing':
      const processingHours = processedAt ? Math.floor((now.getTime() - new Date(processedAt).getTime()) / (1000 * 60 * 60)) : 0;
      return {
        message: 'Your withdrawal is being processed and will be completed soon',
        estimatedTime: '2-4 hours',
        timeSinceSubmitted: processingHours > 0 ? `Processing for ${processingHours} hours` : 'Just started processing',
        canCancel: false
      };
    
    case 'completed':
      const completedHours = processedAt ? Math.floor((now.getTime() - new Date(processedAt).getTime()) / (1000 * 60 * 60)) : 0;
      return {
        message: 'Your withdrawal has been completed successfully',
        estimatedTime: 'Completed',
        timeSinceSubmitted: completedHours > 0 ? `Completed ${completedHours} hours ago` : 'Just completed',
        canCancel: false
      };
    
    case 'rejected':
      return {
        message: 'Your withdrawal request was rejected',
        estimatedTime: 'Rejected',
        timeSinceSubmitted: 'Request rejected',
        canCancel: false
      };
    
    case 'cancelled':
      return {
        message: 'Your withdrawal request was cancelled',
        estimatedTime: 'Cancelled',
        timeSinceSubmitted: 'Request cancelled',
        canCancel: false
      };
    
    default:
      return {
        message: 'Unknown status',
        estimatedTime: 'Unknown',
        timeSinceSubmitted: 'Unknown',
        canCancel: false
      };
  }
}
