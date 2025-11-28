import React from 'react';
import { Link } from 'react-router-dom';
import { FaMagic, FaSmile, FaHashtag, FaBolt, FaLanguage, FaStar, FaCheck, FaQuoteLeft, FaPen } from 'react-icons/fa';
import { FiArrowRight, FiCheck, FiTarget, FiTrendingUp, FiEdit } from 'react-icons/fi';
import SEO from '../../components/SEO';
import './LandingPages.css';

const AICaptionGenerator = () => {
  const features = [
    {
      icon: FaMagic,
      title: 'GPT-4 Powered',
      description: 'Advanced AI trained on millions of high-performing Instagram captions. Understands what makes content go viral.'
    },
    {
      icon: FiEdit,
      title: 'Multiple Variations',
      description: 'Generate 5-10 caption options at once. Choose the perfect one or mix and match elements.'
    },
    {
      icon: FaSmile,
      title: 'Tone Selection',
      description: 'Choose your vibe: Professional, Casual, Fun, Inspirational, or Educational. AI adapts to your brand voice.'
    },
    {
      icon: FaHashtag,
      title: 'Hashtag Integration',
      description: 'AI suggests relevant hashtags alongside your caption for maximum reach and discoverability.'
    },
    {
      icon: FaBolt,
      title: 'Instant Generation',
      description: 'Get multiple caption options in seconds. No more staring at a blank screen for hours.'
    },
    {
      icon: FaLanguage,
      title: 'Multi-Language',
      description: 'Generate captions in 50+ languages. Perfect for global brands and multilingual audiences.'
    }
  ];

  const captionStyles = [
    { name: 'Engaging Hook', example: '"Stop scrolling if you want to..."', use: 'Grab attention instantly' },
    { name: 'Story Format', example: '"Here\'s what happened when I..."', use: 'Build connection' },
    { name: 'Question Hook', example: '"What would you do if..."', use: 'Drive comments' },
    { name: 'Value-First', example: '"3 tips that changed my..."', use: 'Provide immediate value' },
    { name: 'Controversial', example: '"Unpopular opinion but..."', use: 'Spark engagement' },
    { name: 'Relatable', example: '"POV: You just realized..."', use: 'Build community' }
  ];

  const faqs = [
    {
      question: 'What is an AI Caption Generator for Instagram?',
      answer: 'An AI Caption Generator uses artificial intelligence to automatically write engaging Instagram captions based on your input. AIInstaMarketing\'s caption generator uses GPT-4 to create captions with strong hooks, optimal length, strategic emojis, and clear calls-to-action. Simply describe your post or upload an image, and AI generates multiple caption options.'
    },
    {
      question: 'How do I write better Instagram captions?',
      answer: 'Great Instagram captions have: 1) Strong hook in the first line (this shows before "more"), 2) Value or story in the body, 3) Clear call-to-action (question, instruction), 4) Strategic emoji use, 5) Line breaks for readability. AI caption generators analyze what works and apply these principles automatically.'
    },
    {
      question: 'How long should Instagram captions be?',
      answer: 'Caption length depends on content type: Feed posts perform best at 125-150 characters (shows fully), Carousel posts can be longer (1,000+ characters) as users are more engaged, Reels captions should be short (50-100 characters) as focus is on video. Our AI automatically adjusts length based on post type.'
    },
    {
      question: 'Can AI captions sound natural?',
      answer: 'Yes! Modern AI like GPT-4 generates remarkably human-sounding text. Our system is fine-tuned specifically for Instagram style - understanding slang, trends, emoji use, and platform-specific writing patterns. Most users can\'t tell AI captions from human-written ones.'
    },
    {
      question: 'Should I include emojis in captions?',
      answer: 'Yes! Emojis increase engagement by 47.7% on average. They add personality, break up text, and draw the eye. Our AI strategically places emojis - not too many (looks spammy), but enough to add visual interest and emotion. You can adjust emoji level in settings.'
    },
    {
      question: 'How do I add call-to-actions in captions?',
      answer: 'Effective CTAs include: Questions ("What do you think?"), Instructions ("Double tap if you agree"), Engagement prompts ("Tag someone who needs this"), Save prompts ("Save this for later"). Our AI automatically includes appropriate CTAs based on your content type and goal.'
    },
    {
      question: 'Is the caption generator free?',
      answer: 'Yes! Free plan includes 20 AI-generated captions per month. Pro plan ($29/month) offers unlimited captions, multiple tone options, and hashtag integration. All plans include 14-day Pro trial so you can test all features.'
    },
    {
      question: 'Can AI generate captions for Reels?',
      answer: 'Absolutely! Select "Reels" as your content type, and AI generates short, punchy captions optimized for video content. Reels captions focus on hooks and CTAs since the video provides context. AI also suggests trending sounds and hashtags specific to Reels.'
    }
  ];

  const examples = [
    {
      input: 'Coffee shop product photo',
      output: '☕ That first sip hits different...\n\nWhen your morning ritual is this good, everything else falls into place.\n\nWhat\'s your go-to coffee order? Drop it below 👇',
      engagement: '+47% engagement'
    },
    {
      input: 'Fitness transformation',
      output: '365 days ago, I made a promise to myself.\n\nNo shortcuts. No excuses. Just consistency.\n\nSwipe to see where I started ➡️\n\nThe secret? There is no secret. Just showing up. Every. Single. Day.',
      engagement: '+62% saves'
    },
    {
      input: 'Travel photo',
      output: 'Found a place where WiFi is weak but the connection is strong ✨\n\nSometimes you need to get lost to find yourself.\n\n📍 Tag someone you\'d explore this with!',
      engagement: '+38% shares'
    }
  ];

  return (
    <main className="landing-page">
      <SEO 
        title="AI Caption Generator for Instagram | Write Viral Captions 2025"
        description="Generate engaging Instagram captions with AI. GPT-4 powered caption writer creates viral captions in seconds. Multiple tones, hashtag suggestions, emoji optimization. Free trial!"
        keywords="AI caption generator Instagram, Instagram caption generator, AI captions for Instagram, caption writer AI, how to write Instagram captions, best captions for Instagram, Instagram caption ideas, GPT-4 caption generator 2025"
        url="/ai-caption-generator"
        faq={faqs}
      />

      {/* Hero Section */}
      <header className="landing-hero">
        <div className="landing-hero-content">
          <div className="hero-badge">✍️ GPT-4 Powered Captions</div>
          <h1>AI Caption Generator for Instagram</h1>
          <p className="hero-tagline">Write Scroll-Stopping Captions in Seconds</p>
          <p className="hero-description">
            Never stare at a blank screen again. AI generates engaging captions 
            with perfect hooks, CTAs, and emojis. Trained on millions of viral posts.
          </p>
          
          <ul className="hero-features">
            <li><FiCheck /> GPT-4 powered AI</li>
            <li><FiCheck /> Multiple tone options</li>
            <li><FiCheck /> Hashtag suggestions</li>
            <li><FiCheck /> 50+ languages</li>
          </ul>

          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              Generate Captions Free <FiArrowRight />
            </Link>
          </div>

          <div className="hero-trust">
            <span>⭐ 4.9/5 from 2,800+ reviews</span>
            <span>✍️ 10M+ captions generated</span>
          </div>
        </div>
      </header>

      {/* Example Captions */}
      <section className="examples-section">
        <h2>See AI Captions in Action</h2>
        <p className="section-subtitle">Real examples from our caption generator</p>
        
        <div className="examples-grid">
          {examples.map((example, index) => (
            <div key={index} className="example-card">
              <div className="example-input">
                <span className="input-label">Input:</span>
                <span>{example.input}</span>
              </div>
              <div className="example-output">
                <FaQuoteLeft className="quote-icon" />
                <p>{example.output}</p>
              </div>
              <div className="example-result">
                <FiTrendingUp /> {example.engagement}
              </div>
            </div>
          ))}
        </div>

        <Link to="/register" className="btn btn-primary">
          Generate Your Own Captions <FiArrowRight />
        </Link>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <h2>Caption Generator Features</h2>
        <p className="section-subtitle">Everything you need for perfect Instagram captions</p>
        
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

      {/* Caption Styles */}
      <section className="styles-section">
        <h2>Caption Styles That Go Viral</h2>
        <p className="section-subtitle">AI uses proven formats that drive engagement</p>
        
        <div className="styles-grid">
          {captionStyles.map((style, index) => (
            <div key={index} className="style-card">
              <h3>{style.name}</h3>
              <p className="style-example">{style.example}</p>
              <span className="style-use">{style.use}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works-section compact">
        <h2>How to Generate Instagram Captions</h2>
        
        <div className="steps-horizontal">
          <div className="step-h">
            <div className="step-number">1</div>
            <h3>Describe Your Post</h3>
            <p>Enter your topic, paste content, or upload an image</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step-h">
            <div className="step-number">2</div>
            <h3>Choose Tone</h3>
            <p>Select Professional, Fun, Inspirational, or Custom</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step-h">
            <div className="step-number">3</div>
            <h3>Get Captions</h3>
            <p>AI generates multiple options in seconds</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step-h">
            <div className="step-number">4</div>
            <h3>Copy & Post</h3>
            <p>Pick your favorite and publish</p>
          </div>
        </div>

        <div className="steps-cta">
          <Link to="/register" className="btn btn-primary btn-lg">
            Start Generating Captions <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* Social Proof */}
      <section className="social-proof-section">
        <h2>Why Creators Love Our Caption Generator</h2>
        <div className="stats-row">
          <div className="stat">
            <span className="stat-number">10M+</span>
            <span className="stat-label">Captions Generated</span>
          </div>
          <div className="stat">
            <span className="stat-number">47%</span>
            <span className="stat-label">Higher Engagement</span>
          </div>
          <div className="stat">
            <span className="stat-number">5 sec</span>
            <span className="stat-label">Generation Time</span>
          </div>
          <div className="stat">
            <span className="stat-number">50+</span>
            <span className="stat-label">Languages</span>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="pricing-preview-section">
        <h2>Start Writing Better Captions Today</h2>
        <div className="pricing-cards">
          <div className="pricing-card">
            <h3>Free</h3>
            <div className="price">$0<span>/month</span></div>
            <ul>
              <li><FiCheck /> 20 captions/month</li>
              <li><FiCheck /> 3 tone options</li>
              <li><FiCheck /> Basic hashtags</li>
            </ul>
            <Link to="/register" className="btn btn-outline">Start Free</Link>
          </div>
          <div className="pricing-card popular">
            <div className="popular-badge">Most Popular</div>
            <h3>Pro</h3>
            <div className="price">$29<span>/month</span></div>
            <ul>
              <li><FiCheck /> Unlimited captions</li>
              <li><FiCheck /> All tone options</li>
              <li><FiCheck /> Advanced hashtags</li>
              <li><FiCheck /> Multi-language</li>
              <li><FiCheck /> Caption history</li>
            </ul>
            <Link to="/register" className="btn btn-primary">Start 14-Day Free Trial</Link>
          </div>
          <div className="pricing-card">
            <h3>Business</h3>
            <div className="price">$79<span>/month</span></div>
            <ul>
              <li><FiCheck /> Everything in Pro</li>
              <li><FiCheck /> Brand voice training</li>
              <li><FiCheck /> Team access</li>
              <li><FiCheck /> API access</li>
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
        <h2>Stop Struggling with Instagram Captions</h2>
        <p>Let AI write captions that actually convert</p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Generate Your First Caption Free <FiArrowRight />
        </Link>
        <p className="cta-note">No credit card required • 14-day Pro trial • Cancel anytime</p>
      </section>
    </main>
  );
};

export default AICaptionGenerator;
