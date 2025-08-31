'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Clock, DollarSign, ArrowLeft, Play, Pause, CheckCircle, Plus } from 'lucide-react';
import { getUnusedRandomPhotos, getPhotoUsageStats } from '@/data/photos';

interface PhotoTask {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  reward: number;
  completed: boolean;
}

export default function TasksPage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    name: string;
    phone: string;
    vipLevel?: string;
  } | null>(null);
  
  // Real-time balance state (NO MEMORY STORAGE)
  const [realTimeBalance, setRealTimeBalance] = useState<{
    current: number;
    totalEarned: number;
    totalWithdrawn: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTask, setCurrentTask] = useState<PhotoTask | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [dailyProgress, setDailyProgress] = useState<{
    completed: number;
    limit: number;
    remaining: number;
    percentage: number;
  } | null | undefined>(null);
  const [dailyProgressLoading, setDailyProgressLoading] = useState(false);

  // Random photos from internet (like Ceesin)
  const [photoTasks, setPhotoTasks] = useState<PhotoTask[]>([]);

  // Initialize photo tasks from database
  useEffect(() => {
    const randomPhotos = getUnusedRandomPhotos(50); // Show 50 unused images
    
    // Calculate earnings per task based on VIP level
    const getDailyEarnings = (vipLevel?: string) => {
      switch (vipLevel) {
        case 'VIP1': return 30;
        case 'VIP2': return 100;
        case 'VIP3': return 370;
        default: return 0;
      }
    };

    const getDailyTaskLimit = (vipLevel?: string) => {
      switch (vipLevel) {
        case 'VIP1': return 5;
        case 'VIP2': return 10;
        case 'VIP3': return 20;
        default: return 0;
      }
    };

    const tasks = randomPhotos.map((photo: any, index: number) => ({
      id: (index + 1).toString(),
      imageUrl: photo.imageUrl,
      title: photo.title,
      description: `View this ${photo.category.toLowerCase()} photo for 15 seconds to earn ₹${user?.vipLevel ? (getDailyEarnings(user.vipLevel) / getDailyTaskLimit(user.vipLevel)).toFixed(2) : '0'} per photo`,
      reward: user?.vipLevel ? (getDailyEarnings(user.vipLevel) / getDailyTaskLimit(user.vipLevel)) : 0,
      completed: false
    }));
    setPhotoTasks(tasks);
  }, [user?.vipLevel]);

  // Fetch user's completed tasks from database
  const fetchUserTasks = async () => {
    try {
      const response = await fetch('/api/tasks/user-tasks');
      if (response.ok) {
        const data = await response.json();
        // Update photoTasks with completion status from database
        setPhotoTasks(prevTasks => 
          prevTasks.map(task => ({
            ...task,
            completed: data.completedTasks.some((completedTask: any) => 
              completedTask.taskId === task.id
            )
          }))
        );
      }
    } catch (error) {
      console.error('Failed to fetch user tasks:', error);
    }
  };

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
        setRealTimeBalance(data.balance);
        console.log('Real-time balance updated:', data.balance);
      }
    } catch (error) {
      console.error('Failed to fetch real-time balance:', error);
    }
  };

  // Fetch daily progress with proper async handling
  const fetchDailyProgress = async () => {
    if (dailyProgressLoading) return; // Prevent multiple simultaneous requests
    
    setDailyProgressLoading(true);
    try {
      console.log('Fetching daily progress...');
      const response = await fetch('/api/tasks/daily-progress', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Daily progress data received:', data);
        
        if (data.hasVip) {
          setDailyProgress(data.dailyProgress);
          console.log('Daily progress updated:', data.dailyProgress);
        } else {
          console.log('User does not have VIP access');
          setDailyProgress(null);
        }
      } else {
        console.error('Failed to fetch daily progress:', response.status);
        setDailyProgress(null);
      }
    } catch (error) {
      console.error('Failed to fetch daily progress:', error);
      setDailyProgress(null);
    } finally {
      setDailyProgressLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchUserData();
      await fetchUserTasks();
      await fetchDailyProgress();
      await fetchRealTimeBalance();
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      completeTask();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const startTask = (task: PhotoTask) => {
    setCurrentTask(task);
    setTimeLeft(15);
    setIsActive(true);
    setMessage('');
    setError('');
  };



  const completeTask = async () => {
    if (!currentTask) return;

    setIsActive(false);
    
    try {
      // Update task completion in local state
      setPhotoTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === currentTask.id ? { ...task, completed: true } : task
        )
      );
      
      // Call API to update user earnings
      const response = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taskId: currentTask.id, 
          title: currentTask.title
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`Task completed! You earned ₹${data.reward.toFixed(2)}!`);
        
        // Refresh real-time balance from database (NO MEMORY STORAGE)
        await fetchRealTimeBalance();
        
        // Refresh user tasks and daily progress to show updated completion status
        await Promise.all([
          fetchUserTasks(),
          fetchDailyProgress()
        ]);
      } else {
        const errorData = await response.json();
        if (errorData.alreadyCompleted) {
          setMessage(`You already completed this task and earned ₹${errorData.existingReward}!`);
        } else {
          throw new Error(errorData.error || 'Failed to complete task');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete task');
    }

    // Reset current task after a delay
    setTimeout(() => {
      setCurrentTask(null);
      setTimeLeft(15);
    }, 3000);
  };



  if (loading) {
    return (
      <div className="tasks-page">
        <div className="tasks-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tasks-page">
      <div className="tasks-container">
        <div className="tasks-header">
          <button onClick={() => router.back()} className="back-btn">
            <ArrowLeft className="icon" />
            Back
          </button>
          <h1>Photo Viewing Tasks</h1>
          <div className="user-earnings">
            <DollarSign className="icon" />
            <span>₹{realTimeBalance?.current || 0}</span>
            {user?.vipLevel && (
              <small className="earnings-per-task">
                ₹{user?.vipLevel ? (() => {
                  const dailyEarnings = user.vipLevel === 'VIP1' ? 30 : user.vipLevel === 'VIP2' ? 100 : 370;
                  const dailyTasks = user.vipLevel === 'VIP1' ? 5 : user.vipLevel === 'VIP2' ? 10 : 20;
                  return (dailyEarnings / dailyTasks).toFixed(2);
                })() : '0'} per task
              </small>
            )}
            {dailyProgressLoading ? (
              <div className="daily-progress">
                <div className="progress-loading">Loading...</div>
              </div>
            ) : dailyProgress ? (
              <div className="daily-progress">
                <div className="progress-bar-mini">
                  <div 
                    className="progress-fill-mini" 
                    style={{ width: `${dailyProgress.percentage}%` }}
                  ></div>
                </div>
                <small className="progress-text-mini">
                  {dailyProgress.completed}/{dailyProgress.limit} tasks today
                </small>
              </div>
            ) : null}
          </div>
        </div>

        {message && (
          <div className="success-message animate-earnings">
            <CheckCircle className="icon" />
            {message}
            <div className="earnings-increase">
              +₹{currentTask?.reward || 0}
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {currentTask ? (
          <div className="current-task">
            <div className="task-header">
              <h2>Task Details</h2>
              <div className="task-timer">
                <Clock className="icon" />
                <span className="timer-display">{timeLeft}s</span>
              </div>
            </div>
            
            <div className="task-progress-indicator">
              <span className="progress-text">Task {photoTasks.filter(task => task.completed).length + 1} of {photoTasks.length}</span>
            </div>
            
            <div className="task-instruction">
              <p>After the countdown ends, you will automatically receive the reward. Early withdrawal will be invalid.</p>
            </div>
            
            <div className="task-image-container">
              <img 
                src={currentTask.imageUrl} 
                alt={currentTask.title}
                className="task-image"
              />
            </div>

            <div className="task-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${((15 - timeLeft) / 15) * 100}%` }}
                ></div>
              </div>
              <p className="progress-text">Viewing progress: {15 - timeLeft}/15 seconds</p>
            </div>
          </div>
        ) : (
          <div className="tasks-grid">
            <h2>All Images</h2>
            <p className="tasks-description">
              View each photo for 15 seconds to complete tasks and earn money. Complete all tasks to maximize your earnings!
            </p>
            
            <div className="tasks-list">
              {photoTasks.map((task) => (
                <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''}`}>
                  <div className="task-image">
                    <img src={task.imageUrl} alt={task.title} />
                    {task.completed && (
                      <div className="completed-badge">
                        <CheckCircle className="icon" />
                        Completed
                      </div>
                    )}
                  </div>
                  <div className="task-info">
                    <div className="task-reward">
                      <DollarSign className="icon" />
                      <span>₹{task.reward}</span>
                    </div>
                    <div className="task-difficulty">
                      <span className="difficulty-badge">15s</span>
                    </div>
                  </div>
                  <button
                    onClick={() => startTask(task)}
                    className="start-task-btn"
                    disabled={task.completed || (dailyProgress ? dailyProgress.completed >= dailyProgress.limit : false)}
                  >
                    {task.completed ? 'Completed' : 
                     (dailyProgress && dailyProgress.completed >= dailyProgress.limit) ? 'Daily Limit Reached' : 'View Rating'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="earnings-info">
          <h3>Task Progress</h3>
          <div className="progress-summary">
            <div className="progress-item">
              <Camera className="icon" />
              <div>
                <h4>Total Tasks</h4>
                <p>{photoTasks.length}</p>
              </div>
            </div>
            <div className="progress-item">
              <CheckCircle className="icon" />
              <div>
                <h4>Completed</h4>
                <p>{photoTasks.filter(task => task.completed).length}</p>
              </div>
            </div>
            <div className="progress-item">
              <DollarSign className="icon" />
              <div>
                <h4>Total Earnings</h4>
                <p className="earnings-counter">₹{photoTasks.filter(task => task.completed).reduce((sum, task) => sum + task.reward, 0)}</p>
              </div>
            </div>
          </div>
          
          {/* Real-time Earnings Display */}
          <div className="live-earnings">
            <div className="live-earnings-header">
              <h4>💰 Live Earnings</h4>
              <span className="pulse-dot"></span>
            </div>
            <div className="live-earnings-amount">
              ₹{realTimeBalance?.current || 0}
            </div>
            <p className="live-earnings-note">Earnings update in real-time as you complete tasks!</p>
          </div>
        </div>
        
        {/* Floating Action Button */}
        <div className="fab">
          <Plus className="icon" />
        </div>
      </div>
    </div>
  );
}
