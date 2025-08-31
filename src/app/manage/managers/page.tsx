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
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Database
} from 'lucide-react';

interface Manager {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  maxVipCapacity: number;
  currentVipCount: number;
  role: string;
  permissions: string[];
  assignedVips: any[];
  assignedWithdrawals: any[];
  totalWithdrawalsProcessed: number;
  totalAmountProcessed: number;
  pendingWithdrawals: number;
  approvedWithdrawals: number;
  monthlyReturns: number;
  vipCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Withdrawal {
  _id: string;
  userId: {
    _id: string;
    name: string;
    phone: string;
  };
  amount: number;
  status: string;
  paymentMethod: string;
  paymentDetails: any;
  submittedAt: string;
  processedAt?: string;
  managerNotes?: string;
}

export default function ManagersPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Add Manager Modal State
  const [showAddManager, setShowAddManager] = useState(false);
  const [newManager, setNewManager] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'manager',
    maxVipCapacity: 50,
    permissions: ['manage_vips', 'manage_withdrawals', 'view_analytics']
  });
  
  // Edit Manager Modal State
  const [showEditManager, setShowEditManager] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  
  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingManager, setDeletingManager] = useState<Manager | null>(null);
  
  // View Manager Details State
  const [showManagerDetails, setShowManagerDetails] = useState(false);
  const [viewingManager, setViewingManager] = useState<Manager | null>(null);
  
  const [stats, setStats] = useState({
    totalManagers: 0,
    activeManagers: 0,
    totalWithdrawals: 0,
    pendingWithdrawals: 0,
    totalVipsAssigned: 0,
    totalWithdrawalsProcessed: 0,
    totalAmountProcessed: 0,
    totalMonthlyReturns: 0
  });

  useEffect(() => {
    checkAuth();
    fetchManagers();
    fetchWithdrawals();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth');
      if (response.ok) {
        const data = await response.json();
        setAdmin(data.admin);
      } else {
        router.push('/manage');
      }
    } catch (error) {
      router.push('/manage');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await fetch('/api/admin/managers');
      if (response.ok) {
        const data = await response.json();
        setManagers(data.managers);
        calculateStats(data.managers, withdrawals);
        
        if (data.count === 0) {
          console.log('No managers found. Use setup button to create sample managers.');
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch managers:', response.status, errorData);
      }
    } catch (error) {
      console.error('Failed to fetch managers:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      console.log('🔍 Fetching withdrawal requests...');
      const response = await fetch('/api/admin/withdrawals/list');
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Withdrawal data received:', data);
        console.log('📋 Withdrawals count:', data.withdrawals?.length || 0);
        
        setWithdrawals(data.withdrawals || []);
        calculateStats(managers, data.withdrawals || []);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to fetch withdrawal requests:', response.status, errorData);
      }
    } catch (error) {
      console.error('❌ Failed to fetch withdrawal requests:', error);
    }
  };

  const calculateStats = (managerList: Manager[], requestList: Withdrawal[]) => {
    const totalManagers = managerList.length;
    const activeManagers = managerList.filter(m => m.isActive).length;
    const totalWithdrawals = requestList.length;
    const pendingWithdrawals = requestList.filter(r => r.status === 'pending').length;

    // Calculate additional stats from manager data
    const totalVipsAssigned = managerList.reduce((sum, m) => sum + m.currentVipCount, 0);
    const totalWithdrawalsProcessed = managerList.reduce((sum, m) => sum + m.totalWithdrawalsProcessed, 0);
    const totalAmountProcessed = managerList.reduce((sum, m) => sum + m.totalAmountProcessed, 0);
    const totalMonthlyReturns = managerList.reduce((sum, m) => sum + (m.monthlyReturns || 0), 0);

    setStats({ 
      totalManagers, 
      activeManagers, 
      totalWithdrawals, 
      pendingWithdrawals,
      totalVipsAssigned,
      totalWithdrawalsProcessed,
      totalAmountProcessed,
      totalMonthlyReturns
    });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/manage');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Add Manager Function
  const handleAddManager = async () => {
    try {
      const response = await fetch('/api/admin/managers/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newManager)
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setShowAddManager(false);
        setNewManager({
          name: '',
          email: '',
          phone: '',
          role: 'manager',
          maxVipCapacity: 50,
          permissions: ['manage_vips', 'manage_withdrawals', 'view_analytics']
        });
        fetchManagers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add manager');
      }
    } catch (error) {
      console.error('Failed to add manager:', error);
      alert('Failed to add manager');
    }
  };

  // Edit Manager Function
  const handleEditManager = async () => {
    if (!editingManager) return;
    
    try {
      const response = await fetch(`/api/admin/managers/edit/${editingManager._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingManager)
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setShowEditManager(false);
        setEditingManager(null);
        fetchManagers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update manager');
      }
    } catch (error) {
      console.error('Failed to update manager:', error);
      alert('Failed to update manager');
    }
  };

  // Delete Manager Function
  const handleDeleteManager = async () => {
    if (!deletingManager) return;
    
    try {
      const response = await fetch(`/api/admin/managers/delete/${deletingManager._id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setShowDeleteConfirm(false);
        setDeletingManager(null);
        fetchManagers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete manager');
      }
    } catch (error) {
      console.error('Failed to delete manager:', error);
      alert('Failed to delete manager');
    }
  };

  // Toggle Manager Status Function
  const handleToggleStatus = async (managerId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/managers/toggle-status/${managerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchManagers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to toggle status');
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
      alert('Failed to toggle status');
    }
  };

  const handleWithdrawalAction = async (withdrawalId: string, action: string, notes?: string, rejectionReason?: string) => {
    try {
      const response = await fetch('/api/admin/withdrawals/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId, action, notes, rejectionReason })
      });

      if (response.ok) {
        // Refresh withdrawal requests
        fetchWithdrawals();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to process withdrawal action:', error);
      alert('Failed to process action');
    }
  };

      const filteredWithdrawals = withdrawals.filter(request => {
    console.log('🔍 Filtering request:', request);
    const matchesSearch = request.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.userId?.phone?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const result = matchesSearch && matchesStatus;
    console.log('✅ Filter result:', { matchesSearch, matchesStatus, result });
    return result;
  });

  if (loading) {
    return (
      <div className="managers-page">
        <div className="managers-container">
          <div className="loading">Loading managers page...</div>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="managers-page">
        <div className="managers-container">
          <div className="error">Access denied</div>
        </div>
      </div>
    );
  }

  return (
    <div className="managers-page">
      <div className="managers-container">
        {/* Header */}
        <header className="managers-header">
          <div className="header-left">
            <h1>Managers Dashboard</h1>
            <p>Manage withdrawal requests and VIP assignments</p>
          </div>
          <div className="header-right">
            <div className="admin-info">
              <Shield className="icon" />
              <span>{admin.role}</span>
            </div>
            <button 
              onClick={() => {
                fetchManagers();
                fetchWithdrawals();
              }} 
              className="refresh-btn"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
            >
              <CheckCircle className="icon" />
              Refresh Data
            </button>
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
                <h3>Total Managers</h3>
                <p className="stat-value">{stats.totalManagers}</p>
              </div>
            </div>

            <div className="stat-card">
              <CheckCircle className="stat-icon" />
              <div className="stat-content">
                <h3>Active Managers</h3>
                <p className="stat-value">{stats.activeManagers}</p>
              </div>
            </div>

            <div className="stat-card">
              <Crown className="stat-icon" />
              <div className="stat-content">
                <h3>VIPs Assigned</h3>
                <p className="stat-value">{stats.totalVipsAssigned}</p>
              </div>
            </div>

            <div className="stat-card">
              <DollarSign className="stat-icon" />
              <div className="stat-content">
                <h3>Total Withdrawals</h3>
                <p className="stat-value">{stats.totalWithdrawals}</p>
              </div>
            </div>

            <div className="stat-card">
              <Clock className="stat-icon" />
              <div className="stat-content">
                <h3>Pending Reviews</h3>
                <p className="stat-value">{stats.pendingWithdrawals}</p>
              </div>
            </div>

            <div className="stat-card">
              <TrendingUp className="stat-icon" />
              <div className="stat-content">
                <h3>Processed Amount</h3>
                <p className="stat-value">₹{stats.totalAmountProcessed.toLocaleString()}</p>
              </div>
            </div>

            <div className="stat-card">
              <DollarSign className="stat-icon" />
              <div className="stat-content">
                <h3>Total Monthly Returns</h3>
                <p className="stat-value">₹{stats.totalMonthlyReturns.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Managers List */}
        <section className="managers-section">
          <div className="section-header">
            <h2>Manager Management</h2>
            <div className="manager-actions">
                            <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/managers/test');
                    if (response.ok) {
                      const data = await response.json();
                      alert(`Database Status:\nCollections: ${data.collections.join(', ')}\nManagers: ${data.counts.managers}\nUsers: ${data.counts.users}\nWithdrawals: ${data.counts.withdrawals}`);
                    } else {
                      const error = await response.json();
                      alert(`Test failed: ${error.details || 'Unknown error'}`);
                    }
                  } catch (error) {
                    alert('Failed to test database connection');
                  }
                }}
                className="test-db-btn"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600',
                  marginRight: '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                <Database className="icon" />
                Test DB
              </button>
              
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/withdrawals/test');
                    if (response.ok) {
                      const data = await response.json();
                      alert(`Withdrawal Test:\nTotal Withdrawals: ${data.counts.withdrawals}\nUsers: ${data.counts.users}\nManagers: ${data.counts.managers}`);
                      fetchWithdrawals(); // Refresh the list
                    } else {
                      const error = await response.json();
                      alert(`Test failed: ${error.details || 'Unknown error'}`);
                    }
                  } catch (error) {
                    alert('Failed to test withdrawal requests');
                  }
                }}
                className="test-withdrawals-btn"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600',
                  marginRight: '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                <Database className="icon" />
                Test Withdrawals
              </button>
              
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/vip-users');
                    if (response.ok) {
                      const data = await response.json();
                      const stats = data.stats;
                      alert(`VIP Users Status:\n\nTotal Users: ${stats.total}\nVIP Users: ${stats.vip}\nRegular Users: ${stats.regular}\n\nVIP Levels:\nVIP1: ${stats.vipLevels.VIP1}\nVIP2: ${stats.vipLevels.VIP2}\nVIP3: ${stats.vipLevels.VIP3}\nActive: ${stats.vipLevels.active}\nExpired: ${stats.vipLevels.expired}\nNone: ${stats.vipLevels.none}`);
                    } else {
                      const error = await response.json();
                      alert(`Failed to get VIP users: ${error.error || 'Unknown error'}`);
                    }
                  } catch (error) {
                    alert('Failed to get VIP users');
                  }
                }}
                className="check-vip-users-btn"
                style={{
                  background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600',
                  marginRight: '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                <Crown className="icon" />
                Check VIP Users
              </button>
              
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/withdrawals/test', { method: 'POST' });
                    if (response.ok) {
                      const data = await response.json();
                      alert(`Sample Withdrawals Created:\n${data.message}\nCreated: ${data.created} withdrawal requests`);
                      fetchWithdrawals(); // Refresh the list
                    } else {
                      const error = await response.json();
                      alert(error.error || 'Failed to create sample withdrawals');
                    }
                  } catch (error) {
                    alert('Failed to create sample withdrawals');
                  }
                }}
                className="create-sample-withdrawals-btn"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600',
                  marginRight: '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                <Plus className="icon" />
                Create Sample Withdrawals
              </button>
              
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/managers/setup', { method: 'POST' });
                    if (response.ok) {
                      const data = await response.json();
                      alert(data.message);
                      fetchManagers();
                    } else {
                      const error = await response.json();
                      alert(error.message || 'Failed to setup managers');
                    }
                  } catch (error) {
                    alert('Failed to setup managers');
                    }
                }}
                className="setup-managers-btn"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600',
                  marginRight: '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                <Settings className="icon" />
                Setup Sample Managers
              </button>
              <button 
                onClick={() => setShowAddManager(true)}
                className="add-manager-btn"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
              >
                <Plus className="icon" />
                Add Manager
              </button>
            </div>
          </div>

          <div className="managers-table">
            <table>
              <thead>
                                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>VIP Capacity</th>
                    <th>Current VIPs</th>
                    <th>Monthly Returns</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
              </thead>
              <tbody>
                {managers.map((manager) => (
                  <tr key={manager._id}>
                    <td>{manager.name}</td>
                    <td>{manager.email}</td>
                    <td>{manager.phone}</td>
                    <td>
                      <span className={`role-badge role-${manager.role}`}>
                        {manager.role}
                      </span>
                    </td>
                    <td>{manager.maxVipCapacity}</td>
                    <td>
                      <span className={`vip-count ${manager.currentVipCount >= manager.maxVipCapacity * 0.8 ? 'high' : ''}`}>
                        {manager.currentVipCount} / {manager.maxVipCapacity}
                      </span>
                    </td>
                    <td>
                      <span className="monthly-returns">
                        ₹{manager.monthlyReturns ? manager.monthlyReturns.toLocaleString() : '0'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${manager.isActive ? 'active' : 'inactive'}`}>
                        {manager.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn assign" 
                          title="Assign VIP"
                          onClick={async () => {
                            const userId = prompt('Enter User ID to assign VIP:');
                            if (userId) {
                              try {
                                const response = await fetch('/api/admin/managers/assign-vips', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ managerId: manager._id, userId })
                                });
                                
                                if (response.ok) {
                                  const data = await response.json();
                                  alert(data.message);
                                  fetchManagers();
                                } else {
                                  const error = await response.json();
                                  alert(error.error || 'Failed to assign VIP');
                                }
                              } catch (error) {
                                alert('Failed to assign VIP');
                              }
                            }
                          }}
                        >
                          <Crown className="icon" />
                        </button>
                        <button 
                          className="action-btn view" 
                          title="View Details"
                          onClick={() => {
                            setViewingManager(manager);
                            setShowManagerDetails(true);
                          }}
                        >
                          <Eye className="icon" />
                        </button>
                        <button 
                          className="action-btn edit" 
                          title="Edit Manager"
                          onClick={() => {
                            setEditingManager(manager);
                            setShowEditManager(true);
                          }}
                        >
                          <Edit className="icon" />
                        </button>
                        <button 
                          className="action-btn delete" 
                          title="Delete Manager"
                          onClick={() => {
                            setDeletingManager(manager);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="icon" />
                        </button>
                        <button 
                          className="action-btn toggle" 
                          title={manager.isActive ? 'Deactivate' : 'Activate'}
                          onClick={() => handleToggleStatus(manager._id, manager.isActive)}
                          style={{
                            background: manager.isActive ? '#ef4444' : '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {manager.isActive ? <XCircle className="icon" /> : <CheckCircle className="icon" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Withdrawal Requests */}
        <section className="withdrawals-section">
          <div className="section-header">
            <h2>Withdrawal Requests</h2>
            <div className="controls">
              <div className="search-box">
                <Search className="icon" />
                <input
                  type="text"
                  placeholder="Search withdrawals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="debug-info" style={{
              background: '#f0f9ff',
              padding: '1rem',
              margin: '1rem 0',
              borderRadius: '8px',
              fontSize: '0.875rem',
              border: '1px solid #0ea5e9'
            }}>
              <strong>🔍 Withdrawal Debug Info:</strong><br/>
              Total Withdrawal Requests: {withdrawals.length}<br/>
              Search Term: &quot;{searchTerm}&quot;<br/>
              Filter Status: &quot;{filterStatus}&quot;<br/>
              Filtered Results: {filteredWithdrawals.length}<br/>
              Loading: {loading ? 'Yes' : 'No'}
            </div>
          )}

          <div className="withdrawals-table">
            {filteredWithdrawals.length === 0 ? (
              <div className="no-withdrawals" style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: '#6b7280',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>
                  {withdrawals.length === 0 ? 'No Withdrawal Requests Found' : 'No Withdrawals Match Your Search'}
                </h3>
                <p style={{ margin: '0', color: '#9ca3af' }}>
                  {withdrawals.length === 0 
                    ? 'There are no withdrawal requests in the system yet. VIP users need to submit withdrawal requests first.'
                    : 'Try adjusting your search terms or filter criteria.'
                  }
                </p>
                {withdrawals.length === 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/admin/withdrawals/test', { method: 'POST' });
                          if (response.ok) {
                            const data = await response.json();
                            alert(`Sample Withdrawals Created:\n${data.message}\nCreated: ${data.created} withdrawal requests`);
                            fetchWithdrawals(); // Refresh the list
                          } else {
                            const error = await response.json();
                            alert(error.error || 'Failed to create sample withdrawals');
                          }
                        } catch (error) {
                          alert('Failed to create sample withdrawals');
                        }
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Create Sample Withdrawals
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th>Payment Details</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWithdrawals.map((request, index) => {
                    console.log('🔍 Rendering withdrawal row:', { request, index });
                    return (
                      <tr key={request._id || `withdrawal-${index}`}>
                        <td>
                          <div className="user-info">
                            <div className="user-name">{request.userId?.name || 'Unknown'}</div>
                            <div className="user-phone">{request.userId?.phone || 'Unknown'}</div>
                          </div>
                        </td>
                        <td>
                          <div className="amount-info">
                            <div className="amount">₹{request.amount || 0}</div>
                          </div>
                        </td>
                        <td>
                          <span className={`payment-method ${(request.paymentMethod || '').toLowerCase()}`}>
                            {request.paymentMethod || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge status-${request.status || 'unknown'}`}>
                            {request.status || 'unknown'}
                          </span>
                        </td>
                        <td>
                          <span className="payment-details">
                            {request.paymentMethod === 'UPI' ? (
                              <span>UPI: {request.paymentDetails?.upiId || 'N/A'}</span>
                            ) : (
                              <span>Bank: {request.paymentDetails?.bankName || 'N/A'} - {request.paymentDetails?.accountHolderName || 'N/A'}</span>
                            )}
                          </span>
                        </td>
                        <td>{request.submittedAt ? new Date(request.submittedAt).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          <div className="action-buttons">
                            {request.status === 'pending' && (
                              <>
                                <button 
                                  className="action-btn approve" 
                                  title="Approve"
                                  onClick={() => {
                                    console.log('🔍 Approving withdrawal:', request._id);
                                    handleWithdrawalAction(request._id, 'approve');
                                  }}
                                >
                                  <CheckCircle className="icon" />
                                </button>
                                <button 
                                  className="action-btn reject" 
                                  title="Reject"
                                  onClick={() => {
                                    const reason = prompt('Enter rejection reason:');
                                    if (reason) {
                                      console.log('🔍 Rejecting withdrawal:', request._id, reason);
                                      handleWithdrawalAction(request._id, 'reject', undefined, reason);
                                    }
                                  }}
                                >
                                  <XCircle className="icon" />
                                </button>
                              </>
                            )}
                            {request.status === 'approved' && (
                              <button 
                                className="action-btn process" 
                                title="Mark as Paid"
                                onClick={() => {
                                  console.log('🔍 Marking withdrawal as paid:', request._id);
                                  handleWithdrawalAction(request._id, 'mark-paid');
                                }}
                              >
                                <Clock className="icon" />
                              </button>
                            )}
                            <button className="action-btn view" title="View Details">
                              <Eye className="icon" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Add Manager Modal */}
        {showAddManager && (
          <div className="modal-overlay" onClick={() => setShowAddManager(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add New Manager</h3>
                <button className="modal-close" onClick={() => setShowAddManager(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={newManager.name}
                    onChange={(e) => setNewManager({...newManager, name: e.target.value})}
                    placeholder="Enter manager name"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newManager.email}
                    onChange={(e) => setNewManager({...newManager, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={newManager.phone}
                    onChange={(e) => setNewManager({...newManager, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={newManager.role}
                    onChange={(e) => setNewManager({...newManager, role: e.target.value})}
                  >
                    <option value="manager">Manager</option>
                    <option value="senior_manager">Senior Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>VIP Capacity</label>
                  <input
                    type="number"
                    value={newManager.maxVipCapacity}
                    onChange={(e) => setNewManager({...newManager, maxVipCapacity: parseInt(e.target.value)})}
                    min="1"
                    max="200"
                  />
                </div>
                <div className="form-group">
                  <label>Permissions</label>
                  <div className="permissions-grid">
                    {['manage_vips', 'manage_withdrawals', 'view_analytics', 'manage_payments', 'manage_managers'].map(permission => (
                      <label key={permission} className="permission-checkbox">
                        <input
                          type="checkbox"
                          checked={newManager.permissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewManager({
                                ...newManager,
                                permissions: [...newManager.permissions, permission]
                              });
                            } else {
                              setNewManager({
                                ...newManager,
                                permissions: newManager.permissions.filter(p => p !== permission)
                              });
                            }
                          }}
                        />
                        <span>{permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowAddManager(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleAddManager}>Add Manager</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Manager Modal */}
        {showEditManager && editingManager && (
          <div className="modal-overlay" onClick={() => setShowEditManager(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Manager</h3>
                <button className="modal-close" onClick={() => setShowEditManager(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={editingManager.name}
                    onChange={(e) => setEditingManager({...editingManager, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editingManager.email}
                    onChange={(e) => setEditingManager({...editingManager, email: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={editingManager.phone}
                    onChange={(e) => setEditingManager({...editingManager, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={editingManager.role}
                    onChange={(e) => setEditingManager({...editingManager, role: e.target.value})}
                  >
                    <option value="manager">Manager</option>
                    <option value="senior_manager">Senior Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>VIP Capacity</label>
                  <input
                    type="number"
                    value={editingManager.maxVipCapacity}
                    onChange={(e) => setEditingManager({...editingManager, maxVipCapacity: parseInt(e.target.value)})}
                    min="1"
                    max="200"
                  />
                </div>
                <div className="form-group">
                  <label>Permissions</label>
                  <div className="permissions-grid">
                    {['manage_vips', 'manage_withdrawals', 'view_analytics', 'manage_payments', 'manage_managers'].map(permission => (
                      <label key={permission} className="permission-checkbox">
                        <input
                          type="checkbox"
                          checked={editingManager.permissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingManager({
                                ...editingManager,
                                permissions: [...editingManager.permissions, permission]
                              });
                            } else {
                              setEditingManager({
                                ...editingManager,
                                permissions: editingManager.permissions.filter(p => p !== permission)
                              });
                            }
                          }}
                        />
                        <span>{permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowEditManager(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleEditManager}>Update Manager</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && deletingManager && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Delete Manager</h3>
                <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>×</button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete <strong>{deletingManager.name}</strong>?</p>
                <p>This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button className="btn-danger" onClick={handleDeleteManager}>Delete Manager</button>
              </div>
            </div>
          </div>
        )}

        {/* Manager Details Modal */}
        {showManagerDetails && viewingManager && (
          <div className="modal-overlay" onClick={() => setShowManagerDetails(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Manager Details</h3>
                <button className="modal-close" onClick={() => setShowManagerDetails(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-row">
                  <strong>Name:</strong> {viewingManager.name}
                </div>
                <div className="detail-row">
                  <strong>Email:</strong> {viewingManager.email}
                </div>
                <div className="detail-row">
                  <strong>Phone:</strong> {viewingManager.phone}
                </div>
                <div className="detail-row">
                  <strong>Role:</strong> <span className={`role-badge role-${viewingManager.role}`}>{viewingManager.role}</span>
                </div>
                <div className="detail-row">
                  <strong>Status:</strong> <span className={`status-badge ${viewingManager.isActive ? 'active' : 'inactive'}`}>{viewingManager.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="detail-row">
                  <strong>VIP Capacity:</strong> {viewingManager.currentVipCount} / {viewingManager.maxVipCapacity}
                </div>
                <div className="detail-row">
                  <strong>Total Withdrawals Processed:</strong> {viewingManager.totalWithdrawalsProcessed}
                </div>
                <div className="detail-row">
                  <strong>Total Amount Processed:</strong> ₹{viewingManager.totalAmountProcessed.toLocaleString()}
                </div>
                <div className="detail-row">
                  <strong>Monthly Returns:</strong> ₹{viewingManager.monthlyReturns ? viewingManager.monthlyReturns.toLocaleString() : '0'}
                </div>
                <div className="detail-row">
                  <strong>Permissions:</strong>
                  <div className="permissions-tags">
                    {viewingManager.permissions.map(permission => (
                      <span key={permission} className="permission-tag">
                        {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="detail-row">
                  <strong>Created:</strong> {new Date(viewingManager.createdAt).toLocaleDateString()}
                </div>
                <div className="detail-row">
                  <strong>Last Updated:</strong> {new Date(viewingManager.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-primary" onClick={() => setShowManagerDetails(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
