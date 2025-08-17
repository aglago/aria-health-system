import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Consultation from '@/models/Consultation';

interface BookAppointmentRequest {
  session_id: string;
  selected_time: {
    time: string;
    datetime?: string;
    type: string;
    doctor?: string;
    room?: string;
  };
  user_contact?: {
    email?: string;
    phone?: string;
    student_id?: string;
  };
}

interface BookingConfirmation {
  booking_confirmed: boolean;
  booking_details: {
    booking_id: string;
    appointment_time: string;
    doctor: string;
    location: string;
    room: string;
    duration: string;
    type: string;
  };
  patient_preparation: {
    bring_items: string[];
    preparation_notes: string[];
  };
  assessment_summary: any;
  contact_info: {
    health_center: string;
    emergency: string;
    appointment_changes: string;
  };
  booking_timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('📅 Booking appointment request received');
    
    const body: BookAppointmentRequest = await request.json();
    
    // Validate required fields
    if (!body.session_id || !body.selected_time) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id and selected_time are required' },
        { status: 400 }
      );
    }

    // Get AI service URL from environment
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    console.log('📅 Booking appointment:', {
      session_id: body.session_id,
      appointment_time: body.selected_time.time,
      doctor: body.selected_time.doctor,
      type: body.selected_time.type,
      ai_service_url: AI_SERVICE_URL
    });

    // Call AI service to book appointment
    const aiResponse = await fetch(`${AI_SERVICE_URL}/doctor/book-appointment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: body.session_id,
        selected_time: body.selected_time,
        user_contact: body.user_contact
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ AI Service book-appointment error:', {
        status: aiResponse.status,
        statusText: aiResponse.statusText,
        error: errorText,
        session_id: body.session_id
      });
      
      // Handle session not found
      if (aiResponse.status === 404) {
        return NextResponse.json({
          error: 'Session not found or expired',
          message: 'Unable to complete booking. Please start a new consultation.',
          fallback_action: 'contact_health_center',
          contact_info: {
            health_center: '+233-312-022-242',
            appointment_booking: '+233-312-022-245'
          }
        }, { status: 404 });
      }
      
      // General booking error
      return NextResponse.json({
        error: 'Unable to complete appointment booking',
        message: 'There was an issue processing your appointment request. Please contact UMaT Health Center directly.',
        contact_info: {
          health_center: '+233-312-022-242',
          appointment_booking: '+233-312-022-245',
          emergency: '193'
        },
        suggested_action: 'Call health center to book manually'
      }, { status: 500 });
    }

    const bookingData = await aiResponse.json();
    
    console.log('✅ Appointment booked successfully:', {
      booking_id: bookingData.booking?.booking_details?.booking_id,
      session_id: body.session_id,
      appointment_time: body.selected_time.time,
      doctor: body.selected_time.doctor
    });

    // Save appointment to database
    try {
      await connectToDatabase();
      
      // Find the consultation session to get patient details
      const consultation = await Consultation.findOne({ session_id: body.session_id });
      
      if (!consultation) {
        console.warn('⚠️ No consultation found for session:', body.session_id);
      }

      // Parse appointment time to extract date and time
      const appointmentTimeStr = body.selected_time.time; // e.g., "09:00 AM on Monday"
      const doctorName = body.selected_time.doctor || 'Dr. Ama Osei';
      const appointmentType = body.selected_time.type || 'General Consultation';
      
      // For now, set appointment for next occurrence of the day mentioned
      // This is a simplified approach - in production you'd want more precise date parsing
      const today = new Date();
      const appointmentDate = new Date(today);
      appointmentDate.setDate(today.getDate() + 1); // Default to tomorrow
      
      // Extract time (e.g., "09:00 AM" from "09:00 AM on Monday")
      const timeMatch = appointmentTimeStr.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
      const appointmentTime = timeMatch ? timeMatch[1] : '09:00 AM';

      // Create appointment record
      const appointment = new Appointment({
        patient_id: consultation?.patient_id || body.user_contact?.student_id || 'unknown',
        doctor_name: doctorName,
        date: appointmentDate,
        time: appointmentTime,
        type: appointmentType,
        notes: `Booked through Dr. ARIA consultation`,
        consultation_id: body.session_id,
        symptoms: consultation?.symptoms || [],
        urgency_level: consultation?.urgency_level || 'medium',
        created_from_consultation: true,
        status: 'scheduled'
      });

      await appointment.save();
      
      // Update consultation to mark appointment as created
      if (consultation) {
        consultation.appointment_created = true;
        consultation.appointment_id = appointment._id.toString();
        await consultation.save();
      }

      console.log('💾 Appointment saved to database:', {
        appointment_id: appointment._id,
        patient_id: appointment.patient_id,
        doctor: appointment.doctor_name,
        date: appointment.date,
        time: appointment.time
      });

    } catch (dbError) {
      console.error('❌ Failed to save appointment to database:', dbError);
      // Continue with the response even if database save fails
    }

    // Enhance response with web interface metadata
    const enhancedResponse = {
      ...bookingData,
      web_interface_metadata: {
        processed_at: new Date().toISOString(),
        ai_service_url: AI_SERVICE_URL,
        booking_success: true,
        user_action_required: 'review_confirmation'
      },
      next_steps: [
        'Review appointment details below',
        'Save booking confirmation',
        'Arrive 10 minutes early',
        'Bring required items listed'
      ]
    };

    return NextResponse.json(enhancedResponse);

  } catch (error) {
    console.error('❌ Appointment booking error:', error);
    
    return NextResponse.json({
      error: 'System error during appointment booking',
      message: 'We encountered a technical issue while booking your appointment. Please contact UMaT Health Center directly.',
      contact_info: {
        health_center: '+233-312-022-242',
        appointment_booking: '+233-312-022-245',
        emergency: '193'
      },
      booking_failed: true,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to book an appointment.' },
    { status: 405 }
  );
}