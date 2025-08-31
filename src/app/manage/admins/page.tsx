'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Users, 
  Plus, 
  Trash2, 
  Eye, 
  Edit, 
  LogOut, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Crown,
  UserCheck
} from 'lucide-react';

interface Admin {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface CurrentAdmin {
  id: string;
  username: string;
  name: string;
  role: string;
  permissions: string[];
}

export default function AdminManagementPage() {
  const router = useRouter();
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'admin',
    permissions: ['manage_users', 'view_analytics']
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkAuth();
    fetchAdmins();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth');
      if (response.ok) {
        const data = await response.json();
        setCurrentAdmin(data.admin);
        
        // Check if admin has permission to manage admins
        if (!data.admin.permissions.includes('manage_admins')) {
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

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/admin/list');
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createFormData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Admin created successfully!');
        setCreateFormData({
          username: '',
          password: '',
          name: '',
          email: '',
          role: 'admin',
          permissions: ['manage_users', 'view_analytics']
        });
        setShowCreateForm(false);
        fetchAdmins(); // Refresh the list
      } else {
        setError(data.error || 'Failed to create admin');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!confirm(`Are you sure you want to delete admin "${adminName}"?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Admin deleted successfully!');
        fetchAdmins(); // Refresh the list
      } else {
        setError(data.error || 'Failed to delete admin');
      }
    } catch (error) {
      setError('Network error. Please try again.');
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

  const permissionLabels: { [key: string]: string } = {
    'manage_users': 'Manage Users',
    'manage_vips': 'Manage VIPs',
    'manage_admins': 'Manage Admins',
    'view_analytics': 'View Analytics',
    'manage_payments': 'Manage Payments'
  };

  if (loading) {
    return (
      <div className="manage-dashboard">
        <div className="dashboard-container">
          <div className="loading">Loading admin management...</div>
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
            <h1>Admin Management</h1>
            <p>Manage system administrators</p>
          </div>
          <div className="header-right">
            <div className="admin-info">
              <Shield className="icon" />
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

        {/* Create Admin Section */}
        <section className="admin-create-section">
          <div className="section-header">
            <h2>Create New Admin</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="create-admin-btn"
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
              <Plus size={20} />
              {showCreateForm ? 'Cancel' : 'Create Admin'}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateAdmin} className="create-admin-form">
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    value={createFormData.username}
                    onChange={(e) => setCreateFormData({...createFormData, username: e.target.value})}
                    className="form-input"
                    placeholder="Enter username"
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})}
                    className="form-input"
                    placeholder="Enter password (min 6 chars)"
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})}
                    className="form-input"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                    className="form-input"
                    placeholder="Enter email (optional)"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Role</label>
                  <select
                    value={createFormData.role}
                    onChange={(e) => setCreateFormData({...createFormData, role: e.target.value})}
                    className="form-input"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Permissions</label>
                  <div className="permissions-grid">
                    {Object.entries(permissionLabels).map(([key, label]) => (
                      <label key={key} className="permission-checkbox">
                        <input
                          type="checkbox"
                          checked={createFormData.permissions.includes(key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateFormData({
                                ...createFormData,
                                permissions: [...createFormData.permissions, key]
                              });
                            } else {
                              setCreateFormData({
                                ...createFormData,
                                permissions: createFormData.permissions.filter(p => p !== key)
                              });
                            }
                          }}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="submit-btn"
                disabled={createLoading}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.3s ease',
                  marginTop: '1rem'
                }}
              >
                {createLoading ? 'Creating...' : 'Create Admin'}
              </button>
            </form>
          )}
        </section>

        {/* Admins List */}
        <section className="admins-section">
          <div className="section-header">
            <h2>System Administrators</h2>
            <p>Total: {admins.length} admin(s)</p>
          </div>

          <div className="admins-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Permissions</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {admin.role === 'super_admin' ? (
                          <Crown size={16} style={{ color: '#f59e0b' }} />
                        ) : (
                          <Shield size={16} style={{ color: '#3b82f6' }} />
                        )}
                        {admin.name}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                      {admin.username}
                    </td>
                    <td>
                      <span className={`role-badge role-${admin.role}`}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td>
                      <div className="permissions-tags">
                        {admin.permissions.map(permission => (
                          <span key={permission} className="permission-tag">
                            {permissionLabels[permission]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${admin.isActive ? 'active' : 'inactive'}`}>
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td>
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view" 
                          title="View Details"
                          onClick={() => alert(`Admin: ${admin.name}\nUsername: ${admin.username}\nRole: ${admin.role}\nPermissions: ${admin.permissions.join(', ')}`)}
                        >
                          <Eye className="icon" />
                        </button>
                        {currentAdmin.role === 'super_admin' && admin.id !== currentAdmin.id && (
                          <button 
                            className="action-btn delete" 
                            title="Delete Admin"
                            onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                          >
                            <Trash2 className="icon" />
                          </button>
                        )}
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
