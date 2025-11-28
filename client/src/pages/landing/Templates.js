import React from 'react';
import { Link } from 'react-router-dom';
import { FaVideo, FaFire, FaEye, FaStar, FaPlay } from 'react-icons/fa';
import { FiArrowRight, FiTrendingUp, FiFilter } from 'react-icons/fi';
import SEO from '../../components/SEO';
import './LandingPages.css';

const Templates = () => {
  const categories = [
    { name: 'All Templates', count: 500, active: true },
    { name: 'Trending', count: 50 },
    { name: 'E-commerce', count: 75 },
    { name: 'Fitness', count: 60 },
    { name: 'Food', count: 45 },
    { name: 'Travel', count: 55 },
    { name: 'Education', count: 70 },
    { name: 'Lifestyle', count: 65 },
    { name: 'Business', count: 80 }
  ];

  const templates = [
    {
      name: 'Product Showcase',
      category: 'E-commerce',
      avgViews: '2.5M',
      engagement: '+47%',
      description: 'Perfect for highlighting product features with dynamic transitions.',
      trending: true
    },
    {
      name: 'Before & After',
      category: 'Transformation',
      avgViews: '3.1M',
      engagement: '+62%',
      description: 'Show transformations with dramatic reveal effects.',
      trending: true
    },
    {
      name: 'Tutorial Steps',
      category: 'Education',
      avgViews: '1.8M',
      engagement: '+38%',
      description: 'Step-by-step how-to format with numbered sections.',
      trending: false
    },
    {
      name: 'Day in My Life',
      category: 'Lifestyle',
      avgViews: '2.2M',
      engagement: '+41%',
      description: 'Authentic daily routine format that builds connection.',
      trending: true
    },
    {
      name: 'Trending Sound',
      category: 'Viral',
      avgViews: '5.8M',
      engagement: '+89%',
      description: 'Templates using currently viral sounds and trends.',
      trending: true
    },
    {
      name: '3 Tips Format',
      category: 'Education',
      avgViews: '1.5M',
      engagement: '+35%',
      description: 'Quick tips format that gets saved and shared.',
      trending: false
    },
    {
      name: 'POV Style',
      category: 'Entertainment',
      avgViews: '4.2M',
      engagement: '+72%',
      description: 'Point-of-view storytelling that hooks viewers.',
      trending: true
    },
    {
      name: 'Quote Overlay',
      category: 'Motivational',
      avgViews: '1.2M',
      engagement: '+28%',
      description: 'Inspirational quotes with cinematic backgrounds.',
      trending: false
    },
    {
      name: 'Unboxing',
      category: 'E-commerce',
      avgViews: '2.8M',
      engagement: '+55%',
      description: 'Product unboxing with anticipation-building effects.',
      trending: true
    },
    {
      name: 'Recipe/Tutorial',
      category: 'Food',
      avgViews: '2.1M',
      engagement: '+44%',
      description: 'Quick recipe format with ingredient overlays.',
      trending: false
    },
    {
      name: 'Travel Montage',
      category: 'Travel',
      avgViews: '3.5M',
      engagement: '+58%',
      description: 'Cinematic travel clips with location tags.',
      trending: true
    },
    {
      name: 'Workout Demo',
      category: 'Fitness',
      avgViews: '1.9M',
      engagement: '+42%',
      description: 'Exercise demonstrations with rep counters.',
      trending: false
    }
  ];

  const faqs = [
    {
      question: 'What are Instagram Reels templates?',
      answer: 'Reels templates are pre-designed video formats that you can customize with your own content. They include optimized timing, transitions, text placements, and effects that have been proven to perform well on Instagram. Instead of starting from scratch, you adapt a viral format to your niche.'
    },
    {
      question: 'How do I use templates in AIInstaMarketing?',
      answer: 'Simple! 1) Browse templates by category or search, 2) Click "Use Template" on your chosen format, 3) AI adapts the template to your content and niche, 4) Customize text, add your footage or let AI generate visuals, 5) Add music and publish. The AI handles the technical work.'
    },
    {
      question: 'Are templates customizable?',
      answer: 'Absolutely! Every element is customizable - change colors, fonts, timing, transitions, music, and more. Templates give you a proven structure, but you have full creative control to make it unique to your brand.'
    },
    {
      question: 'How often are new templates added?',
      answer: 'We add 20-30 new templates every week based on current trends. Our team monitors viral Reels across Instagram and creates templates from formats that are performing well. Pro users get early access to new templates.'
    },
    {
      question: 'Can templates really help me go viral?',
      answer: 'Templates significantly increase your chances! Using proven formats means your content is structured in ways that Instagram\'s algorithm and viewers respond to. Our users report 40-100% higher views when using templates compared to creating from scratch.'
    },
    {
      question: 'Are templates included in the free plan?',
      answer: 'Yes! Free plan includes access to 50 basic templates. Pro plan ($29/month) unlocks all 500+ templates including trending formats. Pro users also get early access to new templates before they\'re released to free users.'
    }
  ];

  return (
    <main className="landing-page templates-page">
      <SEO 
        title="Instagram Reels Templates | 500+ Viral Video Templates 2025"
        description="Browse 500+ Instagram Reels templates that go viral. Trending formats, proven structures, customizable designs. Create professional Reels in minutes. Free templates available!"
        keywords="Instagram Reels templates, viral Reel templates, Instagram video templates, Reels ideas, trending Reels formats, how to go viral on Reels, best Reels templates 2025"
        url="/templates"
        faq={faqs}
      />

      {/* Hero Section */}
      <header className="landing-hero templates-hero">
        <div className="landing-hero-content">
          <div className="hero-badge">🎬 500+ Viral Templates</div>
          <h1>Instagram Reels Templates</h1>
          <p className="hero-tagline">Proven Formats That Go Viral</p>
          <p className="hero-description">
            Stop guessing what works. Use templates from Reels that got millions of views. 
            Customize with your content and watch your engagement soar.
          </p>

          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              Browse All Templates <FiArrowRight />
            </Link>
          </div>

          <div className="hero-trust">
            <span>🔥 50+ trending templates</span>
            <span>📈 40% higher engagement</span>
          </div>
        </div>
      </header>

      {/* Categories */}
      <section className="categories-section">
        <div className="categories-bar">
          {categories.map((cat, index) => (
            <button 
              key={index} 
              className={`category-btn ${cat.active ? 'active' : ''}`}
            >
              {cat.name} <span className="count">({cat.count})</span>
            </button>
          ))}
        </div>
      </section>

      {/* Templates Grid */}
      <section className="templates-grid-section">
        <div className="templates-header">
          <h2>Browse Templates</h2>
          <div className="templates-filter">
            <FiFilter /> Sort by: <select><option>Most Popular</option><option>Newest</option><option>Highest Engagement</option></select>
          </div>
        </div>
        
        <div className="templates-grid">
          {templates.map((template, index) => (
            <div key={index} className="template-card">
              {template.trending && <span className="trending-badge"><FaFire /> Trending</span>}
              <div className="template-preview">
                <FaVideo className="preview-icon" />
                <button className="preview-play"><FaPlay /></button>
              </div>
              <div className="template-info">
                <h3>{template.name}</h3>
                <span className="template-category">{template.category}</span>
                <p>{template.description}</p>
                <div className="template-stats">
                  <span><FaEye /> {template.avgViews} avg views</span>
                  <span><FiTrendingUp /> {template.engagement}</span>
                </div>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Use Template
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="templates-cta">
          <Link to="/register" className="btn btn-primary btn-lg">
            See All 500+ Templates <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* Why Templates Section */}
      <section className="why-templates-section">
        <h2>Why Use Reels Templates?</h2>
        
        <div className="why-grid">
          <div className="why-card">
            <FiTrendingUp className="why-icon" />
            <h3>Proven to Perform</h3>
            <p>Every template is based on Reels that got millions of views. You're using formats the algorithm loves.</p>
          </div>
          <div className="why-card">
            <FaFire className="why-icon" />
            <h3>Stay on Trend</h3>
            <p>New templates added weekly based on current viral trends. Never miss what's hot.</p>
          </div>
          <div className="why-card">
            <FaStar className="why-icon" />
            <h3>Save Hours</h3>
            <p>Skip the trial and error. Start with a winning structure and customize to your brand.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="social-proof-section">
        <h2>Templates That Deliver Results</h2>
        <div className="stats-row">
          <div className="stat">
            <span className="stat-number">500+</span>
            <span className="stat-label">Templates</span>
          </div>
          <div className="stat">
            <span className="stat-number">50+</span>
            <span className="stat-label">Trending Now</span>
          </div>
          <div className="stat">
            <span className="stat-number">40%</span>
            <span className="stat-label">Higher Views</span>
          </div>
          <div className="stat">
            <span className="stat-number">Weekly</span>
            <span className="stat-label">New Additions</span>
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
        <h2>Start Using Viral Templates Today</h2>
        <p>50 templates free. 500+ with Pro.</p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Get Free Access <FiArrowRight />
        </Link>
        <p className="cta-note">No credit card required • 14-day Pro trial</p>
      </section>
    </main>
  );
};

export default Templates;
