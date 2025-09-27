import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/mongodb';
import Consultation from '@/models/Consultation';
import User from '@/models/User';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'aria-secret-key-for-umat-students-2024'
);

// GET /api/consultations - Get consultations
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get authorization token from cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    // Verify and decode token
    let decoded: { id: string; role: string };
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      decoded = payload as { id: string; role: string };
      if (!decoded?.id) {
        return NextResponse.json(
          { error: 'Invalid token payload' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user details
    let user;
    try {
      user = await User.findById(decoded.id);
    } catch {
      user = await User.findOne({ 
        $or: [
          { doctor_id: decoded.id },
          { student_id: decoded.id }
        ]
      });
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    let consultations;
    
    if (user.role === 'doctor') {
      // Doctors can see all consultations or filter by doctor_id
      consultations = await Consultation.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
    } else if (user.role === 'student') {
      // Students can only see their own consultations
      consultations = await Consultation.find({ patient_id: user.student_id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
    } else {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Get total count for pagination
    const totalConsultations = user.role === 'doctor' 
      ? await Consultation.countDocuments({})
      : await Consultation.countDocuments({ patient_id: user.student_id });
    const totalPages = Math.ceil(totalConsultations / limit);

    return NextResponse.json({
      success: true,
      consultations,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_consultations: totalConsultations,
        consultations_per_page: limit,
        has_next: page < totalPages,
        has_previous: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Error fetching consultations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consultations' },
      { status: 500 }
    );
  }
}

// POST /api/consultations - Save a new consultation
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get authorization token from cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    // Verify and decode token
    let decoded: { id: string; role: string };
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      decoded = payload as { id: string; role: string };
      if (!decoded?.id) {
        return NextResponse.json(
          { error: 'Invalid token payload' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user details
    let user;
    try {
      user = await User.findById(decoded.id);
    } catch {
      user = await User.findOne({ 
        $or: [
          { doctor_id: decoded.id },
          { student_id: decoded.id }
        ]
      });
    }
    
    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can create consultations' },
        { status: 403 }
      );
    }

    // Parse request body
    const {
      session_id,
      symptoms,
      diagnosis,
      recommendations,
      urgency_level,
      confidence,
      medical_reasoning,
      messages
    } = await request.json();

    // Create new consultation
    const consultation = new Consultation({
      patient_id: user.student_id, // Use patient_id as expected by the model
      session_id: session_id || `session_${Date.now()}`,
      symptoms: Array.isArray(symptoms) ? symptoms : [symptoms || ''],
      diagnosis_summary: diagnosis || '',
      recommended_actions: Array.isArray(recommendations) ? recommendations : [recommendations || ''],
      urgency_level: urgency_level || 'low',
      confidence_score: confidence || 0,
      medical_reasoning: medical_reasoning || '',
      messages: messages || [],
      status: 'completed',
      appointment_recommended: true,
      requires_immediate_care: urgency_level === 'emergency'
    });

    await consultation.save();

    console.log('✅ Consultation saved successfully:', {
      student_id: user.student_id,
      session_id: consultation.session_id,
      urgency_level: consultation.urgency_level
    });

    return NextResponse.json({
      success: true,
      consultation: {
        id: consultation._id,
        session_id: consultation.session_id,
        created_at: consultation.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error saving consultation:', error);
    return NextResponse.json(
      { error: 'Failed to save consultation' },
      { status: 500 }
    );
  }
}