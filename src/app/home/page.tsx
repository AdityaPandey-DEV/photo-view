'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Camera, DollarSign, TrendingUp, User, LogOut, Settings, BarChart3, Plus, RefreshCw } from 'lucide-react';
import { getUnusedRandomPhotos, getPhotoUsageStats } from '@/data/photos';
import ProfileImageSelector from '@/components/ProfileImageSelector';

interface User {
  _id: string;
  name: string;
  phone: string;
  vipLevel?: 'VIP1' | 'VIP2' | 'VIP3';
  subscriptionDate?: string;
  // totalEarnings REMOVED - calculated real-time from MongoDB transactions
  monthlyReturns?: number;
  profileImage?: string;
}

interface PhotoTask {
  id: string;
  title: string;
  earnings: number;
  difficulty: string;
  category: string;
  completed: boolean;
  imageUrl: string;
  photographer: string;
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  
  // Photo tasks data - will be updated based on VIP level
  const [photoTasks, setPhotoTasks] = useState<PhotoTask[]>([]);
  
  // Real-time balance state (NO MEMORY STORAGE)
  const [realTimeBalance, setRealTimeBalance] = useState<{
    current: number;
    totalEarned: number;
    totalSpent: number;
  } | null>(null);

  // VIP status state (NO MEMORY STORAGE)
  const [vipStatus, setVipStatus] = useState<any>(null);
  
