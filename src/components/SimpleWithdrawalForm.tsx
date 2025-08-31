'use client';

import { useState } from 'react';
import { Smartphone, Building2, CheckCircle, AlertCircle } from 'lucide-react';

interface SimpleWithdrawalFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function SimpleWithdrawalForm({ onClose, onSuccess }: SimpleWithdrawalFormProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'BANK'>('UPI');
  const [paymentDetails, setPaymentDetails] = useState({
    upiId: '',
    bankAccount: '',
    ifscCode: '',
    accountHolderName: '',
    bankName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) < 350) {
      setError('Minimum withdrawal amount is ₹350');
      return;
    }

    if (paymentMethod === 'UPI' && !paymentDetails.upiId.trim()) {
      setError('UPI ID is required');
      return;
    }

    if (paymentMethod === 'BANK') {
      if (!paymentDetails.bankAccount || !paymentDetails.ifscCode || 
          !paymentDetails.accountHolderName || !paymentDetails.bankName) {
        setError('All bank details are required');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/withdrawals/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethod,
          paymentDetails: paymentMethod === 'UPI' 
            ? { upiId: paymentDetails.upiId.trim() }
            : {
                bankAccount: paymentDetails.bankAccount.trim(),
                ifscCode: paymentDetails.ifscCode.trim(),
                accountHolderName: paymentDetails.accountHolderName.trim(),
                bankName: paymentDetails.bankName.trim()
              }
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Withdrawal request submitted successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="simple-withdrawal-form">
      <div className="form-header">
        <h3>Submit Withdrawal Request</h3>
        <p>Enter your withdrawal details below</p>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle className="icon" />
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          <CheckCircle className="icon" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="withdrawal-form">
        {/* Amount */}
        <div className="form-group">
          <label htmlFor="amount">Amount (₹)</label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount (min: ₹350)"
            min="350"
            required
            className="form-input"
          />
        </div>

        {/* Payment Method */}
        <div className="form-group">
          <label>Payment Method</label>
          <div className="payment-options">
            <label className="payment-option">
              <input
                type="radio"
                name="paymentMethod"
                value="UPI"
                checked={paymentMethod === 'UPI'}
                onChange={(e) => setPaymentMethod(e.target.value as 'UPI')}
              />
              <div className="option-content">
                <Smartphone className="icon" />
                <span>UPI Transfer</span>
              </div>
            </label>

            <label className="payment-option">
              <input
                type="radio"
                name="paymentMethod"
                value="BANK"
                checked={paymentMethod === 'BANK'}
                onChange={(e) => setPaymentMethod(e.target.value as 'BANK')}
              />
              <div className="option-content">
                <Building2 className="icon" />
                <span>Bank Transfer</span>
              </div>
            </label>
          </div>
        </div>

        {/* Payment Details */}
        <div className="form-group">
          <label>Payment Details</label>
          
          {paymentMethod === 'UPI' && (
            <input
              type="text"
              placeholder="Enter UPI ID (e.g., user@bank)"
              value={paymentDetails.upiId}
              onChange={(e) => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })}
              className="form-input"
              required
            />
          )}

          {paymentMethod === 'BANK' && (
            <div className="bank-fields">
              <input
                type="text"
                placeholder="Account Holder Name"
                value={paymentDetails.accountHolderName}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, accountHolderName: e.target.value })}
                className="form-input"
                required
              />
              <input
                type="text"
                placeholder="Account Number"
                value={paymentDetails.bankAccount}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, bankAccount: e.target.value })}
                className="form-input"
                required
              />
              <input
                type="text"
                placeholder="IFSC Code"
                value={paymentDetails.ifscCode}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, ifscCode: e.target.value })}
                className="form-input"
                required
              />
              <input
                type="text"
                placeholder="Bank Name"
                value={paymentDetails.bankName}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                className="form-input"
                required
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
