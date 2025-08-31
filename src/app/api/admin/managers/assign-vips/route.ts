import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Manager from '@/models/Manager';
import User from '@/models/User';

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
    
    // Check if admin exists
    const manager = await Manager.findById(managerId);
    if (!admin) {
      return NextResponse.json({ error: 'Manager access denied' }, { status: 403 });
    }

    const { managerId, userId } = await request.json();

    if (!managerId || !userId) {
      return NextResponse.json({ error: 'Manager ID and User ID are required' }, { status: 400 });
    }

    // Check if manager exists
    const manager = await Manager.findById(managerId);
    if (!manager) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    // Check if user exists and has VIP
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.vipLevel) {
      return NextResponse.json({ error: 'User does not have VIP status' }, { status: 400 });
    }

    // Check if manager has capacity
    if (manager.currentVipCount >= manager.maxVipCapacity) {
      return NextResponse.json({ error: 'Manager has reached maximum VIP capacity' }, { status: 400 });
    }

    // Check if user is already assigned to another manager
    if (user.assignedManager && user.assignedManager.toString() !== managerId) {
      return NextResponse.json({ error: 'User is already assigned to another manager' }, { status: 400 });
    }

    // Assign user to manager
    user.assignedManager = managerId;
    await user.save();

    // Update manager's assigned VIPs
    if (!manager.assignedVips.includes(userId)) {
      manager.assignedVips.push(userId);
      await manager.save();
    }

    return NextResponse.json({
      message: 'VIP user assigned to manager successfully',
      user: {
        id: user._id,
        name: user.name,
        vipLevel: user.vipLevel,
        monthlyReturns: user.monthlyReturns
      },
      manager: {
        id: manager._id,
        name: manager.name,
        currentVipCount: manager.assignedVips.length
      }
    });

  } catch (error: any) {
    console.error('Assign VIP error:', error);
    return NextResponse.json({ 
      error: 'Failed to assign VIP to manager' 
    }, { status: 500 });
  }
}
