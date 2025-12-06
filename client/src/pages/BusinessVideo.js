import React, { useState, useEffect } from 'react';
import { FiVideo, FiZap, FiArrowLeft, FiArrowRight, FiRefreshCw, FiEdit3, FiCheckCircle, FiSquare, FiSmartphone, FiMonitor, FiUser, FiBox, FiFilm, FiPlay, FiLoader, FiAlertCircle, FiTrendingUp, FiStar, FiHeart, FiMic, FiGift } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';
import { saveVideoToHub } from '../services/assetService';
import './BusinessVideo.css';

const BusinessVideo = () => {
  const navigate = useNavigate();
  
  // Current step (1, 2, or 3)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Business Info from Business Hub - REQUIRED
  const [businessInfo, setBusinessInfo] = useState(null);
  const [hasBrand, setHasBrand] = useState(false);
  
  // Step 1: Campaign Setup
  const [campaignType, setCampaignType] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [customProductName, setCustomProductName] = useState('');
  const [customProductDesc, setCustomProductDesc] = useState('');
  const [campaignGoal, setCampaignGoal] = useState('');
  
  // Step 2: Video Settings
  const [videoStyle, setVideoStyle] = useState('product-showcase');
  const [visualMood, setVisualMood] = useState('professional');
  const [includeCharacters, setIncludeCharacters] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  
  // ElevenLabs Voice Settings
  const [selectedVoice, setSelectedVoice] = useState('Adam');
  const [selectedVoiceId, setSelectedVoiceId] = useState('pNInz6obpgDQGcFmaJgB');
  const [elevenLabsVoices, setElevenLabsVoices] = useState([]);
  const [elevenLabsStatus, setElevenLabsStatus] = useState({ available: false });
  const [voiceStyle, setVoiceStyle] = useState('narrator');
  const [playingPreview, setPlayingPreview] = useState(null);
  const [previewAudio, setPreviewAudio] = useState(null);
  
  // Step 3: Review & Generate
  const [generatedScript, setGeneratedScript] = useState(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [generationError, setGenerationError] = useState(null);
  
  // Load business info on mount - BRAND IS REQUIRED
  useEffect(() => {
    const saved = localStorage.getItem('businessInfo');
    if (saved) {
      const parsed = JSON.parse(saved);
      setBusinessInfo(parsed);
      // Check for meaningful brand data
      const hasData = parsed.businessName && (parsed.description || parsed.industry || (parsed.products && parsed.products.length > 0));
      setHasBrand(hasData);
    } else {
      setHasBrand(false);
    }
    
    // Load ElevenLabs voices
    loadElevenLabsVoices();
  }, []);
  
  // Load ElevenLabs voices and status
  const loadElevenLabsVoices = async () => {
    try {
      const statusRes = await fetch('/api/ai/elevenlabs/status');
      const statusData = await statusRes.json();
      setElevenLabsStatus(statusData);
      
      const voicesRes = await fetch('/api/ai/elevenlabs/voices/recommended');
      const voicesData = await voicesRes.json();
      
      if (voicesData.success && voicesData.voices) {
        setElevenLabsVoices(voicesData.voices);
        // Set default voice (Adam for video narration)
        const defaultVoice = voicesData.voices.find(v => v.name === 'Adam') || voicesData.voices[0];
        if (defaultVoice) {
          setSelectedVoice(defaultVoice.name);
          setSelectedVoiceId(defaultVoice.id);
          setVoiceStyle(defaultVoice.style || 'narrator');
        }
      }
    } catch (error) {
      console.log('ElevenLabs not available:', error.message);
    }
  };
  
  // Play voice preview
  const playVoicePreview = (voice) => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
    }
    
    if (voice.previewUrl) {
      const audio = new Audio(voice.previewUrl);
      setPreviewAudio(audio);
      setPlayingPreview(voice.id);
      
      audio.play().catch(err => {
        console.log('Preview play failed:', err);
        setPlayingPreview(null);
      });
      
      audio.onended = () => setPlayingPreview(null);
    }
  };
  
  // Stop voice preview
  const stopVoicePreview = () => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
    }
    setPlayingPreview(null);
  };
  
  // Select a voice
  const selectVoice = (voice) => {
    setSelectedVoice(voice.name);
    setSelectedVoiceId(voice.id);
    if (voice.style) setVoiceStyle(voice.style);
  };
  
  // Fallback voice options
  const fallbackVoiceOptions = [
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', style: 'narrator', emoji: '👨', description: 'Deep, authoritative - perfect for narration', category: 'premade' },
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', style: 'conversational', emoji: '👩', description: 'Warm, friendly - ideal for social media', category: 'premade' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', style: 'professional', emoji: '👩‍💼', description: 'Clear, professional - great for business', category: 'premade' },
    { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', style: 'luxury', emoji: '🎩', description: 'Deep, rich - great for luxury brands', category: 'premade' },
    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', style: 'energetic', emoji: '🎤', description: 'Energetic - great for exciting content', category: 'premade' },
    { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', style: 'dynamic', emoji: '🧑', description: 'Dynamic - energetic and engaging', category: 'premade' },
  ];
  
  // Voice styles
  const voiceStyles = [
    { id: 'narrator', label: 'Narrator', description: 'Documentary style' },
    { id: 'professional', label: 'Professional', description: 'Clear, business-like' },
    { id: 'energetic', label: 'Energetic', description: 'High energy, exciting' },
    { id: 'conversational', label: 'Conversational', description: 'Natural, casual' },
    { id: 'dramatic', label: 'Dramatic', description: 'Cinematic feel' },
    { id: 'calm', label: 'Calm', description: 'Relaxed, soothing' },
  ];
  
  // Get available voices
  const getAvailableVoices = () => {
    return elevenLabsVoices.length > 0 ? elevenLabsVoices : fallbackVoiceOptions;
  };
  
  // Campaign types for brand video ads
  const campaignTypes = [
    { 
      id: 'product-demo', 
      label: 'Product Demo', 
      icon: FiBox, 
      description: 'Showcase features and benefits',
      color: '#3b82f6'
    },
    { 
      id: 'brand-story', 
      label: 'Brand Story', 
      icon: FiHeart, 
      description: 'Tell your company story',
      color: '#ec4899'
    },
    { 
      id: 'testimonial', 
      label: 'Testimonial', 
      icon: FiStar, 
      description: 'Customer success stories',
      color: '#f59e0b'
    },
    { 
      id: 'promotion', 
      label: 'Sale / Promo', 
      icon: FiGift, 
      description: 'Discounts and offers',
      color: '#10b981'
    },
    { 
      id: 'tutorial', 
      label: 'How-To / Tutorial', 
      icon: FiPlay, 
      description: 'Educate your audience',
      color: '#8b5cf6'
    },
    { 
      id: 'launch', 
      label: 'New Launch', 
      icon: FiTrendingUp, 
      description: 'Announce something new',
      color: '#ef4444'
    },
  ];
  
  // Campaign goals
  const campaignGoals = [
    { id: 'awareness', label: 'Brand Awareness', description: 'Get your name out there' },
    { id: 'engagement', label: 'Drive Engagement', description: 'Likes, comments, shares' },
    { id: 'traffic', label: 'Website Traffic', description: 'Get people to visit' },
    { id: 'sales', label: 'Drive Sales', description: 'Convert viewers to buyers' },
    { id: 'followers', label: 'Grow Followers', description: 'Build your audience' },
  ];

  // Video style options for brand videos
  const videoStyles = [
    { 
      id: 'product-showcase', 
      label: 'Product Focus', 
      icon: FiBox, 
      description: 'Clean shots highlighting your product',
      hasCharacters: false
    },
    { 
      id: 'lifestyle', 
      label: 'Lifestyle', 
      icon: FiUser, 
      description: 'Product in real-life settings',
      hasCharacters: true
    },
    { 
      id: 'cinematic', 
      label: 'Cinematic', 
      icon: FiFilm, 
      description: 'Dramatic, high-production look',
      hasCharacters: false
    },
    { 
      id: 'testimonial', 
      label: 'Talking Head', 
      icon: FiMic, 
      description: 'Person speaking to camera',
      hasCharacters: true
    },
    { 
      id: 'dynamic', 
      label: 'Dynamic Cuts', 
      icon: FiTrendingUp, 
      description: 'Fast-paced, energetic editing',
      hasCharacters: false
    },
    { 
      id: 'minimal', 
      label: 'Minimal Clean', 
      icon: FiSquare, 
      description: 'Simple, elegant composition',
      hasCharacters: false
    }
  ];
  
  // Visual mood options
  const visualMoods = [
    { id: 'professional', label: 'Professional', description: 'Clean, corporate feel', emoji: '💼' },
    { id: 'premium', label: 'Premium/Luxury', description: 'High-end, sophisticated', emoji: '✨' },
    { id: 'vibrant', label: 'Vibrant & Bold', description: 'Colorful, eye-catching', emoji: '🎨' },
    { id: 'warm', label: 'Warm & Friendly', description: 'Approachable, welcoming', emoji: '☀️' },
    { id: 'minimalist', label: 'Minimalist', description: 'Clean, simple, focused', emoji: '⬜' },
    { id: 'energetic', label: 'Energetic', description: 'Dynamic, exciting', emoji: '⚡' },
  ];

  // Aspect ratio options
  const aspectRatios = [
    { id: '9:16', label: '9:16', icon: FiSmartphone, description: 'Reels/Stories' },
    { id: '1:1', label: '1:1', icon: FiSquare, description: 'Square Feed' },
    { id: '16:9', label: '16:9', icon: FiMonitor, description: 'YouTube/Web' },
    { id: '4:5', label: '4:5', icon: FiSmartphone, description: 'Feed Portrait' }
  ];
  
  // Get selected product details
  const getSelectedProductDetails = () => {
    if (selectedProduct === 'custom') {
      return { name: customProductName, description: customProductDesc };
    }
    if (selectedProduct && businessInfo?.products) {
      return businessInfo.products.find(p => p.name === selectedProduct);
    }
    return null;
  };
  
  // Build brand-focused video script prompt
  const buildBrandScriptPrompt = () => {
    const product = getSelectedProductDetails();
    const campaign = campaignTypes.find(c => c.id === campaignType);
    const mood = visualMoods.find(m => m.id === visualMood);
    const style = videoStyles.find(s => s.id === videoStyle);
    const goal = campaignGoals.find(g => g.id === campaignGoal);
    
    let prompt = `Create a 30-second ${campaign?.label || 'promotional'} video script for ${businessInfo?.businessName || 'our brand'}.\n\n`;
    
    // Brand context
    prompt += `BRAND CONTEXT:\n`;
    prompt += `- Business: ${businessInfo?.businessName || 'Brand'}\n`;
    if (businessInfo?.industry) prompt += `- Industry: ${businessInfo.industry}\n`;
    if (businessInfo?.brandVoice) prompt += `- Brand Voice: ${businessInfo.brandVoice}\n`;
    if (businessInfo?.targetAudience) prompt += `- Target Audience: ${businessInfo.targetAudience}\n`;
    
    // Product/Service focus
    if (product) {
      prompt += `\nFEATURED PRODUCT/SERVICE:\n`;
      prompt += `- Name: ${product.name}\n`;
      if (product.description) prompt += `- Description: ${product.description}\n`;
      if (product.price) prompt += `- Price: ${product.price}\n`;
    }
    
    // Campaign specifics
    prompt += `\nCAMPAIGN DETAILS:\n`;
    prompt += `- Type: ${campaign?.label || campaignType}\n`;
    if (goal) prompt += `- Goal: ${goal.label} - ${goal.description}\n`;
    prompt += `- Visual Style: ${style?.label || videoStyle}\n`;
    prompt += `- Mood: ${mood?.label || visualMood}\n`;
    prompt += `- Include People: ${includeCharacters ? 'Yes' : 'No'}\n`;
    
    // Specific instructions based on campaign type
    switch (campaignType) {
      case 'product-demo':
        prompt += `\nFocus on showing the product's key features, benefits, and how it solves problems.`;
        break;
      case 'brand-story':
        prompt += `\nTell an authentic story about the brand's mission, values, and why it exists.`;
        break;
      case 'testimonial':
        prompt += `\nFrame it as a customer success story with specific benefits and results.`;
        break;
      case 'promotion':
        prompt += `\nHighlight the offer/discount with urgency and clear value proposition.`;
        break;
      case 'tutorial':
        prompt += `\nProvide clear, step-by-step guidance that educates and showcases expertise.`;
        break;
      case 'launch':
        prompt += `\nBuild excitement and anticipation for the new product/service.`;
        break;
      default:
        prompt += `\nCreate engaging brand content that showcases value.`;
        break;
    }
    
    return prompt;
  };

  // Generate script with AI
  const handleGenerateScript = async () => {
    setIsGeneratingScript(true);
    setGenerationError(null);
    
    try {
      const brandPrompt = buildBrandScriptPrompt();
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${brandPrompt}

Return a JSON object with this structure:
{
  "hook": "Opening hook line (2-3 seconds, attention-grabbing)",
  "scenes": [
    {
      "text": "Voiceover text for this scene",
      "visual": "Brief description of what's shown visually",
      "duration": 5
    }
  ],
  "cta": "Call to action (2-3 seconds)"
}

Make it punchy, engaging, and perfect for Instagram/TikTok. 
Total duration should be around 30 seconds.
Include 4-6 scenes.
Make the script authentic to the brand voice and focused on the product/service.`
        })
      });
      
      const data = await response.json();
      
      // Try to parse the JSON from the response
      let scriptData;
      try {
        // Extract JSON from the response
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          scriptData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse script:', parseError);
        const product = getSelectedProductDetails();
        // Create a fallback structure
        scriptData = {
          hook: `Discover ${product?.name || 'our product'}`,
          scenes: [
            { text: `${businessInfo?.businessName} brings you something special`, visual: "Brand logo reveal", duration: 4 },
            { text: product?.description || 'Quality you can trust', visual: "Product showcase", duration: 5 },
          ],
          cta: "Shop now - link in bio!"
        };
      }
      
      setGeneratedScript(scriptData);
      
    } catch (error) {
      console.error('Script generation error:', error);
      setGenerationError('Failed to generate script. Please try again.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Navigation
  const handleNext = () => {
    if (currentStep < 3) {
      // Auto-generate script when moving from Step 2 to Step 3
      if (currentStep === 2 && !generatedScript) {
        handleGenerateScript();
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/dashboard/business/create');
    }
  };

  // Check if can proceed to next step
  const canProceedStep1 = campaignType && (selectedProduct || (selectedProduct === 'custom' && customProductName.trim()));
  const canProceedStep2 = videoStyle && visualMood && aspectRatio;

  // State for showing generation progress
  const [generationStatus, setGenerationStatus] = useState('');

  // Poll for job status
  const pollJobStatus = async (jobId) => {
    const maxAttempts = 180; // 15 minutes max (5s intervals) - AI takes time!
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        const data = await response.json();
        
        console.log(`[BusinessVideo] Poll ${attempts}: status=${data.status}, progress=${data.progress}`);
        
        // Update UI with current status
        if (data.statusMessage) {
          setGenerationStatus(data.statusMessage);
        }
        
        if (data.status === 'done' && data.videoUrl) {
          return { success: true, videoUrl: data.videoUrl };
        } else if (data.status === 'failed') {
          return { success: false, error: data.error || 'Video generation failed' };
        }
        
        // Show specific status for AI generation
        if (data.status === 'waiting_for_ai') {
          setGenerationStatus(`🎬 AI generating videos... (${Math.floor(attempts * 5 / 60)}:${String(attempts * 5 % 60).padStart(2, '0')} elapsed)`);
        }
        
        // Still processing, continue polling
      } catch (err) {
        console.error('[BusinessVideo] Poll error:', err);
        // Continue polling on network errors
      }
    }
    
    return { success: false, error: 'Video generation timed out. Please check Asset Hub later.' };
  };

  // Generate video
  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationStatus('Starting video generation...');
    
    try {
      // Build the full script text from brand-focused script
      const fullScript = generatedScript 
        ? `${generatedScript.hook} ${generatedScript.scenes.map(s => s.text).join(' ')} ${generatedScript.cta}`
        : '';
      
      const product = getSelectedProductDetails();
      const campaign = campaignTypes.find(c => c.id === campaignType);
      
      // Build enhanced business info with campaign context
      const enhancedBusinessInfo = {
        ...businessInfo,
        campaignType: campaignType,
        campaignLabel: campaign?.label,
        selectedProduct: product,
        visualMood: visualMood,
        campaignGoal: campaignGoal
      };
      
      console.log('[BusinessVideo] brandInfo:', enhancedBusinessInfo);
      
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: fullScript,
          targetDuration: 30,
          voiceId: selectedVoiceId, // Use selected ElevenLabs voice
          voiceStyle: voiceStyle,
          style: videoStyle,
          aspectRatio: aspectRatio,
          includeCharacters: includeCharacters,
          businessInfo: enhancedBusinessInfo
        })
      });
      
      const data = await response.json();
      console.log('[BusinessVideo] API response:', data);
      
      // Handle async processing (202 response for product videos)
      if (data.isProductVideo && data.jobId) {
        console.log('[BusinessVideo] Product video - triggering processing for job:', data.jobId);
        setGenerationStatus('📝 Processing your brand video...');
        
        // Trigger the process endpoint
        const processResponse = await fetch(`/api/jobs/${data.jobId}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const processData = await processResponse.json();
        console.log('[BusinessVideo] Process response:', processData);
        
        if (processData.status === 'done' && processData.videoUrl) {
          data.videoUrl = processData.videoUrl;
          data.success = true;
        } else if (processData.status === 'failed') {
          throw new Error(processData.error || 'Video generation failed');
        } else if (processData.status === 'waiting_for_ai') {
          // AI videos being generated asynchronously
          console.log('[BusinessVideo] Waiting for AI videos, starting polling...');
          setGenerationStatus(processData.statusMessage || '🎬 Generating brand video... (5-10 min)');
          const result = await pollJobStatus(data.jobId);
          
          if (result.success) {
            data.videoUrl = result.videoUrl;
            data.success = true;
          } else {
            throw new Error(result.error);
          }
        } else {
          // Still processing, start polling
          console.log('[BusinessVideo] Starting polling for job:', data.jobId);
          setGenerationStatus('🎬 Generating brand video... (5-10 min)');
          const result = await pollJobStatus(data.jobId);
          
          if (result.success) {
            data.videoUrl = result.videoUrl;
            data.success = true;
          } else {
            throw new Error(result.error);
          }
        }
      }
      
      if (data.success && data.videoUrl) {
        setGeneratedVideo(data.videoUrl);
        
        // Auto-save to Asset Hub with brand context
        try {
          const product = getSelectedProductDetails();
          const campaign = campaignTypes.find(c => c.id === campaignType);
          
          saveVideoToHub({
            name: `${campaign?.label || 'Brand Video'} - ${product?.name || businessInfo?.businessName}`,
            url: data.videoUrl,
            caption: generatedScript?.hook || fullScript.substring(0, 100),
            tags: [campaignType, videoStyle, aspectRatio, 'brand-video', businessInfo?.industry].filter(Boolean),
            source: 'BusinessVideo',
            metadata: {
              campaignType,
              videoStyle,
              aspectRatio,
              visualMood,
              includeCharacters,
              businessName: businessInfo?.businessName || null,
              productName: product?.name || null,
              generatedAt: new Date().toISOString()
            }
          });
          console.log('✅ Brand video auto-saved to Asset Hub');
        } catch (saveError) {
          console.error('Failed to auto-save to Asset Hub:', saveError);
        }
      } else if (data.error) {
        throw new Error(data.error);
      } else if (data.status === 'failed') {
        throw new Error(data.message || 'Video generation failed');
      } else {
        throw new Error('Video generation failed - no video URL returned');
      }
      
    } catch (error) {
      console.error('Video generation error:', error);
      setGenerationError(error.message || 'Failed to generate video. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate total duration
  const getTotalDuration = () => {
    if (!generatedScript) return 30;
    const hookDuration = 3;
    const ctaDuration = 3;
    const scenesDuration = generatedScript.scenes.reduce((sum, s) => sum + (s.duration || 5), 0);
    return hookDuration + scenesDuration + ctaDuration;
  };

  // If no brand is set up, show required notice
  if (!hasBrand) {
    return (
      <div className="business-video-page">
        <div className="business-video-container">
          <div className="page-header-row">
            <button className="back-btn" onClick={() => navigate('/dashboard/business/create')}>
              <FiArrowLeft />
              <span>Back</span>
            </button>
            <div className="page-title">
              <FiVideo className="title-icon" />
              <h1>Brand Video Ad Creator</h1>
            </div>
          </div>
          
          <div className="brand-required-notice">
            <div className="notice-icon">
              <FiAlertCircle />
            </div>
            <h2>Brand Setup Required</h2>
            <p>
              Brand Video Ad Creator creates professional video advertisements specifically for your brand.
              To generate videos that match your brand identity, products, and target audience, please set up your brand first.
            </p>
            <div className="notice-features">
              <div className="feature-item">
                <FiCheckCircle />
                <span>Product demo videos with your branding</span>
              </div>
              <div className="feature-item">
                <FiCheckCircle />
                <span>AI-generated scripts tailored to your brand voice</span>
              </div>
              <div className="feature-item">
                <FiCheckCircle />
                <span>Professional video ads for your products/services</span>
              </div>
            </div>
            <Link to="/dashboard/business/hub" className="setup-brand-btn">
              <FiZap />
              <span>Set Up Your Brand</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="business-video-page">
      <div className="business-video-container">
        
        {/* Header with Brand Banner */}
        <div className="page-header-row">
          <button className="back-btn" onClick={handleBack}>
            <FiArrowLeft />
            <span>Back</span>
          </button>
          <div className="page-title">
            <FiVideo className="title-icon" />
            <h1>Brand Video Ad Creator</h1>
          </div>
        </div>
        
        {/* Brand Info Banner */}
        <div className="brand-info-banner">
          <div className="brand-banner-content">
            <div className="brand-avatar">
              {businessInfo?.businessName?.charAt(0)?.toUpperCase() || 'B'}
            </div>
            <div className="brand-details">
              <h3>{businessInfo?.businessName}</h3>
              <p>{businessInfo?.industry || 'Your Brand'}</p>
            </div>
          </div>
          <Link to="/dashboard/business/hub" className="edit-brand-link">
            Edit Brand
          </Link>
        </div>

        {/* Progress Steps */}
        <div className="steps-progress">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <span>Campaign</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <span>Style</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Generate</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="step-content">
          
          {/* STEP 1: Campaign Setup */}
          {currentStep === 1 && (
            <div className="step-panel">
              <div className="step-header">
                <span className="step-label">Step 1 of 3</span>
                <h2>What Are You Promoting?</h2>
                <p>Select your campaign type and what you want to feature</p>
              </div>

              {/* Campaign Type Selection */}
              <div className="selection-section">
                <h3>Campaign Type</h3>
                <div className="campaign-grid">
                  {campaignTypes.map(campaign => (
                    <div 
                      key={campaign.id}
                      className={`campaign-card ${campaignType === campaign.id ? 'selected' : ''}`}
                      onClick={() => setCampaignType(campaign.id)}
                      style={{ '--campaign-color': campaign.color }}
                    >
                      <div className="campaign-icon">
                        <campaign.icon />
                      </div>
                      <h4>{campaign.label}</h4>
                      <p>{campaign.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product/Service Selection */}
              {campaignType && (
                <div className="selection-section">
                  <h3>What to Feature</h3>
                  <p className="section-hint">Select the product or service you want to promote</p>
                  
                  <div className="product-selection">
                    {/* Products from Business Hub */}
                    {businessInfo?.products && businessInfo.products.length > 0 && (
                      <div className="product-list">
                        {businessInfo.products.map((product, idx) => (
                          <div 
                            key={idx}
                            className={`product-card ${selectedProduct === product.name ? 'selected' : ''}`}
                            onClick={() => setSelectedProduct(product.name)}
                          >
                            <div className="product-icon">
                              <FiBox />
                            </div>
                            <div className="product-info">
                              <h4>{product.name}</h4>
                              {product.description && <p>{product.description}</p>}
                              {product.price && <span className="product-price">{product.price}</span>}
                            </div>
                            {selectedProduct === product.name && (
                              <FiCheckCircle className="selected-check" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Custom Product Option */}
                    <div 
                      className={`product-card custom ${selectedProduct === 'custom' ? 'selected' : ''}`}
                      onClick={() => setSelectedProduct('custom')}
                    >
                      <div className="product-icon custom">
                        <FiEdit3 />
                      </div>
                      <div className="product-info">
                        <h4>Custom / Other</h4>
                        <p>Describe what you're promoting</p>
                      </div>
                      {selectedProduct === 'custom' && (
                        <FiCheckCircle className="selected-check" />
                      )}
                    </div>
                    
                    {/* Custom Product Input */}
                    {selectedProduct === 'custom' && (
                      <div className="custom-product-input">
                        <input
                          type="text"
                          placeholder="Product/Service Name"
                          value={customProductName}
                          onChange={(e) => setCustomProductName(e.target.value)}
                        />
                        <textarea
                          placeholder="Brief description (optional)"
                          value={customProductDesc}
                          onChange={(e) => setCustomProductDesc(e.target.value)}
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Campaign Goal */}
              {campaignType && selectedProduct && (
                <div className="selection-section">
                  <h3>Campaign Goal (Optional)</h3>
                  <div className="goal-pills">
                    {campaignGoals.map(goal => (
                      <button
                        key={goal.id}
                        className={`goal-pill ${campaignGoal === goal.id ? 'active' : ''}`}
                        onClick={() => setCampaignGoal(campaignGoal === goal.id ? '' : goal.id)}
                      >
                        {goal.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step Actions */}
              <div className="step-actions">
                <button className="btn-back" onClick={handleBack}>
                  <FiArrowLeft />
                  <span>Back</span>
                </button>
                <button 
                  className="btn-next"
                  onClick={handleNext}
                  disabled={!canProceedStep1}
                >
                  <span>Continue</span>
                  <FiArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Video Style Settings */}
          {currentStep === 2 && (
            <div className="step-panel">
              <div className="step-header">
                <span className="step-label">Step 2 of 3</span>
                <h2>Video Style</h2>
                <p>Customize the look and feel of your brand video</p>
              </div>

              {/* Visual Mood */}
              <div className="settings-section">
                <h3>Visual Mood</h3>
                <p className="section-desc">What feeling should your video convey?</p>
                <div className="mood-grid">
                  {visualMoods.map(mood => (
                    <div 
                      key={mood.id}
                      className={`mood-card ${visualMood === mood.id ? 'selected' : ''}`}
                      onClick={() => setVisualMood(mood.id)}
                    >
                      <span className="mood-emoji">{mood.emoji}</span>
                      <h4>{mood.label}</h4>
                      <p>{mood.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Video Style */}
              <div className="settings-section">
                <h3>Video Format</h3>
                <p className="section-desc">Choose your preferred video style</p>
                <div className="video-styles-grid">
                  {videoStyles.map(style => (
                    <div 
                      key={style.id}
                      className={`style-card ${videoStyle === style.id ? 'selected' : ''}`}
                      onClick={() => {
                        setVideoStyle(style.id);
                        if (style.hasCharacters) setIncludeCharacters(true);
                        else setIncludeCharacters(false);
                      }}
                    >
                      <style.icon className="style-icon" />
                      <h4>{style.label}</h4>
                      <p>{style.description}</p>
                      {style.hasCharacters && (
                        <span className="character-badge">👤 With People</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div className="settings-section">
                <h3>Aspect Ratio</h3>
                <div className="aspect-ratio-options">
                  {aspectRatios.map(ratio => (
                    <button 
                      key={ratio.id}
                      className={`ratio-btn ${aspectRatio === ratio.id ? 'active' : ''}`}
                      onClick={() => setAspectRatio(ratio.id)}
                    >
                      <ratio.icon />
                      <span>{ratio.label}</span>
                      <small>{ratio.description}</small>
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Selection - ElevenLabs */}
              <div className="settings-section elevenlabs-section">
                <div className="section-header-row">
                  <h3><FiMic /> AI Voiceover</h3>
                  {elevenLabsStatus.available && (
                    <span className="elevenlabs-badge">⚡ ElevenLabs Premium</span>
                  )}
                </div>
                
                {!elevenLabsStatus.available && (
                  <div className="elevenlabs-warning">
                    <FiAlertCircle />
                    <span>ElevenLabs not configured - using fallback voices</span>
                  </div>
                )}
                
                <div className="voice-selection-grid">
                  {getAvailableVoices().map(voice => (
                    <div 
                      key={voice.id}
                      className={`voice-option ${selectedVoiceId === voice.id ? 'selected' : ''}`}
                      onClick={() => selectVoice(voice)}
                    >
                      <div className="voice-option-header">
                        <span className="voice-emoji">{voice.emoji || '🎙️'}</span>
                        <h4>{voice.name}</h4>
                      </div>
                      <p className="voice-desc">{voice.description}</p>
                      {voice.previewUrl && (
                        <button 
                          className={`voice-preview ${playingPreview === voice.id ? 'playing' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            playingPreview === voice.id ? stopVoicePreview() : playVoicePreview(voice);
                          }}
                        >
                          {playingPreview === voice.id ? '■ Stop' : '▶ Preview'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Voice Style */}
                <div className="voice-style-row">
                  <label>Voice Style:</label>
                  <div className="style-pills">
                    {voiceStyles.map(style => (
                      <button
                        key={style.id}
                        className={`style-pill ${voiceStyle === style.id ? 'active' : ''}`}
                        onClick={() => setVoiceStyle(style.id)}
                        title={style.description}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step Actions */}
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
                  <span>Continue</span>
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
                <p>Review your brand video settings and generate</p>
              </div>

              {/* Campaign Summary */}
              <div className="campaign-summary">
                <h3>📋 Campaign Summary</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Brand</span>
                    <span className="summary-value">{businessInfo?.businessName}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Campaign Type</span>
                    <span className="summary-value">
                      {campaignTypes.find(c => c.id === campaignType)?.label}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Product/Service</span>
                    <span className="summary-value">
                      {selectedProduct === 'custom' ? customProductName : selectedProduct}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Video Style</span>
                    <span className="summary-value">
                      {videoStyles.find(s => s.id === videoStyle)?.label}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Visual Mood</span>
                    <span className="summary-value">
                      {visualMoods.find(m => m.id === visualMood)?.emoji} {visualMoods.find(m => m.id === visualMood)?.label}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Aspect Ratio</span>
                    <span className="summary-value">{aspectRatio}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Voice</span>
                    <span className="summary-value">🎙️ {selectedVoice}</span>
                  </div>
                </div>
              </div>

              {/* Script Generation/Preview */}
              <div className="script-section-container">
                <div className="script-header">
                  <h3>📝 Video Script</h3>
                  {!generatedScript && !isGeneratingScript && (
                    <button 
                      className="generate-script-btn"
                      onClick={handleGenerateScript}
                    >
                      <FiZap />
                      <span>Generate Script</span>
                    </button>
                  )}
                </div>
                
                {isGeneratingScript && (
                  <div className="script-loading">
                    <FiRefreshCw className="spin" />
                    <span>Generating brand-focused script...</span>
                  </div>
                )}
                
                {generatedScript && (
                  <div className="generated-script-preview">
                    <div className="preview-header">
                      <span className="duration-badge">~{getTotalDuration()}s</span>
                      <button 
                        className="regenerate-btn"
                        onClick={handleGenerateScript}
                        disabled={isGeneratingScript}
                      >
                        <FiRefreshCw />
                        <span>Regenerate</span>
                      </button>
                    </div>
                    
                    <div className="script-section hook">
                      <span className="section-label">HOOK</span>
                      <p>{generatedScript.hook}</p>
                    </div>
                    
                    {generatedScript.scenes.map((scene, idx) => (
                      <div key={idx} className="script-section scene">
                        <span className="section-label">SCENE {idx + 1} ({scene.duration}s)</span>
                        <p>{scene.text}</p>
                        <span className="visual-hint">🎬 {scene.visual}</span>
                      </div>
                    ))}
                    
                    <div className="script-section cta">
                      <span className="section-label">CTA</span>
                      <p>{generatedScript.cta}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {generationError && (
                <div className="generation-error">
                  <span>⚠️ {generationError}</span>
                  <button onClick={() => setGenerationError(null)}>Dismiss</button>
                </div>
              )}

              {/* Generated Video */}
              {generatedVideo && (
                <div className="generated-result">
                  <h3>🎉 Your Brand Video is Ready!</h3>
                  <div className="video-preview">
                    <video src={generatedVideo} controls autoPlay loop />
                  </div>
                  <div className="result-actions">
                    <a 
                      href={generatedVideo} 
                      download={`${businessInfo?.businessName || 'brand'}-video.mp4`}
                      className="result-btn primary"
                    >
                      Download Video
                    </a>
                  </div>
                </div>
              )}

              {/* Step Actions */}
              <div className="step-actions">
                <button className="btn-back" onClick={handleBack}>
                  <FiArrowLeft />
                  <span>Back</span>
                </button>
                <button 
                  className="btn-generate"
                  onClick={handleGenerateVideo}
                  disabled={isGenerating || !generatedScript}
                >
                  {isGenerating ? (
                    <>
                      <FiLoader className="spin" />
                      <span>{generationStatus || 'Starting...'}</span>
                    </>
                  ) : (
                    <>
                      <FiVideo />
                      <span>Generate Brand Video</span>
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

export default BusinessVideo;