    // Generate photo tasks based on VIP level
  const generatePhotoTasks = useCallback((vipLevel?: string) => {
    const dailyLimit = getDailyTaskLimit(vipLevel);
    const randomPhotos = getUnusedRandomPhotos(dailyLimit);
    
    // Calculate earnings per task based on VIP level
    const earningsPerTask = getDailyEarnings(vipLevel) / getDailyTaskLimit(vipLevel);
    
    const selectedTasks = randomPhotos.map((photo: any, index: number) => ({
      id: (index + 1).toString(),
      title: photo.title,
      earnings: earningsPerTask,
      difficulty: '15s',
      category: photo.category,
      completed: false,
      imageUrl: photo.imageUrl,
      photographer: photo.photographer
    }));

    setPhotoTasks(selectedTasks);
  }, []);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      console.log('🔍 Fetching user data...');
      const response = await fetch('/api/auth/me');
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User data received:', userData);
        // The API returns { user: { ... } }, so we need to extract the user object
        console.log('🔍 Extracted user data:', userData.user);
        setUser(userData.user);
        // Generate photo tasks based on VIP level
        generatePhotoTasks(userData.user.vipLevel);
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ Failed to fetch user data:', errorData);
        setError(`Failed to fetch user data: ${response.status}`);
        router.push('/login');
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      setError('Network error while fetching user data');
      router.push('/login');
    }
  }, [router]);

  // Fetch real-time balance from database (NO MEMORY STORAGE)
  const fetchRealTimeBalance = async () => {
    try {
      const response = await fetch('/api/wallet/balance', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Ensure balance is never negative
        const validatedBalance = {
          ...data.balance,
          current: Math.max(0, data.balance.current)
        };
        
        setRealTimeBalance(validatedBalance);
        console.log('Real-time balance updated:', validatedBalance);
        
        // Log any negative balance issues
        if (data.balance.current < 0) {
          console.warn('Negative balance detected and corrected:', data.balance.current, '→', validatedBalance.current);
        }
      }
    } catch (error) {
      console.error('Failed to fetch real-time balance:', error);
    }
  };

  // Fetch real-time daily progress from MongoDB (NO MEMORY STORAGE)
  const fetchDailyProgress = async () => {
    try {
      const response = await fetch('/api/tasks/daily-progress', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.hasVip) {
          setDailyProgress(data.dailyProgress);
          console.log('Real-time daily progress updated:', data.dailyProgress);
        }
      }
    } catch (error) {
      console.error('Failed to fetch daily progress:', error);
    }
  };

  // Fetch VIP status from MongoDB (NO MEMORY STORAGE)
  const fetchVipStatus = async () => {
    try {
      const response = await fetch('/api/vip/status', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVipStatus(data);
        
        // Update profile image from VIP status
        if (data.profileImage) {
          setProfileImage(data.profileImage);
        }
        
        console.log('VIP status updated:', data);
      }
    } catch (error) {
      console.error('Failed to fetch VIP status:', error);
    }
  };

  // Fetch user's completed tasks
  const fetchUserTasks = useCallback(async () => {
    try {
      console.log('🔍 Fetching user tasks...');
      const response = await fetch('/api/tasks/user-tasks');
      console.log('📡 Tasks response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Tasks data received:', data);
        setPhotoTasks(prevTasks => 
          prevTasks.map(task => ({
            ...task,
            completed: data.completedTasks.some((completedTask: any) => 
              completedTask.taskId === task.id
            )
          }))
        );
      } else {
        console.log('❌ Failed to fetch user tasks');
      }
    } catch (error) {
      console.error('❌ Failed to fetch user tasks:', error);
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    await Promise.all([fetchUserData(), fetchUserTasks(), fetchRealTimeBalance(), fetchDailyProgress(), fetchVipStatus()]);
    setRefreshing(false);
  }, [fetchUserData, fetchUserTasks]);

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      console.log('🚀 Initializing home page data...');
      await Promise.all([fetchUserData(), fetchUserTasks(), fetchRealTimeBalance(), fetchDailyProgress(), fetchVipStatus()]);
      setLoading(false);
    };
    initializeData();
  }, [fetchUserData, fetchUserTasks, generatePhotoTasks]);

  // Force refresh on mount to clear any cached data
  useEffect(() => {
    const forceRefresh = () => {
      console.log('🔄 Force refreshing data on mount...');
      fetchUserData();
      fetchUserTasks();
      fetchRealTimeBalance();
      fetchDailyProgress();
      fetchVipStatus();
    };
    forceRefresh();
  }, [fetchUserData, fetchUserTasks, generatePhotoTasks]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle VIP upgrade
  const handleUpgradeVIP = () => {
    router.push('/vip-purchase');
  };
  
  // Handle profile image selection
  const handleProfileImageSelect = (imageUrl: string) => {
    setProfileImage(imageUrl);
    // The ProfileImageSelector will save to MongoDB automatically
    console.log('Profile image selected:', imageUrl);
  };

  // Get VIP icon
  const getVIPIcon = (vipLevel?: string) => {
    switch (vipLevel) {
      case 'VIP1': return '⭐';
      case 'VIP2': return '👑';
      case 'VIP3': return '⚡';
      default: return '👤';
    }
  };

  // Get VIP color class
  const getVIPColor = (vipLevel?: string) => {
    switch (vipLevel) {
      case 'VIP1': return 'text-blue-600';
      case 'VIP2': return 'text-purple-600';
      case 'VIP3': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  // Get daily earnings based on VIP level
  const getDailyEarnings = (vipLevel?: string) => {
    switch (vipLevel) {
      case 'VIP1': return 30;
      case 'VIP2': return 100;
      case 'VIP3': return 370;
      default: return 0;
    }
  };

  // Get daily task limit based on VIP level
  const getDailyTaskLimit = (vipLevel?: string) => {
    switch (vipLevel) {
      case 'VIP1': return 5;   // Reduced from 15 to 5
      case 'VIP2': return 10;  // Reduced from 30 to 10
      case 'VIP3': return 20;  // Reduced from 50 to 20
      default: return 0;
    }
  };

  // Get monthly task limit based on VIP level
  const getMonthlyTaskLimit = (vipLevel?: string) => {
    switch (vipLevel) {
      case 'VIP1': return 150;  // 5 daily × 30 days
      case 'VIP2': return 300;  // 10 daily × 30 days
      case 'VIP3': return 600;  // 20 daily × 30 days
      default: return 0;
    }
  };

  // Real-time daily progress state (NO MEMORY STORAGE)
  const [dailyProgress, setDailyProgress] = useState<{
    completed: number;
    limit: number;
    remaining: number;
    percentage: number;
  } | null>(null);
  
  // Profile image state
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showProfileSelector, setShowProfileSelector] = useState(false);

  // Calculate completion percentage from real-time data
  const completionPercentage = dailyProgress 
    ? dailyProgress.percentage 
    : (photoTasks.length > 0 
        ? (photoTasks.filter(task => task.completed).length / photoTasks.length) * 100 
        : 0);

  // Calculate total earnings from completed tasks (fallback to UI state)
  const totalTaskEarnings = photoTasks
    .filter(task => task.completed)
    .reduce((sum, task) => sum + task.earnings, 0);

  // Debug: Log current user state
  console.log('🔍 Current user state:', user);
  console.log('🔍 Loading state:', loading);
  console.log('🔍 Error state:', error);

  if (loading) {
    return (
      <div className="home-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your VIP dashboard...</p>
          {error && <p className="error-message">Error: {error}</p>}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="home-page">
        <div className="error-container">
          <h2>Authentication Error</h2>
          <p>{error || 'User not found. Please log in again.'}</p>
          <button onClick={() => router.push('/login')} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <div className="header-content">
          <div className="user-info">
            <div 
              className="user-avatar clickable"
              onClick={() => setShowProfileSelector(true)}
              title="Click to change profile image"
            >
              {user?.profileImage ? (
                <img 
                  src={user.profileImage} 
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
              <h2>Welcome {user.phone}!</h2>
              <div className="vip-badge">
                <span className="vip-icon">{getVIPIcon(user.vipLevel)}</span>
                <span className={`vip-level ${getVIPColor(user.vipLevel)}`}>
                  {user.vipLevel || 'Basic'}
                </span>
                {user.vipLevel && user.subscriptionDate && (
                  <span className="vip-subscription-date">
                    Since {new Date(user.subscriptionDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="refresh-btn" 
              onClick={refreshData}
              disabled={refreshing}
              title="Refresh all data including real-time balance"
            >
              <RefreshCw className={`icon ${refreshing ? 'spinning' : ''}`} />
            </button>
            <button className="settings-btn" onClick={() => router.push('/settings')}>
              <Settings className="icon" />
            </button>
            <button onClick={handleLogout} className="logout-btn">
              <LogOut className="icon" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="home-main">
        {/* VIP Stats */}
        <section className="vip-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <Crown className="icon" />
            </div>
            <div className="stat-content">
              <h3>VIP Level</h3>
              <p className="stat-value">{user.vipLevel || 'Basic'}</p>
              {user.vipLevel && (
                <small className="stat-note">Active Subscription</small>
              )}
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <DollarSign className="icon" />
            </div>
            <div className="stat-content">
              <h3>Daily Earnings</h3>
              <p className="stat-value">₹{getDailyEarnings(user.vipLevel)}</p>
              {user.vipLevel && (
                <small className="stat-note">
                  ₹{(getDailyEarnings(user.vipLevel) / getDailyTaskLimit(user.vipLevel)).toFixed(2)} per task
                </small>
              )}
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp className="icon" />
            </div>
            <div className="stat-content">
              <h3>Total Balance</h3>
              <p className="stat-value">₹{Math.max(0, realTimeBalance?.current || 0)}</p>
              <small className="stat-note">
                {realTimeBalance ? '🟢 Live from MongoDB' : '🔄 Loading...'}
              </small>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Camera className="icon" />
            </div>
            <div className="stat-content">
              <h3>Daily Tasks</h3>
              <p className="stat-value">
                {dailyProgress ? `${dailyProgress.completed}/${dailyProgress.limit}` : `${photoTasks.filter(task => task.completed).length}/${getDailyTaskLimit(user.vipLevel)}`}
              </p>
              <small className="stat-note">
                {dailyProgress ? `🟢 Live from MongoDB` : `🔄 Loading...`}
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <BarChart3 className="icon" />
            </div>
            <div className="stat-content">
              <h3>Monthly Returns</h3>
              <p className="stat-value">₹{user.monthlyReturns || 0}</p>
              <small className="stat-note">Monthly Limit: {getMonthlyTaskLimit(user.vipLevel)} tasks</small>
            </div>
          </div>
        </section>

        {/* Photo Viewing Tasks */}
        <section className="earning-opportunities">
                      <div className="section-header">
              <h2>📸 Photo Viewing Tasks</h2>
              <p>View random photos for 15 seconds to earn ₹{(getDailyEarnings(user.vipLevel) / getDailyTaskLimit(user.vipLevel)).toFixed(2)} per photo</p>
              {user.vipLevel && (
                <div className="vip-task-info">
                  <span className="vip-badge-small">
                    {getVIPIcon(user.vipLevel)} {user.vipLevel}
                  </span>
                  <span className="task-limit-info">
                    Daily Limit: {getDailyTaskLimit(user.vipLevel)} tasks | 
                    Daily Earnings: ₹{getDailyEarnings(user.vipLevel)} | 
                    Monthly Limit: {getMonthlyTaskLimit(user.vipLevel)} tasks
                  </span>
                </div>
              )}

            </div>
          
          <div className="photos-grid">
            {photoTasks.map((task) => (
              <div 
                key={task.id} 
                className={`photo-card ${task.completed ? 'completed' : ''}`}
                data-task-id={task.id}
              >
                {/* Real Photo Display */}
                {task.imageUrl && (
                  <div className="photo-image-container">
                    <div className="image-loading">
                      <div className="loading-spinner-small"></div>
                    </div>
                    <img 
                      src={task.imageUrl} 
                      alt={task.title}
                      className="photo-image"
                      loading="lazy"
                      onLoad={() => {
                        // Hide loading spinner when image loads
                        const container = document.querySelector(`[data-task-id="${task.id}"] .image-loading`);
                        if (container) {
                          (container as HTMLElement).style.display = 'none';
                        }
                      }}
                      onError={(e) => {
                        // Fallback to a different real photo if the first one fails
                        const target = e.target as HTMLImageElement;
                        const fallbackPhotos = [
                          'https://images.pexels.com/photos/1462980/pexels-photo-1462980.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
                          'https://images.pexels.com/photos/2387866/pexels-photo-2387866.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
                          'https://images.pexels.com/photos/2387869/pexels-photo-2387869.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'
                        ];
                        const randomPhoto = fallbackPhotos[Math.floor(Math.random() * fallbackPhotos.length)];
                        target.src = randomPhoto;
                      }}
                    />
                    <div className="photo-overlay">
                      <span className="photographer-credit">📸 {task.photographer}</span>
                    </div>
                  </div>
                )}
                
                <div className="photo-header">
                  <Camera className="photo-icon" />
                  <span className="photo-category">{task.category}</span>
                  {task.completed && (
                    <div className="completed-badge">
                      <span>✓</span>
                    </div>
                  )}
                </div>
                <h3>{task.title}</h3>
                <div className="photo-details">
                  <div className="earnings">
                    <DollarSign className="icon" />
                    <span>₹{task.earnings}</span>
                  </div>
                  <div className="difficulty">
                    <span className="difficulty-badge">
                      {task.difficulty}
                    </span>
                  </div>
                </div>
                <button 
                  className="start-task-btn"
                  onClick={() => router.push('/tasks')}
                  disabled={task.completed}
                >
                  {task.completed ? 'Completed' : 'View Rating'}
                </button>
              </div>
            ))}
          </div>
          
          {/* Task Progress Summary */}
          <div className="task-progress-summary">
            <div className="progress-stats">
              <div className="progress-stat">
                <span className="stat-label">Total Tasks:</span>
                <span className="stat-value">{photoTasks.length}</span>
              </div>
              <div className="progress-stat">
                <span className="stat-label">Completed Today:</span>
                <span className="stat-value completed">
                  {dailyProgress ? dailyProgress.completed : photoTasks.filter(task => task.completed).length}
                </span>
              </div>
              <div className="progress-stat">
                <span className="stat-label">Daily Limit:</span>
                <span className="stat-value limit">
                  {dailyProgress ? dailyProgress.limit : getDailyTaskLimit(user.vipLevel)}
                </span>
              </div>
              <div className="progress-stat">
                <span className="stat-label">Total Balance:</span>
                <span className="stat-value earnings">₹{Math.max(0, realTimeBalance?.current || 0)}</span>
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            {dailyProgress && (
              <div className="progress-status">
                <small>
                  {dailyProgress.completed >= dailyProgress.limit 
                    ? '🎯 Daily limit reached!' 
                    : `🔄 ${dailyProgress.remaining} tasks remaining today`
                  }
                </small>
              </div>
            )}
          </div>
        </section>

        {/* How It Works */}
        <section className="how-it-works">
          <div className="section-header">
            <h2>🎯 How Photo Earning Works</h2>
            <p>Simple 3-step process to earn money (Just like Ceesin.com)</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>View Photos</h3>
                <p>Click &quot;View Rating&quot; to open random photos from the internet</p>
              </div>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>15-Second Timer</h3>
                <p>Watch each photo for exactly 15 seconds (timer counts down)</p>
              </div>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Earn Money</h3>
                <p>Get ₹15 automatically when timer reaches 0</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions">
          <div className="section-header">
            <h2>🚀 Quick Actions</h2>
          </div>
          <div className="actions-grid">
            <button className="action-btn" onClick={() => router.push('/tasks')}>
              <Camera className="icon" />
              <span>📸 View Photos & Earn</span>
            </button>
            <button className="action-btn" onClick={() => router.push('/wallet')}>
              <DollarSign className="icon" />
              <span>💰 My Wallet</span>
            </button>

            <button className="action-btn" onClick={() => router.push('/settings')}>
              <Settings className="icon" />
              <span>⚙️ Settings</span>
            </button>
            <button className="action-btn vip-upgrade" onClick={handleUpgradeVIP}>
              <Plus className="icon" />
              <span>⭐ Upgrade VIP</span>
            </button>
          </div>
        </section>
      </main>


      
      {/* Profile Image Selector */}
      <ProfileImageSelector
        isOpen={showProfileSelector}
        onClose={() => setShowProfileSelector(false)}
        onSelect={handleProfileImageSelect}
        currentImage={profileImage || undefined}
      />
    </div>
  );
}