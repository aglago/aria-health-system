import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IConsultation extends Document {
  id: string;
  session_id: string;
  patient_id: string;
  messages: IMessage[];
  
  // Symptom Analysis
  symptoms: string[];
  symptom_duration?: string;
  symptom_severity?: 'mild' | 'moderate' | 'severe';
  symptom_onset?: string;
  
  // Medical Assessment
  diagnosis_summary?: string;
  primary_concern?: string;
  differential_diagnosis?: string[];
  urgency_level: 'low' | 'medium' | 'high' | 'emergency';
  requires_immediate_care: boolean;
  confidence_score: number;
  medical_reasoning?: string;
  
  // Clinical Information
  vital_signs?: {
    temperature?: string;
    blood_pressure?: string;
    heart_rate?: string;
    respiratory_rate?: string;
  };
  reported_pain_level?: number; // 1-10 scale
  
  // Medical History Context
  relevant_medical_history?: string[];
  current_medications_mentioned?: string[];
  allergies_mentioned?: string[];
  family_history_relevant?: string[];
  
  // Assessment and Plan
  recommended_actions: string[];
  suggested_tests?: string[];
  red_flags?: string[];
  when_to_seek_immediate_care?: string[];
  
  // Appointment Context
  appointment_recommended: boolean;
  appointment_urgency?: 'routine' | 'urgent' | 'emergent';
  appointment_created?: boolean;
  appointment_id?: string;
  pre_appointment_instructions?: string[];
  
  // RAG and Knowledge Base
  knowledge_base_references?: string[];
  clinical_guidelines_used?: string[];
  rag_context?: any;
  
  // Session Management
  status: 'active' | 'completed' | 'abandoned';
  duration_minutes?: number;
  follow_up_required: boolean;
  consultation_completeness?: number; // 0-100%
  
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ConsultationSchema: Schema = new Schema({
  session_id: { type: String, required: true, unique: true, index: true },
  patient_id: { type: String, required: true, index: true },
  messages: [MessageSchema],
  
  // Symptom Analysis
  symptoms: [{ type: String }],
  symptom_duration: { type: String },
  symptom_severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
  symptom_onset: { type: String },
  
  // Medical Assessment
  diagnosis_summary: { type: String },
  primary_concern: { type: String },
  differential_diagnosis: [{ type: String }],
  urgency_level: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'emergency'],
    default: 'medium',
    index: true
  },
  requires_immediate_care: { type: Boolean, default: false },
  confidence_score: { type: Number, min: 0, max: 1, default: 0.5 },
  medical_reasoning: { type: String },
  
  // Clinical Information
  vital_signs: {
    temperature: { type: String },
    blood_pressure: { type: String },
    heart_rate: { type: String },
    respiratory_rate: { type: String }
  },
  reported_pain_level: { type: Number, min: 0, max: 10 },
  
  // Medical History Context
  relevant_medical_history: [{ type: String }],
  current_medications_mentioned: [{ type: String }],
  allergies_mentioned: [{ type: String }],
  family_history_relevant: [{ type: String }],
  
  // Assessment and Plan
  recommended_actions: [{ type: String }],
  suggested_tests: [{ type: String }],
  red_flags: [{ type: String }],
  when_to_seek_immediate_care: [{ type: String }],
  
  // Appointment Context
  appointment_recommended: { type: Boolean, default: false },
  appointment_urgency: { type: String, enum: ['routine', 'urgent', 'emergent'] },
  appointment_created: { type: Boolean, default: false },
  appointment_id: { type: String, index: true },
  pre_appointment_instructions: [{ type: String }],
  
  // RAG and Knowledge Base
  knowledge_base_references: [{ type: String }],
  clinical_guidelines_used: [{ type: String }],
  rag_context: { type: Schema.Types.Mixed },
  
  // Session Management
  status: { 
    type: String, 
    enum: ['active', 'completed', 'abandoned'],
    default: 'active',
    index: true
  },
  duration_minutes: { type: Number },
  follow_up_required: { type: Boolean, default: false },
  consultation_completeness: { type: Number, min: 0, max: 100, default: 0 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create compound indexes for efficient queries
ConsultationSchema.index({ patient_id: 1, createdAt: -1 });
ConsultationSchema.index({ status: 1, urgency_level: 1 });
ConsultationSchema.index({ appointment_recommended: 1, appointment_created: 1 });

// Virtual for populating patient details
ConsultationSchema.virtual('patient', {
  ref: 'User',
  localField: 'patient_id',
  foreignField: 'student_id', // patient_id should match student_id in User model
  justOne: true
});

// Virtual for populating appointment details
ConsultationSchema.virtual('appointment', {
  ref: 'Appointment',
  localField: 'appointment_id',
  foreignField: '_id', // appointment_id should match MongoDB _id in Appointment model
  justOne: true
});

// Method to add message
ConsultationSchema.methods.addMessage = function(role: 'user' | 'assistant', content: string) {
  this.messages.push({
    role,
    content,
    timestamp: new Date()
  });
  return this.save();
};

// Method to complete consultation
ConsultationSchema.methods.complete = function() {
  this.status = 'completed';
  if (this.messages.length > 0) {
    const firstMessage = this.messages[0];
    const lastMessage = this.messages[this.messages.length - 1];
    this.duration_minutes = Math.round(
      (lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime()) / (1000 * 60)
    );
  }
  return this.save();
};

export default mongoose.models.Consultation || mongoose.model<IConsultation>('Consultation', ConsultationSchema);