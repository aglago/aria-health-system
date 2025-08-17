import { NextRequest, NextResponse } from 'next/server';

// Doctor conversation interfaces
interface DoctorContinueRequest {
  session_id: string;
  message: string;
}

interface DoctorResponse {
  session_id: string;
  doctor_response: string;
  follow_up_questions: string[];
  urgency_level: string;
  requires_immediate_care: boolean;
  confidence: number;
  medical_reasoning: string;
  timestamp: string;
  show_appointment_button?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🩺 Phase 2: Doctor chat continue endpoint called');
    
    const body: DoctorContinueRequest = await request.json();
    
    // Validate required fields
    if (!body.session_id || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id and message are required' },
        { status: 400 }
      );
    }

    // Get AI service URL from environment
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    console.log('🩺 Continuing doctor conversation:', {
      session_id: body.session_id,
      message: body.message.substring(0, 100) + '...',
      ai_service_url: AI_SERVICE_URL
    });

    // Call Phase 2 AI Service /doctor/continue endpoint
    const aiResponse = await fetch(`${AI_SERVICE_URL}/doctor/continue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: body.session_id,
        message: body.message
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ AI Service doctor/continue error:', {
        status: aiResponse.status,
        statusText: aiResponse.statusText,
        error: errorText,
        session_id: body.session_id
      });
      
      // Handle specific errors
      if (aiResponse.status === 404) {
        return NextResponse.json({
          session_id: body.session_id,
          doctor_response: "I'm sorry, but I seem to have lost track of our conversation. This sometimes happens when there's been a long pause. Let's start fresh - could you please tell me again what's concerning you?",
          follow_up_questions: [
            "What symptoms are you experiencing?",
            "How long have you been feeling this way?"
          ],
          urgency_level: "medium",
          requires_immediate_care: false,
          confidence: 0.3,
          medical_reasoning: "Session expired - restarting conversation context",
          timestamp: new Date().toISOString(),
          service_status: "session_not_found",
          session_error: true
        }, { status: 200 });
      }
      
      // General error fallback
      return NextResponse.json({
        session_id: body.session_id,
        doctor_response: "I'm having trouble processing your message right now. If this is urgent, please contact UMaT Health Services immediately.\n\n🏥 UMaT Health Center: +233-312-022-242\n🚨 Emergency: 193",
        follow_up_questions: [
          "Is this a medical emergency?",
          "Would you like emergency contact information?"
        ],
        urgency_level: "high",
        requires_immediate_care: true,
        confidence: 0.0,
        medical_reasoning: "System temporarily unavailable - defaulting to safety protocol",
        timestamp: new Date().toISOString(),
        service_status: "fallback_response",
        ai_service_error: true
      }, { status: 200 });
    }

    const aiData: DoctorResponse = await aiResponse.json();
    
    console.log('✅ Doctor conversation continued successfully:', {
      session_id: aiData.session_id,
      urgency_level: aiData.urgency_level,
      confidence: aiData.confidence,
      follow_up_questions_count: aiData.follow_up_questions?.length || 0,
      requires_immediate_care: aiData.requires_immediate_care,
      urgency_escalation: aiData.urgency_level === 'high' || aiData.urgency_level === 'emergency'
    });

    // Enhance response with Phase 2 metadata
    const enhancedResponse = {
      ...aiData,
      service_type: 'intelligent_doctor',
      rag_enhanced: true,
      conversation_ai: true,
      phase2_features: {
        multi_turn_conversation: true,
        context_awareness: true,
        conversation_memory: true,
        progressive_diagnosis: true,
        urgency_tracking: true,
        medical_reasoning: true
      },
      metadata: {
        processed_at: new Date().toISOString(),
        ai_service_url: AI_SERVICE_URL,
        conversation_type: 'doctor_chat_continuation',
        context_preserved: true
      }
    };

    return NextResponse.json(enhancedResponse);

  } catch (error) {
    console.error('❌ Doctor conversation continue error:', error);
    
    // Return comprehensive emergency fallback
    return NextResponse.json({
      session_id: `error_${Date.now()}`,
      doctor_response: "I apologize, but I'm experiencing technical difficulties right now. For your safety, please contact UMaT Health Services if you have medical concerns.\n\n🏥 UMaT Health Center: +233-312-022-242\n🚨 Emergency Services: 193\n👮 Campus Security: +233-312-022-240",
      follow_up_questions: [
        "Do you need immediate medical attention?",
        "Should I provide more emergency contacts?"
      ],
      urgency_level: "high",
      requires_immediate_care: true,
      confidence: 0.0,
      medical_reasoning: "System error during conversation - prioritizing safety",
      timestamp: new Date().toISOString(),
      service_status: "error_fallback",
      error: true
    }, { status: 200 });
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to continue doctor conversation.' },
    { status: 405 }
  );
}