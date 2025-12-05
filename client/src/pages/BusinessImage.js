import React, { useState, useEffect } from 'react';
import { FiImage, FiZap, FiArrowLeft, FiArrowRight, FiRefreshCw, FiDownload, FiEdit3, FiBriefcase, FiEdit2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { saveImageToHub } from '../services/assetService';
import './BusinessImage.css';

const BusinessImage = () => {
  const navigate = useNavigate();
  
  // Current step (1, 2, or 3)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Business Info from Business Hub - REQUIRED for this feature
  const [connectedBrand, setConnectedBrand] = useState(null);
  
  // Step 1: Ad Campaign Type
  const [campaignType, setCampaignType] = useState('product-showcase');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customProductName, setCustomProductName] = useState('');
  
  // Step 2: Visual Style & Scene
  const [adScene, setAdScene] = useState('studio');
  const [visualMood, setVisualMood] = useState('premium');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  
  // Step 3: Details & Generation
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [selectedReferenceImage, setSelectedReferenceImage] = useState(null);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generationError, setGenerationError] = useState(null);
  
  // Load business info on mount - REQUIRED
  useEffect(() => {
    const saved = localStorage.getItem('businessInfo');
    if (saved) {
      const parsed = JSON.parse(saved);
      const hasData = parsed.businessName || parsed.description || parsed.industry;
      if (hasData) {
        setConnectedBrand(parsed);
        // Auto-select first product if available
        if (parsed.products && parsed.products.length > 0) {
          setSelectedProduct(parsed.products[0]);
        }
      }
    }
  }, []);
  
  // Check if brand is properly set up
  const hasBrandSetup = connectedBrand && (connectedBrand.businessName || connectedBrand.industry);
  const hasProducts = connectedBrand?.products && connectedBrand.products.length > 0;
  
  // Campaign types for brand ads
  const campaignTypes = [
    { id: 'product-showcase', label: 'Product Showcase', icon: '📦', description: 'Highlight your product beautifully' },
    { id: 'sale-promo', label: 'Sale / Promo', icon: '🏷️', description: 'Promotional ad for discounts' },
    { id: 'new-launch', label: 'New Launch', icon: '🚀', description: 'Announce new product/service' },
    { id: 'testimonial', label: 'Testimonial', icon: '⭐', description: 'Customer review style' },
    { id: 'lifestyle', label: 'Lifestyle', icon: '✨', description: 'Product in real-life context' },
    { id: 'behind-scenes', label: 'Behind the Scenes', icon: '🎬', description: 'Show your process/team' }
  ];
  
  // Scene/Setting options
  const adScenes = [
    { id: 'studio', label: 'Studio', description: 'Clean professional studio' },
    { id: 'lifestyle-home', label: 'Home Setting', description: 'Cozy home environment' },
    { id: 'outdoor', label: 'Outdoor', description: 'Natural outdoor scene' },
    { id: 'office', label: 'Office/Workspace', description: 'Professional workspace' },
    { id: 'abstract', label: 'Abstract', description: 'Creative abstract background' },
    { id: 'branded', label: 'Brand Colors', description: 'Your brand color palette' }
  ];
  
  // Visual mood options
  const visualMoods = [
    { id: 'premium', label: 'Premium', description: 'Luxury, high-end feel' },
    { id: 'minimal', label: 'Minimal', description: 'Clean, simple aesthetic' },
    { id: 'vibrant', label: 'Vibrant', description: 'Bold, colorful energy' },
    { id: 'warm', label: 'Warm', description: 'Cozy, inviting tones' },
    { id: 'professional', label: 'Professional', description: 'Corporate, trustworthy' },
    { id: 'playful', label: 'Playful', description: 'Fun, youthful vibe' }
  ];

  // Aspect ratio options
  const aspectRatios = [
    { id: '1:1', label: '1:1', description: 'Square - Feed Post' },
    { id: '4:5', label: '4:5', description: 'Portrait - Feed Post' },
    { id: '9:16', label: '9:16', description: 'Story/Reel' },
    { id: '16:9', label: '16:9', description: 'Landscape' }
  ];

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
  
  // Get the product name to use (selected or custom)
  const getProductName = () => {
    if (selectedProduct) return selectedProduct.name;
    if (customProductName.trim()) return customProductName.trim();
    return connectedBrand?.businessName || 'your product';
  };

  // Build intelligent brand-focused prompt
  const buildBrandPrompt = () => {
    const product = getProductName();
    const brand = connectedBrand;
    
    // Campaign type specific prompts
    const campaignPrompts = {
      'product-showcase': `Professional product photography of ${product}`,
      'sale-promo': `Eye-catching promotional image for ${product} sale/discount`,
      'new-launch': `Exciting new product launch announcement for ${product}`,
      'testimonial': `Customer testimonial style image featuring ${product}`,
      'lifestyle': `Lifestyle photography showing ${product} in real-life use`,
      'behind-scenes': `Behind the scenes look at ${brand?.businessName || 'the brand'}`
    };
    
    // Scene/setting descriptions
    const sceneDescriptions = {
      'studio': 'clean professional studio setting, controlled lighting, pristine background',
      'lifestyle-home': 'cozy home environment, natural lifestyle setting, lived-in authentic feel',
      'outdoor': 'natural outdoor environment, fresh air, natural sunlight',
      'office': 'modern professional workspace, office environment, business setting',
      'abstract': 'creative abstract background, artistic elements, unique visual design',
      'branded': `background using brand colors: ${brand?.brandColors?.join(', ') || 'professional tones'}`
    };
    
    // Visual mood descriptions
    const moodDescriptions = {
      'premium': 'luxury high-end aesthetic, sophisticated elegant look, premium quality feel',
      'minimal': 'clean minimalist design, simple composition, lots of negative space',
      'vibrant': 'bold vibrant colors, high energy, eye-catching visuals',
      'warm': 'warm inviting tones, cozy atmosphere, approachable feel',
      'professional': 'corporate professional look, trustworthy reliable aesthetic',
      'playful': 'fun playful vibe, youthful energy, casual friendly feel'
    };
    
    let prompt = campaignPrompts[campaignType] || campaignPrompts['product-showcase'];
    
    // Add brand context
    if (brand?.businessName) {
      prompt = `For ${brand.businessName}: ${prompt}`;
    }
    
    // Add industry context
    if (brand?.industry) {
      prompt += `. ${brand.industry} industry`;
    }
    
    // Add scene
    prompt += `. Setting: ${sceneDescriptions[adScene] || sceneDescriptions['studio']}`;
    
    // Add mood
    prompt += `. Visual style: ${moodDescriptions[visualMood] || moodDescriptions['premium']}`;
    
    // Add brand colors if available
    if (brand?.brandColors && brand.brandColors.length > 0 && adScene !== 'branded') {
      prompt += `. Incorporate brand colors: ${brand.brandColors.join(', ')}`;
    }
    
    // Add brand voice influence
    if (brand?.brandVoice) {
      const voiceInfluence = {
        'professional': 'corporate trustworthy aesthetic',
        'friendly': 'warm approachable welcoming',
        'bold': 'striking edgy high-contrast',
        'luxurious': 'elegant premium sophisticated',
        'playful': 'fun colorful energetic',
        'inspiring': 'motivational uplifting empowering',
        'minimalist': 'clean simple understated'
      };
      prompt += `. Brand personality: ${voiceInfluence[brand.brandVoice] || brand.brandVoice}`;
    }
    
    // Add any additional details from user
    if (additionalDetails.trim()) {
      prompt += `. Additional details: ${additionalDetails.trim()}`;
    }
    
    // Add product description if available
    if (selectedProduct?.description) {
      prompt += `. Product: ${selectedProduct.description.substring(0, 100)}`;
    }
    
    // Add quality modifiers
    prompt += '. High quality commercial photography, 8K resolution, professional lighting, Instagram-ready, advertising quality, sharp focus, perfect composition';
    
    // Important: No text in the image
    prompt += '. Do not include any text, words, letters, or logos in the image';
    
    return prompt;
  };

  // Generate image using Replicate API
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const brandPrompt = buildBrandPrompt();
      
      console.log('🎨 Generating brand ad with prompt:', brandPrompt);
      console.log('Aspect ratio:', aspectRatio);

      const requestBody = {
        prompt: brandPrompt,
        aspectRatio: aspectRatio,
        numOutputs: 1,
        outputFormat: 'webp',
        outputQuality: 95,
        enhancePrompt: true,
        industry: connectedBrand?.industry || 'general business',
        postType: campaignType,
        brandColors: connectedBrand?.brandColors?.join(', ') || null,
        style: visualMood,
        // Full business context for AI enhancement
        businessContext: {
          businessName: connectedBrand?.businessName || null,
          description: connectedBrand?.description || null,
          targetAudience: connectedBrand?.targetAudience || null,
          brandVoice: connectedBrand?.brandVoice || null,
          products: getProductName(),
          campaignType: campaignType,
          scene: adScene,
          mood: visualMood
        }
      };

      // Add reference image if selected
      if (selectedReferenceImage) {
        requestBody.referenceImage = selectedReferenceImage;
      }

      const response = await fetch('/api/ai/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success && data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        console.log('✅ Brand ad generated successfully:', data.imageUrl);
        
        // Auto-save to Asset Hub
        try {
          saveImageToHub({
            name: `${connectedBrand?.businessName || 'Brand'} - ${campaignTypes.find(c => c.id === campaignType)?.label || 'Ad'}`,
            url: data.imageUrl,
            caption: `${campaignType} ad for ${getProductName()}`,
            tags: [campaignType, aspectRatio, visualMood, 'brand-ad'].filter(Boolean),
            source: 'BusinessImage',
            metadata: {
              aspectRatio,
              campaignType,
              scene: adScene,
              mood: visualMood,
              product: getProductName(),
              businessName: connectedBrand?.businessName || null
            }
          });
          console.log('✅ Brand ad auto-saved to Asset Hub');
        } catch (saveError) {
          console.error('Failed to save to Asset Hub:', saveError);
        }
      } else {
        throw new Error(data.error || 'Failed to generate brand ad');
      }
    } catch (error) {
      console.error('Brand ad generation error:', error);
      setGenerationError(error.message || 'Failed to generate brand ad. Please try again.');
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
      a.download = `${connectedBrand?.businessName || 'brand'}-ad-${Date.now()}.webp`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      window.open(generatedImage, '_blank');
    }
  };

  // Regenerate image
  const handleRegenerate = () => {
    setGeneratedImage(null);
    handleGenerate();
  };

  // Step validation
  const canProceedStep1 = hasBrandSetup && campaignType && (selectedProduct || customProductName.trim() || campaignType === 'behind-scenes');
  const canProceedStep2 = adScene && visualMood && aspectRatio;

  // If no brand is set up, show setup prompt
  if (!hasBrandSetup) {
    return (
      <div className="business-image-page">
        <div className="business-image-container">
          <div className="page-header-row">
            <button className="back-btn" onClick={() => navigate('/app/create/business')}>
              <FiArrowLeft />
              <span>Back</span>
            </button>
            <div className="page-title">
              <FiImage className="title-icon" />
              <div>
                <h1>Brand Ad Creator</h1>
                <p>Create professional ad photos for your brand</p>
              </div>
            </div>
          </div>
          
          <div className="brand-required-notice">
            <div className="notice-icon">🏢</div>
            <h2>Brand Setup Required</h2>
            <p>To create brand-specific advertising photos, you need to set up your business profile first.</p>
            <p className="notice-subtitle">This ensures your ads match your brand identity, colors, and target audience.</p>
            <button 
              className="btn-setup-brand"
              onClick={() => navigate('/app/business-hub')}
            >
              <FiBriefcase /> Set Up Your Brand
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              <h1>Brand Ad Creator</h1>
              <p>Create professional ad photos for {connectedBrand?.businessName || 'your brand'}</p>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <span>Campaign</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <span>Visual Style</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Generate</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="step-content">
          
          {/* STEP 1: Campaign Type & Product */}
          {currentStep === 1 && (
            <div className="step-panel">
              <div className="step-header">
                <span className="step-label">Step 1 of 3</span>
                <h2>What are you advertising?</h2>
                <p>Select campaign type and product/service to feature</p>
              </div>

              {/* Connected Brand Display */}
              <div className="connected-brand-banner">
                <div className="brand-icon-small">
                  <FiBriefcase />
                </div>
                <div className="brand-banner-info">
                  <span className="brand-banner-name">{connectedBrand?.businessName}</span>
                  {connectedBrand?.industry && <span className="brand-banner-industry">{connectedBrand.industry}</span>}
                </div>
                <button 
                  className="btn-change-brand"
                  onClick={() => navigate('/app/business-hub')}
                >
                  <FiEdit2 /> Edit
                </button>
              </div>

              {/* Campaign Type Selection */}
              <div className="setting-group">
                <h3>📢 Campaign Type</h3>
                <p className="setting-description">What kind of ad are you creating?</p>
                <div className="campaign-type-grid">
                  {campaignTypes.map(campaign => (
                    <div
                      key={campaign.id}
                      className={`campaign-type-card ${campaignType === campaign.id ? 'selected' : ''}`}
                      onClick={() => setCampaignType(campaign.id)}
                    >
                      <span className="campaign-icon">{campaign.icon}</span>
                      <span className="campaign-label">{campaign.label}</span>
                      <span className="campaign-desc">{campaign.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Selection */}
              {campaignType !== 'behind-scenes' && (
                <div className="setting-group">
                  <h3>📦 What product/service to feature?</h3>
                  
                  {hasProducts ? (
                    <>
                      <p className="setting-description">Select from your products or enter a custom one</p>
                      <div className="product-selection-grid">
                        {connectedBrand.products.map((product, idx) => (
                          <div
                            key={idx}
                            className={`product-card ${selectedProduct?.name === product.name ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedProduct(product);
                              setCustomProductName('');
                            }}
                          >
                            <span className="product-name">{product.name}</span>
                            {product.description && (
                              <span className="product-desc">{product.description.substring(0, 50)}...</span>
                            )}
                          </div>
                        ))}
                        <div
                          className={`product-card custom ${customProductName.trim() ? 'selected' : ''}`}
                          onClick={() => setSelectedProduct(null)}
                        >
                          <span className="product-name">✏️ Custom</span>
                          <span className="product-desc">Enter a custom product name</span>
                        </div>
                      </div>
                      
                      {!selectedProduct && (
                        <input
                          type="text"
                          className="custom-product-input"
                          placeholder="Enter product/service name..."
                          value={customProductName}
                          onChange={(e) => setCustomProductName(e.target.value)}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <p className="setting-description">Enter the product or service you want to advertise</p>
                      <input
                        type="text"
                        className="custom-product-input"
                        placeholder="e.g., Premium Coffee Beans, Yoga Classes, Website Design..."
                        value={customProductName}
                        onChange={(e) => setCustomProductName(e.target.value)}
                      />
                      <p className="tip-text">💡 Tip: Add products in Business Hub for quick selection</p>
                    </>
                  )}
                </div>
              )}

              <div className="step-actions">
                <div></div>
                <button 
                  className="btn-next"
                  onClick={handleNext}
                  disabled={!canProceedStep1}
                >
                  <span>Next: Visual Style</span>
                  <FiArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Visual Style */}
          {currentStep === 2 && (
            <div className="step-panel">
              <div className="step-header">
                <span className="step-label">Step 2 of 3</span>
                <h2>Visual Style</h2>
                <p>Choose how your brand ad should look</p>
              </div>

              <div className="settings-card">
                {/* Scene/Setting Selection */}
                <div className="setting-group">
                  <h3>🎬 Scene / Setting</h3>
                  <p className="setting-description">Where should your product be photographed?</p>
                  <div className="style-options-grid">
                    {adScenes.map(scene => (
                      <div
                        key={scene.id}
                        className={`style-option-card ${adScene === scene.id ? 'selected' : ''}`}
                        onClick={() => setAdScene(scene.id)}
                      >
                        <span className="style-label">{scene.label}</span>
                        <span className="style-desc">{scene.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual Mood Selection */}
                <div className="setting-group">
                  <h3>✨ Visual Mood</h3>
                  <p className="setting-description">What feeling should the ad convey?</p>
                  <div className="style-options-grid">
                    {visualMoods.map(mood => (
                      <div
                        key={mood.id}
                        className={`style-option-card ${visualMood === mood.id ? 'selected' : ''}`}
                        onClick={() => setVisualMood(mood.id)}
                      >
                        <span className="style-label">{mood.label}</span>
                        <span className="style-desc">{mood.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div className="setting-group">
                  <h3>📐 Aspect Ratio</h3>
                  <p className="setting-description">Choose format for your ad</p>
                  <div className="aspect-ratio-options">
                    {aspectRatios.map(ratio => (
                      <div
                        key={ratio.id}
                        className={`aspect-ratio-option ${aspectRatio === ratio.id ? 'selected' : ''}`}
                        onClick={() => setAspectRatio(ratio.id)}
                      >
                        <span className="ratio-label">{ratio.label}</span>
                        <span className="ratio-desc">{ratio.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reference Image from Brand */}
                {connectedBrand?.brandImages?.length > 0 && (
                  <div className="setting-group">
                    <h3>🖼️ Reference Style (Optional)</h3>
                    <p className="setting-description">Use a brand image as style reference</p>
                    <div className="reference-images-row">
                      <div 
                        className={`reference-image-option ${!selectedReferenceImage ? 'selected' : ''}`}
                        onClick={() => setSelectedReferenceImage(null)}
                      >
                        <span>None</span>
                      </div>
                      {connectedBrand.brandImages.slice(0, 4).map((img, idx) => (
                        <div
                          key={idx}
                          className={`reference-image-option ${selectedReferenceImage === img ? 'selected' : ''}`}
                          onClick={() => setSelectedReferenceImage(img)}
                        >
                          <img src={img} alt={`Reference ${idx + 1}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                  <span>Next: Generate</span>
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
                <h2>Review & Generate</h2>
                <p>Review your settings and generate your brand ad</p>
              </div>

              <div className="review-card">
                {/* Summary */}
                <div className="summary-section">
                  <h3>📋 Ad Summary</h3>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <strong>Brand:</strong>
                      <span>{connectedBrand?.businessName}</span>
                    </div>
                    <div className="summary-item">
                      <strong>Product:</strong>
                      <span>{getProductName()}</span>
                    </div>
                    <div className="summary-item">
                      <strong>Campaign:</strong>
                      <span>{campaignTypes.find(c => c.id === campaignType)?.label}</span>
                    </div>
                    <div className="summary-item">
                      <strong>Scene:</strong>
                      <span>{adScenes.find(s => s.id === adScene)?.label}</span>
                    </div>
                    <div className="summary-item">
                      <strong>Mood:</strong>
                      <span>{visualMoods.find(m => m.id === visualMood)?.label}</span>
                    </div>
                    <div className="summary-item">
                      <strong>Format:</strong>
                      <span>{aspectRatio} ({aspectRatios.find(r => r.id === aspectRatio)?.description})</span>
                    </div>
                  </div>
                  
                  <div className="summary-tags">
                    {connectedBrand?.brandColors?.map((color, idx) => (
                      <span key={idx} className="color-tag" style={{ backgroundColor: color }}></span>
                    ))}
                    {connectedBrand?.brandVoice && <span className="tag">{connectedBrand.brandVoice}</span>}
                  </div>
                </div>

                {/* Additional Details */}
                <div className="additional-details">
                  <h3><FiEdit3 /> Additional Details (Optional)</h3>
                  <p className="content-hint">Add any specific elements or features you want in the ad</p>
                  
                  <textarea
                    className="additional-textarea"
                    placeholder="e.g., Include a coffee cup in the scene, make it feel cozy, show morning sunlight..."
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Generation Error */}
                {generationError && (
                  <div className="generation-error">
                    <strong>⚠️ Error:</strong> {generationError}
                    <button className="dismiss-btn" onClick={() => setGenerationError(null)}>×</button>
                  </div>
                )}

                {/* Generated Result */}
                {generatedImage && (
                  <div className="generated-result">
                    <h3>🎨 Your Brand Ad</h3>
                    <div className="result-image-container">
                      <img src={generatedImage} alt="Generated brand ad" />
                    </div>
                    <div className="result-actions">
                      <button className="btn-download" onClick={handleDownload}>
                        <FiDownload /> Download
                      </button>
                      <button className="btn-regenerate" onClick={handleRegenerate}>
                        <FiRefreshCw /> Generate Another
                      </button>
                    </div>
                    <p className="auto-save-notice">✅ Automatically saved to Asset Hub</p>
                  </div>
                )}
              </div>

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
                      <span>Creating your brand ad... (30-60s)</span>
                    </>
                  ) : generatedImage ? (
                    <>
                      <FiRefreshCw />
                      <span>Generate Another</span>
                    </>
                  ) : (
                    <>
                      <FiZap />
                      <span>Generate Brand Ad</span>
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
