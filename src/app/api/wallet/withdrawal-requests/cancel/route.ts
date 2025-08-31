import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import WithdrawalRequest from '@/models/WithdrawalRequest';
import Notification from '@/models/Notification';

export async function POST(request: NextRequest) {
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

    const { withdrawalId } = await request.json();

    if (!withdrawalId) {
      return NextResponse.json(
        { error: 'Withdrawal ID is required' },
        { status: 400 }
      );
    }

    // Find withdrawal request
    const withdrawalRequest = await WithdrawalRequest.findById(withdrawalId);

    if (!withdrawalRequest) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    // Check if user owns this withdrawal request
    if (withdrawalRequest.userId.toString() !== userId) {
      return NextResponse.json(
        { error: 'You can only cancel your own withdrawal requests' },
        { status: 403 }
      );
    }

    // Check if withdrawal can be cancelled (only pending requests)
    if (withdrawalRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot cancel withdrawal with status: ${withdrawalRequest.status}` },
        { status: 400 }
      );
    }

    // Update withdrawal status to cancelled
    withdrawalRequest.status = 'cancelled';
    await withdrawalRequest.save();

    // Create notification for user
    await Notification.create({
      userId: withdrawalRequest.userId,
      type: 'withdrawal_cancelled',
      title: 'Withdrawal Request Cancelled',
      message: `Your withdrawal request for ₹${withdrawalRequest.amount} has been cancelled successfully.`,
      relatedData: {
        withdrawalId: withdrawalRequest._id.toString(),
        amount: withdrawalRequest.amount
      }
    });

    // If there's an assigned manager, notify them
    if (withdrawalRequest.assignedManager) {
      await Notification.create({
        userId: withdrawalRequest.assignedManager,
        type: 'withdrawal_cancelled',
        title: 'Withdrawal Request Cancelled by User',
        message: `A withdrawal request for ₹${withdrawalRequest.amount} has been cancelled by the user.`,
        relatedData: {
          withdrawalId: withdrawalRequest._id.toString(),
          amount: withdrawalRequest.amount
        }
      });
    }

    return NextResponse.json({
      message: 'Withdrawal request cancelled successfully',
      withdrawal: {
        id: withdrawalRequest._id,
        status: 'cancelled',
        amount: withdrawalRequest.amount
      }
    });

  } catch (error: any) {
    console.error('Cancel withdrawal request error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel withdrawal request' },
      { status: 500 }
    );
  }
}
