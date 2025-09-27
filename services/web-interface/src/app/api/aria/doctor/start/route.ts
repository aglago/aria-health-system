import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Consultation from '@/models/Consultation';
import { MedicalDataExtractor, mergeConsultationData } from '@/lib/medical-data-extractor';

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
  
  // Comprehensive Medical Assessment Fields
  symptoms?: string[];
  symptom_duration?: string;
  symptom_severity?: 'mild' | 'moderate' | 'severe';
  symptom_onset?: string;
  
  diagnosis_summary?: string;
  primary_concern?: string;
  differential_diagnosis?: string[];
  
  vital_signs?: {
    temperature?: string;
    blood_pressure?: string;
    heart_rate?: string;
    respiratory_rate?: string;
  };
  reported_pain_level?: number;
  
  relevant_medical_history?: string[];
  current_medications_mentioned?: string[];
  allergies_mentioned?: string[];
  family_history_relevant?: string[];
  
  recommended_actions?: string[];
  suggested_tests?: string[];
  red_flags?: string[];
  when_to_seek_immediate_care?: string[];
  
  appointment_urgency?: 'routine' | 'urgent' | 'emergent';
  pre_appointment_instructions?: string[];
  
  knowledge_base_references?: string[];
  clinical_guidelines_used?: string[];
  rag_context?: any;
  
  consultation_completeness?: number;
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
      
      // Check if consultation already exists
      let consultation = await Consultation.findOne({ session_id: aiData.session_id });
      
      if (consultation) {
        console.log('📝 Existing consultation found, updating with new conversation:', {
          session_id: consultation.session_id,
          existing_messages: consultation.messages.length
        });
        
        // Add new messages to existing conversation
        consultation.messages.push(
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
        );
      } else {
        console.log('✨ Creating new consultation record');
        consultation = new Consultation({
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
        // Symptom Analysis
        symptoms: aiData.symptoms || [],
        symptom_duration: aiData.symptom_duration,
        symptom_severity: aiData.symptom_severity,
        symptom_onset: aiData.symptom_onset,
        
        // Medical Assessment
        diagnosis_summary: aiData.diagnosis_summary,
        primary_concern: aiData.primary_concern,
        differential_diagnosis: aiData.differential_diagnosis || [],
        urgency_level: aiData.urgency_level as 'low' | 'medium' | 'high' | 'emergency',
        requires_immediate_care: aiData.requires_immediate_care,
        confidence_score: aiData.confidence,
        medical_reasoning: aiData.medical_reasoning,
        
        // Clinical Information
        vital_signs: aiData.vital_signs,
        reported_pain_level: aiData.reported_pain_level,
        
        // Medical History Context
        relevant_medical_history: aiData.relevant_medical_history || [],
        current_medications_mentioned: aiData.current_medications_mentioned || [],
        allergies_mentioned: aiData.allergies_mentioned || [],
        family_history_relevant: aiData.family_history_relevant || [],
        
        // Assessment and Plan
        recommended_actions: aiData.recommended_actions || [],
        suggested_tests: aiData.suggested_tests || [],
        red_flags: aiData.red_flags || [],
        when_to_seek_immediate_care: aiData.when_to_seek_immediate_care || [],
        
        // Appointment Context
        appointment_recommended: !!aiData.show_appointment_button,
        appointment_urgency: aiData.appointment_urgency,
        pre_appointment_instructions: aiData.pre_appointment_instructions || [],
        
        // RAG and Knowledge Base
        knowledge_base_references: aiData.knowledge_base_references || [],
        clinical_guidelines_used: aiData.clinical_guidelines_used || [],
        rag_context: aiData.rag_context,
        
          // Session Management
          status: 'active',
          consultation_completeness: aiData.consultation_completeness || 0
        });
      }
      
      // Update/set consultation fields for both existing and new consultations
      consultation.urgency_level = aiData.urgency_level as 'low' | 'medium' | 'high' | 'emergency';
      consultation.requires_immediate_care = aiData.requires_immediate_care;
      consultation.confidence_score = aiData.confidence;
      consultation.medical_reasoning = aiData.medical_reasoning;
      
      // Update comprehensive medical data
      if (aiData.symptoms && aiData.symptoms.length > 0) {
        const existingSymptoms = consultation.symptoms || [];
        const newSymptoms = aiData.symptoms.filter(s => !existingSymptoms.includes(s));
        consultation.symptoms = [...existingSymptoms, ...newSymptoms];
      }
      
      if (aiData.symptom_duration) consultation.symptom_duration = aiData.symptom_duration;
      if (aiData.symptom_severity) consultation.symptom_severity = aiData.symptom_severity;
      if (aiData.symptom_onset) consultation.symptom_onset = aiData.symptom_onset;
      if (aiData.diagnosis_summary) consultation.diagnosis_summary = aiData.diagnosis_summary;
      if (aiData.primary_concern) consultation.primary_concern = aiData.primary_concern;
      if (aiData.differential_diagnosis) consultation.differential_diagnosis = aiData.differential_diagnosis;
      if (aiData.vital_signs) consultation.vital_signs = aiData.vital_signs;
      if (aiData.reported_pain_level !== undefined) consultation.reported_pain_level = aiData.reported_pain_level;
      
      // Update arrays
      if (aiData.relevant_medical_history) consultation.relevant_medical_history = aiData.relevant_medical_history;
      if (aiData.current_medications_mentioned) consultation.current_medications_mentioned = aiData.current_medications_mentioned;
      if (aiData.allergies_mentioned) consultation.allergies_mentioned = aiData.allergies_mentioned;
      if (aiData.family_history_relevant) consultation.family_history_relevant = aiData.family_history_relevant;
      if (aiData.recommended_actions) consultation.recommended_actions = aiData.recommended_actions;
      if (aiData.suggested_tests) consultation.suggested_tests = aiData.suggested_tests;
      if (aiData.red_flags) consultation.red_flags = aiData.red_flags;
      if (aiData.when_to_seek_immediate_care) consultation.when_to_seek_immediate_care = aiData.when_to_seek_immediate_care;
      
      // Update appointment context
      if (aiData.show_appointment_button) consultation.appointment_recommended = true;
      if (aiData.appointment_urgency) consultation.appointment_urgency = aiData.appointment_urgency;
      if (aiData.pre_appointment_instructions) consultation.pre_appointment_instructions = aiData.pre_appointment_instructions;
      
      // Update RAG context
      if (aiData.knowledge_base_references) consultation.knowledge_base_references = aiData.knowledge_base_references;
      if (aiData.clinical_guidelines_used) consultation.clinical_guidelines_used = aiData.clinical_guidelines_used;
      if (aiData.rag_context) consultation.rag_context = aiData.rag_context;

      // Extract additional medical data from the conversation
      const extractedData = MedicalDataExtractor.extractMedicalData(
        consultation.messages,
        aiData.doctor_response,
        {
          symptoms: consultation.symptoms,
          differential_diagnosis: consultation.differential_diagnosis,
          relevant_medical_history: consultation.relevant_medical_history,
          current_medications_mentioned: consultation.current_medications_mentioned,
          allergies_mentioned: consultation.allergies_mentioned,
          family_history_relevant: consultation.family_history_relevant,
          suggested_tests: consultation.suggested_tests,
          red_flags: consultation.red_flags,
          when_to_seek_immediate_care: consultation.when_to_seek_immediate_care,
          pre_appointment_instructions: consultation.pre_appointment_instructions,
          knowledge_base_references: consultation.knowledge_base_references,
          clinical_guidelines_used: consultation.clinical_guidelines_used
        }
      );

      // Merge extracted data with consultation
      const mergedData = mergeConsultationData(consultation.toObject(), extractedData);
      
      // Update consultation with merged data
      Object.keys(extractedData).forEach(key => {
        if (mergedData[key] !== undefined) {
          (consultation as any)[key] = mergedData[key];
        }
      });

      // Calculate consultation completeness
      consultation.consultation_completeness = Math.max(
        consultation.consultation_completeness || 0,
        calculateConsultationCompleteness(consultation)
      );

      await consultation.save();
      
      console.log('💾 Consultation session saved to database:', {
        consultation_id: consultation._id,
        session_id: consultation.session_id,
        patient_id: consultation.patient_id,
        symptoms_count: consultation.symptoms?.length || 0,
        completeness_score: consultation.consultation_completeness
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

/**
 * Calculate consultation completeness score based on captured medical data
 */
function calculateConsultationCompleteness(consultation: any): number {
  let score = 0;
  const maxScore = 100;
  
  // Basic information (30 points)
  if (consultation.symptoms && consultation.symptoms.length > 0) score += 10;
  if (consultation.urgency_level) score += 10;
  if (consultation.medical_reasoning) score += 10;
  
  // Detailed symptom analysis (20 points)
  if (consultation.symptom_duration) score += 5;
  if (consultation.symptom_severity) score += 5;
  if (consultation.symptom_onset) score += 5;
  if (consultation.primary_concern) score += 5;
  
  // Clinical information (20 points)
  if (consultation.vital_signs && Object.keys(consultation.vital_signs).length > 0) score += 10;
  if (consultation.reported_pain_level !== undefined) score += 5;
  if (consultation.differential_diagnosis && consultation.differential_diagnosis.length > 0) score += 5;
  
  // Medical history (15 points)
  if (consultation.relevant_medical_history && consultation.relevant_medical_history.length > 0) score += 5;
  if (consultation.current_medications_mentioned && consultation.current_medications_mentioned.length > 0) score += 5;
  if (consultation.allergies_mentioned && consultation.allergies_mentioned.length > 0) score += 5;
  
  // Assessment and recommendations (15 points)
  if (consultation.recommended_actions && consultation.recommended_actions.length > 0) score += 5;
  if (consultation.suggested_tests && consultation.suggested_tests.length > 0) score += 5;
  if (consultation.when_to_seek_immediate_care && consultation.when_to_seek_immediate_care.length > 0) score += 5;
  
  return Math.min(score, maxScore);
}