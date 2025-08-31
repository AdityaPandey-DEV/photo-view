import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { name, email, phone, role, permissions } = await request.json();

    // Check if manager already exists
    const existingManager = await Manager.findOne({ email });
    if (existingManager) {
      return NextResponse.json({ 
        error: 'Manager with this email already exists',
        manager: {
          id: existingManager._id,
          name: existingManager.name,
          email: existingManager.email,
          role: existingManager.role
        }
      }, { status: 400 });
    }

    // Create new manager
    const newManager = new Manager({
      name: name || 'Aditya Pandey',
      email: email || 'adityapandey.dev.in@gmail.com',
      phone: phone || '70601690701',
      isActive: true,
      maxVipCapacity: 100,
      currentVipCount: 0,
      role: role || 'admin',
      permissions: permissions || [
        'manage_users',
        'manage_vips', 
        'manage_managers',
        'view_analytics',
        'manage_payments',
        'manage_withdrawals'
      ],
      assignedVips: [],
      assignedWithdrawals: [],
      totalWithdrawalsProcessed: 0,
      totalAmountProcessed: 0,
      isEmailVerified: true
    });

    await newManager.save();

    return NextResponse.json({
      message: 'Manager added successfully',
      manager: {
        id: newManager._id,
        name: newManager.name,
        email: newManager.email,
        role: newManager.role,
        permissions: newManager.permissions
      }
    });

  } catch (error: any) {
    console.error('Add manager error:', error);
    return NextResponse.json({ 
      error: 'Failed to add manager',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
