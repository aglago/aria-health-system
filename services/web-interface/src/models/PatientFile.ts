import mongoose, { Schema, Document } from 'mongoose';

export interface IPatientFile extends Document {
  // Patient Identification
  id: string;
  patient_id: string; // Links to User.student_id
  patient_name: string;
  date_created: Date;
  last_updated: Date;
  
  // Patient Overview
  active_status: 'active' | 'inactive' | 'transferred' | 'graduated';
  primary_care_doctor?: string; // Most frequent doctor
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  
  // Demographic Information
  demographics: {
    date_of_birth: Date;
    age: number;
    gender?: 'male' | 'female' | 'other';
    blood_type?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    height?: number; // in cm
    weight?: number; // in kg
    bmi?: number;
    marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
    nationality?: string;
    occupation?: string; // Program of study
  };
  
  // Medical History Summary
  medical_history_summary: {
    chronic_conditions: string[];
    major_surgeries: string[];
    hospitalizations: string[];
    family_medical_history: string[];
    genetic_conditions: string[];
    mental_health_history: string[];
  };
  
  // Current Medical Status
  current_medications: {
    medication_name: string;
    dosage: string;
    frequency: string;
    prescribing_doctor: string;
    start_date: Date;
    end_date?: Date;
    reason: string;
    active: boolean;
  }[];
  
  allergies_and_reactions: {
    allergen: string;
    reaction_type: 'mild' | 'moderate' | 'severe' | 'life-threatening';
    symptoms: string[];
    first_occurrence: Date;
    confirmed_by_doctor: boolean;
  }[];
  
  // Healthcare Utilization Summary
  healthcare_summary: {
    total_consultations: number;
    total_appointments: number;
    total_medical_records: number;
    first_visit_date: Date;
    last_visit_date: Date;
    most_common_symptoms: string[];
    most_frequent_diagnoses: string[];
    missed_appointments: number;
    follow_up_compliance: 'excellent' | 'good' | 'fair' | 'poor';
  };
  
  // Risk Assessment
  risk_assessment: {
    overall_risk_level: 'low' | 'medium' | 'high' | 'critical';
    cardiovascular_risk: 'low' | 'medium' | 'high';
    diabetes_risk: 'low' | 'medium' | 'high';
    mental_health_risk: 'low' | 'medium' | 'high';
    substance_abuse_risk: 'low' | 'medium' | 'high';
    academic_stress_indicators: string[];
    lifestyle_risk_factors: string[];
  };
  
  // Care Plan
  current_care_plan: {
    active_treatments: string[];
    ongoing_monitoring: string[];
    preventive_measures: string[];
    lifestyle_recommendations: string[];
    next_scheduled_review: Date;
    care_team: string[]; // Doctor IDs involved in care
  };
  
  // Administrative Information
  insurance_information?: {
    provider: string;
    policy_number: string;
    coverage_type: string;
    valid_until: Date;
  };
  
  // Data Sources and References
  linked_consultations: string[]; // Consultation session_ids
  linked_appointments: string[]; // Appointment IDs
  linked_medical_records: string[]; // Medical Record IDs
  linked_lab_results: string[]; // Lab Result IDs (if implemented)
  linked_imaging_studies: string[]; // Imaging Study IDs (if implemented)
  
  // Privacy and Access
  access_permissions: {
    authorized_doctors: string[];
    emergency_access_override: boolean;
    research_consent: boolean;
    data_sharing_consent: boolean;
  };
  
  // File Metadata
  version: number;
  created_by: string; // Doctor ID who created the file
  last_modified_by: string; // Doctor ID who last modified
  file_size_kb: number;
  backup_status: 'current' | 'archived' | 'purged';
  
  createdAt: Date;
  updatedAt: Date;
}

