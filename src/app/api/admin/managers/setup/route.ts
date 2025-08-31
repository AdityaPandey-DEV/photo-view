import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get('manager-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const managerId = decoded.managerId;
    
    // Check if manager exists
    const manager = await Manager.findById(managerId);
    if (!manager || !manager.isActive) {
      return NextResponse.json({ error: 'Manager access denied' }, { status: 403 });
    }

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
        name: 'John Manager',
        email: 'john@example.com',
        phone: '+91 98765 43210',
        isActive: true,
        maxVipCapacity: 50,
        currentVipCount: 0,
        assignedVips: [],
        assignedWithdrawals: [],
        role: 'manager',
        permissions: ['review_withdrawals', 'manage_vips'],
        totalWithdrawalsProcessed: 0,
        totalAmountProcessed: 0
      },
      {
        name: 'Sarah Senior',
        email: 'sarah@example.com',
        phone: '+91 98765 43211',
        isActive: true,
        maxVipCapacity: 75,
        currentVipCount: 0,
        assignedVips: [],
        assignedWithdrawals: [],
        role: 'senior_manager',
        permissions: ['review_withdrawals', 'manage_vips', 'manage_managers'],
        totalWithdrawalsProcessed: 0,
        totalAmountProcessed: 0
      },
      {
        name: 'Mike Admin',
        email: 'mike@example.com',
        phone: '+91 98765 43212',
        isActive: true,
        maxVipCapacity: 100,
        currentVipCount: 0,
        assignedVips: [],
        assignedWithdrawals: [],
        role: 'admin',
        permissions: ['review_withdrawals', 'manage_vips', 'manage_managers', 'admin_access'],
        totalWithdrawalsProcessed: 0,
        totalAmountProcessed: 0
      }
    ];

    // Insert managers into MongoDB
    const createdManagers = await Manager.insertMany(sampleManagers);

    return NextResponse.json({
      message: 'Sample managers created successfully in MongoDB',
      managers: createdManagers.map(m => ({
        id: m._id,
        name: m.name,
        email: m.email,
        role: m.role
      })),
      count: createdManagers.length
    });

  } catch (error: any) {
    console.error('Setup managers error:', error);
    return NextResponse.json({ 
      error: 'Failed to setup managers' 
    }, { status: 500 });
  }
}
