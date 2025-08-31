import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';
import WithdrawalRequest from '@/models/WithdrawalRequest';
import Notification from '@/models/Notification';
import WalletTransaction from '@/models/WalletTransaction';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get('manager-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const managerId = decoded.managerId;
    
    const { withdrawalId, action, notes, rejectionReason } = await request.json();

    if (!withdrawalId || !action || !['approve', 'reject', 'process'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Get withdrawal request
    const withdrawalRequest = await WithdrawalRequest.findById(withdrawalId)
      .populate('userId', 'name phone')
      .populate('assignedManager', 'name');

    if (!withdrawalRequest) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });
    }

    // Check if manager has permission to review this withdrawal
    const manager = await Manager.findById(managerId);
    
    if (!manager || !manager.isActive) {
      return NextResponse.json({ error: 'Manager access denied' }, { status: 403 });
    }

    // Check if manager has withdrawal management permissions
    if (!manager.permissions.includes('manage_withdrawals')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // If it's a manager, check if they're assigned to this withdrawal
    if (manager && withdrawalRequest.assignedManager?.toString() !== managerId) {
      return NextResponse.json({ error: 'You can only review withdrawals assigned to you' }, { status: 403 });
    }

    if (action === 'approve') {
      // Approve withdrawal
      withdrawalRequest.status = 'approved';
      withdrawalRequest.reviewedAt = new Date();
      withdrawalRequest.managerNotes = notes || 'Approved by manager';
      
      await withdrawalRequest.save();

      // Send notification to user
      await Notification.create({
        userId: withdrawalRequest.userId._id,
        type: 'withdrawal_approved',
        title: 'Withdrawal Approved',
        message: `Your withdrawal request for ₹${withdrawalRequest.amount} has been approved and will be processed within 24 hours.`,
        relatedData: { 
          withdrawalId: withdrawalRequest._id.toString(), 
          amount: withdrawalRequest.amount, 
          netAmount: withdrawalRequest.netAmount 
        }
      });

      return NextResponse.json({
        message: 'Withdrawal request approved successfully',
        withdrawal: {
          id: withdrawalRequest._id,
          status: 'approved',
          reviewedAt: withdrawalRequest.reviewedAt,
          managerNotes: withdrawalRequest.managerNotes
        }
      });

    } else if (action === 'reject') {
      // Reject withdrawal
      if (!rejectionReason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }

      withdrawalRequest.status = 'rejected';
      withdrawalRequest.reviewedAt = new Date();
      withdrawalRequest.managerNotes = notes || 'Rejected by manager';
      withdrawalRequest.rejectionReason = rejectionReason;
      
      await withdrawalRequest.save();

      // Send notification to user
      await Notification.create({
        userId: withdrawalRequest.userId._id,
        type: 'withdrawal_rejected',
        title: 'Withdrawal Rejected',
        message: `Your withdrawal request for ₹${withdrawalRequest.amount} was rejected. Reason: ${rejectionReason}`,
        relatedData: { 
          withdrawalId: withdrawalRequest._id.toString(), 
          amount: withdrawalRequest.amount, 
          rejectionReason: rejectionReason 
        }
      });

      return NextResponse.json({
        message: 'Withdrawal request rejected successfully',
        withdrawal: {
          id: withdrawalRequest._id,
          status: 'rejected',
          reviewedAt: withdrawalRequest.reviewedAt,
          rejectionReason: withdrawalRequest.rejectionReason
        }
      });

    } else if (action === 'process') {
      // Process approved withdrawal
      if (withdrawalRequest.status !== 'approved') {
        return NextResponse.json({ error: 'Only approved withdrawals can be processed' }, { status: 400 });
      }

      withdrawalRequest.status = 'processing';
      withdrawalRequest.processedAt = new Date();
      
      await withdrawalRequest.save();

      // Send notification to user
      await Notification.create({
        userId: withdrawalRequest.userId._id,
        type: 'withdrawal_processing',
        title: 'Withdrawal Processing',
        message: `Your withdrawal of ₹${withdrawalRequest.amount} is now being processed.`,
        relatedData: { 
          withdrawalId: withdrawalRequest._id.toString(), 
          amount: withdrawalRequest.amount, 
          netAmount: withdrawalRequest.netAmount 
        }
      });

      // Simulate payment processing (in real implementation, this would integrate with payment gateways)
      // For now, we'll mark it as completed after a delay
      setTimeout(async () => {
        try {
          withdrawalRequest.status = 'completed';
          await withdrawalRequest.save();

          // Create wallet transaction for the withdrawal
          const transaction = new WalletTransaction({
            userId: withdrawalRequest.userId._id,
            type: 'withdrawal',
            amount: -withdrawalRequest.amount,
            description: `Withdrawal: ₹${withdrawalRequest.amount} (GST: ₹${withdrawalRequest.gst}, Net: ₹${withdrawalRequest.netAmount})`,
            balanceAfter: 0, // Will be calculated by balance API
            reference: `withdrawal_${withdrawalRequest._id}`,
            status: 'completed'
          });
          await transaction.save();

          // Send completion notification
          await Notification.create({
            userId: withdrawalRequest.userId._id,
            type: 'withdrawal_completed',
            title: 'Withdrawal Completed',
            message: `Your withdrawal of ₹${withdrawalRequest.amount} has been processed successfully. Net amount: ₹${withdrawalRequest.netAmount}`,
            relatedData: { 
              withdrawalId: withdrawalRequest._id.toString(), 
              amount: withdrawalRequest.amount, 
              netAmount: withdrawalRequest.netAmount 
            }
          });
        } catch (error) {
          console.error('Error completing withdrawal:', error);
        }
      }, 5000); // 5 second delay for demo

      return NextResponse.json({
        message: 'Withdrawal processing started successfully',
        withdrawal: {
          id: withdrawalRequest._id,
          status: 'processing',
          processedAt: withdrawalRequest.processedAt
        },
        note: 'Payment will be processed and completed automatically. User will be notified once completed.'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Withdrawal review error:', error);
    return NextResponse.json({ 
      error: 'Failed to process withdrawal review' 
    }, { status: 500 });
  }
}
