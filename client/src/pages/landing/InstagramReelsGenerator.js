import React from 'react';
import { Link } from 'react-router-dom';
import { FaVideo, FaMagic, FaMusic, FaHashtag, FaRocket, FaInstagram, FaStar, FaPlay, FaCheck, FaFire, FaTiktok } from 'react-icons/fa';
import { FiArrowRight, FiCheck, FiTrendingUp, FiClock, FiTarget } from 'react-icons/fi';
import SEO from '../../components/SEO';
import './LandingPages.css';

const InstagramReelsGenerator = () => {
  const features = [
    {
      icon: FaMagic,
      title: 'AI-Powered Generation',
      description: 'Describe your Reel idea in plain text - AI creates professional video with visuals, transitions, and effects automatically.'
    },
    {
      icon: FaFire,
      title: 'Trending Templates',
      description: 'Access 500+ proven Reel templates that have gone viral. AI adapts them to your brand and niche.'
    },
    {
      icon: FaMusic,
      title: 'Viral Music Library',
      description: 'Library of 10,000+ trending sounds and music tracks. AI suggests best-performing audio for your content.'
    },
    {
      icon: FaHashtag,
      title: 'Smart Hashtag Generator',
      description: 'AI analyzes your Reel content and suggests optimal hashtags for maximum reach and discoverability.'
    },
    {
      icon: FiClock,
      title: 'Optimal Posting Time',
      description: 'AI analyzes your audience and suggests the best time to post for maximum engagement.'
    },
    {
      icon: FiTarget,
      title: 'Algorithm Optimization',
      description: 'Every Reel is optimized for Instagram algorithm - hook timing, caption length, hashtag strategy.'
    }
  ];

  const templates = [
    { name: 'Product Showcase', views: '10M+ avg views', category: 'E-commerce' },
    { name: 'Tutorial/How-To', views: '5M+ avg views', category: 'Educational' },
    { name: 'Before & After', views: '8M+ avg views', category: 'Transformation' },
    { name: 'Day in My Life', views: '7M+ avg views', category: 'Lifestyle' },
    { name: 'Trending Sound', views: '15M+ avg views', category: 'Viral' },
    { name: 'POV Style', views: '12M+ avg views', category: 'Entertainment' },
    { name: 'Tips & Hacks', views: '9M+ avg views', category: 'Value' },
    { name: 'Story Time', views: '6M+ avg views', category: 'Engagement' }
  ];

  const faqs = [
    {
      question: 'What is an Instagram Reels Generator?',
      answer: 'An Instagram Reels Generator is an AI-powered tool that automatically creates short-form video content optimized for Instagram Reels. It combines text-to-video AI, trending templates, music, captions, and effects to produce professional Reels in minutes instead of hours. AIInstaMarketing\'s Reels Generator uses the latest AI models to create content that performs well in the Instagram algorithm.'
    },
    {
      question: 'How do I make Instagram Reels automatically?',
      answer: 'With AIInstaMarketing, making Reels automatically is easy: 1) Choose a template or enter your idea as text, 2) AI generates video with appropriate visuals and transitions, 3) Select trending music from our library, 4) AI adds optimized captions, 5) Review, edit if needed, and publish directly to Instagram. The entire process takes 2-5 minutes.'
    },
    {
      question: 'Are AI-generated Reels as good as manually edited ones?',
      answer: 'Often better! AI-generated Reels are specifically optimized for Instagram\'s algorithm. They have perfect timing, trending formats, and optimized hooks. Our users report 40% higher average views compared to their manually edited content. AI also ensures consistency - you can post daily without quality drops.'
    },
    {
      question: 'Can I use the Reels Generator for free?',
      answer: 'Yes! Our free plan includes 5 AI-generated Reels per month, access to basic templates, and AI captions. Pro plan ($29/month) offers 50 Reels monthly with premium templates and trending music. Business plan ($79/month) provides unlimited Reels generation.'
    },
    {
      question: 'What types of Reels can I create?',
      answer: 'You can create any type of Instagram Reel: product showcases, tutorials, motivational content, trending challenges, behind-the-scenes, day-in-my-life, before/after transformations, educational content, entertainment, and more. We have 500+ templates covering every niche from fitness to finance to fashion.'
    },
    {
      question: 'Does the generator include music and sounds?',
      answer: 'Yes! We have a library of 10,000+ royalty-free music tracks and trending sounds. AI suggests music that matches your Reel\'s mood and what\'s currently performing well on Instagram. You can also use trending Instagram sounds (requires Instagram connection) or upload your own audio.'
    },
    {
      question: 'How do I get more views on my Reels?',
      answer: 'Our AI optimizes Reels for maximum views: 1) Strong hooks in the first 1-3 seconds, 2) Optimal video length (15-30 sec performs best), 3) Trending music and sounds, 4) AI-suggested hashtags for discoverability, 5) Best posting time for your audience, 6) Captions that boost watch time. Users see 40-100% increase in views.'
    },
    {
      question: 'Can I schedule Reels for later posting?',
      answer: 'Absolutely! AIInstaMarketing includes a full scheduling system. Generate your Reel, then schedule it for optimal posting time. AI suggests the best times based on when your audience is most active. You can schedule Reels weeks in advance for consistent content.'
    }
  ];

  const howToSteps = [
    { step: 1, title: 'Choose Template or Enter Idea', description: 'Select from 500+ viral templates or describe your Reel concept in plain text.' },
    { step: 2, title: 'AI Creates Your Video', description: 'AI generates professional video with visuals, transitions, and effects in 1-2 minutes.' },
    { step: 3, title: 'Add Trending Music', description: 'Choose from 10,000+ tracks or let AI suggest the perfect trending sound.' },
    { step: 4, title: 'Optimize & Customize', description: 'AI adds captions, hashtags, and cover image. Edit anything you want to change.' },
    { step: 5, title: 'Publish or Schedule', description: 'Post directly to Instagram or schedule for the optimal time.' }
  ];

  return (
    <main className="landing-page">
      <SEO 
        title="Instagram Reels Generator | Create Viral Reels Automatically 2025"
        description="Generate viral Instagram Reels automatically with AI. 500+ trending templates, AI music selection, auto captions, hashtag optimization. Create professional Reels in 2 minutes. Free trial!"
        keywords="Instagram reels generator, AI reels maker, automatic reels generator, create Instagram reels, viral reels creator, Instagram reels templates, how to make reels automatically, best reels generator 2025, Instagram reels ideas, reels maker online"
        url="/instagram-reels-generator"
        faq={faqs}
      />

      {/* Hero Section */}
      <header className="landing-hero">
        <div className="landing-hero-content">
          <div className="hero-badge">🎥 #1 Instagram Reels Generator 2025</div>
          <h1>Instagram Reels Generator</h1>
          <p className="hero-tagline">Create Viral Reels in 2 Minutes</p>
          <p className="hero-description">
            AI-powered Reels generator with 500+ viral templates, trending music, 
            auto captions, and hashtag optimization. No editing skills required.
          </p>
          
          <ul className="hero-features">
            <li><FiCheck /> 500+ viral templates</li>
            <li><FiCheck /> 10,000+ trending sounds</li>
            <li><FiCheck /> AI hashtag generator</li>
            <li><FiCheck /> Direct Instagram posting</li>
          </ul>

          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              Generate Your First Reel Free <FiArrowRight />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              See Examples <FaPlay />
            </Link>
          </div>

          <div className="hero-trust">
            <span>⭐ 4.9/5 from 2,800+ reviews</span>
            <span>🎬 5M+ Reels created</span>
          </div>
        </div>
      </header>

      {/* Templates Preview */}
      <section className="templates-section">
        <h2>500+ Viral Reel Templates</h2>
        <p className="section-subtitle">Proven formats that get millions of views</p>
        
        <div className="templates-grid">
          {templates.map((template, index) => (
            <div key={index} className="template-card">
              <FaVideo className="template-icon" />
              <h3>{template.name}</h3>
              <span className="template-views">{template.views}</span>
              <span className="template-category">{template.category}</span>
            </div>
          ))}
        </div>

        <Link to="/register" className="btn btn-primary">
          Browse All Templates <FiArrowRight />
        </Link>
      </section>

      {/* How It Works */}
      <section className="how-it-works-section">
        <h2>How to Generate Instagram Reels</h2>
        <p className="section-subtitle">From idea to viral Reel in 5 simple steps</p>
        
        <div className="steps-grid">
          {howToSteps.map((item) => (
            <div key={item.step} className="step-card">
              <div className="step-number">{item.step}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>

        <div className="steps-cta">
          <Link to="/register" className="btn btn-primary btn-lg">
            Start Creating Reels <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <h2>Reels Generator Features</h2>
        <p className="section-subtitle">Everything you need to dominate Instagram Reels</p>
        
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

      {/* Results Section */}
      <section className="results-section">
        <h2>Real Results from Real Users</h2>
        <div className="results-grid">
          <div className="result-card">
            <FiTrendingUp className="result-icon" />
            <span className="result-number">+340%</span>
            <span className="result-label">Average increase in Reel views</span>
          </div>
          <div className="result-card">
            <FiClock className="result-icon" />
            <span className="result-number">10x</span>
            <span className="result-label">Faster content creation</span>
          </div>
          <div className="result-card">
            <FaInstagram className="result-icon" />
            <span className="result-number">5M+</span>
            <span className="result-label">Reels generated</span>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="use-cases-section">
        <h2>Who Uses Our Reels Generator?</h2>
        <div className="use-cases-grid">
          <div className="use-case-card">
            <h3>📱 Influencers</h3>
            <p>Create daily content without burnout. Stay consistent with viral-format Reels.</p>
          </div>
          <div className="use-case-card">
            <h3>🏪 Small Businesses</h3>
            <p>Showcase products and build brand awareness without a video team.</p>
          </div>
          <div className="use-case-card">
            <h3>🎯 Marketers</h3>
            <p>Scale content production and manage multiple client accounts efficiently.</p>
          </div>
          <div className="use-case-card">
            <h3>🎨 Creators</h3>
            <p>Focus on creativity while AI handles the technical video production.</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="social-proof-section">
        <h2>Trusted by 15,000+ Instagram Creators</h2>
        <div className="stats-row">
          <div className="stat">
            <span className="stat-number">5M+</span>
            <span className="stat-label">Reels Generated</span>
          </div>
          <div className="stat">
            <span className="stat-number">340%</span>
            <span className="stat-label">Avg View Increase</span>
          </div>
          <div className="stat">
            <span className="stat-number">500+</span>
            <span className="stat-label">Viral Templates</span>
          </div>
          <div className="stat">
            <span className="stat-number">50+</span>
            <span className="stat-label">Countries</span>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="pricing-preview-section">
        <h2>Start Generating Reels Today</h2>
        <div className="pricing-cards">
          <div className="pricing-card">
            <h3>Free</h3>
            <div className="price">$0<span>/month</span></div>
            <ul>
              <li><FiCheck /> 5 Reels/month</li>
              <li><FiCheck /> Basic templates</li>
              <li><FiCheck /> AI captions</li>
              <li><FiCheck /> Standard music library</li>
            </ul>
            <Link to="/register" className="btn btn-outline">Start Free</Link>
          </div>
          <div className="pricing-card popular">
            <div className="popular-badge">Most Popular</div>
            <h3>Pro</h3>
            <div className="price">$29<span>/month</span></div>
            <ul>
              <li><FiCheck /> 50 Reels/month</li>
              <li><FiCheck /> 500+ premium templates</li>
              <li><FiCheck /> Trending music library</li>
              <li><FiCheck /> AI hashtag optimizer</li>
              <li><FiCheck /> Priority support</li>
            </ul>
            <Link to="/register" className="btn btn-primary">Start 14-Day Free Trial</Link>
          </div>
          <div className="pricing-card">
            <h3>Business</h3>
            <div className="price">$79<span>/month</span></div>
            <ul>
              <li><FiCheck /> Unlimited Reels</li>
              <li><FiCheck /> Team access (5 users)</li>
              <li><FiCheck /> Custom branding</li>
              <li><FiCheck /> White-label option</li>
              <li><FiCheck /> Dedicated manager</li>
            </ul>
            <Link to="/contact" className="btn btn-outline">Contact Us</Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <h2>Frequently Asked Questions About Reels Generator</h2>
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
        <h2>Ready to Create Viral Instagram Reels?</h2>
        <p>Join 15,000+ creators generating Reels with AI</p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Generate Your First Reel Free <FiArrowRight />
        </Link>
        <p className="cta-note">No credit card required • 14-day Pro trial • Cancel anytime</p>
      </section>
    </main>
  );
};

export default InstagramReelsGenerator;
