'use client';

import { useState } from 'react';

export default function TestPaymentPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testPayment = async (plan: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionType: plan }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Payment API Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Payment Orders</h2>
          
          <div className="space-y-4">
            <button
              onClick={() => testPayment('VIP1')}
              disabled={loading}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test VIP1 Order (₹900)'}
            </button>
            
            <button
              onClick={() => testPayment('VIP2')}
              disabled={loading}
              className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test VIP2 Order (₹3000)'}
            </button>
            
            <button
              onClick={() => testPayment('VIP3')}
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test VIP3 Order (₹11000)'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            <strong>Success!</strong>
            <pre className="mt-2 text-sm">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
          <div className="space-y-2 text-sm">
            <p><strong>RAZORPAY_KEY_ID:</strong> {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'Not set'}</p>
            <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV || 'Not set'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
