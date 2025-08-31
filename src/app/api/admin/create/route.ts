import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';
import { JwtPayload, MongoError } from '@/types/jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
    const currentManager = await Manager.findById(decoded.managerId);
    if (!currentManager || !currentManager.isActive) {
      return NextResponse.json(
        { error: 'Manager access denied' },
        { status: 403 }
      );
    }

    // Check if manager has permission to manage managers
    if (!currentManager.permissions.includes('manage_managers')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Only admin role can create new managers
    if (!currentManager.permissions.includes('manage_managers')) {
      return NextResponse.json(
        { error: 'Only managers with manage_managers permission can create new managers' },
        { status: 403 }
      );
    }

    const { username, password, name, email, role, permissions } = await request.json();

    // Validation
    if (!username || !password || !name) {
      return NextResponse.json(
        { error: 'Username, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingManager = await Manager.findOne({ username });
    if (existingManager) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Validate permissions
    const validPermissions = [
      'manage_users',
      'manage_vips', 
      'manage_managers',
      'manage_withdrawals',
      'view_analytics',
      'manage_payments'
    ];

    if (permissions && !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permissions must be an array' },
        { status: 400 }
      );
    }

    if (permissions) {
      for (const permission of permissions) {
        if (!validPermissions.includes(permission)) {
          return NextResponse.json(
            { error: `Invalid permission: ${permission}` },
            { status: 400 }
          );
        }
      }
    }

    // Create new manager
    const newManager = new Manager({
      username,
      password,
      name,
      email: email || undefined,
      permissions: permissions || ['manage_users', 'view_analytics'],
      isActive: true,
      maxVipCapacity: 50,
      currentVipCount: 0,
      assignedVips: [],
      assignedWithdrawals: [],
      totalWithdrawalsProcessed: 0,
      totalAmountProcessed: 0
    });

    await newManager.save();

    // Return manager data without password
    const managerData = {
      id: newManager._id,
      username: newManager.username,
      name: newManager.name,
      email: newManager.email,
      permissions: newManager.permissions,
      isActive: newManager.isActive,
      createdAt: newManager.createdAt
    };

    return NextResponse.json({
      message: 'Manager created successfully',
      manager: managerData
    });

  } catch (error: unknown) {
    console.error('Create admin error:', error);
    
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

    if ((error as MongoError).code === 11000) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
