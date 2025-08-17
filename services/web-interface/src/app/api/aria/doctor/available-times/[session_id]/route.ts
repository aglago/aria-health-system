import { NextRequest, NextResponse } from 'next/server';

interface AppointmentTime {
  time: string;
  datetime?: string;
  type: string;
  doctor?: string;
  room?: string;
  note?: string;
}

interface AvailableTimesResponse {
  status: string;
  session_id: string;
  assessment_summary: {
    severity_score: number;
    priority_level: string;
    severity_level: string;
  };
  available_times: AppointmentTime[];
  booking_instructions: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    // Await params as required by Next.js 15
    const { session_id: encoded_session_id } = await params;
    // URL decode the session ID in case it contains special characters
    const session_id = decodeURIComponent(encoded_session_id);
    
    console.log('🗓️ Getting available appointment times for session:', session_id);

    if (!session_id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get AI service URL from environment
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    // Call AI service to get available appointment times
    const aiResponse = await fetch(`${AI_SERVICE_URL}/doctor/available-times/${session_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ AI Service available-times error:', {
        status: aiResponse.status,
        statusText: aiResponse.statusText,
        error: errorText,
        session_id
      });
      
      // Handle session not found
      if (aiResponse.status === 404) {
        return NextResponse.json({
          error: 'Session not found or expired',
          message: 'Your consultation session has expired. You can either start a new consultation or contact UMaT Health Center directly to schedule an appointment.',
          suggestions: [
            'Start a new consultation with Dr. ARIA',
            'Call UMaT Health Center directly for appointment booking'
          ],
          fallback_contact: {
            health_center: '+233-312-022-242',
            appointment_booking: '+233-312-022-245',
            emergency: '193'
          }
        }, { status: 404 });
      }
      
      // General error fallback
      return NextResponse.json({
        error: 'Unable to fetch available appointment times',
        message: 'Please contact UMaT Health Center directly to schedule your appointment',
        contact_info: {
          health_center: '+233-312-022-242',
          appointment_booking: '+233-312-022-245'
        }
      }, { status: 500 });
    }

    const timesData: AvailableTimesResponse = await aiResponse.json();
    
    console.log('✅ Available appointment times retrieved:', {
      session_id: timesData.session_id,
      priority_level: timesData.assessment_summary.priority_level,
      severity_score: timesData.assessment_summary.severity_score,
      available_slots: timesData.available_times.length
    });

    // Enhance response with web interface metadata
    const enhancedResponse = {
      ...timesData,
      web_interface_metadata: {
        processed_at: new Date().toISOString(),
        ai_service_url: AI_SERVICE_URL,
        appointment_booking_enabled: true
      }
    };

    return NextResponse.json(enhancedResponse);

  } catch (error) {
    console.error('❌ Available appointment times error:', error);
    
    return NextResponse.json({
      error: 'System error while fetching appointment times',
      message: 'Please contact UMaT Health Center directly',
      contact_info: {
        health_center: '+233-312-022-242',
        emergency: '193'
      }
    }, { status: 500 });
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch available appointment times.' },
    { status: 405 }
  );
}