import React, { useState, useRef, useCallback, useMemo } from 'react';
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
  onImageRemove,
  imagePosition,
  onImagePositionChange
}) => {
  // Image pan/zoom state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  
  // Default position if not provided - memoized to avoid recreation
  const position = useMemo(() => imagePosition || { x: 0, y: 0, scale: 1 }, [imagePosition]);
  
  const handleMouseDown = useCallback((e) => {
    if (!imagePreview) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [imagePreview, position.x, position.y]);
  
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    onImagePositionChange?.({ ...position, x: newX, y: newY });
  }, [isDragging, dragStart, position, onImagePositionChange]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleTouchStart = useCallback((e) => {
    if (!imagePreview) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  }, [imagePreview, position.x, position.y]);
  
  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    onImagePositionChange?.({ ...position, x: newX, y: newY });
  }, [isDragging, dragStart, position, onImagePositionChange]);
  
  const handleWheel = useCallback((e) => {
    if (!imagePreview) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(3, Math.max(0.5, position.scale + delta));
    onImagePositionChange?.({ ...position, scale: newScale });
  }, [imagePreview, position, onImagePositionChange]);
  
  const resetPosition = useCallback(() => {
    onImagePositionChange?.({ x: 0, y: 0, scale: 1 });
  }, [onImagePositionChange]);

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
            <div 
              className={`nvf-image-preview ${isDragging ? 'nvf-dragging' : ''}`}
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              onWheel={handleWheel}
            >
              <div className="nvf-image-viewport">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${position.scale})`,
                    cursor: isDragging ? 'grabbing' : 'grab'
                  }}
                  draggable={false}
                />
              </div>
              <div className="nvf-image-controls">
                <button 
                  className="nvf-reset-btn" 
                  onClick={(e) => { e.stopPropagation(); resetPosition(); }}
                  title="Reset position"
                >
                  ↺ Reset
                </button>
                <span className="nvf-zoom-indicator">
                  {Math.round(position.scale * 100)}%
                </span>
                <button 
                  className="nvf-remove-btn" 
                  onClick={(e) => { e.stopPropagation(); onImageRemove(); }}
                >
                  Remove
                </button>
              </div>
              <div className="nvf-image-hint">
                Drag to reposition • Scroll to zoom
              </div>
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
