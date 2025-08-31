'use client';

import { useState } from 'react';
import { X, CreditCard, CheckCircle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionType: 'VIP1' | 'VIP2' | 'VIP3';
}

interface SubscriptionDetails {
  VIP1: { name: string; price: number; originalPrice: number; returns: number };
  VIP2: { name: string; price: number; originalPrice: number; returns: number };
  VIP3: { name: string; price: number; originalPrice: number; returns: number };
}

const subscriptionDetails: SubscriptionDetails = {
  VIP1: { name: 'VIP 1', price: 900, originalPrice: 900, returns: 900 },
  VIP2: { name: 'VIP 2', price: 3000, originalPrice: 3000, returns: 3000 },
  VIP3: { name: 'VIP 3', price: 11000, originalPrice: 11000, returns: 11000 },
};

export default function PaymentModal({ isOpen, onClose, subscriptionType }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  const details = subscriptionDetails[subscriptionType];

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Create payment order
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionType }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.orderId) {
        throw new Error('Failed to create order');
      }

      setOrderId(orderData.orderId);

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount * 100,
        currency: 'INR',
        name: 'VIP Photography Platform',
        description: orderData.description,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                subscriptionType,
              }),
            });

            const verifyData = await verifyResponse.json();

                                    if (verifyData.success) {
                          setPaymentSuccess(true);
                          // Redirect to home page after successful payment
                          setTimeout(() => {
                            window.location.href = '/home';
                          }, 2000);
                        } else {
                            alert('Payment verification failed');
                        }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed');
          }
        },
        prefill: {
          name: 'User Name',
          email: 'user@example.com',
          contact: '9999999999',
        },
        theme: {
          color: '#f59e0b',
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-modal-header">
          <h2 className="payment-modal-title">Subscribe to {details.name}</h2>
          <button onClick={onClose} className="payment-modal-close">
            <X className="close-icon" />
          </button>
        </div>

        {!paymentSuccess ? (
          <>
            <div className="payment-modal-content">
              <div className="subscription-details">
                <div className="price-section">
                  <div className="original-price">₹{details.originalPrice}</div>
                  <div className="discounted-price">₹{details.price}</div>
                  <div className="discount-badge">Full Investment</div>
                </div>
                
                <div className="benefits">
                  <h3>What you get:</h3>
                  <ul>
                    <li>Access to global photography investment platform</li>
                    <li>Monthly returns of ₹{details.returns}</li>
                    <li>Professional portfolio management</li>
                    <li>24/7 support</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="payment-modal-footer">
              <button
                onClick={handlePayment}
                disabled={loading}
                className="payment-button"
              >
                <CreditCard className="payment-icon" />
                {loading ? 'Processing...' : `Pay ₹${details.price}`}
              </button>
            </div>
          </>
        ) : (
          <div className="payment-success">
            <CheckCircle className="success-icon" />
            <h3>Payment Successful!</h3>
            <p>Welcome to {details.name}!</p>
            <p className="order-id">Order ID: {orderId}</p>
            <button onClick={onClose} className="close-success-btn">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
