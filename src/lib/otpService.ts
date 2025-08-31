import crypto from 'crypto';
import connectDB from './mongodb';
import OTP from '@/models/OTP';

// OTP configuration
const OTP_CONFIG = {
  length: 6,
  expiryMinutes: 10,
  maxAttempts: 3
};

// Generate random OTP
export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

// Store OTP for manager in MongoDB
export const storeOTP = async (email: string, otp: string, managerId: string = ''): Promise<void> => {
  try {
    await connectDB();
    
    const expiresAt = new Date(Date.now() + OTP_CONFIG.expiryMinutes * 60 * 1000);
    
    // Remove any existing OTP for this email
    await OTP.deleteOne({ email });
    
    // Store new OTP
    await OTP.create({
      email,
      otp,
      attempts: 0,
      expiresAt,
      managerId
    });
    
    console.log(`OTP stored for ${email}: ${otp} (expires: ${expiresAt})`);
  } catch (error) {
    console.error('Failed to store OTP:', error);
    throw new Error('Failed to store OTP');
  }
};

// Verify OTP from MongoDB
export const verifyOTP = async (email: string, otp: string): Promise<{
  success: boolean;
  managerId?: string;
  message: string;
}> => {
  try {
    await connectDB();
    
    const storedData = await OTP.findOne({ email });
    
    if (!storedData) {
      return { success: false, message: 'OTP not found or expired' };
    }
    
    // Check if OTP expired
    if (new Date() > storedData.expiresAt) {
      await OTP.deleteOne({ email });
      return { success: false, message: 'OTP has expired' };
    }
    
    // Check max attempts
    if (storedData.attempts >= OTP_CONFIG.maxAttempts) {
      await OTP.deleteOne({ email });
      return { success: false, message: 'Maximum attempts exceeded. Please request new OTP.' };
    }
    
    // Verify OTP
    if (storedData.otp === otp) {
      const managerId = storedData.managerId;
      await OTP.deleteOne({ email }); // Clear OTP after successful verification
      return { success: true, managerId, message: 'OTP verified successfully' };
    } else {
      // Increment attempts
      storedData.attempts++;
      await storedData.save();
      
      const remainingAttempts = OTP_CONFIG.maxAttempts - storedData.attempts;
      return { 
        success: false, 
        message: `Invalid OTP. ${remainingAttempts} attempts remaining.` 
      };
    }
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    return { success: false, message: 'Failed to verify OTP' };
  }
};

// Check if OTP exists and is valid
export const isOTPValid = async (email: string): Promise<boolean> => {
  try {
    await connectDB();
    
    const storedData = await OTP.findOne({ email });
    if (!storedData) return false;
    
    return new Date() <= storedData.expiresAt && storedData.attempts < OTP_CONFIG.maxAttempts;
  } catch (error) {
    console.error('Failed to check OTP validity:', error);
    return false;
  }
};

// Get OTP info (for debugging)
export const getOTPInfo = async (email: string) => {
  try {
    await connectDB();
    return await OTP.findOne({ email });
  } catch (error) {
    console.error('Failed to get OTP info:', error);
    return null;
  }
};

// Clear expired OTPs (cleanup function)
export const cleanupExpiredOTPs = async (): Promise<number> => {
  try {
    await connectDB();
    
    const result = await OTP.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    if (result.deletedCount > 0) {
      console.log(`Cleaned up ${result.deletedCount} expired OTPs`);
    }
    
    return result.deletedCount || 0;
  } catch (error) {
    console.error('Failed to cleanup expired OTPs:', error);
    return 0;
  }
};

export default {
  generateOTP,
  storeOTP,
  verifyOTP,
  isOTPValid,
  getOTPInfo,
  cleanupExpiredOTPs
};
