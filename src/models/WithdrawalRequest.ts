import mongoose from 'mongoose';

export interface IWithdrawalRequest extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  gst: number;
  netAmount: number;
  status: 'pending' | 'under_review' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled';
  assignedManager?: mongoose.Types.ObjectId;
  paymentMethod: 'UPI' | 'BANK_TRANSFER';
  paymentDetails: {
    upiId?: string;
    bankAccount?: string;
    ifscCode?: string;
    accountHolderName?: string;
    bankName?: string;
  };
  submittedAt: Date;
  reviewedAt?: Date;
  processedAt?: Date;
  managerNotes?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalRequestSchema = new mongoose.Schema<IWithdrawalRequest>({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true, 
    min: [350, 'Minimum withdrawal amount is ₹350'] 
  },
  gst: { 
    type: Number, 
    required: true 
  },
  netAmount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'under_review', 'approved', 'processing', 'completed', 'rejected', 'cancelled'], 
    default: 'pending' 
  },
  assignedManager: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Manager' 
  },
  paymentMethod: { 
    type: String, 
    enum: ['UPI', 'BANK_TRANSFER'], 
    required: true 
  },
  paymentDetails: { 
    upiId: String, 
    bankAccount: String, 
    ifscCode: String, 
    accountHolderName: String, 
    bankName: String 
  },
  submittedAt: { 
    type: Date, 
    default: Date.now 
  },
  reviewedAt: Date,
  processedAt: Date,
  managerNotes: String,
  rejectionReason: String
}, { 
  timestamps: true 
});

// Indexes for better query performance
withdrawalRequestSchema.index({ userId: 1, status: 1 });
withdrawalRequestSchema.index({ assignedManager: 1, status: 1 });
withdrawalRequestSchema.index({ status: 1, submittedAt: 1 });

export default mongoose.models.WithdrawalRequest || mongoose.model<IWithdrawalRequest>('WithdrawalRequest', withdrawalRequestSchema);
