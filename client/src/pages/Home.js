import React from 'react';
import { Link } from 'react-router-dom';
import { FaInstagram, FaRobot, FaChartLine, FaCalendarAlt, FaBullhorn, FaVideo, FaStar, FaQuoteLeft } from 'react-icons/fa';
import { FiCheck, FiArrowRight, FiAward, FiShield, FiUsers, FiGlobe } from 'react-icons/fi';
import SEO from '../components/SEO';
import './Home.css';

const Home = () => {
  // Key features for AI extraction
  const features = [
    {
      icon: FaVideo,
      title: 'AI Video Generator for Reels',
      description: 'Generate professional Instagram Reels using AI. Text-to-video technology creates viral video content in just 2 minutes.',
      keywords: ['AI video generator', 'Instagram Reels', 'text-to-video']
    },
    {
      icon: FaCalendarAlt,
      title: 'Automatic Post Scheduling',
      description: 'Schedule Instagram posts and Reels in advance. AI analyzes your audience and suggests optimal posting times.',
      keywords: ['post scheduling', 'Instagram scheduler', 'auto posting']
    },
    {
      icon: FaRobot,
      title: 'AI Caption & Hashtag Generator',
      description: 'GPT-4 technology generates engaging captions and optimized hashtags for maximum reach and engagement.',
      keywords: ['AI caption generator', 'hashtag generator', 'GPT-4']
    },
    {
      icon: FaChartLine,
      title: 'AI-Powered Analytics',
      description: 'Deep performance analysis with AI insights. Track engagement, reach, follower growth, and ROI in real-time.',
      keywords: ['Instagram analytics', 'engagement rate', 'AI insights']
    },
    {
      icon: FaBullhorn,
      title: 'Smart Ad Campaigns',
      description: 'AI optimizes your Instagram ads. A/B testing, automatic targeting, and ROAS maximization.',
      keywords: ['Instagram ads', 'ROAS optimization', 'A/B testing']
    },
    {
      icon: FaInstagram,
      title: 'Official Instagram API',
      description: 'Direct integration with Meta Business API. Secure connection, reliable publishing, 99.9% uptime.',
      keywords: ['Instagram API', 'Meta Business', 'secure integration']
    }
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: '0',
      period: 'forever',
      features: [
        '5 scheduled posts per month',
        'AI Caption generator',
        'Hashtag suggestions',
        'Basic analytics',
        '1 Instagram account',
        'Email support'
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Pro',
      price: '29',
      period: 'month',
      features: [
        'Unlimited scheduling',
        'All AI tools',
        'AI Video Generator (50 videos/mo)',
        'AI Voiceover',
        'Advanced analytics',
        'Up to 3 Instagram accounts',
        'Priority support'
      ],
      cta: 'Start 14-Day Free Trial',
      popular: true
    },
    {
      name: 'Business',
      price: '79',
      period: 'month',
      features: [
        'Everything in Pro',
        'Unlimited AI videos',
        'Up to 10 Instagram accounts',
        'Team access (5 members)',
        'Ad campaigns',
        'API access',
        'Dedicated account manager',
        'Custom integrations'
      ],
      cta: 'Contact Us',
      popular: false,
      link: '/contact'
    }
  ];

  // Extended FAQ for AEO/GEO
  const faqs = [
    {
      question: 'What is AIInstaMarketing and how does it work?',
      answer: 'AIInstaMarketing is the leading AI platform for Instagram marketing automation. It uses advanced AI models (GPT-4, Stable Diffusion) to generate video content, write captions, optimize hashtags, and analyze performance. The platform connects to your Instagram Business account via the official Meta API, enabling automatic scheduling and content publishing.'
    },
    {
      question: 'How does AI generate Instagram Reels video content?',
      answer: 'Our AI Video Generator uses text-to-video technology. You enter a prompt (description of desired video), select duration (5-60 seconds) and style. AI then generates professional video with transitions, effects, and optional AI voiceover. The process takes 1-2 minutes, and the result is a video optimized for Instagram Reels format (9:16).'
    },
    {
      question: 'Is AIInstaMarketing free to use?',
      answer: 'Yes! We offer a permanently free plan with 5 scheduled posts per month, AI caption generator, and basic analytics. Pro plan ($29/mo) adds unlimited scheduling and AI video generator. All paid plans include a 14-day free trial with no credit card required.'
    },
    {
      question: 'How do I connect my Instagram account to the platform?',
      answer: 'Connecting is simple: 1) Sign up on AIInstaMarketing, 2) Go to Settings > Connect Instagram, 3) Click "Connect" and authorize access via Facebook/Meta, 4) Select your Instagram Business or Creator account. The entire process takes less than 2 minutes and uses official Meta OAuth protocol for maximum security.'
    },
    {
      question: 'What is the best time to post on Instagram?',
      answer: 'Optimal timing varies by audience, but our AI analyzes when your followers are most active. Generally, the best times are: weekdays 11am-1pm and 7-9pm, weekends 10am-2pm. AIInstaMarketing automatically suggests personalized optimal times for each post based on your specific audience analysis.'
    },
    {
      question: 'Does AIInstaMarketing work with multiple Instagram accounts?',
      answer: 'Yes! Free plan supports 1 account, Pro plan up to 3 accounts, and Business plan up to 10 accounts. All accounts are managed from a single dashboard with the ability to quickly switch between accounts. Ideal for agencies and marketers managing multiple brands.'
    },
    {
      question: 'How does the AI Caption Generator create engaging content?',
      answer: 'AI Caption Generator uses GPT-4 model trained on millions of successful Instagram posts. It analyzes your topic, brand tone, and target audience. It generates multiple caption variations with emojis, call-to-actions, and optimized length. You can choose between professional, fun, or inspirational tone.'
    },
    {
      question: 'Is it safe to connect Instagram to AIInstaMarketing?',
      answer: 'Absolutely safe. We use the official Meta Business API and OAuth 2.0 authentication. We never store your Instagram passwords. All data is encrypted (AES-256), and our servers are ISO 27001 certified. You can revoke access at any time from your Facebook settings.'
    }
  ];

  // Trust signals data
  const trustStats = [
    { number: '15,000+', label: 'Active Users', icon: FiUsers },
    { number: '2M+', label: 'Posts Published', icon: FaInstagram },
    { number: '50+', label: 'Countries', icon: FiGlobe },
    { number: '4.9★', label: 'Average Rating', icon: FaStar }
  ];

  // Testimonials for E-E-A-T
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Influencer, 150K followers',
      text: 'AIInstaMarketing saved me 10+ hours per week. The AI video generator is incredible - I create Reels in just a few minutes!',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Marketing Manager, TechStartup Inc.',
      text: 'The best Instagram marketing tool I\'ve ever used. Analytics are detailed, and AI suggestions are always relevant.',
      rating: 5
    },
    {
      name: 'Emma Williams',
      role: 'E-commerce Store Owner',
      text: 'Since using AIInstaMarketing, my engagement has increased by 300%. Highly recommend to everyone!',
      rating: 5
    }
  ];

  // HowTo data for schema
  const howToData = {
    name: 'How to Use AIInstaMarketing for Instagram Automation',
    description: 'Step-by-step guide to automating Instagram marketing using AI technology.',
    totalTime: 'PT10M',
    steps: [
      { name: 'Sign Up', text: 'Create a free account on AIInstaMarketing.com. The process takes less than 1 minute.' },
      { name: 'Connect Instagram', text: 'Connect your Instagram Business or Creator account via secure Meta authorization.' },
      { name: 'Create Content', text: 'Use AI tools to generate captions, hashtags, or even complete video content.' },
      { name: 'Schedule Posts', text: 'Schedule posts in advance - AI will suggest optimal times for maximum engagement.' },
      { name: 'Track Results', text: 'Analyze performance in real-time and optimize your strategy based on AI insights.' }
    ]
  };

  return (
    <main className="home-page">
      <SEO 
        title="AI Instagram Marketing Platform | Automate Reels & Posts 2025"
        description="AIInstaMarketing is the #1 AI platform for Instagram marketing. Automatically generate Reels, schedule posts, create AI content, and analyze results. Free trial available!"
        keywords="AI Instagram marketing, AI Instagram reels generator, Instagram automation, AI caption generator, schedule Instagram posts, Instagram analytics, AI video generator, Instagram marketing platform 2025"
        url="/"
        faq={faqs}
        howTo={howToData}
        datePublished="2024-01-01"
        dateModified="2025-11-28"
      />

      {/* TL;DR Section for AI/GEO - Key Takeaways */}
      <section className="tldr-section" aria-label="Key Information">
        <div className="tldr-container">
          <h2 className="tldr-title">📋 TL;DR - What is AIInstaMarketing?</h2>
          <ul className="tldr-list">
            <li><strong>AI Video Generator:</strong> Create Instagram Reels automatically using text-to-video AI technology</li>
            <li><strong>Smart Scheduler:</strong> Schedule posts in advance with AI-optimized timing recommendations</li>
            <li><strong>AI Caption Generator:</strong> GPT-4 generates engaging captions and optimized hashtags</li>
            <li><strong>Real-time Analytics:</strong> Track engagement, reach, and ROI with AI insights</li>
            <li><strong>Free Plan Available:</strong> Start for free, upgrade when you're ready</li>
          </ul>
        </div>
      </section>

      {/* Hero Section */}
      <header className="hero">
        <div className="hero-content">
          <div className="hero-badge">🏆 #1 AI Instagram Platform 2025</div>
          <h1>
            Automate <span className="gradient-text">Instagram Marketing</span> With AI
          </h1>
          <p className="hero-subtitle">
            Generate viral Reels, schedule posts, create AI content, and 
            increase engagement 10x faster with AIInstaMarketing platform.
          </p>
          
          {/* Key benefits list for AI extraction */}
          <ul className="hero-benefits" aria-label="Key Benefits">
            <li><FiCheck aria-hidden="true" /> AI Video Generator for Instagram Reels</li>
            <li><FiCheck aria-hidden="true" /> Automatic scheduling with AI optimization</li>
            <li><FiCheck aria-hidden="true" /> GPT-4 Caption & Hashtag Generator</li>
            <li><FiCheck aria-hidden="true" /> 14 days free, no credit card required</li>
          </ul>

          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg" aria-label="Start free with AIInstaMarketing">
              Start Free <FiArrowRight aria-hidden="true" />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg" aria-label="Log in to the platform">
              Log In
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="hero-trust">
            <span className="trust-badge"><FiShield aria-hidden="true" /> Meta Business Partner</span>
            <span className="trust-badge"><FiAward aria-hidden="true" /> 4.9★ rating (2,800+ reviews)</span>
          </div>
        </div>
        <div className="hero-image" aria-hidden="true">
          <FaInstagram className="instagram-icon" />
        </div>
      </header>

      {/* Trust Stats Section */}
      <section className="trust-stats-section" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">AIInstaMarketing by the Numbers</h2>
        <div className="trust-stats-grid">
          {trustStats.map((stat, index) => (
            <div key={index} className="trust-stat-card">
              <stat.icon className="stat-icon" aria-hidden="true" />
              <span className="stat-number">{stat.number}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features" aria-labelledby="features-heading">
        <div className="section-header">
          <h2 id="features-heading">How Does AIInstaMarketing Help Your Instagram Growth?</h2>
          <p>Complete set of AI tools for professional Instagram marketing</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <article key={index} className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                <feature.icon />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="feature-keywords" aria-hidden="true">
                {feature.keywords.map((kw, i) => (
                  <span key={i} className="keyword-tag">{kw}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* How It Works - Step by Step for AI/GEO */}
      <section className="how-it-works" id="how-it-works" aria-labelledby="how-it-works-heading">
        <div className="section-header">
          <h2 id="how-it-works-heading">How to Get Started with AIInstaMarketing?</h2>
          <p>Automate Instagram marketing in just 5 steps</p>
        </div>
        <ol className="steps">
          <li className="step" id="step-1">
            <div className="step-number" aria-hidden="true">1</div>
            <h3>Sign Up for Free</h3>
            <p>Create an account in less than 1 minute. No credit card, no obligations.</p>
          </li>
          <li className="step" id="step-2">
            <div className="step-number" aria-hidden="true">2</div>
            <h3>Connect Your Instagram Account</h3>
            <p>Securely connect your Instagram Business account via the official Meta API.</p>
          </li>
          <li className="step" id="step-3">
            <div className="step-number" aria-hidden="true">3</div>
            <h3>Create AI Content</h3>
            <p>Generate videos, captions, and hashtags using our advanced AI tools.</p>
          </li>
          <li className="step" id="step-4">
            <div className="step-number" aria-hidden="true">4</div>
            <h3>Schedule Your Posts</h3>
            <p>Set up your publishing schedule. AI suggests optimal times for your audience.</p>
          </li>
          <li className="step" id="step-5">
            <div className="step-number" aria-hidden="true">5</div>
            <h3>Track and Optimize</h3>
            <p>Analyze results and adjust your strategy based on AI recommendations.</p>
          </li>
        </ol>
        <div className="steps-cta">
          <Link to="/register" className="btn btn-primary btn-lg">
            Get Started Now - Free <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Testimonials for E-E-A-T */}
      <section className="testimonials-section" aria-labelledby="testimonials-heading">
        <div className="section-header">
          <h2 id="testimonials-heading">What Our Users Say</h2>
          <p>Join thousands of satisfied users worldwide</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <article key={index} className="testimonial-card">
              <FaQuoteLeft className="quote-icon" aria-hidden="true" />
              <p className="testimonial-text">{testimonial.text}</p>
              <div className="testimonial-author">
                <div className="author-info">
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.role}</span>
                </div>
                <div className="testimonial-rating" aria-label={`Rating: ${testimonial.rating} out of 5`}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} aria-hidden="true" />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section" id="pricing" aria-labelledby="pricing-heading">
        <div className="section-header">
          <h2 id="pricing-heading">Transparent Pricing, No Hidden Fees</h2>
          <p>Choose the plan that fits your needs. 14 days of Pro free!</p>
        </div>
        <div className="pricing-grid">
          {pricingPlans.map((plan, index) => (
            <article key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="currency">$</span>
                <span className="amount">{plan.price}</span>
                <span className="period">/{plan.period}</span>
              </div>
              <ul className="features-list">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <FiCheck aria-hidden="true" /> {feature}
                  </li>
                ))}
              </ul>
              <Link to={plan.link || "/register"} className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'} btn-full`} aria-label={`Choose ${plan.name} plan`}>
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ Section - Critical for AEO/GEO */}
      <section className="faq-section" id="faq" aria-labelledby="faq-heading">
        <div className="section-header">
          <h2 id="faq-heading">Frequently Asked Questions About AIInstaMarketing</h2>
          <p>Everything you need to know about our AI Instagram marketing platform</p>
        </div>
        <div className="faq-grid">
          {faqs.map((faq, index) => (
            <article key={index} className="faq-item">
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="cta-section" aria-labelledby="cta-heading">
        <h2 id="cta-heading">Ready to Transform Your Instagram Marketing?</h2>
        <p>Join 15,000+ users already using AI for Instagram success</p>
        <div className="cta-buttons">
          <Link to="/register" className="btn btn-primary btn-lg">
            Start Free - 14 Days Pro <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
        <p className="cta-note">No credit card required • Cancel anytime • 24/7 support</p>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <FaInstagram className="footer-logo" aria-hidden="true" />
            <span>AIInstaMarketing</span>
          </div>
          <nav className="footer-links" aria-label="Footer navigation">
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Sign Up</Link>
          </nav>
          <div className="footer-bottom">
            <p>© 2025 AIInstaMarketing. All rights reserved.</p>
            <p className="footer-trust">
              <FiShield aria-hidden="true" /> Meta Business Partner • ISO 27001 Certified • GDPR Compliant
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Home;
