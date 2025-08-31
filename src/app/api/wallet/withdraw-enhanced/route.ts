import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Manager from '@/models/Manager';
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

    const { 
      amount, 
      paymentMethod, 
      paymentDetails 
    } = await request.json();

    // Validation
    if (!amount || amount < 350) {
      return NextResponse.json(
        { error: 'Minimum withdrawal amount is ₹350' },
        { status: 400 }
      );
    }

    if (!paymentMethod || !['UPI', 'BANK_TRANSFER'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Valid payment method required (UPI or BANK_TRANSFER)' },
        { status: 400 }
      );
    }

    // Validate payment details based on method
    if (paymentMethod === 'UPI' && (!paymentDetails?.upiId || paymentDetails.upiId.trim() === '')) {
      return NextResponse.json(
        { error: 'UPI ID is required for UPI transfers' },
        { status: 400 }
      );
    }

    if (paymentMethod === 'BANK_TRANSFER' && (
      !paymentDetails?.accountHolderName || 
      !paymentDetails?.bankAccount || 
      !paymentDetails?.ifscCode || 
      !paymentDetails?.bankName
    )) {
      return NextResponse.json(
        { error: 'All bank details are required for bank transfers' },
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

    // Check if user has VIP level (required for withdrawals)
    if (!user.vipLevel) {
      return NextResponse.json(
        { error: 'VIP subscription required for withdrawals' },
        { status: 400 }
      );
    }

    // Check if VIP has expired
    if (user.vipExpiryDate && new Date() > new Date(user.vipExpiryDate)) {
      return NextResponse.json(
        { error: 'VIP subscription has expired. Please renew to make withdrawals.' },
        { status: 400 }
      );
    }

    // Get real-time balance from transactions (using existing balance API logic)
    const { default: WalletTransaction } = await import('@/models/WalletTransaction');
    const allTransactions = await WalletTransaction.find({ userId }).sort({ createdAt: -1 });
    
    const totalEarned = allTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalSpent = Math.abs(allTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));
    
    const currentBalance = Math.max(0, totalEarned - totalSpent);

    // Check balance
    if (amount > currentBalance) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: ₹${currentBalance}` },
        { status: 400 }
      );
    }

    // Check withdrawal limits
    const withdrawalLimits = {
      daily: 5000,
      weekly: 20000,
      monthly: 50000
    };

    // Check daily limit
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const dailyWithdrawals = await WithdrawalRequest.find({
      userId,
      status: { $in: ['pending', 'under_review', 'approved', 'processing', 'completed'] },
      submittedAt: { $gte: startOfDay }
    });
    
    const dailyTotal = dailyWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    if (dailyTotal + amount > withdrawalLimits.daily) {
      return NextResponse.json(
        { error: `Daily withdrawal limit exceeded. Daily limit: ₹${withdrawalLimits.daily}, Already used: ₹${dailyTotal}` },
        { status: 400 }
      );
    }

    // Check weekly limit
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weeklyWithdrawals = await WithdrawalRequest.find({
      userId,
      status: { $in: ['pending', 'under_review', 'approved', 'processing', 'completed'] },
      submittedAt: { $gte: startOfWeek }
    });
    
    const weeklyTotal = weeklyWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    if (weeklyTotal + amount > withdrawalLimits.weekly) {
      return NextResponse.json(
        { error: `Weekly withdrawal limit exceeded. Weekly limit: ₹${withdrawalLimits.weekly}, Already used: ₹${weeklyTotal}` },
        { status: 400 }
      );
    }

    // Check monthly limit
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlyWithdrawals = await WithdrawalRequest.find({
      userId,
      status: { $in: ['pending', 'under_review', 'approved', 'processing', 'completed'] },
      submittedAt: { $gte: startOfMonth }
    });
    
    const monthlyTotal = monthlyWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    if (monthlyTotal + amount > withdrawalLimits.monthly) {
      return NextResponse.json(
        { error: `Monthly withdrawal limit exceeded. Monthly limit: ₹${withdrawalLimits.monthly}, Already used: ₹${monthlyTotal}` },
        { status: 400 }
      );
    }

    // Calculate GST and net amount
    const gst = amount * 0.10; // 10% GST
    const netAmount = amount - gst;

    // Find available manager (auto-assign)
    const availableManager = await Manager.findOne({
      isActive: true,
      currentVipCount: { $lt: 50 } // Max 50 VIPs per manager
    }).sort({ currentVipCount: 1 });

    if (!availableManager) {
      return NextResponse.json(
        { error: 'No managers available. Please try again later.' },
        { status: 503 }
      );
    }

    // Create withdrawal request
    const withdrawalRequest = new WithdrawalRequest({
      userId: user._id,
      amount,
      gst,
      netAmount,
      status: 'pending',
      assignedManager: availableManager._id,
      paymentMethod,
      paymentDetails,
      submittedAt: new Date()
    });

    await withdrawalRequest.save();

    // Create notification for user
    await Notification.create({
      userId: user._id,
      type: 'withdrawal_submitted',
      title: 'Withdrawal Request Submitted',
      message: `Your withdrawal request for ₹${amount} has been submitted and is under review. You will be notified once it's processed.`,
      relatedData: {
        withdrawalId: withdrawalRequest._id.toString(),
        amount: amount,
        netAmount: netAmount
      }
    });

    // Create notification for manager
    await Notification.create({
      userId: availableManager._id, // Manager will receive notification
      type: 'withdrawal_assigned',
      title: 'New Withdrawal Request Assigned',
      message: `You have been assigned a new withdrawal request for ₹${amount} from ${user.name}.`,
      relatedData: {
        withdrawalId: withdrawalRequest._id.toString(),
        userId: user._id.toString(),
        userName: user.name,
        amount: amount
      }
    });

    return NextResponse.json({
      message: 'Withdrawal request submitted successfully and assigned to manager for review',
      withdrawal: {
        id: withdrawalRequest._id,
        amount: amount,
        gst: gst,
        netAmount: netAmount,
        status: 'pending',
        assignedManager: availableManager.name,
        submittedAt: withdrawalRequest.submittedAt,
        estimatedProcessingTime: '24-48 hours'
      },
      note: 'Your withdrawal will be reviewed by a manager and processed within 24-48 hours after approval.'
    });

  } catch (error: any) {
    console.error('Enhanced withdrawal error:', error);
    return NextResponse.json(
      { error: 'Failed to submit withdrawal request' },
      { status: 500 }
    );
  }
}
