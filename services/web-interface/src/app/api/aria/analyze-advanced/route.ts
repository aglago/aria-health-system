import { NextRequest, NextResponse } from 'next/server';

// Enhanced analysis request interface for Phase 2
interface AdvancedAnalysisRequest {
  symptoms: string;
  user_id: string;
  medical_context?: {
    age?: number;
    gender?: string;
    medical_history?: string[];
    current_medications?: string[];
    allergies?: string[];
    previous_diagnoses?: Array<{
      diagnosis: string;
      confidence: number;
      date: string;
    }>;
    risk_factors?: string[];
  };
  conversation_history?: Array<{
    role: string;
    content: string;
    timestamp: string;
    analysisResult?: {
      primary_diagnosis?: string;
      confidence?: number;
      urgency_level?: string;
      [key: string]: unknown;
    };
  }>;
  language?: string;
}

// AI Service response interface
interface AIServiceResponse {
  primary_diagnosis: string;
  confidence: number;
  urgency_level: string;
  severity: string;
  differential_diagnoses: Array<{
    condition: string;
    probability: number;
    confidence: number;
    reasoning: string;
  }>;
  risk_assessment: {
    overall_risk_score: number;
    risk_level: string;
    ml_features: {
      symptom_count: number;
      top_symptoms: string[];
      condition_matches: number;
    };
  };
  personalized_advice: string[];
  medication_interactions: string[];
  follow_up_recommendations: string[];
  red_flags: string[];
  cultural_considerations: string[];
  next_steps: string;
  conversation_id: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Phase 2: Advanced analysis endpoint called');
    
    const body: AdvancedAnalysisRequest = await request.json();
    
