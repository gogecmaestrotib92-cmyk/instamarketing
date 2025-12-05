import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiCopy, FiSave, FiTrash2, FiRefreshCw, FiUpload, FiEdit2, FiImage, FiHash, FiFileText, FiZap, FiSearch, FiX } from 'react-icons/fi';
import api from '../services/api';
import './MemesCreate.css';

// Default meme backgrounds
const DEFAULT_BACKGROUNDS = [
  { id: 'solid-black', name: 'Classic Black', type: 'solid', value: '#000000' },
  { id: 'solid-white', name: 'Clean White', type: 'solid', value: '#FFFFFF' },
  { id: 'solid-gray', name: 'Dark Gray', type: 'solid', value: '#2d2d2d' },
  { id: 'solid-blue', name: 'Deep Blue', type: 'solid', value: '#1a365d' },
  { id: 'gradient-sunset', name: 'Sunset', type: 'gradient', value: 'linear-gradient(180deg, #ff6b6b 0%, #feca57 100%)' },
  { id: 'gradient-ocean', name: 'Ocean', type: 'gradient', value: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)' },
  { id: 'gradient-forest', name: 'Forest', type: 'gradient', value: 'linear-gradient(180deg, #134e5e 0%, #71b280 100%)' },
  { id: 'gradient-fire', name: 'Fire', type: 'gradient', value: 'linear-gradient(180deg, #f12711 0%, #f5af19 100%)' }
];

