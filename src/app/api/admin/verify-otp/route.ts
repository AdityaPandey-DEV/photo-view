import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';
import { verifyOTP, cleanupExpiredOTPs } from '@/lib/otpService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, otp } = await request.json();

    // Validation
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Verify OTP
    const otpResult = await verifyOTP(email, otp);
    
    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.message },
        { status: 401 }
      );
    }

    // Find manager using managerId from OTP or email
    const manager = await Manager.findOne({
      $or: [
        { _id: otpResult.managerId },
        { email: email }
      ]
    });
    
    if (!manager || !manager.isActive) {
      return NextResponse.json(
        { error: 'Account not found or deactivated' },
        { status: 401 }
      );
    }

    // Update last login
    manager.lastLoginAt = new Date();
    await manager.save();

    // Clean up expired OTPs
    await cleanupExpiredOTPs();

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

    // Set HTTP-only cookie
    const response = NextResponse.json({
      message: 'Login successful',
      manager: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        role: manager.role,
        permissions: manager.permissions
      }
    });

    response.cookies.set('manager-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return response;

  } catch (error: unknown) {
    console.error('Manager OTP verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
