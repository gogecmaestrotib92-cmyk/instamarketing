import React, { useState } from 'react';
import { FiArrowLeft, FiPlay, FiImage, FiVideo, FiUpload, FiPlus, FiMinus, FiCheck, FiSquare, FiSmartphone, FiMonitor, FiMic, FiDownload, FiRefreshCw } from 'react-icons/fi';
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

  const handleGenerate = async () => {
    if (!postTopic.trim()) return;
    
    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedResult(null);
    
    try {
      // Step 1: Generate script with voiceover (Try ElevenLabs first, fallback to Google TTS)
      setGenerationStep('Generating script and AI voiceover (ElevenLabs)...');
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
        setGenerationStep('Generating script and voiceover (Google TTS)...');
        
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

      // Step 2: Generate background media
      setGenerationStep('Generating background media...');
      let backgroundUrl = null;
      
      if (backgroundType === 'ai-videos') {
        // Generate AI video background
        const videoPrompt = `Cinematic ${contentType} background, ${postTopic}, smooth motion, high quality, trending style`;
        
        const videoResponse = await fetch('/api/ai/video/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: videoPrompt,
            numFrames: 24,
            fps: 8
          })
        });
        
        const videoData = await videoResponse.json();
        
        if (videoData.success && videoData.videoUrl) {
          backgroundUrl = videoData.videoUrl;
          console.log('Video background generated:', backgroundUrl);
        } else {
          console.warn('Video generation failed, continuing without background');
        }
      } else if (backgroundType === 'ai-images') {
        // Generate AI image background
        const imagePrompt = `${contentType} themed background image for: ${postTopic}, high quality, social media style`;
        
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
          console.log('Image background generated:', backgroundUrl);
        }
      }

      // Step 3: Prepare final result
      setGenerationStep('Preparing your video...');
      
      const result = {
        id: Date.now().toString(),
        type: 'voiceover-video',
        name: `Voiceover - ${postTopic.substring(0, 30)}${postTopic.length > 30 ? '...' : ''}`,
        script: voiceoverData.script,
        audioUrl: voiceoverData.audioUrl,
        backgroundUrl: backgroundUrl,
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
          backgroundType
        }
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
              <span className="char-count">{postTopic.length}/500</span>
            </div>
          </div>
          
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
            
            <div className="result-content">
              {generatedResult.backgroundUrl && (
                <div className="result-media">
                  {backgroundType === 'ai-videos' ? (
                    <video src={generatedResult.backgroundUrl} controls autoPlay loop muted />
                  ) : (
                    <img src={generatedResult.backgroundUrl} alt="Generated background" />
                  )}
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
                <button className="btn-action download" onClick={() => handleDownload(generatedResult.backgroundUrl, `background-${Date.now()}.${backgroundType === 'ai-videos' ? 'mp4' : 'png'}`)}>
                  <FiDownload /> Media
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
