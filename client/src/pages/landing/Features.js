import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaVideo, FaRobot, FaCalendarAlt, FaChartLine, FaBullhorn, FaInstagram,
  FaMagic, FaHashtag, FaMicrophone, FaImage, FaPalette, FaCogs,
  FaCheck
} from 'react-icons/fa';
import { FiArrowRight, FiCheck, FiLayers, FiTarget } from 'react-icons/fi';
import SEO from '../../components/SEO';
import './LandingPages.css';

const Features = () => {
  const mainFeatures = [
    {
      icon: FaVideo,
      title: 'AI Video Generator',
      description: 'Generate professional Instagram Reels automatically. Text-to-video AI creates viral content in 2 minutes.',
      highlights: ['Text-to-video AI', 'Auto captions', 'Trending templates', '50+ voices'],
      link: '/ai-instagram-video-generator'
    },
    {
      icon: FaMagic,
      title: 'AI Caption Generator',
      description: 'GPT-4 powered captions that engage. Multiple tones, emoji optimization, and perfect hooks.',
      highlights: ['GPT-4 powered', 'Multiple tones', 'Emoji optimization', 'CTA suggestions'],
      link: '/ai-caption-generator'
    },
    {
      icon: FaCalendarAlt,
      title: 'Content Scheduler',
      description: 'Schedule posts and Reels in advance. AI suggests optimal posting times for maximum reach.',
      highlights: ['Visual calendar', 'AI timing', 'Bulk upload', 'Auto publish'],
      link: '/instagram-content-scheduler'
    },
    {
      icon: FaHashtag,
      title: 'Hashtag Generator',
      description: 'AI analyzes your content and suggests optimal hashtag mix for maximum discoverability.',
      highlights: ['Smart suggestions', 'Reach analysis', 'Niche hashtags', 'Trending tags'],
      link: '/register'
    },
    {
      icon: FaChartLine,
      title: 'Analytics Dashboard',
      description: 'Deep insights into your Instagram performance. Track what works and optimize your strategy.',
      highlights: ['Engagement metrics', 'Growth tracking', 'AI insights', 'Export reports'],
      link: '/register'
    },
    {
      icon: FaMicrophone,
      title: 'AI Voiceover',
      description: 'Add natural-sounding voiceover to your videos. 50+ voices in 30+ languages.',
      highlights: ['50+ voices', '30+ languages', 'Natural sound', 'Custom pacing'],
      link: '/ai-instagram-video-generator'
    }
  ];

  const additionalFeatures = [
    { icon: FiLayers, title: 'Templates Library', description: '500+ viral templates for Reels and posts' },
    { icon: FaPalette, title: 'Brand Kit', description: 'Save colors, fonts, and logos for consistent branding' },
    { icon: FaCogs, title: 'Automation Rules', description: 'Set up auto-posting rules and workflows' },
    { icon: FiTarget, title: 'Audience Insights', description: 'Understand your followers and what they want' },
    { icon: FaBullhorn, title: 'Ad Integration', description: 'Boost posts and manage ad campaigns' },
    { icon: FaImage, title: 'Media Library', description: 'Organize and reuse your content assets' }
  ];

  const faqs = [
    {
      question: 'What features are included in the free plan?',
      answer: 'Free plan includes: 5 scheduled posts per month, AI caption generator (20 captions/month), basic hashtag suggestions, 3 AI videos per month, and basic analytics. Perfect for getting started with Instagram automation.'
    },
    {
      question: 'What\'s included in Pro plan?',
      answer: 'Pro plan ($29/month) includes: Unlimited scheduling, 50 AI videos/month, unlimited AI captions, AI voiceover, advanced hashtag optimization, full analytics, up to 3 Instagram accounts, and priority support.'
    },
    {
      question: 'Do I need technical skills to use these features?',
      answer: 'Not at all! AIInstaMarketing is designed to be user-friendly. All features have intuitive interfaces - describe what you want, and AI does the heavy lifting. No coding, editing, or technical skills required.'
    },
    {
      question: 'Can I use features together?',
      answer: 'Yes! Features work seamlessly together. Generate a video with AI, add AI caption and hashtags, then schedule for optimal time - all in one workflow. Most users combine multiple features for maximum efficiency.'
    }
  ];

  return (
    <main className="landing-page features-page">
      <SEO 
        title="Features | AI Instagram Marketing Tools | AIInstaMarketing 2025"
        description="Explore all AIInstaMarketing features: AI Video Generator, Caption Writer, Hashtag Optimizer, Content Scheduler, Analytics Dashboard, and more. Everything you need for Instagram success."
        keywords="Instagram marketing features, AI Instagram tools, Instagram automation features, content scheduler, AI video generator, caption generator, hashtag generator, Instagram analytics"
        url="/features"
        faq={faqs}
      />

      {/* Hero Section */}
      <header className="landing-hero features-hero">
        <div className="landing-hero-content">
          <div className="hero-badge">🚀 Complete Feature Suite</div>
          <h1>All-in-One Instagram Marketing Platform</h1>
          <p className="hero-tagline">Everything You Need to Grow on Instagram</p>
          <p className="hero-description">
            From AI video generation to smart scheduling - all the tools professional 
            Instagram marketers need, powered by artificial intelligence.
          </p>

          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              Start Free Trial <FiArrowRight />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Features */}
      <section className="main-features-section">
        <h2>Core Features</h2>
        <p className="section-subtitle">Powerful AI tools for every aspect of Instagram marketing</p>
        
        <div className="main-features-grid">
          {mainFeatures.map((feature, index) => (
            <div key={index} className="main-feature-card">
              <div className="feature-header">
                <div className="feature-icon large">
                  <feature.icon />
                </div>
                <h3>{feature.title}</h3>
              </div>
              <p>{feature.description}</p>
              <ul className="feature-highlights">
                {feature.highlights.map((highlight, idx) => (
                  <li key={idx}><FiCheck /> {highlight}</li>
                ))}
              </ul>
              <Link to={feature.link} className="btn btn-outline btn-sm">
                Learn More <FiArrowRight />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Additional Features */}
      <section className="additional-features-section">
        <h2>Plus More Powerful Tools</h2>
        
        <div className="additional-features-grid">
          {additionalFeatures.map((feature, index) => (
            <div key={index} className="additional-feature-card">
              <feature.icon className="feature-icon-small" />
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Section */}
      <section className="comparison-section">
        <h2>Why Choose AIInstaMarketing?</h2>
        
        <div className="comparison-table">
          <div className="comparison-header">
            <div className="comparison-feature">Feature</div>
            <div className="comparison-us">AIInstaMarketing</div>
            <div className="comparison-others">Others</div>
          </div>
          <div className="comparison-row">
            <div className="comparison-feature">AI Video Generator</div>
            <div className="comparison-us"><FaCheck className="check" /> Full text-to-video</div>
            <div className="comparison-others">❌ Limited or none</div>
          </div>
          <div className="comparison-row">
            <div className="comparison-feature">AI Voiceover</div>
            <div className="comparison-us"><FaCheck className="check" /> 50+ voices</div>
            <div className="comparison-others">❌ Not included</div>
          </div>
          <div className="comparison-row">
            <div className="comparison-feature">Caption Generator</div>
            <div className="comparison-us"><FaCheck className="check" /> GPT-4 powered</div>
            <div className="comparison-others">⚠️ Basic AI</div>
          </div>
          <div className="comparison-row">
            <div className="comparison-feature">Scheduling</div>
            <div className="comparison-us"><FaCheck className="check" /> Unlimited</div>
            <div className="comparison-others">⚠️ Limited</div>
          </div>
          <div className="comparison-row">
            <div className="comparison-feature">Free Plan</div>
            <div className="comparison-us"><FaCheck className="check" /> Full access</div>
            <div className="comparison-others">❌ Trial only</div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="workflow-section">
        <h2>One Workflow. All Your Instagram Needs.</h2>
        
        <div className="workflow-steps">
          <div className="workflow-step">
            <div className="workflow-number">1</div>
            <FaRobot className="workflow-icon" />
            <h3>Create</h3>
            <p>AI generates videos, captions, and hashtags</p>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <div className="workflow-number">2</div>
            <FaCalendarAlt className="workflow-icon" />
            <h3>Schedule</h3>
            <p>Plan and queue content for optimal times</p>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <div className="workflow-number">3</div>
            <FaInstagram className="workflow-icon" />
            <h3>Publish</h3>
            <p>Auto-post to Instagram at scheduled times</p>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <div className="workflow-number">4</div>
            <FaChartLine className="workflow-icon" />
            <h3>Analyze</h3>
            <p>Track performance and optimize strategy</p>
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
        <h2>Ready to Transform Your Instagram?</h2>
        <p>Get access to all features with our 14-day free trial</p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Start Free - All Features Included <FiArrowRight />
        </Link>
        <p className="cta-note">No credit card required • Full Pro access • Cancel anytime</p>
      </section>
    </main>
  );
};

export default Features;
