import React, { useState } from 'react';
import { FiTrendingUp, FiArrowLeft, FiPlay, FiImage, FiVideo, FiUpload, FiPlus, FiMinus, FiCheck, FiSquare, FiSmartphone, FiMonitor, FiMic } from 'react-icons/fi';
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

  const handleGenerate = async () => {
    if (!postTopic.trim()) return;
    
    setIsGenerating(true);
    // TODO: Connect to actual video generation API
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsGenerating(false);
    
    // Navigate to results or show preview
    console.log('Generating voiceover video:', {
      contentType,
      postTopic,
      template: selectedTemplate,
      generations: numGenerations,
      aspectRatio,
      backgroundType,
      media: selectedMedia
    });
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
        {/* Header */}
        <div className="page-header-row">
          <button className="back-btn" onClick={() => navigate('/app/create/business')}>
            <FiArrowLeft />
            <span>Back</span>
          </button>
          <div className="page-title">
            <FiMic className="title-icon" />
            <div>
              <h1>Trending Voiceover</h1>
              <p>Create viral faceless videos with AI voiceover</p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="trending-form">
          {/* Content Type */}
          <div className="form-section">
            <label className="section-label">Select Content Type</label>
            <div className="content-type-grid">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  className={`content-type-btn ${contentType === type.id ? 'selected' : ''}`}
                  onClick={() => setContentType(type.id)}
                >
                  <span className="type-emoji">{type.icon}</span>
                  <span className="type-label">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Post Topic */}
          <div className="form-section">
            <label className="section-label">
              What is your post about? <span className="required">*</span>
            </label>
            <div className="topic-input-wrapper">
              <textarea
                className="topic-textarea"
                placeholder="e.g., 3 tips to improve your abs"
                value={postTopic}
                onChange={(e) => setPostTopic(e.target.value)}
                rows={3}
              />
              <span className="char-count">{postTopic.length}/500</span>
            </div>
          </div>

          {/* Template Selection */}
          <div className="form-section">
            <label className="section-label">Choose Template</label>
            <div className="template-grid">
              {templates.map((template) => (
                <button
                  key={template.id}
                  className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div 
                    className="template-preview"
                    style={{ '--preview-color': template.color }}
                  >
                    <span>Aa</span>
                  </div>
                  <div className="template-info">
                    <span className="template-name">{template.name}</span>
                    <span className="template-desc">{template.preview}</span>
                  </div>
                  {selectedTemplate === template.id && (
                    <div className="selected-check">
                      <FiCheck />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Number of Generations */}
          <div className="form-section">
            <label className="section-label">Number of Generations</label>
            <div className="generations-control">
              <button 
                className="gen-btn minus"
                onClick={decrementGenerations}
                disabled={numGenerations <= 1}
              >
                <FiMinus />
              </button>
              <div className="gen-display">
                <span className="gen-number">{numGenerations}</span>
              </div>
              <button 
                className="gen-btn plus"
                onClick={incrementGenerations}
                disabled={numGenerations >= 5}
              >
                <FiPlus />
              </button>
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="form-section">
            <label className="section-label">Aspect Ratio</label>
            <div className="ratio-grid">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio.id}
                  className={`ratio-btn ${aspectRatio === ratio.id ? 'selected' : ''}`}
                  onClick={() => setAspectRatio(ratio.id)}
                >
                  <div className={`ratio-icon ratio-${ratio.id.replace(':', '-')}`}>
                    <ratio.icon />
                  </div>
                  <span className="ratio-label">{ratio.label}</span>
                  <span className="ratio-desc">{ratio.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Background Media */}
          <div className="form-section">
            <label className="section-label">Background Media</label>
            <div className="background-options">
              {backgroundTypes.map((bg) => (
                <button
                  key={bg.id}
                  className={`background-btn ${backgroundType === bg.id ? 'selected' : ''}`}
                  onClick={() => setBackgroundType(bg.id)}
                >
                  <bg.icon className="bg-icon" />
                  <span className="bg-label">{bg.label}</span>
                </button>
              ))}
            </div>

            {/* Upload Area (when Choose Media is selected) */}
            {backgroundType === 'upload' && (
              <div className="upload-area">
                <input
                  type="file"
                  id="media-upload"
                  accept="video/*,image/*"
                  onChange={handleMediaUpload}
                  hidden
                />
                <label htmlFor="media-upload" className="upload-label">
                  {selectedMedia ? (
                    <div className="selected-file">
                      <FiCheck className="file-check" />
                      <span>{selectedMedia.name}</span>
                    </div>
                  ) : (
                    <>
                      <FiUpload className="upload-icon" />
                      <span>Click to upload video or image</span>
                      <span className="upload-hint">MP4, MOV, JPG, PNG (max 100MB)</span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="form-actions">
            <button 
              className="btn-generate"
              onClick={handleGenerate}
              disabled={!postTopic.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="spinner"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FiPlay />
                  <span>Generate Voiceover Video</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessTrending;
