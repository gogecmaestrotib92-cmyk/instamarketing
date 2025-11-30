import React from 'react';
import './NewVideoForm.css';

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
  imagePreview,
  onImageChange,
  onImageRemove
}) => {
  return (
    <div className="nvf-container">
      {/* Loading Overlay */}
      {loading && (
        <div className="nvf-overlay">
          <div className="nvf-overlay-content">
            <div className="nvf-progress-ring">
              <svg viewBox="0 0 100 100">
                <circle className="nvf-progress-bg" cx="50" cy="50" r="45" />
                <circle 
                  className="nvf-progress-bar" 
                  cx="50" cy="50" r="45"
                  style={{ strokeDashoffset: 283 - (283 * loadingProgress / 100) }}
                />
              </svg>
              <span className="nvf-progress-text">{loadingProgress}%</span>
            </div>
            <p className="nvf-overlay-status">{loadingStatus || 'Generating your video...'}</p>
            <p className="nvf-overlay-hint">This usually takes 2-3 minutes</p>
          </div>
        </div>
      )}

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

      {/* Image Upload */}
      {activeTab === 'image-to-video' && (
        <div className="nvf-image-area">
          {imagePreview ? (
            <div className="nvf-image-preview">
              <img src={imagePreview} alt="Preview" />
              <button className="nvf-remove-btn" onClick={onImageRemove}>Remove</button>
            </div>
          ) : (
            <label className="nvf-upload">
              <span className="nvf-upload-text">Click to upload image</span>
              <span className="nvf-upload-hint">JPG, PNG, WebP</span>
              <input type="file" accept="image/*" onChange={onImageChange} hidden />
            </label>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="nvf-main">
        {/* Prompt */}
        <textarea
          className="nvf-prompt"
          placeholder={activeTab === 'text-to-video'
            ? "Describe your video..."
            : "Describe the animation..."
          }
          value={prompt}
          onChange={(e) => onPromptChange?.(e.target.value)}
        />

        {/* Generate Button */}
        <button 
          className="nvf-generate"
          onClick={onGenerate}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Video'}
        </button>
      </div>

      {/* Settings - Bottom Left Corner */}
      <div className="nvf-settings">
        <div className="nvf-setting">
          <span className="nvf-setting-label">Duration</span>
          <select 
            className="nvf-select"
            value={duration}
            onChange={(e) => onDurationChange?.(Number(e.target.value))}
          >
            <option value={5}>5s</option>
            <option value={10}>10s</option>
          </select>
        </div>
        <div className="nvf-setting">
          <span className="nvf-setting-label">Format</span>
          <span className="nvf-format">9:16</span>
        </div>
      </div>
    </div>
  );
};

export default NewVideoForm;
