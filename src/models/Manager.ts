import mongoose from 'mongoose';

export interface IManager extends mongoose.Document {
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  maxVipCapacity: number;
  currentVipCount: number;
  assignedVips: string[]; // Array of VIP user IDs
  createdAt: Date;
  updatedAt: Date;
}

const managerSchema = new mongoose.Schema<IManager>({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxVipCapacity: {
    type: Number,
    default: 50, // Default capacity per manager
    min: [1, 'Capacity must be at least 1']
  },
  currentVipCount: {
    type: Number,
    default: 0,
    min: [0, 'VIP count cannot be negative']
  },
  assignedVips: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Update currentVipCount when assignedVips changes
managerSchema.pre('save', function(next) {
  this.currentVipCount = this.assignedVips.length;
  next();
});

export default mongoose.models.Manager || mongoose.model<IManager>('Manager', managerSchema);
