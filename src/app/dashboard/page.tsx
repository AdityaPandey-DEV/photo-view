'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, User, LogOut, Settings, Image, BarChart3 } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  phone: string;
  role: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        } else {
          // Redirect to login if not authenticated
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-container">
          <div className="header-content">
            <div className="logo-section">
              <Camera className="logo-icon" />
              <h1 className="platform-title">VIP Photography Platform</h1>
            </div>
            <div className="user-section">
              <span className="welcome-text">Welcome, {user.name}</span>
              <button onClick={handleLogout} className="logout-button">
                <LogOut className="logout-icon" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Orange Separator */}
      <div className="orange-separator"></div>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="profile-section">
          <div className="profile-header">
            <h2 className="profile-name">{user.name}</h2>
            <p className="profile-phone">{user.phone}</p>
          </div>
          
          <div className="profile-divider">
            <button className="edit-profile-btn">
              <Settings className="edit-icon" />
              Edit Profile
            </button>
          </div>

          <div className="profile-details">
            <div className="detail-item">
              <h3 className="detail-label">Role</h3>
              <p className="detail-value">{user.role}</p>
            </div>

            <div className="detail-item">
              <h3 className="detail-label">Member Since</h3>
              <p className="detail-value">
                {new Date(user.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>

            <div className="detail-item">
              <h3 className="detail-label">VIP Level</h3>
              <p className="detail-value vip-level">
                <span className="vip-icon">■</span>
                VIP 1
              </p>
            </div>

            <div className="detail-item">
              <h3 className="detail-label">Monthly Returns</h3>
              <p className="detail-value returns">
                <BarChart3 className="returns-icon" />
                ₹1,800
              </p>
            </div>

            <div className="detail-item">
              <h3 className="detail-label">Daily Tasks</h3>
              <p className="detail-value tasks">
                <Camera className="tasks-icon" />
                5
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
