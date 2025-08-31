import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Manager from '@/models/Manager';
import Admin from '@/models/Admin';
import Notification from '@/models/Notification';
import { JwtPayload } from '@/types/jwt';
import { Manager as ManagerType, User as UserType } from '@/types/models';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get admin token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify admin token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    if (!decoded || !decoded.adminId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Verify admin exists and is active
    const admin = await Admin.findById(decoded.adminId);
    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: 'Admin access denied' },
        { status: 403 }
      );
    }

    // Check if admin has permission to manage VIPs
    if (!admin.permissions.includes('manage_vips')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { action, userId, managerId } = await request.json();

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
      return await manualAssignVIP(userId, managerId);
    } else if (action === 'redistribute') {
      // Redistribute VIPs when managers leave/join
      return await redistributeVIPs();
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use auto-assign, manual-assign, or redistribute' },
        { status: 400 }
      );
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
    // Get all active managers
    const managers = await Manager.find({ isActive: true }).sort({ currentVipCount: 1 });
    
    if (managers.length === 0) {
      return NextResponse.json(
        { error: 'No active managers found. Please create managers first.' },
        { status: 400 }
      );
    }

    // Get all VIP users without managers
    const unassignedVIPs = await User.find({
      vipLevel: { $exists: true, $ne: null },
      assignedManager: { $exists: false }
    });

    if (unassignedVIPs.length === 0) {
      return NextResponse.json(
        { message: 'All VIPs are already assigned to managers' },
        { status: 200 }
      );
    }

    let assignedCount = 0;
    const assignments = [];

    for (const vip of unassignedVIPs) {
      // Find manager with lowest VIP count
      const manager = managers.reduce((prev: ManagerType, curr: ManagerType) => 
        prev.currentVipCount < curr.currentVipCount ? prev : curr
      );

      // Check if manager has capacity
      if (manager.currentVipCount >= manager.maxVipCapacity) {
        continue; // Skip if manager is at capacity
      }

      // Assign VIP to manager
      vip.assignedManager = manager._id;
      await vip.save();

      // Update manager's VIP count
      manager.assignedVips.push(vip._id);
      await manager.save();

      // Create notification for VIP
      await Notification.create({
        userId: vip._id,
        type: 'manager_change',
        title: 'Manager Assigned',
        message: `You have been assigned to manager ${manager.name}. They will handle your withdrawals and support.`,
        relatedData: {
          managerId: manager._id.toString(),
          managerName: manager.name
        }
      });

      assignments.push({
        vipId: vip._id,
        vipName: vip.name,
        managerId: manager._id,
        managerName: manager.name
      });

      assignedCount++;
    }

    return NextResponse.json({
      message: `Successfully assigned ${assignedCount} VIPs to managers`,
      assignments,
      totalAssigned: assignedCount
    });

  } catch (error) {
    console.error('Auto-assign error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-assign VIPs' },
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
      const previousManager = await Manager.findById(user.assignedManager);
      if (previousManager) {
        previousManager.assignedVips = previousManager.assignedVips.filter(
          (id: Types.ObjectId) => id.toString() !== userId
        );
        await previousManager.save();
      }
    }

    // Assign VIP to new manager
    user.assignedManager = manager._id;
    await user.save();

    // Update manager's VIP list
    if (!manager.assignedVips.includes(user._id)) {
      manager.assignedVips.push(user._id);
      await manager.save();
    }

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
    // Get all active managers
    const managers = await Manager.find({ isActive: true });
    
    if (managers.length === 0) {
      return NextResponse.json(
        { error: 'No active managers found' },
        { status: 400 }
      );
    }

    // Get all VIP users
    const allVIPs = await User.find({
      vipLevel: { $exists: true, $ne: null }
    });

    if (allVIPs.length === 0) {
      return NextResponse.json(
        { message: 'No VIPs found to redistribute' },
        { status: 200 }
      );
    }

    // Calculate target VIPs per manager
    const targetVIPsPerManager = Math.ceil(allVIPs.length / managers.length);
    
    // Clear all current assignments
    for (const manager of managers) {
      manager.assignedVips = [];
      await manager.save();
    }

    // Redistribute VIPs evenly
    let managerIndex = 0;
    for (const vip of allVIPs) {
      const manager = managers[managerIndex % managers.length];
      
      vip.assignedManager = manager._id;
      await vip.save();

      manager.assignedVips.push(vip._id);
      await manager.save();

      // Create notification for VIP
      await Notification.create({
        userId: vip._id,
        type: 'manager_change',
        title: 'Manager Redistributed',
        message: `Due to system changes, you have been assigned to manager ${manager.name}. They will handle your withdrawals and support.`,
        relatedData: {
          managerId: manager._id.toString(),
          managerName: manager.name
        }
      });

      managerIndex++;
    }

    return NextResponse.json({
      message: 'VIPs redistributed successfully',
      totalVIPs: allVIPs.length,
      totalManagers: managers.length,
      targetVIPsPerManager
    });

  } catch (error) {
    console.error('Redistribute error:', error);
    return NextResponse.json(
      { error: 'Failed to redistribute VIPs' },
      { status: 500 }
    );
  }
}
