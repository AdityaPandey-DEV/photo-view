import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Withdrawal from '@/models/Withdrawal';
import Manager from '@/models/Manager';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Get manager token
    const cookieStore = await cookies();
    const token = cookieStore.get('manager-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify manager
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const managerId = decoded.managerId;

    const manager = await Manager.findById(managerId);
    if (!manager || !manager.isActive) {
      return NextResponse.json({ error: 'Manager access denied' }, { status: 403 });
    }

    // Check permissions
    if (!manager.permissions.includes('manage_withdrawals')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { withdrawalId, action, notes } = await request.json();

    if (!withdrawalId || !action) {
      return NextResponse.json({ error: 'Withdrawal ID and action are required' }, { status: 400 });
    }

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });
    }

    // Update withdrawal status
    let newStatus = withdrawal.status;
    let processedAt = withdrawal.processedAt;

    switch (action) {
      case 'approve':
        newStatus = 'approved';
        break;
      case 'reject':
        newStatus = 'rejected';
        processedAt = new Date();
        break;
      case 'mark_paid':
        newStatus = 'paid';
        processedAt = new Date();
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update withdrawal
    await Withdrawal.findByIdAndUpdate(withdrawalId, {
      status: newStatus,
      managerNotes: notes || withdrawal.managerNotes,
      processedAt,
      updatedAt: new Date()
    });

    return NextResponse.json({
      message: `Withdrawal ${action}ed successfully`,
      withdrawal: {
        id: withdrawal._id,
        status: newStatus,
        processedAt
      }
    });

  } catch (error: any) {
    console.error('Review withdrawal error:', error);
    return NextResponse.json({ 
      error: 'Failed to review withdrawal request' 
    }, { status: 500 });
  }
}
