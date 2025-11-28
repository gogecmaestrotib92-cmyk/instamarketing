import React from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaChartBar, FaBolt, FaMagic } from 'react-icons/fa';
import { FiArrowRight, FiCheck, FiCalendar, FiClock, FiTarget } from 'react-icons/fi';
import SEO from '../../components/SEO';
import './LandingPages.css';

const InstagramContentScheduler = () => {
  const features = [
    {
      icon: FiCalendar,
      title: 'Visual Calendar',
      description: 'Drag-and-drop calendar interface. See your entire content plan at a glance. Plan weeks ahead.'
    },
    {
      icon: FiClock,
      title: 'AI Optimal Timing',
      description: 'AI analyzes when your audience is most active and suggests the best posting times for maximum engagement.'
    },
    {
      icon: FaMagic,
      title: 'Auto Publishing',
      description: 'Set it and forget it. Posts and Reels publish automatically at scheduled times - no manual intervention.'
    },
    {
      icon: FaChartBar,
      title: 'Performance Tracking',
      description: 'Track how scheduled posts perform. AI learns from results to improve future timing suggestions.'
    },
    {
      icon: FaBolt,
      title: 'Bulk Scheduling',
      description: 'Upload and schedule multiple posts at once. Perfect for batch content creation workflows.'
    },
    {
      icon: FiTarget,
      title: 'Queue System',
      description: 'Create time slots and add posts to queue. AI fills gaps to maintain consistent posting.'
    }
  ];

  const faqs = [
    {
      question: 'What is an Instagram Content Scheduler?',
      answer: 'An Instagram Content Scheduler is a tool that allows you to plan and schedule Instagram posts, Reels, and Stories in advance. Instead of manually posting content at specific times, you upload and schedule everything ahead of time. The scheduler automatically publishes your content at the designated times. AIInstaMarketing\'s scheduler includes AI-powered optimal timing suggestions.'
    },
    {
      question: 'Can I schedule Instagram Reels in advance?',
      answer: 'Yes! AIInstaMarketing supports scheduling both Feed posts and Reels. You can schedule Reels days or weeks in advance. The scheduler uses official Instagram API for reliable, on-time publishing. Story scheduling is coming soon pending Instagram API support.'
    },
    {
      question: 'What\'s the best time to post on Instagram?',
      answer: 'Best times vary by audience, but general high-engagement windows are: Weekdays 11am-1pm (lunch break scrolling), Evenings 7-9pm (wind-down time), Weekends 10am-2pm (leisure browsing). However, AIInstaMarketing\'s AI analyzes YOUR specific audience and suggests personalized optimal times.'
    },
    {
      question: 'How many posts can I schedule?',
      answer: 'Free plan allows 5 scheduled posts at a time. Pro plan ($29/month) offers unlimited scheduling for up to 3 Instagram accounts. Business plan ($79/month) supports 10 accounts with unlimited scheduling and team access.'
    },
    {
      question: 'Does auto-posting affect Instagram reach?',
      answer: 'No! AIInstaMarketing uses the official Meta Business API for publishing. Instagram treats API-published posts the same as manual posts. In fact, consistent posting (enabled by scheduling) often IMPROVES reach because Instagram rewards consistency.'
    },
    {
      question: 'Can I schedule carousel posts?',
      answer: 'Absolutely! You can schedule single images, carousels (up to 10 images), and Reels. Upload all carousel images, arrange them in order, add your caption and hashtags, then schedule. Everything publishes together automatically.'
    },
    {
      question: 'What happens if I need to edit a scheduled post?',
      answer: 'You can edit any scheduled post before it publishes. Change caption, swap images, adjust timing, or delete entirely. Our interface makes it easy to manage your entire content queue from one dashboard.'
    },
    {
      question: 'Does the scheduler support multiple accounts?',
      answer: 'Yes! Pro plan supports 3 Instagram accounts, Business plan supports 10 accounts. Manage all accounts from one dashboard with easy account switching. Perfect for social media managers and agencies.'
    }
  ];

  return (
    <main className="landing-page">
      <SEO 
        title="Instagram Content Scheduler | Auto Post & Schedule 2025"
        description="Schedule Instagram posts and Reels in advance. AI suggests optimal posting times. Visual calendar, bulk upload, auto publishing. Manage multiple accounts. Free trial!"
        keywords="Instagram scheduler, schedule Instagram posts, Instagram auto post, content calendar Instagram, best time to post Instagram, Instagram planner, bulk schedule Instagram, Instagram automation tool 2025"
        url="/instagram-content-scheduler"
        faq={faqs}
      />

      {/* Hero Section */}
      <header className="landing-hero">
        <div className="landing-hero-content">
          <div className="hero-badge">📅 AI-Powered Scheduling</div>
          <h1>Instagram Content Scheduler</h1>
          <p className="hero-tagline">Schedule Posts & Reels | Auto Publish at Optimal Times</p>
          <p className="hero-description">
            Plan your Instagram content weeks in advance. AI suggests the best times 
            to post. Automatic publishing keeps you consistent without the daily grind.
          </p>
          
          <ul className="hero-features">
            <li><FiCheck /> Visual calendar planner</li>
            <li><FiCheck /> AI optimal timing</li>
            <li><FiCheck /> Auto publish</li>
            <li><FiCheck /> Multiple accounts</li>
          </ul>

          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              Start Scheduling Free <FiArrowRight />
            </Link>
          </div>

          <div className="hero-trust">
            <span>⭐ 4.9/5 from 2,800+ reviews</span>
            <span>📅 500K+ posts scheduled</span>
          </div>
        </div>
      </header>

      {/* Calendar Preview */}
      <section className="calendar-preview-section">
        <h2>Visual Content Calendar</h2>
        <p className="section-subtitle">See your entire Instagram strategy at a glance</p>
        
        <div className="calendar-preview">
          <div className="calendar-mockup">
            <FaCalendarAlt className="calendar-icon" />
            <p>Drag & Drop Calendar Interface</p>
            <span>Plan • Schedule • Auto-Publish</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <h2>Scheduler Features</h2>
        <p className="section-subtitle">Everything you need for consistent Instagram growth</p>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                <feature.icon />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Best Times Section */}
      <section className="best-times-section">
        <h2>AI Finds Your Best Posting Times</h2>
        <p className="section-subtitle">Personalized timing based on YOUR audience</p>
        
        <div className="times-grid">
          <div className="time-card">
            <FiClock className="time-icon" />
            <h3>Morning</h3>
            <span className="time">7-9 AM</span>
            <p>Early scrollers checking feeds</p>
          </div>
          <div className="time-card best">
            <FiClock className="time-icon" />
            <h3>Lunch</h3>
            <span className="time">11 AM - 1 PM</span>
            <p>Peak engagement window</p>
            <span className="badge">Best Time</span>
          </div>
          <div className="time-card">
            <FiClock className="time-icon" />
            <h3>Evening</h3>
            <span className="time">7-9 PM</span>
            <p>Wind-down scrolling</p>
          </div>
        </div>

        <p className="times-note">
          ⚡ AI analyzes your specific audience to find YOUR optimal times - 
          they may differ from general best practices!
        </p>
      </section>

      {/* Social Proof */}
      <section className="social-proof-section">
        <h2>Trusted by 15,000+ Instagram Creators</h2>
        <div className="stats-row">
          <div className="stat">
            <span className="stat-number">500K+</span>
            <span className="stat-label">Posts Scheduled</span>
          </div>
          <div className="stat">
            <span className="stat-number">40%</span>
            <span className="stat-label">Time Saved</span>
          </div>
          <div className="stat">
            <span className="stat-number">99.9%</span>
            <span className="stat-label">Publish Success</span>
          </div>
          <div className="stat">
            <span className="stat-number">28%</span>
            <span className="stat-label">More Engagement</span>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="pricing-preview-section">
        <h2>Start Scheduling Today</h2>
        <div className="pricing-cards">
          <div className="pricing-card">
            <h3>Free</h3>
            <div className="price">$0<span>/month</span></div>
            <ul>
              <li><FiCheck /> 5 scheduled posts</li>
              <li><FiCheck /> 1 Instagram account</li>
              <li><FiCheck /> Basic calendar</li>
              <li><FiCheck /> Manual timing</li>
            </ul>
            <Link to="/register" className="btn btn-outline">Start Free</Link>
          </div>
          <div className="pricing-card popular">
            <div className="popular-badge">Most Popular</div>
            <h3>Pro</h3>
            <div className="price">$29<span>/month</span></div>
            <ul>
              <li><FiCheck /> Unlimited scheduling</li>
              <li><FiCheck /> 3 Instagram accounts</li>
              <li><FiCheck /> AI optimal timing</li>
              <li><FiCheck /> Bulk upload</li>
              <li><FiCheck /> Analytics</li>
            </ul>
            <Link to="/register" className="btn btn-primary">Start 14-Day Free Trial</Link>
          </div>
          <div className="pricing-card">
            <h3>Business</h3>
            <div className="price">$79<span>/month</span></div>
            <ul>
              <li><FiCheck /> 10 Instagram accounts</li>
              <li><FiCheck /> Team access (5 users)</li>
              <li><FiCheck /> Approval workflows</li>
              <li><FiCheck /> White-label reports</li>
              <li><FiCheck /> Priority support</li>
            </ul>
            <Link to="/contact" className="btn btn-outline">Contact Us</Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <h2>Frequently Asked Questions</h2>
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
        <h2>Stop Posting Manually Every Day</h2>
        <p>Schedule a week of content in 30 minutes</p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Start Scheduling Free <FiArrowRight />
        </Link>
        <p className="cta-note">No credit card required • 14-day Pro trial • Cancel anytime</p>
      </section>
    </main>
  );
};

export default InstagramContentScheduler;
