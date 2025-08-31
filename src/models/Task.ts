import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  reward: {
    type: Number,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['completed', 'pending'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate task completions
taskSchema.index({ userId: 1, taskId: 1 }, { unique: true });

export default mongoose.models.Task || mongoose.model('Task', taskSchema);
