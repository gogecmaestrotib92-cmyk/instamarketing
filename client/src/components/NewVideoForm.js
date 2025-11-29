import React from 'react';
import { FiMusic, FiType } from 'react-icons/fi';
import './NewVideoForm.css';

/**
 * NewVideoForm Component
 * Modern, clean video generation form
 * 
 * @param {string} activeTab - Current tab ('text-to-video' or 'image-to-video')
 * @param {Function} onTabChange - Tab change handler
 * @param {string} prompt - Current prompt value
 * @param {Function} onPromptChange - Prompt change handler
 * @param {number} duration - Selected duration
 * @param {Function} onDurationChange - Duration change handler
 * @param {boolean} loading - Loading state
 * @param {number} loadingProgress - Loading progress percentage (0-100)
 * @param {string} loadingStatus - Current loading status message
 * @param {Function} onGenerate - Generate button handler
 * @param {Function} onMusicClick - Music button handler
 * @param {Function} onTextClick - Text button handler
 * @param {boolean} hasMusicConfig - Whether music is configured
 * @param {boolean} hasTextConfig - Whether text is configured
 */

const SUGGESTIONS = [
  "Cinematic drone shot flying over ocean waves at sunset",
  "Abstract colorful liquid flowing in slow motion",
  "Futuristic city with flying cars and neon lights",
  "Ocean waves crashing on rocks, golden hour"
];

const NewVideoForm = ({
  activeTab = 'text-to-video',
  onTabChange,
  prompt = '',
  onPromptChange,
  duration = 5,
  onDurationChange,
  loading = false,
  loadingProgress = 0,
  loadingStatus = '',
  onGenerate,
  onMusicClick,
  onTextClick,
  hasMusicConfig = false,
  hasTextConfig = false,
  // Image upload props
  imagePreview,
  onImageChange,
  onImageRemove
}) => {
  return (
    <div className="nvf-container">
      {/* Tabs */}
      <div className="nvf-tabs">
        <button 
          className={`nvf-tab ${activeTab === 'text-to-video' ? 'nvf-tab--active' : ''}`}
          onClick={() => onTabChange?.('text-to-video')}
        >
          Text to Video
        </button>
        <button 
          className={`nvf-tab ${activeTab === 'image-to-video' ? 'nvf-tab--active' : ''}`}
          onClick={() => onTabChange?.('image-to-video')}
        >
          Image to Video
        </button>
      </div>

      {/* Image Upload (for image-to-video) */}
      {activeTab === 'image-to-video' && (
        <div className="nvf-section">
          <label className="nvf-label">Select image to animate</label>
          <div className="nvf-image-upload-area">
            {imagePreview ? (
              <div className="nvf-image-preview-container">
                <img src={imagePreview} alt="Preview" className="nvf-image-preview-img" />
                <button className="nvf-image-remove-btn" onClick={onImageRemove}>
                  Remove
                </button>
              </div>
            ) : (
              <label className="nvf-upload-placeholder">
                <span className="nvf-upload-icon">🖼️</span>
                <span>Click to upload image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  hidden
                />
              </label>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="nvf-section">
        <label className="nvf-label">
          {activeTab === 'text-to-video' 
            ? 'Describe the video you want' 
            : 'Describe the desired animation (optional)'}
        </label>
        <textarea
          className="nvf-textarea"
          placeholder={activeTab === 'text-to-video'
            ? "E.g.: Cinematic drone shot of sunset over ocean waves, golden hour lighting, 4K quality..."
            : "E.g.: Slow zoom in with gentle movement, cinematic feel..."
          }
          value={prompt}
          onChange={(e) => onPromptChange?.(e.target.value)}
        />
      </div>

      {/* Suggestions */}
      {activeTab === 'text-to-video' && (
        <div className="nvf-section">
          <label className="nvf-label">Suggestions</label>
          <div className="nvf-chips">
            {SUGGESTIONS.map((suggestion, index) => (
              <button 
                key={index}
                className="nvf-chip"
                onClick={() => onPromptChange?.(suggestion)}
              >
                {suggestion.length > 40 ? suggestion.substring(0, 40) + '...' : suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Duration + Format */}
      <div className="nvf-row">
        <div className="nvf-section nvf-half">
          <label className="nvf-label">Duration</label>
          <select 
            className="nvf-select"
            value={duration}
            onChange={(e) => onDurationChange?.(Number(e.target.value))}
          >
            <option value={5}>5 seconds</option>
            <option value={10}>10 seconds</option>
          </select>
        </div>

        <div className="nvf-section nvf-half">
          <label className="nvf-label">Format</label>
          <button className="nvf-format-btn">📱 9:16 (Reels / TikTok)</button>
        </div>
      </div>

      {/* Music + Text */}
      <div className="nvf-row">
        <button 
          className={`nvf-addon-btn ${hasMusicConfig ? 'nvf-addon-btn--active' : ''}`}
          onClick={onMusicClick}
        >
          <FiMusic /> {hasMusicConfig ? 'Music ✓' : 'Add Music'}
        </button>
        <button 
          className={`nvf-addon-btn ${hasTextConfig ? 'nvf-addon-btn--active' : ''}`}
          onClick={onTextClick}
        >
          <FiType /> {hasTextConfig ? 'Text ✓' : 'Add Text'}
        </button>
      </div>

      {/* Generate button */}
      <button 
        className={`nvf-generate-btn ${loading ? 'nvf-generate-btn--loading' : ''}`}
        onClick={onGenerate}
        disabled={loading}
      >
        {loading ? (
          <div className="nvf-loading-content">
            <div className="nvf-loading-spinner"></div>
            <div className="nvf-loading-text">
              <span className="nvf-loading-status">{loadingStatus || 'Generating...'}</span>
              <span className="nvf-loading-percent">{loadingProgress}%</span>
            </div>
            <div className="nvf-progress-bar">
              <div 
                className="nvf-progress-fill" 
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <>⚡ Generate Video</>
        )}
      </button>

      {/* Cost Info */}
      <p className="nvf-cost-info">
        Estimated time: 1-3 minutes | Cost: ~$0.25-0.50 per video
      </p>
    </div>
  );
};

export default NewVideoForm;
