import React, { useState } from 'react';
import { FiImage, FiZap, FiArrowLeft, FiArrowRight, FiRefreshCw, FiDownload, FiCopy, FiCheckCircle, FiTarget, FiStar, FiRepeat, FiSquare, FiSmartphone, FiMonitor, FiEdit3 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './BusinessImage.css';

const BusinessImage = () => {
  const navigate = useNavigate();
  
  // Current step (1, 2, or 3)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Prompt
  const [prompt, setPrompt] = useState('');
  const [showAdvice, setShowAdvice] = useState(false);
  
  // Step 2: Settings
  const [brandLinked, setBrandLinked] = useState(true);
  const [postType, setPostType] = useState('ad');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  
  // Step 3: Content details
  const [heading, setHeading] = useState('');
  const [subheading, setSubheading] = useState('');
  const [cta, setCta] = useState('');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  // AI advice examples
  const aiAdviceExamples = [
    {
      category: 'Product Launch',
      examples: [
        'Minimalist product showcase with soft shadows on white marble background',
        'Premium product floating with golden light rays and luxury feel',
        'Modern tech product with futuristic neon glow and dark background'
      ]
    },
    {
      category: 'Sale & Promotion',
      examples: [
        'Bold "50% OFF" text with confetti and celebration vibes',
        'Flash sale banner with countdown timer aesthetic and urgency',
        'Seasonal discount graphic with festive colors and decorations'
      ]
    },
    {
      category: 'Brand Awareness',
      examples: [
        'Inspirational quote with elegant typography on gradient background',
        'Behind-the-scenes style image showing brand authenticity',
        'Lifestyle shot featuring product in real-world setting'
      ]
    },
    {
      category: 'Social Proof',
      examples: [
        'Customer testimonial card with star ratings and clean design',
        'Before/after comparison split image with dramatic effect',
        'User-generated content style with authentic feel'
      ]
    }
  ];

  // Post type options
  const postTypes = [
    { id: 'ad', label: 'Ad', icon: FiTarget, description: 'Promotional advertisement' },
    { id: 'highlights', label: 'Highlights', icon: FiStar, description: 'Key features showcase' },
    { id: 'before-after', label: 'Before-After', icon: FiRepeat, description: 'Transformation comparison' },
    { id: 'review', label: 'Review', icon: FiCheckCircle, description: 'Customer testimonial' }
  ];

  // Aspect ratio options
  const aspectRatios = [
    { id: '1:1', label: '1:1', icon: FiSquare, description: 'Square' },
    { id: '4:5', label: '4:5', icon: FiSmartphone, description: 'Portrait' },
    { id: '9:16', label: '9:16', icon: FiSmartphone, description: 'Story' },
    { id: '16:9', label: '16:9', icon: FiMonitor, description: 'Landscape' }
  ];

  const handleUseAdvice = (example) => {
    setPrompt(example);
    setShowAdvice(false);
  };

  const handleCopyPrompt = (example) => {
    navigator.clipboard.writeText(example);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    // TODO: Connect to actual image generation API
    await new Promise(resolve => setTimeout(resolve, 2500));
    setGeneratedImage('/api/placeholder/1024/1024');
    setIsGenerating(false);
  };

  const canProceedStep1 = prompt.trim().length > 0;
  const canProceedStep2 = postType && aspectRatio;

  return (
    <div className="business-image-page">
      <div className="business-image-container">
        {/* Header */}
        <div className="page-header-row">
          <button className="back-btn" onClick={() => navigate('/app/create/business')}>
            <FiArrowLeft />
            <span>Back</span>
          </button>
          <div className="page-title">
            <FiImage className="title-icon" />
            <div>
              <h1>Text to Image</h1>
              <p>Create stunning AD & stacking designs with AI</p>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <span>Visual Idea</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <span>Settings</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Review</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="step-content">
          
          {/* STEP 1: Visual Idea */}
          {currentStep === 1 && (
            <div className="step-panel">
              <div className="step-header">
                <span className="step-label">Step 1 of 3</span>
                <h2>Describe Your Visual Idea</h2>
                <p>Tell us what you want to create</p>
              </div>

              <div className="prompt-card">
                <div className="prompt-input-row">
                  <textarea
                    className="prompt-textarea"
                    placeholder="Describe your image idea... e.g., 'A clean and inviting layout showcasing nasal strips, with a background that evokes freshness and clarity'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={5}
                  />
                  <button 
                    className="ai-advice-btn"
                    onClick={() => setShowAdvice(!showAdvice)}
                  >
                    <FiZap />
                    <span>AI Advice</span>
                  </button>
                </div>

                {/* AI Advice Panel */}
                {showAdvice && (
                  <div className="ai-advice-panel">
                    <div className="advice-header">
                      <FiZap className="advice-icon" />
                      <h3>AI Inspiration</h3>
                    </div>
                    <div className="advice-categories">
                      {aiAdviceExamples.map((category, idx) => (
                        <div key={idx} className="advice-category">
                          <h4>{category.category}</h4>
                          <div className="advice-examples">
                            {category.examples.map((example, exIdx) => (
                              <div key={exIdx} className="advice-example">
                                <p>{example}</p>
                                <div className="example-actions">
                                  <button 
                                    className="example-btn use"
                                    onClick={() => handleUseAdvice(example)}
                                  >
                                    Use
                                  </button>
                                  <button 
                                    className="example-btn copy"
                                    onClick={() => handleCopyPrompt(example)}
                                  >
                                    <FiCopy />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="step-actions">
                <div></div>
                <button 
                  className="btn-next"
                  onClick={handleNext}
                  disabled={!canProceedStep1}
                >
                  <span>Next</span>
                  <FiArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Settings */}
          {currentStep === 2 && (
            <div className="step-panel">
              <div className="step-header">
                <span className="step-label">Step 2 of 3</span>
                <h2>Configure Settings</h2>
                <p>Set your brand preferences and format</p>
              </div>

              <div className="settings-card">
                {/* Brand Details */}
                <div className="setting-group">
                  <div className="setting-row">
                    <div>
                      <h3>Brand Details</h3>
                      <p className="setting-desc">
                        {brandLinked 
                          ? '✓ Brand identity will be applied to the image'
                          : 'Generic styling will be used'}
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={brandLinked} 
                        onChange={(e) => setBrandLinked(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                {/* Post Type */}
                <div className="setting-group">
                  <h3>Post Type</h3>
                  <div className="option-grid">
                    {postTypes.map((type) => (
                      <button
                        key={type.id}
                        className={`option-card ${postType === type.id ? 'selected' : ''}`}
                        onClick={() => setPostType(type.id)}
                      >
                        <type.icon className="option-icon" />
                        <span className="option-label">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div className="setting-group">
                  <h3>Aspect Ratio</h3>
                  <div className="option-grid">
                    {aspectRatios.map((ratio) => (
                      <button
                        key={ratio.id}
                        className={`option-card ratio-card ${aspectRatio === ratio.id ? 'selected' : ''}`}
                        onClick={() => setAspectRatio(ratio.id)}
                      >
                        <div className={`ratio-preview ratio-${ratio.id.replace(':', '-')}`}></div>
                        <span className="option-label">{ratio.label}</span>
                        <span className="option-desc">{ratio.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="step-actions">
                <button className="btn-back" onClick={handleBack}>
                  <FiArrowLeft />
                  <span>Back</span>
                </button>
                <button 
                  className="btn-next"
                  onClick={handleNext}
                  disabled={!canProceedStep2}
                >
                  <span>Next</span>
                  <FiArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Generate */}
          {currentStep === 3 && (
            <div className="step-panel">
              <div className="step-header">
                <span className="step-label">Step 3 of 3</span>
                <h2>Review & Confirm</h2>
                <p>Add final details and generate your image</p>
              </div>

              <div className="review-card">
                {/* Summary */}
                <div className="summary-section">
                  <h3>Summary</h3>
                  <div className="summary-item">
                    <strong>Visual Idea:</strong>
                    <p>• {prompt}</p>
                  </div>
                  <div className="summary-tags">
                    <span className="tag">{postTypes.find(t => t.id === postType)?.label}</span>
                    <span className="tag">{aspectRatio}</span>
                    {brandLinked && <span className="tag brand">Brand Linked</span>}
                  </div>
                </div>

                {/* Content Details */}
                <div className="content-details">
                  <h3><FiEdit3 /> Content Details</h3>
                  
                  <div className="input-group">
                    <label>Heading</label>
                    <input
                      type="text"
                      placeholder="e.g., Experience the Benefits of Easy Breathing"
                      value={heading}
                      onChange={(e) => setHeading(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label>Subheading</label>
                    <input
                      type="text"
                      placeholder="e.g., Discover how our product can enhance your comfort"
                      value={subheading}
                      onChange={(e) => setSubheading(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label>CTA (Call to Action)</label>
                    <input
                      type="text"
                      placeholder="e.g., Learn More, Shop Now, Get Started"
                      value={cta}
                      onChange={(e) => setCta(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Generated Image Preview */}
              {generatedImage && (
                <div className="generated-result">
                  <h3>Generated Image</h3>
                  <div className="result-preview">
                    <img src={generatedImage} alt="Generated" />
                    <div className="result-actions">
                      <button className="result-btn">
                        <FiDownload />
                        <span>Download</span>
                      </button>
                      <button className="result-btn" onClick={() => setGeneratedImage(null)}>
                        <FiRefreshCw />
                        <span>Regenerate</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="step-actions">
                <button className="btn-back" onClick={handleBack}>
                  <FiArrowLeft />
                  <span>Back</span>
                </button>
                <button 
                  className="btn-generate"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <FiRefreshCw className="spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <FiImage />
                      <span>Generate Image</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BusinessImage;
