import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Manager from '@/models/Manager';
import WithdrawalRequest from '@/models/WithdrawalRequest';
import Notification from '@/models/Notification';
import WalletTransaction from '@/models/WalletTransaction';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get admin/manager token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if it's an admin or manager
    let manager = null;
    let admin = null;
    
    if (decoded.managerId) {
      manager = await Manager.findById(decoded.managerId);
      if (!manager || !manager.isActive) {
        return NextResponse.json(
          { error: 'Manager access denied' },
          { status: 403 }
        );
      }
    } else if (decoded.adminId) {
      admin = await Admin.findById(decoded.adminId);
      if (!admin || !admin.isActive) {
        return NextResponse.json(
          { error: 'Admin access denied' },
          { status: 403 }
        );
      }
      
      // Check if admin has permission to manage withdrawals
      if (!admin.permissions.includes('manage_withdrawals')) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { 
      withdrawalId, 
      action, 
      notes, 
      rejectionReason 
    } = await request.json();

    if (!withdrawalId || !action) {
      return NextResponse.json(
        { error: 'Withdrawal ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'process'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use approve, reject, or process' },
        { status: 400 }
      );
    }

    // Find withdrawal request
    const withdrawalRequest = await WithdrawalRequest.findById(withdrawalId)
      .populate('userId', 'name phone')
      .populate('assignedManager', 'name');

    if (!withdrawalRequest) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    // If it's a manager, check if they're assigned to this withdrawal
    if (manager && withdrawalRequest.assignedManager.toString() !== manager._id.toString()) {
      return NextResponse.json(
        { error: 'You are not assigned to this withdrawal request' },
        { status: 403 }
      );
    }

    // Update withdrawal status based on action
    if (action === 'approve') {
      withdrawalRequest.status = 'approved';
      withdrawalRequest.reviewedAt = new Date();
      withdrawalRequest.managerNotes = notes || 'Approved by manager';
      
      await withdrawalRequest.save();

      // Create notification for user
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
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      withdrawalRequest.status = 'rejected';
      withdrawalRequest.reviewedAt = new Date();
      withdrawalRequest.managerNotes = notes || 'Rejected by manager';
      withdrawalRequest.rejectionReason = rejectionReason;
      
      await withdrawalRequest.save();

      // Create notification for user
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
      // Only approved withdrawals can be processed
      if (withdrawalRequest.status !== 'approved') {
        return NextResponse.json(
          { error: 'Only approved withdrawals can be processed' },
          { status: 400 }
        );
      }

      withdrawalRequest.status = 'processing';
      withdrawalRequest.processedAt = new Date();
      
      await withdrawalRequest.save();

      // Create notification for user
      await Notification.create({
        userId: withdrawalRequest.userId._id,
        type: 'withdrawal_processing',
        title: 'Withdrawal Processing',
        message: `Your withdrawal of ₹${withdrawalRequest.amount} is now being processed. You will receive the payment within 24-48 hours.`,
        relatedData: {
          withdrawalId: withdrawalRequest._id.toString(),
          amount: withdrawalRequest.amount,
          netAmount: withdrawalRequest.netAmount
        }
      });

      // Simulate payment processing (in real system, integrate with payment gateway)
      // For now, we'll mark it as completed after a delay
      setTimeout(async () => {
        try {
          await WithdrawalRequest.findByIdAndUpdate(withdrawalRequest._id, {
            status: 'completed'
          });

          // Create wallet transaction for the withdrawal
          await WalletTransaction.create({
            userId: withdrawalRequest.userId._id,
            type: 'withdrawal',
            amount: -withdrawalRequest.amount,
            description: `Withdrawal: ₹${withdrawalRequest.amount} (GST: ₹${withdrawalRequest.gst}, Net: ₹${withdrawalRequest.netAmount})`,
            balanceAfter: 0, // Will be calculated by balance API
            reference: `withdrawal_${withdrawalRequest._id}`,
            status: 'completed'
          });

          // Create notification for user
          await Notification.create({
            userId: withdrawalRequest.userId._id,
            type: 'withdrawal_completed',
            title: 'Withdrawal Completed',
            message: `Your withdrawal of ₹${withdrawalRequest.amount} has been processed successfully. Net amount ₹${withdrawalRequest.netAmount} has been sent to your ${withdrawalRequest.paymentMethod === 'UPI' ? 'UPI ID' : 'bank account'}.`,
            relatedData: {
              withdrawalId: withdrawalRequest._id.toString(),
              amount: withdrawalRequest.amount,
              netAmount: withdrawalRequest.netAmount,
              paymentMethod: withdrawalRequest.paymentMethod
            }
          });
        } catch (error) {
          console.error('Error completing withdrawal:', error);
        }
      }, 5000); // Simulate 5 second processing time

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

  } catch (error: any) {
    console.error('Withdrawal review error:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal review' },
      { status: 500 }
    );
  }
}
