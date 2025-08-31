import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Check if managers already exist
    const existingManagers = await Manager.countDocuments();
    
    if (existingManagers > 0) {
      return NextResponse.json({ 
        message: 'Managers already exist in database', 
        count: existingManagers 
      });
    }

    // Create sample managers
    const sampleManagers = [
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

    const createdManagers = await Manager.insertMany(sampleManagers);

    return NextResponse.json({
      message: 'Sample managers created successfully',
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
    console.error('Setup managers error:', error);
    return NextResponse.json({ 
      error: 'Failed to setup managers',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
