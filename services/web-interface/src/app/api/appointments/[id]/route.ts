import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import Consultation from '@/models/Consultation';
import { verifyToken } from '@/lib/auth/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await params;
    const appointment = await Appointment.findById(id)
      .populate('patient', 'name student_id email phone dateOfBirth bloodType allergies emergencyContact chronicConditions currentMedications')
      .populate('doctor', 'name doctor_id email specialization');

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check if user has access to this appointment
    const hasAccess = 
      (payload.role === 'student' && appointment.patient_id === payload.id) ||
      (payload.role === 'doctor' && appointment.doctor_id === payload.id) ||
      (payload.role === 'doctor'); // Allow all doctors to view appointments (shared health center)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get related consultation if exists (for doctors only)
    let consultation = null;
    if (payload.role === 'doctor' && appointment.consultation_id) {
      consultation = await Consultation.findOne({ session_id: appointment.consultation_id })
        .select(`
          session_id symptoms symptom_duration symptom_severity symptom_onset 
          diagnosis_summary primary_concern differential_diagnosis
          urgency_level requires_immediate_care confidence_score medical_reasoning
          vital_signs reported_pain_level
          relevant_medical_history current_medications_mentioned allergies_mentioned family_history_relevant
          recommended_actions suggested_tests red_flags when_to_seek_immediate_care
          appointment_recommended appointment_urgency appointment_created appointment_id pre_appointment_instructions
          knowledge_base_references clinical_guidelines_used rag_context
          status duration_minutes follow_up_required consultation_completeness
          messages createdAt updatedAt
        `)
        .populate('patient', 'name student_id email phone dateOfBirth bloodType allergies emergencyContact chronicConditions currentMedications')
        .lean();
    }

    // Get appointment history for this patient (for doctors only)
    let appointmentHistory: any[] = [];
    if (payload.role === 'doctor') {
      appointmentHistory = await Appointment.find({
        patient_id: appointment.patient_id,
        _id: { $ne: id } // Exclude current appointment
      })
      .select('date time type status doctor_name notes medical_notes')
      .sort({ date: -1 })
      .limit(10)
      .lean();
    }

    const response = {
      appointment: {
        ...appointment.toObject(),
        id: appointment._id.toString()
      },
      consultation: consultation ? {
        ...consultation,
        id: consultation._id.toString()
      } : null,
      appointment_history: appointmentHistory.map((apt: any) => ({
        ...apt,
        id: apt._id.toString()
      }))
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check if user has access to update this appointment
    const hasAccess = 
      (payload.role === 'student' && appointment.patient_id === payload.id) ||
      (payload.role === 'doctor' && appointment.doctor_id === payload.id);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const allowedUpdates = ['status', 'notes', 'medical_notes', 'prescription', 'next_steps', 'date', 'time'];
    
    // For students, only allow status updates to 'cancelled'
    if (payload.role === 'student') {
      if (body.status && body.status !== 'cancelled') {
        return NextResponse.json(
          { error: 'Students can only cancel appointments' },
          { status: 403 }
        );
      }
      // Students can't update medical fields
      const medicalFields = ['medical_notes', 'prescription', 'next_steps'];
      if (Object.keys(body).some(key => medicalFields.includes(key))) {
        return NextResponse.json(
          { error: 'Students cannot update medical fields' },
          { status: 403 }
        );
      }
    }

    // Update appointment
    Object.keys(body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        appointment[key] = body[key];
      }
    });

    // Add update history for doctors
    if (payload.role === 'doctor') {
      if (!appointment.update_history) appointment.update_history = [];
      appointment.update_history.push({
        updated_by: payload.id,
        updated_by_name: payload.name || 'Doctor',
        updated_at: new Date(),
        changes: body,
        notes: `Updated by Dr. ${payload.name || 'Unknown'}`
      });
    }

    await appointment.save();
    
    // Populate for response
    await appointment.populate('patient', 'name student_id email');
    await appointment.populate('doctor', 'name doctor_id email');

    return NextResponse.json({ 
      appointment,
      message: 'Appointment updated successfully'
    });

  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check if user has access to delete this appointment
    const hasAccess = 
      (payload.role === 'student' && appointment.patient_id === payload.id) ||
      (payload.role === 'doctor' && appointment.doctor_id === payload.id);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await Appointment.findByIdAndDelete(id);

    return NextResponse.json({ 
      message: 'Appointment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}