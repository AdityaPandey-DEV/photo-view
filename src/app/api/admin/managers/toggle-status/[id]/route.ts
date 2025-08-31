import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const { isActive } = await request.json();

    // Prevent self-deactivation
    if (id === managerId && !isActive) {
      return NextResponse.json({ 
        error: 'Cannot deactivate your own account' 
      }, { status: 400 });
    }

    // Check if manager exists
    const managerToUpdate = await Manager.findById(id);
    if (!managerToUpdate) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    // Update manager status
    const updatedManager = await Manager.findByIdAndUpdate(
      id,
      { 
        isActive,
        updatedAt: new Date()
      },
      { new: true }
    );

    return NextResponse.json({
      message: `Manager ${isActive ? 'activated' : 'deactivated'} successfully`,
      manager: {
        id: updatedManager._id,
        name: updatedManager.name,
        isActive: updatedManager.isActive
      }
    });

  } catch (error: any) {
    console.error('Toggle manager status error:', error);
    return NextResponse.json({ 
      error: 'Failed to toggle manager status',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
