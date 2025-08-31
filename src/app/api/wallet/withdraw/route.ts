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

    // Get real-time balance from transactions (NO MEMORY STORAGE)
    const allTransactions = await WalletTransaction.find({ userId }).sort({ createdAt: -1 });
    
    const totalEarned = allTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalSpent = Math.abs(allTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));
    
    const currentBalance = Math.max(0, totalEarned - totalSpent);

    // Debug logging
    console.log(`Withdrawal request for user ${userId}:`);
    console.log(`- Requested amount: ₹${amount}`);
    console.log(`- Total earned: ₹${totalEarned}`);
    console.log(`- Total spent: ₹${totalSpent}`);
    console.log(`- Current balance: ₹${currentBalance}`);
    console.log(`- Transactions found: ${allTransactions.length}`);

    // Check balance
    if (amount > currentBalance) {
      console.log(`❌ Insufficient balance: requested ₹${amount}, available ₹${currentBalance}`);
      return NextResponse.json(
        { error: `Insufficient balance. Available: ₹${currentBalance}` },
        { status: 400 }
      );
    }

    // Calculate GST and net amount
    const gst = amount * 0.10; // 10% GST
    const netAmount = amount - gst;

    // DO NOT update user.totalEarnings in memory - calculate from transactions
    // Balance is calculated real-time from transactions in the balance API
    
    // Record withdrawal transaction
    const transaction = new WalletTransaction({
      userId: user._id,
      type: 'withdrawal',
      amount: -amount, // Negative amount for withdrawal
      description: `Withdrawal: ₹${amount} (GST: ₹${gst}, Net: ₹${netAmount})`,
      balanceAfter: currentBalance - amount, // Calculate balance after withdrawal
      reference: `withdrawal_${Date.now()}`
    });
    
    console.log(`Creating withdrawal transaction:`);
    console.log(`- User ID: ${user._id}`);
    console.log(`- Amount: -₹${amount}`);
    console.log(`- Balance after: ₹${currentBalance - amount}`);
    console.log(`- Reference: ${transaction.reference}`);
    
    await transaction.save();
    console.log(`✅ Withdrawal transaction saved successfully with ID: ${transaction._id}`);

    return NextResponse.json({
      message: 'Withdrawal processed successfully',
      withdrawal: {
        amount: amount,
        gst: gst,
        netAmount: netAmount,
        timestamp: new Date(),
        status: 'completed',
        balanceBefore: currentBalance,
        balanceAfter: currentBalance - amount
      },
      note: 'Withdrawal completed. Balance updated in database. Use /api/wallet/balance for real-time balance.'
    });

  } catch (error: any) {
    console.error('Withdrawal error:', error);
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Invalid withdrawal data. Please check your request.' },
        { status: 400 }
      );
    }
    
    if (error.message && error.message.includes('Insufficient balance')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process withdrawal. Please try again.' },
      { status: 500 }
    );
  }
}
