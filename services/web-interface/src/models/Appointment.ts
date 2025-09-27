import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  id: string;
  patient_id: string;
  doctor_id?: string;
  doctor_name: string;
  date: Date;
  time: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  medical_notes?: string; // Doctor's medical notes
  prescription?: string; // Prescribed medications
  next_steps?: string; // Follow-up instructions
  consultation_id?: string; // Link to Dr. ARIA consultation
  symptoms?: string[];
  urgency_level?: 'low' | 'medium' | 'high' | 'emergency';
  created_from_consultation: boolean;
  reschedule_history?: {
    original_date: Date;
    original_time: string;
    reschedule_date: Date;
    reschedule_reason: string;
    rescheduled_by: 'student' | 'doctor';
    rescheduled_by_id: string;
  }[];
  update_history?: {
    updated_by: string;
    updated_by_name: string;
    updated_at: Date;
    changes: any;
    notes: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema({
  patient_id: { type: String, required: true, index: true },
  doctor_id: { type: String, index: true },
  doctor_name: { type: String, required: true },
  date: { type: Date, required: true, index: true },
  time: { type: String, required: true },
  type: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled',
    index: true
  },
  notes: { type: String },
  medical_notes: { type: String }, // Doctor's medical notes
  prescription: { type: String }, // Prescribed medications
  next_steps: { type: String }, // Follow-up instructions
  consultation_id: { type: String, index: true },
  symptoms: [{ type: String }],
  urgency_level: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'emergency'],
    default: 'medium'
  },
  created_from_consultation: { type: Boolean, default: false },
  reschedule_history: [{
    original_date: { type: Date, required: true },
    original_time: { type: String, required: true },
    reschedule_date: { type: Date, required: true },
    reschedule_reason: { type: String, required: true },
    rescheduled_by: { type: String, enum: ['student', 'doctor'], required: true },
    rescheduled_by_id: { type: String, required: true }
  }],
  update_history: [{
    updated_by: { type: String, required: true },
    updated_by_name: { type: String, required: true },
    updated_at: { type: Date, required: true },
    changes: { type: Object, required: true },
    notes: { type: String, required: true }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create compound indexes for efficient queries
AppointmentSchema.index({ patient_id: 1, date: 1 });
AppointmentSchema.index({ doctor_id: 1, date: 1, status: 1 });
AppointmentSchema.index({ status: 1, date: 1 });

// Virtual for populating patient details
AppointmentSchema.virtual('patient', {
  ref: 'User',
  localField: 'patient_id',
  foreignField: 'student_id', // patient_id should match student_id in User model
  justOne: true
});

// Virtual for populating doctor details
AppointmentSchema.virtual('doctor', {
  ref: 'User',
  localField: 'doctor_id',
  foreignField: 'doctor_id', // doctor_id should match doctor_id in User model
  justOne: true
});

export default mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);