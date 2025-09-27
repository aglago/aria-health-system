import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/mongodb';
import MedicalRecord from '@/models/MedicalRecord';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'aria-secret-key-for-umat-students-2024'
);

// GET /api/medical-records/individual - Get individual medical records (not aggregated)
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
    const UserModel = (await import('@/models/User')).default;
    let user;
    try {
      user = await UserModel.findById(decoded.id);
    } catch {
      user = await UserModel.findOne({ 
        $or: [
          { doctor_id: decoded.id },
          { student_id: decoded.id }
        ]
      });
    }
    
    if (!user || user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can access medical records' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Fetch individual medical records for this doctor
    const records = await MedicalRecord.find({ doctor_id: user.doctor_id })
      .sort({ record_date: -1 })
      .limit(limit)
      .skip(skip);

    // Manually populate patient data
    const UserPopulateModel = (await import('@/models/User')).default;
    
    const populatedRecords = await Promise.all(
      records.map(async (record) => {
        const recordObj = record.toObject();
        
        // Find patient by student_id
        const patient = await UserPopulateModel.findOne({ student_id: record.patient_id });
        if (patient) {
          recordObj.patient = {
            name: patient.name,
            student_id: patient.student_id,
            email: patient.email,
            program: patient.program
          };
        }
        
        return recordObj;
      })
    );

    // Get total count for pagination
    const totalRecords = await MedicalRecord.countDocuments({ doctor_id: user.doctor_id });
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
    console.error('❌ Error fetching individual medical records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medical records' },
      { status: 500 }
    );
  }
}