/**
 * Enhanced Consultation Seeding Script
 * Creates comprehensive Dr. ARIA conversations with proper scoring
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
async function importModels() {
  return {
    User: require('../src/models/User').default,
    Consultation: require('../src/models/Consultation').default,
    Appointment: require('../src/models/Appointment').default,
    MedicalRecord: require('../src/models/MedicalRecord').default
  };
}

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aria-health');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

// Enhanced conversation templates
const conversationTemplates = {
  malaria: {
    messages: [
      { role: 'user', content: "I've been having high fever and severe headache for 2 days now", delay: 0 },
      { role: 'assistant', content: "I understand you're experiencing fever and headache. This could be concerning. Can you tell me more about your symptoms? Have you measured your temperature, and are you experiencing any other symptoms like body aches, chills, or nausea?", delay: 2 },
      { role: 'user', content: "Yes, my temperature was 39.2°C this morning. I also have severe body aches and I've been feeling nauseous. I'm also experiencing chills and sweating", delay: 5 },
      { role: 'assistant', content: "Those are concerning symptoms that could indicate malaria, especially given the high fever and combination of symptoms you're describing. Have you been exposed to mosquitoes recently? Do you live in or have you traveled to any areas where malaria is common? Also, have you taken any medications for these symptoms?", delay: 8 },
      { role: 'user', content: "Yes, I live in a hostel near some stagnant water areas. I tried taking paracetamol but the fever keeps coming back. I'm also feeling very weak and tired", delay: 12 },
      { role: 'assistant', content: "Based on your symptoms - high fever (39.2°C), severe headache, body aches, nausea, chills, and weakness, along with your exposure to areas where mosquitoes breed, this strongly suggests malaria. This is a serious condition that requires immediate medical attention. I'm going to recommend urgent laboratory testing and medical evaluation. You'll need a malaria rapid diagnostic test (RDT) and possibly a blood smear to confirm the diagnosis.", delay: 15 },
      { role: 'user', content: "Should I be worried? How urgent is this?", delay: 18 },
      { role: 'assistant', content: "Yes, this is quite urgent. Malaria can become severe quickly if left untreated, especially if it's Plasmodium falciparum. Given your high fever and symptoms, I strongly recommend you see a doctor TODAY. While waiting for your appointment: 1) Continue taking paracetamol for fever (follow dosage instructions), 2) Drink plenty of fluids, 3) Rest, 4) Seek immediate emergency care if you develop severe headache, confusion, difficulty breathing, or vomiting. I'm scheduling you for an urgent appointment with our general practitioner.", delay: 22 }
    ],
    symptoms: ['fever', 'headache', 'body aches', 'nausea', 'chills', 'weakness'],
    diagnosis: 'Malaria',
    confidence_score: 0.92,
    completeness_score: 95,
    urgency_level: 'high'
  },
  
  typhoid: {
    messages: [
      { role: 'user', content: "I've been having fever on and off for about a week now, along with stomach pain and loss of appetite", delay: 0 },
      { role: 'assistant', content: "I'm sorry to hear you've been feeling unwell for a week. Prolonged fever with stomach pain can have several causes. Can you describe the fever pattern - does it come and go at specific times? And tell me more about the stomach pain - where exactly do you feel it and how severe is it?", delay: 3 },
      { role: 'user', content: "The fever seems to be higher in the evenings, around 38.5°C. The stomach pain is mostly in the middle of my abdomen and it's been getting worse. I also have a headache and feel very tired", delay: 7 },
      { role: 'assistant', content: "This pattern of evening fever with abdominal pain is concerning and could suggest typhoid fever. Have you experienced any diarrhea, constipation, or changes in your bowel habits? Also, have you noticed any skin changes or rashes? What about your eating - are you able to keep food down?", delay: 10 },
      { role: 'user', content: "Actually, I've been having some diarrhea since yesterday, and I noticed a few small pink spots on my chest this morning. I can barely eat anything, and when I do, I feel nauseous", delay: 15 },
      { role: 'assistant', content: "The combination of symptoms you're describing - prolonged fever with evening peaks, abdominal pain, diarrhea, loss of appetite, and especially the pink spots on your chest (rose spots) - are classic signs of typhoid fever. This is a serious bacterial infection that requires immediate antibiotic treatment. Have you consumed any food or water that might have been contaminated recently? This could include street food, untreated water, or food from questionable sources?", delay: 18 },
      { role: 'user', content: "Yes, I had some street food about 10 days ago from a vendor near campus. Could that be related?", delay: 22 },
      { role: 'assistant', content: "Absolutely. Typhoid fever is commonly contracted through contaminated food and water, and street food is a common source. The timing fits perfectly - typhoid typically develops 6-30 days after exposure. This is a serious condition that requires immediate medical attention and specific antibiotic treatment. I'm recommending urgent medical evaluation. You'll need blood tests (Widal test, blood culture) to confirm the diagnosis. While waiting: stay hydrated, avoid solid foods if nauseous (try oral rehydration solution), and monitor your temperature. Seek emergency care immediately if you develop severe abdominal pain, high fever above 39.5°C, or confusion.", delay: 25 }
    ],
    symptoms: ['fever', 'stomach pain', 'loss of appetite', 'headache', 'fatigue', 'diarrhea', 'skin rash'],
    diagnosis: 'Typhoid Fever',
    confidence_score: 0.89,
    completeness_score: 92,
    urgency_level: 'high'
  },
  
  gastritis: {
    messages: [
      { role: 'user', content: "I've been having burning stomach pain, especially when I'm hungry or at night", delay: 0 },
      { role: 'assistant', content: "I understand you're experiencing burning stomach pain that worsens when hungry. This could indicate several conditions. Can you tell me more about when this started, and does the pain improve after eating? Also, have you noticed any other symptoms like nausea, bloating, or changes in your appetite?", delay: 3 },
      { role: 'user', content: "It started about 2 weeks ago. The pain does get better after I eat, but then comes back a few hours later. I've also been feeling nauseous, especially in the mornings", delay: 8 },
      { role: 'assistant', content: "The pattern you're describing - burning pain that improves with food and returns when hungry, along with nausea - suggests gastritis or possibly a peptic ulcer. Have you been under more stress lately, changed your eating habits, or taken any medications like aspirin or ibuprofen? Also, do you experience any heartburn or acid reflux?", delay: 12 },
      { role: 'user', content: "Actually, I've been very stressed with exams and haven't been eating regularly. I've also been taking ibuprofen for headaches. And yes, I do have heartburn, especially when lying down", delay: 16 },
      { role: 'assistant', content: "That explains a lot. Stress, irregular eating, and NSAIDs like ibuprofen are common causes of gastritis. The heartburn when lying down suggests acid reflux as well. Have you noticed any dark or black stools, or vomited any blood? These would be concerning signs. Also, does spicy or acidic food make the pain worse?", delay: 19 },
      { role: 'user', content: "No blood, but spicy food definitely makes it worse. The pain can be quite sharp sometimes", delay: 23 },
      { role: 'assistant', content: "Based on your symptoms and triggers, this appears to be gastritis, likely caused by stress, irregular eating patterns, and ibuprofen use. Here are my recommendations: 1) Stop taking ibuprofen immediately and use paracetamol for headaches instead, 2) Eat smaller, more frequent meals, 3) Avoid spicy, acidic, and fatty foods, 4) Try to manage stress levels, 5) Don't eat within 3 hours of bedtime. You should see a doctor for proper evaluation and possible prescription of proton pump inhibitors or H2 blockers. If you experience severe pain, vomiting blood, or black stools, seek immediate medical attention.", delay: 26 }
    ],
    symptoms: ['burning stomach pain', 'nausea', 'heartburn', 'loss of appetite'],
    diagnosis: 'Gastritis',
    confidence_score: 0.85,
    completeness_score: 88,
    urgency_level: 'medium'
  },
  
  respiratory_infection: {
    messages: [
      { role: 'user', content: "I have a persistent cough and difficulty breathing, especially after walking around campus", delay: 0 },
      { role: 'assistant', content: "I'm concerned about your breathing difficulties. Can you tell me more about your cough - is it dry or do you bring up phlegm? When did these symptoms start, and have you had any fever? Also, do you experience wheezing or chest tightness?", delay: 3 },
      { role: 'user', content: "It started 4 days ago. The cough brings up yellowish phlegm, and I do feel tightness in my chest. I've had a low-grade fever of about 37.8°C", delay: 8 },
      { role: 'assistant', content: "Yellowish phlegm with fever and chest tightness suggests a bacterial respiratory infection. Are you experiencing any chest pain when you breathe deeply or cough? Have you been around anyone who was sick recently? Also, do you have any history of asthma or allergies?", delay: 12 },
      { role: 'user', content: "Yes, there's some chest pain when I cough hard. My roommate was sick last week with similar symptoms. I don't have asthma, but I do get seasonal allergies", delay: 16 },
      { role: 'assistant', content: "This sounds like an upper respiratory tract infection that may be progressing to affect your lower respiratory tract. The fact that your roommate had similar symptoms suggests it could be contagious. Have you tried any medications, and how is your overall energy level? Are you able to sleep at night despite the cough?", delay: 19 },
      { role: 'user', content: "I've been taking cough syrup but it's not helping much. I'm quite tired and the cough keeps waking me up at night. I'm also feeling short of breath even when resting", delay: 24 },
      { role: 'assistant', content: "The fact that you're experiencing shortness of breath at rest is concerning and suggests this infection may be more serious than initially thought. You need medical attention soon. This could be developing into pneumonia or a more severe lower respiratory tract infection. I recommend: 1) See a doctor within the next day for chest examination and possible chest X-ray, 2) Increase fluid intake, 3) Use a humidifier or breathe steam from hot water, 4) Get plenty of rest. Seek immediate emergency care if you develop severe difficulty breathing, high fever above 39°C, chest pain with breathing, or if your lips/fingertips turn blue.", delay: 27 }
    ],
    symptoms: ['cough', 'shortness of breath', 'chest tightness', 'fever', 'fatigue'],
    diagnosis: 'Upper Respiratory Tract Infection',
    confidence_score: 0.87,
    completeness_score: 90,
    urgency_level: 'medium'
  }
};

// Enhanced students data for UMaT
const students = [
  { id: 'BS424100620', name: 'Kwame Asante', program: 'Computer Science & Engineering', level: '400' },
  { id: 'FOE456888102', name: 'Esi Osei', program: 'Mining Engineering', level: '300' },
  { id: 'ENG202011045', name: 'Yaw Boateng', program: 'Electrical Engineering', level: '200' },
  { id: 'GEO789123456', name: 'Akosua Adjei', program: 'Geomatic Engineering', level: '400' },
  { id: 'MET321654987', name: 'Kofi Mensah', program: 'Metallurgical Engineering', level: '300' },
  { id: 'PET147258369', name: 'Ama Darko', program: 'Petroleum Engineering', level: '200' },
  { id: 'MIN555666777', name: 'Kwaku Oppong', program: 'Mining Engineering', level: '400' },
  { id: 'ELE888999000', name: 'Akua Frimpong', program: 'Electrical Engineering', level: '300' },
  { id: 'GEO111222333', name: 'Emmanuel Asante', program: 'Geomatic Engineering', level: '200' },
  { id: 'MET444555666', name: 'Abena Okyere', program: 'Metallurgical Engineering', level: '400' }
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomDate(daysAgo) {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
}

async function seedEnhancedConsultations() {
  try {
    const { Consultation, Appointment } = await importModels();
    
    console.log('🧹 Cleaning existing consultations...');
    await Consultation.deleteMany({ session_id: { $regex: '^demo-enhanced-' } });
    await Appointment.deleteMany({ consultation_id: { $regex: '^demo-enhanced-' } });
    
    console.log('🏥 Creating enhanced Dr. ARIA consultations...');
    
    const consultations = [];
    const appointments = [];
    
    const templateKeys = Object.keys(conversationTemplates);
    
    // Generate 30 high-quality consultations
    for (let i = 0; i < 30; i++) {
      const student = getRandomElement(students);
      const templateKey = getRandomElement(templateKeys);
      const template = conversationTemplates[templateKey];
      const daysAgo = Math.floor(Math.random() * 21); // Past 3 weeks
      const consultationDate = generateRandomDate(daysAgo);
      
      const sessionId = `demo-enhanced-${String(i + 1).padStart(3, '0')}`;
      
      // Create realistic message timestamps
      const messages = template.messages.map((msg, index) => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(consultationDate.getTime() + (msg.delay * 1000))
      }));
      
      const consultation = {
        session_id: sessionId,
        patient_id: student.id,
        messages: messages,
        
        // Symptom Analysis
        symptoms: template.symptoms,
        symptom_duration: `${Math.floor(Math.random() * 7) + 1} days`,
        symptom_severity: template.urgency_level === 'high' ? 'severe' : template.urgency_level === 'medium' ? 'moderate' : 'mild',
        symptom_onset: 'gradual',
        
        // Medical Assessment
        diagnosis_summary: template.diagnosis,
        primary_concern: messages[0].content,
        differential_diagnosis: [template.diagnosis],
        urgency_level: template.urgency_level,
        requires_immediate_care: template.urgency_level === 'high',
        confidence_score: template.confidence_score,
        medical_reasoning: `Clinical presentation consistent with ${template.diagnosis}. Patient history and symptom pattern support this diagnosis.`,
        
        // Clinical Information
        vital_signs: template.urgency_level === 'high' ? {
          temperature: '38.5°C',
          heart_rate: '95 bpm',
          blood_pressure: '130/85 mmHg'
        } : undefined,
        reported_pain_level: template.symptoms.includes('pain') ? Math.floor(Math.random() * 4) + 5 : undefined,
        
        // Assessment and Plan
        recommended_actions: [
          'Schedule medical appointment',
          'Monitor symptoms closely',
          template.urgency_level === 'high' ? 'Seek immediate medical attention' : 'Continue prescribed treatment',
          'Follow up in 3-5 days'
        ],
        suggested_tests: template.diagnosis === 'Malaria' ? ['Malaria RDT', 'Blood smear', 'FBC'] :
                         template.diagnosis === 'Typhoid Fever' ? ['Widal test', 'Blood culture', 'Stool culture'] :
                         template.diagnosis === 'Upper Respiratory Tract Infection' ? ['Chest X-ray', 'Sputum culture'] : [],
        red_flags: template.urgency_level === 'high' ? [
          'High fever above 39.5°C',
          'Severe dehydration',
          'Altered consciousness',
          'Difficulty breathing'
        ] : [],
        
        // Appointment Context
        appointment_recommended: true,
        appointment_urgency: template.urgency_level === 'high' ? 'urgent' : 'routine',
        appointment_created: true,
        pre_appointment_instructions: [
          'Bring list of current medications',
          'Fast for 8 hours if blood tests required',
          'Monitor and record temperature'
        ],
        
        // RAG and Knowledge Base
        knowledge_base_references: [`Clinical Guidelines: ${template.diagnosis}`, 'WHO Treatment Protocols'],
        clinical_guidelines_used: [`${template.diagnosis} Management Protocol`, 'Symptom Assessment Framework'],
        
        // Session Management
        status: 'completed',
        duration_minutes: Math.floor(Math.random() * 15) + 10,
        follow_up_required: template.urgency_level !== 'low',
        consultation_completeness: template.completeness_score,
        
        createdAt: consultationDate,
        updatedAt: consultationDate
      };
      
      consultations.push(consultation);
      
      // Create corresponding appointment
      const doctors = [
        { id: 'UMAT-DOC-001', name: 'Dr. Akosua Mensah', specialization: 'general-practitioner' },
        { id: 'UMAT-DOC-002', name: 'Dr. Kwaku Adjei', specialization: 'internal-medicine' },
        { id: 'UMAT-DOC-003', name: 'Dr. Abena Frimpong', specialization: 'psychiatrist' }
      ];
      
      const doctor = getRandomElement(doctors);
      const appointmentDate = new Date(consultationDate.getTime() + (Math.floor(Math.random() * 5) + 1) * 24 * 60 * 60 * 1000);
      const appointmentTime = ['08:00 AM', '09:00 AM', '10:00 AM', '02:00 PM', '03:00 PM'][Math.floor(Math.random() * 5)];
      
      const appointment = {
        patient_id: student.id,
        doctor_name: doctor.name,
        doctor_id: doctor.id,
        date: appointmentDate,
        time: appointmentTime,
        type: template.urgency_level === 'high' ? 'Urgent Consultation' : 'General Consultation',
        status: appointmentDate < new Date() ? 'completed' : 'scheduled',
        notes: `Dr. ARIA consultation indicated ${template.diagnosis}`,
        consultation_id: sessionId,
        symptoms: template.symptoms,
        urgency_level: template.urgency_level,
        created_from_consultation: true,
        createdAt: consultationDate,
        updatedAt: consultationDate
      };
      
      appointments.push(appointment);
    }
    
    console.log(`📝 Inserting ${consultations.length} enhanced consultations...`);
    await Consultation.insertMany(consultations);
    
    console.log(`📅 Inserting ${appointments.length} corresponding appointments...`);
    await Appointment.insertMany(appointments);
    
    console.log('✅ Enhanced consultations seeded successfully!');
    console.log(`Created ${consultations.length} comprehensive Dr. ARIA consultations with:`);
    console.log('   • Detailed conversation histories');
    console.log('   • Proper confidence and completeness scoring');
    console.log('   • Clinical reasoning and assessments');
    console.log('   • RAG knowledge base references');
    console.log('   • Comprehensive medical recommendations');
    
  } catch (error) {
    console.error('❌ Error seeding enhanced consultations:', error);
    throw error;
  }
}

async function runSeeding() {
  try {
    await connectToDatabase();
    await seedEnhancedConsultations();
    console.log('🎉 Enhanced consultation seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { seedEnhancedConsultations };

// Run if executed directly
if (require.main === module) {
  runSeeding();
}