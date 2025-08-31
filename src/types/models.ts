import { Types } from 'mongoose';

export interface Manager {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  maxVipCapacity: number;
  currentVipCount: number;
  assignedVips: Types.ObjectId[];
  role: 'manager' | 'senior_manager' | 'admin';
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<Manager>;
}

export interface User {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  vipLevel?: string;
  assignedManager?: Types.ObjectId;
  save(): Promise<User>;
}

export interface WithdrawalRequest {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  gst: number;
  netAmount: number;
  status: 'pending' | 'under_review' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled';
  assignedManager?: Types.ObjectId;
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
  save(): Promise<WithdrawalRequest>;
}

export interface Admin {
  _id: Types.ObjectId;
  username: string;
  name: string;
  email?: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<Admin>;
}