    // Validate required fields
    if (!body.symptoms || !body.user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: symptoms and user_id are required' },
        { status: 400 }
      );
    }

    // Get AI service URL from environment
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    console.log('🧠 Calling AI Service with Phase 2 data:', {
      user_id: body.user_id,
      symptoms: body.symptoms.substring(0, 100) + '...',
      has_medical_context: !!body.medical_context,
      has_conversation_history: !!body.conversation_history && body.conversation_history.length > 0,
      medical_context_fields: body.medical_context ? Object.keys(body.medical_context) : [],
      conversation_history_length: body.conversation_history?.length || 0
    });

    // Call Phase 2 AI Service /analyze-advanced endpoint
    const aiResponse = await fetch(`${AI_SERVICE_URL}/analyze-advanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symptoms: body.symptoms,
        user_id: body.user_id,
        medical_context: body.medical_context || {},
        conversation_history: body.conversation_history || [],
        language: body.language || 'en'
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ AI Service error:', {
        status: aiResponse.status,
        statusText: aiResponse.statusText,
        error: errorText,
        url: `${AI_SERVICE_URL}/analyze-advanced`
      });
      
      // Return emergency fallback response
      return NextResponse.json({
        primary_diagnosis: "Unable to analyze symptoms at this time",
        confidence: 0.1,
        urgency_level: "medium",
        severity: "unknown",
        differential_diagnoses: [],
        risk_assessment: {
          overall_risk_score: 0.5,
          risk_level: "unknown",
          ml_features: {
            symptom_count: 0,
            top_symptoms: [],
            condition_matches: 0
          }
        },
        personalized_advice: [
          "I'm having trouble analyzing your symptoms right now.",
          "If this is urgent, please seek medical attention immediately.",
          "Try describing your symptoms again in a moment."
        ],
        medication_interactions: [],
        follow_up_recommendations: [
          "Contact UMaT Health Center if symptoms persist",
          "Monitor your symptoms and seek care if they worsen"
        ],
        red_flags: [
          "Seek immediate medical attention if you experience severe symptoms"
        ],
        cultural_considerations: [
          "🏥 UMaT Health Center: +233-312-022-242",
          "🇬🇭 Ghana Emergency Services: 193"
        ],
        next_steps: "Please try again or contact medical services if this is urgent",
        conversation_id: `fallback_${Date.now()}`,
        timestamp: new Date().toISOString(),
        service_status: "fallback_response",
        ai_service_error: true
      }, { status: 200 }); // Return 200 to avoid frontend errors
    }

    const aiData: AIServiceResponse = await aiResponse.json();
    
    console.log('✅ AI Service Phase 2 response received:', {
      primary_diagnosis: aiData.primary_diagnosis,
      confidence: aiData.confidence,
      urgency_level: aiData.urgency_level,
      severity: aiData.severity,
      differential_count: aiData.differential_diagnoses?.length || 0,
      risk_level: aiData.risk_assessment?.risk_level,
      advice_count: aiData.personalized_advice?.length || 0,
      has_medication_interactions: aiData.medication_interactions?.length > 0,
      has_cultural_considerations: aiData.cultural_considerations?.length > 0
    });

    // Enhance response with metadata for Phase 2
    const enhancedResponse = {
      ...aiData,
      service_type: 'intelligent_medical_ai',
      rag_enhanced: true,
      ml_powered: true,
      phase2_features: {
        advanced_reasoning: true,
        medical_context_integration: !!body.medical_context,
        conversation_memory: !!body.conversation_history && body.conversation_history.length > 0,
        ghana_specific_knowledge: true,
        differential_diagnosis: aiData.differential_diagnoses?.length > 0,
        risk_assessment: true,
        medication_interaction_checking: aiData.medication_interactions?.length > 0
      },
      metadata: {
        processed_at: new Date().toISOString(),
        ai_service_url: AI_SERVICE_URL,
        response_enhanced: true,
        user_context: {
          has_medical_history: !!body.medical_context?.medical_history?.length,
          has_medications: !!body.medical_context?.current_medications?.length,
          has_allergies: !!body.medical_context?.allergies?.length,
          conversation_depth: body.conversation_history?.length || 0
        }
      }
    };

    // Log successful analysis for Phase 2 monitoring
    console.log('📊 Phase 2 Advanced Analysis completed:', {
      user_id: body.user_id,
      primary_diagnosis: enhancedResponse.primary_diagnosis,
      confidence: enhancedResponse.confidence,
      urgency: enhancedResponse.urgency_level,
      ml_powered: true,
      context_enhanced: enhancedResponse.phase2_features.medical_context_integration,
      memory_enhanced: enhancedResponse.phase2_features.conversation_memory
    });

    return NextResponse.json(enhancedResponse);

  } catch (error) {
    console.error('❌ Phase 2 Advanced analysis error:', error);
    
    // Return comprehensive emergency fallback
    return NextResponse.json({
      primary_diagnosis: "System temporarily unavailable",
      confidence: 0.0,
      urgency_level: "high", // Default to high for safety
      severity: "unknown",
      differential_diagnoses: [],
      risk_assessment: {
        overall_risk_score: 0.0,
        risk_level: "unknown",
        ml_features: {
          symptom_count: 0,
          top_symptoms: [],
          condition_matches: 0
        }
      },
      personalized_advice: [
        "I'm unable to analyze your symptoms right now due to a system error.",
        "If this is a medical emergency, seek immediate medical attention.",
        "Please contact UMaT Health Services or try again later."
      ],
      medication_interactions: [],
      follow_up_recommendations: [
        "Contact UMaT Health Center: +233-312-022-242",
        "For emergencies, call Ghana Ambulance: 193"
      ],
      red_flags: [
        "If experiencing severe symptoms, seek immediate medical care",
        "Do not delay emergency treatment"
      ],
      cultural_considerations: [
        "🏥 UMaT Health Center available during business hours",
        "🇬🇭 Emergency services available 24/7: Call 193"
      ],
      next_steps: "Please seek appropriate medical care or try the system again later",
      conversation_id: `error_${Date.now()}`,
      timestamp: new Date().toISOString(),
      service_status: "error_fallback",
      error: true
    }, { status: 200 }); // Return 200 to prevent frontend error handling
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST for advanced symptom analysis.' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST for advanced symptom analysis.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST for advanced symptom analysis.' },
    { status: 405 }
  );
}