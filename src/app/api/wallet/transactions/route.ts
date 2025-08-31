import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import WalletTransaction from '@/models/WalletTransaction';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
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

    // Fetch user's wallet transactions
    const transactions = await WalletTransaction.find({ 
      userId 
    }).sort({ createdAt: -1 }).limit(50);

    // Calculate summary
    const totalEarned = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalWithdrawn = Math.abs(transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));

    return NextResponse.json({
      transactions,
      summary: {
        totalEarned,
        totalWithdrawn,
        currentBalance: totalEarned - totalWithdrawn,
        totalTransactions: transactions.length
      }
    });

  } catch (error: any) {
    console.error('Fetch transactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