const PatientFileSchema: Schema = new Schema({
  patient_id: { type: String, required: true, unique: true, index: true },
  patient_name: { type: String, required: true, index: true },
  date_created: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now },
  
  active_status: { 
    type: String, 
    enum: ['active', 'inactive', 'transferred', 'graduated'],
    default: 'active',
    index: true
  },
  primary_care_doctor: { type: String, index: true },
  emergency_contact: {
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String }
  },
  
  demographics: {
    date_of_birth: { type: Date, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    blood_type: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    height: { type: Number }, // cm
    weight: { type: Number }, // kg
    bmi: { type: Number },
    marital_status: { type: String, enum: ['single', 'married', 'divorced', 'widowed'] },
    nationality: { type: String },
    occupation: { type: String } // Program of study
  },
  
  medical_history_summary: {
    chronic_conditions: [{ type: String }],
    major_surgeries: [{ type: String }],
    hospitalizations: [{ type: String }],
    family_medical_history: [{ type: String }],
    genetic_conditions: [{ type: String }],
    mental_health_history: [{ type: String }]
  },
  
  current_medications: [{
    medication_name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    prescribing_doctor: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date },
    reason: { type: String, required: true },
    active: { type: Boolean, default: true }
  }],
  
  allergies_and_reactions: [{
    allergen: { type: String, required: true },
    reaction_type: { type: String, enum: ['mild', 'moderate', 'severe', 'life-threatening'], required: true },
    symptoms: [{ type: String }],
    first_occurrence: { type: Date, required: true },
    confirmed_by_doctor: { type: Boolean, default: false }
  }],
  
  healthcare_summary: {
    total_consultations: { type: Number, default: 0 },
    total_appointments: { type: Number, default: 0 },
    total_medical_records: { type: Number, default: 0 },
    first_visit_date: { type: Date },
    last_visit_date: { type: Date },
    most_common_symptoms: [{ type: String }],
    most_frequent_diagnoses: [{ type: String }],
    missed_appointments: { type: Number, default: 0 },
    follow_up_compliance: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'good' }
  },
  
  risk_assessment: {
    overall_risk_level: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
    cardiovascular_risk: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    diabetes_risk: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    mental_health_risk: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    substance_abuse_risk: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    academic_stress_indicators: [{ type: String }],
    lifestyle_risk_factors: [{ type: String }]
  },
  
  current_care_plan: {
    active_treatments: [{ type: String }],
    ongoing_monitoring: [{ type: String }],
    preventive_measures: [{ type: String }],
    lifestyle_recommendations: [{ type: String }],
    next_scheduled_review: { type: Date },
    care_team: [{ type: String }] // Doctor IDs
  },
  
  insurance_information: {
    provider: { type: String },
    policy_number: { type: String },
    coverage_type: { type: String },
    valid_until: { type: Date }
  },
  
  linked_consultations: [{ type: String }],
  linked_appointments: [{ type: String }],
  linked_medical_records: [{ type: String }],
  linked_lab_results: [{ type: String }],
  linked_imaging_studies: [{ type: String }],
  
  access_permissions: {
    authorized_doctors: [{ type: String }],
    emergency_access_override: { type: Boolean, default: true },
    research_consent: { type: Boolean, default: false },
    data_sharing_consent: { type: Boolean, default: false }
  },
  
  version: { type: Number, default: 1 },
  created_by: { type: String, required: true },
  last_modified_by: { type: String, required: true },
  file_size_kb: { type: Number, default: 0 },
  backup_status: { type: String, enum: ['current', 'archived', 'purged'], default: 'current' }
}, {
  timestamps: true
});

// Indexes for efficient queries
PatientFileSchema.index({ patient_id: 1 });
PatientFileSchema.index({ patient_name: 'text' });
PatientFileSchema.index({ active_status: 1 });
PatientFileSchema.index({ primary_care_doctor: 1 });
PatientFileSchema.index({ 'demographics.age': 1 });
PatientFileSchema.index({ 'risk_assessment.overall_risk_level': 1 });
PatientFileSchema.index({ last_updated: -1 });

export default mongoose.models.PatientFile || mongoose.model<IPatientFile>('PatientFile', PatientFileSchema);