import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_HOST_USER || 'adityapandey.dev.in@gmail.com',
    pass: process.env.EMAIL_HOST_PASSWORD || 'hagbaiwzqltgfflz'
  },
  tls: {
    rejectUnauthorized: false
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// OTP email template
const generateOTPEmail = (otp: string, managerName: string) => ({
  subject: 'Login OTP - Photo View Management',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e3a8a; margin: 0; font-size: 24px;">Photo View Management</h1>
          <p style="color: #6b7280; margin: 10px 0 0 0;">Secure Login Verification</p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Hello ${managerName},</h2>
          <p style="color: #6b7280; margin: 0 0 15px 0; line-height: 1.6;">
            You have requested to login to the Photo View Management system. 
            Please use the following OTP code to complete your login:
          </p>
          
          <div style="text-align: center; margin: 25px 0;">
            <div style="background-color: #1e3a8a; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 8px; display: inline-block;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #dc2626; margin: 0; font-size: 14px; font-weight: 600;">
            ⚠️ This OTP is valid for 10 minutes only. Do not share it with anyone.
          </p>
        </div>
        
        <div style="text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">If you didn't request this login, please ignore this email.</p>
          <p style="margin: 10px 0 0 0;">This is an automated message, please do not reply.</p>
        </div>
      </div>
    </div>
  `
});

// Send OTP email
export const sendOTPEmail = async (email: string, otp: string, managerName: string) => {
  try {
    const { subject, html } = generateOTPEmail(otp, managerName);
    
    const mailOptions = {
      from: `"Photo View Management" <${emailConfig.auth.user}>`,
      to: email,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Failed to send OTP email:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

// Test email connection
export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('Email service is ready');
    return { success: true, message: 'Email service is ready' };
  } catch (error: any) {
    console.error('Email service error:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

export default transporter;
