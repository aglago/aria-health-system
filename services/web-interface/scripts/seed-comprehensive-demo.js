/**
 * Comprehensive Demo Data Seeding Script for UMaT ARIA Health System
 * Creates realistic, interconnected medical ecosystem for presentation
 */

const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aria-health-system';

// Extended student and doctor pools
const students = [
  // All students that exist in the database after seeding
  { id: 'BS424100620', name: 'Kwame Asante', program: 'Computer Science and Engineering', level: '400' },
  { id: 'FOE456888102', name: 'Esi Osei', program: 'Mining Engineering', level: '300' },
  { id: 'ENG202011045', name: 'Yaw Boateng', program: 'Electrical Engineering', level: '200' },
  { id: 'GEO789123456', name: 'Akosua Adjei', program: 'Geomatic Engineering', level: '400' },
  { id: 'MET321654987', name: 'Kofi Mensah', program: 'Metallurgical Engineering', level: '300' },
  { id: 'PET147258369', name: 'Ama Darko', program: 'Petroleum Engineering', level: '200' },
  { id: 'CIV963852741', name: 'Kwadwo Nyong', program: 'Civil Engineering', level: '400' },
  { id: 'CHE159357486', name: 'Akua Frimpong', program: 'Chemical Engineering', level: '300' },
  { id: 'ENV486231759', name: 'Nana Owusu', program: 'Environmental Engineering', level: '200' },
  { id: 'AGR753951426', name: 'Efua Asare', program: 'Agricultural Engineering', level: '400' },
  { id: 'ELE852741963', name: 'Kojo Antwi', program: 'Electrical Engineering', level: '300' },
  { id: 'MEC741852963', name: 'Abena Kusi', program: 'Mechanical Engineering', level: '200' },
  { id: 'MIN369258147', name: 'Yaa Bonsu', program: 'Mining Engineering', level: '400' }
];

const doctors = [
  { id: 'UMAT-DOC-001', name: 'Dr. Akosua Mensah', specialization: 'general-practitioner' },
  { id: 'UMAT-DOC-002', name: 'Dr. Kwaku Adjei', specialization: 'internal-medicine' },
  { id: 'UMAT-DOC-003', name: 'Dr. Abena Frimpong', specialization: 'psychiatrist' },
  { id: 'UMAT-DOC-004', name: 'Dr. Emmanuel Asante', specialization: 'general-practitioner' },
  { id: 'UMAT-DOC-005', name: 'Dr. Mary Okyere', specialization: 'emergency-medicine' }
];

