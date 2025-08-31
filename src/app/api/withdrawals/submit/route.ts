import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Withdrawal from '@/models/Withdrawal';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Get user token
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify user
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is VIP
    if (!user.vipLevel) {
      return NextResponse.json({ error: 'Only VIP users can submit withdrawal requests' }, { status: 403 });
    }

    const { amount, paymentMethod, paymentDetails } = await request.json();

    // Validate amount
    if (!amount || amount < 350) {
      return NextResponse.json({ error: 'Minimum withdrawal amount is ₹350' }, { status: 400 });
    }

    // Validate payment details based on method
    if (paymentMethod === 'UPI') {
      if (!paymentDetails.upiId) {
        return NextResponse.json({ error: 'UPI ID is required' }, { status: 400 });
      }
    } else if (paymentMethod === 'BANK') {
      if (!paymentDetails.bankAccount || !paymentDetails.ifscCode || 
          !paymentDetails.accountHolderName || !paymentDetails.bankName) {
        return NextResponse.json({ error: 'All bank details are required' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    // Create withdrawal request
    const withdrawal = new Withdrawal({
      userId,
      userName: user.name,
      userPhone: user.phone,
      amount,
      paymentMethod,
      paymentDetails,
      status: 'pending',
      submittedAt: new Date()
    });

    await withdrawal.save();

    return NextResponse.json({
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        submittedAt: withdrawal.submittedAt
      }
    });

  } catch (error: any) {
    console.error('Submit withdrawal error:', error);
    return NextResponse.json({ 
      error: 'Failed to submit withdrawal request' 
    }, { status: 500 });
  }
}
