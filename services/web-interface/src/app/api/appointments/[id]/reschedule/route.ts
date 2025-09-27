import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { verifyToken } from '@/lib/auth/jwt';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get auth token from cookies
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
    const body = await request.json();
    const { new_date, new_time, reason } = body;

    // Validate required fields
    if (!new_date || !new_time) {
      return NextResponse.json(
        { error: 'Missing required fields: new_date and new_time are required' },
        { status: 400 }
      );
    }

    // Find the appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check authorization - students can only reschedule their own appointments
    if (payload.role === 'student' && appointment.patient_id !== payload.id) {
      return NextResponse.json({ error: 'Unauthorized to reschedule this appointment' }, { status: 403 });
    }

    // Check if student has already rescheduled this appointment (limit to 2 reschedules)
    const rescheduleCount = appointment.reschedule_history?.length || 0;
    if (payload.role === 'student' && rescheduleCount >= 2) {
      return NextResponse.json(
        { error: 'Maximum reschedule limit reached. Please contact the health center for further assistance.' },
        { status: 400 }
      );
    }

    // Check if the new time slot is available
    const existingAppointment = await Appointment.findOne({
      date: new Date(new_date),
      time: new_time,
      doctor_id: appointment.doctor_id,
      status: 'scheduled',
      _id: { $ne: id } // Exclude current appointment
    });

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'The selected time slot is already booked. Please choose a different time.' },
        { status: 409 }
      );
    }

    // Store the original appointment details in reschedule history
    const rescheduleHistory = appointment.reschedule_history || [];
    rescheduleHistory.push({
      original_date: appointment.date,
      original_time: appointment.time,
      reschedule_date: new Date(),
      reschedule_reason: reason || 'No reason provided',
      rescheduled_by: payload.role,
      rescheduled_by_id: payload.id
    });

    // Update the appointment
    appointment.date = new Date(new_date);
    appointment.time = new_time;
    appointment.reschedule_history = rescheduleHistory;
    appointment.notes = `${appointment.notes || ''}\n[Rescheduled on ${new Date().toLocaleDateString()}]`.trim();

    await appointment.save();

    // Populate patient details for response
    await appointment.populate('patient', 'name student_id email');

    console.log('🔄 Appointment rescheduled:', {
      appointment_id: appointment._id,
      patient_id: appointment.patient_id,
      doctor_name: appointment.doctor_name,
      old_date: rescheduleHistory[rescheduleHistory.length - 1].original_date,
      old_time: rescheduleHistory[rescheduleHistory.length - 1].original_time,
      new_date: appointment.date,
      new_time: appointment.time,
      reschedule_count: rescheduleHistory.length,
      rescheduled_by: payload.role
    });

    return NextResponse.json({
      appointment,
      message: 'Appointment rescheduled successfully',
      reschedule_count: rescheduleHistory.length,
      remaining_reschedules: payload.role === 'student' ? Math.max(0, 2 - rescheduleHistory.length) : 'unlimited'
    });

  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    return NextResponse.json(
      { error: 'Failed to reschedule appointment' },
      { status: 500 }
    );
  }
}