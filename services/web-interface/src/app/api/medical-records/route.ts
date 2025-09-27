import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/mongodb';
import MedicalRecord from '@/models/MedicalRecord';
import Appointment from '@/models/Appointment';
import Consultation from '@/models/Consultation';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'aria-secret-key-for-umat-students-2024'
);

// GET /api/medical-records - Fetch medical records (filtered by user role)
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

    // Get user details - handle both ObjectId and doctor_id/student_id
    const UserModel = (await import('@/models/User')).default;
    let user;
    try {
      // Try finding by MongoDB ObjectId first
      user = await UserModel.findById(decoded.id);
    } catch {
      // If ObjectId cast fails, try finding by doctor_id or student_id field
      user = await UserModel.findOne({ 
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
    const patientId = url.searchParams.get('patient_id');
    const doctorId = url.searchParams.get('doctor_id');
    const status = url.searchParams.get('status');
    const recordType = url.searchParams.get('record_type');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const page = parseInt(url.searchParams.get('page') || '1');

    // Build query based on user role and parameters
    const query: Record<string, any> = {};

    if (user.role === 'student') {
      // Students can only see their own records
      query.patient_id = user.student_id;
    } else if (user.role === 'doctor') {
      // Doctors can see records they created, or specific patient records
      if (patientId) {
        query.patient_id = patientId;
      } else {
        query.doctor_id = user.doctor_id;
      }
    } else {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Add additional filters
    if (status) query.status = status;
    if (recordType) query.record_type = recordType;
    if (doctorId && user.role !== 'student') query.doctor_id = doctorId;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch medical records with pagination
    const records = await MedicalRecord.find(query)
      .sort({ record_date: -1 })
      .limit(limit)
      .skip(skip);

    // Manually populate patient and doctor data since we're using string references
    const UserPopulateModel = (await import('@/models/User')).default;
    const Appointment = (await import('@/models/Appointment')).default;
    
    const populatedRecords = await Promise.all(
      records.map(async (record) => {
        const recordObj = record.toObject();
        
        // Find patient by student_id
        const patient = await UserPopulateModel.findOne({ student_id: record.patient_id });
        if (patient) {
          recordObj.patient = {
            name: patient.name,
            student_id: patient.student_id,
            email: patient.email
          };
        }
        
        // Find doctor by doctor_id  
        const doctor = await UserPopulateModel.findOne({ doctor_id: record.doctor_id });
        if (doctor) {
          recordObj.doctor = {
            name: doctor.name,
            doctor_id: doctor.doctor_id,
            specialization: doctor.specialization
          };
        }
        
        // Find appointment details
        if (record.appointment_id) {
          const appointment = await Appointment.findById(record.appointment_id);
          if (appointment) {
            recordObj.appointment = {
              date: appointment.date,
              time: appointment.time,
              type: appointment.type,
              status: appointment.status
            };
          }
        }
        
        return recordObj;
      })
    );

    // Get total count for pagination
    const totalRecords = await MedicalRecord.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limit);

    return NextResponse.json({
      success: true,
      records: populatedRecords,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_records: totalRecords,
        records_per_page: limit,
        has_next: page < totalPages,
        has_previous: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Error fetching medical records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medical records' },
      { status: 500 }
    );
  }
}

// POST /api/medical-records - Create new medical record
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

    // Get user details - handle both ObjectId and doctor_id/student_id
    const UserModel = (await import('@/models/User')).default;
    let user;
    try {
      // Try finding by MongoDB ObjectId first
      user = await UserModel.findById(decoded.id);
    } catch {
      // If ObjectId cast fails, try finding by doctor_id or student_id field
      user = await UserModel.findOne({ 
        $or: [
          { doctor_id: decoded.id },
          { student_id: decoded.id }
        ]
      });
    }
    
    if (!user || user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can create medical records' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { appointment_id, ...recordData } = body;

    // Validate required fields
    if (!appointment_id) {
      return NextResponse.json(
        { error: 'appointment_id is required' },
        { status: 400 }
      );
    }

    // Check if appointment exists and doctor has access
    const appointment = await Appointment.findById(appointment_id);
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (appointment.doctor_id !== user.doctor_id) {
      return NextResponse.json(
        { error: 'You can only create records for your own appointments' },
        { status: 403 }
      );
    }

    // Check if medical record already exists for this appointment
    const existingRecord = await MedicalRecord.findOne({ appointment_id });
    if (existingRecord) {
      return NextResponse.json(
        { error: 'Medical record already exists for this appointment' },
        { status: 409 }
      );
    }

    // Get consultation data if available
    let consultationData = {};
    if (appointment.consultation_id) {
      const consultation = await Consultation.findOne({ 
        session_id: appointment.consultation_id 
      });
      
      if (consultation) {
        consultationData = {
          consultation_id: consultation.session_id,
          dr_aria_consultation_summary: consultation.diagnosis_summary || 'No summary available',
          symptoms_reported_to_aria: consultation.symptoms || []
        };
      }
    }

    // Create medical record
    const medicalRecord = new MedicalRecord({
      // Link to appointment and patient
      appointment_id: appointment._id.toString(),
      patient_id: appointment.patient_id,
      visit_date: appointment.date,
      
      // Doctor information
      doctor_id: user.doctor_id,
      doctor_name: user.name,
      
      // Audit trail
      created_by: user.doctor_id,
      created_by_name: user.name,
      
      // Dr. ARIA integration
      ...consultationData,
      
      // Record data from request
      ...recordData
    });

    await medicalRecord.save();

    // Update appointment to mark that medical record was created
    appointment.status = 'completed';
    await appointment.save();

    console.log('✅ Medical record created successfully:', {
      record_id: medicalRecord._id,
      appointment_id: appointment_id,
      patient_id: appointment.patient_id,
      doctor_id: user.doctor_id,
      diagnosis: medicalRecord.final_diagnosis
    });

    return NextResponse.json({
      success: true,
      message: 'Medical record created successfully',
      record: medicalRecord
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating medical record:', error);
    return NextResponse.json(
      { error: 'Failed to create medical record' },
      { status: 500 }
    );
  }
}