import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Clear all existing managers
    await Manager.deleteMany({});
    
    // Create new managers with your email
    const newManagers = [
      {
        name: 'Aditya Pandey',
        email: 'adityapandey.dev.in@gmail.com',
        phone: '70601690701',
        isActive: true,
        maxVipCapacity: 100,
        currentVipCount: 0,
        role: 'admin',
        permissions: [
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
      },
      {
        name: 'Manager One',
        email: 'manager1@example.com',
        phone: '9876543210',
        isActive: true,
        maxVipCapacity: 50,
        currentVipCount: 0,
        role: 'manager',
        permissions: [
          'manage_vips',
          'manage_withdrawals',
          'view_analytics'
        ],
        assignedVips: [],
        assignedWithdrawals: [],
        totalWithdrawalsProcessed: 0,
        totalAmountProcessed: 0,
        isEmailVerified: true
      },
      {
        name: 'Manager Two',
        email: 'manager2@example.com',
        phone: '8765432109',
        isActive: true,
        maxVipCapacity: 50,
        currentVipCount: 0,
        role: 'senior_manager',
        permissions: [
          'manage_vips',
          'manage_withdrawals',
          'view_analytics',
          'manage_payments'
        ],
        assignedVips: [],
        assignedWithdrawals: [],
        totalWithdrawalsProcessed: 0,
        totalAmountProcessed: 0,
        isEmailVerified: true
      }
    ];

    const createdManagers = await Manager.insertMany(newManagers);

    return NextResponse.json({
      message: 'Managers reset successfully',
      managers: createdManagers.map(m => ({
        id: m._id,
        name: m.name,
        email: m.email,
        role: m.role,
        permissions: m.permissions
      })),
      count: createdManagers.length
    });

  } catch (error: any) {
    console.error('Reset managers error:', error);
    return NextResponse.json({ 
      error: 'Failed to reset managers',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
