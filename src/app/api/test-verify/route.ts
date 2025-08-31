import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Test verification endpoint called');
    
    const body = await request.json();
    console.log('Test request body:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Test verification endpoint working',
      receivedData: body
    });
  } catch (error) {
    console.error('Test verification error:', error);
    return NextResponse.json(
      { error: 'Test verification failed' },
      { status: 500 }
    );
  }
}
