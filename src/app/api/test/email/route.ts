import { NextRequest, NextResponse } from 'next/server';
import { sendOTPEmail, testEmailConnection } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Test email connection first
    const connectionTest = await testEmailConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json(
        { 
          error: 'Email service connection failed',
          details: connectionTest.error
        },
        { status: 500 }
      );
    }

    // Generate test OTP
    const testOTP = '123456';
    
    // Send test email
    const emailResult = await sendOTPEmail(email, testOTP, name);
    
    if (!emailResult.success) {
      return NextResponse.json(
        { 
          error: 'Failed to send test email',
          details: emailResult.error
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Test email sent successfully!',
      email: email,
      otp: testOTP,
      messageId: emailResult.messageId,
      connection: 'Email service is working properly'
    });

  } catch (error: any) {
    console.error('Email test error:', error);
    return NextResponse.json(
      { 
        error: 'Email test failed',
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Test email connection
    const connectionTest = await testEmailConnection();
    
    return NextResponse.json({
      message: 'Email service test',
      connection: connectionTest.success ? 'Connected' : 'Failed',
      details: connectionTest.message || connectionTest.error
    });
  } catch (error: any) {
    console.error('Email connection test error:', error);
    return NextResponse.json(
      { 
        error: 'Email connection test failed',
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
