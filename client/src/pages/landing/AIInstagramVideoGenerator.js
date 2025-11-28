import React from 'react';
import { Link } from 'react-router-dom';
import { FaVideo, FaMagic, FaMusic, FaClock, FaDownload, FaInstagram, FaStar, FaPlay, FaCheck } from 'react-icons/fa';
import { FiArrowRight, FiCheck, FiZap, FiLayers, FiVolume2 } from 'react-icons/fi';
import SEO from '../../components/SEO';
import './LandingPages.css';

const AIInstagramVideoGenerator = () => {
  const features = [
    {
      icon: FaMagic,
      title: 'Text-to-Video AI',
      description: 'Enter any topic or script, and AI generates professional video content automatically. No video editing skills needed.'
    },
    {
      icon: FiVolume2,
      title: 'AI Voiceover',
      description: 'Add natural-sounding AI voiceover in 50+ languages. Choose from dozens of professional voice styles.'
    },
    {
      icon: FaMusic,
      title: 'Smart Music Selection',
      description: 'AI automatically selects trending music that matches your video mood and style.'
    },
    {
      icon: FiLayers,
      title: 'Auto Captions & Effects',
      description: 'Automatically add engaging captions, transitions, and effects optimized for Instagram engagement.'
    },
    {
      icon: FaClock,
      title: '2-Minute Generation',
      description: 'From prompt to finished video in under 2 minutes. Create content 10x faster than traditional editing.'
    },
    {
      icon: FaInstagram,
      title: 'Instagram-Optimized',
      description: 'Videos are automatically formatted for Reels (9:16), optimized for engagement and algorithm performance.'
    }
  ];

  const useCases = [
    { title: 'Product Showcases', description: 'Generate engaging product videos that convert viewers into buyers.' },
    { title: 'Educational Content', description: 'Create how-to videos and tutorials automatically.' },
    { title: 'Motivational Reels', description: 'Generate inspirational content that resonates with your audience.' },
    { title: 'Behind-the-Scenes', description: 'AI creates authentic-feeling BTS content for brand connection.' },
    { title: 'Trending Content', description: 'Stay relevant with AI-generated trend-following videos.' },
    { title: 'Brand Stories', description: 'Tell your brand story through compelling AI-generated videos.' }
  ];

  const faqs = [
    {
      question: 'What is an AI Instagram Video Generator?',
      answer: 'An AI Instagram Video Generator is a tool that uses artificial intelligence to automatically create video content for Instagram Reels and posts. You simply enter a text prompt describing what you want, and the AI generates a complete video with visuals, transitions, captions, and optionally music and voiceover. AIInstaMarketing uses advanced text-to-video AI models to create professional-quality content in under 2 minutes.'
    },
    {
      question: 'How do I create Instagram Reels with AI?',
      answer: 'Creating Instagram Reels with AI is simple: 1) Sign up for AIInstaMarketing (free), 2) Go to AI Video Generator, 3) Enter your video topic or paste a script, 4) Select duration (5-60 seconds) and style, 5) Click Generate - AI creates your video in 1-2 minutes, 6) Add music, adjust captions if needed, 7) Download or publish directly to Instagram.'
    },
    {
      question: 'Is AI-generated video content good for Instagram?',
      answer: 'Yes! AI-generated videos can perform exceptionally well on Instagram. Our users report 40% higher engagement rates on average. The key is that AI helps you post consistently (Instagram rewards consistency) and creates content optimized for the algorithm. AI can analyze trending formats and incorporate them into your videos automatically.'
    },
    {
      question: 'How much does AI video generation cost?',
      answer: 'AIInstaMarketing offers a free plan with 3 AI videos per month. Pro plan ($29/month) includes 50 AI videos monthly, and Business plan ($79/month) offers unlimited AI video generation. All plans include a 14-day free trial of Pro features.'
    },
    {
      question: 'Can I add my own voiceover to AI videos?',
      answer: 'Yes! You have multiple options: 1) Use AI voiceover with 50+ natural-sounding voices in different languages and styles, 2) Upload your own recorded voiceover, 3) Use text-to-speech and adjust the voice settings, or 4) Create videos without voiceover for music-only Reels.'
    },
    {
      question: 'What types of videos can AI generate for Instagram?',
      answer: 'AI can generate virtually any type of Instagram video: product showcases, tutorials, motivational content, educational clips, storytelling videos, behind-the-scenes style content, trending format videos, listicles, quotes videos, and more. The AI adapts to your specific niche and brand voice.'
    },
    {
      question: 'How long does it take to generate an AI video?',
      answer: 'With AIInstaMarketing, AI video generation typically takes 1-2 minutes for a 15-30 second video. Longer videos (up to 60 seconds) may take up to 3 minutes. This is 10-50x faster than traditional video editing which can take hours for a single Reel.'
    },
    {
      question: 'Can I edit AI-generated videos before posting?',
      answer: 'Absolutely! After AI generates your video, you can: edit captions and their timing, change music, adjust voiceover, trim or extend clips, add your logo/watermark, and preview before publishing. The AI gives you a great starting point that you can customize to perfection.'
    }
  ];

  const howToSteps = [
    { step: 1, title: 'Enter Your Prompt', description: 'Describe what video you want or paste your script. Be specific about topic, tone, and style.' },
    { step: 2, title: 'Choose Settings', description: 'Select video duration (5-60 sec), aspect ratio (9:16 for Reels), and visual style.' },
    { step: 3, title: 'Generate Video', description: 'Click Generate and wait 1-2 minutes while AI creates your professional video.' },
    { step: 4, title: 'Add Audio', description: 'Choose AI voiceover, upload your own, or select trending music from our library.' },
    { step: 5, title: 'Customize Captions', description: 'AI adds captions automatically. Edit text, timing, and styling as needed.' },
    { step: 6, title: 'Publish or Schedule', description: 'Download your video or publish/schedule directly to Instagram.' }
  ];

  return (
    <main className="landing-page">
      <SEO 
        title="AI Instagram Video Generator | Create Viral Reels Automatically 2025"
        description="Generate professional Instagram Reels using AI. Text-to-video technology creates viral video content in 2 minutes. AI voiceover, auto captions, trending music. Free trial!"
        keywords="AI Instagram video generator, AI reels generator, text to video AI, Instagram reels maker, AI video creator, automatic video generation, AI Instagram video, how to make reels with AI, best AI video generator 2025, create Instagram reels automatically, AI video maker for Instagram"
        url="/ai-instagram-video-generator"
        faq={faqs}
      />

      {/* Hero Section */}
      <header className="landing-hero">
        <div className="landing-hero-content">
          <div className="hero-badge">🎬 #1 AI Video Generator for Instagram</div>
          <h1>AI Instagram Video Generator</h1>
          <p className="hero-tagline">Create Viral Reels Automatically Using AI</p>
          <p className="hero-description">
            Transform any idea into a professional Instagram Reel in under 2 minutes. 
            Text-to-video AI technology with voiceover, music, captions, and effects.
          </p>
          
          <ul className="hero-features">
            <li><FiCheck /> Text-to-video AI generation</li>
            <li><FiCheck /> 50+ AI voiceover options</li>
            <li><FiCheck /> Auto captions & effects</li>
            <li><FiCheck /> Instagram-optimized format</li>
          </ul>

          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              Try Free - No Credit Card <FiArrowRight />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Watch Demo <FaPlay />
            </Link>
          </div>

          <div className="hero-trust">
            <span>⭐ 4.9/5 from 2,800+ reviews</span>
            <span>🎥 2M+ videos generated</span>
          </div>
        </div>
      </header>

      {/* Video Demo Section */}
      <section className="demo-section">
        <div className="demo-container">
          <h2>See AI Video Generation in Action</h2>
          <div className="demo-video-placeholder">
            <FaVideo className="demo-icon" />
            <p>AI Video Generator Demo</p>
            <span>Enter prompt → AI generates video → Publish to Instagram</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works-section">
        <h2>How to Create Instagram Reels with AI</h2>
        <p className="section-subtitle">From idea to viral Reel in 6 simple steps</p>
        
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
            Start Creating Videos <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <h2>AI Video Generator Features</h2>
        <p className="section-subtitle">Everything you need to create professional Instagram videos</p>
        
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

      {/* Use Cases */}
      <section className="use-cases-section">
        <h2>What Can You Create with AI Video Generator?</h2>
        <p className="section-subtitle">Perfect for any Instagram content strategy</p>
        
        <div className="use-cases-grid">
          {useCases.map((useCase, index) => (
            <div key={index} className="use-case-card">
              <FaCheck className="use-case-icon" />
              <h3>{useCase.title}</h3>
              <p>{useCase.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="social-proof-section">
        <h2>Trusted by 15,000+ Instagram Creators</h2>
        <div className="stats-row">
          <div className="stat">
            <span className="stat-number">2M+</span>
            <span className="stat-label">Videos Generated</span>
          </div>
          <div className="stat">
            <span className="stat-number">40%</span>
            <span className="stat-label">Higher Engagement</span>
          </div>
          <div className="stat">
            <span className="stat-number">10x</span>
            <span className="stat-label">Faster Content Creation</span>
          </div>
          <div className="stat">
            <span className="stat-number">50+</span>
            <span className="stat-label">Countries</span>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="pricing-preview-section">
        <h2>Start Creating AI Videos Today</h2>
        <div className="pricing-cards">
          <div className="pricing-card">
            <h3>Free</h3>
            <div className="price">$0<span>/month</span></div>
            <ul>
              <li><FiCheck /> 3 AI videos/month</li>
              <li><FiCheck /> Basic templates</li>
              <li><FiCheck /> AI captions</li>
            </ul>
            <Link to="/register" className="btn btn-outline">Start Free</Link>
          </div>
          <div className="pricing-card popular">
            <div className="popular-badge">Most Popular</div>
            <h3>Pro</h3>
            <div className="price">$29<span>/month</span></div>
            <ul>
              <li><FiCheck /> 50 AI videos/month</li>
              <li><FiCheck /> AI voiceover (50+ voices)</li>
              <li><FiCheck /> Premium templates</li>
              <li><FiCheck /> Priority rendering</li>
            </ul>
            <Link to="/register" className="btn btn-primary">Start 14-Day Free Trial</Link>
          </div>
          <div className="pricing-card">
            <h3>Business</h3>
            <div className="price">$79<span>/month</span></div>
            <ul>
              <li><FiCheck /> Unlimited AI videos</li>
              <li><FiCheck /> Team access</li>
              <li><FiCheck /> Custom branding</li>
              <li><FiCheck /> API access</li>
            </ul>
            <Link to="/contact" className="btn btn-outline">Contact Us</Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <h2>Frequently Asked Questions About AI Video Generation</h2>
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
        <h2>Ready to Create Viral Instagram Reels with AI?</h2>
        <p>Join 15,000+ creators using AI to grow their Instagram</p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Start Free - Generate Your First Video <FiArrowRight />
        </Link>
        <p className="cta-note">No credit card required • 14-day Pro trial • Cancel anytime</p>
      </section>
    </main>
  );
};

export default AIInstagramVideoGenerator;
