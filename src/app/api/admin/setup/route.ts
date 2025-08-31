import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'aditya-admin' });
    if (existingAdmin) {
      return NextResponse.json(
        { message: 'Default admin already exists' },
        { status: 200 }
      );
    }
 
    // Create default admin user
    const defaultAdmin = new Admin({
      username: 'aditya-admin',
      password: 'Ad282499',
      name: 'Aditya Admin',
      role: 'super_admin',
      permissions: [
        'manage_users',
        'manage_vips', 
        'manage_admins',
        'view_analytics',
        'manage_payments'
      ],
      isActive: true
    });

    await defaultAdmin.save();

    return NextResponse.json({
      message: 'Default admin created successfully',
      admin: {
        username: defaultAdmin.username,
        name: defaultAdmin.name,
        role: defaultAdmin.role
      }
    });

  } catch (error: unknown) {
    console.error('Admin setup error:', error);
    return NextResponse.json(
      { error: 'Failed to create default admin' },
      { status: 500 }
    );
  }
}
