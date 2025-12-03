import React, { useState } from 'react';
import { FiImage, FiZap, FiArrowLeft, FiArrowRight, FiRefreshCw, FiDownload, FiCopy, FiCheckCircle, FiTarget, FiStar, FiRepeat, FiSquare, FiSmartphone, FiMonitor, FiEdit3, FiLoader } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './BusinessImage.css';

const BusinessImage = () => {
  const navigate = useNavigate();
  
  // Current step (1, 2, or 3)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Prompt
  const [prompt, setPrompt] = useState('');
  const [showAdvice, setShowAdvice] = useState(false);
  const [aiAdvice, setAiAdvice] = useState([]);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  
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
  const [generationError, setGenerationError] = useState(null);

  // Post type options
  const postTypes = [
    { id: 'ad', label: 'Ad', icon: FiTarget, description: 'Promotional advertisement' },
    { id: 'highlights', label: 'Highlights', icon: FiStar, description: 'Key features showcase' },
    { id: 'before-after', label: 'Before-After', icon: FiRepeat, description: 'Transformation comparison' },
    { id: 'review', label: 'Review', icon: FiCheckCircle, description: 'Customer testimonial' }
  ];

  // Aspect ratio options with Replicate-compatible formats
  const aspectRatios = [
    { id: '1:1', label: '1:1', icon: FiSquare, description: 'Square' },
    { id: '4:5', label: '4:5', icon: FiSmartphone, description: 'Portrait' },
    { id: '9:16', label: '9:16', icon: FiSmartphone, description: 'Story' },
    { id: '16:9', label: '16:9', icon: FiMonitor, description: 'Landscape' }
  ];

  // Generate AI advice based on user's prompt
  const generateAIAdvice = async () => {
    setIsLoadingAdvice(true);
    setShowAdvice(true);
    
    try {
      const basePrompt = prompt.trim() || 'business marketing';
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Based on this image idea: "${basePrompt}"
          
Generate 6 creative and specific AI image prompts that would work great for Instagram business posts. 

For each suggestion, provide a detailed visual description that an AI image generator can understand. Include:
- Visual composition and layout
- Color palette and mood
- Lighting style
- Background elements
- Any text overlay suggestions

Format your response as JSON array with this structure:
[
  {"category": "Category Name", "prompt": "Detailed image prompt..."},
  ...
]

Categories should be relevant like: "Product Focus", "Lifestyle Shot", "Bold Typography", "Minimalist", "Premium Feel", "Social Proof"

Return ONLY the JSON array, no other text.`
        })
      });

      const data = await response.json();
      
      if (data.response) {
        try {
          // Extract JSON from the response
          let jsonStr = data.response;
          const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            jsonStr = jsonMatch[0];
          }
          const suggestions = JSON.parse(jsonStr);
          setAiAdvice(suggestions);
        } catch (parseError) {
          // Fallback to default suggestions if parsing fails
          setAiAdvice(getDefaultAdvice(basePrompt));
        }
      } else {
        setAiAdvice(getDefaultAdvice(basePrompt));
      }
    } catch (error) {
      console.error('AI Advice error:', error);
      setAiAdvice(getDefaultAdvice(prompt || 'product'));
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  // Default fallback advice
  const getDefaultAdvice = (topic) => [
    {
      category: 'Product Showcase',
      prompt: `Professional product photography of ${topic}, centered composition on white marble surface, soft natural lighting from the left, subtle shadows, clean minimalist aesthetic, high-end commercial look, 4K quality`
    },
    {
      category: 'Lifestyle Shot',
      prompt: `Lifestyle photography featuring ${topic} in a modern home setting, warm natural lighting, bokeh background, person using the product naturally, authentic and relatable mood, Instagram aesthetic`
    },
    {
      category: 'Bold Typography',
      prompt: `Eye-catching marketing graphic for ${topic}, bold sans-serif typography, vibrant gradient background (purple to pink), modern geometric shapes, clean layout with ample white space, social media optimized`
    },
    {
      category: 'Premium Feel',
      prompt: `Luxury brand photography of ${topic}, dark moody background, golden accent lighting, reflective surface, premium packaging, sophisticated and elegant aesthetic, high contrast, magazine quality`
    },
    {
      category: 'Minimalist Design',
      prompt: `Ultra-minimalist product shot of ${topic}, pure white background, single light source creating soft shadows, centered composition, negative space, Scandinavian design aesthetic, clean and modern`
    },
    {
      category: 'Dynamic Action',
      prompt: `Dynamic action shot featuring ${topic}, motion blur effect, energetic composition, vibrant colors, high contrast, lifestyle context, young and modern vibe, social media engagement focused`
    }
  ];

  const handleUseAdvice = (advicePrompt) => {
    setPrompt(advicePrompt);
    setShowAdvice(false);
  };

  const handleCopyPrompt = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
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

  // Build optimized prompt for image generation
  const buildOptimizedPrompt = () => {
    const postTypeDescriptions = {
      'ad': 'promotional advertisement design, marketing focused, call-to-action oriented',
      'highlights': 'feature showcase, benefits focused, informative layout',
      'before-after': 'split comparison design, transformation visual, side by side layout',
      'review': 'testimonial style, social proof design, customer quote layout'
    };

    let enhancedPrompt = prompt;
    
    // Add post type context
    enhancedPrompt += `. Style: ${postTypeDescriptions[postType] || 'professional marketing design'}`;
    
    // Add content overlay hints if provided
    if (heading || subheading || cta) {
      enhancedPrompt += '. Design should include space for text overlay';
      if (heading) enhancedPrompt += ` with headline "${heading}"`;
      if (cta) enhancedPrompt += ` and button text "${cta}"`;
    }
    
    // Add quality modifiers
    enhancedPrompt += '. High quality, professional photography, sharp details, vibrant colors, Instagram-ready, commercial grade';
    
    return enhancedPrompt;
  };

  // Generate image using Replicate API
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const optimizedPrompt = buildOptimizedPrompt();
      
      console.log('Generating image with prompt:', optimizedPrompt);
      console.log('Aspect ratio:', aspectRatio);

      const response = await fetch('/api/ai/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: optimizedPrompt,
          aspectRatio: aspectRatio,
          numOutputs: 1,
          outputFormat: 'webp',
          outputQuality: 95
        })
      });

      const data = await response.json();

      if (data.success && data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        console.log('Image generated successfully:', data.imageUrl);
        
        // Save to Asset Hub
        try {
          const existingAssets = JSON.parse(localStorage.getItem('assetHub') || '[]');
          const newAsset = {
            id: Date.now().toString(),
            type: 'image',
            name: `AI Generated - ${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}`,
            url: data.imageUrl,
            caption: prompt,
            tags: [postType, aspectRatio].filter(Boolean),
            createdAt: new Date().toISOString(),
            source: 'BusinessImage',
            metadata: {
              aspectRatio,
              postType,
              heading,
              subheading,
              cta
            }
          };
          existingAssets.unshift(newAsset);
          localStorage.setItem('assetHub', JSON.stringify(existingAssets));
          console.log('Asset saved to Asset Hub');
        } catch (saveError) {
          console.error('Failed to save to Asset Hub:', saveError);
        }
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      setGenerationError(error.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download generated image
  const handleDownload = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-image-${Date.now()}.webp`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: open in new tab
      window.open(generatedImage, '_blank');
    }
  };

  // Regenerate image
  const handleRegenerate = () => {
    setGeneratedImage(null);
    handleGenerate();
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
                <p>Tell us what you want to create - be specific for best results</p>
              </div>

              <div className="prompt-card">
                <div className="prompt-input-row">
                  <textarea
                    className="prompt-textarea"
                    placeholder="Describe your image in detail...

Example: A premium skincare product bottle on white marble, soft natural lighting, minimalist composition, subtle water droplets, luxury spa aesthetic, clean background with eucalyptus leaves"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={6}
                  />
                  <button 
                    className="ai-advice-btn"
                    onClick={generateAIAdvice}
                    disabled={isLoadingAdvice}
                  >
                    {isLoadingAdvice ? (
                      <>
                        <FiLoader className="spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <FiZap />
                        <span>AI Advice</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Prompt tips */}
                <div className="prompt-tips">
                  <strong>💡 Tips for better results:</strong>
                  <ul>
                    <li>Describe the subject, composition, and mood</li>
                    <li>Mention lighting style (soft, dramatic, natural)</li>
                    <li>Include color palette or aesthetic (minimal, luxury, vibrant)</li>
                    <li>Specify background details</li>
                  </ul>
                </div>

                {/* AI Advice Panel */}
                {showAdvice && (
                  <div className="ai-advice-panel">
                    <div className="advice-header">
                      <FiZap className="advice-icon" />
                      <h3>AI-Generated Suggestions</h3>
                      <p className="advice-subtitle">Based on your idea: "{prompt || 'your topic'}"</p>
                    </div>
                    
                    {isLoadingAdvice ? (
                      <div className="advice-loading">
                        <FiLoader className="spin" />
                        <span>Generating personalized suggestions...</span>
                      </div>
                    ) : (
                      <div className="advice-list">
                        {aiAdvice.map((advice, idx) => (
                          <div key={idx} className="advice-item">
                            <div className="advice-category-badge">{advice.category}</div>
                            <p className="advice-prompt">{advice.prompt}</p>
                            <div className="advice-actions">
                              <button 
                                className="advice-btn use"
                                onClick={() => handleUseAdvice(advice.prompt)}
                              >
                                Use This
                              </button>
                              <button 
                                className="advice-btn copy"
                                onClick={() => handleCopyPrompt(advice.prompt)}
                              >
                                <FiCopy />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                  <h3><FiEdit3 /> Content Details (Optional)</h3>
                  <p className="content-hint">Add text to include in your design</p>
                  
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

              {/* Error Message */}
              {generationError && (
                <div className="generation-error">
                  <span>⚠️ {generationError}</span>
                  <button onClick={() => setGenerationError(null)}>Dismiss</button>
                </div>
              )}

              {/* Generated Image Preview */}
              {generatedImage && (
                <div className="generated-result">
                  <h3>🎉 Generated Image</h3>
                  <div className="result-preview">
                    <img src={generatedImage} alt="Generated" />
                    <div className="result-actions">
                      <button className="result-btn primary" onClick={handleDownload}>
                        <FiDownload />
                        <span>Download</span>
                      </button>
                      <button className="result-btn" onClick={handleRegenerate}>
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
                      <span>Generating... (30-60s)</span>
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
