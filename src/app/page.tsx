'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Camera, 
  TrendingUp, 
  Users, 
  Star, 
  CheckCircle, 
  Instagram,
  Twitter,
  Facebook,
  DollarSign,
  Target,
  Shield,
  Zap
} from 'lucide-react';

export default function Home() {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <main>
      {/* Hero Section */}
      <section className="hero" aria-label="Hero Section">
        <motion.div 
          className="hero-content"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div className="hero-badge" variants={fadeInUp}>
            <span>🔥 LIMITED TIME OFFER</span>
          </motion.div>
          
          <motion.h1 variants={fadeInUp}>
            VIP Photography{' '}
            <span className="accent">Investment Platform</span>
          </motion.h1>
          
          <motion.p variants={fadeInUp}>
            <strong>50% DISCOUNT</strong> on Global VIP Photography Memberships! 
            Same monthly returns, half the investment. Join thousands of successful photographers.
          </motion.p>
          
          <motion.div className="hero-stats" variants={fadeInUp} role="region" aria-label="Platform Statistics">
            <div className="stat-item" itemScope itemType="https://schema.org/QuantitativeValue">
              <div className="stat-number" itemProp="value">₹2.5Cr+</div>
              <div className="stat-label" itemProp="name">Total Payouts</div>
            </div>
            <div className="stat-item" itemScope itemType="https://schema.org/QuantitativeValue">
              <div className="stat-number" itemProp="value">15,000+</div>
              <div className="stat-label" itemProp="name">Active Members</div>
            </div>
            <div className="stat-item" itemScope itemType="https://schema.org/QuantitativeValue">
              <div className="stat-number" itemProp="value">99.8%</div>
              <div className="stat-label" itemProp="name">Success Rate</div>
            </div>
          </motion.div>
          
          <motion.div className="hero-buttons" variants={fadeInUp}>
            <Link href="/register" className="btn-primary">
              Start Earning Today
            </Link>
            <Link href="/login" className="btn-secondary">
              Member Login
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="section section-gray">
        <div className="container-custom">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>How Our VIP Platform Works</h2>
            <p>Simple, transparent, and profitable investment model for photographers</p>
          </motion.div>

          <motion.div 
            className="how-it-works"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Choose Your VIP Level</h3>
                <p>Select from VIP 1 (₹900), VIP 2 (₹3,000), or VIP 3 (₹11,000) monthly plans</p>
              </div>
            </div>
            
            <div className="step-arrow">→</div>
            
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>We Invest Globally</h3>
                <p>We invest double your amount in the global photography platform on your behalf</p>
              </div>
            </div>
            
            <div className="step-arrow">→</div>
            
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Earn Daily & Monthly</h3>
                <p>Receive daily commissions and guaranteed monthly returns matching your investment</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* VIP Benefits Section */}
      <section className="section">
        <div className="container-custom">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Exclusive VIP Benefits</h2>
            <p>Unlock premium photography opportunities with guaranteed returns</p>
          </motion.div>

          <motion.div 
            className="grid-3"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                icon: <DollarSign className="card-icon" />,
                title: "Daily Commission Income",
                description: "Earn daily commissions: VIP 1: ₹30, VIP 2: ₹100, VIP 3: ₹370. Complete simple photography tasks and get paid instantly.",
                highlight: "Instant Daily Payouts"
              },
              {
                icon: <Target className="card-icon" />,
                title: "Guaranteed Monthly Returns",
                description: "100% guaranteed monthly returns: VIP 1: ₹900, VIP 2: ₹3,000, VIP 3: ₹11,200. Your investment is fully secured.",
                highlight: "100% Guaranteed Returns"
              },
              {
                icon: <Users className="card-icon" />,
                title: "Network Commission System",
                description: "Build your photoview network and earn 10% commission on new member invitations. Plus 5% on subordinate task completions.",
                highlight: "Passive Network Income"
              },
              {
                icon: <Shield className="card-icon" />,
                title: "Global Platform Access",
                description: "Access the same global photography benefits at 50% discount through our exclusive partnership. Same features, half the cost.",
                highlight: "Global Benefits, Local Prices"
              },
              {
                icon: <Zap className="card-icon" />,
                title: "Instant Withdrawal System",
                description: "Withdraw your earnings anytime with our instant payout system. No waiting periods, no hidden fees, complete transparency.",
                highlight: "Instant Withdrawals"
              },
              {
                icon: <TrendingUp className="card-icon" />,
                title: "Compound Growth Potential",
                description: "Reinvest your monthly returns to compound your earnings. Scale from VIP 1 to VIP 3 and maximize your photography income.",
                highlight: "Compound Your Success"
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                className="card benefit-card"
                variants={fadeInUp}
                whileHover={{ y: -5 }}
              >
                <div className="benefit-header">
                  {benefit.icon}
                  <div className="highlight-badge">{benefit.highlight}</div>
                </div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* VIP Plans Section */}
      <section className="section section-gray">
        <div className="container-custom">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Choose Your VIP Investment Plan</h2>
            <p>Start small, scale big. All plans offer 50% discount with same returns</p>
            
            <div className="business-model-info">
              <div className="info-icon">💼</div>
              <div className="info-content">
                <h3>Business Model Transparency</h3>
                <p>
                  We operate as a <strong>photography investment platform</strong>. When you subscribe, 
                  we invest double your amount in the global photography market, giving you access to 
                  premium benefits at <strong>50% discount</strong>. Your monthly returns remain identical 
                  to the global platform - this is our <strong>exclusive Indian partnership offer</strong>.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="grid-3"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                name: "VIP 1",
                subtitle: "Starter Investment",
                price: "₹900",
                period: "/month",
                originalPrice: "₹1,800",
                dailyReturn: "₹30",
                monthlyReturn: "₹900",
                yearlyReturn: "₹10,950",
                features: [
                  "Daily: 5 tasks, ₹30 commission",
                  "Monthly: 150 tasks, ₹900 return",
                  "Yearly: 1,825 tasks, ₹10,950 return",
                  "10% invitation commission",
                  "5% subordinate task commission",
                  "Basic support & guidance"
                ],
                popular: false,
                badge: "50% OFF",
                roi: "100% Monthly ROI"
              },
              {
                name: "VIP 2",
                subtitle: "Professional Investment",
                price: "₹3,000",
                period: "/month",
                originalPrice: "₹6,000",
                dailyReturn: "₹100",
                monthlyReturn: "₹3,000",
                yearlyReturn: "₹36,500",
                features: [
                  "Daily: 10 tasks, ₹100 commission",
                  "Monthly: 300 tasks, ₹3,000 return",
                  "Yearly: 3,650 tasks, ₹36,500 return",
                  "10% invitation commission",
                  "5% subordinate task commission",
                  "Priority support & mentoring"
                ],
                popular: true,
                badge: "50% OFF",
                roi: "100% Monthly ROI"
              },
              {
                name: "VIP 3",
                subtitle: "Premium Investment",
                price: "₹11,000",
                period: "/month",
                originalPrice: "₹22,000",
                dailyReturn: "₹370",
                monthlyReturn: "₹11,000",
                yearlyReturn: "₹1,32,000",
                features: [
                  "Daily: 20 tasks, ₹370 commission",
                  "Monthly: 600 tasks, ₹11,000 return",
                  "Yearly: 7,300 tasks, ₹1,32,000 return",
                  "10% invitation commission",
                  "5% subordinate task commission",
                  "VIP support & exclusive access"
                ],
                popular: false,
                badge: "50% OFF",
                roi: "100% Monthly ROI"
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                className={`card pricing-card ${plan.popular ? 'popular' : ''}`}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
              >
                {plan.popular && (
                  <div className="popular-badge">
                    <span>🔥 MOST POPULAR</span>
                  </div>
                )}
                
                <div className="discount-badge">
                  <span>{plan.badge}</span>
                </div>
                
                <div className="plan-header">
                  <h3 className="plan-name">{plan.name}</h3>
                  <p className="plan-subtitle">{plan.subtitle}</p>
                  <div className="roi-badge">{plan.roi}</div>
                </div>
                
                <div className="pricing-section">
                  <div className="price-display">
                    <div className="current-price">{plan.price}</div>
                    <div className="original-price">{plan.originalPrice}</div>
                    <div className="period">{plan.period}</div>
                  </div>
                  
                  <div className="returns-breakdown">
                    <div className="return-item">
                      <span className="return-label">Daily:</span>
                      <span className="return-value">{plan.dailyReturn}</span>
                    </div>
                    <div className="return-item">
                      <span className="return-label">Monthly:</span>
                      <span className="return-value">{plan.monthlyReturn}</span>
                    </div>
                    <div className="return-item">
                      <span className="return-label">Yearly:</span>
                      <span className="return-value">{plan.yearlyReturn}</span>
                    </div>
                  </div>
                </div>
                
                <ul className="features">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex}>{feature}</li>
                  ))}
                </ul>
                
                <button className="btn-primary btn-invest">
                  Invest in {plan.name}
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="section">
        <div className="container-custom">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Success Stories from Our Members</h2>
            <p>Real photographers who transformed their income with our VIP platform</p>
          </motion.div>

          <motion.div 
            className="grid-2"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                quote: "Started with VIP 1 at ₹900/month, now earning ₹3,000 monthly returns. Upgraded to VIP 2 and my photoview business is thriving!",
                author: "Rajesh K.",
                role: "Portrait Photographer",
                earnings: "₹3,000/month",
                upgrade: "VIP 1 → VIP 2"
              },
              {
                quote: "The VIP 3 plan changed everything. ₹11,000 investment gives me ₹11,000 monthly returns. Best decision for my photoview career!",
                author: "Priya M.",
                role: "Wedding Photographer",
                earnings: "₹11,000/month",
                upgrade: "VIP 3 Member"
              }
            ].map((story, index) => (
              <motion.div
                key={index}
                className="card success-story"
                variants={fadeInUp}
              >
                <div className="story-header">
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="star">★</span>
                    ))}
                  </div>
                  <div className="earnings-badge">{story.earnings}</div>
                </div>
                
                <blockquote className="quote">
                  &quot;{story.quote}&quot;
                </blockquote>
                
                <div className="story-footer">
                  <div className="author-info">
                    <div className="author">{story.author}</div>
                    <div className="role">{story.role}</div>
                  </div>
                  <div className="upgrade-info">
                    <span className="upgrade-badge">{story.upgrade}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section section-primary">
        <div className="container-custom">
          <motion.div 
            className="cta-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Ready to Start Your Photography Investment Journey?</h2>
            <p>Join 15,000+ successful photographers earning daily commissions and monthly returns</p>
            <div className="cta-buttons">
              <Link href="/register" className="btn-primary btn-large">
                Start Investing Now
              </Link>
              <Link href="/login" className="btn-secondary btn-large">
                Member Access
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container-custom">
          <div className="footer-grid">
            <div className="footer-section">
              <h3>VIP Photography Platform</h3>
              <p>
                Leading photography investment platform offering 50% discount on global VIP memberships. 
                Same returns, half the investment - exclusive for Indian photographers.
              </p>
              <div className="social-links">
                <a href="#" className="social-link">
                  <Instagram size={24} />
                </a>
                <a href="#" className="social-link">
                  <Twitter size={24} />
                </a>
                <a href="#" className="social-link">
                  <Facebook size={24} />
                </a>
              </div>
            </div>
            
            <div className="footer-section">
              <h3>Quick Links</h3>
              <ul className="footer-links">
                <li><Link href="/">Home</Link></li>
                <li><Link href="/vip-purchase">VIP Plans</Link></li>
                <li><Link href="/#how-it-works">How It Works</Link></li>
                <li><Link href="/#success-stories">Success Stories</Link></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h3>Support</h3>
              <ul className="footer-links">
                <li><Link href="/contact">Contact Us</Link></li>
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/faq">FAQ</Link></li>
                <li><Link href="/support">Support Portal</Link></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h3>Legal & Policies</h3>
              <ul className="footer-links">
                <li><Link href="/terms">Terms & Conditions</Link></li>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/refund">Refund Policy</Link></li>
                <li><Link href="/shipping">Shipping Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2024 VIP Photography Platform. All rights reserved. | Investment Platform</p>
          </div>
        </div>
      </footer>
    </main>
  );
}