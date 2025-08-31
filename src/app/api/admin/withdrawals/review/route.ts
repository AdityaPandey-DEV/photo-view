import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';
import Withdrawal from '@/models/Withdrawal';
import Notification from '@/models/Notification';

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

    console.log('🔍 Withdrawal review request:', { withdrawalId, action, notes, rejectionReason });

    // Validate required fields
    if (!withdrawalId) {
      return NextResponse.json({ error: 'Withdrawal ID is required' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // Validate action type
    if (!['approve', 'reject', 'mark-paid'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be one of: approve, reject, mark-paid' 
      }, { status: 400 });
    }

    // Validate rejection reason if action is reject
    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json({ 
        error: 'Rejection reason is required when rejecting a withdrawal' 
      }, { status: 400 });
    }

    // Get withdrawal request
    const withdrawal = await Withdrawal.findById(withdrawalId)
      .populate('userId', 'name phone');

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });
    }

    console.log('✅ Withdrawal found:', { id: withdrawal._id, status: withdrawal.status });

    // Check if manager has permission to review this withdrawal
    const manager = await Manager.findById(managerId);
    
    if (!manager || !manager.isActive) {
      return NextResponse.json({ error: 'Manager access denied' }, { status: 403 });
    }

    // Check if manager has withdrawal management permissions
    if (!manager.permissions.includes('manage_withdrawals')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    console.log('✅ Manager authorized:', { id: manager._id, name: manager.name });

    if (action === 'approve') {
      // Approve withdrawal
      withdrawal.status = 'approved';
      withdrawal.managerNotes = notes || 'Approved by manager';
      
      await withdrawal.save();

      // Send notification to user
      await Notification.create({
        userId: withdrawal.userId._id,
        type: 'withdrawal_approved',
        title: 'Withdrawal Approved',
        message: `Your withdrawal request for ₹${withdrawal.amount} has been approved and will be processed within 24 hours.`,
        relatedData: { 
          withdrawalId: withdrawal._id.toString(), 
          amount: withdrawal.amount
        }
      });

      return NextResponse.json({
        message: 'Withdrawal request approved successfully',
        withdrawal: {
          id: withdrawal._id,
          status: 'approved',
          managerNotes: withdrawal.managerNotes
        }
      });

    } else if (action === 'reject') {
      // Reject withdrawal
      withdrawal.status = 'rejected';
      withdrawal.managerNotes = notes || 'Rejected by manager';
      
      await withdrawal.save();

      // Send notification to user
      await Notification.create({
        userId: withdrawal.userId._id,
        type: 'withdrawal_rejected',
        title: 'Withdrawal Rejected',
        message: `Your withdrawal request for ₹${withdrawal.amount} was rejected. Reason: ${rejectionReason}`,
        relatedData: { 
          withdrawalId: withdrawal._id.toString(), 
          amount: withdrawal.amount, 
          rejectionReason: rejectionReason 
        }
      });

      return NextResponse.json({
        message: 'Withdrawal request rejected successfully',
        withdrawal: {
          id: withdrawal._id,
          status: 'rejected',
          managerNotes: withdrawal.managerNotes
        }
      });

    } else if (action === 'mark-paid') {
      // Mark withdrawal as paid
      if (withdrawal.status !== 'approved') {
        return NextResponse.json({ error: 'Only approved withdrawals can be marked as paid' }, { status: 400 });
      }

      withdrawal.status = 'paid';
      withdrawal.processedAt = new Date();
      withdrawal.managerNotes = notes || 'Payment completed by manager';
      
      await withdrawal.save();

      // Send notification to user
      await Notification.create({
        userId: withdrawal.userId._id,
        type: 'withdrawal_paid',
        title: 'Payment Completed',
        message: `Your withdrawal of ₹${withdrawal.amount} has been processed and payment completed.`,
        relatedData: { 
          withdrawalId: withdrawal._id.toString(), 
          amount: withdrawal.amount
        }
      });

      return NextResponse.json({
        message: 'Withdrawal marked as paid successfully',
        withdrawal: {
          id: withdrawal._id,
          status: 'paid',
          processedAt: withdrawal.processedAt,
          managerNotes: withdrawal.managerNotes
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Withdrawal review error:', error);
    return NextResponse.json({ 
      error: 'Failed to process withdrawal review',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
