import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    // Check if environment variables are set
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay environment variables missing');
      return NextResponse.json(
        { error: 'Razorpay configuration missing' },
        { status: 500 }
      );
    }

    console.log('Razorpay Key ID:', process.env.RAZORPAY_KEY_ID);
    console.log('Razorpay Key Secret exists:', !!process.env.RAZORPAY_KEY_SECRET);

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { subscriptionType } = await request.json();
    console.log('Subscription type received:', subscriptionType);

    // Validate subscription type and set amount
    let finalAmount = 0;
    let description = '';

    switch (subscriptionType) {
      case 'VIP1':
        finalAmount = 900; // ₹900 (half of ₹1800)
        description = 'VIP 1 Subscription - Photography Investment Platform';
        break;
      case 'VIP2':
        finalAmount = 3000; // ₹3000 (half of ₹6000)
        description = 'VIP 2 Subscription - Photography Investment Platform';
        break;
      case 'VIP3':
        finalAmount = 11000; // ₹11000 (half of ₹22000)
        description = 'VIP 3 Subscription - Photography Investment Platform';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid subscription type' },
          { status: 400 }
        );
    }

    console.log('Creating order with amount:', finalAmount, 'currency: INR');

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: finalAmount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        subscriptionType,
        description,
      },
    });

    console.log('Order created successfully:', order.id);

    return NextResponse.json({
      orderId: order.id,
      amount: finalAmount,
      currency: 'INR',
      description,
    });
  } catch (error: any) {
    console.error('Payment order creation error:', error);
    
    // Provide more detailed error information
    if (error.statusCode === 401) {
      return NextResponse.json(
        { error: 'Razorpay authentication failed - API keys may be invalid or expired' },
        { status: 500 }
      );
    }
    
    if (error.error && error.error.description) {
      return NextResponse.json(
        { error: `Razorpay error: ${error.error.description}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to create payment order: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
