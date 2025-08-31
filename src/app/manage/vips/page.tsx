'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Crown, 
  Users, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Eye, 
  Edit, 
  LogOut, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  UserCheck,
  RefreshCw,
  BarChart3,
  Send,
  Loader
} from 'lucide-react';

interface VIP {
  _id: string;
  name: string;
  phone: string;
  vipLevel: string;
  totalEarnings: number;
  monthlyReturns: number;
  subscriptionDate: string;
  assignedManager?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
}

interface Manager {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  maxVipCapacity: number;
  currentVipCount: number;
  assignedVips: any[];
}

interface CurrentAdmin {
  id: string;
  username: string;
  name: string;
  role: string;
  permissions: string[];
}

export default function VIPManagementPage() {
  const router = useRouter();
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null);
  const [vips, setVips] = useState<VIP[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedVIP, setSelectedVIP] = useState<VIP | null>(null);
  const [messageData, setMessageData] = useState({
    title: '',
    message: '',
    type: 'system_alert'
  });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth');
      if (response.ok) {
        const data = await response.json();
        setCurrentAdmin(data.admin);
        
        // Check if admin has permission to manage VIPs
        if (!data.admin.permissions.includes('manage_vips')) {
          router.push('/manage/dashboard');
        }
      } else {
        router.push('/manage');
      }
    } catch (error) {
      router.push('/manage');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch VIPs
      const vipsResponse = await fetch('/api/admin/users');
      if (vipsResponse.ok) {
        const vipsData = await vipsResponse.json();
        setVips(vipsData.users.filter((user: any) => user.vipLevel));
      }

      // Fetch managers
      const managersResponse = await fetch('/api/admin/managers');
      if (managersResponse.ok) {
        const managersData = await managersResponse.json();
        setManagers(managersData.managers);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleAutoAssignVIPs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/assign-vip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto-assign' }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        fetchData(); // Refresh data
      } else {
        setError(data.error || 'Failed to auto-assign VIPs');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRedistributeVIPs = async () => {
    if (!confirm('This will redistribute all VIPs among managers. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/assign-vip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'redistribute' }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        fetchData(); // Refresh data
      } else {
        setError(data.error || 'Failed to redistribute VIPs');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVIP) return;

    setSendingMessage(true);
    try {
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedVIP._id,
          title: messageData.title,
          message: messageData.message,
          type: messageData.type
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Message sent successfully!');
        setShowMessageModal(false);
        setMessageData({ title: '', message: '', type: 'system_alert' });
        setSelectedVIP(null);
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/manage');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getVIPStats = () => {
    const totalVIPs = vips.length;
    const assignedVIPs = vips.filter(vip => vip.assignedManager).length;
    const unassignedVIPs = totalVIPs - assignedVIPs;
    const totalEarnings = vips.reduce((sum, vip) => sum + (vip.totalEarnings || 0), 0);

    return { totalVIPs, assignedVIPs, unassignedVIPs, totalEarnings };
  };

  const stats = getVIPStats();

  if (loading) {
    return (
      <div className="manage-dashboard">
        <div className="dashboard-container">
          <div className="loading">Loading VIP management...</div>
        </div>
      </div>
    );
  }

  if (!currentAdmin) {
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
            <button 
              onClick={() => router.push('/manage/dashboard')}
              className="back-btn"
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '8px',
                marginRight: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <h1>VIP Management</h1>
            <p>Manage VIP users and manager assignments</p>
          </div>
          <div className="header-right">
            <div className="admin-info">
              <Crown className="icon" />
              <span>{currentAdmin.role}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <LogOut className="icon" />
              Logout
            </button>
          </div>
        </header>

        {/* Success/Error Messages */}
        {success && (
          <div className="success-message">
            <CheckCircle className="icon" />
            {success}
          </div>
        )}
        {error && (
          <div className="error-message">
            <AlertCircle className="icon" />
            {error}
          </div>
        )}

        {/* VIP Stats */}
        <section className="vip-stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <Crown className="stat-icon" />
              <div className="stat-content">
                <h3>Total VIPs</h3>
                <p className="stat-value">{stats.totalVIPs}</p>
              </div>
            </div>

            <div className="stat-card">
              <UserCheck className="stat-icon" />
              <div className="stat-content">
                <h3>Assigned VIPs</h3>
                <p className="stat-value">{stats.assignedVIPs}</p>
              </div>
            </div>

            <div className="stat-card">
              <Users className="stat-icon" />
              <div className="stat-content">
                <h3>Unassigned VIPs</h3>
                <p className="stat-value">{stats.unassignedVIPs}</p>
              </div>
            </div>

            <div className="stat-card">
              <BarChart3 className="stat-icon" />
              <div className="stat-content">
                <h3>Total Earnings</h3>
                <p className="stat-value">₹{stats.totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </section>

        {/* VIP Management Controls */}
        <section className="vip-controls-section">
          <div className="section-header">
            <h2>VIP Assignment Controls</h2>
            <div className="controls">
              <button
                onClick={handleAutoAssignVIPs}
                className="control-btn auto-assign-btn"
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                <RefreshCw className="icon" />
                Auto-Assign VIPs
              </button>

              <button
                onClick={handleRedistributeVIPs}
                className="control-btn redistribute-btn"
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                <BarChart3 className="icon" />
                Redistribute VIPs
              </button>

              <button
                onClick={() => router.push('/manage/managers')}
                className="control-btn manage-managers-btn"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                <Users className="icon" />
                Manage Managers
              </button>
            </div>
          </div>
        </section>

        {/* VIPs List */}
        <section className="vips-section">
          <div className="section-header">
            <h2>VIP Users</h2>
            <p>Total: {vips.length} VIP(s)</p>
          </div>

          <div className="vips-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>VIP Level</th>
                  <th>Total Earnings</th>
                  <th>Monthly Returns</th>
                  <th>Manager</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vips.map((vip) => (
                  <tr key={vip._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Crown size={16} style={{ color: '#f59e0b' }} />
                        {vip.name}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                      {vip.phone}
                    </td>
                    <td>
                      <span className={`vip-badge vip-${vip.vipLevel.toLowerCase()}`}>
                        {vip.vipLevel}
                      </span>
                    </td>
                    <td>₹{vip.totalEarnings || 0}</td>
                    <td>₹{vip.monthlyReturns || 0}</td>
                    <td>
                      {vip.assignedManager ? (
                        <div className="manager-info">
                          <span className="manager-name">{vip.assignedManager.name}</span>
                          <small className="manager-email">{vip.assignedManager.email}</small>
                        </div>
                      ) : (
                        <span className="no-manager">No Manager</span>
                      )}
                    </td>
                    <td>
                      {new Date(vip.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view" 
                          title="View Details"
                          onClick={() => alert(`VIP: ${vip.name}\nPhone: ${vip.phone}\nVIP Level: ${vip.vipLevel}\nTotal Earnings: ₹${vip.totalEarnings || 0}\nMonthly Returns: ₹${vip.monthlyReturns || 0}`)}
                        >
                          <Eye className="icon" />
                        </button>
                        
                        <button 
                          className="action-btn message" 
                          title="Send Message"
                          onClick={() => {
                            setSelectedVIP(vip);
                            setShowMessageModal(true);
                          }}
                        >
                          <MessageSquare className="icon" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Message Modal */}
        {showMessageModal && selectedVIP && (
          <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="modal-content" style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div className="modal-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h3>Send Message to {selectedVIP.name}</h3>
                <button
                  onClick={() => setShowMessageModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSendMessage}>
                <div className="form-field" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Message Title</label>
                  <input
                    type="text"
                    value={messageData.title}
                    onChange={(e) => setMessageData({...messageData, title: e.target.value})}
                    className="form-input"
                    placeholder="Enter message title"
                    required
                  />
                </div>

                <div className="form-field" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Message</label>
                  <textarea
                    value={messageData.message}
                    onChange={(e) => setMessageData({...messageData, message: e.target.value})}
                    className="form-input"
                    placeholder="Enter your message"
                    rows={4}
                    required
                    style={{
                      resize: 'vertical',
                      minHeight: '100px'
                    }}
                  />
                </div>

                <div className="form-field" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Message Type</label>
                  <select
                    value={messageData.type}
                    onChange={(e) => setMessageData({...messageData, type: e.target.value})}
                    className="form-input"
                  >
                    <option value="system_alert">System Alert</option>
                    <option value="vip_status_change">VIP Status Change</option>
                    <option value="withdrawal_processed">Withdrawal Update</option>
                  </select>
                </div>

                <div className="modal-actions" style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowMessageModal(false)}
                    style={{
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={sendingMessage}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {sendingMessage ? (
                      <>
                        <Loader className="icon" style={{ animation: 'spin 1s linear infinite' }} />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="icon" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
