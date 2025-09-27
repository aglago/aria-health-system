import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Consultation from '@/models/Consultation';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Find consultations that need medical attention
    const flaggedConsultations = await Consultation.find({
      $or: [
        { urgency_level: 'high' },
        { urgency_level: 'emergency' },
        { requires_immediate_care: true },
        { confidence_score: { $lt: 0.5 } }, // Low confidence cases
        { symptoms: { $elemMatch: { $regex: /(severe|emergency|urgent|critical)/i } } }
      ],
      status: 'active'
    })
    .populate('patient', 'name student_id email phone')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

    // Transform to flagged cases format
    const flaggedCases = flaggedConsultations.map(consultation => {
      const patient = consultation.patient as any;
      const lastMessage = consultation.messages?.[consultation.messages.length - 1];
      
      return {
        id: consultation._id.toString(),
        studentId: patient?.student_id || consultation.patient_id,
        studentName: patient?.name || 'Unknown Student',
        symptomSummary: consultation.symptoms?.join(', ') || 
                       lastMessage?.content?.substring(0, 100) + '...' || 
                       'Medical attention required',
        dateFlagged: consultation.createdAt,
        severity: consultation.urgency_level === 'emergency' ? 'high' :
                 consultation.urgency_level === 'high' ? 'high' :
                 consultation.requires_immediate_care ? 'high' :
                 consultation.confidence_score < 0.3 ? 'high' :
                 consultation.urgency_level === 'medium' ? 'medium' : 'low',
        consultationId: consultation._id.toString(),
        sessionId: consultation.session_id,
        urgencyLevel: consultation.urgency_level,
        requiresImmediateCare: consultation.requires_immediate_care,
        confidenceScore: consultation.confidence_score
      };
    });

    console.log('📋 Flagged consultations fetched:', {
      total_flagged: flaggedCases.length,
      high_priority: flaggedCases.filter(c => c.severity === 'high').length,
      medium_priority: flaggedCases.filter(c => c.severity === 'medium').length,
      low_priority: flaggedCases.filter(c => c.severity === 'low').length
    });

    return NextResponse.json({ flaggedCases });

  } catch (error) {
    console.error('Error fetching flagged consultations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flagged consultations' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch flagged consultations.' },
    { status: 405 }
  );
}