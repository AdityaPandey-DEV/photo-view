import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { JwtPayload } from '@/types/jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

    // Only super_admin can delete admins
    if (currentAdmin.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can delete admins' },
        { status: 403 }
      );
    }

    const { adminId } = await request.json();

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (adminId === currentAdmin._id.toString()) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Find the admin to delete
    const adminToDelete = await Admin.findById(adminId);
    if (!adminToDelete) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of other super admins
    if (adminToDelete.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot delete other super admins' },
        { status: 403 }
      );
    }

    // Delete the admin
    await Admin.findByIdAndDelete(adminId);

    return NextResponse.json({
      message: 'Admin deleted successfully'
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
