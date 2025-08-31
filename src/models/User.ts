import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends mongoose.Document {
  name: string;
  phone: string;
  password: string;
  role: 'user' | 'admin';
  vipLevel?: 'VIP1' | 'VIP2' | 'VIP3';
  subscriptionDate?: Date;
  // totalEarnings REMOVED - calculated real-time from transactions
  monthlyReturns?: number;
  profileImage?: string;
  assignedManager?: string; // Manager ID assigned to this VIP
  // Enhanced VIP tracking
  vipStatus: 'active' | 'expired' | 'none';
  vipExpiryDate?: Date;
  vipPurchaseHistory: Array<{
    level: 'VIP1' | 'VIP2' | 'VIP3';
    purchaseDate: Date;
    amount: number;
    transactionId: string;
  }>;
  // Wallet functionality
  walletBalance: number;
  walletTransactions: Array<{
    type: string;
    amount: number;
    description: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    unique: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  vipLevel: {
    type: String,
    enum: ['VIP1', 'VIP2', 'VIP3'],
    default: undefined
  },
  subscriptionDate: {
    type: Date,
    default: undefined
  },
  // totalEarnings field REMOVED - calculated real-time from transactions
  monthlyReturns: {
    type: Number,
    default: 0
  },
  profileImage: {
    type: String,
    default: null
  },
  assignedManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manager',
    default: undefined
  },
  // Enhanced VIP tracking
  vipStatus: {
    type: String,
    enum: ['active', 'expired', 'none'],
    default: 'none'
  },
  vipExpiryDate: {
    type: Date,
    default: undefined
  },
  vipPurchaseHistory: [{
    level: {
      type: String,
      enum: ['VIP1', 'VIP2', 'VIP3'],
      required: true
    },
    purchaseDate: {
      type: Date,
      default: Date.now
    },
    amount: {
      type: Number,
      required: true
    },
    transactionId: {
      type: String,
      required: true
    }
  }],
  // Wallet functionality
  walletBalance: {
    type: Number,
    default: 0
  },
  walletTransactions: [{
    type: {
      type: String,
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
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
    return;
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch {
    next(new Error('Password hashing failed'));
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch {
    return false;
  }
};

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);
