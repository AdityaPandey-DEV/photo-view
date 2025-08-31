import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import WalletTransaction from '@/models/WalletTransaction';
import User from '@/models/User';

export async function GET(request: NextRequest) {
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

    // Find user for VIP level and basic info
    const user = await User.findById(userId).select('vipLevel subscriptionDate monthlyReturns vipStatus vipExpiryDate walletBalance');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if VIP has expired and update status if needed
    if (user.vipExpiryDate && new Date() > new Date(user.vipExpiryDate)) {
      // VIP has expired - update user status
      await User.findByIdAndUpdate(userId, {
        vipStatus: 'expired',
        vipLevel: undefined,
        monthlyReturns: 0
      });
      
      // Update local user object
      user.vipLevel = undefined;
      user.vipStatus = 'expired';
      user.monthlyReturns = 0;
      
      console.log(`VIP expired for user ${userId} - status updated in balance API`);
    }

    // Calculate real-time balance from transactions (NO CACHING)
    const allTransactions = await WalletTransaction.find({ userId }).sort({ createdAt: -1 });

    // Calculate earnings by transaction type (positive amounts only)
    const earningsByType = {
      task_completion: allTransactions
        .filter(t => t.type === 'task_completion' && t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0),
      monthly_return: allTransactions
        .filter(t => t.type === 'monthly_return' && t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0),
      vip_subscription: allTransactions
        .filter(t => t.type === 'vip_subscription' && t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0)
    };

    // Calculate total earned (all positive amounts)
    const totalEarned = Object.values(earningsByType).reduce((sum, amount) => sum + amount, 0);

    // Calculate spending by transaction type (negative amounts only)
    const spendingByType = {
      withdrawal: Math.abs(allTransactions
        .filter(t => t.type === 'withdrawal' && t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)),
      vip_subscription: Math.abs(allTransactions
        .filter(t => t.type === 'vip_subscription' && t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0))
    };

    // Calculate total spent (all negative amounts)
    const totalSpent = Object.values(spendingByType).reduce((sum, amount) => sum + amount, 0);

    // Calculate current balance (never below 0)
    let currentBalance = totalEarned - totalSpent;
    
    // Also check User.walletBalance field for consistency
    if (user.walletBalance !== undefined) {
      // Use the higher of the two balances to ensure consistency
      const calculatedBalance = Math.max(currentBalance, user.walletBalance);
      if (calculatedBalance !== currentBalance) {
        console.log(`User ${userId} walletBalance (${user.walletBalance}) differs from calculated (${currentBalance}), using higher value`);
        currentBalance = calculatedBalance;
      }
    }
    
    // Ensure balance never goes below 0
    if (currentBalance < 0) {
      console.warn(`User ${userId} has negative balance: ${currentBalance}, setting to 0`);
      console.warn(`Debug: totalEarned=${totalEarned}, totalSpent=${totalSpent}`);
      console.warn(`Debug: earningsByType=`, earningsByType);
      console.warn(`Debug: spendingByType=`, spendingByType);
      currentBalance = 0;
    }

    // Log balance calculation for debugging
    console.log(`Balance calculation for user ${userId}:`);
    console.log(`- Total Earned: ₹${totalEarned}`);
    console.log(`- Total Spent: ₹${totalSpent}`);
    console.log(`- Current Balance: ₹${currentBalance}`);

    // Calculate today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTransactions = allTransactions.filter(t => 
      t.createdAt >= today && t.createdAt < tomorrow && t.amount > 0
    );

    const todayEarnings = todayTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Calculate this month's earnings
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisMonthTransactions = allTransactions.filter(t => 
      t.createdAt >= thisMonth && t.amount > 0
    );

    const thisMonthEarnings = thisMonthTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Get transaction summary by type
    const transactionSummary = {
      task_completion: allTransactions.filter(t => t.type === 'task_completion').length,
      withdrawal: allTransactions.filter(t => t.type === 'withdrawal').length,
      vip_subscription: allTransactions.filter(t => t.type === 'vip_subscription').length,
      monthly_return: allTransactions.filter(t => t.type === 'monthly_return').length
    };

    // Get recent transactions (last 10)
    const recentTransactions = allTransactions.slice(0, 10);

    return NextResponse.json({
      success: true,
      balance: {
        current: currentBalance,
        totalEarned: totalEarned,
        totalSpent: totalSpent
      },
      earnings: {
        today: todayEarnings,
        thisMonth: thisMonthEarnings,
        total: totalEarned,
        breakdown: earningsByType
      },
      spending: {
        total: totalSpent,
        breakdown: spendingByType
      },
      user: {
        vipLevel: user.vipLevel,
        subscriptionDate: user.subscriptionDate,
        monthlyReturns: user.monthlyReturns
      },
      transactions: {
        summary: transactionSummary,
        recent: recentTransactions,
        total: allTransactions.length
      },
      lastUpdated: new Date().toISOString(),
      note: 'All calculations are real-time from MongoDB transactions - no caching used'
    });

  } catch (error: any) {
    console.error('Balance calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate balance' },
      { status: 500 }
    );
  }
}
