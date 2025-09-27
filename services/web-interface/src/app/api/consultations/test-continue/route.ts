import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, message } = body;
    
    if (!session_id || !message) {
      return NextResponse.json(
        { error: 'session_id and message are required' },
        { status: 400 }
      );
    }
    
    console.log('🧪 Test: Simulating continue call with session_id:', session_id);
    console.log('🧪 Test: Message:', message);
    
    // Call the actual continue endpoint
    const continueResponse = await fetch(`${request.nextUrl.origin}/api/aria/doctor/continue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id,
        message
      }),
    });
    
    const continueData = await continueResponse.json();
    
    console.log('🧪 Test: Continue endpoint response status:', continueResponse.status);
    console.log('🧪 Test: Continue endpoint response:', {
      session_id: continueData.session_id,
      urgency_level: continueData.urgency_level,
      confidence: continueData.confidence,
      response_preview: continueData.doctor_response?.substring(0, 100) + '...'
    });
    
    // Now check what's in the database
    const debugResponse = await fetch(`${request.nextUrl.origin}/api/consultations/debug/${session_id}`);
    const debugData = await debugResponse.json();
    
    console.log('🧪 Test: Database state after continue call:', {
      messages_count: debugData.consultation?.messages_count,
      status: debugData.consultation?.status
    });
    
    return NextResponse.json({
      test_message: 'Continue endpoint test completed',
      continue_response_status: continueResponse.status,
      continue_response_ok: continueResponse.ok,
      database_messages_count: debugData.consultation?.messages_count,
      session_id,
      message_sent: message
    });
    
  } catch (error) {
    console.error('🧪 Test error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error },
      { status: 500 }
    );
  }
}