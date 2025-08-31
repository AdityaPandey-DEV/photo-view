import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Withdrawal from '@/models/Withdrawal';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Create sample withdrawal requests for testing
    const vipUsers = await User.find({ 
      $or: [
        { vipLevel: { $exists: true, $ne: null } },
        { vipStatus: { $in: ['active', 'VIP1', 'VIP2', 'VIP3'] } }
      ]
    }).limit(5);

    console.log('🔍 VIP Users found:', vipUsers.length);
    console.log('📋 VIP Users:', vipUsers.map(u => ({ id: u._id, name: u.name, vipLevel: u.vipLevel })));

    if (vipUsers.length === 0) {
      // Let's check what users exist to debug
      const allUsers = await User.find({}).limit(10);
      console.log('🔍 All users found:', allUsers.length);
      console.log('📋 Sample users:', allUsers.map(u => ({ id: u._id, name: u.name, vipLevel: u.vipLevel, hasVipLevel: !!u.vipLevel })));
      
      return NextResponse.json({ 
        error: 'No VIP users found. Please create VIP users first.',
        debug: {
          totalUsers: allUsers.length,
          usersWithVipLevel: allUsers.filter(u => u.vipLevel).length,
          sampleUsers: allUsers.slice(0, 5).map(u => ({ name: u.name, vipLevel: u.vipLevel }))
        }
      }, { status: 400 });
    }

    // Create sample withdrawals
    const sampleWithdrawals = [];
    const statuses = ['pending', 'approved', 'rejected', 'paid'];
    const paymentMethods = ['UPI', 'BANK'];

    for (let i = 0; i < 5; i++) {
      const user = vipUsers[i % vipUsers.length];
      const status = statuses[i % statuses.length];
      const paymentMethod = paymentMethods[i % paymentMethods.length];
      const amount = 1000 + (i * 500); // Different amounts for variety

      const withdrawal = new Withdrawal({
        userId: user._id,
        userName: user.name,
        userPhone: user.phone,
        amount,
        paymentMethod,
        paymentDetails: paymentMethod === 'UPI' ? {
          upiId: `user${i + 1}@upi`
        } : {
          bankAccount: `123456789${i}`,
          ifscCode: 'SBIN0001234',
          accountHolderName: user.name,
          bankName: 'State Bank of India'
        },
        status,
        submittedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Different dates
        processedAt: status === 'paid' ? new Date() : undefined,
        managerNotes: status !== 'pending' ? `Sample ${status} withdrawal` : undefined
      });

      await withdrawal.save();
      sampleWithdrawals.push(withdrawal);
    }

    return NextResponse.json({
      message: 'Sample withdrawals created successfully',
      created: sampleWithdrawals.length,
      withdrawals: sampleWithdrawals.map(w => ({
        id: w._id,
        amount: w.amount,
        status: w.status,
        userId: w.userId,
        paymentMethod: w.paymentMethod,
        paymentDetails: w.paymentDetails
      }))
    });

  } catch (error: any) {
    console.error('Create sample withdrawals error:', error);
    return NextResponse.json({ 
      error: 'Failed to create sample withdrawals',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
