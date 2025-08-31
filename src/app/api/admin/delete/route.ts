import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';
import { JwtPayload } from '@/types/jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function DELETE(request: NextRequest) {
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

    const { managerId } = await request.json();

    if (!managerId) {
      return NextResponse.json(
        { error: 'Manager ID is required' },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (managerId === currentManager._id.toString()) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Find the manager to delete
    const managerToDelete = await Manager.findById(managerId);
    if (!managerToDelete) {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      );
    }

    // Check if manager has assigned VIPs or withdrawals
    if (managerToDelete.assignedVips.length > 0 || managerToDelete.assignedWithdrawals.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete manager with assigned VIPs or withdrawals. Please reassign them first.' },
        { status: 400 }
      );
    }

    // Delete the manager
    await Manager.findByIdAndDelete(managerId);

    return NextResponse.json({
      message: 'Manager deleted successfully'
    });

  } catch (error: unknown) {
    console.error('Delete admin error:', error);
    
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
