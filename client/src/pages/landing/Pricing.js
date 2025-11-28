import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCheck, FaStar, FaShieldAlt, FaHeadset, FaCrown } from 'react-icons/fa';
import { FiArrowRight, FiCheck, FiX } from 'react-icons/fi';
import SEO from '../../components/SEO';
import './LandingPages.css';

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for getting started with Instagram automation',
      features: [
        { text: '5 scheduled posts/month', included: true },
        { text: '3 AI videos/month', included: true },
        { text: '20 AI captions/month', included: true },
        { text: 'Basic hashtag suggestions', included: true },
        { text: '1 Instagram account', included: true },
        { text: 'Basic analytics', included: true },
        { text: 'Email support', included: true },
        { text: 'AI voiceover', included: false },
        { text: 'Premium templates', included: false },
        { text: 'Team access', included: false }
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Pro',
      price: { monthly: 29, yearly: 290 },
      description: 'Best for creators and small businesses',
      features: [
        { text: 'Unlimited scheduling', included: true },
        { text: '50 AI videos/month', included: true },
        { text: 'Unlimited AI captions', included: true },
        { text: 'AI voiceover (50+ voices)', included: true },
        { text: '500+ premium templates', included: true },
        { text: 'Up to 3 Instagram accounts', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'AI hashtag optimizer', included: true },
        { text: 'Priority support', included: true },
        { text: 'Team access', included: false }
      ],
      cta: 'Start 14-Day Free Trial',
      popular: true
    },
    {
      name: 'Business',
      price: { monthly: 79, yearly: 790 },
      description: 'For agencies and marketing teams',
      features: [
        { text: 'Everything in Pro', included: true },
        { text: 'Unlimited AI videos', included: true },
        { text: 'Up to 10 Instagram accounts', included: true },
        { text: 'Team access (5 users)', included: true },
        { text: 'White-label reports', included: true },
        { text: 'Approval workflows', included: true },
        { text: 'API access', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'Priority phone support', included: true }
      ],
      cta: 'Contact Sales',
      popular: false,
      link: '/contact'
    }
  ];

  const faqs = [
    {
      question: 'Can I try Pro features before paying?',
      answer: 'Yes! Every new account gets a 14-day free trial of all Pro features. No credit card required to start. You can downgrade to Free plan anytime or continue with Pro after the trial.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and for Business plans, we also offer invoice billing for annual subscriptions.'
    },
    {
      question: 'Can I switch plans anytime?',
      answer: 'Absolutely! You can upgrade, downgrade, or cancel your plan at any time. If you upgrade, you\'ll be charged the prorated difference. If you downgrade, the new rate applies at your next billing cycle.'
    },
    {
      question: 'Is there a discount for annual billing?',
      answer: 'Yes! Annual billing saves you 17% compared to monthly billing. Pro annual is $290/year ($24.17/month) instead of $348/year. Business annual is $790/year instead of $948/year.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied within the first 30 days, contact us for a full refund - no questions asked.'
    },
    {
      question: 'What happens when I hit my AI video limit?',
      answer: 'You can either wait for your monthly limit to reset, upgrade to a higher plan, or purchase additional video credits. We\'ll notify you when you\'re approaching your limit.'
    },
    {
      question: 'Do you offer discounts for nonprofits or students?',
      answer: 'Yes! We offer 50% off Pro plan for verified nonprofits, educational institutions, and students with valid .edu email. Contact our support to apply for the discount.'
    },
    {
      question: 'Can I manage multiple Instagram accounts?',
      answer: 'Yes! Free plan supports 1 account, Pro supports up to 3 accounts, and Business supports up to 10 accounts. All managed from one dashboard.'
    }
  ];

  const comparison = [
    { feature: 'Scheduled Posts', free: '5/month', pro: 'Unlimited', business: 'Unlimited' },
    { feature: 'AI Videos', free: '3/month', pro: '50/month', business: 'Unlimited' },
    { feature: 'AI Captions', free: '20/month', pro: 'Unlimited', business: 'Unlimited' },
    { feature: 'AI Voiceover', free: '❌', pro: '✓ 50+ voices', business: '✓ 50+ voices' },
    { feature: 'Templates', free: '50 basic', pro: '500+ premium', business: '500+ premium' },
    { feature: 'Instagram Accounts', free: '1', pro: '3', business: '10' },
    { feature: 'Team Members', free: '1', pro: '1', business: '5' },
    { feature: 'Analytics', free: 'Basic', pro: 'Advanced', business: 'Advanced + Reports' },
    { feature: 'Support', free: 'Email', pro: 'Priority', business: 'Dedicated Manager' }
  ];

  return (
    <main className="landing-page pricing-page">
      <SEO 
        title="Pricing | AIInstaMarketing Plans - Free, Pro & Business 2025"
        description="Simple, transparent pricing for AIInstaMarketing. Free plan to get started, Pro for creators ($29/mo), Business for teams ($79/mo). 14-day free trial, no credit card required."
        keywords="AIInstaMarketing pricing, Instagram marketing tool cost, AI Instagram price, social media automation pricing, Instagram scheduler price, best Instagram tool pricing 2025"
        url="/pricing"
        faq={faqs}
      />

      {/* Hero Section */}
      <header className="landing-hero pricing-hero">
        <div className="landing-hero-content">
          <h1>Simple, Transparent Pricing</h1>
          <p className="hero-tagline">Start free. Upgrade when you're ready.</p>
          <p className="hero-description">
            No hidden fees. No surprises. Cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="billing-toggle">
            <span className={billingCycle === 'monthly' ? 'active' : ''}>Monthly</span>
            <button 
              className="toggle-btn"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            >
              <span className={`toggle-indicator ${billingCycle}`}></span>
            </button>
            <span className={billingCycle === 'yearly' ? 'active' : ''}>
              Yearly <span className="save-badge">Save 17%</span>
            </span>
          </div>
        </div>
      </header>

      {/* Pricing Cards */}
      <section className="pricing-cards-section">
        <div className="pricing-cards-grid">
          {plans.map((plan, index) => (
            <div key={index} className={`pricing-card-large ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && (
                <div className="popular-banner">
                  <FaCrown /> Most Popular
                </div>
              )}
              <div className="plan-header">
                <h2>{plan.name}</h2>
                <p className="plan-description">{plan.description}</p>
                <div className="plan-price">
                  <span className="currency">$</span>
                  <span className="amount">{plan.price[billingCycle]}</span>
                  <span className="period">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                {billingCycle === 'yearly' && plan.price.yearly > 0 && (
                  <p className="yearly-note">${Math.round(plan.price.yearly / 12)}/month billed annually</p>
                )}
              </div>
              
              <Link 
                to={plan.link || '/register'} 
                className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'} btn-lg btn-full`}
              >
                {plan.cta} {plan.popular && <FiArrowRight />}
              </Link>

              <ul className="plan-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className={feature.included ? 'included' : 'not-included'}>
                    {feature.included ? <FiCheck className="check" /> : <FiX className="x" />}
                    {feature.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="trust-section">
        <div className="trust-badges">
          <div className="trust-badge">
            <FaShieldAlt />
            <span>30-Day Money-Back Guarantee</span>
          </div>
          <div className="trust-badge">
            <FaStar />
            <span>4.9/5 Rating (2,800+ Reviews)</span>
          </div>
          <div className="trust-badge">
            <FaHeadset />
            <span>24/7 Customer Support</span>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="comparison-table-section">
        <h2>Compare Plans</h2>
        
        <div className="comparison-table-wrapper">
          <table className="comparison-table-full">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Free</th>
                <th className="highlight">Pro</th>
                <th>Business</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, index) => (
                <tr key={index}>
                  <td>{row.feature}</td>
                  <td>{row.free}</td>
                  <td className="highlight">{row.pro}</td>
                  <td>{row.business}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <h2>Pricing FAQ</h2>
        <div className="faq-grid">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta-section">
        <h2>Ready to Grow Your Instagram?</h2>
        <p>Start your 14-day free trial today. No credit card required.</p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Start Free Trial <FiArrowRight />
        </Link>
      </section>
    </main>
  );
};

export default Pricing;
