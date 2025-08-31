'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function ManagePage() {
  const router = useRouter();
  const [username, setUsername] = useState('aditya-admin');
  const [password, setPassword] = useState('Ad282499');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        router.push('/manage/dashboard');
      } else {
        setError(data.error || 'Login failed');
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
            <h1>Admin Panel</h1>
            <p>VIP Management System</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {error && (
              <div className="error-message">
                <AlertCircle className="icon" />
                {error}
              </div>
            )}

            <div className="form-field">
              <label htmlFor="username" className="form-label">
                Admin ID
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                placeholder="Enter admin ID"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-input-container">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="icon" /> : <Eye className="icon" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="login-btn" 
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <p className="security-note">
              <Shield className="icon" />
              Secure Admin Access
            </p>
            <div className="credentials-info" style={{
              background: 'rgba(30, 58, 138, 0.1)',
              padding: '1rem',
              borderRadius: '8px',
              marginTop: '1rem',
              fontSize: '0.875rem',
              color: '#1e3a8a'
            }}>
              <strong>Default Credentials:</strong><br/>
              ID: aditya-admin<br/>
              Password: Ad282499
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
