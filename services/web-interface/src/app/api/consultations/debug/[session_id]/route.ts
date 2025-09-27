import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Consultation from '@/models/Consultation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    await connectToDatabase();
    const { session_id } = await params;
    
    console.log('🔍 Debug: Looking for consultation with session_id:', session_id);
    
    // Find consultation
    const consultation = await Consultation.findOne({ session_id })
      .lean();
    
    if (!consultation) {
      console.log('❌ Debug: No consultation found with session_id:', session_id);
      
      // Let's check all consultations to see what we have
      const allConsultations = await Consultation.find({})
        .select('session_id patient_id messages createdAt')
        .lean();
      
      console.log('📋 Debug: All consultations in database:', allConsultations.map(c => ({
        session_id: c.session_id,
        patient_id: c.patient_id,
        messages_count: c.messages?.length || 0,
        created: c.createdAt
      })));
      
      return NextResponse.json({ 
        error: 'Consultation not found',
        searched_session_id: session_id,
        all_consultations: allConsultations.map(c => ({
          session_id: c.session_id,
          messages_count: c.messages?.length || 0
        }))
      }, { status: 404 });
    }
    
    console.log('✅ Debug: Found consultation:', {
      session_id: consultation.session_id,
      patient_id: consultation.patient_id,
      messages_count: consultation.messages?.length || 0,
      symptoms_count: consultation.symptoms?.length || 0,
      status: consultation.status,
      created: consultation.createdAt,
      updated: consultation.updatedAt
    });
    
    return NextResponse.json({
      consultation: {
        session_id: consultation.session_id,
        patient_id: consultation.patient_id,
        messages_count: consultation.messages?.length || 0,
        messages: consultation.messages?.map((msg, index) => ({
          index,
          role: msg.role,
          content_preview: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
          timestamp: msg.timestamp
        })),
        symptoms: consultation.symptoms || [],
        medical_reasoning: consultation.medical_reasoning,
        diagnosis_summary: consultation.diagnosis_summary,
        status: consultation.status,
        consultation_completeness: consultation.consultation_completeness,
        created: consultation.createdAt,
        updated: consultation.updatedAt
      }
    });
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to debug consultation', details: error },
      { status: 500 }
    );
  }
}