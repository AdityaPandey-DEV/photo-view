'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowLeft, TrendingUp, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showTransactions, setShowTransactions] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchTransactions();
  }, []);

  // Debug: Log user state changes
  useEffect(() => {
    console.log('Wallet: User state changed to:', user);
  }, [user]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        console.log('Wallet: Received user data:', userData); // Debug log
        console.log('Wallet: Setting user to:', userData.user); // Debug log
        setUser(userData.user); // Fix: Extract user from userData.user
      } else {
        console.log('Wallet: API response not ok:', response.status);
        router.push('/login');
      }
    } catch (error) {
      console.log('Wallet: Error fetching user data:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/wallet/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setWithdrawing(true);

    try {
      const amount = parseFloat(withdrawAmount);
      
      if (isNaN(amount) || amount < 350) {
        throw new Error('Minimum withdrawal amount is ₹350');
      }

      if (amount > user.totalEarnings) {
        throw new Error('Insufficient balance');
      }

      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Withdrawal failed');
      }

      setMessage('Withdrawal request submitted successfully!');
      setWithdrawAmount('');
      
      // Refresh user data
      fetchUserData();
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const calculateWithdrawalDetails = (amount: number) => {
    const gst = amount * 0.10; // 10% GST
    const netAmount = amount - gst;
    return { gst, netAmount };
  };

  if (loading) {
    return (
      <div className="wallet-page">
        <div className="wallet-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="wallet-page">
        <div className="wallet-container">
          <div className="error-container">
            <h2>Authentication Error</h2>
            <p>Unable to load user data. Please try logging in again.</p>
            <button 
              onClick={() => router.push('/login')} 
              className="login-btn"
              style={{ 
                background: '#f59e0b', 
                color: 'white', 
                border: 'none', 
                padding: '12px 24px', 
                borderRadius: '5px', 
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const withdrawalDetails = withdrawAmount ? calculateWithdrawalDetails(parseFloat(withdrawAmount) || 0) : null;

  return (
    <div className="wallet-page">
      <div className="wallet-container">
        <div className="wallet-header">
          <button onClick={() => router.back()} className="back-btn">
            <ArrowLeft className="icon" />
            Back
          </button>
          <h1>My Wallet</h1>
          <button 
            onClick={() => {
              console.log('Wallet: Force refreshing user data...');
              fetchUserData();
            }} 
            className="refresh-btn"
            style={{ 
              background: '#f59e0b', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '5px', 
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            🔄 Refresh
          </button>
        </div>

        <div className="wallet-overview">
          
          <div className="balance-card">
            <div className="balance-icon">
              <Wallet className="icon" />
            </div>
            <div className="balance-info">
              <h2>Total Balance</h2>
              <div className="balance-amount">₹{user?.totalEarnings || 0}</div>
              <p>Available for withdrawal</p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <TrendingUp className="stat-icon" />
              <div className="stat-content">
                <h3>Monthly Returns</h3>
                <p>₹{user?.monthlyReturns || 0}</p>
              </div>
            </div>

            <div className="stat-card">
              <DollarSign className="stat-icon" />
              <div className="stat-content">
                <h3>VIP Level</h3>
                <p className="vip-level">
                  {user?.vipLevel ? `VIP ${user.vipLevel}` : 'No VIP'}
                </p>
                {user?.subscriptionDate && (
                  <small className="subscription-date">
                    Since: {new Date(user.subscriptionDate).toLocaleDateString()}
                  </small>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="withdrawal-section">
          <h2>Withdraw Earnings</h2>
          <div className="withdrawal-info">
            <AlertCircle className="info-icon" />
            <div className="info-content">
              <h4>Withdrawal Rules</h4>
              <ul>
                <li>Minimum withdrawal: <strong>₹350</strong></li>
                <li>GST deduction: <strong>10%</strong></li>
                <li>Processing time: <strong>24-48 hours</strong></li>
              </ul>
            </div>
          </div>

          <form className="withdrawal-form" onSubmit={handleWithdraw}>
            {message && (
              <div className="success-message">
                <CheckCircle className="icon" />
                {message}
              </div>
            )}

            {error && (
              <div className="error-message">
                <AlertCircle className="icon" />
                {error}
              </div>
            )}

            <div className="form-field">
              <label htmlFor="withdrawAmount" className="form-label">
                Withdrawal Amount (₹)
              </label>
              <input
                id="withdrawAmount"
                type="number"
                min="350"
                max={user?.totalEarnings || 0}
                step="1"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="form-input"
                placeholder="Enter amount (min ₹350)"
                required
              />
            </div>

            {withdrawalDetails && (
              <div className="withdrawal-breakdown">
                <h4>Withdrawal Breakdown</h4>
                <div className="breakdown-item">
                  <span>Requested Amount:</span>
                  <span>₹{withdrawAmount}</span>
                </div>
                <div className="breakdown-item">
                  <span>GST (10%):</span>
                  <span>-₹{withdrawalDetails.gst.toFixed(2)}</span>
                </div>
                <div className="breakdown-item total">
                  <span>Net Amount:</span>
                  <span>₹{withdrawalDetails.netAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="withdraw-btn" 
              disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) < 350}
            >
              {withdrawing ? 'Processing...' : 'Request Withdrawal'}
            </button>
          </form>
        </div>

        <div className="transaction-history">
          <div className="transaction-header">
            <h2>Recent Transactions</h2>
            <button 
              className="toggle-transactions-btn"
              onClick={() => setShowTransactions(!showTransactions)}
            >
              {showTransactions ? 'Hide' : 'Show'} Transactions
            </button>
          </div>
          
          {showTransactions ? (
            transactions.length > 0 ? (
              <div className="transactions-list">
                {transactions.map((transaction, index) => (
                  <div key={index} className={`transaction-item ${transaction.type}`}>
                    <div className="transaction-icon">
                      {transaction.type === 'task_completion' && <TrendingUp className="icon" />}
                      {transaction.type === 'withdrawal' && <Wallet className="icon" />}
                      {transaction.type === 'vip_subscription' && <DollarSign className="icon" />}
                    </div>
                    <div className="transaction-details">
                      <h4>{transaction.description}</h4>
                      <p className="transaction-date">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}`}>
                      {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-transactions">
                <p>No transactions yet</p>
                <small>Complete tasks to see your earning history</small>
              </div>
            )
          ) : (
            <div className="no-transactions">
              <p>Click &quot;Show Transactions&quot; to view your history</p>
              <small>Track all your earnings and withdrawals</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
