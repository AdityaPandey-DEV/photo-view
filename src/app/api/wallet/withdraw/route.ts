import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import WalletTransaction from '@/models/WalletTransaction';

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

    const { amount } = await request.json();

    // Validation
    if (!amount || amount < 350) {
      return NextResponse.json(
        { error: 'Minimum withdrawal amount is ₹350' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check balance
    if (amount > user.totalEarnings) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Calculate GST and net amount
    const gst = amount * 0.10; // 10% GST
    const netAmount = amount - gst;

    // DO NOT update user.totalEarnings in memory - calculate from transactions
    // user.totalEarnings -= amount;  // ❌ REMOVED - Dangerous memory storage
    // await user.save();             // ❌ REMOVED - No need to save user
    
    // Balance is calculated real-time from transactions in the balance API
    
    // Record withdrawal transaction
    const transaction = new WalletTransaction({
      userId: user._id,
      type: 'withdrawal',
      amount: -amount, // Negative amount for withdrawal
      description: `Withdrawal: ₹${amount} (GST: ₹${gst}, Net: ₹${netAmount})`,
      balanceAfter: user.totalEarnings,
      reference: `withdrawal_${Date.now()}`
    });
    await transaction.save();

    return NextResponse.json({
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        amount: amount,
        gst: gst,
        netAmount: netAmount,
        timestamp: new Date(),
        status: 'pending'
      },
      note: 'Balance updated in database. Use /api/wallet/balance for real-time balance.'
    });

  } catch (error: any) {
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
}
