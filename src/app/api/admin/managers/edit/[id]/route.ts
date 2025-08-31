import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';

export async function PUT(
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
    const updateData = await request.json();

    // Validate required fields
    if (!updateData.name || !updateData.email || !updateData.phone) {
      return NextResponse.json({ 
        error: 'Name, email, and phone are required' 
      }, { status: 400 });
    }

    // Check if email is already taken by another manager
    const existingManager = await Manager.findOne({ 
      email: updateData.email, 
      _id: { $ne: id } 
    });
    
    if (existingManager) {
      return NextResponse.json({ 
        error: 'Email is already taken by another manager' 
      }, { status: 400 });
    }

    // Update manager
    const updatedManager = await Manager.findByIdAndUpdate(
      id,
      {
        name: updateData.name,
        email: updateData.email,
        phone: updateData.phone,
        role: updateData.role,
        maxVipCapacity: updateData.maxVipCapacity,
        permissions: updateData.permissions,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedManager) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Manager updated successfully',
      manager: {
        id: updatedManager._id,
        name: updatedManager.name,
        email: updatedManager.email,
        role: updatedManager.role,
        permissions: updatedManager.permissions
      }
    });

  } catch (error: any) {
    console.error('Update manager error:', error);
    return NextResponse.json({ 
      error: 'Failed to update manager',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
