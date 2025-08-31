import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';
import Admin from '@/models/Admin';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { JwtPayload, MongoDuplicateKeyError } from '@/types/jwt';
import { Manager as ManagerType, User as UserType } from '@/types/models';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// GET: Fetch all managers
export async function GET(request: NextRequest) {
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

    // Fetch all managers with their assigned VIPs
    const managers = await Manager.find({}).populate('assignedVips', 'name phone vipLevel totalEarnings').sort({ createdAt: -1 });

    return NextResponse.json({
      managers: managers.map(manager => ({
        id: manager._id,
        name: manager.name,
        email: manager.email,
        phone: manager.phone,
        isActive: manager.isActive,
        maxVipCapacity: manager.maxVipCapacity,
        currentVipCount: manager.currentVipCount,
        assignedVips: manager.assignedVips,
        createdAt: manager.createdAt,
        updatedAt: manager.updatedAt
      }))
    });

  } catch (error: unknown) {
    console.error('Fetch managers error:', error);
    
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

// POST: Create new manager
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

    const { name, email, phone, maxVipCapacity } = await request.json();

    // Validation
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 }
      );
    }

    if (maxVipCapacity && (maxVipCapacity < 1 || maxVipCapacity > 1000)) {
      return NextResponse.json(
        { error: 'Max VIP capacity must be between 1 and 1000' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingManager = await Manager.findOne({ email });
    if (existingManager) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Create new manager
    const newManager = new Manager({
      name,
      email,
      phone,
      maxVipCapacity: maxVipCapacity || 50,
      isActive: true
    });

    await newManager.save();

    return NextResponse.json({
      message: 'Manager created successfully',
      manager: {
        id: newManager._id,
        name: newManager.name,
        email: newManager.email,
        phone: newManager.phone,
        isActive: newManager.isActive,
        maxVipCapacity: newManager.maxVipCapacity,
        currentVipCount: newManager.currentVipCount
      }
    });

  } catch (error: unknown) {
    console.error('Create manager error:', error);
    
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

    if ((error as MongoDuplicateKeyError).code === 11000) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update manager
export async function PUT(request: NextRequest) {
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

    const { managerId, updates } = await request.json();

    if (!managerId) {
      return NextResponse.json(
        { error: 'Manager ID is required' },
        { status: 400 }
      );
    }

    // Find manager
    const manager = await Manager.findById(managerId);
    if (!manager) {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      );
    }

    // Update manager fields
    if (updates.name) manager.name = updates.name;
    if (updates.email) manager.email = updates.email;
    if (updates.phone) manager.phone = updates.phone;
    if (updates.maxVipCapacity) manager.maxVipCapacity = updates.maxVipCapacity;
    if (updates.isActive !== undefined) manager.isActive = updates.isActive;

    await manager.save();

    return NextResponse.json({
      message: 'Manager updated successfully',
      manager: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        phone: manager.phone,
        isActive: manager.isActive,
        maxVipCapacity: manager.maxVipCapacity,
        currentVipCount: manager.currentVipCount
      }
    });

  } catch (error: unknown) {
    console.error('Update manager error:', error);
    
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

// DELETE: Delete manager and redistribute VIPs
export async function DELETE(request: NextRequest) {
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

    const { managerId } = await request.json();

    if (!managerId) {
      return NextResponse.json(
        { error: 'Manager ID is required' },
        { status: 400 }
      );
    }

    // Find manager
    const manager = await Manager.findById(managerId);
    if (!manager) {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      );
    }

    // Get all VIPs assigned to this manager
    const assignedVIPs = await User.find({ assignedManager: managerId });

    // Remove manager assignment from all VIPs
    for (const vip of assignedVIPs) {
      vip.assignedManager = undefined;
      await vip.save();

      // Create notification for VIP
      await Notification.create({
        userId: vip._id,
        type: 'manager_change',
        title: 'Manager Removed',
        message: `Your previous manager ${manager.name} has been removed. You will be assigned to a new manager shortly.`,
        relatedData: {
          managerName: manager.name
        }
      });
    }

    // Delete the manager
    await Manager.findByIdAndDelete(managerId);

    return NextResponse.json({
      message: 'Manager deleted successfully',
      vipsAffected: assignedVIPs.length
    });

  } catch (error: unknown) {
    console.error('Delete manager error:', error);
    
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