// UMaT/Ghana-specific medical scenarios
const medicalScenarios = [
  // Tropical/Endemic diseases
  {
    symptoms: ['fever', 'headache', 'body aches', 'fatigue'],
    diagnosis: 'Malaria',
    urgency: 'high',
    chief_complaint: 'High fever and severe headache for 2 days',
    specialization: 'general-practitioner'
  },
  {
    symptoms: ['fever', 'abdominal pain', 'diarrhea', 'weakness'],
    diagnosis: 'Typhoid Fever',
    urgency: 'high',
    chief_complaint: 'Persistent fever with abdominal pain and loose stools',
    specialization: 'internal-medicine'
  },
  {
    symptoms: ['skin rash', 'itching', 'burning sensation'],
    diagnosis: 'Fungal Skin Infection',
    urgency: 'medium',
    chief_complaint: 'Itchy rash on feet and between toes',
    specialization: 'general-practitioner'
  },
  
  // Academic stress-related
  {
    symptoms: ['anxiety', 'insomnia', 'headache', 'fatigue'],
    diagnosis: 'Exam Anxiety Disorder',
    urgency: 'medium',
    chief_complaint: 'Cannot sleep, very anxious about upcoming finals',
    specialization: 'psychiatrist'
  },
  {
    symptoms: ['headache', 'eye strain', 'neck pain'],
    diagnosis: 'Computer Vision Syndrome',
    urgency: 'low',
    chief_complaint: 'Constant headaches from long hours coding',
    specialization: 'general-practitioner'
  },
  {
    symptoms: ['stress', 'depression', 'isolation'],
    diagnosis: 'Academic Stress Disorder',
    urgency: 'medium',
    chief_complaint: 'Feeling overwhelmed with coursework and projects',
    specialization: 'psychiatrist'
  },
  
  // Gastrointestinal (Food/Water safety)
  {
    symptoms: ['nausea', 'vomiting', 'diarrhea', 'abdominal pain'],
    diagnosis: 'Food Poisoning',
    urgency: 'high',
    chief_complaint: 'Severe vomiting and diarrhea after eating at cafeteria',
    specialization: 'internal-medicine'
  },
  {
    symptoms: ['abdominal pain', 'nausea', 'loss of appetite'],
    diagnosis: 'Gastritis',
    urgency: 'medium',
    chief_complaint: 'Burning stomach pain, especially when hungry',
    specialization: 'internal-medicine'
  },
  
  // Respiratory (Dust/Environmental)
  {
    symptoms: ['cough', 'shortness of breath', 'chest tightness'],
    diagnosis: 'Upper Respiratory Tract Infection',
    urgency: 'medium',
    chief_complaint: 'Persistent cough and difficulty breathing',
    specialization: 'general-practitioner'
  },
  {
    symptoms: ['cough', 'sore throat', 'runny nose'],
    diagnosis: 'Common Cold',
    urgency: 'low',
    chief_complaint: 'Runny nose and sore throat for 3 days',
    specialization: 'general-practitioner'
  },
  
  // Musculoskeletal (Physical strain)
  {
    symptoms: ['back pain', 'neck stiffness', 'muscle aches'],
    diagnosis: 'Mechanical Back Pain',
    urgency: 'medium',
    chief_complaint: 'Lower back pain from carrying heavy textbooks',
    specialization: 'general-practitioner'
  },
  {
    symptoms: ['joint pain', 'stiffness', 'swelling'],
    diagnosis: 'Sports Injury',
    urgency: 'medium',
    chief_complaint: 'Knee pain after playing football yesterday',
    specialization: 'general-practitioner'
  },
  
  // Urogenital (Hygiene/Dehydration)
  {
    symptoms: ['burning urination', 'frequent urination', 'pelvic pain'],
    diagnosis: 'Urinary Tract Infection',
    urgency: 'medium',
    chief_complaint: 'Burning sensation when urinating for 2 days',
    specialization: 'general-practitioner'
  },
  
  // Heat/Climate related
  {
    symptoms: ['excessive sweating', 'dizziness', 'weakness'],
    diagnosis: 'Heat Exhaustion',
    urgency: 'medium',
    chief_complaint: 'Feel dizzy and weak after long hours in the sun',
    specialization: 'general-practitioner'
  },
  {
    symptoms: ['headache', 'nausea', 'dehydration'],
    diagnosis: 'Dehydration',
    urgency: 'medium',
    chief_complaint: 'Severe headache and feeling very thirsty',
    specialization: 'general-practitioner'
  },
  
  // Nutritional/Lifestyle
  {
    symptoms: ['fatigue', 'weakness', 'pale skin'],
    diagnosis: 'Iron Deficiency Anemia',
    urgency: 'medium',
    chief_complaint: 'Always tired and feeling weak',
    specialization: 'internal-medicine'
  },
  {
    symptoms: ['headache', 'dizziness', 'palpitations'],
    diagnosis: 'Hypertension',
    urgency: 'high',
    chief_complaint: 'Frequent headaches and heart racing',
    specialization: 'internal-medicine'
  },
  
  // Additional scenarios for better surveillance data
  {
    symptoms: ['cough', 'fever', 'night sweats', 'weight loss'],
    diagnosis: 'Tuberculosis Screening',
    urgency: 'high',
    chief_complaint: 'Persistent cough with night sweats and weight loss',
    specialization: 'internal-medicine'
  },
  {
    symptoms: ['joint pain', 'fever', 'rash', 'fatigue'],
    diagnosis: 'Rheumatic Fever',
    urgency: 'high',
    chief_complaint: 'Multiple joint pain with fever and skin rash',
    specialization: 'internal-medicine'
  },
  {
    symptoms: ['abdominal pain', 'vomiting', 'diarrhea', 'dehydration'],
    diagnosis: 'Food Poisoning',
    urgency: 'medium',
    chief_complaint: 'Severe stomach pain with vomiting after eating',
    specialization: 'general-practitioner'
  },
  {
    symptoms: ['chest pain', 'shortness of breath', 'anxiety'],
    diagnosis: 'Anxiety Disorder',
    urgency: 'medium',
    chief_complaint: 'Chest tightness and difficulty breathing during exams',
    specialization: 'psychiatrist'
  },
  {
    symptoms: ['skin rash', 'itching', 'swelling'],
    diagnosis: 'Allergic Reaction',
    urgency: 'medium',
    chief_complaint: 'Widespread itchy rash after eating groundnuts',
    specialization: 'general-practitioner'
  },
  {
    symptoms: ['wound', 'bleeding', 'pain'],
    diagnosis: 'Laceration',
    urgency: 'medium',
    chief_complaint: 'Deep cut on hand from workshop accident',
    specialization: 'general-practitioner'
  },
  {
    symptoms: ['ear pain', 'hearing loss', 'discharge'],
    diagnosis: 'Otitis Media',
    urgency: 'medium',
    chief_complaint: 'Severe ear pain with discharge',
    specialization: 'general-practitioner'
  },
  {
    symptoms: ['tooth pain', 'swelling', 'fever'],
    diagnosis: 'Dental Abscess',
    urgency: 'medium',
    chief_complaint: 'Severe tooth pain with facial swelling',
    specialization: 'general-practitioner'
  },
  {
    symptoms: ['menstrual irregularities', 'pelvic pain', 'fatigue'],
    diagnosis: 'Menstrual Disorder',
    urgency: 'low',
    chief_complaint: 'Irregular and painful menstrual periods',
    specialization: 'general-practitioner'
  },
  {
    symptoms: ['insomnia', 'mood swings', 'concentration problems'],
    diagnosis: 'Depression',
    urgency: 'medium',
    chief_complaint: 'Unable to sleep and feeling constantly sad',
    specialization: 'psychiatrist'
  },
  {
    symptoms: ['frequent urination', 'excessive thirst', 'fatigue'],
    diagnosis: 'Diabetes Mellitus',
    urgency: 'high',
    chief_complaint: 'Always thirsty and urinating frequently',
    specialization: 'internal-medicine'
  },
  {
    symptoms: ['muscle strain', 'back pain', 'stiffness'],
    diagnosis: 'Sports Injury',
    urgency: 'low',
    chief_complaint: 'Lower back strain from lifting heavy equipment',
    specialization: 'general-practitioner'
  }
];

