import crypto from 'crypto';

// OTP configuration
const OTP_CONFIG = {
  length: 6,
  expiryMinutes: 10,
  maxAttempts: 3
};

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map<string, {
  otp: string;
  attempts: number;
  expiresAt: Date;
  managerId: string;
}>();

// Generate random OTP
export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

// Store OTP for manager
export const storeOTP = async (email: string, otp: string): Promise<void> => {
  const expiresAt = new Date(Date.now() + OTP_CONFIG.expiryMinutes * 60 * 1000);
  
  otpStore.set(email, {
    otp,
    attempts: 0,
    expiresAt,
    managerId: '' // We'll get this from the manager lookup
  });
  
  console.log(`OTP stored for ${email}: ${otp} (expires: ${expiresAt})`);
};

// Verify OTP
export const verifyOTP = (email: string, otp: string): {
  success: boolean;
  managerId?: string;
  message: string;
} => {
  const storedData = otpStore.get(email);
  
  if (!storedData) {
    return { success: false, message: 'OTP not found or expired' };
  }
  
  // Check if OTP expired
  if (new Date() > storedData.expiresAt) {
    otpStore.delete(email);
    return { success: false, message: 'OTP has expired' };
  }
  
  // Check max attempts
  if (storedData.attempts >= OTP_CONFIG.maxAttempts) {
    otpStore.delete(email);
    return { success: false, message: 'Maximum attempts exceeded. Please request new OTP.' };
  }
  
  // Verify OTP
  if (storedData.otp === otp) {
    const managerId = storedData.managerId;
    otpStore.delete(email); // Clear OTP after successful verification
    return { success: true, managerId, message: 'OTP verified successfully' };
  } else {
    // Increment attempts
    storedData.attempts++;
    otpStore.set(email, storedData);
    
    const remainingAttempts = OTP_CONFIG.maxAttempts - storedData.attempts;
    return { 
      success: false, 
      message: `Invalid OTP. ${remainingAttempts} attempts remaining.` 
    };
  }
};

// Check if OTP exists and is valid
export const isOTPValid = (email: string): boolean => {
  const storedData = otpStore.get(email);
  if (!storedData) return false;
  
  return new Date() <= storedData.expiresAt && storedData.attempts < OTP_CONFIG.maxAttempts;
};

// Get OTP info (for debugging)
export const getOTPInfo = (email: string) => {
  return otpStore.get(email);
};

// Clear expired OTPs (cleanup function)
export const cleanupExpiredOTPs = (): number => {
  let cleared = 0;
  const now = new Date();
  
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(email);
      cleared++;
    }
  }
  
  if (cleared > 0) {
    console.log(`Cleaned up ${cleared} expired OTPs`);
  }
  
  return cleared;
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

export default {
  generateOTP,
  storeOTP,
  verifyOTP,
  isOTPValid,
  getOTPInfo,
  cleanupExpiredOTPs
};
