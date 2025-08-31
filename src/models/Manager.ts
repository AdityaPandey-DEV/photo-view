import mongoose from 'mongoose';

export interface IManager extends mongoose.Document {
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  maxVipCapacity: number;
  currentVipCount: number;
  assignedVips: mongoose.Types.ObjectId[];
  role: 'manager' | 'senior_manager' | 'admin';
  permissions: string[];
  assignedWithdrawals: mongoose.Types.ObjectId[];
  totalWithdrawalsProcessed: number;
  totalAmountProcessed: number;
  lastLoginAt?: Date;
  lastOtpSentAt?: Date;
  otpAttempts: number;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const managerSchema = new mongoose.Schema<IManager>({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  phone: { 
    type: String, 
    required: true, 
    unique: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  maxVipCapacity: { 
    type: Number, 
    default: 50 
  },
  currentVipCount: { 
    type: Number, 
    default: 0 
  },
  assignedVips: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  assignedWithdrawals: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'WithdrawalRequest' 
  }],
  role: { 
    type: String, 
    enum: ['manager', 'senior_manager', 'admin'], 
    default: 'manager' 
  },
  permissions: [{ 
    type: String 
  }],
  totalWithdrawalsProcessed: { 
    type: Number, 
    default: 0 
  },
  totalAmountProcessed: { 
    type: Number, 
    default: 0 
  },
  lastLoginAt: { 
    type: Date 
  },
  lastOtpSentAt: { 
    type: Date 
  },
  otpAttempts: { 
    type: Number, 
    default: 0 
  },
  isEmailVerified: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true 
});

// Auto-update currentVipCount when assignedVips changes
managerSchema.pre('save', function(next) {
  this.currentVipCount = this.assignedVips.length;
  next();
});

// Indexes for better query performance
managerSchema.index({ isActive: 1, currentVipCount: 1 });
managerSchema.index({ role: 1, isActive: 1 });

export default mongoose.models.Manager || mongoose.model<IManager>('Manager', managerSchema);
