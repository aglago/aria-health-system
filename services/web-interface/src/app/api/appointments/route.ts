import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
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
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const role = payload.role;
    const userId = payload.id;

    const query: Record<string, unknown> = {};

    // Role-based filtering
    if (role === 'student') {
      query.patient_id = userId;
    } else if (role === 'doctor') {
      query.doctor_id = userId;
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
    }

    // Status filtering
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name student_id email phone')
      .populate('doctor', 'name doctor_id email')
      .sort({ date: 1 })
      .lean();

    console.log('📋 Appointments fetched:', {
      user_id: userId,
      role: role,
      query: query,
      appointments_count: appointments.length,
      appointments: appointments.map(apt => ({
        id: apt._id,
        patient_id: apt.patient_id,
        doctor_name: apt.doctor_name,
        date: apt.date,
        time: apt.time
      }))
    });

    return NextResponse.json({ appointments });

  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Only students can book appointments
    if (payload.role !== 'student') {
      return NextResponse.json({ error: 'Only students can book appointments' }, { status: 403 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { date, time, type, doctor_name, notes, consultation_id, symptoms, urgency_level } = body;

    // Validate required fields
    if (!date || !time || !type || !doctor_name) {
      return NextResponse.json(
        { error: 'Missing required fields: date, time, type, and doctor_name are required' },
        { status: 400 }
      );
    }

    // Check if the time slot is already taken
    const existingAppointment = await Appointment.findOne({
      date: new Date(date),
      time,
      status: 'scheduled'
    });

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 }
      );
    }

    // Create new appointment
    const appointment = new Appointment({
      patient_id: payload.id,
      doctor_name,
      date: new Date(date),
      time,
      type,
      notes,
      consultation_id,
      symptoms: symptoms || [],
      urgency_level: urgency_level || 'medium',
      created_from_consultation: !!consultation_id,
      status: 'scheduled'
    });

    await appointment.save();

    // Populate patient details for response
    await appointment.populate('patient', 'name student_id email');

    return NextResponse.json({ 
      appointment,
      message: 'Appointment booked successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}