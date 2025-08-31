'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CreditCard, CheckCircle } from 'lucide-react';

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const plan = params.plan as string;
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plan) {
      console.log('Plan parameter received:', plan);
      createOrder();
    } else {
      console.log('Plan parameter is undefined');
      setError('Plan parameter is missing');
      setLoading(false);
    }
  }, [plan]);

  const createOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug logging
      console.log('Creating order for plan:', plan);
      console.log('Plan type:', typeof plan);
      
      if (!plan) {
        throw new Error('Plan parameter is undefined');
      }
      
      const requestBody = { subscriptionType: plan };
      console.log('Request body:', requestBody);
      
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error:', response.status, errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Order created successfully:', data);
      
      if (data.orderId) {
        setOrderData(data);
        initializeRazorpay(data);
      } else {
        throw new Error('Failed to create order - no orderId in response');
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      setError(error.message || 'Failed to create payment order');
      alert(`Failed to create payment order: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const initializeRazorpay = (data: any) => {
                  const options = {
                key: 'rzp_test_RBDl3GLyIo0UiY', // Updated with correct test key
      amount: data.amount * 100,
      currency: 'INR',
      name: 'VIP Photography Platform',
      description: data.description,
      order_id: data.orderId,
      handler: async function (response: any) {
        try {
          console.log('Payment response received:', response);
          console.log('Plan:', plan);
          
          // Verify payment
          const requestData = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            subscriptionType: plan,
          };
          
          console.log('Sending verification request:', requestData);
          
          const verifyResponse = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
          });
          
          console.log('Verification response status:', verifyResponse.status);
          console.log('Verification response headers:', verifyResponse.headers);

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            setPaymentSuccess(true);
            setTimeout(() => {
              router.push('/home');
            }, 3000);
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
  };

  const getPlanDetails = () => {
    switch (plan) {
      case 'VIP1': return { name: 'VIP 1', price: 900, returns: 900 };
      case 'VIP2': return { name: 'VIP 2', price: 3000, returns: 3000 };
      case 'VIP3': return { name: 'VIP 3', price: 11000, returns: 11000 };
      default: return { name: 'Unknown', price: 0, returns: 0 };
    }
  };

  const planDetails = getPlanDetails();

  if (paymentSuccess) {
    return (
      <div className="payment-success-page">
        <div className="success-container">
          <CheckCircle className="success-icon" />
          <h1>Payment Successful!</h1>
          <p>Welcome to {planDetails.name}!</p>
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="payment-header">
            <button onClick={() => router.back()} className="back-btn">
              <ArrowLeft className="icon" />
              Back to Plans
            </button>
            <h1>Payment Error</h1>
          </div>
          <div className="payment-content">
            <div className="error-section">
              <h2>❌ Error Creating Payment</h2>
              <p>{error}</p>
              <button onClick={createOrder} className="retry-btn">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-header">
          <button onClick={() => router.back()} className="back-btn">
            <ArrowLeft className="icon" />
            Back to Plans
          </button>
          <h1>Complete Your {planDetails.name} Subscription</h1>
        </div>

        <div className="payment-content">
          {loading ? (
            <div className="loading-section">
              <div className="loading-spinner"></div>
              <p>Preparing your payment...</p>
              <p className="debug-info">Plan: {plan}</p>
            </div>
          ) : (
            <div className="payment-details">
              <div className="plan-summary">
                <h2>{planDetails.name} Plan</h2>
                <div className="price-display">
                  <span className="amount">₹{planDetails.price.toLocaleString()}</span>
                  <span className="period">/month</span>
                </div>
                <div className="returns-info">
                  <p>Monthly Returns: ₹{planDetails.returns.toLocaleString()}</p>
                </div>
              </div>

              <div className="payment-info">
                <h3>Payment Details</h3>
                <ul>
                  <li>✓ Secure payment via Razorpay</li>
                  <li>✓ Instant subscription activation</li>
                  <li>✓ 24/7 customer support</li>
                  <li>✓ Money-back guarantee</li>
                </ul>
              </div>

              <div className="action-section">
                <button 
                  onClick={() => initializeRazorpay(orderData)}
                  className="pay-now-btn"
                  disabled={!orderData}
                >
                  <CreditCard className="icon" />
                  Pay ₹{planDetails.price.toLocaleString()} Now
                </button>
                <p className="secure-text">🔒 Your payment is secure and encrypted</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