function MemesCreate() {
  // Form state
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('');
  const [humorStyle, setHumorStyle] = useState('relatable');
  
  // Generated content state
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [templateSuggestion, setTemplateSuggestion] = useState('');
  
  // Background state
  const [selectedBackground, setSelectedBackground] = useState(DEFAULT_BACKGROUNDS[0]);
  const [customImage, setCustomImage] = useState(null);
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isSearchingImages, setIsSearchingImages] = useState(false);
  const [suggestedImages, setSuggestedImages] = useState([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  
  // Refs
  const fileInputRef = useRef(null);
  
  // Load drafts on mount
  useEffect(() => {
    loadDrafts();
  }, []);
  
  const loadDrafts = () => {
    const drafts = JSON.parse(localStorage.getItem('memeDrafts') || '[]');
    setSavedDrafts(drafts);
  };
  
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  // Generate meme
  const generateMeme = async () => {
    if (!topic.trim()) {
      showNotification('Please enter a topic', 'error');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/ai/generate-meme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          niche: niche.trim() || 'General',
          humorStyle
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTopText(data.topText || '');
        setBottomText(data.bottomText || '');
        setCaption(data.caption || '');
        setHashtags(data.hashtags || []);
        setTemplateSuggestion(data.templateSuggestion || '');
        showNotification('Meme generated! 😂');
      } else {
        throw new Error(data.error || 'Failed to generate meme');
      }
    } catch (error) {
      console.error('Generate meme error:', error);
      showNotification(error.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Search for images based on AI suggestion
  const searchForSuggestedImage = async (suggestion) => {
    setIsSearchingImages(true);
    setSuggestedImages([]);
    
    try {
      // Extract key visual keywords from suggestion for better stock photo search
      // Remove filler words and keep only meaningful visual terms
      const stopWords = ['a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
        'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
        'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
        'through', 'during', 'before', 'after', 'above', 'below', 'between',
        'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
        'that', 'which', 'who', 'whom', 'whose', 'this', 'these', 'those',
        'what', 'whatever', 'when', 'where', 'how', 'why', 'whether',
        'very', 'really', 'quite', 'rather', 'too', 'also', 'just', 'only',
        'even', 'still', 'already', 'almost', 'about', 'like', 'looking'];
      
      // Clean and extract keywords from suggestion
      const suggestionKeywords = suggestion
        .toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.includes(word))
        .slice(0, 4) // Take up to 4 keywords
        .join(' ');
      
      // Combine topic with suggestion keywords for best results
      // Topic is most important, then key visual elements from suggestion
      const searchQuery = topic.trim() 
        ? `${topic.trim()} ${suggestionKeywords}`.trim()
        : suggestionKeywords || suggestion.slice(0, 50);
      
      console.log('🔍 Meme image search query:', searchQuery);
      
      const response = await api.get('/ai/stock/search', {
        params: {
          query: searchQuery,
          type: 'photos',
          perPage: 8
        }
      });
      
      if (response.data.results && response.data.results.length > 0) {
        setSuggestedImages(response.data.results);
        setShowImagePicker(true);
        showNotification(`Found ${response.data.results.length} matching images! 🖼️`);
      } else {
        showNotification('No images found. Try uploading your own!', 'error');
      }
    } catch (error) {
      console.error('Image search error:', error);
      showNotification('Failed to search for images', 'error');
    } finally {
      setIsSearchingImages(false);
    }
  };
  
  // Select image from suggestions
  const selectSuggestedImage = (imageUrl) => {
    setCustomImage(imageUrl);
    setSelectedBackground(null);
    setShowImagePicker(false);
    showNotification('Image applied! 🎨');
  };
  
  // Handle custom image upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      showNotification('Please upload an image file', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomImage(event.target.result);
      setSelectedBackground(null);
    };
    reader.readAsDataURL(file);
  };
  
  // Download as image
  const downloadAsImage = useCallback(async () => {
    if (!topText && !bottomText) {
      showNotification('Generate or add meme text first', 'error');
      return;
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 1080;
    
    canvas.width = size;
    canvas.height = size;
    
    // Draw background
    if (customImage) {
      // Draw custom image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = customImage;
      });
      
      // Cover fit
      const scale = Math.max(size / img.width, size / img.height);
      const x = (size - img.width * scale) / 2;
      const y = (size - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    } else if (selectedBackground) {
      if (selectedBackground.type === 'solid') {
        ctx.fillStyle = selectedBackground.value;
        ctx.fillRect(0, 0, size, size);
      } else {
        // Parse gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, size);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
      }
    }
    
    // Meme text style - Impact font with stroke
    const fontSize = 72;
    ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Function to draw meme text with outline
    const drawMemeText = (text, y, maxWidth) => {
      const lines = wrapText(ctx, text.toUpperCase(), maxWidth);
      const lineHeight = fontSize * 1.1;
      
      lines.forEach((line, index) => {
        const textY = y + (index * lineHeight);
        
        // Draw stroke (outline)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.lineJoin = 'round';
        ctx.strokeText(line, size / 2, textY);
        
        // Draw fill (white text)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(line, size / 2, textY);
      });
      
      return lines.length * lineHeight;
    };
    
    // Draw top text
    if (topText) {
      drawMemeText(topText, 40, size - 80);
    }
    
    // Draw bottom text
    if (bottomText) {
      const lines = wrapText(ctx, bottomText.toUpperCase(), size - 80);
      const totalHeight = lines.length * fontSize * 1.1;
      const bottomY = size - totalHeight - 40;
      drawMemeText(bottomText, bottomY, size - 80);
    }
    
    // Download
    const link = document.createElement('a');
    link.download = `meme-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    showNotification('Meme downloaded! 📥');
  }, [topText, bottomText, customImage, selectedBackground]);
  
  // Text wrapping helper
  const wrapText = (ctx, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };
  
  // Copy caption/hashtags
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showNotification(`${label} copied! 📋`);
  };
  
  // Save draft
  const saveDraft = () => {
    if (!topText && !bottomText) {
      showNotification('Nothing to save', 'error');
      return;
    }
    
    const draft = {
      id: Date.now(),
      topic,
      niche,
      humorStyle,
      topText,
      bottomText,
      caption,
      hashtags,
      backgroundId: selectedBackground?.id,
      customImage,
      createdAt: new Date().toISOString()
    };
    
    const drafts = JSON.parse(localStorage.getItem('memeDrafts') || '[]');
    drafts.unshift(draft);
    localStorage.setItem('memeDrafts', JSON.stringify(drafts.slice(0, 20)));
    setSavedDrafts(drafts.slice(0, 20));
    
    showNotification('Draft saved! 💾');
  };
  
  // Load draft
  const loadDraft = (draft) => {
    setTopic(draft.topic || '');
    setNiche(draft.niche || '');
    setHumorStyle(draft.humorStyle || 'relatable');
    setTopText(draft.topText || '');
    setBottomText(draft.bottomText || '');
    setCaption(draft.caption || '');
    setHashtags(draft.hashtags || []);
    setCustomImage(draft.customImage || null);
    
    if (draft.backgroundId) {
      const bg = DEFAULT_BACKGROUNDS.find(b => b.id === draft.backgroundId);
      if (bg) setSelectedBackground(bg);
    }
    
    setShowDrafts(false);
    showNotification('Draft loaded! 📂');
  };
  
  // Delete draft
  const deleteDraft = (id, e) => {
    e.stopPropagation();
    const drafts = savedDrafts.filter(d => d.id !== id);
    localStorage.setItem('memeDrafts', JSON.stringify(drafts));
    setSavedDrafts(drafts);
    showNotification('Draft deleted');
  };
  
  const hasMemeContent = topText || bottomText;
  
  return (
    <div className="memes-create-page">
      {/* Header */}
      <div className="memes-header">
        <Link to="/dashboard" className="back-link">
          <FiArrowLeft />
          <span>Back to Dashboard</span>
        </Link>
        <h1>
          <span className="header-icon">😂</span>
          Meme Creator
        </h1>
        <p>Create viral memes with AI-powered text generation</p>
      </div>
      
      {/* Notification */}
      {notification && (
        <div className={`meme-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="memes-content">
        {/* Left Panel - Form */}
        <div className="meme-form-panel">
          <div className="form-section">
            <h3><FiZap /> Generate Meme</h3>
            
            <div className="form-group">
              <label>Topic *</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Monday mornings, coding bugs, gym life..."
              />
            </div>
            
            <div className="form-group">
              <label>Niche (Optional)</label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g., Tech, Fitness, Business..."
              />
            </div>
            
            <div className="form-group">
              <label>Humor Style</label>
              <select
                value={humorStyle}
                onChange={(e) => setHumorStyle(e.target.value)}
              >
                <option value="relatable">Relatable</option>
                <option value="sarcastic">Sarcastic</option>
                <option value="absurd">Absurd</option>
                <option value="wholesome">Wholesome</option>
                <option value="dark">Dark Humor</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>
            
            <button
              className="generate-btn"
              onClick={generateMeme}
              disabled={isGenerating || !topic.trim()}
            >
              {isGenerating ? (
                <>
                  <FiRefreshCw className="spinning" />
                  Generating...
                </>
              ) : (
                <>
                  <FiZap />
                  Generate Meme
                </>
              )}
            </button>
          </div>
          
          {/* Edit Text Section */}
          {hasMemeContent && (
            <div className="form-section">
              <h3><FiEdit2 /> Edit Text</h3>
              
              <div className="form-group">
                <label>Top Text</label>
                <input
                  type="text"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  placeholder="TOP TEXT HERE"
                />
              </div>
              
              <div className="form-group">
                <label>Bottom Text</label>
                <input
                  type="text"
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value)}
                  placeholder="BOTTOM TEXT HERE"
                />
              </div>
            </div>
          )}
          
          {/* AI Image Suggestion - Moved BEFORE Background */}
          {templateSuggestion && (
            <div className="form-section ai-suggestion-card">
              <div className="ai-suggestion-header">
                <span className="ai-badge">✨ AI</span>
                <h3>Suggested Image</h3>
              </div>
              <p className="ai-suggestion-text">"{templateSuggestion}"</p>
              <button
                className="find-image-btn"
                onClick={() => searchForSuggestedImage(templateSuggestion)}
                disabled={isSearchingImages}
              >
                {isSearchingImages ? (
                  <><FiRefreshCw className="spinning" /> Searching...</>
                ) : (
                  <><FiSearch /> Find Matching Image</>
                )}
              </button>
            </div>
          )}
          
          {/* Background Selection */}
          <div className="form-section">
            <h3><FiImage /> Background</h3>
            
            <button
              className="upload-image-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <FiUpload />
              Upload Custom Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            
            {customImage && (
              <button
                className="remove-image-btn"
                onClick={() => {
                  setCustomImage(null);
                  setSelectedBackground(DEFAULT_BACKGROUNDS[0]);
                }}
              >
                <FiTrash2 />
                Remove Custom Image
              </button>
            )}
            
            <div className="backgrounds-grid">
              {DEFAULT_BACKGROUNDS.map(bg => (
                <button
                  key={bg.id}
                  className={`bg-option ${selectedBackground?.id === bg.id && !customImage ? 'selected' : ''}`}
                  style={{
                    background: bg.type === 'solid' ? bg.value : bg.value
                  }}
                  onClick={() => {
                    setSelectedBackground(bg);
                    setCustomImage(null);
                  }}
                  title={bg.name}
                />
              ))}
            </div>
          </div>
          
          {/* Actions */}
          <div className="form-section actions-section">
            <button
              className="action-btn primary"
              onClick={downloadAsImage}
              disabled={!hasMemeContent}
            >
              <FiDownload />
              Download PNG
            </button>
            
            <button
              className="action-btn"
              onClick={saveDraft}
              disabled={!hasMemeContent}
            >
              <FiSave />
              Save Draft
            </button>
            
            <button
              className="action-btn"
              onClick={() => setShowDrafts(!showDrafts)}
            >
              <FiFileText />
              My Drafts ({savedDrafts.length})
            </button>
          </div>
        </div>
        
        {/* Right Panel - Preview */}
        <div className="meme-preview-panel">
          <div className="preview-header">
            <h3>Preview</h3>
          </div>
          
          <div
            className="meme-preview-card"
            style={{
              background: customImage
                ? `url(${customImage}) center/cover no-repeat`
                : selectedBackground?.type === 'solid'
                  ? selectedBackground.value
                  : selectedBackground?.value || '#000'
            }}
          >
            {!hasMemeContent ? (
              <div className="empty-preview">
                <span className="emoji">😂</span>
                <p>Your meme will appear here</p>
              </div>
            ) : (
              <>
                {topText && (
                  <div className="meme-text top-text">
                    {topText.toUpperCase()}
                  </div>
                )}
                {bottomText && (
                  <div className="meme-text bottom-text">
                    {bottomText.toUpperCase()}
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Caption & Hashtags */}
          {caption && (
            <div className="caption-section">
              <div className="section-header">
                <h4><FiFileText /> Caption</h4>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(caption, 'Caption')}
                >
                  <FiCopy />
                </button>
              </div>
              <p className="caption-text">{caption}</p>
            </div>
          )}
          
          {hashtags.length > 0 && (
            <div className="hashtags-section">
              <div className="section-header">
                <h4><FiHash /> Hashtags</h4>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(hashtags.join(' '), 'Hashtags')}
                >
                  <FiCopy />
                </button>
              </div>
              <div className="hashtags-list">
                {hashtags.map((tag, index) => (
                  <span key={index} className="hashtag">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Drafts Panel */}
      {showDrafts && (
        <div className="drafts-overlay" onClick={() => setShowDrafts(false)}>
          <div className="drafts-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drafts-header">
              <h3>Saved Drafts</h3>
              <button onClick={() => setShowDrafts(false)}>&times;</button>
            </div>
            
            {savedDrafts.length === 0 ? (
              <div className="no-drafts">
                <p>No saved drafts yet</p>
              </div>
            ) : (
              <div className="drafts-list">
                {savedDrafts.map(draft => (
                  <div
                    key={draft.id}
                    className="draft-item"
                    onClick={() => loadDraft(draft)}
                  >
                    <div className="draft-content">
                      <p className="draft-text">
                        {draft.topText || draft.bottomText || 'Empty meme'}
                      </p>
                      <span className="draft-date">
                        {new Date(draft.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      className="delete-draft-btn"
                      onClick={(e) => deleteDraft(draft.id, e)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Image Picker Modal */}
      {showImagePicker && (
        <div className="image-picker-overlay" onClick={() => setShowImagePicker(false)}>
          <div className="image-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="image-picker-header">
              <h3>Choose an Image</h3>
              <button className="close-btn" onClick={() => setShowImagePicker(false)}>
                <FiX />
              </button>
            </div>
            <p className="image-picker-hint">Click an image to use it as your meme background</p>
            <div className="image-picker-grid">
              {suggestedImages.map((image, index) => (
                <div
                  key={index}
                  className="image-picker-item"
                  onClick={() => selectSuggestedImage(image.src?.large || image.src?.medium || image.url)}
                >
                  <img 
                    src={image.src?.medium || image.src?.small || image.url} 
                    alt={image.alt || `Suggested image ${index + 1}`}
                  />
                </div>
              ))}
            </div>
            <div className="image-picker-footer">
              <p className="image-picker-credit">Images from Pexels & Pixabay</p>
              <button 
                className="regenerate-btn"
                onClick={() => searchForSuggestedImage(templateSuggestion)}
                disabled={isSearchingImages}
              >
                {isSearchingImages ? '🔄 Searching...' : '🔄 Find Different Images'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemesCreate;
