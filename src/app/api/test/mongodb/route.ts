import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Count managers
    const managerCount = await Manager.countDocuments();
    
    // Get all managers
    const managers = await Manager.find({}).select('name email role isActive');
    
    return NextResponse.json({
      message: 'MongoDB connection successful',
      managerCount,
      managers: managers.map(m => ({
        id: m._id,
        name: m.name,
        email: m.email,
        role: m.role,
        isActive: m.isActive
      }))
    });

  } catch (error: any) {
    console.error('MongoDB test error:', error);
    return NextResponse.json({ 
      error: 'MongoDB connection failed',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
