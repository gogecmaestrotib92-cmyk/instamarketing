import React, { useState } from 'react';
import { FiArrowLeft, FiPlay, FiImage, FiVideo, FiUpload, FiPlus, FiMinus, FiCheck, FiSquare, FiSmartphone, FiMonitor, FiMic, FiDownload, FiRefreshCw, FiZap, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './BusinessTrending.css';

const BusinessTrending = () => {
  const navigate = useNavigate();
  
  // Form state
  const [contentType, setContentType] = useState('tips');
  const [postTopic, setPostTopic] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('viral-karaoke');
  const [numGenerations, setNumGenerations] = useState(1);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [backgroundType, setBackgroundType] = useState('ai-videos');
  const [selectedMedia, setSelectedMedia] = useState(null);
  
  // AI Advice state
  const [showAdvice, setShowAdvice] = useState(false);
  const [aiAdvice, setAiAdvice] = useState([]);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [generatedResult, setGeneratedResult] = useState(null);
  const [generationError, setGenerationError] = useState(null);

  // Content types
  const contentTypes = [
    { id: 'tips', label: 'Tips & Tricks', icon: '💡' },
    { id: 'facts', label: 'Facts', icon: '📊' },
    { id: 'quotes', label: 'Quotes', icon: '💬' },
    { id: 'story', label: 'Story', icon: '📖' },
    { id: 'tutorial', label: 'Tutorial', icon: '🎓' },
    { id: 'motivation', label: 'Motivation', icon: '🔥' },
  ];

  // Template options (simplified from subtitleTemplates)
  const templates = [
    { id: 'viral-karaoke', name: 'Karaoke Highlight', preview: 'Word by word highlight', color: '#FFD700' },
    { id: 'viral-tiktok-caption', name: 'TikTok Caption', preview: 'Clean auto caption look', color: '#FFFFFF' },
    { id: 'viral-bold-top', name: 'Bold Attention', preview: 'Big bold hook style', color: '#FFFFFF' },
    { id: 'viral-motivation-center', name: 'Motivational', preview: 'Elegant centered quote', color: '#FFFFFF' },
    { id: 'viral-netflix', name: 'Netflix Style', preview: 'Yellow subtitle', color: '#F1C40F' },
    { id: 'viral-mrbeast', name: 'MrBeast Style', preview: 'Bold with thick stroke', color: '#FFFFFF' },
    { id: 'neon-pink', name: 'Neon Pink', preview: 'Glowing neon effect', color: '#FF10F0' },
    { id: 'viral-story-yellow', name: 'Story Yellow', preview: 'Emotional storytelling', color: '#FFD700' },
  ];

  // Aspect ratio options
  const aspectRatios = [
    { id: '9:16', label: '9:16', icon: FiSmartphone, description: 'Story/Reel' },
    { id: '1:1', label: '1:1', icon: FiSquare, description: 'Square' },
    { id: '16:9', label: '16:9', icon: FiMonitor, description: 'Landscape' },
  ];

  // Background types
  const backgroundTypes = [
    { id: 'ai-videos', label: 'AI Videos', icon: FiVideo, description: 'AI-generated backgrounds' },
    { id: 'ai-images', label: 'AI Images', icon: FiImage, description: 'AI-generated images' },
    { id: 'upload', label: 'Choose Media', icon: FiUpload, description: 'Upload your own' },
  ];

  // Voice style mapping based on content type
  const getVoiceStyle = () => {
    const styleMap = {
      'tips': 'energetic',
      'facts': 'professional',
      'quotes': 'calm',
      'story': 'storytelling',
      'tutorial': 'educational',
      'motivation': 'motivational'
    };
    return styleMap[contentType] || 'energetic';
  };

  // Generate AI Advice based on user's topic
  const generateAIAdvice = async () => {
    setIsLoadingAdvice(true);
    setShowAdvice(true);
    
    try {
      const baseTopic = postTopic.trim() || 'viral content ideas';
      const contentLabel = contentTypes.find(c => c.id === contentType)?.label || 'Tips';
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Based on this video topic: "${baseTopic}" for ${contentLabel} content type.

Generate 6 viral voiceover video script ideas. Each should be catchy, engaging, and perfect for Instagram/TikTok.

For each suggestion, provide:
1. A hook (attention-grabbing first line)
2. Brief description of the content flow

Format as JSON array:
[
  {
    "title": "Short catchy title",
    "hook": "The opening hook line",
    "description": "Brief content flow description"
  }
]

Focus on trending formats, emotional hooks, and viral potential. Make them specific to: ${baseTopic}`,
          systemPrompt: 'You are a viral content strategist specializing in short-form video. Return ONLY valid JSON array, no markdown or extra text.'
        })
      });

      const data = await response.json();
      
      if (data.success && data.response) {
        try {
          // Clean and parse JSON response
          let jsonStr = data.response.trim();
          if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '');
          }
          const suggestions = JSON.parse(jsonStr);
          setAiAdvice(suggestions);
        } catch (parseError) {
          console.error('Failed to parse AI advice:', parseError);
          // Fallback suggestions
          setAiAdvice([
            { title: `${contentLabel}: ${baseTopic}`, hook: `Here's what nobody tells you about ${baseTopic}...`, description: 'Eye-opening insights that challenge common beliefs' },
            { title: `3 ${baseTopic} secrets`, hook: `Stop scrolling! These 3 ${baseTopic} tips changed everything...`, description: 'Quick, actionable tips with visual examples' },
            { title: `${baseTopic} mistakes`, hook: `You're making these ${baseTopic} mistakes every day...`, description: 'Common errors and how to fix them instantly' },
          ]);
        }
      }
    } catch (error) {
      console.error('AI advice error:', error);
      setAiAdvice([]);
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  // Apply AI suggestion
  const applyAdviceSuggestion = (suggestion) => {
    setPostTopic(`${suggestion.hook} ${suggestion.description}`);
    setShowAdvice(false);
  };

  const handleGenerate = async () => {
    if (!postTopic.trim()) return;
    
    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedResult(null);
    
    try {
      // Step 1: Generate script with voiceover (Try ElevenLabs first, fallback to Google TTS)
      setGenerationStep('Generating script and AI voiceover...');
      console.log('Step 1: Generating script and voiceover for:', postTopic);
      
      let voiceoverData = null;
      let usedElevenLabs = false;
      
      // Try ElevenLabs first (premium quality)
      try {
        const elevenLabsResponse = await fetch('/api/ai/elevenlabs/full-voiceover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: `${contentType}: ${postTopic}`,
            duration: 30,
            voiceStyle: getVoiceStyle()
          })
        });
        
        const elevenLabsData = await elevenLabsResponse.json();
        
        if (elevenLabsResponse.ok && !elevenLabsData.error && elevenLabsData.audioUrl) {
          voiceoverData = elevenLabsData;
          usedElevenLabs = true;
          console.log('✅ ElevenLabs voiceover generated:', elevenLabsData);
        } else {
          console.warn('ElevenLabs not available:', elevenLabsData.error);
        }
      } catch (elevenLabsError) {
        console.warn('ElevenLabs failed, trying Google TTS:', elevenLabsError);
      }
      
      // Fallback to Google TTS if ElevenLabs fails
      if (!voiceoverData) {
        setGenerationStep('Generating script and voiceover...');
        
        const googleResponse = await fetch('/api/ai/full-voiceover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: `${contentType}: ${postTopic}`,
            duration: 30,
            voiceStyle: getVoiceStyle()
          })
        });
        
        voiceoverData = await googleResponse.json();
        
        if (!googleResponse.ok || voiceoverData.error) {
          throw new Error(voiceoverData.error || 'Failed to generate voiceover');
        }
        console.log('✅ Google TTS voiceover generated:', voiceoverData);
      }

      // Step 2: Generate background based on selection
      setGenerationStep('Creating background visual...');
      let backgroundUrl = null;
      let backgroundType_used = backgroundType;
      
      if (backgroundType === 'ai-images') {
        // Generate AI image - this works well as a static background
        const imagePrompt = `${contentType} aesthetic background, ${postTopic}, minimalist, high quality, gradient, social media style, 9:16 vertical`;
        
        const imageResponse = await fetch('/api/ai/image/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: imagePrompt,
            aspectRatio: aspectRatio
          })
        });
        
        const imageData = await imageResponse.json();
        
        if (imageData.success && imageData.imageUrl) {
          backgroundUrl = imageData.imageUrl;
          console.log('✅ Image background generated:', backgroundUrl);
        }
      } else if (backgroundType === 'ai-videos') {
        // For now, generate an AI image instead since AI video is too short
        // In production, you'd use stock video APIs like Pexels or pre-made loops
        setGenerationStep('Creating visual background...');
        
        const imagePrompt = `Cinematic ${contentType} scene, ${postTopic}, dramatic lighting, trending aesthetic, vertical composition`;
        
        const imageResponse = await fetch('/api/ai/image/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: imagePrompt,
            aspectRatio: '9:16'
          })
        });
        
        const imageData = await imageResponse.json();
        
        if (imageData.success && imageData.imageUrl) {
          backgroundUrl = imageData.imageUrl;
          backgroundType_used = 'ai-images'; // Switch to image since video is too short
          console.log('✅ Using AI image as background (video clips are too short):', backgroundUrl);
        }
      }

      // Step 3: Prepare final result
      setGenerationStep('Preparing your content...');
      
      const result = {
        id: Date.now().toString(),
        type: 'voiceover-video',
        name: `Voiceover - ${postTopic.substring(0, 30)}${postTopic.length > 30 ? '...' : ''}`,
        script: voiceoverData.script,
        audioUrl: voiceoverData.audioUrl,
        backgroundUrl: backgroundUrl,
        backgroundType: backgroundType_used,
        template: selectedTemplate,
        aspectRatio: aspectRatio,
        contentType: contentType,
        ttsProvider: usedElevenLabs ? 'ElevenLabs' : 'Google TTS',
        createdAt: new Date().toISOString(),
        metadata: {
          postTopic,
          contentType,
          template: selectedTemplate,
          aspectRatio,
          backgroundType: backgroundType_used
        },
        // Instructions for user
        instructions: backgroundType === 'ai-videos' 
          ? '💡 Tip: AI-generated videos are only ~5 seconds. For longer videos, use a video editor to loop the background or add stock footage, then overlay your voiceover.'
          : null
      };
      
      setGeneratedResult(result);
      
      // Save to Asset Hub
      try {
        const existingAssets = JSON.parse(localStorage.getItem('assetHub') || '[]');
        existingAssets.unshift({
          ...result,
          url: backgroundUrl || voiceoverData.audioUrl
        });
        localStorage.setItem('assetHub', JSON.stringify(existingAssets));
        console.log('Saved to Asset Hub');
      } catch (saveError) {
        console.error('Failed to save to Asset Hub:', saveError);
      }
      
      setGenerationStep('');
      console.log('Generation complete:', result);
      
    } catch (error) {
      console.error('Generation error:', error);
      setGenerationError(error.message || 'Failed to generate. Please try again.');
      setGenerationStep('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      window.open(url, '_blank');
    }
  };

  const handleRegenerate = () => {
    setGeneratedResult(null);
    handleGenerate();
  };

  const incrementGenerations = () => {
    if (numGenerations < 5) setNumGenerations(numGenerations + 1);
  };

  const decrementGenerations = () => {
    if (numGenerations > 1) setNumGenerations(numGenerations - 1);
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedMedia(file);
    }
  };

  return (
    <div className="business-trending-page">
      <div className="business-trending-container">
        {/* Minimal Header */}
        <div className="trending-header">
          <button className="back-btn" onClick={() => navigate('/app/create/business')}>
            <FiArrowLeft />
          </button>
          <h1>Trending Voiceover</h1>
        </div>

        {/* Hero Topic Input Card */}
        <div className="hero-card">
          <div className="hero-content">
            <div className="hero-icon">
              <FiMic />
            </div>
            <h2>What's your video about?</h2>
            <p>Describe your content and we'll create a viral voiceover video</p>
          </div>
          
          <div className="hero-input">
            <textarea
              className="hero-textarea"
              placeholder="e.g., 3 tips to improve your abs, or a motivational quote about success..."
              value={postTopic}
              onChange={(e) => setPostTopic(e.target.value)}
              rows={5}
            />
            <div className="textarea-footer">
              <button 
                className="ai-advice-btn"
                onClick={generateAIAdvice}
                disabled={isLoadingAdvice}
              >
                <FiZap />
                <span>AI Advice</span>
              </button>
              <span className="char-count">{postTopic.length}/500</span>
            </div>
          </div>

          {/* AI Advice Panel */}
          {showAdvice && (
            <div className="ai-advice-panel">
              <div className="advice-header">
                <h4><FiZap /> AI Suggestions</h4>
                <button className="close-advice" onClick={() => setShowAdvice(false)}>
                  <FiX />
                </button>
              </div>
              
              {isLoadingAdvice ? (
                <div className="advice-loading">
                  <div className="advice-spinner"></div>
                  <span>Generating viral ideas...</span>
                </div>
              ) : (
                <div className="advice-grid">
                  {aiAdvice.map((suggestion, index) => (
                    <button
                      key={index}
                      className="advice-card"
                      onClick={() => applyAdviceSuggestion(suggestion)}
                    >
                      <span className="advice-title">{suggestion.title}</span>
                      <span className="advice-hook">"{suggestion.hook}"</span>
                      <span className="advice-desc">{suggestion.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Content Type Pills */}
          <div className="content-pills">
            {contentTypes.map((type) => (
              <button
                key={type.id}
                className={`content-pill ${contentType === type.id ? 'active' : ''}`}
                onClick={() => setContentType(type.id)}
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Compact Settings Row */}
        <div className="settings-row">
          {/* Template Dropdown */}
          <div className="setting-group">
            <label>Template</label>
            <div className="template-selector">
              <div 
                className="template-preview-mini"
                style={{ '--preview-color': templates.find(t => t.id === selectedTemplate)?.color }}
              >
                Aa
              </div>
              <select 
                value={selectedTemplate} 
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="setting-group">
            <label>Aspect</label>
            <div className="aspect-pills">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio.id}
                  className={`aspect-pill ${aspectRatio === ratio.id ? 'active' : ''}`}
                  onClick={() => setAspectRatio(ratio.id)}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>

          {/* Background Type */}
          <div className="setting-group">
            <label>Background</label>
            <div className="bg-pills">
              {backgroundTypes.map((bg) => (
                <button
                  key={bg.id}
                  className={`bg-pill ${backgroundType === bg.id ? 'active' : ''}`}
                  onClick={() => setBackgroundType(bg.id)}
                  title={bg.description}
                >
                  <bg.icon />
                </button>
              ))}
            </div>
          </div>

          {/* Generations */}
          <div className="setting-group">
            <label>Count</label>
            <div className="count-control">
              <button onClick={decrementGenerations} disabled={numGenerations <= 1}>
                <FiMinus />
              </button>
              <span>{numGenerations}</span>
              <button onClick={incrementGenerations} disabled={numGenerations >= 5}>
                <FiPlus />
              </button>
            </div>
          </div>
        </div>

        {/* Upload Area (when Choose Media is selected) */}
        {backgroundType === 'upload' && (
          <div className="upload-compact">
            <input
              type="file"
              id="media-upload"
              accept="video/*,image/*"
              onChange={handleMediaUpload}
              hidden
            />
            <label htmlFor="media-upload" className="upload-label-compact">
              {selectedMedia ? (
                <>
                  <FiCheck className="check-icon" />
                  <span>{selectedMedia.name}</span>
                </>
              ) : (
                <>
                  <FiUpload />
                  <span>Upload media</span>
                </>
              )}
            </label>
          </div>
        )}

        {/* Error Message */}
        {generationError && (
          <div className="generation-error">
            <span>⚠️ {generationError}</span>
            <button onClick={() => setGenerationError(null)}>×</button>
          </div>
        )}

        {/* Generation Progress */}
        {isGenerating && generationStep && (
          <div className="generation-progress">
            <div className="progress-spinner"></div>
            <span>{generationStep}</span>
          </div>
        )}

        {/* Generated Result */}
        {generatedResult && !isGenerating && (
          <div className="generation-result">
            <div className="result-header">
              <h3>🎉 Generated!</h3>
              <span className="tts-provider">
                {generatedResult.ttsProvider || 'AI'}
                {generatedResult.ttsProvider === 'ElevenLabs' && <span className="premium-tag">PRO</span>}
              </span>
            </div>
            
            {/* Tip for users */}
            {generatedResult.instructions && (
              <div className="result-tip">
                {generatedResult.instructions}
              </div>
            )}
            
            <div className="result-content">
              {generatedResult.backgroundUrl && (
                <div className="result-media">
                  <img src={generatedResult.backgroundUrl} alt="Generated background" />
                </div>
              )}
              
              {generatedResult.audioUrl && (
                <div className="result-audio">
                  <label>🎙️ Voiceover</label>
                  <audio src={generatedResult.audioUrl} controls />
                </div>
              )}
              
              {generatedResult.script && (
                <div className="result-script">
                  <label>📝 Script</label>
                  <p>{generatedResult.script}</p>
                </div>
              )}
            </div>
            
            <div className="result-actions">
              {generatedResult.audioUrl && (
                <button className="btn-action download" onClick={() => handleDownload(generatedResult.audioUrl, `voiceover-${Date.now()}.mp3`)}>
                  <FiDownload /> Audio
                </button>
              )}
              {generatedResult.backgroundUrl && (
                <button className="btn-action download" onClick={() => handleDownload(generatedResult.backgroundUrl, `background-${Date.now()}.png`)}>
                  <FiDownload /> Image
                </button>
              )}
              <button className="btn-action secondary" onClick={handleRegenerate}>
                <FiRefreshCw /> Retry
              </button>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button 
          className="btn-generate-hero"
          onClick={handleGenerate}
          disabled={!postTopic.trim() || isGenerating}
        >
          {isGenerating ? (
            <>
              <div className="spinner"></div>
              <span>{generationStep || 'Generating...'}</span>
            </>
          ) : (
            <>
              <FiPlay />
              <span>Generate Video</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BusinessTrending;
