import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  id: string;
  name: string;
  role: 'student' | 'doctor';
  student_id?: string;
  doctor_id?: string;
  password: string;
  email?: string;
  institution?: string;
  phone?: string;
  dateOfBirth?: Date;
  bloodType?: string;
  allergies?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  chronicConditions?: string[];
  currentMedications?: string[];
  insuranceInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  role: { type: String, enum: ['student', 'doctor'], required: true },
  student_id: { type: String, sparse: true, unique: true },
  doctor_id: { type: String, sparse: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, sparse: true },
  institution: { type: String, default: 'UMaT' },
  phone: { type: String },
  dateOfBirth: { type: Date },
  bloodType: { type: String },
  allergies: [{ type: String }],
  emergencyContact: {
    name: { type: String },
    relationship: { type: String },
    phone: { type: String }
  },
  chronicConditions: [{ type: String }],
  currentMedications: [{ type: String }],
  insuranceInfo: { type: String }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes
UserSchema.index({ student_id: 1 }, { sparse: true });
UserSchema.index({ doctor_id: 1 }, { sparse: true });
UserSchema.index({ role: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);