import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { JwtPayload, MongoError } from '@/types/jwt';

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
    const currentAdmin = await Admin.findById(decoded.adminId);
    if (!currentAdmin || !currentAdmin.isActive) {
      return NextResponse.json(
        { error: 'Admin access denied' },
        { status: 403 }
      );
    }

    // Check if admin has permission to manage admins
    if (!currentAdmin.permissions.includes('manage_admins')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Only super_admin can create new admins
    if (currentAdmin.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can create new admins' },
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
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Validate role
    if (role && !['admin', 'super_admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin or super_admin' },
        { status: 400 }
      );
    }

    // Validate permissions
    const validPermissions = [
      'manage_users',
      'manage_vips', 
      'manage_admins',
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

    // Create new admin
    const newAdmin = new Admin({
      username,
      password,
      name,
      email: email || undefined,
      role: role || 'admin',
      permissions: permissions || ['manage_users', 'view_analytics'],
      isActive: true
    });

    await newAdmin.save();

    // Return admin data without password
    const adminData = {
      id: newAdmin._id,
      username: newAdmin.username,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      permissions: newAdmin.permissions,
      isActive: newAdmin.isActive,
      createdAt: newAdmin.createdAt
    };

    return NextResponse.json({
      message: 'Admin created successfully',
      admin: adminData
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
