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
