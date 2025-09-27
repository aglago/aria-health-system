import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/mongodb';
import MedicalRecord from '@/models/MedicalRecord';
import User from '@/models/User';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'aria-secret-key-for-umat-students-2024'
);

// POST /api/medical-records/[id]/sign - Sign medical record
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const { id } = await params;

    // Get authorization token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
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
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can sign medical records' },
        { status: 403 }
      );
    }

    // Find existing record
    const record = await MedicalRecord.findById(id);
    if (!record) {
      return NextResponse.json(
        { error: 'Medical record not found' },
        { status: 404 }
      );
    }

    // Check if doctor can sign this record
    if (record.doctor_id !== user.doctor_id) {
      return NextResponse.json(
        { error: 'You can only sign your own medical records' },
        { status: 403 }
      );
    }

    // Check if record is already signed
    if (record.status === 'signed') {
      return NextResponse.json(
        { error: 'Medical record is already signed' },
        { status: 409 }
      );
    }

    // Validate that all required fields are completed
    const requiredFields = [
      'chief_complaint',
      'history_of_present_illness',
      'final_diagnosis',
      'assessment_notes',
      'physical_examination_findings',
      'treatment_plan',
      'follow_up_instructions',
      'patient_education_provided'
    ];

    const missingFields = requiredFields.filter(field => !record[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot sign incomplete medical record',
          missing_fields: missingFields
        },
        { status: 400 }
      );
    }

    // Sign the record
    const signedRecord = await MedicalRecord.findByIdAndUpdate(
      id,
      {
        status: 'signed',
        signed_by: user.doctor_id,
        signed_by_name: user.name,
        signed_date: new Date(),
        last_modified_by: user.doctor_id,
        last_modified_by_name: user.name
      },
      { new: true, runValidators: true }
    ).populate('patient', 'name student_id email')
     .populate('doctor', 'name doctor_id specialization')
     .populate('appointment', 'date time type status');

    console.log('✅ Medical record signed successfully:', {
      record_id: id,
      signed_by: user.doctor_id,
      patient_id: record.patient_id,
      diagnosis: record.final_diagnosis
    });

    return NextResponse.json({
      success: true,
      message: 'Medical record signed successfully',
      record: signedRecord
    });

  } catch (error) {
    console.error('❌ Error signing medical record:', error);
    return NextResponse.json(
      { error: 'Failed to sign medical record' },
      { status: 500 }
    );
  }
}