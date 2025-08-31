import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Notification from '@/models/Notification';
import { JwtPayload } from '@/types/jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get admin token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('manager-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify admin token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    if (!decoded || !decoded.managerId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Verify admin exists and is active
    const manager = await Manager.findById(decoded.managerId);
    if (!admin || !manager.isActive) {
      return NextResponse.json(
        { error: 'Admin access denied' },
        { status: 403 }
      );
    }

    // Check if admin has permission to manage VIPs
    if (!admin.permissions.includes('manage_vips')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { userId, title, message, type } = await request.json();

    // Validation
    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'User ID, title, and message are required' },
        { status: 400 }
      );
    }

    if (!['system_alert', 'vip_status_change', 'withdrawal_processed'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    // Create notification
    const notification = new Notification({
      userId,
      type,
      title,
      message
    });

    await notification.save();

    return NextResponse.json({
      message: 'Notification sent successfully',
      notification: {
        id: notification._id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt
      }
    });

  } catch (error: unknown) {
    console.error('Send notification error:', error);
    
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
