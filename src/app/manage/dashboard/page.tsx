'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Users, 
  Crown, 
  DollarSign, 
  BarChart3, 
  Settings, 
  LogOut, 
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  TrendingUp
} from 'lucide-react';

interface Admin {
  id: string;
  username: string;
  name: string;
  role: string;
  permissions: string[];
}

interface User {
  _id: string;
  name: string;
  phone: string;
  vipLevel?: string;
  totalEarnings?: number;
  totalEarned?: number;
  totalWithdrawn?: number;
  monthlyReturns?: number;
  subscriptionDate?: string;
  createdAt: string;
}

export default function ManageDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVip, setFilterVip] = useState('all');
  const [stats, setStats] = useState({
    totalUsers: 0,
    vipUsers: 0,
    totalEarnings: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    activeVips: { VIP1: 0, VIP2: 0, VIP3: 0 }
  });

  useEffect(() => {
    checkAuth();
    fetchUsers();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth');
      if (response.ok) {
        const data = await response.json();
        console.log('Auth API response:', data);
        setAdmin(data.admin);
      } else {
        console.log('Auth failed:', response.status);
        router.push('/manage');
      }
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/manage');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        calculateStats(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  // Refresh data every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsers();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const calculateStats = (userList: User[]) => {
    const totalUsers = userList.length;
    const vipUsers = userList.filter(u => u.vipLevel).length;
    const totalEarnings = userList.reduce((sum, u) => sum + (u.totalEarnings || 0), 0);
    const totalEarned = userList.reduce((sum, u) => sum + (u.totalEarned || 0), 0);
    const totalWithdrawn = userList.reduce((sum, u) => sum + (u.totalWithdrawn || 0), 0);
    const activeVips = {
      VIP1: userList.filter(u => u.vipLevel === 'VIP1').length,
      VIP2: userList.filter(u => u.vipLevel === 'VIP2').length,
      VIP3: userList.filter(u => u.vipLevel === 'VIP3').length
    };

    setStats({ totalUsers, vipUsers, totalEarnings, totalEarned, totalWithdrawn, activeVips });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/manage');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm);
    const matchesVip = filterVip === 'all' || user.vipLevel === filterVip;
    return matchesSearch && matchesVip;
  });

  if (loading) {
    return (
      <div className="manage-dashboard">
        <div className="dashboard-container">
          <div className="loading">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="manage-dashboard">
        <div className="dashboard-container">
          <div className="error">Access denied</div>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1>VIP Management Dashboard</h1>
            <p>Welcome back, {admin.name}</p>
          </div>
          <div className="header-right">
            <div className="admin-info">
              <Shield className="icon" />
              <span>{admin.role}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <LogOut className="icon" />
              Logout
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <Users className="stat-icon" />
              <div className="stat-content">
                <h3>Total Users</h3>
                <p className="stat-value">{stats.totalUsers}</p>
              </div>
            </div>

            <div className="stat-card">
              <Crown className="stat-icon" />
              <div className="stat-content">
                <h3>VIP Users</h3>
                <p className="stat-value">{stats.vipUsers}</p>
              </div>
            </div>

            <div className="stat-card">
              <DollarSign className="stat-icon" />
              <div className="stat-content">
                <h3>Total Earnings</h3>
                <p className="stat-value">₹{stats.totalEarnings.toLocaleString()}</p>
              </div>
            </div>

            <div className="stat-card">
              <BarChart3 className="stat-icon" />
              <div className="stat-content">
                <h3>Total Earned</h3>
                <p className="stat-value">₹{stats.totalEarned.toLocaleString()}</p>
              </div>
            </div>

            <div className="stat-card">
              <TrendingUp className="stat-icon" />
              <div className="stat-content">
                <h3>Total Withdrawn</h3>
                <p className="stat-value">₹{stats.totalWithdrawn.toLocaleString()}</p>
              </div>
            </div>

            <div className="stat-card">
              <BarChart3 className="stat-icon" />
              <div className="stat-content">
                <h3>Active VIPs</h3>
                <div className="vip-breakdown">
                  <span>VIP1: {stats.activeVips.VIP1}</span>
                  <span>VIP2: {stats.activeVips.VIP2}</span>
                  <span>VIP3: {stats.activeVips.VIP3}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

                            {/* Users Management */}
                    <section className="users-section">
                      <div className="section-header">
                        <h2>User Management</h2>
                        <div className="controls">
                          <div className="search-box">
                            <Search className="icon" />
                            <input
                              type="text"
                              placeholder="Search users..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="search-input"
                            />
                          </div>
                          <select
                            value={filterVip}
                            onChange={(e) => setFilterVip(e.target.value)}
                            className="filter-select"
                          >
                            <option value="all">All VIP Levels</option>
                            <option value="VIP1">VIP1</option>
                            <option value="VIP2">VIP2</option>
                            <option value="VIP3">VIP3</option>
                            <option value="">No VIP</option>
                          </select>
                          <div className="admin-action-buttons">
                            {!loading && admin && admin.permissions && admin.permissions.includes('manage_admins') && (
                              <button
                                onClick={() => router.push('/manage/admins')}
                                className="manage-btn manage-admins-btn"
                              >
                                <Shield className="icon" />
                                <span>Admins</span>
                              </button>
                            )}
                            
                            {!loading && admin && admin.permissions && admin.permissions.includes('manage_vips') && (
                              <button
                                onClick={() => router.push('/manage/vips')}
                                className="manage-btn manage-vips-btn"
                              >
                                <Crown className="icon" />
                                <span>VIPs</span>
                              </button>
                            )}
                            
                            {!loading && admin && admin.permissions && admin.permissions.includes('manage_managers') && (
                              <button
                                onClick={() => router.push('/manage/managers')}
                                className="manage-btn manage-managers-btn"
                              >
                                <Users className="icon" />
                                <span>Managers</span>
                              </button>
                              )}
                            
                            {!loading && (!admin || !admin.permissions) && (
                              <div className="permissions-loading">
                                Loading permissions...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>VIP Level</th>
                  <th>Total Earnings</th>
                  <th>Monthly Returns</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.phone}</td>
                    <td>
                      {user.vipLevel ? (
                        <span className={`vip-badge vip-${user.vipLevel.toLowerCase()}`}>
                          {user.vipLevel}
                        </span>
                      ) : (
                        <span className="no-vip">No VIP</span>
                      )}
                    </td>
                    <td>₹{user.totalEarnings || 0}</td>
                    <td>₹{user.monthlyReturns || 0}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn view" title="View Details">
                          <Eye className="icon" />
                        </button>
                        <button className="action-btn edit" title="Edit User">
                          <Edit className="icon" />
                        </button>
                        <button className="action-btn delete" title="Delete User">
                          <Trash2 className="icon" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
