import React, { useState, useEffect } from 'react';
import { FiVideo, FiZap, FiArrowLeft, FiArrowRight, FiRefreshCw, FiEdit3, FiCheckCircle, FiSquare, FiSmartphone, FiMonitor, FiUser, FiBox, FiFilm, FiPlay, FiLoader } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';
import { saveVideoToHub } from '../services/assetService';
import './BusinessVideo.css';

const BusinessVideo = () => {
  const navigate = useNavigate();
  
  // Current step (1, 2, or 3)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Script
  const [scriptMode, setScriptMode] = useState('generate'); // 'generate' or 'custom'
  const [scriptPrompt, setScriptPrompt] = useState('');
  const [generatedScript, setGeneratedScript] = useState(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  
  // Business Info from Business Hub
  const [businessInfo, setBusinessInfo] = useState(null);
  const [brandLinked, setBrandLinked] = useState(true);
  
  // Step 2: Video Settings
  const [includeCharacters, setIncludeCharacters] = useState(true);
  const [videoStyle, setVideoStyle] = useState('cinematic');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  
  // Step 3: Review & Generate
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [generationError, setGenerationError] = useState(null);
  
  // Load business info on mount
  useEffect(() => {
    const saved = localStorage.getItem('businessInfo');
    if (saved) {
      const parsed = JSON.parse(saved);
      setBusinessInfo(parsed);
      const hasData = parsed.businessName || parsed.description || parsed.industry;
      setBrandLinked(hasData);
    } else {
      setBrandLinked(false);
    }
  }, []);
  
  const hasBusinessInfo = businessInfo && (businessInfo.businessName || businessInfo.description || businessInfo.industry);

  // Video style options
  const videoStyles = [
    { 
      id: 'cinematic', 
      label: 'Cinematic Intro', 
      icon: FiFilm, 
      description: 'Professional movie-like intro with dramatic lighting',
      hasCharacters: true
    },
    { 
      id: 'product-showcase', 
      label: 'Product Showcase', 
      icon: FiBox, 
      description: 'Focus on your product with smooth transitions',
      hasCharacters: false
    },
    { 
      id: 'lifestyle', 
      label: 'Lifestyle', 
      icon: FiUser, 
      description: 'People using your product in real scenarios',
      hasCharacters: true
    },
    { 
      id: 'minimal', 
      label: 'Minimal & Clean', 
      icon: FiSquare, 
      description: 'Simple, elegant visuals with text overlays',
      hasCharacters: false
    },
    { 
      id: 'dynamic', 
      label: 'Dynamic Action', 
      icon: FiPlay, 
      description: 'Fast-paced, energetic cuts and movement',
      hasCharacters: true
    },
    { 
      id: 'testimonial', 
      label: 'Testimonial Style', 
      icon: FiUser, 
      description: 'Person speaking to camera format',
      hasCharacters: true
    }
  ];

  // Aspect ratio options
  const aspectRatios = [
    { id: '9:16', label: '9:16', icon: FiSmartphone, description: 'Stories/Reels' },
    { id: '1:1', label: '1:1', icon: FiSquare, description: 'Square Feed' },
    { id: '16:9', label: '16:9', icon: FiMonitor, description: 'Landscape' },
    { id: '4:5', label: '4:5', icon: FiSmartphone, description: 'Portrait Feed' }
  ];

  // Generate script with AI
  const handleGenerateScript = async () => {
    if (!scriptPrompt.trim()) return;
    
    setIsGeneratingScript(true);
    
    try {
      // Build context from business info
      let businessContext = '';
      if (brandLinked && hasBusinessInfo) {
        const parts = [];
        if (businessInfo.businessName) parts.push(`Business: ${businessInfo.businessName}`);
        if (businessInfo.industry) parts.push(`Industry: ${businessInfo.industry}`);
        if (businessInfo.brandVoice) parts.push(`Brand voice: ${businessInfo.brandVoice}`);
        if (businessInfo.targetAudience) parts.push(`Target audience: ${businessInfo.targetAudience?.substring(0, 100)}`);
        if (parts.length > 0) {
          businessContext = `\n\nBusiness Context:\n${parts.join('\n')}`;
        }
      }
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Create a 30-second video script for this topic: "${scriptPrompt}"${businessContext}

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
Include 4-6 scenes.`
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
        // Create a fallback structure
        scriptData = {
          hook: "Attention-grabbing opening",
          scenes: [
            { text: scriptPrompt, visual: "Main scene", duration: 5 }
          ],
          cta: "Follow for more!"
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

  // Handle custom script input
  const handleCustomScriptChange = (e) => {
    const text = e.target.value;
    setScriptPrompt(text);
    
    // Create a simple script structure from custom text
    if (text.trim()) {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim());
      const scenes = sentences.map((sentence, idx) => ({
        text: sentence.trim(),
        visual: `Scene ${idx + 1}`,
        duration: Math.max(3, Math.min(7, sentence.trim().split(' ').length / 2))
      }));
      
      setGeneratedScript({
        hook: scenes[0]?.text || text.substring(0, 50),
        scenes: scenes.slice(1, -1).length > 0 ? scenes.slice(1, -1) : scenes,
        cta: scenes[scenes.length - 1]?.text || "Learn more!"
      });
    }
  };

  // Navigation
  const handleNext = () => {
    if (currentStep < 3) {
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
  const canProceedStep1 = scriptMode === 'generate' 
    ? generatedScript !== null 
    : scriptPrompt.trim().length > 0;
  
  const canProceedStep2 = videoStyle && aspectRatio;

  // Generate video
  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      // Build the full script text
      const fullScript = generatedScript 
        ? `${generatedScript.hook} ${generatedScript.scenes.map(s => s.text).join(' ')} ${generatedScript.cta}`
        : scriptPrompt;
      
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: fullScript,
          targetDuration: 30,
          voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam voice
          style: videoStyle,
          aspectRatio: aspectRatio,
          includeCharacters: includeCharacters,
          businessInfo: brandLinked ? businessInfo : null
        })
      });
      
      const data = await response.json();
      console.log('[BusinessVideo] API response:', data);
      
      if (data.success && data.videoUrl) {
        setGeneratedVideo(data.videoUrl);
        
        // Auto-save to Asset Hub
        try {
          const scriptText = generatedScript 
            ? `${generatedScript.hook} ${generatedScript.scenes.map(s => s.text).join(' ')} ${generatedScript.cta}`
            : scriptPrompt;
          
          saveVideoToHub({
            name: `Video - ${scriptText.substring(0, 40)}${scriptText.length > 40 ? '...' : ''}`,
            url: data.videoUrl,
            caption: scriptText,
            tags: [videoStyle, aspectRatio, brandLinked ? 'brand' : 'generic'].filter(Boolean),
            source: 'BusinessVideo',
            metadata: {
              videoStyle,
              aspectRatio,
              includeCharacters,
              brandLinked,
              businessName: businessInfo?.businessName || null,
              generatedAt: new Date().toISOString()
            }
          });
          console.log('✅ Video auto-saved to Asset Hub');
        } catch (saveError) {
          console.error('Failed to auto-save to Asset Hub:', saveError);
          // Don't throw - video was still generated successfully
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

  // Get full script text for display
  const getFullScriptText = () => {
    if (!generatedScript) return scriptPrompt;
    
    let text = `[HOOK]\n${generatedScript.hook}\n\n`;
    generatedScript.scenes.forEach((scene, idx) => {
      text += `[SCENE ${idx + 1}] (${scene.duration}s)\n`;
      text += `${scene.text}\n`;
      text += `Visual: ${scene.visual}\n\n`;
    });
    text += `[CTA]\n${generatedScript.cta}`;
    
    return text;
  };

  // Calculate total duration
  const getTotalDuration = () => {
    if (!generatedScript) return 30;
    const hookDuration = 3;
    const ctaDuration = 3;
    const scenesDuration = generatedScript.scenes.reduce((sum, s) => sum + (s.duration || 5), 0);
    return hookDuration + scenesDuration + ctaDuration;
  };

  return (
    <div className="business-video-page">
      <div className="business-video-container">
        
        {/* Header */}
        <div className="page-header-row">
          <button className="back-btn" onClick={handleBack}>
            <FiArrowLeft />
            <span>Back</span>
          </button>
          <div className="page-title">
            <FiVideo className="title-icon" />
            <h1>Create Video</h1>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="steps-progress">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <span>Script</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <span>Settings</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Generate</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="step-content">
          
          {/* STEP 1: Script */}
          {currentStep === 1 && (
            <div className="step-panel">
              <div className="step-header">
                <span className="step-label">Step 1 of 3</span>
                <h2>Create Your Script</h2>
                <p>Choose how you want to create your video script</p>
              </div>

              {/* Script Mode Toggle */}
              <div className="script-mode-toggle">
                <button 
                  className={`mode-btn ${scriptMode === 'generate' ? 'active' : ''}`}
                  onClick={() => setScriptMode('generate')}
                >
                  <FiZap />
                  <span>Generate Script</span>
                </button>
                <button 
                  className={`mode-btn ${scriptMode === 'custom' ? 'active' : ''}`}
                  onClick={() => setScriptMode('custom')}
                >
                  <FiEdit3 />
                  <span>Use Your Own Script</span>
                </button>
              </div>

              {/* Script Input Area */}
              <div className="script-input-area">
                {scriptMode === 'generate' ? (
                  <>
                    <label>What's your video about?</label>
                    <textarea
                      className="script-textarea"
                      placeholder="Describe your video topic... e.g., 'A promotional video for our new fitness app that helps people track their workouts'"
                      value={scriptPrompt}
                      onChange={(e) => setScriptPrompt(e.target.value)}
                      rows={4}
                    />
                    <button 
                      className="generate-script-btn"
                      onClick={handleGenerateScript}
                      disabled={!scriptPrompt.trim() || isGeneratingScript}
                    >
                      {isGeneratingScript ? (
                        <>
                          <FiRefreshCw className="spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <FiZap />
                          <span>Generate Script</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <label>Enter your script</label>
                    <textarea
                      className="script-textarea large"
                      placeholder="Write your video script here. Break it into sentences for different scenes. Include your hook at the start and call-to-action at the end."
                      value={scriptPrompt}
                      onChange={handleCustomScriptChange}
                      rows={8}
                    />
                  </>
                )}
              </div>

              {/* Generated Script Preview */}
              {generatedScript && (
                <div className="generated-script-preview">
                  <div className="preview-header">
                    <h3>📝 Generated Script</h3>
                    <span className="duration-badge">{getTotalDuration()}s</span>
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
                  
                  <button 
                    className="regenerate-btn"
                    onClick={handleGenerateScript}
                    disabled={isGeneratingScript}
                  >
                    <FiRefreshCw />
                    <span>Regenerate</span>
                  </button>
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

          {/* STEP 2: Video Settings */}
          {currentStep === 2 && (
            <div className="step-panel">
              <div className="step-header">
                <span className="step-label">Step 2 of 3</span>
                <h2>Video Settings</h2>
                <p>Customize video settings to match your brand and style</p>
              </div>

              {/* Brand Details */}
              <div className="settings-section">
                <h3>Brand Details</h3>
                <div className="brand-status">
                  {brandLinked && hasBusinessInfo ? (
                    <div className="brand-linked">
                      <FiCheckCircle className="check-icon" />
                      <div>
                        <strong>Brand details linked</strong>
                        <p>Your brand identity will be applied to the video</p>
                        {businessInfo?.businessName && (
                          <span className="brand-name">{businessInfo.businessName}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="brand-not-linked">
                      <p>No brand details linked. <Link to="/dashboard/business/hub">Set up your brand →</Link></p>
                    </div>
                  )}
                </div>
              </div>

              {/* Include Characters */}
              <div className="settings-section">
                <h3>Include Characters</h3>
                <div className="character-options">
                  <button 
                    className={`character-btn ${includeCharacters ? 'active' : ''}`}
                    onClick={() => setIncludeCharacters(true)}
                  >
                    <FiUser />
                    <span>With Characters</span>
                    <small>Videos featuring people</small>
                  </button>
                  <button 
                    className={`character-btn ${!includeCharacters ? 'active' : ''}`}
                    onClick={() => setIncludeCharacters(false)}
                  >
                    <FiBox />
                    <span>Without Characters</span>
                    <small>Product/scene focus only</small>
                  </button>
                </div>
              </div>

              {/* Video Styles */}
              <div className="settings-section">
                <h3>Video Style</h3>
                <p className="section-desc">Choose your preferred video format</p>
                <div className="video-styles-grid">
                  {videoStyles
                    .filter(style => includeCharacters ? true : !style.hasCharacters)
                    .map(style => (
                      <div 
                        key={style.id}
                        className={`style-card ${videoStyle === style.id ? 'selected' : ''}`}
                        onClick={() => setVideoStyle(style.id)}
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
                <p>Review and confirm your script before generating</p>
              </div>

              {/* Settings Summary */}
              <div className="settings-summary">
                <div className="summary-item">
                  <span className="summary-label">Style</span>
                  <span className="summary-value">
                    {videoStyles.find(s => s.id === videoStyle)?.label}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Aspect Ratio</span>
                  <span className="summary-value">{aspectRatio}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Characters</span>
                  <span className="summary-value">
                    {includeCharacters ? 'With People' : 'Product Focus'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Duration</span>
                  <span className="summary-value">~{getTotalDuration()}s</span>
                </div>
              </div>

              {/* Script Review */}
              <div className="script-review">
                <h3>📜 Your Script</h3>
                <div className="script-display">
                  <pre>{getFullScriptText()}</pre>
                </div>
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
                  <h3>🎉 Your Video is Ready!</h3>
                  <div className="video-preview">
                    <video src={generatedVideo} controls autoPlay loop />
                  </div>
                  <div className="result-actions">
                    <a 
                      href={generatedVideo} 
                      download="video.mp4"
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
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <FiLoader className="spin" />
                      <span>Generating Video... (5-10 min)</span>
                    </>
                  ) : (
                    <>
                      <FiVideo />
                      <span>Generate Video</span>
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
