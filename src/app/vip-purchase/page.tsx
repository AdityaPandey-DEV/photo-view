'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Star, Zap, CheckCircle } from 'lucide-react';

export default function VIPPurchasePage() {
  const [selectedPlan, setSelectedPlan] = useState<'VIP1' | 'VIP2' | 'VIP3' | null>(null);
  const router = useRouter();

  const vipPlans = [
    {
      id: 'VIP1',
      name: 'VIP 1',
      subtitle: 'Starter Investment',
      price: 900,
      originalPrice: 1800,
      dailyEarnings: 30,
      monthlyEarnings: 900,
      yearlyEarnings: 10950,
      dailyTasks: 5,
      monthlyTasks: 150,
      yearlyTasks: 1825,
      dailyCommission: 30,
      monthlyReturn: 900,
      yearlyReturn: 10950,
      features: [
        'Access to global photography platform',
        '₹900 monthly returns',
        'Basic portfolio management',
        'Email support'
      ],
      icon: Star,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'VIP2',
      name: 'VIP 2',
      subtitle: 'Professional Investment',
      price: 3000,
      originalPrice: 6000,
      dailyEarnings: 100,
      monthlyEarnings: 3000,
      yearlyEarnings: 36500,
      dailyTasks: 10,
      monthlyTasks: 300,
      yearlyTasks: 3650,
      dailyCommission: 100,
      monthlyReturn: 3000,
      yearlyReturn: 36500,
      features: [
        'Access to global photography platform',
        '₹3,000 monthly returns',
        'Advanced portfolio management',
        'Priority support',
        'Exclusive investment opportunities'
      ],
      icon: Crown,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'VIP3',
      name: 'VIP 3',
      subtitle: 'Premium Investment',
      price: 11000,
      originalPrice: 22000,
      dailyEarnings: 370,
      monthlyEarnings: 11000,
      yearlyEarnings: 132000,
      dailyTasks: 20,
      monthlyTasks: 600,
      yearlyTasks: 7300,
      dailyCommission: 370,
      monthlyReturn: 11000,
      yearlyReturn: 132000,
      features: [
        'Access to global photography platform',
        '₹11,000 monthly returns',
        'Premium portfolio management',
        '24/7 dedicated support',
        'Exclusive investment opportunities',
        'VIP networking events'
      ],
      icon: Zap,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const handlePlanSelect = (planId: 'VIP1' | 'VIP2' | 'VIP3') => {
    setSelectedPlan(planId);
    // Redirect to Razorpay for payment
    router.push(`/payment/${planId}`);
  };

  return (
    <div className="vip-purchase-page">
      <div className="vip-purchase-container">
        <div className="vip-purchase-header">
          <h1>Choose Your VIP Investment Plan</h1>
          <p>Start earning monthly returns with our photography investment platform</p>
        </div>

        <div className="vip-plans-grid">
          {vipPlans.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <div key={plan.id} className="vip-plan-card">
                <div className="plan-header">
                  <IconComponent className="plan-icon" />
                  <h2>{plan.name}</h2>
                  <p className="plan-subtitle">{plan.subtitle}</p>
                  <div className="plan-price">
                    <span className="currency">₹</span>
                    <span className="amount">{plan.price.toLocaleString()}</span>
                    <span className="period">/month</span>
                  </div>
                  <div className="plan-returns">
                    Monthly Returns: ₹{plan.monthlyReturn.toLocaleString()}
                  </div>
                </div>

                <div className="plan-features">
                  <h3>What you get:</h3>
                  <ul>
                    {plan.features.map((feature, index) => (
                      <li key={index}>
                        <CheckCircle className="feature-icon" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handlePlanSelect(plan.id as 'VIP1' | 'VIP2' | 'VIP3')}
                  className="select-plan-btn"
                >
                  Select {plan.name}
                </button>
              </div>
            );
          })}
        </div>

        <div className="vip-purchase-footer">
          <p>All plans include access to our global photography investment platform</p>
          <p>Start earning monthly returns from day one!</p>
        </div>
      </div>
    </div>
  );
}
