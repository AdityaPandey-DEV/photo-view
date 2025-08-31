import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, password, phone } = await request.json();

    // Validation
    if (!name || !password || !phone) {
      return NextResponse.json(
        { error: 'Name, phone number, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this phone number already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const user = new User({
      name,
      phone,
      password
    });

    await user.save();

    // Remove password from response
    const userResponse = {
      id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt
    };

    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user: userResponse
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
