import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const cookieStore = await cookies();
    const token = cookieStore.get('manager-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const managerId = decoded.managerId;
    
    // Check if manager exists and has permissions
    const manager = await Manager.findById(managerId);
    if (!manager || !manager.isActive) {
      return NextResponse.json({ error: 'Manager access denied' }, { status: 403 });
    }

    if (!manager.permissions.includes('manage_vips')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all users with VIP information
    const allUsers = await User.find({}).select('name phone vipLevel vipStatus assignedManager createdAt');
    
    // Categorize users
    const vipUsers = allUsers.filter(u => u.vipLevel || u.vipStatus === 'active');
    const regularUsers = allUsers.filter(u => !u.vipLevel && u.vipStatus !== 'active');
    
    // Get VIP statistics
    const vipStats = {
      total: allUsers.length,
      vip: vipUsers.length,
      regular: regularUsers.length,
      vipLevels: {
        VIP1: vipUsers.filter(u => u.vipLevel === 'VIP1').length,
        VIP2: vipUsers.filter(u => u.vipLevel === 'VIP2').length,
        VIP3: vipUsers.filter(u => u.vipLevel === 'VIP3').length,
        active: vipUsers.filter(u => u.vipStatus === 'active').length,
        expired: vipUsers.filter(u => u.vipStatus === 'expired').length,
        none: vipUsers.filter(u => u.vipStatus === 'none').length
      }
    };

    return NextResponse.json({
      message: 'VIP users retrieved successfully',
      stats: vipStats,
      vipUsers: vipUsers.map(u => ({
        id: u._id,
        name: u.name,
        phone: u.phone,
        vipLevel: u.vipLevel,
        vipStatus: u.vipStatus,
        assignedManager: u.assignedManager,
        createdAt: u.createdAt
      })),
      regularUsers: regularUsers.map(u => ({
        id: u._id,
        name: u.name,
        phone: u.phone,
        vipLevel: u.vipLevel,
        vipStatus: u.vipStatus,
        createdAt: u.createdAt
      }))
    });

  } catch (error: any) {
    console.error('VIP users API error:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve VIP users',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
