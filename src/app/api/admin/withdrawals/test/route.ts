import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';
import WithdrawalRequest from '@/models/WithdrawalRequest';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const cookieStore = await cookies();
    const token = cookieStore.get('manager-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const managerId = decoded.managerId;
    
    // Check if manager exists and has permissions
    const manager = await Manager.findById(managerId);
    if (!manager || !manager.isActive) {
      return NextResponse.json({ error: 'Manager access denied' }, { status: 403 });
    }

    if (!manager.permissions.includes('manage_withdrawals')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check database collections and counts
    const withdrawalCount = await WithdrawalRequest.countDocuments();
    const userCount = await User.countDocuments();
    const managerCount = await Manager.countDocuments();

    // Get sample withdrawal requests
    const sampleWithdrawals = await WithdrawalRequest.find()
      .populate('userId', 'name phone')
      .populate('assignedManager', 'name email phone')
      .limit(5)
      .sort({ createdAt: -1 });

    // Get users with VIP status
    const vipUsers = await User.find({ 
      $or: [
        { vipLevel: { $exists: true, $ne: null } },
        { vipStatus: { $in: ['active', 'VIP1', 'VIP2', 'VIP3'] } }
      ]
    }).limit(5);

    // Get active managers
    const activeManagers = await Manager.find({ 
      isActive: true,
      permissions: { $in: ['manage_withdrawals'] }
    }).limit(5);

    return NextResponse.json({
      message: 'Database test successful',
      counts: {
        withdrawalRequests: withdrawalCount,
        users: userCount,
        managers: managerCount
      },
      sampleData: {
        withdrawalRequests: sampleWithdrawals.map(w => ({
          id: w._id,
          amount: w.amount,
          status: w.status,
          userId: w.userId,
          assignedManager: w.assignedManager,
          submittedAt: w.submittedAt
        })),
        vipUsers: vipUsers.map(u => ({
          id: u._id,
          name: u.name,
          vipLevel: u.vipLevel,
          vipStatus: u.vipStatus
        })),
        activeManagers: activeManagers.map(m => ({
          id: m._id,
          name: m.name,
          currentVipCount: m.currentVipCount,
          maxVipCapacity: m.maxVipCapacity,
          permissions: m.permissions
        }))
      },
      database: {
        name: 'photography-services',
        collections: ['withdrawalrequests', 'users', 'managers']
      }
    });

  } catch (error: any) {
    console.error('Withdrawal test API error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}

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
    
    // Check if manager exists and has permissions
    const manager = await Manager.findById(managerId);
    if (!manager || !manager.isActive) {
      return NextResponse.json({ error: 'Manager access denied' }, { status: 403 });
    }

    if (!manager.permissions.includes('manage_withdrawals')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Create sample withdrawal requests for testing
    const vipUsers = await User.find({ 
      $or: [
        { vipLevel: { $exists: true, $ne: null } },
        { vipStatus: { $in: ['active', 'VIP1', 'VIP2', 'VIP3'] } }
      ]
    }).limit(3);

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

    const activeManagers = await Manager.find({ 
      isActive: true,
      permissions: { $in: ['manage_withdrawals'] }
    }).limit(2);

    if (activeManagers.length === 0) {
      return NextResponse.json({ 
        error: 'No active managers found. Please create managers first.' 
      }, { status: 400 });
    }

    // Create sample withdrawal requests
    const sampleWithdrawals = [];
    const statuses = ['pending', 'approved', 'processing', 'completed', 'rejected'];
    const paymentMethods = ['UPI', 'BANK_TRANSFER'];

    for (let i = 0; i < 5; i++) {
      const user = vipUsers[i % vipUsers.length];
      const assignedManager = activeManagers[i % activeManagers.length];
      const status = statuses[i % statuses.length];
      const paymentMethod = paymentMethods[i % paymentMethods.length];
      const amount = 1000 + (i * 500); // Different amounts for variety
      const gst = Math.round(amount * 0.1);
      const netAmount = amount - gst;

      const withdrawalRequest = new WithdrawalRequest({
        userId: user._id,
        amount,
        gst,
        netAmount,
        status,
        assignedManager: assignedManager._id,
        paymentMethod,
        paymentDetails: paymentMethod === 'UPI' ? {
          upiId: `user${i + 1}@upi`
        } : {
          bankAccount: `123456789${i}`,
          ifscCode: 'SBIN0001234',
          accountHolderName: user.name,
          bankName: 'State Bank of India'
        },
        submittedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Different dates
        reviewedAt: status !== 'pending' ? new Date() : undefined,
        processedAt: status === 'completed' ? new Date() : undefined,
        managerNotes: status !== 'pending' ? `Sample ${status} withdrawal` : undefined,
        rejectionReason: status === 'rejected' ? 'Sample rejection for testing' : undefined
      });

      await withdrawalRequest.save();
      sampleWithdrawals.push(withdrawalRequest);

      // Update manager's assigned withdrawals
      await Manager.updateOne(
        { _id: assignedManager._id },
        { 
          $push: { assignedWithdrawals: withdrawalRequest._id },
          $inc: { totalWithdrawalsProcessed: 1, totalAmountProcessed: amount },
          $set: { updatedAt: new Date() }
        }
      );
    }

    return NextResponse.json({
      message: 'Sample withdrawal requests created successfully',
      created: sampleWithdrawals.length,
      withdrawalRequests: sampleWithdrawals.map(w => ({
        id: w._id,
        amount: w.amount,
        status: w.status,
        userId: w.userId,
        assignedManager: w.assignedManager
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
