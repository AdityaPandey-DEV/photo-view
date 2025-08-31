import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
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
    const authenticatedManagerId = decoded.managerId;
    
    // Check if authenticated manager exists
    const authenticatedManager = await Manager.findById(authenticatedManagerId);
    if (!authenticatedManager) {
      return NextResponse.json({ error: 'Manager access denied' }, { status: 403 });
    }

    const { managerId: targetManagerId, userId } = await request.json();

    if (!targetManagerId || !userId) {
      return NextResponse.json({ error: 'Manager ID and User ID are required' }, { status: 400 });
    }

    // Check if target manager exists
    const targetManager = await Manager.findById(targetManagerId);
    if (!targetManager) {
      return NextResponse.json({ error: 'Target manager not found' }, { status: 404 });
    }

    // Check if user exists and has VIP
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.vipLevel) {
      return NextResponse.json({ error: 'User does not have VIP status' }, { status: 400 });
    }

    // Check if target manager has capacity
    if (targetManager.currentVipCount >= targetManager.maxVipCapacity) {
      return NextResponse.json({ error: 'Target manager has reached maximum VIP capacity' }, { status: 400 });
    }

    // Check if user is already assigned to another manager
    if (user.assignedManager && user.assignedManager.toString() !== targetManagerId) {
      return NextResponse.json({ error: 'User is already assigned to another manager' }, { status: 400 });
    }

    // Assign user to target manager
    user.assignedManager = targetManagerId;
    await user.save();

    // Update target manager's assigned VIPs
    if (!targetManager.assignedVips.includes(userId)) {
      targetManager.assignedVips.push(userId);
      targetManager.currentVipCount = targetManager.assignedVips.length;
      await targetManager.save();
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
        id: targetManager._id,
        name: targetManager.name,
        currentVipCount: targetManager.assignedVips.length
      }
    });

  } catch (error: any) {
    console.error('Assign VIP error:', error);
    return NextResponse.json({ 
      error: 'Failed to assign VIP to manager' 
    }, { status: 500 });
  }
}
