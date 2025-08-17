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
  symptoms: string[];
  diagnosis_summary?: string;
  urgency_level: 'low' | 'medium' | 'high' | 'emergency';
  requires_immediate_care: boolean;
  confidence_score: number;
  medical_reasoning?: string;
  recommended_actions: string[];
  appointment_recommended: boolean;
  appointment_created?: boolean;
  appointment_id?: string;
  status: 'active' | 'completed' | 'abandoned';
  duration_minutes?: number;
  follow_up_required: boolean;
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
  symptoms: [{ type: String }],
  diagnosis_summary: { type: String },
  urgency_level: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'emergency'],
    default: 'medium',
    index: true
  },
  requires_immediate_care: { type: Boolean, default: false },
  confidence_score: { type: Number, min: 0, max: 1, default: 0.5 },
  medical_reasoning: { type: String },
  recommended_actions: [{ type: String }],
  appointment_recommended: { type: Boolean, default: false },
  appointment_created: { type: Boolean, default: false },
  appointment_id: { type: String, index: true },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'abandoned'],
    default: 'active',
    index: true
  },
  duration_minutes: { type: Number },
  follow_up_required: { type: Boolean, default: false }
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
  foreignField: 'id',
  justOne: true
});

// Virtual for populating appointment details
ConsultationSchema.virtual('appointment', {
  ref: 'Appointment',
  localField: 'appointment_id',
  foreignField: 'id',
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