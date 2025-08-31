'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';

export default function UserWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch('/api/withdrawals/my-requests');
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data.withdrawals);
        setStats(data.stats);
      } else {
        setError('Failed to fetch withdrawal requests');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="icon" />;
      case 'approved': return <CheckCircle className="icon" />;
      case 'rejected': return <XCircle className="icon" />;
      case 'paid': return <DollarSign className="icon" />;
      default: return <Clock className="icon" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'paid': return 'status-paid';
      default: return 'status-pending';
    }
  };

  if (loading) {
    return <div className="loading">Loading withdrawal requests...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="user-withdrawals">
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Requests</h4>
          <p>{stats.total || 0}</p>
        </div>
        <div className="stat-card">
          <h4>Pending</h4>
          <p>{stats.pending || 0}</p>
        </div>
        <div className="stat-card">
          <h4>Approved</h4>
          <p>{stats.approved || 0}</p>
        </div>
        <div className="stat-card">
          <h4>Paid</h4>
          <p>{stats.paid || 0}</p>
        </div>
      </div>

      {/* Withdrawals List */}
      <div className="withdrawals-list">
        <h3>My Withdrawal Requests</h3>
        
        {withdrawals.length === 0 ? (
          <div className="no-withdrawals">
            <p>No withdrawal requests yet</p>
            <small>Submit a withdrawal request to get started</small>
          </div>
        ) : (
          withdrawals.map((withdrawal) => (
            <div key={withdrawal._id} className="withdrawal-card">
              <div className="withdrawal-header">
                <div className="amount">₹{withdrawal.amount}</div>
                <div className={`status ${getStatusColor(withdrawal.status)}`}>
                  {getStatusIcon(withdrawal.status)}
                  {withdrawal.status}
                </div>
              </div>
              
              <div className="withdrawal-details">
                <div className="detail-row">
                  <span>Payment Method:</span>
                  <span>{withdrawal.paymentMethod}</span>
                </div>
                
                {withdrawal.paymentMethod === 'UPI' && (
                  <div className="detail-row">
                    <span>UPI ID:</span>
                    <span>{withdrawal.paymentDetails.upiId}</span>
                  </div>
                )}
                
                {withdrawal.paymentMethod === 'BANK' && (
                  <>
                    <div className="detail-row">
                      <span>Account:</span>
                      <span>{withdrawal.paymentDetails.accountHolderName}</span>
                    </div>
                    <div className="detail-row">
                      <span>Bank:</span>
                      <span>{withdrawal.paymentDetails.bankName}</span>
                    </div>
                  </>
                )}
                
                <div className="detail-row">
                  <span>Submitted:</span>
                  <span>{new Date(withdrawal.submittedAt).toLocaleDateString()}</span>
                </div>
                
                {withdrawal.processedAt && (
                  <div className="detail-row">
                    <span>Processed:</span>
                    <span>{new Date(withdrawal.processedAt).toLocaleDateString()}</span>
                  </div>
                )}
                
                {withdrawal.managerNotes && (
                  <div className="detail-row">
                    <span>Manager Notes:</span>
                    <span>{withdrawal.managerNotes}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
