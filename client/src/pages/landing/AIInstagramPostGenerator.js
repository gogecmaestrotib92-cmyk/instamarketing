import React from 'react';
import { Link } from 'react-router-dom';
import { FaImage, FaMagic, FaHashtag, FaPalette, FaInstagram, FaCalendarAlt, FaStar, FaCheck, FaLayerGroup } from 'react-icons/fa';
import { FiArrowRight, FiCheck, FiGrid, FiEdit3, FiTarget } from 'react-icons/fi';
import SEO from '../../components/SEO';
import './LandingPages.css';

const AIInstagramPostGenerator = () => {
  const features = [
    {
      icon: FaMagic,
      title: 'AI Content Generation',
      description: 'Describe your post idea - AI creates engaging content with perfect caption, hashtags, and visual suggestions.'
    },
    {
      icon: FiEdit3,
      title: 'Caption Writer',
      description: 'GPT-4 powered caption generator creates engaging, on-brand captions with emojis and CTAs.'
    },
    {
      icon: FaHashtag,
      title: 'Smart Hashtags',
      description: 'AI analyzes your content and suggests optimal hashtag mix - popular, niche, and branded tags.'
    },
    {
      icon: FiGrid,
      title: 'Feed Planner',
      description: 'Plan your Instagram grid visually. Drag-and-drop to create a cohesive, aesthetic feed.'
    },
    {
      icon: FaCalendarAlt,
      title: 'Auto Scheduling',
      description: 'Schedule posts for optimal times. AI analyzes your audience and suggests best posting windows.'
    },
    {
      icon: FiTarget,
      title: 'Engagement Optimization',
      description: 'Every element optimized for engagement - caption length, hashtag count, posting time.'
    }
  ];

  const contentTypes = [
    { name: 'Carousel Posts', description: 'Multi-image posts that boost engagement by 1.4x' },
    { name: 'Quote Graphics', description: 'Inspirational and motivational content' },
    { name: 'Product Features', description: 'Showcase products with compelling visuals' },
    { name: 'Behind-the-Scenes', description: 'Authentic content that builds connection' },
    { name: 'Educational Posts', description: 'Value-driven content that gets saved' },
    { name: 'User-Generated', description: 'Repurpose and feature community content' }
  ];

  const faqs = [
    {
      question: 'What is an AI Instagram Post Generator?',
      answer: 'An AI Instagram Post Generator is a tool that uses artificial intelligence to create complete Instagram posts - including captions, hashtags, and content suggestions. AIInstaMarketing uses GPT-4 and advanced AI models to generate engaging posts optimized for the Instagram algorithm. You simply describe what you want to post, and AI creates everything from caption to hashtag strategy.'
    },
    {
      question: 'How does AI create Instagram posts?',
      answer: 'Our AI analyzes your input (topic, keywords, or image), understands your brand voice and target audience, then generates: 1) Engaging captions with hooks, CTAs, and emojis, 2) Optimal hashtag mix (30 tags categorized by reach), 3) Best posting time for your audience, 4) Visual content suggestions. All optimized for maximum engagement.'
    },
    {
      question: 'Can AI write good Instagram captions?',
      answer: 'Yes! AI-generated captions often outperform human-written ones because they\'re optimized for engagement. Our GPT-4 powered system understands what makes captions perform well: strong hooks, optimal length (125-150 characters for feed, longer for carousel), emotional triggers, clear CTAs, and strategic emoji placement. Users report 35% higher engagement with AI captions.'
    },
    {
      question: 'How many hashtags should I use on Instagram?',
      answer: 'Instagram allows 30 hashtags, but optimal number varies. Our AI suggests the perfect mix: 5-10 popular hashtags (100K-500K posts), 10-15 mid-range (10K-100K posts), and 5-10 niche hashtags (under 10K posts). This strategy maximizes both reach and discoverability. AI automatically categorizes and suggests hashtags based on your content.'
    },
    {
      question: 'Can I plan my Instagram feed in advance?',
      answer: 'Absolutely! AIInstaMarketing includes a visual feed planner where you can drag-and-drop posts to create a cohesive grid aesthetic. Preview how your feed will look before posting, ensure color consistency, and maintain your brand identity across all posts.'
    },
    {
      question: 'What\'s the best time to post on Instagram?',
      answer: 'The best time varies by audience. Our AI analyzes when YOUR followers are most active and suggests optimal posting windows. Generally, weekdays 11am-1pm and 7-9pm see highest engagement, but AI personalizes this based on your specific audience timezone and behavior patterns.'
    },
    {
      question: 'Is the post generator free?',
      answer: 'We offer a free plan with 10 AI-generated posts per month, basic hashtag suggestions, and scheduling for 5 posts. Pro plan ($29/month) includes unlimited post generation, advanced hashtag optimization, and full scheduling features. 14-day free trial of Pro included!'
    },
    {
      question: 'Can I generate carousel posts?',
      answer: 'Yes! AI can generate carousel post content including: slide-by-slide content suggestions, cohesive caption covering all slides, swipe-optimized first slide, and CTA for the final slide. Carousel posts get 1.4x more reach on average, and our AI is specifically trained to maximize carousel engagement.'
    }
  ];

  const howToSteps = [
    { step: 1, title: 'Enter Your Topic', description: 'Describe what you want to post about or upload an image for AI analysis.' },
    { step: 2, title: 'AI Generates Content', description: 'Get multiple caption options, hashtag sets, and posting recommendations.' },
    { step: 3, title: 'Customize & Perfect', description: 'Edit captions, adjust hashtags, preview in feed planner.' },
    { step: 4, title: 'Schedule or Publish', description: 'Post immediately or schedule for optimal engagement time.' }
  ];

  return (
    <main className="landing-page">
      <SEO 
        title="AI Instagram Post Generator | Create Viral Posts Automatically 2025"
        description="Generate engaging Instagram posts with AI. GPT-4 caption writer, smart hashtag generator, feed planner, auto scheduling. Create scroll-stopping posts in seconds. Free trial!"
        keywords="AI Instagram post generator, Instagram caption generator, AI hashtag generator, Instagram content creator, post generator for Instagram, how to create Instagram posts, Instagram feed planner, best AI for Instagram posts 2025"
        url="/ai-instagram-post-generator"
        faq={faqs}
      />

      {/* Hero Section */}
      <header className="landing-hero">
        <div className="landing-hero-content">
          <div className="hero-badge">📝 AI-Powered Instagram Posts</div>
          <h1>AI Instagram Post Generator</h1>
          <p className="hero-tagline">Create Scroll-Stopping Posts in Seconds</p>
          <p className="hero-description">
            AI generates perfect captions, optimal hashtags, and content ideas. 
            Plan your feed, schedule posts, and grow your Instagram automatically.
          </p>
          
          <ul className="hero-features">
            <li><FiCheck /> GPT-4 caption writer</li>
            <li><FiCheck /> Smart hashtag generator</li>
            <li><FiCheck /> Visual feed planner</li>
            <li><FiCheck /> Auto scheduling</li>
          </ul>

          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              Generate Your First Post Free <FiArrowRight />
            </Link>
          </div>

          <div className="hero-trust">
            <span>⭐ 4.9/5 from 2,800+ reviews</span>
            <span>📸 2M+ posts generated</span>
          </div>
        </div>
      </header>

      {/* How It Works */}
      <section className="how-it-works-section">
        <h2>How to Generate Instagram Posts with AI</h2>
        <p className="section-subtitle">From idea to published post in 4 simple steps</p>
        
        <div className="steps-grid steps-4">
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
            Start Creating Posts <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <h2>AI Post Generator Features</h2>
        <p className="section-subtitle">Everything you need for Instagram success</p>
        
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

      {/* Content Types */}
      <section className="content-types-section">
        <h2>What Types of Posts Can AI Generate?</h2>
        <p className="section-subtitle">AI creates content for any Instagram strategy</p>
        
        <div className="content-types-grid">
          {contentTypes.map((type, index) => (
            <div key={index} className="content-type-card">
              <FaCheck className="type-icon" />
              <h3>{type.name}</h3>
              <p>{type.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Caption Generator Highlight */}
      <section className="highlight-section">
        <div className="highlight-content">
          <h2>GPT-4 Powered Caption Generator</h2>
          <p className="highlight-description">
            Our AI caption writer understands what makes Instagram posts go viral. 
            It generates captions with strong hooks, emotional triggers, strategic emojis, 
            and clear calls-to-action.
          </p>
          <ul className="highlight-features">
            <li><FiCheck /> Multiple caption variations to choose from</li>
            <li><FiCheck /> Tone options: Professional, Fun, Inspirational, Casual</li>
            <li><FiCheck /> Optimized length for feed vs carousel posts</li>
            <li><FiCheck /> Automatic emoji and CTA placement</li>
            <li><FiCheck /> Line break optimization for readability</li>
          </ul>
          <Link to="/register" className="btn btn-primary">
            Try AI Caption Generator <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* Social Proof */}
      <section className="social-proof-section">
        <h2>Trusted by 15,000+ Instagram Creators</h2>
        <div className="stats-row">
          <div className="stat">
            <span className="stat-number">2M+</span>
            <span className="stat-label">Posts Generated</span>
          </div>
          <div className="stat">
            <span className="stat-number">35%</span>
            <span className="stat-label">Higher Engagement</span>
          </div>
          <div className="stat">
            <span className="stat-number">10x</span>
            <span className="stat-label">Faster Content</span>
          </div>
          <div className="stat">
            <span className="stat-number">15K+</span>
            <span className="stat-label">Active Users</span>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="pricing-preview-section">
        <h2>Start Generating Posts Today</h2>
        <div className="pricing-cards">
          <div className="pricing-card">
            <h3>Free</h3>
            <div className="price">$0<span>/month</span></div>
            <ul>
              <li><FiCheck /> 10 AI posts/month</li>
              <li><FiCheck /> Basic captions</li>
              <li><FiCheck /> 5 scheduled posts</li>
              <li><FiCheck /> Hashtag suggestions</li>
            </ul>
            <Link to="/register" className="btn btn-outline">Start Free</Link>
          </div>
          <div className="pricing-card popular">
            <div className="popular-badge">Most Popular</div>
            <h3>Pro</h3>
            <div className="price">$29<span>/month</span></div>
            <ul>
              <li><FiCheck /> Unlimited AI posts</li>
              <li><FiCheck /> GPT-4 captions</li>
              <li><FiCheck /> Advanced hashtags</li>
              <li><FiCheck /> Feed planner</li>
              <li><FiCheck /> Unlimited scheduling</li>
            </ul>
            <Link to="/register" className="btn btn-primary">Start 14-Day Free Trial</Link>
          </div>
          <div className="pricing-card">
            <h3>Business</h3>
            <div className="price">$79<span>/month</span></div>
            <ul>
              <li><FiCheck /> Everything in Pro</li>
              <li><FiCheck /> 10 Instagram accounts</li>
              <li><FiCheck /> Team access</li>
              <li><FiCheck /> Analytics reports</li>
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
        <h2>Ready to Create Better Instagram Posts?</h2>
        <p>Join 15,000+ creators using AI for Instagram success</p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Start Free - Generate Your First Post <FiArrowRight />
        </Link>
        <p className="cta-note">No credit card required • 14-day Pro trial • Cancel anytime</p>
      </section>
    </main>
  );
};

export default AIInstagramPostGenerator;
