import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const appointment = await Appointment.findById(params.id)
      .populate('patient', 'name student_id email phone')
      .populate('doctor', 'name doctor_id email');

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check if user has access to this appointment
    const hasAccess = 
      (payload.role === 'student' && appointment.patient_id === payload.id) ||
      (payload.role === 'doctor' && appointment.doctor_id === payload.id);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ appointment });

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
  { params }: { params: { id: string } }
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

    const appointment = await Appointment.findById(params.id);

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
    const allowedUpdates = ['status', 'notes', 'date', 'time'];
    
    // For students, only allow status updates to 'cancelled'
    if (payload.role === 'student') {
      if (body.status && body.status !== 'cancelled') {
        return NextResponse.json(
          { error: 'Students can only cancel appointments' },
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
  { params }: { params: { id: string } }
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

    const appointment = await Appointment.findById(params.id);

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

    await Appointment.findByIdAndDelete(params.id);

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