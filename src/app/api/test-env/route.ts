import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    razorpayKeySecretExists: !!process.env.RAZORPAY_KEY_SECRET,
    razorpayKeySecretLength: process.env.RAZORPAY_KEY_SECRET?.length,
    razorpayKeySecretFirstChars: process.env.RAZORPAY_KEY_SECRET?.substring(0, 10),
    razorpayKeySecretLastChars: process.env.RAZORPAY_KEY_SECRET?.substring(-10),
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
