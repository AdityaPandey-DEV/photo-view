import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['task_completion', 'withdrawal', 'vip_subscription', 'monthly_return'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'completed'
  },
  reference: {
    type: String, // taskId, withdrawalId, etc.
    required: false
  }
}, {
  timestamps: true
});

export default mongoose.models.WalletTransaction || mongoose.model('WalletTransaction', walletTransactionSchema);
