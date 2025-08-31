import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    const completedTasks = await Task.find({ 
      userId, 
      status: 'completed' 
    }).sort({ completedAt: -1 });

    return NextResponse.json({
      completedTasks,
      totalCompleted: completedTasks.length,
      totalEarnings: completedTasks.reduce((sum, task) => sum + task.reward, 0)
    });

  } catch (error: any) {
    console.error('Fetch user tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user tasks' },
      { status: 500 }
    );
  }
}
