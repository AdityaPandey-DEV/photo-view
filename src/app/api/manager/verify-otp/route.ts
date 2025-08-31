import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';
import { verifyOTP } from '@/lib/otpService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Verify OTP
    const verificationResult = verifyOTP(email, otp);
    
    if (!verificationResult.success) {
      return NextResponse.json(
        { error: verificationResult.message },
        { status: 400 }
      );
    }

    // Get manager details
    const manager = await Manager.findById(verificationResult.managerId);
    
    if (!manager) {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      );
    }

    if (!manager.isActive) {
      return NextResponse.json(
        { error: 'Manager account is deactivated' },
        { status: 403 }
      );
    }

    // Update last login time
    manager.lastLoginAt = new Date();
    await manager.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        managerId: manager._id,
        email: manager.email,
        role: manager.role,
        permissions: manager.permissions
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set manager token cookie
    const response = NextResponse.json({
      message: 'Login successful',
      manager: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        role: manager.role,
        permissions: manager.permissions,
        lastLoginAt: manager.lastLoginAt
      },
      token: token
    });

    // Set secure cookie
    response.cookies.set('manager-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });

    return response;

  } catch (error: any) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
