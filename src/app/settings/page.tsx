'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Save, ArrowLeft, Eye, EyeOff, Crown, Calendar, DollarSign } from 'lucide-react';
import ProfileImageSelector from '@/components/ProfileImageSelector';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [vipStatus, setVipStatus] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [userResponse, vipResponse] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/vip/status')
      ]);
      
      if (userResponse.ok && vipResponse.ok) {
        const userData = await userResponse.json();
        const vipData = await vipResponse.json();
        
        console.log('Settings: User data received:', userData);
        console.log('Settings: VIP status received:', vipData);
        
        setUser(userData);
        setVipStatus(vipData);
        
        // Set profile image from VIP status
        if (vipData.profileImage) {
          setProfileImage(vipData.profileImage);
        }
        
        setFormData(prev => ({ ...prev, name: userData.name }));
      } else {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    try {
      // Validate password change if attempting to change password
      if (formData.newPassword || formData.confirmPassword) {
        if (!formData.currentPassword) {
          throw new Error('Current password is required to change password');
        }
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('New passwords do not match');
        }
        if (formData.newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters');
        }
      }

      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Update failed');
      }

      setMessage('Profile updated successfully!');
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      
      // Update local user data
      if (data.user) {
        setUser(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <button onClick={() => router.back()} className="back-btn">
            <ArrowLeft className="icon" />
            Back
          </button>
          <h1>Account Settings</h1>
        </div>

        <div className="user-info">
          <div className="user-avatar">
            {profileImage ? (
              <img 
                src={profileImage} 
                alt="Profile" 
                className="profile-image-display"
                onError={() => {
                  console.log('Profile image failed to load, falling back to icon');
                }}
              />
            ) : (
              <User className="avatar-icon" />
            )}
          </div>
          <div className="user-details">
            <h2>{user?.name}</h2>
            <p>{user?.phone}</p>
            <span className={`vip-badge ${vipStatus?.vip?.level && vipStatus.vip.level !== 'none' ? 'vip-active' : 'vip-inactive'}`}>
              {vipStatus ? (
                vipStatus.vip.level && vipStatus.vip.level !== 'none' ? vipStatus.vip.level : 'No VIP'
              ) : (
                'Loading VIP...'
              )}
            </span>
            {!vipStatus && (
              <small style={{ color: '#ef4444', fontSize: '0.75rem' }}>
                VIP status not loaded
              </small>
            )}
          </div>
        </div>

        {/* VIP Status Section */}
        {vipStatus && (
          <div className="vip-status-section">
            <h3>VIP Subscription Details</h3>
            
            <div className="vip-info-grid">
              <div className="vip-info-card">
                <Crown className="vip-icon" />
                <div className="vip-details">
                  <h4>VIP Level</h4>
                  <p className={vipStatus.vip.level !== 'none' ? 'vip-active' : 'vip-inactive'}>
                    {vipStatus.vip.level !== 'none' ? vipStatus.vip.level : 'No VIP'}
                  </p>
                </div>
              </div>
              
              <div className="vip-info-card">
                <Calendar className="vip-icon" />
                <div className="vip-details">
                  <h4>Subscription Date</h4>
                  <p>
                    {vipStatus.vip.subscriptionDate 
                      ? new Date(vipStatus.vip.subscriptionDate).toLocaleDateString()
                      : 'Not subscribed'
                    }
                  </p>
                </div>
              </div>
              
              <div className="vip-info-card">
                <DollarSign className="vip-icon" />
                <div className="vip-details">
                  <h4>Monthly Returns</h4>
                  <p>₹{vipStatus.vip.monthlyReturns || 0}</p>
                </div>
              </div>
            </div>
            
            {vipStatus.vip.level !== 'none' && (
              <div className="vip-benefits">
                <h4>VIP Benefits</h4>
                <div className="benefits-grid">
                  <div className="benefit-item">
                    <span className="benefit-label">Daily Tasks:</span>
                    <span className="benefit-value">{vipStatus.vip.dailyTaskLimit}</span>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-label">Daily Earnings:</span>
                    <span className="benefit-value">₹{vipStatus.vip.dailyEarnings}</span>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-label">Monthly Tasks:</span>
                    <span className="benefit-value">{vipStatus.vip.monthlyTaskLimit}</span>
                  </div>
                </div>
                
                <div className="current-progress">
                  <h5>Current Progress</h5>
                  <div className="progress-item">
                    <span>Today: {vipStatus.currentStatus.todayTasks}/{vipStatus.vip.dailyTaskLimit} tasks</span>
                    <div className="progress-bar-mini">
                      <div 
                        className="progress-fill-mini" 
                        style={{ width: `${vipStatus.currentStatus.dailyProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <form className="settings-form" onSubmit={handleSubmit}>
          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-section">
            <h3>Personal Information</h3>
            
            <div className="form-field">
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <div className="input-wrapper">
                <User className="input-icon" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">
                Profile Image
              </label>
              <div className="profile-image-section">
                <div className="current-profile-image">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt="Current Profile" 
                      className="profile-image-preview"
                    />
                  ) : (
                    <div className="no-profile-image">
                      <User className="icon" />
                      <span>No profile image</span>
                    </div>
                  )}
                </div>
                <button 
                  type="button" 
                  className="change-profile-btn"
                  onClick={() => setShowProfileSelector(true)}
                >
                  Change Profile Image
                </button>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Change Password</h3>
            <p className="section-description">
              Leave password fields empty if you don&apos;t want to change your password
            </p>
            
            <div className="form-field">
              <label htmlFor="currentPassword" className="form-label">
                Current Password
              </label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="password-toggle"
                >
                  {showPasswords.current ? <EyeOff className="icon" /> : <Eye className="icon" />}
                </button>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="newPassword" className="form-label">
                New Password
              </label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="password-toggle"
                >
                  {showPasswords.new ? <EyeOff className="icon" /> : <Eye className="icon" />}
                </button>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm New Password
              </label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="password-toggle"
                >
                  {showPasswords.confirm ? <EyeOff className="icon" /> : <Eye className="icon" />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="save-btn" disabled={saving}>
            <Save className="icon" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Profile Image Selector */}
        <ProfileImageSelector
          isOpen={showProfileSelector}
          onClose={() => setShowProfileSelector(false)}
          onSelect={(imageUrl) => {
            setProfileImage(imageUrl);
            setShowProfileSelector(false);
          }}
          currentImage={profileImage || undefined}
        />
      </div>
    </div>
  );
}
