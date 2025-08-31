import mongoose from 'mongoose';

export interface IWithdrawal extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userPhone: string;
  amount: number;
  paymentMethod: 'UPI' | 'BANK';
  paymentDetails: {
    upiId?: string;
    bankAccount?: string;
    ifscCode?: string;
    accountHolderName?: string;
    bankName?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  managerNotes?: string;
  submittedAt: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalSchema = new mongoose.Schema<IWithdrawal>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userPhone: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [350, 'Minimum withdrawal amount is ₹350']
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'BANK'],
    required: true
  },
  paymentDetails: {
    upiId: String,
    bankAccount: String,
    ifscCode: String,
    accountHolderName: String,
    bankName: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  managerNotes: String,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date
}, {
  timestamps: true
});

// Indexes for better performance
withdrawalSchema.index({ userId: 1, status: 1 });
withdrawalSchema.index({ status: 1, submittedAt: -1 });

export default mongoose.models.Withdrawal || mongoose.model<IWithdrawal>('Withdrawal', withdrawalSchema);
