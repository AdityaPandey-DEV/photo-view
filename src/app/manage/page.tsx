'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function ManagePage() {
  const router = useRouter();
  const [email, setEmail] = useState('adityapandey.dev.in@gmail.com');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth');
      if (response.ok) {
        setIsAuthenticated(true);
        // Redirect to dashboard if already authenticated
        router.push('/manage/dashboard');
      }
    } catch (error) {
      // Not authenticated, stay on login page
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setError('');
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        router.push('/manage/dashboard');
      } else {
        setError(data.error || 'OTP verification failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="manage-page">
        <div className="manage-container">
          <div className="loading">Redirecting to dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-page">
      <div className="manage-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">
              <Shield className="logo-icon" />
            </div>
            <h1>Manager Panel</h1>
            <p>VIP Management System</p>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendOTP} className="login-form">
              {error && (
                <div className="error-message">
                  <AlertCircle className="icon" />
                  {error}
                </div>
              )}

              <div className="form-field">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="login-btn" 
                disabled={loading}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="login-form">
              {error && (
                <div className="error-message">
                  <AlertCircle className="icon" />
                  {error}
                </div>
              )}

              <div className="form-field">
                <label htmlFor="otp" className="form-label">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="form-input"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  required
                />
                <p className="otp-info">
                  OTP sent to {email}
                </p>
              </div>

              <button 
                type="submit" 
                className="login-btn" 
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button 
                type="button" 
                className="back-btn" 
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setError('');
                }}
              >
                Back to Email
              </button>
            </form>
          )}

          <div className="login-footer">
            <p className="security-note">
              <Shield className="icon" />
              Secure Manager Access
            </p>
            <div className="credentials-info" style={{
              background: 'rgba(30, 58, 138, 0.1)',
              padding: '1rem',
              borderRadius: '8px',
              marginTop: '1rem',
              fontSize: '0.875rem',
              color: '#1e3a8a'
            }}>
              <strong>Login with your registered email</strong><br/>
              OTP will be sent to your email address
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
