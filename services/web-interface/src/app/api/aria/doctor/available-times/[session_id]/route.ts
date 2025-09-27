import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Consultation from '@/models/Consultation';
import Appointment from '@/models/Appointment';
import { assignDoctor } from '@/lib/doctor-assignment';

interface AppointmentTime {
  time: string;
  datetime?: string;
  type: string;
  doctor?: string;
  room?: string;
  note?: string;
}

interface AvailableTimesResponse {
  status: string;
  session_id: string;
  assessment_summary: {
    severity_score: number;
    priority_level: string;
    severity_level: string;
  };
  available_times: AppointmentTime[];
  booking_instructions: string;
}

async function generateAvailableTimeSlots(
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency',
  assignedDoctor?: any
): Promise<AppointmentTime[]> {
  const availableTimes: AppointmentTime[] = [];
  const now = new Date();
  const today = new Date(now);
  
  // Define working hours (8 AM to 6 PM, Monday to Friday)
  const workingHours = {
    start: 8, // 8 AM
    end: 18,  // 6 PM
    interval: 30 // 30-minute slots
  };

  // Determine how many days ahead to show based on urgency
  const daysAhead = urgencyLevel === 'emergency' ? 1 : 
                   urgencyLevel === 'high' ? 2 : 
                   urgencyLevel === 'medium' ? 5 : 7;

  // Get existing appointments for the assigned doctor to check conflicts
  let existingAppointments: any[] = [];
  if (assignedDoctor?.doctor_id) {
    existingAppointments = await Appointment.find({
      doctor_id: assignedDoctor.doctor_id,
      status: 'scheduled',
      date: {
        $gte: today,
        $lte: new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000)
      }
    }).select('date time').lean();
  }

  // Generate time slots for each day
  for (let day = 0; day < daysAhead; day++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + day);
    
    // Skip weekends for non-emergency cases
    const dayOfWeek = currentDate.getDay();
    if (urgencyLevel !== 'emergency' && (dayOfWeek === 0 || dayOfWeek === 6)) {
      continue;
    }

    // For emergency cases on weekends, show limited availability
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const startHour = isWeekend ? 9 : workingHours.start;
    const endHour = isWeekend ? 17 : workingHours.end;

    // Generate time slots for the day
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += workingHours.interval) {
        const slotTime = new Date(currentDate);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Skip past time slots for today
        if (day === 0 && slotTime <= now) {
          continue;
        }

        // Format time string
        const timeString = slotTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        // Check if this is today
        const isToday = slotTime.toDateString() === today.toDateString();
        
        const dayName = slotTime.toLocaleDateString('en-US', { weekday: 'long' });
        const dateString = slotTime.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });

        // Use "Today" if it's today, otherwise show the day name and date
        const dayDisplay = isToday ? 'Today' : `${dayName}, ${dateString}`;
        const fullTimeString = `${timeString} on ${dayDisplay}`;

        // Check if this slot conflicts with existing appointments
        const hasConflict = existingAppointments.some(apt => {
          const aptDate = new Date(apt.date);
          return aptDate.toDateString() === slotTime.toDateString() && apt.time === timeString;
        });

        if (hasConflict) {
          continue; // Skip conflicted slots
        }

        // Determine appointment type based on urgency and timing
        let appointmentType = 'standard';
        let note = undefined;

        if (urgencyLevel === 'emergency') {
          appointmentType = 'emergency';
          note = 'Emergency consultation - immediate attention';
        } else if (urgencyLevel === 'high') {
          if (day === 0) {
            appointmentType = 'same_day';
            note = 'Same-day urgent appointment';
          } else {
            appointmentType = 'urgent';
          }
        } else if (day === 0 && hour < 12) {
          appointmentType = 'same_day';
        }

        // Add the time slot
        availableTimes.push({
          time: fullTimeString,
          datetime: slotTime.toISOString(),
          type: appointmentType,
          doctor: assignedDoctor?.name || 'Available Doctor',
          room: `${Math.floor(Math.random() * 10) + 1}A`, // Generate room numbers
          note: note
        });

        // Limit slots for emergency cases (show only next few available)
        if (urgencyLevel === 'emergency' && availableTimes.length >= 5) {
          return availableTimes;
        }

        // Limit total slots to prevent overwhelming the user
        if (availableTimes.length >= 20) {
          return availableTimes;
        }
      }
    }
  }

  // If no slots available, show emergency fallback
  if (availableTimes.length === 0) {
    const emergencySlot = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
    availableTimes.push({
      time: `Emergency slot at ${emergencySlot.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}`,
      datetime: emergencySlot.toISOString(),
      type: 'emergency',
      doctor: assignedDoctor?.name || 'On-call Doctor',
      room: 'Emergency',
      note: 'Contact health center immediately for emergency care'
    });
  }

  return availableTimes;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    // Await params as required by Next.js 15
    const { session_id: encoded_session_id } = await params;
    // URL decode the session ID in case it contains special characters
    const session_id = decodeURIComponent(encoded_session_id);
    
    console.log('🗓️ Getting available appointment times for session:', session_id);

    if (!session_id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the consultation session to get assessment data
    const consultation = await Consultation.findOne({ session_id });
    
    if (!consultation) {
      return NextResponse.json({
        error: 'Session not found or expired',
        message: 'Your consultation session has expired. You can either start a new consultation or contact UMaT Health Center directly to schedule an appointment.',
        suggestions: [
          'Start a new consultation with Dr. ARIA',
          'Call UMaT Health Center directly for appointment booking'
        ],
        fallback_contact: {
          health_center: '+233-312-022-242',
          appointment_booking: '+233-312-022-245',
          emergency: '193'
        }
      }, { status: 404 });
    }

    // Generate assessment summary from consultation data
    const assessmentSummary = {
      severity_score: consultation.urgency_level === 'emergency' ? 90 :
                     consultation.urgency_level === 'high' ? 75 :
                     consultation.urgency_level === 'medium' ? 50 : 25,
      priority_level: consultation.urgency_level || 'medium',
      severity_level: consultation.urgency_level || 'medium'
    };

    // Assign appropriate doctors based on consultation data
    const assignedDoctor = await assignDoctor({
      urgencyLevel: consultation.urgency_level as 'low' | 'medium' | 'high' | 'emergency',
      symptoms: consultation.symptoms || [],
      appointmentType: 'General Consultation',
      preferredSpecialization: undefined
    });

    // Generate real available time slots
    const availableTimes = await generateAvailableTimeSlots(
      consultation.urgency_level as 'low' | 'medium' | 'high' | 'emergency',
      assignedDoctor
    );

    const response: AvailableTimesResponse = {
      status: 'success',
      session_id: session_id,
      assessment_summary: assessmentSummary,
      available_times: availableTimes,
      booking_instructions: `Based on your consultation, ${assignedDoctor ? `Dr. ${assignedDoctor.name}` : 'our medical team'} ${consultation.urgency_level === 'emergency' ? 'requires immediate attention' : consultation.urgency_level === 'high' ? 'recommends urgent care' : 'is available for consultation'}. Please select your preferred appointment time.`
    };
    
    console.log('✅ Real available appointment times generated:', {
      session_id: session_id,
      priority_level: response.assessment_summary.priority_level,
      severity_score: response.assessment_summary.severity_score,
      available_slots: response.available_times.length,
      assigned_doctor: assignedDoctor?.name,
      specialization: assignedDoctor?.specialization
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Available appointment times error:', error);
    
    return NextResponse.json({
      error: 'System error while fetching appointment times',
      message: 'Please contact UMaT Health Center directly',
      contact_info: {
        health_center: '+233-312-022-242',
        emergency: '193'
      }
    }, { status: 500 });
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch available appointment times.' },
    { status: 405 }
  );
}