import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicalRecord extends Document {
  // Identifiers
  id: string;
  patient_id: string; // Links to User.student_id
  appointment_id: string; // Links to the appointment this record was created from
  consultation_id?: string; // Links to original Dr. ARIA consultation if applicable
  
  // Doctor Information
  doctor_id: string;
  doctor_name: string;
  
  // Record Information
  record_date: Date; // Date the medical record was created
  visit_date: Date; // Date of the actual visit/appointment
  record_type: 'consultation' | 'follow_up' | 'emergency' | 'surgery' | 'lab_results' | 'imaging' | 'referral';
  
  // Chief Complaint and Assessment
  chief_complaint: string; // Primary reason for visit
  history_of_present_illness: string; // Detailed description of current condition
  
  // Clinical Assessment
  final_diagnosis: string; // Doctor's final diagnosis
  differential_diagnosis?: string[]; // Other possible diagnoses considered
  assessment_notes: string; // Doctor's assessment and clinical reasoning
  
  // Physical Examination
  vital_signs: {
    blood_pressure?: string; // e.g., "120/80"
    heart_rate?: number; // beats per minute
    respiratory_rate?: number; // breaths per minute  
    temperature?: number; // in Celsius
    weight?: number; // in kg
    height?: number; // in cm
    bmi?: number; // calculated BMI
    oxygen_saturation?: number; // percentage
  };
  physical_examination_findings: string; // General physical exam findings
  
  // Medications and Treatment
  medications_prescribed: {
    medication_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    quantity_prescribed?: number;
  }[];
  
  // Treatment Plan
  treatment_plan: string; // Comprehensive treatment approach
  procedures_performed?: string[]; // Any procedures done during visit
  
  // Follow-up and Instructions
  follow_up_instructions: string;
  follow_up_required: boolean;
  follow_up_date?: Date;
  follow_up_with?: string; // Specialist or same doctor
  
  // Tests and Investigations
  tests_ordered?: {
    test_name: string;
    test_type: 'lab' | 'imaging' | 'specialist_referral' | 'other';
    urgency: 'routine' | 'urgent' | 'stat';
    instructions?: string;
    ordered_date: Date;
  }[];
  
  test_results?: {
    test_name: string;
    result: string;
    result_date: Date;
    normal_range?: string;
    interpretation: string;
    follow_up_required: boolean;
  }[];
  
  // Medical History Context
  relevant_medical_history?: string[];
  current_medications_reviewed?: string[];
  allergies_confirmed?: string[];
  
  // Risk Assessment
  risk_factors?: string[];
  warning_signs_discussed?: string[];
  
  // Patient Education
  patient_education_provided: string; // What was explained to patient
  patient_understanding: 'good' | 'fair' | 'poor' | 'language_barrier';
  
  // Administrative
  severity_level: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'completed' | 'amended' | 'signed';
  
  // Integration with existing workflow
  dr_aria_consultation_summary?: string; // Summary of pre-visit AI consultation
  symptoms_reported_to_aria?: string[]; // Symptoms initially reported to Dr. ARIA
  
  // Audit Trail
  created_by: string; // Doctor ID
  created_by_name: string;
  last_modified_by?: string;
  last_modified_by_name?: string;
  signed_by?: string; // Doctor who signed off on the record
  signed_by_name?: string;
  signed_date?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const MedicalRecordSchema: Schema = new Schema({
  // Identifiers
  patient_id: { type: String, required: true, index: true },
  appointment_id: { type: String, required: true, unique: true, index: true }, // One record per appointment
  consultation_id: { type: String, index: true },
  
  // Doctor Information
  doctor_id: { type: String, required: true, index: true },
  doctor_name: { type: String, required: true },
  
  // Record Information
  record_date: { type: Date, required: true, default: Date.now },
  visit_date: { type: Date, required: true },
  record_type: { 
    type: String, 
    enum: ['consultation', 'follow_up', 'emergency', 'surgery', 'lab_results', 'imaging', 'referral'],
    required: true 
  },
  
  // Chief Complaint and Assessment
  chief_complaint: { type: String, required: true },
  history_of_present_illness: { type: String, required: true },
  
  // Clinical Assessment
  final_diagnosis: { type: String, required: true },
  differential_diagnosis: [{ type: String }],
  assessment_notes: { type: String, required: true },
  
  // Physical Examination
  vital_signs: {
    blood_pressure: { type: String },
    heart_rate: { type: Number },
    respiratory_rate: { type: Number },
    temperature: { type: Number },
    weight: { type: Number },
    height: { type: Number },
    bmi: { type: Number },
    oxygen_saturation: { type: Number }
  },
  physical_examination_findings: { type: String, required: true },
  
  // Medications and Treatment
  medications_prescribed: [{
    medication_name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String, required: true },
    quantity_prescribed: { type: Number }
  }],
  
  // Treatment Plan
  treatment_plan: { type: String, required: true },
  procedures_performed: [{ type: String }],
  
  // Follow-up and Instructions
  follow_up_instructions: { type: String, required: true },
  follow_up_required: { type: Boolean, required: true, default: false },
  follow_up_date: { type: Date },
  follow_up_with: { type: String },
  
  // Tests and Investigations
  tests_ordered: [{
    test_name: { type: String, required: true },
    test_type: { type: String, enum: ['lab', 'imaging', 'specialist_referral', 'other'], required: true },
    urgency: { type: String, enum: ['routine', 'urgent', 'stat'], required: true },
    instructions: { type: String },
    ordered_date: { type: Date, required: true, default: Date.now }
  }],
  
  test_results: [{
    test_name: { type: String, required: true },
    result: { type: String, required: true },
    result_date: { type: Date, required: true },
    normal_range: { type: String },
    interpretation: { type: String, required: true },
    follow_up_required: { type: Boolean, required: true }
  }],
  
  // Medical History Context
  relevant_medical_history: [{ type: String }],
  current_medications_reviewed: [{ type: String }],
  allergies_confirmed: [{ type: String }],
  
  // Risk Assessment
  risk_factors: [{ type: String }],
  warning_signs_discussed: [{ type: String }],
  
  // Patient Education
  patient_education_provided: { type: String, required: true },
  patient_understanding: { 
    type: String, 
    enum: ['good', 'fair', 'poor', 'language_barrier'],
    required: true 
  },
  
  // Administrative
  severity_level: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    index: true
  },
  status: { 
    type: String, 
    enum: ['draft', 'completed', 'amended', 'signed'],
    default: 'draft',
    index: true
  },
  
  // Integration with existing workflow
  dr_aria_consultation_summary: { type: String },
  symptoms_reported_to_aria: [{ type: String }],
  
  // Audit Trail
  created_by: { type: String, required: true },
  created_by_name: { type: String, required: true },
  last_modified_by: { type: String },
  last_modified_by_name: { type: String },
  signed_by: { type: String },
  signed_by_name: { type: String },
  signed_date: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create compound indexes for efficient queries
MedicalRecordSchema.index({ patient_id: 1, record_date: -1 }); // Patient records by date
MedicalRecordSchema.index({ doctor_id: 1, record_date: -1 }); // Doctor's records by date
MedicalRecordSchema.index({ patient_id: 1, record_type: 1 }); // Patient records by type
MedicalRecordSchema.index({ status: 1, created_by: 1 }); // Doctor's drafts/completed records
MedicalRecordSchema.index({ follow_up_required: 1, follow_up_date: 1 }); // Follow-up management
MedicalRecordSchema.index({ severity_level: 1, record_date: -1 }); // Critical cases tracking

// Virtual for populating patient details
MedicalRecordSchema.virtual('patient', {
  ref: 'User',
  localField: 'patient_id',
  foreignField: 'student_id',
  justOne: true
});

// Virtual for populating doctor details
MedicalRecordSchema.virtual('doctor', {
  ref: 'User',
  localField: 'doctor_id',
  foreignField: 'doctor_id',
  justOne: true
});

// Virtual for populating appointment details
MedicalRecordSchema.virtual('appointment', {
  ref: 'Appointment',
  localField: 'appointment_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for populating consultation details
MedicalRecordSchema.virtual('consultation', {
  ref: 'Consultation',
  localField: 'consultation_id',
  foreignField: 'session_id',
  justOne: true
});

// Pre-save middleware to calculate BMI if height and weight are provided
MedicalRecordSchema.pre('save', function(next) {
  if (this.vital_signs?.height && this.vital_signs?.weight) {
    const heightInMeters = this.vital_signs.height / 100;
    this.vital_signs.bmi = Number((this.vital_signs.weight / (heightInMeters * heightInMeters)).toFixed(1));
  }
  next();
});

export default mongoose.models.MedicalRecord || mongoose.model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema);