import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Manager from '@/models/Manager';
import Notification from '@/models/Notification';
import { JwtPayload } from '@/types/jwt';
import { Manager as ManagerType, User as UserType } from '@/types/models';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get admin token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('manager-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify admin token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    if (!decoded || !decoded.managerId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Verify manager exists and is active
    const manager = await Manager.findById(decoded.managerId);
    if (!manager || !manager.isActive) {
      return NextResponse.json(
        { error: 'Manager access denied' },
        { status: 403 }
      );
    }

    // Check if manager has permission to view VIP stats
    if (!manager.permissions.includes('manage_vips')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get VIP assignment statistics
    const stats = await getVIPAssignmentStats();

    return NextResponse.json({
      message: 'VIP assignment statistics retrieved successfully',
      stats
    });

  } catch (error: unknown) {
    console.error('VIP stats error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve VIP statistics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get admin token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('manager-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify admin token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    if (!decoded || !decoded.managerId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Verify manager exists and is active
    const manager = await Manager.findById(decoded.managerId);
    if (!manager || !manager.isActive) {
      return NextResponse.json(
        { error: 'Manager access denied' },
        { status: 403 }
      );
    }

    // Check if manager has permission to manage VIPs
    if (!manager.permissions.includes('manage_vips')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const requestBody = await request.json();
    const { action, userId, managerId } = requestBody;

    // Validate action
    if (!action || !['auto-assign', 'manual-assign', 'redistribute'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use auto-assign, manual-assign, or redistribute' },
        { status: 400 }
      );
    }

    if (action === 'auto-assign') {
      // Auto-assign VIPs to managers with load balancing
      return await autoAssignVIPs();
    } else if (action === 'manual-assign') {
      // Manually assign a specific VIP to a specific manager
      if (!userId || !managerId) {
        return NextResponse.json(
          { error: 'User ID and Manager ID are required for manual assignment' },
          { status: 400 }
        );
      }
      
      // Validate ObjectId format
      if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(managerId)) {
        return NextResponse.json(
          { error: 'Invalid User ID or Manager ID format' },
          { status: 400 }
        );
      }
      
      return await manualAssignVIP(userId, managerId);
    } else if (action === 'redistribute') {
      // Redistribute VIPs when managers leave/join
      return await redistributeVIPs();
    }

  } catch (error: unknown) {
    console.error('VIP assignment error:', error);
    
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Auto-assign VIPs to managers with load balancing
async function autoAssignVIPs() {
  try {
    // Get all active managers with permissions
    const managers = await Manager.find({ 
      isActive: true,
      permissions: { $in: ['manage_vips'] }
    }).sort({ currentVipCount: 1 });
    
    if (managers.length === 0) {
      return NextResponse.json(
        { error: 'No active managers with VIP management permissions found. Please create managers first.' },
        { status: 400 }
      );
    }

    // Get all VIP users without managers
    const unassignedVIPs = await User.find({
      vipLevel: { $exists: true, $ne: null },
      vipStatus: 'active',
      $or: [
        { assignedManager: { $exists: false } },
        { assignedManager: null }
      ]
    });

    if (unassignedVIPs.length === 0) {
      return NextResponse.json(
        { message: 'All VIPs are already assigned to managers' },
        { status: 200 }
      );
    }

    let assignedCount = 0;
    const assignments = [];
    const bulkUserUpdates = [];
    const bulkManagerUpdates = [];
    const notifications = [];

    for (const vip of unassignedVIPs) {
      // Find manager with lowest VIP count and capacity
      const availableManager = managers.find(m => m.currentVipCount < m.maxVipCapacity);
      
      if (!availableManager) {
        // All managers are at capacity
        break;
      }

      // Prepare bulk updates
      bulkUserUpdates.push({
        updateOne: {
          filter: { _id: vip._id },
          update: { 
            $set: { 
              assignedManager: availableManager._id,
              updatedAt: new Date()
            }
          }
        }
      });

      bulkManagerUpdates.push({
        updateOne: {
          filter: { _id: availableManager._id },
          update: { 
            $push: { assignedVips: vip._id },
            $inc: { currentVipCount: 1 },
            $set: { updatedAt: new Date() }
          }
        }
      });

      // Prepare notification
      notifications.push({
        userId: vip._id,
        type: 'manager_change',
        title: 'Manager Assigned',
        message: `You have been assigned to manager ${availableManager.name}. They will handle your withdrawals and support.`,
        relatedData: {
          managerId: availableManager._id.toString(),
          managerName: availableManager.name
        },
        createdAt: new Date()
      });

      assignments.push({
        vipId: vip._id,
        vipName: vip.name,
        managerId: availableManager._id,
        managerName: availableManager.name
      });

      assignedCount++;
      
      // Update manager's current count for next iteration
      availableManager.currentVipCount++;
    }

    // Execute bulk operations
    if (bulkUserUpdates.length > 0) {
      await User.bulkWrite(bulkUserUpdates);
    }
    
    if (bulkManagerUpdates.length > 0) {
      await Manager.bulkWrite(bulkManagerUpdates);
    }

    // Create notifications in bulk
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return NextResponse.json({
      message: `Successfully assigned ${assignedCount} VIPs to managers`,
      assignments,
      totalAssigned: assignedCount,
      remainingUnassigned: unassignedVIPs.length - assignedCount
    });

  } catch (error) {
    console.error('Auto-assign error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-assign VIPs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Manually assign a specific VIP to a specific manager
async function manualAssignVIP(userId: string, managerId: string) {
  try {
    // Verify user exists and is a VIP
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.vipLevel) {
      return NextResponse.json(
        { error: 'User is not a VIP' },
        { status: 400 }
      );
    }

    // Verify manager exists and is active
    const manager = await Manager.findById(managerId);
    if (!manager || !manager.isActive) {
      return NextResponse.json(
        { error: 'Manager not found or inactive' },
        { status: 404 }
      );
    }

    // Check if manager has capacity
    if (manager.currentVipCount >= manager.maxVipCapacity) {
      return NextResponse.json(
        { error: 'Manager is at maximum capacity' },
        { status: 400 }
      );
    }

    // Remove VIP from previous manager if any
    if (user.assignedManager) {
      await Manager.updateOne(
        { _id: user.assignedManager },
        { 
          $pull: { assignedVips: user._id },
          $inc: { currentVipCount: -1 },
          $set: { updatedAt: new Date() }
        }
      );
    }

    // Assign VIP to new manager
    await User.updateOne(
      { _id: user._id },
      { 
        $set: { 
          assignedManager: manager._id,
          updatedAt: new Date()
        }
      }
    );

    // Update manager's VIP list
    await Manager.updateOne(
      { _id: manager._id },
      { 
        $addToSet: { assignedVips: user._id },
        $inc: { currentVipCount: 1 },
        $set: { updatedAt: new Date() }
      }
    );

    // Create notification for VIP
    await Notification.create({
      userId: user._id,
      type: 'manager_change',
      title: 'Manager Changed',
      message: `Your manager has been changed to ${manager.name}. They will now handle your withdrawals and support.`,
      relatedData: {
        managerId: manager._id.toString(),
        managerName: manager.name
      }
    });

    return NextResponse.json({
      message: 'VIP assigned to manager successfully',
      assignment: {
        vipId: user._id,
        vipName: user.name,
        managerId: manager._id,
        managerName: manager.name
      }
    });

  } catch (error) {
    console.error('Manual assign error:', error);
    return NextResponse.json(
      { error: 'Failed to assign VIP to manager' },
      { status: 500 }
    );
  }
}

// Redistribute VIPs when managers leave/join
async function redistributeVIPs() {
  try {
    // Get all active managers with permissions
    const managers = await Manager.find({ 
      isActive: true,
      permissions: { $in: ['manage_vips'] }
    }).sort({ currentVipCount: 1 });
    
    if (managers.length === 0) {
      return NextResponse.json(
        { error: 'No active managers with VIP management permissions found' },
        { status: 400 }
      );
    }

    // Get all VIP users
    const allVIPs = await User.find({
      vipLevel: { $exists: true, $ne: null },
      vipStatus: 'active'
    });

    if (allVIPs.length === 0) {
      return NextResponse.json(
        { message: 'No VIPs found to redistribute' },
        { status: 200 }
      );
    }

    // Calculate target VIPs per manager
    const targetVIPsPerManager = Math.ceil(allVIPs.length / managers.length);
    
    // Clear all current assignments using bulk operations
    await Manager.updateMany(
      { isActive: true },
      { 
        $set: { 
          assignedVips: [],
          currentVipCount: 0,
          updatedAt: new Date()
        }
      }
    );

    // Clear all user assignments
    await User.updateMany(
      { vipLevel: { $exists: true, $ne: null } },
      { 
        $unset: { assignedManager: "" },
        $set: { updatedAt: new Date() }
      }
    );

    // Prepare bulk operations for redistribution
    const bulkUserUpdates = [];
    const bulkManagerUpdates = [];
    const notifications = [];

    // Redistribute VIPs evenly with load balancing
    let managerIndex = 0;
    for (const vip of allVIPs) {
      const manager = managers[managerIndex % managers.length];
      
      // Prepare bulk updates
      bulkUserUpdates.push({
        updateOne: {
          filter: { _id: vip._id },
          update: { 
            $set: { 
              assignedManager: manager._id,
              updatedAt: new Date()
            }
          }
        }
      });

      bulkManagerUpdates.push({
        updateOne: {
          filter: { _id: manager._id },
          update: { 
            $push: { assignedVips: vip._id },
            $inc: { currentVipCount: 1 },
            $set: { updatedAt: new Date() }
          }
        }
      });

      // Prepare notification
      notifications.push({
        userId: vip._id,
        type: 'manager_change',
        title: 'Manager Redistributed',
        message: `Due to system changes, you have been assigned to manager ${manager.name}. They will handle your withdrawals and support.`,
        relatedData: {
          managerId: manager._id.toString(),
          managerName: manager.name
        },
        createdAt: new Date()
      });

      managerIndex++;
    }

    // Execute bulk operations
    if (bulkUserUpdates.length > 0) {
      await User.bulkWrite(bulkUserUpdates);
    }
    
    if (bulkManagerUpdates.length > 0) {
      await Manager.bulkWrite(bulkManagerUpdates);
    }

    // Create notifications in bulk
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return NextResponse.json({
      message: 'VIPs redistributed successfully',
      totalVIPs: allVIPs.length,
      totalManagers: managers.length,
      targetVIPsPerManager,
      redistributionDetails: {
        vipDistribution: managers.map(m => ({
          managerId: m._id,
          managerName: m.name,
          assignedVIPs: Math.ceil(allVIPs.length / managers.length)
        }))
      }
    });

  } catch (error) {
    console.error('Redistribute error:', error);
    return NextResponse.json(
      { error: 'Failed to redistribute VIPs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Get VIP assignment statistics
async function getVIPAssignmentStats() {
  try {
    // Get manager statistics
    const managerStats = await Manager.aggregate([
      { $match: { isActive: true } },
      { $project: {
        _id: 1,
        name: 1,
        currentVipCount: 1,
        maxVipCapacity: 1,
        capacityUtilization: { $divide: ['$currentVipCount', '$maxVipCapacity'] }
      }},
      { $sort: { currentVipCount: -1 } }
    ]);

    // Get VIP statistics
    const vipStats = await User.aggregate([
      { $match: { vipLevel: { $exists: true, $ne: null } } },
      { $group: {
        _id: null,
        totalVIPs: { $sum: 1 },
        assignedVIPs: { $sum: { $cond: [{ $ne: ['$assignedManager', null] }, 1, 0] } },
        unassignedVIPs: { $sum: { $cond: [{ $eq: ['$assignedManager', null] }, 1, 0] } }
      }}
    ]);

    // Get VIP level distribution
    const vipLevelStats = await User.aggregate([
      { $match: { vipLevel: { $exists: true, $ne: null } } },
      { $group: {
        _id: '$vipLevel',
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Get assignment efficiency
    const totalManagers = managerStats.length;
    const totalVIPs = vipStats[0]?.totalVIPs || 0;
    const assignedVIPs = vipStats[0]?.assignedVIPs || 0;
    const unassignedVIPs = vipStats[0]?.unassignedVIPs || 0;
    
    const assignmentEfficiency = totalVIPs > 0 ? (assignedVIPs / totalVIPs) * 100 : 0;
    const averageVIPsPerManager = totalManagers > 0 ? assignedVIPs / totalManagers : 0;

    return {
      managers: {
        total: totalManagers,
        stats: managerStats,
        averageCapacityUtilization: managerStats.reduce((sum, m) => sum + m.capacityUtilization, 0) / totalManagers || 0
      },
      vips: {
        total: totalVIPs,
        assigned: assignedVIPs,
        unassigned: unassignedVIPs,
        levelDistribution: vipLevelStats
      },
      efficiency: {
        assignmentRate: assignmentEfficiency,
        averageVIPsPerManager: averageVIPsPerManager,
        totalCapacity: managerStats.reduce((sum, m) => sum + m.maxVipCapacity, 0),
        usedCapacity: managerStats.reduce((sum, m) => sum + m.currentVipCount, 0)
      },
      recommendations: {
        needsRedistribution: unassignedVIPs > 0,
        loadBalancing: managerStats.some(m => m.capacityUtilization > 0.8),
        capacityIssues: managerStats.some(m => m.currentVipCount >= m.maxVipCapacity)
      }
    };

  } catch (error) {
    console.error('Error getting VIP assignment stats:', error);
    throw error;
  }
}
