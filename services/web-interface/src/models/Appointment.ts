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
  consultation_id?: string; // Link to Dr. ARIA consultation
  symptoms?: string[];
  urgency_level?: 'low' | 'medium' | 'high' | 'emergency';
  created_from_consultation: boolean;
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
  consultation_id: { type: String, index: true },
  symptoms: [{ type: String }],
  urgency_level: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'emergency'],
    default: 'medium'
  },
  created_from_consultation: { type: Boolean, default: false }
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
  foreignField: 'id',
  justOne: true
});

// Virtual for populating doctor details
AppointmentSchema.virtual('doctor', {
  ref: 'User',
  localField: 'doctor_id',
  foreignField: 'id',
  justOne: true
});

export default mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);