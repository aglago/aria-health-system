import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Consultation from '@/models/Consultation';

// Doctor conversation interfaces
interface DoctorStartRequest {
  user_id: string;
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
  show_choice_buttons?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🩺 Phase 2: Doctor chat start endpoint called');
    
    const body: DoctorStartRequest = await request.json();
    
    // Validate required fields
    if (!body.user_id || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id and message are required' },
        { status: 400 }
      );
    }

    // Get AI service URL from environment
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    console.log('🩺 Starting doctor conversation:', {
      user_id: body.user_id,
      message: body.message.substring(0, 100) + '...',
      ai_service_url: AI_SERVICE_URL
    });

    // Call Phase 2 AI Service /doctor/start endpoint
    const aiResponse = await fetch(`${AI_SERVICE_URL}/doctor/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: body.user_id,
        message: body.message
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ AI Service doctor/start error:', {
        status: aiResponse.status,
        statusText: aiResponse.statusText,
        error: errorText
      });
      
      // Return service unavailable fallback response
      return NextResponse.json({
        session_id: `fallback_${body.user_id}_${Date.now()}`,
        doctor_response: "I'm sorry, but I'm having trouble connecting to the medical AI service right now. If this is a medical emergency, please contact UMaT Health Services immediately at +233-312-022-242 or call Ghana Emergency Services at 193.",
        follow_up_questions: [
          "Is this a medical emergency?",
          "Would you like me to provide emergency contact numbers?"
        ],
        urgency_level: "medium",
        requires_immediate_care: false,
        confidence: 0.0,
        medical_reasoning: "System temporarily unavailable - service connectivity issue",
        timestamp: new Date().toISOString(),
        service_status: "fallback_response",
        ai_service_error: true
      }, { status: 200 });
    }

    const aiData: DoctorResponse = await aiResponse.json();
    
    console.log('✅ Doctor conversation started successfully:', {
      session_id: aiData.session_id,
      urgency_level: aiData.urgency_level,
      confidence: aiData.confidence,
      follow_up_questions_count: aiData.follow_up_questions?.length || 0,
      requires_immediate_care: aiData.requires_immediate_care
    });

    // Save consultation session to database
    try {
      await connectToDatabase();
      
      const consultation = new Consultation({
        session_id: aiData.session_id,
        patient_id: body.user_id,
        messages: [
          {
            role: 'user',
            content: body.message,
            timestamp: new Date()
          },
          {
            role: 'assistant', 
            content: aiData.doctor_response,
            timestamp: new Date()
          }
        ],
        symptoms: [], // Will be populated as conversation continues
        urgency_level: aiData.urgency_level as 'low' | 'medium' | 'high' | 'emergency',
        requires_immediate_care: aiData.requires_immediate_care,
        confidence_score: aiData.confidence,
        medical_reasoning: aiData.medical_reasoning,
        recommended_actions: [],
        appointment_recommended: false,
        status: 'active'
      });

      await consultation.save();
      
      console.log('💾 Consultation session saved to database:', {
        consultation_id: consultation._id,
        session_id: consultation.session_id,
        patient_id: consultation.patient_id
      });

    } catch (dbError) {
      console.error('❌ Failed to save consultation to database:', dbError);
      // Continue with the response even if database save fails
    }

    // Enhance response with Phase 2 metadata
    const enhancedResponse = {
      ...aiData,
      service_type: 'intelligent_doctor',
      rag_enhanced: true,
      conversation_ai: true,
      phase2_features: {
        multi_turn_conversation: true,
        medical_knowledge_integration: true,
        context_awareness: true,
        emergency_detection: true,
        ghana_specific_guidance: true
      },
      metadata: {
        processed_at: new Date().toISOString(),
        ai_service_url: AI_SERVICE_URL,
        conversation_type: 'doctor_chat',
        initial_message: true
      }
    };

    return NextResponse.json(enhancedResponse);

  } catch (error) {
    console.error('❌ Doctor conversation start error:', error);
    
    // Return service error fallback
    return NextResponse.json({
      session_id: `error_${Date.now()}`,
      doctor_response: "I apologize, but I'm experiencing technical difficulties right now. Please try again in a few minutes. If you have urgent medical concerns, you can contact UMaT Health Services directly.\n\n🏥 UMaT Health Center: +233-312-022-242\n🚨 Emergency Services: 193\n👮 Campus Security: +233-312-022-240",
      follow_up_questions: [
        "Do you need emergency medical attention?",
        "Would you like to try again later?"
      ],
      urgency_level: "low",
      requires_immediate_care: false,
      confidence: 0.0,
      medical_reasoning: "Technical service error - not a medical emergency",
      timestamp: new Date().toISOString(),
      service_status: "error_fallback",
      error: true
    }, { status: 200 });
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to start doctor conversation.' },
    { status: 405 }
  );
}