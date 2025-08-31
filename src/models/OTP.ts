import mongoose from 'mongoose';

export interface IOTP extends mongoose.Document {
  email: string;
  otp: string;
  attempts: number;
  expiresAt: Date;
  managerId?: string;
  createdAt: Date;
}

const otpSchema = new mongoose.Schema<IOTP>({
  email: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index to auto-delete expired OTPs
  },
  managerId: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Create TTL index for automatic cleanup
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.OTP || mongoose.model<IOTP>('OTP', otpSchema);
