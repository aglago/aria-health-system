import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/mongodb';
import MedicalRecord from '@/models/MedicalRecord';
import Appointment from '@/models/Appointment';
import Consultation from '@/models/Consultation';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'aria-secret-key-for-umat-students-2024'
);

// GET /api/patient-files - Get comprehensive patient files (aggregated data)
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

    // Get user details - handle both ObjectId and doctor_id/student_id
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
        { error: 'Only doctors can access patient files' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const patientId = url.searchParams.get('patient_id');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // If specific patient requested, return their complete file
    if (patientId) {
      const patientFile = await buildPatientFile(patientId);
      if (!patientFile) {
        return NextResponse.json(
          { error: 'Patient file not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        patientFile
      });
    }

    // Otherwise, get all patient files summary
    const patientFiles = await getAllPatientFilesSummary(limit);

    return NextResponse.json({
      success: true,
      patientFiles,
      total: patientFiles.length
    });

  } catch (error) {
    console.error('❌ Error fetching patient files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient files' },
      { status: 500 }
    );
  }
}

// Build comprehensive patient file by aggregating all medical data
async function buildPatientFile(patientId: string) {
  try {
    const UserModel = (await import('@/models/User')).default;
    
    // Get patient info
    const patient = await UserModel.findOne({ student_id: patientId });
    if (!patient) return null;

    // Get all medical records for this patient
    const medicalRecords = await MedicalRecord.find({ patient_id: patientId })
      .sort({ record_date: -1 });

    // Get all appointments for this patient  
    const appointments = await Appointment.find({ patient_id: patientId })
      .sort({ date: -1 });

    // Get all consultations for this patient
    const consultations = await Consultation.find({ patient_id: patientId })
      .sort({ createdAt: -1 });

    // Aggregate comprehensive data
    const patientFile = {
      // Basic Information
      patient_id: patientId,
      patient_name: patient.name,
      email: patient.email,
      phone: patient.phone,
      program: patient.program,
      level: patient.level,
      date_of_birth: patient.date_of_birth,
      emergency_contact: patient.emergency_contact,
      
      // File Metadata
      file_created_date: patient.createdAt,
      last_updated: new Date(),
      total_medical_records: medicalRecords.length,
      total_appointments: appointments.length,
      total_consultations: consultations.length,
      
      // Medical History Summary
      medical_history: {
        first_visit: medicalRecords.length > 0 ? medicalRecords[medicalRecords.length - 1].record_date : null,
        last_visit: medicalRecords.length > 0 ? medicalRecords[0].record_date : null,
        
        // Aggregate all diagnoses
        all_diagnoses: [...new Set(medicalRecords
          .map(record => record.final_diagnosis)
          .filter(diagnosis => diagnosis))],
        
        // Aggregate all symptoms ever reported
        all_symptoms_history: [...new Set(consultations
          .flatMap(consultation => consultation.symptoms || [])
          .concat(medicalRecords.flatMap(record => record.presenting_symptoms || [])))],
        
        // Current medications (from most recent records)
        current_medications: medicalRecords
          .slice(0, 3) // Last 3 records
          .flatMap(record => record.medications_prescribed || [])
          .filter(med => med)
          .slice(0, 10), // Max 10 current medications
          
        // Known allergies
        known_allergies: [...new Set(medicalRecords
          .flatMap(record => record.allergies_identified || [])
          .filter(allergy => allergy))],
      },
      
      // Healthcare Utilization Patterns
      healthcare_patterns: {
        most_common_symptoms: getMostCommonItems(consultations.flatMap(c => c.symptoms || [])),
        most_frequent_diagnoses: getMostCommonItems(medicalRecords.map(r => r.final_diagnosis).filter(d => d)),
        appointment_attendance_rate: calculateAttendanceRate(appointments),
        average_consultations_per_month: calculateMonthlyAverage(consultations),
        
        // Risk indicators
        urgency_levels: consultations.reduce((acc, consultation) => {
          const level = consultation.urgency_level || 'medium';
          acc[level] = (acc[level] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      
      // Care Team (doctors who have treated this patient)
      care_team: [...new Set(medicalRecords
        .map(record => record.doctor_name)
        .concat(appointments.map(apt => apt.doctor_name))
        .filter(name => name))],
      
      // Linked Records (IDs for drill-down)
      linked_data: {
        consultation_ids: consultations.map(c => c.session_id),
        appointment_ids: appointments.map(a => a._id.toString()),
        medical_record_ids: medicalRecords.map(r => r._id.toString())
      },
      
      // Clinical Summary
      clinical_summary: generateClinicalSummary(medicalRecords, consultations, appointments)
    };

    return patientFile;

  } catch (error) {
    console.error('Error building patient file:', error);
    return null;
  }
}

// Get summary of all patient files
async function getAllPatientFilesSummary(limit: number) {
  try {
    // Get all patients who have medical activity
    const patientsWithActivity = await MedicalRecord.distinct('patient_id');
    
    const patientFilesSummary = await Promise.all(
      patientsWithActivity.slice(0, limit).map(async (patientId) => {
        const UserModel = (await import('@/models/User')).default;
        const patient = await UserModel.findOne({ student_id: patientId });
        
        if (!patient) return null;
        
        // Get counts
        const [recordCount, appointmentCount, consultationCount] = await Promise.all([
          MedicalRecord.countDocuments({ patient_id: patientId }),
          Appointment.countDocuments({ patient_id: patientId }),
          Consultation.countDocuments({ patient_id: patientId })
        ]);
        
        // Get latest activity
        const latestRecord = await MedicalRecord.findOne({ patient_id: patientId })
          .sort({ record_date: -1 });
        
        // Get most recent diagnosis
        const recentDiagnoses = await MedicalRecord.find({ patient_id: patientId })
          .sort({ record_date: -1 })
          .limit(3);
        
        return {
          patient_id: patientId,
          patient_name: patient.name,
          program: patient.program,
          level: patient.level,
          
          // Activity Summary
          total_records: recordCount,
          total_appointments: appointmentCount,
          total_consultations: consultationCount,
          
          // Latest Activity
          last_visit: latestRecord?.record_date || null,
          last_doctor: latestRecord?.doctor_name || null,
          
          // Recent Medical Status
          recent_diagnoses: recentDiagnoses.map(r => r.final_diagnosis).filter(d => d).slice(0, 2),
          
          // File Status
          file_completeness: calculateFileCompleteness(recordCount, appointmentCount, consultationCount),
          active_status: recordCount > 0 ? 'active' : 'inactive'
        };
      })
    );
    
    return patientFilesSummary.filter(file => file !== null);
    
  } catch (error) {
    console.error('Error getting patient files summary:', error);
    return [];
  }
}

// Helper functions
function getMostCommonItems(items: string[], top = 5) {
  const counts = items.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(counts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, top)
    .map(([item, count]) => ({ item, count }));
}

function calculateAttendanceRate(appointments: any[]) {
  if (appointments.length === 0) return 100;
  const completed = appointments.filter(apt => apt.status === 'completed').length;
  return Math.round((completed / appointments.length) * 100);
}

function calculateMonthlyAverage(consultations: any[]) {
  if (consultations.length === 0) return 0;
  const months = new Set(consultations.map(c => 
    new Date(c.createdAt).toISOString().substring(0, 7)
  ));
  return Math.round((consultations.length / months.size) * 10) / 10;
}

function calculateFileCompleteness(records: number, appointments: number, consultations: number) {
  // Simple scoring: consultations (30%), appointments (40%), records (30%)
  const consultationScore = Math.min(consultations * 10, 30); // Max 30 points
  const appointmentScore = Math.min(appointments * 10, 40);   // Max 40 points  
  const recordScore = Math.min(records * 10, 30);             // Max 30 points
  
  return Math.min(consultationScore + appointmentScore + recordScore, 100);
}

function generateClinicalSummary(records: any[], consultations: any[], appointments: any[]) {
  if (records.length === 0 && consultations.length === 0) {
    return "No significant medical history. Student appears to be in good health with minimal healthcare utilization.";
  }
  
  const recentDiagnoses = records.slice(0, 3).map(r => r.final_diagnosis).filter(d => d);
  const commonSymptoms = getMostCommonItems(consultations.flatMap(c => c.symptoms || []), 3);
  
  let summary = "";
  
  if (recentDiagnoses.length > 0) {
    summary += `Recent medical concerns include ${recentDiagnoses.join(', ')}. `;
  }
  
  if (commonSymptoms.length > 0) {
    summary += `Patient frequently reports ${commonSymptoms.map(s => s.item).join(', ')}. `;
  }
  
  const urgentCases = consultations.filter(c => c.urgency_level === 'high' || c.urgency_level === 'emergency').length;
  if (urgentCases > 0) {
    summary += `Has had ${urgentCases} urgent medical consultation(s). `;
  }
  
  summary += `Overall healthcare engagement: ${appointments.length} appointments, ${consultations.length} AI consultations, ${records.length} documented medical encounters.`;
  
  return summary || "Minimal medical history available.";
}

export { buildPatientFile };