import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    // Get user from JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    const { profileImage } = await request.json();

    if (!profileImage) {
      return NextResponse.json(
        { error: 'Profile image URL is required' },
        { status: 400 }
      );
    }

    // Update user's profile image in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage },
      { new: true }
    ).select('name phone vipLevel profileImage');

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log(`Profile image updated for user ${userId}: ${profileImage}`);

    return NextResponse.json({
      success: true,
      message: 'Profile image updated successfully',
      user: updatedUser
    });

  } catch (error: any) {
    console.error('Profile image update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile image' },
      { status: 500 }
    );
  }
}
