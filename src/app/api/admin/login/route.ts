import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';
import { sendOTPEmail } from '@/lib/emailService';
import { generateOTP, storeOTP } from '@/lib/otpService';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email } = await request.json();

    // Validation
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
        { error: 'No account found with this email' },
        { status: 404 }
      );
    }

    // Check if manager is active
    if (!manager.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with expiration
    await storeOTP(email, otp);

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, manager.name);
    
    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send OTP email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'OTP sent successfully',
      email: email,
      managerId: manager._id
    });

  } catch (error: unknown) {
    console.error('Manager login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
