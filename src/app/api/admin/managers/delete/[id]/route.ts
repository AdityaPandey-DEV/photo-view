import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const cookieStore = await cookies();
    const token = cookieStore.get('manager-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const managerId = decoded.managerId;
    
    // Check if manager exists and has permission
    const authManager = await Manager.findById(managerId);
    if (!authManager || !authManager.isActive) {
      return NextResponse.json({ error: 'Manager access denied' }, { status: 403 });
    }

    if (!authManager.permissions.includes('manage_managers')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = params;

    // Prevent self-deletion
    if (id === managerId) {
      return NextResponse.json({ 
        error: 'Cannot delete your own account' 
      }, { status: 400 });
    }

    // Check if manager exists
    const managerToDelete = await Manager.findById(id);
    if (!managerToDelete) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    // Check if manager has assigned VIPs or withdrawals
    if (managerToDelete.assignedVips.length > 0 || managerToDelete.assignedWithdrawals.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete manager with assigned VIPs or withdrawals. Please reassign them first.' 
      }, { status: 400 });
    }

    // Delete manager
    await Manager.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Manager deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete manager error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete manager',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
