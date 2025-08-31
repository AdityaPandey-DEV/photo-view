import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';
import { JwtPayload } from '@/types/jwt';

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

    // Fetch all managers (excluding passwords)
    const managers = await Manager.find({}).select('-password').sort({ createdAt: -1 });

    return NextResponse.json({
      managers: managers.map(manager => ({
        id: manager._id,
        username: manager.username,
        name: manager.name,
        email: manager.email,
        permissions: manager.permissions,
        isActive: manager.isActive,
        maxVipCapacity: manager.maxVipCapacity,
        currentVipCount: manager.currentVipCount,
        createdAt: manager.createdAt,
        updatedAt: manager.updatedAt
      }))
    });

  } catch (error: unknown) {
    console.error('Fetch admins error:', error);
    
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
