import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Manager from '@/models/Manager';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get('manager-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const managerId = decoded.managerId;
    
    // Check if manager exists and has permissions
    const manager = await Manager.findById(managerId);
    if (!manager || !manager.isActive) {
      return NextResponse.json({ error: 'Manager access denied' }, { status: 403 });
    }

    if (!manager.permissions || !Array.isArray(manager.permissions) || !manager.permissions.includes('view_analytics')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check database connection and collections
    const mongoose = await import('mongoose');
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
    }
    
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col: any) => col.name);
    
    // Check if Manager collection exists
    const hasManagerCollection = collectionNames.includes('managers');
    const hasUserCollection = collectionNames.includes('users');
    const hasWithdrawalCollection = collectionNames.includes('withdrawalrequests');
    
    // Count documents in each collection
    let managerCount = 0;
    let userCount = 0;
    let withdrawalCount = 0;
    
    try {
      if (hasManagerCollection) {
        managerCount = await Manager.countDocuments();
      }
      
      if (hasUserCollection) {
        userCount = await db.collection('users').countDocuments();
      }
      
      if (hasWithdrawalCollection) {
        withdrawalCount = await db.collection('withdrawalrequests').countDocuments();
      }
    } catch (countError) {
      console.warn('Some collection counts failed:', countError);
      // Continue with partial data
    }

    return NextResponse.json({
      message: 'Database connection test successful',
      collections: collectionNames,
      hasManagerCollection,
      hasUserCollection,
      hasWithdrawalCollection,
      counts: {
        managers: managerCount,
        users: userCount,
        withdrawals: withdrawalCount
      },
      database: db.databaseName,
      manager: {
        id: manager._id,
        name: manager.name,
        role: manager.role,
        permissions: manager.permissions
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Test API error:', error);
    
    // Don't expose stack trace in production
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? { details: error.message || 'Unknown error occurred', stack: error.stack }
      : { details: error.message || 'Unknown error occurred' };
    
    return NextResponse.json({ 
      error: 'Test failed',
      ...errorDetails,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
