/**
 * Demo Data Seeding Script for UMaT ARIA Health System
 * Creates realistic medical data for demonstration purposes
 */

const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aria-health-system';

const demoConsultations = [
  {
    session_id: 'demo-session-001',
    patient_id: 'BS424100620',
    consultation_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    symptoms: ['fever', 'headache', 'fatigue'],
    chief_complaint: 'I have been having fever and headache for the past 3 days',
    history_of_present_illness: 'Student reports onset of fever (38.5°C) with severe headache and body weakness. Symptoms started gradually and have been persistent.',
    urgency_level: 'medium',
    severity_assessment: 'medium',
    ai_assessment_summary: 'Patient presents with fever, headache, and fatigue. Could be malaria or viral infection. Recommend immediate medical evaluation.',
    confidence_score: 85,
    completeness_score: 90,
    messages: [
      {
        role: 'user',
        message: 'I have been having fever and headache for the past 3 days',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        role: 'assistant',
        message: 'I understand you\'ve been experiencing fever and headache for 3 days. Can you tell me more about the fever? Have you measured your temperature?',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        role: 'user',
        message: 'Yes, it was 38.5 degrees this morning. I also feel very weak and tired.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ],
    appointment_created: true,
    appointment_id: null, // Will be set after appointment creation
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    session_id: 'demo-session-002',
    patient_id: 'FOE456888102',
    consultation_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    symptoms: ['abdominal pain', 'nausea', 'vomiting'],
    chief_complaint: 'Severe stomach pain and vomiting since yesterday',
    history_of_present_illness: 'Student reports sudden onset of severe abdominal pain with nausea and vomiting. Ate at campus cafeteria before symptoms started.',
    urgency_level: 'high',
    severity_assessment: 'high',
    ai_assessment_summary: 'Patient presents with acute gastroenteritis symptoms. Possible food poisoning. Requires urgent medical attention for dehydration risk.',
    confidence_score: 92,
    completeness_score: 95,
    messages: [
      {
        role: 'user',
        message: 'I have severe stomach pain and I have been vomiting since yesterday',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        role: 'assistant',
        message: 'I\'m sorry to hear about your stomach pain and vomiting. This sounds concerning. Where exactly is the pain located and how severe would you rate it?',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ],
    appointment_created: true,
    appointment_id: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    session_id: 'demo-session-003',
    patient_id: 'ENG202011045',
    consultation_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    symptoms: ['anxiety', 'stress', 'insomnia'],
    chief_complaint: 'Having trouble sleeping and feeling very anxious about upcoming exams',
    history_of_present_illness: 'Student reports difficulty sleeping for past week, increased anxiety levels, and stress related to upcoming final examinations.',
    urgency_level: 'medium',
    severity_assessment: 'medium',
    ai_assessment_summary: 'Student experiencing exam-related anxiety and sleep disturbances. Recommend mental health support and stress management techniques.',
    confidence_score: 88,
    completeness_score: 85,
    messages: [
      {
        role: 'user',
        message: 'I can\'t sleep and I\'m very anxious about my exams',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ],
    appointment_created: true,
    appointment_id: null,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  }
];

const demoAppointments = [
  {
    patient_id: 'BS424100620',
    doctor_name: 'Dr. Akosua Mensah',
    doctor_id: 'UMAT-DOC-001',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
    time: '09:00 AM',
    type: 'General Consultation',
    notes: 'Booked through Dr. ARIA consultation - Fever and headache evaluation',
    consultation_id: 'demo-session-001',
    symptoms: ['fever', 'headache', 'fatigue'],
    urgency_level: 'medium',
    status: 'completed',
    medical_notes: 'Patient presented with fever (38.5°C), headache, and fatigue. Rapid diagnostic test positive for malaria. Started on antimalarial treatment.',
    created_from_consultation: true
  },
  {
    patient_id: 'FOE456888102',
    doctor_name: 'Dr. Kwaku Adjei',
    doctor_id: 'UMAT-DOC-002',
    date: new Date(), // Today
    time: '10:30 AM',
    type: 'Urgent Consultation',
    notes: 'Booked through Dr. ARIA consultation - Acute gastroenteritis',
    consultation_id: 'demo-session-002',
    symptoms: ['abdominal pain', 'nausea', 'vomiting'],
    urgency_level: 'high',
    status: 'completed',
    medical_notes: 'Patient with acute gastroenteritis, likely food poisoning. Administered IV fluids and antiemetics. Symptoms improved significantly.',
    created_from_consultation: true
  },
  {
    patient_id: 'ENG202011045',
    doctor_name: 'Dr. Abena Frimpong',
    doctor_id: 'UMAT-DOC-003',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    time: '02:00 PM',
    type: 'Mental Health Consultation',
    notes: 'Booked through Dr. ARIA consultation - Exam anxiety and sleep issues',
    consultation_id: 'demo-session-003',
    symptoms: ['anxiety', 'stress', 'insomnia'],
    urgency_level: 'medium',
    status: 'scheduled',
    created_from_consultation: true
  }
];

const demoMedicalRecords = [
  {
    patient_id: 'BS424100620',
    doctor_id: 'UMAT-DOC-001',
    appointment_id: null, // Will be set after appointment creation
    consultation_id: 'demo-session-001',
    record_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    
    // Clinical Assessment
    chief_complaint: 'Fever, headache, and fatigue for 3 days',
    history_of_present_illness: 'Patient reports gradual onset of fever (measured at 38.5°C), severe headache, and generalized weakness over the past 3 days. No recent travel outside Ghana. Lives in campus accommodation.',
    review_of_systems: 'Positive for fever, headache, fatigue. Negative for cough, abdominal pain, urinary symptoms.',
    final_diagnosis: 'Malaria (Plasmodium falciparum)',
    differential_diagnosis: ['Viral fever', 'Typhoid fever'],
    assessment_notes: 'Classic presentation of malaria in endemic area. Rapid diagnostic test positive for P. falciparum.',
    
    // Physical Examination
    vital_signs: {
      blood_pressure: '110/70',
      heart_rate: 92,
      temperature: 38.2,
      respiratory_rate: 18,
      oxygen_saturation: 98,
      weight: 68,
      height: 172
    },
    physical_examination_findings: 'Alert and oriented. Mild pallor noted. No jaundice or lymphadenopathy. Chest clear. Heart sounds normal. Abdomen soft, non-tender. No hepatosplenomegaly.',
    
    // Treatment
    treatment_plan: 'Artemether-lumefantrine antimalarial therapy. Supportive care with paracetamol for fever. Patient education on malaria prevention.',
    medications_prescribed: [
      {
        medication_name: 'Artemether-Lumefantrine',
        dosage: '20/120mg',
        frequency: 'Twice daily',
        duration: '3 days',
        instructions: 'Take with food or milk'
      },
      {
        medication_name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Every 6 hours as needed',
        duration: '5 days',
        instructions: 'For fever and headache'
      }
    ],
    
    // Follow-up
    follow_up_instructions: 'Return in 3 days if symptoms persist. Use insecticide-treated bed nets. Seek immediate care if symptoms worsen.',
    follow_up_required: true,
    follow_up_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    patient_education_provided: 'Malaria prevention strategies, proper medication adherence, danger signs to watch for',
    
    severity_level: 'medium',
    record_type: 'outpatient',
    status: 'signed',
    doctor_name: 'Dr. Akosua Mensah'
  },
  {
    patient_id: 'FOE456888102',
    doctor_id: 'UMAT-DOC-002',
    appointment_id: null,
    consultation_id: 'demo-session-002',
    record_date: new Date(),
    
    // Clinical Assessment
    chief_complaint: 'Severe abdominal pain, nausea, and vomiting since yesterday',
    history_of_present_illness: 'Patient reports sudden onset of severe epigastric pain followed by nausea and multiple episodes of vomiting. Symptoms started 4 hours after eating at campus cafeteria. No fever initially.',
    review_of_systems: 'Positive for abdominal pain, nausea, vomiting. Negative for fever, diarrhea, urinary symptoms.',
    final_diagnosis: 'Acute Gastroenteritis (Food poisoning)',
    differential_diagnosis: ['Peptic ulcer disease', 'Appendicitis'],
    assessment_notes: 'Clinical presentation consistent with food poisoning. Good response to IV fluids and antiemetics.',
    
    // Physical Examination
    vital_signs: {
      blood_pressure: '105/65',
      heart_rate: 88,
      temperature: 37.1,
      respiratory_rate: 16,
      weight: 58,
      height: 165
    },
    physical_examination_findings: 'Appears mildly dehydrated. Abdomen soft with mild epigastric tenderness. No guarding or rebound. Bowel sounds normal.',
    
    // Treatment
    treatment_plan: 'IV fluid resuscitation, antiemetic therapy, dietary modification. Monitor for dehydration.',
    medications_prescribed: [
      {
        medication_name: 'Ondansetron',
        dosage: '4mg',
        frequency: 'Every 8 hours',
        duration: '2 days',
        instructions: 'For nausea and vomiting'
      },
      {
        medication_name: 'ORS Sachets',
        dosage: '1 sachet',
        frequency: 'Every 2 hours',
        duration: '3 days',
        instructions: 'Mix with clean water'
      }
    ],
    
    // Follow-up
    follow_up_instructions: 'Start with clear liquids, gradually advance diet. Return if symptoms worsen or persistent vomiting.',
    follow_up_required: false,
    patient_education_provided: 'Food safety practices, hydration importance, when to seek emergency care',
    
    severity_level: 'medium',
    record_type: 'outpatient',
    status: 'signed',
    doctor_name: 'Dr. Kwaku Adjei'
  }
];

async function seedDemoData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🌱 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db();
    
    // Clear existing demo data
    console.log('🗑️ Clearing existing demo data...');
    await db.collection('consultations').deleteMany({ session_id: { $regex: '^demo-session-' } });
    await db.collection('appointments').deleteMany({ consultation_id: { $regex: '^demo-session-' } });
    await db.collection('medicalrecords').deleteMany({ consultation_id: { $regex: '^demo-session-' } });
    
    // Insert consultations
    console.log('💬 Creating demo consultations...');
    const consultationResult = await db.collection('consultations').insertMany(demoConsultations);
    console.log(`✅ Inserted ${consultationResult.insertedCount} consultations`);
    
    // Insert appointments and link to consultations
    console.log('📅 Creating demo appointments...');
    const appointmentResult = await db.collection('appointments').insertMany(demoAppointments);
    console.log(`✅ Inserted ${appointmentResult.insertedCount} appointments`);
    
    // Update consultations with appointment IDs
    const appointmentIds = Object.values(appointmentResult.insertedIds);
    for (let i = 0; i < appointmentIds.length; i++) {
      await db.collection('consultations').updateOne(
        { session_id: demoConsultations[i].session_id },
        { $set: { appointment_id: appointmentIds[i].toString() } }
      );
    }
    
    // Update medical records with appointment IDs
    for (let i = 0; i < Math.min(demoMedicalRecords.length, appointmentIds.length); i++) {
      demoMedicalRecords[i].appointment_id = appointmentIds[i];
    }
    
    // Insert medical records
    console.log('📋 Creating demo medical records...');
    const medicalRecordResult = await db.collection('medicalrecords').insertMany(demoMedicalRecords);
    console.log(`✅ Inserted ${medicalRecordResult.insertedCount} medical records`);
    
    console.log('\n🎯 Demo Data Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📚 Student Cases:');
    console.log('  • Kwame Asante (BS424100620): Malaria - Completed');
    console.log('  • Esi Osei (FOE456888102): Food Poisoning - Completed');
    console.log('  • Yaw Boateng (ENG202011045): Exam Anxiety - Scheduled');
    
    console.log('\n👩‍⚕️ Doctor Assignments:');
    console.log('  • Dr. Akosua Mensah (GP): Malaria case');
    console.log('  • Dr. Kwaku Adjei (Internal Med): Gastroenteritis case');
    console.log('  • Dr. Abena Frimpong (Psychiatrist): Mental health case');
    
    console.log('\n📊 Data for Analytics:');
    console.log('  • Disease trends: Malaria, Gastroenteritis');
    console.log('  • Symptom patterns: Fever, headache, abdominal pain');
    console.log('  • Severity distribution: Medium-High priority cases');
    
    console.log('\n🎉 Demo system ready for presentation!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeder
if (require.main === module) {
  seedDemoData();
}

module.exports = { seedDemoData };