function generateRandomDate(daysAgo) {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateConsultationMessages(scenario, studentName) {
  const baseMessages = [
    {
      role: 'user',
      message: scenario.chief_complaint,
      timestamp: new Date()
    },
    {
      role: 'assistant',
      message: `Hello ${studentName.split(' ')[0]}, I understand you're experiencing some health concerns. Can you tell me more about when these symptoms started?`,
      timestamp: new Date()
    },
    {
      role: 'user',
      message: `It started about ${Math.floor(Math.random() * 5) + 1} days ago and has been getting ${Math.random() > 0.5 ? 'worse' : 'better'}.`,
      timestamp: new Date()
    }
  ];
  
  // Add symptom-specific follow-up
  if (scenario.symptoms.includes('fever')) {
    baseMessages.push({
      role: 'assistant',
      message: 'Have you measured your temperature? And have you taken any medication for the fever?',
      timestamp: new Date()
    });
    baseMessages.push({
      role: 'user',
      message: `Yes, it was ${(37.5 + Math.random() * 2).toFixed(1)} degrees this morning. I took paracetamol but it didn't help much.`,
      timestamp: new Date()
    });
  }
  
  if (scenario.symptoms.includes('pain')) {
    baseMessages.push({
      role: 'assistant',
      message: 'On a scale of 1-10, how would you rate your pain level?',
      timestamp: new Date()
    });
    baseMessages.push({
      role: 'user',
      message: `I would say it's about ${Math.floor(Math.random() * 4) + 5}/10.`,
      timestamp: new Date()
    });
  }
  
  return baseMessages;
}

async function generateComprehensiveData() {
  const consultations = [];
  const appointments = [];
  const medicalRecords = [];
  
  // Generate 150+ consultations over the past 60 days for better disease surveillance
  for (let i = 0; i < 150; i++) {
    const student = getRandomElement(students);
    const scenario = getRandomElement(medicalScenarios);
    const daysAgo = Math.floor(Math.random() * 60); // Past 60 days for better trends
    const consultationDate = generateRandomDate(daysAgo);
    
    const sessionId = `demo-session-${String(i + 100).padStart(3, '0')}`;
    
    const consultation = {
      session_id: sessionId,
      patient_id: student.id,
      messages: generateConsultationMessages(scenario, student.name),
      
      // Symptom Analysis
      symptoms: scenario.symptoms,
      symptom_duration: `${Math.floor(Math.random() * 7) + 1} days`,
      symptom_severity: scenario.urgency === 'high' ? 'severe' : scenario.urgency === 'medium' ? 'moderate' : 'mild',
      symptom_onset: 'gradual',
      
      // Medical Assessment
      diagnosis_summary: `Patient presents with ${scenario.symptoms.join(', ')}. Clinical presentation consistent with ${scenario.diagnosis}.`,
      primary_concern: scenario.chief_complaint,
      differential_diagnosis: [scenario.diagnosis],
      urgency_level: scenario.urgency,
      requires_immediate_care: scenario.urgency === 'high',
      confidence_score: (Math.floor(Math.random() * 20) + 80) / 100, // 0.80-1.00
      medical_reasoning: `Based on symptom pattern and patient history, diagnosis of ${scenario.diagnosis} is most consistent with clinical presentation.`,
      
      // Clinical Information
      vital_signs: scenario.urgency === 'high' ? {
        temperature: '38.5°C',
        heart_rate: '95 bpm',
        blood_pressure: '130/85 mmHg'
      } : {},
      reported_pain_level: scenario.symptoms.some(s => s.includes('pain')) ? Math.floor(Math.random() * 4) + 5 : undefined,
      
      // Assessment and Plan
      recommended_actions: [
        'Schedule medical consultation',
        'Monitor symptoms closely',
        scenario.urgency === 'high' ? 'Seek immediate medical attention' : 'Continue supportive care',
        'Follow up in 3-5 days if symptoms persist'
      ],
      suggested_tests: scenario.diagnosis === 'Malaria' ? ['Malaria RDT', 'FBC'] :
                       scenario.diagnosis === 'Hypertension' ? ['Blood pressure monitoring', 'ECG'] :
                       scenario.diagnosis === 'Iron Deficiency Anemia' ? ['FBC', 'Iron studies'] : 
                       ['Routine blood work if symptoms persist'],
      red_flags: scenario.urgency === 'high' ? [
        'High fever above 39°C',
        'Severe dehydration',
        'Altered consciousness'
      ] : [],
      when_to_seek_immediate_care: scenario.urgency === 'high' ? [
        'If fever rises above 39.5°C',
        'If symptoms worsen rapidly',
        'If unable to keep fluids down'
      ] : [],
      
      // Appointment Context
      appointment_recommended: true,
      appointment_urgency: scenario.urgency === 'high' ? 'urgent' : 'routine',
      appointment_created: true,
      pre_appointment_instructions: [
        'Bring list of current medications',
        'Monitor temperature if feverish',
        'Stay hydrated'
      ],
      
      // Session Management
      status: 'completed',
      duration_minutes: Math.floor(Math.random() * 15) + 10,
      follow_up_required: scenario.urgency !== 'low',
      consultation_completeness: Math.floor(Math.random() * 15) + 85, // 85-100%
      
      createdAt: consultationDate,
      updatedAt: consultationDate
    };
    
    consultations.push(consultation);
    
    // Generate corresponding appointment (90% of consultations get appointments)
    if (consultation.appointment_created) {
      const doctor = doctors.find(d => d.specialization === scenario.specialization) || getRandomElement(doctors);
      const appointmentDate = new Date(consultationDate.getTime() + (Math.floor(Math.random() * 7) + 1) * 24 * 60 * 60 * 1000); // 1-7 days after consultation
      const appointmentTime = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'][Math.floor(Math.random() * 7)];
      
      const appointment = {
        patient_id: student.id,
        doctor_name: doctor.name,
        doctor_id: doctor.id,
        date: appointmentDate,
        time: appointmentTime,
        type: scenario.urgency === 'high' ? 'Urgent Consultation' : 'General Consultation',
        notes: `Booked through Dr. ARIA consultation - ${scenario.diagnosis} evaluation`,
        consultation_id: sessionId,
        symptoms: scenario.symptoms,
        urgency_level: scenario.urgency,
        status: appointmentDate < new Date() ? 'completed' : 'scheduled',
        medical_notes: appointmentDate < new Date() ? `Patient evaluated for ${scenario.diagnosis}. ${scenario.urgency === 'high' ? 'Immediate treatment initiated.' : 'Standard treatment protocol followed.'}` : undefined,
        created_from_consultation: true
      };
      
      appointments.push(appointment);
      
      // Generate medical record for completed appointments (80% get records)
      if (appointment.status === 'completed' && Math.random() > 0.2) {
        const medicalRecord = generateMedicalRecord(student, doctor, scenario, appointment, consultation);
        medicalRecords.push(medicalRecord);
      }
    }
  }
  
  return { consultations, appointments, medicalRecords };
}

function generateMedicalRecord(student, doctor, scenario, appointment, consultation) {
  const medications = {
    'Malaria': [
      { name: 'Artemether-Lumefantrine', dosage: '20/120mg', frequency: 'Twice daily', duration: '3 days' },
      { name: 'Paracetamol', dosage: '500mg', frequency: 'Every 6 hours as needed', duration: '5 days' }
    ],
    'Typhoid Fever': [
      { name: 'Ciprofloxacin', dosage: '500mg', frequency: 'Twice daily', duration: '7 days' },
      { name: 'Paracetamol', dosage: '500mg', frequency: 'Every 6 hours as needed', duration: '7 days' }
    ],
    'Food Poisoning': [
      { name: 'Ondansetron', dosage: '4mg', frequency: 'Every 8 hours', duration: '2 days' },
      { name: 'ORS Sachets', dosage: '1 sachet', frequency: 'Every 2 hours', duration: '3 days' }
    ],
    'Urinary Tract Infection': [
      { name: 'Trimethoprim-Sulfamethoxazole', dosage: '160/800mg', frequency: 'Twice daily', duration: '5 days' }
    ],
    'Upper Respiratory Tract Infection': [
      { name: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', duration: '7 days' },
      { name: 'Cough syrup', dosage: '10ml', frequency: 'Three times daily', duration: '5 days' }
    ]
  };
  
  const defaultMedications = [
    { name: 'Paracetamol', dosage: '500mg', frequency: 'As needed', duration: '5 days' }
  ];
  
  const recordMedications = medications[scenario.diagnosis] || defaultMedications;
  
  return {
    patient_id: student.id,
    doctor_id: doctor.id,
    appointment_id: null, // Will be set later
    consultation_id: consultation.session_id,
    record_date: appointment.date,
    
    // Clinical Assessment
    chief_complaint: scenario.chief_complaint,
    history_of_present_illness: consultation.history_of_present_illness,
    review_of_systems: `Positive for ${scenario.symptoms.join(', ')}. Review of other systems negative.`,
    final_diagnosis: scenario.diagnosis,
    differential_diagnosis: getDifferentialDiagnosis(scenario.diagnosis),
    assessment_notes: `Clinical presentation consistent with ${scenario.diagnosis}. ${student.name} is a ${student.level} level ${student.program} student.`,
    
    // Physical Examination
    vital_signs: generateVitalSigns(scenario),
    physical_examination_findings: generatePhysicalExamFindings(scenario),
    
    // Treatment
    treatment_plan: generateTreatmentPlan(scenario.diagnosis),
    medications_prescribed: recordMedications.map(med => ({
      medication_name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      instructions: 'Take as directed'
    })),
    
    // Follow-up
    follow_up_instructions: generateFollowUpInstructions(scenario.diagnosis),
    follow_up_required: scenario.urgency !== 'low',
    follow_up_date: scenario.urgency !== 'low' ? new Date(appointment.date.getTime() + 7 * 24 * 60 * 60 * 1000) : undefined,
    patient_education_provided: generatePatientEducation(scenario.diagnosis),
    
    severity_level: scenario.urgency,
    record_type: 'outpatient',
    status: 'signed',
    doctor_name: doctor.name
  };
}

function getDifferentialDiagnosis(diagnosis) {
  const differentials = {
    'Malaria': ['Viral fever', 'Typhoid fever', 'Bacterial infection'],
    'Typhoid Fever': ['Malaria', 'Gastroenteritis', 'Viral fever'],
    'Food Poisoning': ['Gastroenteritis', 'Peptic ulcer', 'Appendicitis'],
    'Urinary Tract Infection': ['Kidney stones', 'Bladder irritation', 'STI'],
    'Upper Respiratory Tract Infection': ['Common cold', 'Sinusitis', 'Bronchitis']
  };
  
  return differentials[diagnosis] || ['Further evaluation needed'];
}

function generateVitalSigns(scenario) {
  const baseVitals = {
    blood_pressure: '120/80',
    heart_rate: 72,
    temperature: 37.0,
    respiratory_rate: 16,
    oxygen_saturation: 98,
    weight: Math.floor(Math.random() * 30) + 55,
    height: Math.floor(Math.random() * 25) + 160
  };
  
  // Adjust based on condition
  if (scenario.symptoms.includes('fever')) {
    baseVitals.temperature = 37.8 + Math.random() * 1.5;
    baseVitals.heart_rate = 85 + Math.floor(Math.random() * 20);
  }
  
  if (scenario.urgency === 'high') {
    baseVitals.heart_rate += 10;
    baseVitals.blood_pressure = '130/85';
  }
  
  return baseVitals;
}

function generatePhysicalExamFindings(scenario) {
  const findings = [];
  
  if (scenario.symptoms.includes('fever')) {
    findings.push('Febrile, appears mildly ill');
  }
  
  if (scenario.symptoms.includes('abdominal pain')) {
    findings.push('Abdomen soft with tenderness in epigastric region');
  } else {
    findings.push('Abdomen soft, non-tender');
  }
  
  if (scenario.symptoms.includes('cough')) {
    findings.push('Chest examination reveals scattered rhonchi');
  } else {
    findings.push('Chest clear to auscultation');
  }
  
  findings.push('Heart sounds normal, no murmurs');
  findings.push('No lymphadenopathy');
  
  return findings.join('. ') + '.';
}

function generateTreatmentPlan(diagnosis) {
  const plans = {
    'Malaria': 'Antimalarial therapy with artemether-lumefantrine. Supportive care with paracetamol. Patient education on prevention.',
    'Typhoid Fever': 'Antibiotic therapy with ciprofloxacin. Supportive care and dietary modifications. Monitor for complications.',
    'Food Poisoning': 'Supportive care with IV fluids if needed. Antiemetic therapy. Dietary modifications.',
    'Urinary Tract Infection': 'Antibiotic therapy. Increased fluid intake. Follow-up urine culture.',
    'Upper Respiratory Tract Infection': 'Symptomatic treatment. Antibiotics if bacterial. Rest and adequate fluids.',
    'Exam Anxiety Disorder': 'Cognitive behavioral therapy techniques. Stress management education. Academic counseling referral.',
    'Heat Exhaustion': 'Immediate cooling measures. Fluid replacement. Activity modification advice.'
  };
  
  return plans[diagnosis] || 'Standard supportive care and symptomatic treatment as appropriate.';
}

function generateFollowUpInstructions(diagnosis) {
  const instructions = {
    'Malaria': 'Return in 3 days if symptoms persist. Complete full course of medication. Use bed nets.',
    'Typhoid Fever': 'Return in 1 week for follow-up. Complete antibiotic course. Maintain good hygiene.',
    'Food Poisoning': 'Return if severe dehydration or persistent symptoms. Resume normal diet gradually.',
    'Urinary Tract Infection': 'Return in 1 week. Increase water intake. Practice good hygiene.',
    'Upper Respiratory Tract Infection': 'Return if symptoms worsen or persist beyond 7 days.'
  };
  
  return instructions[diagnosis] || 'Return if symptoms worsen or new symptoms develop.';
}

function generatePatientEducation(diagnosis) {
  const education = {
    'Malaria': 'Malaria prevention strategies, proper medication adherence, when to seek emergency care',
    'Typhoid Fever': 'Food and water safety, hand hygiene, importance of completing antibiotic course',
    'Food Poisoning': 'Food safety practices, hydration importance, when to seek emergency care',
    'Urinary Tract Infection': 'Proper hygiene practices, adequate hydration, safe sexual practices',
    'Exam Anxiety Disorder': 'Stress management techniques, study strategies, campus counseling resources'
  };
  
  return education[diagnosis] || 'General health maintenance and when to seek medical care';
}

async function seedComprehensiveDemo() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🚀 Creating comprehensive demo ecosystem for UMaT ARIA Health System...\n');
    console.log('🌱 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db();
    
    // Clear existing demo data
    console.log('🗑️ Clearing existing demo data...');
    await db.collection('consultations').deleteMany({ session_id: { $regex: '^demo-session-' } });
    await db.collection('appointments').deleteMany({ consultation_id: { $regex: '^demo-session-' } });
    await db.collection('medicalrecords').deleteMany({ consultation_id: { $regex: '^demo-session-' } });
    
    console.log('📊 Generating comprehensive medical data...');
    const { consultations, appointments, medicalRecords } = await generateComprehensiveData();
    
    console.log('💬 Inserting consultations...');
    const consultationResult = await db.collection('consultations').insertMany(consultations);
    console.log(`✅ Inserted ${consultationResult.insertedCount} consultations`);
    
    console.log('📅 Inserting appointments...');
    const appointmentResult = await db.collection('appointments').insertMany(appointments);
    console.log(`✅ Inserted ${appointmentResult.insertedCount} appointments`);
    
    // Link consultations with appointments
    const appointmentIds = Object.values(appointmentResult.insertedIds);
    for (let i = 0; i < Math.min(appointments.length, appointmentIds.length); i++) {
      await db.collection('consultations').updateOne(
        { session_id: appointments[i].consultation_id },
        { $set: { appointment_id: appointmentIds[i].toString() } }
      );
    }
    
    // Update medical records with appointment IDs
    for (let i = 0; i < Math.min(medicalRecords.length, appointmentIds.length); i++) {
      if (medicalRecords[i]) {
        medicalRecords[i].appointment_id = appointmentIds[i];
      }
    }
    
    console.log('📋 Inserting medical records...');
    if (medicalRecords.length > 0) {
      const medicalRecordResult = await db.collection('medicalrecords').insertMany(medicalRecords);
      console.log(`✅ Inserted ${medicalRecordResult.insertedCount} medical records`);
    }
    
    // Generate analytics summary
    const diagnosisStats = {};
    const symptomStats = {};
    const urgencyStats = { low: 0, medium: 0, high: 0, emergency: 0 };
    
    consultations.forEach(consultation => {
      // Count diagnoses (approximate from AI assessment)
      const diagnosisMatch = consultation.ai_assessment_summary.match(/consistent with (\w+[\w\s]*)/);
      if (diagnosisMatch) {
        const diagnosis = diagnosisMatch[1];
        diagnosisStats[diagnosis] = (diagnosisStats[diagnosis] || 0) + 1;
      }
      
      // Count symptoms
      consultation.symptoms.forEach(symptom => {
        symptomStats[symptom] = (symptomStats[symptom] || 0) + 1;
      });
      
      // Count urgency levels
      urgencyStats[consultation.urgency_level]++;
    });
    
    console.log('\n🎯 COMPREHENSIVE DEMO ECOSYSTEM CREATED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log(`📊 Data Summary:`);
    console.log(`  • ${consultations.length} Dr. ARIA consultations`);
    console.log(`  • ${appointments.length} appointments scheduled`);
    console.log(`  • ${medicalRecords.length} medical records created`);
    console.log(`  • ${students.length} students represented`);
    console.log(`  • ${doctors.length} doctors available`);
    
    console.log(`\n🏥 Top Medical Conditions:`);
    Object.entries(diagnosisStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([diagnosis, count]) => {
        console.log(`  • ${diagnosis}: ${count} cases`);
      });
    
    console.log(`\n🌡️ Common Symptoms:`);
    Object.entries(symptomStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .forEach(([symptom, count]) => {
        console.log(`  • ${symptom}: ${count} reports`);
      });
    
    console.log(`\n⚡ Urgency Distribution:`);
    console.log(`  • Emergency: ${urgencyStats.emergency} cases`);
    console.log(`  • High: ${urgencyStats.high} cases`);
    console.log(`  • Medium: ${urgencyStats.medium} cases`);
    console.log(`  • Low: ${urgencyStats.low} cases`);
    
    console.log(`\n🎭 Demo Students Available:`);
    students.slice(0, 5).forEach(student => {
      console.log(`  • ${student.id} - ${student.name} (${student.program})`);
    });
    
    console.log(`\n👩‍⚕️ Demo Doctors Available:`);
    doctors.forEach(doctor => {
      console.log(`  • ${doctor.id} - ${doctor.name} (${doctor.specialization})`);
    });
    
    console.log('\n🎉 PRESENTATION-READY SYSTEM!');
    console.log('   ✅ Rich Dr. ARIA consultation history');
    console.log('   ✅ Comprehensive appointment scheduling');
    console.log('   ✅ Complete medical record workflows');
    console.log('   ✅ Disease surveillance with real patterns');
    console.log('   ✅ All data converging at insights dashboard');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('❌ Error creating comprehensive demo data:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeder
if (require.main === module) {
  seedComprehensiveDemo();
}

module.exports = { seedComprehensiveDemo };