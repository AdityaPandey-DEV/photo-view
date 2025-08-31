import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';
import { sendOTPEmail } from '@/lib/emailService';
import { storeOTP } from '@/lib/otpService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find manager by email
    const manager = await Manager.findOne({ email });

    if (!manager) {
      return NextResponse.json(
        { error: 'Manager not found with this email' },
        { status: 404 }
      );
    }

    if (!manager.isActive) {
      return NextResponse.json(
        { error: 'Manager account is deactivated' },
        { status: 403 }
      );
    }

    // Check if OTP was sent recently (rate limiting)
    const now = new Date();
    const lastOtpTime = manager.lastOtpSentAt;
    const timeDiff = lastOtpTime ? now.getTime() - lastOtpTime.getTime() : 0;
    const minInterval = 2 * 60 * 1000; // 2 minutes

    if (lastOtpTime && timeDiff < minInterval) {
      const remainingTime = Math.ceil((minInterval - timeDiff) / 1000);
      return NextResponse.json(
        { 
          error: `Please wait ${remainingTime} seconds before requesting another OTP`,
          remainingTime 
        },
        { status: 429 }
      );
    }

    // Check OTP attempts limit
    if (manager.otpAttempts >= 5) {
      const lockoutTime = 30 * 60 * 1000; // 30 minutes
      const lastAttemptTime = manager.lastOtpSentAt;
      
      if (lastAttemptTime && (now.getTime() - lastAttemptTime.getTime()) < lockoutTime) {
        return NextResponse.json(
          { 
            error: 'Too many OTP attempts. Account temporarily locked. Please try again in 30 minutes.' 
          },
          { status: 429 }
        );
      } else {
        // Reset attempts after lockout period
        manager.otpAttempts = 0;
      }
    }

    // Generate and store OTP
    const otp = storeOTP(email, manager._id.toString());
    
    // Update manager record
    manager.lastOtpSentAt = now;
    manager.otpAttempts += 1;
    await manager.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, manager.name);
    
    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send OTP email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'OTP sent successfully to your email',
      email: email,
      expiresIn: '10 minutes',
      attempts: manager.otpAttempts
    });

  } catch (error: any) {
    console.error('Manager login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
