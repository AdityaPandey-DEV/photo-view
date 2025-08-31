import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';

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
    
    // Check if manager exists
    const manager = await Manager.findById(managerId);
    if (!manager || !manager.isActive) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if Manager collection exists and has data
    const managerCount = await Manager.countDocuments();
    console.log(`Found ${managerCount} managers in database`);
    
    if (managerCount === 0) {
      return NextResponse.json({
        managers: [],
        message: 'No managers found in database. Use the setup button to create sample managers.',
        count: 0
      });
    }
    
    // Fetch real managers from MongoDB
    const managers = await Manager.find({})
      .populate('assignedVips', 'name phone vipLevel')
      .populate('assignedWithdrawals', 'amount status submittedAt')
      .sort({ createdAt: -1 });

    // Calculate real-time statistics for each manager
    const managersWithStats = await Promise.all(
      managers.map(async (manager) => {
        // Get real-time withdrawal statistics (simplified)
        let withdrawalStats = { totalProcessed: 0, totalAmount: 0, pendingCount: 0, approvedCount: 0 };
        
        try {
          const withdrawalStatsResult = await manager.constructor.db.collection('withdrawalrequests').aggregate([
            { $match: { assignedManager: manager._id } },
            { $group: {
              _id: null,
              totalProcessed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
              totalAmount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } },
              pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
              approvedCount: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } }
            }}
          ]).toArray();
          
          if (withdrawalStatsResult.length > 0) {
            withdrawalStats = withdrawalStatsResult[0];
          }
        } catch (aggError) {
          console.log(`Withdrawal aggregation error for manager ${manager._id}:`, aggError);
        }

        // Calculate monthly returns from assigned VIPs (simplified)
        let monthlyStats = { totalMonthlyReturns: 0, vipCount: 0 };
        
        try {
          const monthlyReturnsResult = await manager.constructor.db.collection('users').aggregate([
            { $match: { assignedManager: manager._id, vipLevel: { $exists: true, $ne: null } } },
            { $group: {
              _id: null,
              totalMonthlyReturns: { $sum: { $ifNull: ['$monthlyReturns', 0] } },
              vipCount: { $sum: 1 }
            }}
          ]).toArray();
          
          if (monthlyReturnsResult.length > 0) {
            monthlyStats = monthlyReturnsResult[0];
          }
        } catch (aggError) {
          console.log(`Monthly returns aggregation error for manager ${manager._id}:`, aggError);
        }

        return {
          _id: manager._id,
          name: manager.name,
          email: manager.email,
          phone: manager.phone,
          isActive: manager.isActive,
          maxVipCapacity: manager.maxVipCapacity,
          currentVipCount: manager.assignedVips.length,
          role: manager.role,
          permissions: manager.permissions,
          assignedVips: manager.assignedVips,
          assignedWithdrawals: manager.assignedWithdrawals,
          totalWithdrawalsProcessed: withdrawalStats.totalProcessed,
          totalAmountProcessed: withdrawalStats.totalAmount,
          pendingWithdrawals: withdrawalStats.pendingCount,
          approvedWithdrawals: withdrawalStats.approvedCount,
          monthlyReturns: monthlyStats.totalMonthlyReturns,
          vipCount: monthlyStats.vipCount,
          createdAt: manager.createdAt,
          updatedAt: manager.updatedAt
        };
      })
    );

    return NextResponse.json({
      managers: managersWithStats,
      message: 'Managers fetched successfully from MongoDB'
    });

  } catch (error: any) {
    console.error('Fetch managers error:', error);
    
    // More specific error messages
    if (error.name === 'ValidationError') {
      return NextResponse.json({ 
        error: 'Data validation error',
        details: error.message
      }, { status: 400 });
    }
    
    if (error.name === 'CastError') {
      return NextResponse.json({ 
        error: 'Invalid data format',
        details: error.message
      }, { status: 400 });
    }
    
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: 'Duplicate data found',
        details: error.message
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch managers',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
