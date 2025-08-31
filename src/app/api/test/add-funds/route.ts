import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import WalletTransaction from '@/models/WalletTransaction';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { phone, amount, description } = await request.json();

    if (!phone || !amount) {
      return NextResponse.json(
        { error: 'Phone number and amount are required' },
        { status: 400 }
      );
    }

    // Find user by phone number
    const user = await User.findOne({ phone });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found with this phone number' },
        { status: 404 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Create a test transaction to add funds
    const transaction = new WalletTransaction({
      userId: user._id,
      type: 'task_completion', // Using task_completion to add positive balance
      amount: amount,
      description: description || `Test funds added: ₹${amount}`,
      balanceAfter: 0, // Will be calculated by balance API
      reference: `test_funds_${Date.now()}`,
      status: 'completed'
    });

    await transaction.save();

    // Get current balance after adding funds
    const allTransactions = await WalletTransaction.find({ userId: user._id }).sort({ createdAt: -1 });
    
    const totalEarned = allTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalSpent = Math.abs(allTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));
    
    const currentBalance = Math.max(0, totalEarned - totalSpent);

    return NextResponse.json({
      message: `Successfully added ₹${amount} to ${user.name}'s account`,
      user: {
        name: user.name,
        phone: user.phone,
        vipLevel: user.vipLevel || 'No VIP'
      },
      transaction: {
        id: transaction._id,
        amount: amount,
        type: 'task_completion',
        description: transaction.description,
        createdAt: transaction.createdAt
      },
      balance: {
        previous: Math.max(0, currentBalance - amount),
        added: amount,
        current: currentBalance
      },
      note: 'Funds added successfully. You can now test the withdrawal system.'
    });

  } catch (error: any) {
    console.error('Add funds error:', error);
    return NextResponse.json(
      { error: 'Failed to add funds' },
      { status: 500 }
    );
  }
}
