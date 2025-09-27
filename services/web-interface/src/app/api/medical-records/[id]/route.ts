import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/mongodb';
import MedicalRecord from '@/models/MedicalRecord';
import User from '@/models/User';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'aria-secret-key-for-umat-students-2024'
);

// GET /api/medical-records/[id] - Get specific medical record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const { id } = await params;

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

    // Find medical record
    const record = await MedicalRecord.findById(id)
      .populate('patient', 'name student_id email')
      .populate('doctor', 'name doctor_id specialization')
      .populate('appointment', 'date time type status')
      .populate('consultation', 'symptoms primary_concern severity_level');

    if (!record) {
      return NextResponse.json(
        { error: 'Medical record not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (user.role === 'student') {
      // Students can only see their own records
      if (record.patient_id !== user.student_id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    } else if (user.role === 'doctor') {
      // Doctors can see records they created or for their patients
      if (record.doctor_id !== user.doctor_id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      record
    });

  } catch (error) {
    console.error('❌ Error fetching medical record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medical record' },
      { status: 500 }
    );
  }
}

// PUT /api/medical-records/[id] - Update medical record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const { id } = await params;

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
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can update medical records' },
        { status: 403 }
      );
    }

    // Find existing record
    const existingRecord = await MedicalRecord.findById(id);
    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Medical record not found' },
        { status: 404 }
      );
    }

    // Check if doctor can update this record
    if (existingRecord.doctor_id !== user.doctor_id) {
      return NextResponse.json(
        { error: 'You can only update your own medical records' },
        { status: 403 }
      );
    }

    // Check if record is already signed (signed records can't be modified)
    if (existingRecord.status === 'signed') {
      return NextResponse.json(
        { error: 'Cannot modify signed medical records' },
        { status: 409 }
      );
    }

    const updateData = await request.json();

    // Update record with new data
    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      id,
      {
        ...updateData,
        last_modified_by: user.doctor_id,
        last_modified_by_name: user.name,
        status: updateData.status || existingRecord.status
      },
      { new: true, runValidators: true }
    ).populate('patient', 'name student_id email')
     .populate('doctor', 'name doctor_id specialization')
     .populate('appointment', 'date time type status');

    console.log('✅ Medical record updated successfully:', {
      record_id: id,
      updated_by: user.doctor_id,
      status: updatedRecord.status
    });

    return NextResponse.json({
      success: true,
      message: 'Medical record updated successfully',
      record: updatedRecord
    });

  } catch (error) {
    console.error('❌ Error updating medical record:', error);
    return NextResponse.json(
      { error: 'Failed to update medical record' },
      { status: 500 }
    );
  }
}

// DELETE /api/medical-records/[id] - Delete medical record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const { id } = await params;

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
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can delete medical records' },
        { status: 403 }
      );
    }

    // Find existing record
    const existingRecord = await MedicalRecord.findById(id);
    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Medical record not found' },
        { status: 404 }
      );
    }

    // Check if doctor can delete this record
    if (existingRecord.doctor_id !== user.doctor_id) {
      return NextResponse.json(
        { error: 'You can only delete your own medical records' },
        { status: 403 }
      );
    }

    // Check if record is signed (signed records can't be deleted)
    if (existingRecord.status === 'signed') {
      return NextResponse.json(
        { error: 'Cannot delete signed medical records' },
        { status: 409 }
      );
    }

    // Soft delete by updating status instead of actually deleting
    await MedicalRecord.findByIdAndUpdate(id, {
      status: 'deleted',
      last_modified_by: user.doctor_id,
      last_modified_by_name: user.name
    });

    console.log('✅ Medical record deleted successfully:', {
      record_id: id,
      deleted_by: user.doctor_id
    });

    return NextResponse.json({
      success: true,
      message: 'Medical record deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting medical record:', error);
    return NextResponse.json(
      { error: 'Failed to delete medical record' },
      { status: 500 }
    );
  }
}