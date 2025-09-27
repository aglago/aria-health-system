import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { verifyToken } from '@/lib/auth/jwt';
import { assignDoctor } from '@/lib/doctor-assignment';

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
      // For doctors, userId in JWT is actually the doctor_id
      // So we can directly use it to filter appointments
      query.doctor_id = userId;
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
    }

    // Status filtering
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .sort({ date: 1 })
      .lean();

    // Manually populate patient and doctor data since we're using string references
    const User = (await import('@/models/User')).default;
    
    const populatedAppointments = await Promise.all(
      appointments.map(async (appointment: any) => {
        // Find patient by student_id
        const patient = await User.findOne({ student_id: appointment.patient_id });
        if (patient) {
          appointment.patient = {
            name: patient.name,
            student_id: patient.student_id,
            email: patient.email,
            phone: patient.phone
          };
        }
        
        // Find doctor by doctor_id  
        const doctor = await User.findOne({ doctor_id: appointment.doctor_id });
        if (doctor) {
          appointment.doctor = {
            name: doctor.name,
            doctor_id: doctor.doctor_id,
            email: doctor.email,
            specialization: doctor.specialization
          };
        }
        
        return appointment;
      })
    );

    // console.log('📋 Appointments fetched:', {
    //   user_id: userId,
    //   role: role,
    //   query: query,
    //   appointments_count: populatedAppointments.length,
    //   appointments: populatedAppointments.map(apt => ({
    //     id: apt._id,
    //     patient_id: apt.patient_id,
    //     patient_name: apt.patient?.name,
    //     doctor_name: apt.doctor_name || apt.doctor?.name,
    //     date: apt.date,
    //     time: apt.time
    //   }))
    // });

    // Transform _id to id for frontend compatibility
    const transformedAppointments = populatedAppointments.map((apt: any) => ({
      ...apt,
      id: apt._id.toString()
    }));

    return NextResponse.json({ appointments: transformedAppointments });

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
    const { date, time, type, notes, consultation_id, symptoms, urgency_level, appointment_type } = body;

    // Validate required fields
    if (!date || !time || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: date, time, and type are required' },
        { status: 400 }
      );
    }

    // Assign a doctor using smart assignment logic
    const assignedDoctor = await assignDoctor({
      urgencyLevel: urgency_level as 'low' | 'medium' | 'high' | 'emergency',
      symptoms: symptoms || [],
      appointmentType: appointment_type || type,
      preferredSpecialization: undefined // Let the system decide
    });

    const doctorName = assignedDoctor?.name || 'Dr. Available';
    const doctorId = assignedDoctor?.doctor_id;

    // Check if the time slot is already taken by the assigned doctor
    const existingAppointment = await Appointment.findOne({
      date: new Date(date),
      time,
      doctor_id: doctorId,
      status: 'scheduled'
    });

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'This time slot is already booked for the assigned doctor' },
        { status: 409 }
      );
    }

    // Create new appointment
    const appointment = new Appointment({
      patient_id: payload.id,
      doctor_name: doctorName,
      doctor_id: doctorId, // Now includes real doctor ID
      date: new Date(date),
      time,
      type,
      notes: `${notes || ''}${assignedDoctor?.specialization ? ` - Assigned to ${assignedDoctor.specialization.replace('-', ' ')} specialist` : ''}`.trim(),
      consultation_id,
      symptoms: symptoms || [],
      urgency_level: urgency_level || 'medium',
      created_from_consultation: !!consultation_id,
      status: 'scheduled'
    });

    await appointment.save();

    // Populate patient details for response
    await appointment.populate('patient', 'name student_id email');

    console.log('💾 Appointment created with doctor assignment:', {
      appointment_id: appointment._id,
      patient_id: appointment.patient_id,
      doctor_name: appointment.doctor_name,
      doctor_id: appointment.doctor_id,
      specialization: assignedDoctor?.specialization,
      date: appointment.date,
      time: appointment.time,
      urgency_level: appointment.urgency_level,
      assignment_successful: !!assignedDoctor
    });

    return NextResponse.json({ 
      appointment: {
        ...appointment.toObject(),
        id: appointment._id.toString()
      },
      assigned_doctor: {
        name: doctorName,
        doctor_id: doctorId,
        specialization: assignedDoctor?.specialization
      },
      message: `Appointment booked successfully${assignedDoctor?.specialization ? ` with ${assignedDoctor.specialization.replace('-', ' ')} specialist` : ''}`
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}