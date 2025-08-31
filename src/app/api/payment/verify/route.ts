import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import WalletTransaction from '@/models/WalletTransaction';

export async function POST(request: NextRequest) {
  try {
    console.log('Payment verification endpoint called');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subscriptionType,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !subscriptionType) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required payment fields' },
        { status: 400 }
      );
    }

    console.log('Verifying payment signature...');
    
    // Verify the payment signature
    const expectedBody = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(expectedBody)
      .digest('hex');

    console.log('Expected signature:', expectedSignature);
    console.log('Received signature:', razorpay_signature);

    if (expectedSignature === razorpay_signature) {
      console.log('Payment signature verified successfully');
      
      try {
        await connectDB();
        console.log('Database connected');
        
        // Get user from JWT token
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        
        if (!token) {
          console.log('No auth token found');
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        console.log('JWT token found, verifying...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const userId = decoded.userId;
        console.log('User ID from token:', userId);

        // Calculate monthly returns and subscription amount based on subscription type
        let monthlyReturns = 0;
        let subscriptionAmount = 0;
        switch (subscriptionType) {
          case 'VIP1': 
            monthlyReturns = 900; 
            subscriptionAmount = 900;
            break;
          case 'VIP2': 
            monthlyReturns = 3000; 
            subscriptionAmount = 3000;
            break;
          case 'VIP3': 
            monthlyReturns = 11000; 
            subscriptionAmount = 11000;
            break;
          default:
            console.log('Invalid subscription type:', subscriptionType);
            return NextResponse.json(
              { error: 'Invalid subscription type' },
              { status: 400 }
            );
        }

        console.log('Updating user subscription...');
        console.log('Subscription details:', { subscriptionType, monthlyReturns, subscriptionAmount });
        
        // Validate subscription amount
        if (subscriptionAmount <= 0) {
          console.log('Invalid subscription amount:', subscriptionAmount);
          return NextResponse.json(
            { error: 'Invalid subscription amount' },
            { status: 400 }
          );
        }
        
        // Calculate VIP expiry date (1 year from now)
        const vipExpiryDate = new Date();
        vipExpiryDate.setFullYear(vipExpiryDate.getFullYear() + 1);

        // Update user's VIP level and subscription details
        console.log('Updating user with VIP details:', {
          vipLevel: subscriptionType,
          monthlyReturns,
          vipStatus: 'active',
          vipExpiryDate
        });
        
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          {
            vipLevel: subscriptionType,
            subscriptionDate: new Date(),
            monthlyReturns: monthlyReturns,
            vipStatus: 'active',
            vipExpiryDate: vipExpiryDate,
            $push: {
              vipPurchaseHistory: {
                level: subscriptionType,
                purchaseDate: new Date(),
                amount: subscriptionAmount,
                transactionId: razorpay_payment_id
              }
            }
            // Don't reset totalEarnings - preserve existing earnings
          },
          { new: true }
        );

        if (!updatedUser) {
          console.log('User not found in database');
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Record VIP subscription transaction
        console.log('Creating VIP subscription transaction:', {
          userId: updatedUser._id,
          amount: -subscriptionAmount,
          description: `${subscriptionType} Subscription Payment`
        });
        
        const transaction = new WalletTransaction({
          userId: updatedUser._id,
          type: 'vip_subscription',
          amount: -subscriptionAmount, // Negative amount for payment
          description: `${subscriptionType} Subscription Payment`,
          balanceAfter: 0, // Will be calculated from transactions
          reference: `vip_${subscriptionType}_${Date.now()}`
        });
        
        try {
          await transaction.save();
          console.log('VIP subscription transaction saved successfully');
        } catch (transactionError) {
          console.error('Failed to save transaction:', transactionError);
          // Continue with the response even if transaction save fails
        }

        console.log('User updated successfully:', updatedUser.vipLevel);
        
        return NextResponse.json({
          success: true,
          message: 'Payment verified and subscription activated successfully',
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          subscriptionType,
          vipLevel: updatedUser.vipLevel,
          monthlyReturns: updatedUser.monthlyReturns
        });

      } catch (dbError) {
        console.error('Database update error:', dbError);
        return NextResponse.json(
          { error: 'Payment verified but failed to update subscription' },
          { status: 500 }
        );
      }
    } else {
      console.log('Invalid payment signature');
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
