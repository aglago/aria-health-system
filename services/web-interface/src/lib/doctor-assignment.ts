import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Appointment from '@/models/Appointment';

interface Doctor {
  _id: string;
  doctor_id: string;
  name: string;
  specialization?: string;
  email?: string;
}

interface AssignmentCriteria {
  urgencyLevel?: 'low' | 'medium' | 'high' | 'emergency';
  symptoms?: string[];
  appointmentType?: string;
  preferredSpecialization?: string;
}

/**
 * Smart doctor assignment based on specialization, urgency, and workload
 */
export async function assignDoctor(criteria: AssignmentCriteria = {}): Promise<Doctor | null> {
  try {
    await connectToDatabase();

    const { urgencyLevel, symptoms, appointmentType, preferredSpecialization } = criteria;

    // Determine ideal specialization based on criteria
    const idealSpecialization = determineSpecialization(symptoms, appointmentType, preferredSpecialization);

    // Get all available doctors
    const allDoctors = await User.find({ role: 'doctor' })
      .select('doctor_id name specialization email')
      .lean() as Doctor[];

    if (allDoctors.length === 0) {
      console.warn('⚠️ No doctors found in system');
      return null;
    }

    // For small university health center, prioritize by specialization match then availability
    let sortedDoctors = allDoctors;

    // 1. Prioritize by specialization match
    if (idealSpecialization) {
      sortedDoctors = sortedDoctors.sort((a, b) => {
        const aMatch = a.specialization === idealSpecialization ? 1 : 0;
        const bMatch = b.specialization === idealSpecialization ? 1 : 0;
        return bMatch - aMatch; // Higher match first
      });
    }

    // 2. For emergency cases, prefer General Practitioners or Emergency Medicine
    if (urgencyLevel === 'emergency' || urgencyLevel === 'high') {
      sortedDoctors = sortedDoctors.sort((a, b) => {
        const aEmergency = (a.specialization === 'general-practitioner' || a.specialization === 'emergency-medicine') ? 1 : 0;
        const bEmergency = (b.specialization === 'general-practitioner' || b.specialization === 'emergency-medicine') ? 1 : 0;
        return bEmergency - aEmergency;
      });
    }

    // 3. Get current appointment counts for workload balancing
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const doctorWorkloads = await Promise.all(
      sortedDoctors.map(async (doctor) => {
        const todaysAppointments = await Appointment.countDocuments({
          doctor_id: doctor.doctor_id,
          date: { $gte: startOfDay, $lte: endOfDay },
          status: 'scheduled'
        });

        return {
          doctor,
          appointmentCount: todaysAppointments
        };
      })
    );

    // 4. Sort by workload (least busy first) while maintaining specialization priority
    doctorWorkloads.sort((a, b) => a.appointmentCount - b.appointmentCount);

    const assignedDoctor = doctorWorkloads[0]?.doctor;

    if (assignedDoctor) {
      console.log('👩‍⚕️ Doctor assigned:', {
        doctor_name: assignedDoctor.name,
        doctor_id: assignedDoctor.doctor_id,
        specialization: assignedDoctor.specialization,
        current_appointments: doctorWorkloads[0].appointmentCount,
        urgency_level: urgencyLevel,
        ideal_specialization: idealSpecialization
      });
    }

    return assignedDoctor;

  } catch (error) {
    console.error('❌ Error in doctor assignment:', error);
    return null;
  }
}

/**
 * Determine ideal specialization based on symptoms and appointment type
 */
function determineSpecialization(
  symptoms?: string[], 
  appointmentType?: string, 
  preferredSpecialization?: string
): string | null {
  if (preferredSpecialization) {
    return preferredSpecialization;
  }

  // Mental health keywords
  const mentalHealthKeywords = [
    'anxiety', 'depression', 'stress', 'panic', 'mental', 'psychological', 
    'suicide', 'self-harm', 'mood', 'therapy', 'counseling'
  ];

  // Emergency keywords
  const emergencyKeywords = [
    'emergency', 'urgent', 'severe', 'critical', 'chest pain', 'breathing', 
    'unconscious', 'bleeding', 'accident', 'trauma'
  ];

  // Internal medicine keywords
  const internalMedicineKeywords = [
    'diabetes', 'hypertension', 'heart', 'cardiovascular', 'chronic', 
    'medication', 'prescription', 'follow-up'
  ];

  const allSymptoms = [
    ...(symptoms || []),
    appointmentType || ''
  ].join(' ').toLowerCase();

  // Check for mental health indicators
  if (mentalHealthKeywords.some(keyword => allSymptoms.includes(keyword))) {
    return 'psychiatrist';
  }

  // Check for emergency indicators
  if (emergencyKeywords.some(keyword => allSymptoms.includes(keyword))) {
    return 'emergency-medicine';
  }

  // Check for internal medicine indicators
  if (internalMedicineKeywords.some(keyword => allSymptoms.includes(keyword))) {
    return 'internal-medicine';
  }

  // Default to general practitioner for university health center
  return 'general-practitioner';
}

/**
 * Get doctor by ID
 */
export async function getDoctorById(doctorId: string): Promise<Doctor | null> {
  try {
    await connectToDatabase();
    
    const doctor = await User.findOne({ 
      $or: [
        { doctor_id: doctorId },
        { _id: doctorId }
      ],
      role: 'doctor' 
    })
    .select('doctor_id name specialization email')
    .lean() as Doctor;

    return doctor;
  } catch (error) {
    console.error('❌ Error fetching doctor by ID:', error);
    return null;
  }
}