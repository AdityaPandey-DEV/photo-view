import mongoose from 'mongoose';

export interface INotification extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: 'manager_change' | 'withdrawal_processed' | 'vip_status_change' | 'system_alert';
  title: string;
  message: string;
  isRead: boolean;
  relatedData?: {
    managerId?: string;
    managerName?: string;
    withdrawalAmount?: number;
    vipLevel?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new mongoose.Schema<INotification>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['manager_change', 'withdrawal_processed', 'vip_status_change', 'system_alert'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedData: {
    managerId: String,
    managerName: String,
    withdrawalAmount: Number,
    vipLevel: String
  }
}, {
  timestamps: true
});

// Index for faster queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);
