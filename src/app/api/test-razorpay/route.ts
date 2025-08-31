import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function GET() {
  try {
    // Test Razorpay client initialization
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // Try to create a simple test order
    const order = await razorpay.orders.create({
      amount: 100, // 1 rupee
      currency: 'INR',
      receipt: `test_${Date.now()}`,
      notes: {
        test: 'true'
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Razorpay order created successfully',
      orderId: order.id,
      amount: order.amount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      errorCode: error.statusCode,
      errorDescription: error.error?.description,
      fullError: JSON.stringify(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
