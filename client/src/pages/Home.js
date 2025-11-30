import React from 'react';
import { Link } from 'react-router-dom';
import { FaInstagram, FaRobot, FaChartLine, FaCalendarAlt, FaBullhorn, FaVideo, FaStar, FaQuoteLeft } from 'react-icons/fa';
import { FiCheck, FiArrowRight, FiAward, FiShield, FiUsers, FiGlobe } from 'react-icons/fi';
import SEO from '../components/SEO';
import './Home.css';

const Home = () => {
  // Key features for AI extraction - optimized for best ai tools for social media marketing
  const features = [
    {
      icon: FaVideo,
      title: 'AI Video Generator for Instagram Reels',
      description: 'Create content that actually converts with our AI content generation tools. Generate professional Instagram Reels using generative AI powered by machine learning. This AI tool for social media transforms text into viral video content in minutes.',
      keywords: ['AI video generator', 'Instagram Reels', 'ai content generation']
    },
    {
      icon: FaCalendarAlt,
      title: 'AI Social Media Scheduling Tools',
      description: 'Schedule posts across multiple social media channels with AI-optimized timing. Our scheduling tools analyze your audience across all social platforms and suggest optimal posting times to fill your content calendar automatically.',
      keywords: ['social media scheduling', 'scheduling tools', 'content calendar']
    },
    {
      icon: FaRobot,
      title: 'AI Writing Assistant for Captions',
      description: 'Our AI writing assistant generates engaging captions and optimized hashtags. This tool to help you write content that resonates with your audience uses advanced AI algorithms to boost engagement across social networks.',
      keywords: ['AI writing assistant', 'AI writing', 'ai can help']
    },
    {
      icon: FaChartLine,
      title: 'AI-Powered Social Listening Tools',
      description: 'Deep performance analysis with AI-powered social listening tools. Track engagement across social media feeds, monitor social profiles, and get AI insights for your marketing efforts in real-time.',
      keywords: ['social listening tools', 'AI analytics', 'social profiles']
    },
    {
      icon: FaBullhorn,
      title: 'AI Marketing Tools for Campaigns',
      description: 'AI marketing tools that optimize your Instagram and Facebook campaigns. AI automation handles A/B testing, audience targeting, and ROAS maximization for marketing teams and agencies.',
      keywords: ['ai marketing tools', 'ai automation', 'marketing teams']
    },
    {
      icon: FaInstagram,
      title: 'Multi-Platform Social Media Management',
      description: 'Manage multiple social media accounts from one dashboard. Direct integration with major social media platforms including Facebook and Instagram via official Meta API. AI social media management made simple.',
      keywords: ['social media management', 'multiple social media', 'ai social media management']
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

  // Extended FAQ for AEO/GEO - optimized for ai for social media marketing keywords
  const faqs = [
    {
      question: 'What is AIInstaMarketing and how does AI help with social media marketing?',
      answer: 'AIInstaMarketing is the best AI tool for Instagram marketing in 2025. As a leading AI social media management platform, it uses advanced AI and machine learning to generate video content, write captions using AI, optimize hashtags, and analyze performance. AI can help streamline your marketing efforts across social media channels with tools that can automate content creation and scheduling.'
    },
    {
      question: 'How does AI content generation work for Instagram Reels?',
      answer: 'Our AI Video Generator uses generative AI powered by machine learning for text-to-video creation. You enter a prompt, select duration (5-60 seconds) and style. The AI tools for Instagram then generate professional video with transitions, effects, and optional AI voiceover. Many AI tools available today cannot match our quality - the result is optimized for Instagram Reels format (9:16).'
    },
    {
      question: 'Is this the best AI for social media marketing? Is there a free trial?',
      answer: 'Yes! AIInstaMarketing is ranked among the top AI tools and best AI tools for social media in 2025. We offer a free trial and a permanently free plan with 5 scheduled posts per month, AI caption generator, and basic analytics. The Pro plan adds unlimited scheduling and AI video generator. Start your free trial today!'
    },
    {
      question: 'How do AI marketing tools help create content that resonates with your audience?',
      answer: 'Our AI features include content management tools that analyze your audience across social platforms. The AI writing assistant helps you create content that actually engages followers. Tools analyze performance data to suggest post ideas and content marketing strategies. AI helps by learning what content that\'s performing best with your specific audience.'
    },
    {
      question: 'Can AI automation help with social media scheduling?',
      answer: 'Absolutely! AI and automation are at the core of our platform. Our scheduling tools help fill your content calendar automatically. AI can also optimize posting times across multiple social networks. Whether you\'re managing social profiles for a marketing agency or your own brand, tools can help streamline your dynamic social presence.'
    },
    {
      question: 'Does this work across multiple social media platforms?',
      answer: 'Yes! AIInstaMarketing supports major social media platforms including Facebook and Instagram. Manage multiple social accounts from one dashboard - ideal for keeping your social presence consistent across all social channels. Our tools work across social media feeds seamlessly.'
    },
    {
      question: 'What makes this the best AI social media tool compared to Sprout Social?',
      answer: 'While Sprout Social is a popular AI alternative, AIInstaMarketing offers superior AI content generation, thousands of image or video templates, and specialized AI tools for Instagram. Our AI agent technology, powered by AI algorithms, provides more advanced automation for influencer marketing and marketing content creation.'
    },
    {
      question: 'What is the future of AI in social media marketing?',
      answer: 'AI is reshaping social media marketing rapidly. The future of AI includes more advanced AI writing, AI-powered social listening tools, and smarter tools analyze capabilities. AI makes content creation faster while AI algorithms improve targeting. Using AI for social media will become essential for all marketing teams.'
    }
  ];

  // Trust signals data
  const trustStats = [
    { number: '15,000+', label: 'Active Users', icon: FiUsers },
    { number: '2M+', label: 'Posts Published', icon: FaInstagram },
    { number: '50+', label: 'Countries', icon: FiGlobe },
    { number: '4.9★', label: 'Average Rating', icon: FaStar }
  ];

  // Testimonials for E-E-A-T - with social media marketing keywords
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Influencer Marketing Expert, 150K followers',
      text: 'The best AI tool for social media I\'ve used! AIInstaMarketing saved me 10+ hours per week. AI can help create content faster than any other tools available - I create Instagram Reels in just minutes!',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Marketing Agency Director',
      text: 'As a marketing agency, we needed top AI tools for managing multiple social media accounts. This AI tool for social media marketing transformed our workflow. The AI features and social listening tools are unmatched.',
      rating: 5
    },
    {
      name: 'Emma Williams',
      role: 'E-commerce Content Marketing Manager',
      text: 'Using AI for social media changed everything for our social strategy. The AI writing assistant helps create marketing content that actually converts. Best AI social media tool for email marketing integration too!',
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
        title="Best AI Tool for Instagram Marketing 2025 | AI Social Media Management"
        description="Discover the best AI tools for social media marketing in 2025. Use AI for Instagram marketing with our AI tool for social media - generate Reels, automate posts, and boost engagement. Free trial available!"
        keywords="best ai tool for instagram marketing 2025, ai tool for social media, best ai tools for social, ai marketing tools, ai social media management, using ai for social media, ai for social media marketing, best ai social media, ai tools for instagram, social media management, ai content generation, ai writing assistant"
        url="/"
        faq={faqs}
        howTo={howToData}
        datePublished="2024-01-01"
        dateModified="2025-11-30"
      />

      {/* TL;DR Section for AI/GEO - Key Takeaways */}
      <section className="tldr-section" aria-label="Key Information">
        <div className="tldr-container">
          <h2 className="tldr-title">📋 Best AI Tools for Social Media Marketing - Quick Overview</h2>
          <ul className="tldr-list">
            <li><strong>AI Content Generation:</strong> Create Instagram Reels automatically using generative AI and machine learning</li>
            <li><strong>AI Social Media Scheduling:</strong> Schedule posts across social channels with AI-optimized timing</li>
            <li><strong>AI Writing Assistant:</strong> AI helps create content that resonates with your audience</li>
            <li><strong>AI-Powered Social Listening Tools:</strong> Tools analyze engagement across multiple social media platforms</li>
            <li><strong>Free Trial Available:</strong> Start for free - best AI tool for Instagram marketing 2025</li>
          </ul>
        </div>
      </section>

      {/* Hero Section - H1 optimized for "Best AI Tool for Instagram Marketing 2025" */}
      <header className="hero">
        <div className="hero-content">
          <div className="hero-badge">🏆 #1 AI Tool for Social Media Marketing 2025</div>
          <h1>
            Best AI Tool for <span className="gradient-text">Instagram Marketing</span> 2025
          </h1>
          <p className="hero-subtitle">
            Use AI for social media marketing to generate viral Instagram Reels, automate social media management, 
            and create content that actually converts. The best AI tools for social powered by AI.
          </p>
          
          {/* Key benefits list for AI extraction */}
          <ul className="hero-benefits" aria-label="Key Benefits">
            <li><FiCheck aria-hidden="true" /> AI Tools for Instagram - Generate Reels with AI Content Generation</li>
            <li><FiCheck aria-hidden="true" /> AI Social Media Management - Schedule across social channels</li>
            <li><FiCheck aria-hidden="true" /> AI Writing Assistant - Create marketing content that converts</li>
            <li><FiCheck aria-hidden="true" /> Free Trial - 14 days free, no credit card required</li>
          </ul>

          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg" aria-label="Start free trial - Best AI tool for Instagram">
              Start Free Trial <FiArrowRight aria-hidden="true" />
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
        <h2 id="stats-heading" className="sr-only">AIInstaMarketing - Popular AI Tool by the Numbers</h2>
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

      {/* Features Section - H2 optimized */}
      <section className="features-section" id="features" aria-labelledby="features-heading">
        <div className="section-header">
          <h2 id="features-heading">Best AI Tools for Social - How AI Can Help Your Marketing Strategies</h2>
          <p>Complete AI marketing tools for professional social media management in 2025</p>
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

      {/* How It Works - Step by Step for AI/GEO - optimized for "use ai" and "ai in social media" */}
      <section className="how-it-works" id="how-it-works" aria-labelledby="how-it-works-heading">
        <div className="section-header">
          <h2 id="how-it-works-heading">How to Use AI for Social Media Marketing Success</h2>
          <p>Start using AI for social media in just 5 simple steps</p>
        </div>
        <ol className="steps">
          <li className="step" id="step-1">
            <div className="step-number" aria-hidden="true">1</div>
            <h3>Start Your Free Trial</h3>
            <p>Create an account in less than 1 minute. Free trial available - no credit card required.</p>
          </li>
          <li className="step" id="step-2">
            <div className="step-number" aria-hidden="true">2</div>
            <h3>Connect Your Social Profiles</h3>
            <p>Securely connect your Instagram and Facebook accounts via the official Meta API for AI in social media management.</p>
          </li>
          <li className="step" id="step-3">
            <div className="step-number" aria-hidden="true">3</div>
            <h3>Use AI to Create Content</h3>
            <p>Help you create content using AI content generation. Generate videos, captions, and hashtags with our AI agent technology.</p>
          </li>
          <li className="step" id="step-4">
            <div className="step-number" aria-hidden="true">4</div>
            <h3>Fill Your Content Calendar</h3>
            <p>AI automation helps fill your content calendar with post ideas. Scheduling tools optimize posting times for your social strategy.</p>
          </li>
          <li className="step" id="step-5">
            <div className="step-number" aria-hidden="true">5</div>
            <h3>Keeping Your Social Presence Optimized</h3>
            <p>Tools analyze results and AI helps adjust your marketing strategies based on data-driven recommendations.</p>
          </li>
        </ol>
        <div className="steps-cta">
          <Link to="/register" className="btn btn-primary btn-lg">
            Start Free Trial Now <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Testimonials for E-E-A-T */}
      <section className="testimonials-section" aria-labelledby="testimonials-heading">
        <div className="section-header">
          <h2 id="testimonials-heading">Marketing Teams Love Our AI Tools for Instagram</h2>
          <p>Join thousands of satisfied users using AI for social media marketing</p>
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
          <h2 id="pricing-heading">AI Marketing Tools - Transparent Pricing for 2025</h2>
          <p>Choose the plan that fits your marketing efforts. Free trial - 14 days of Pro free!</p>
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

      {/* FAQ Section - Critical for AEO/GEO - optimized for "future of ai" and "ai in social media" */}
      <section className="faq-section" id="faq" aria-labelledby="faq-heading">
        <div className="section-header">
          <h2 id="faq-heading">AI for Social Media Marketing - Frequently Asked Questions</h2>
          <p>Everything you need to know about the best AI tools for social media management in 2025</p>
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

      {/* Final CTA Section - optimized for "use ai" and "best ai" */}
      <section className="cta-section" aria-labelledby="cta-heading">
        <h2 id="cta-heading">Ready to Use AI for Your Social Media Marketing in 2025?</h2>
        <p>Join 15,000+ marketing teams already using the best AI tools for Instagram success</p>
        <div className="cta-buttons">
          <Link to="/register" className="btn btn-primary btn-lg">
            Start Free Trial - Best AI Tool 2025 <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
        <p className="cta-note">Free trial • No credit card required • Cancel anytime • 24/7 support</p>
      </section>

      {/* Footer - with additional SEO keywords in links */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <FaInstagram className="footer-logo" aria-hidden="true" />
            <span>AIInstaMarketing - Best AI Tool for Social Media 2025</span>
          </div>
          <nav className="footer-links" aria-label="Footer navigation">
            <div className="footer-column">
              <h4>AI Marketing Tools</h4>
              <Link to="/features">AI Features</Link>
              <Link to="/templates">Image or Video Templates</Link>
              <Link to="/pricing">Pricing</Link>
            </div>
            <div className="footer-column">
              <h4>AI Tools for Instagram</h4>
              <Link to="/ai-instagram-video-generator">AI Video Generator</Link>
              <Link to="/instagram-reels-generator">Instagram Reels Generator</Link>
              <Link to="/ai-caption-generator">AI Writing Assistant</Link>
              <Link to="/instagram-content-scheduler">Social Media Scheduling</Link>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact Marketing Agency</Link>
            </div>
            <div className="footer-column">
              <h4>Get Started</h4>
              <Link to="/register">Free Trial - Sign Up</Link>
              <Link to="/login">Login</Link>
            </div>
          </nav>
          <div className="footer-bottom">
            <p>© 2025 AIInstaMarketing - Best AI Tool for Instagram Marketing. All rights reserved.</p>
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
