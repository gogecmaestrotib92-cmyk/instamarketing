import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiLayers,
  FiArrowLeft,
  FiRefreshCw,
  FiCopy,
  FiCheck,
  FiZap,
  FiEdit3,
  FiChevronLeft,
  FiChevronRight,
  FiSave
} from 'react-icons/fi';
import api from '../services/api';
import { saveCarouselToHub } from '../services/assetService';
import './CarouselCreate.css';

const CarouselCreate = () => {
  const navigate = useNavigate();
  
  // Form state
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('');
  const [slideCount, setSlideCount] = useState(5);
  const [tone, setTone] = useState('professional');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [slides, setSlides] = useState([]);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [error, setError] = useState(null);
  
  // Preview state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copiedField, setCopiedField] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedToHub, setSavedToHub] = useState(false);
  
  // Carousel ref for touch events
  const carouselRef = useRef(null);
  const touchStartX = useRef(0);

  // Tone options
  const toneOptions = [
    { id: 'professional', label: 'Professional', emoji: '💼' },
    { id: 'casual', label: 'Casual', emoji: '😊' },
    { id: 'inspiring', label: 'Inspiring', emoji: '✨' },
    { id: 'educational', label: 'Educational', emoji: '📚' },
    { id: 'humorous', label: 'Humorous', emoji: '😄' },
    { id: 'bold', label: 'Bold & Direct', emoji: '🔥' }
  ];

  // Niche suggestions
  const nicheSuggestions = [
    'Marketing', 'Fitness', 'Finance', 'Tech', 'Lifestyle', 
    'Business', 'Health', 'Travel', 'Food', 'Fashion'
  ];

  // Generate carousel
  const generateCarousel = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSlides([]);

    try {
      const response = await api.post('/ai/generate-carousel', {
        topic: topic.trim(),
        niche: niche.trim() || 'General',
        slideCount: parseInt(slideCount),
        tone
      });

      if (response.data.success) {
        setSlides(response.data.slides);
        setCaption(response.data.caption || '');
        setHashtags(response.data.hashtags || []);
        setCurrentSlide(0);
      } else {
        setError(response.data.error || 'Failed to generate carousel');
      }
    } catch (err) {
      console.error('Carousel generation error:', err);
      setError(err.response?.data?.error || 'Failed to generate carousel. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Navigation
  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Save to Asset Hub
  const saveToAssetHub = async () => {
    if (slides.length === 0) return;
    
    setIsSaving(true);
    try {
      await saveCarouselToHub({
        slides,
        caption,
        hashtags,
        topic,
        niche,
        tone
      });
      setSavedToHub(true);
      setTimeout(() => setSavedToHub(false), 3000);
    } catch (err) {
      console.error('Save to hub failed:', err);
      setError('Failed to save to Asset Hub');
    } finally {
      setIsSaving(false);
    }
  };

  // Get gradient for slide
  const getSlideGradient = (index) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="carousel-create-page">
      <div className="carousel-create-container">
        {/* Header */}
        <header className="page-header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <FiArrowLeft />
          </button>
          <div className="header-content">
            <h1>
              <FiLayers className="header-icon" />
              Create Carousel
            </h1>
            <p>Generate engaging multi-slide carousel posts for Instagram</p>
          </div>
        </header>

        <div className="carousel-create-content">
          {/* Form Section */}
          <div className="form-section">
            <div className="form-card">
              <h3><FiEdit3 /> Carousel Details</h3>
              
              {/* Topic */}
              <div className="input-group">
                <label>Topic / Main Idea <span className="required">*</span></label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., 5 Tips to Boost Your Productivity"
                  className="topic-input"
                />
              </div>

              {/* Niche */}
              <div className="input-group">
                <label>Niche / Industry</label>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g., Business, Fitness, Marketing..."
                />
                <div className="niche-suggestions">
                  {nicheSuggestions.map((n) => (
                    <button
                      key={n}
                      className={`niche-tag ${niche === n ? 'active' : ''}`}
                      onClick={() => setNiche(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slide Count */}
              <div className="input-group">
                <label>Number of Slides</label>
                <div className="slide-count-selector">
                  {[3, 4, 5, 6, 7, 8, 10].map((count) => (
                    <button
                      key={count}
                      className={`count-btn ${slideCount === count ? 'active' : ''}`}
                      onClick={() => setSlideCount(count)}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone */}
              <div className="input-group">
                <label>Tone / Style</label>
                <div className="tone-selector">
                  {toneOptions.map((t) => (
                    <button
                      key={t.id}
                      className={`tone-btn ${tone === t.id ? 'active' : ''}`}
                      onClick={() => setTone(t.id)}
                    >
                      <span className="tone-emoji">{t.emoji}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button 
                className="btn-generate"
                onClick={generateCarousel}
                disabled={isGenerating || !topic.trim()}
              >
                {isGenerating ? (
                  <>
                    <FiRefreshCw className="spin" />
                    Generating Carousel...
                  </>
                ) : (
                  <>
                    <FiZap />
                    Generate Carousel
                  </>
                )}
              </button>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Preview Section */}
          <div className="preview-section">
            {slides.length > 0 ? (
              <>
                {/* Carousel Preview */}
                <div className="carousel-preview-card">
                  <div className="carousel-header">
                    <h3>Preview</h3>
                    <span className="slide-counter">
                      {currentSlide + 1} / {slides.length}
                    </span>
                  </div>

                  <div 
                    className="carousel-container"
                    ref={carouselRef}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    {/* Navigation Arrows */}
                    <button 
                      className="carousel-nav prev"
                      onClick={prevSlide}
                      disabled={slides.length <= 1}
                    >
                      <FiChevronLeft />
                    </button>

                    {/* Slide */}
                    <div 
                      className="carousel-slide"
                      style={{ background: getSlideGradient(currentSlide) }}
                    >
                      <div className="slide-content">
                        {slides[currentSlide]?.slideNumber && (
                          <div className="slide-number">
                            {String(slides[currentSlide].slideNumber).padStart(2, '0')}
                          </div>
                        )}
                        <h2 className="slide-title">
                          {slides[currentSlide]?.title || slides[currentSlide]?.headline}
                        </h2>
                        <p className="slide-body">
                          {slides[currentSlide]?.content || slides[currentSlide]?.body}
                        </p>
                        {slides[currentSlide]?.tip && (
                          <div className="slide-tip">
                            💡 {slides[currentSlide].tip}
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      className="carousel-nav next"
                      onClick={nextSlide}
                      disabled={slides.length <= 1}
                    >
                      <FiChevronRight />
                    </button>
                  </div>

                  {/* Dots */}
                  <div className="carousel-dots">
                    {slides.map((_, index) => (
                      <button
                        key={index}
                        className={`dot ${currentSlide === index ? 'active' : ''}`}
                        onClick={() => goToSlide(index)}
                      />
                    ))}
                  </div>
                </div>

                {/* Caption Section */}
                <div className="caption-card">
                  <div className="caption-header">
                    <h3>Caption</h3>
                    <button 
                      className="btn-copy"
                      onClick={() => copyToClipboard(caption, 'caption')}
                    >
                      {copiedField === 'caption' ? <FiCheck /> : <FiCopy />}
                      {copiedField === 'caption' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={4}
                    placeholder="Caption will appear here..."
                  />
                </div>

                {/* Hashtags */}
                <div className="hashtags-card">
                  <div className="hashtags-header">
                    <h3>Hashtags</h3>
                    <button 
                      className="btn-copy"
                      onClick={() => copyToClipboard(hashtags.join(' '), 'hashtags')}
                    >
                      {copiedField === 'hashtags' ? <FiCheck /> : <FiCopy />}
                      {copiedField === 'hashtags' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="hashtags-list">
                    {hashtags.map((tag, index) => (
                      <span key={index} className="hashtag">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="preview-actions">
                  <button 
                    className="btn-regenerate"
                    onClick={generateCarousel}
                    disabled={isGenerating}
                  >
                    <FiRefreshCw className={isGenerating ? 'spin' : ''} />
                    Regenerate
                  </button>
                  <button 
                    className="btn-save"
                    onClick={saveToAssetHub}
                    disabled={isSaving || savedToHub}
                  >
                    {savedToHub ? (
                      <>
                        <FiCheck />
                        Saved!
                      </>
                    ) : isSaving ? (
                      <>
                        <FiRefreshCw className="spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave />
                        Save to Hub
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-preview">
                <FiLayers className="empty-icon" />
                <h3>Your carousel will appear here</h3>
                <p>Fill in the details and click "Generate Carousel" to create your slides</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarouselCreate;
