import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  FiType, 
  FiPlus, 
  FiTrash2, 
  FiEdit2, 
  FiCheck,
  FiX,
  FiCopy,
  FiDownload,
  FiUpload,
  FiChevronDown,
  FiPlay,
  FiPause
} from 'react-icons/fi';
import './CaptionEditor.css';

/**
 * CaptionEditor Component
 * Visual editor for adding text captions/subtitles with timeline
 */
const CaptionEditor = ({ 
  captionsHook, // Result from useTextCaptions hook
  videoDuration = 10,
  videoPreviewUrl = null,
  onPreviewTimeChange
}) => {
  const {
    captions,
    editingId,
    newCaption,
    stylePresets,
    addCaption,
    updateCaption,
    removeCaption,
    clearAllCaptions,
    duplicateCaption,
    startEditing,
    stopEditing,
    updateNewCaption,
    importFromSRT,
    exportToSRT,
    getCaptionAtTime,
    coveragePercentage,
    captionCount
  } = captionsHook;

  const [previewTime, setPreviewTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [error, setError] = useState('');
  
  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  const fileInputRef = useRef(null);

  // Current caption at preview time
  const currentCaption = getCaptionAtTime(previewTime);

  // Handle timeline click
  const handleTimelineClick = useCallback((e) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * videoDuration;
    
    setPreviewTime(Math.max(0, Math.min(newTime, videoDuration)));
    if (onPreviewTimeChange) onPreviewTimeChange(newTime);
  }, [videoDuration, onPreviewTimeChange]);

  // Handle add caption
  const handleAddCaption = useCallback(() => {
    setError('');
    const result = addCaption();
    if (!result.success) {
      setError(result.error);
    }
  }, [addCaption]);

  // Handle caption update
  const handleUpdateCaption = useCallback((id, field, value) => {
    const result = updateCaption(id, { [field]: value });
    if (!result.success) {
      setError(result.error);
    } else {
      setError('');
    }
  }, [updateCaption]);

  // Handle SRT import
  const handleImport = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = importFromSRT(event.target.result);
      if (result.success) {
        setError('');
      }
    };
    reader.readAsText(file);
  }, [importFromSRT]);

  // Handle SRT export
  const handleExport = useCallback(() => {
    const srtContent = exportToSRT();
    const blob = new Blob([srtContent], { type: 'text/srt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'captions.srt';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportToSRT]);

  // Video preview playback
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setPreviewTime(prev => {
          const next = prev + 0.1;
          if (next >= videoDuration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, videoDuration]);

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="caption-editor">
      {/* Header */}
      <div className="caption-header">
        <div className="header-left">
          <FiType className="header-icon" />
          <span className="header-title">Tekst Titlovi</span>
          <span className="caption-count">{captionCount} titl{captionCount === 1 ? '' : 'a'}</span>
        </div>
        <div className="header-actions">
          <button 
            className="btn-action"
            onClick={() => fileInputRef.current?.click()}
            title="Uvezi SRT"
          >
            <FiUpload /> Uvezi
          </button>
          <input 
            ref={fileInputRef}
            type="file"
            accept=".srt"
            onChange={handleImport}
            hidden
          />
          <button 
            className="btn-action"
            onClick={handleExport}
            disabled={captionCount === 0}
            title="Izvezi SRT"
          >
            <FiDownload /> Izvezi
          </button>
          {captionCount > 0 && (
            <button 
              className="btn-action danger"
              onClick={clearAllCaptions}
              title="Obriši sve"
            >
              <FiTrash2 /> Obriši sve
            </button>
          )}
        </div>
      </div>

      {/* Video Preview with Caption Overlay */}
      <div className="preview-container">
        {videoPreviewUrl ? (
          <video 
            ref={videoRef}
            src={videoPreviewUrl}
            className="video-preview"
          />
        ) : (
          <div className="video-placeholder">
            <span>Video Preview</span>
          </div>
        )}
        
        {/* Caption Overlay */}
        {currentCaption && (
          <div 
            className={`caption-overlay position-${stylePresets[currentCaption.style]?.position || 'bottom'}`}
            style={{
              fontFamily: stylePresets[currentCaption.style]?.fontFamily,
              fontSize: stylePresets[currentCaption.style]?.fontSize,
              color: stylePresets[currentCaption.style]?.color,
              backgroundColor: stylePresets[currentCaption.style]?.backgroundColor,
              textShadow: stylePresets[currentCaption.style]?.textShadow
            }}
          >
            {currentCaption.text}
          </div>
        )}

        {/* Preview Controls */}
        <div className="preview-controls">
          <button 
            className="play-btn"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <FiPause /> : <FiPlay />}
          </button>
          <span className="time-display">{formatTime(previewTime)} / {formatTime(videoDuration)}</span>
        </div>
      </div>

      {/* Timeline */}
      <div 
        ref={timelineRef}
        className="caption-timeline"
        onClick={handleTimelineClick}
      >
        {/* Time markers */}
        <div className="time-markers">
          {Array.from({ length: Math.ceil(videoDuration) + 1 }, (_, i) => (
            <span key={i} className="time-marker" style={{ left: `${(i / videoDuration) * 100}%` }}>
              {i}s
            </span>
          ))}
        </div>

        {/* Caption blocks */}
        <div className="timeline-track">
          {captions.map(caption => (
            <div
              key={caption.id}
              className={`timeline-block ${editingId === caption.id ? 'editing' : ''}`}
              style={{
                left: `${(caption.start / videoDuration) * 100}%`,
                width: `${((caption.end - caption.start) / videoDuration) * 100}%`
              }}
              onClick={(e) => {
                e.stopPropagation();
                startEditing(caption.id);
              }}
            >
              <span className="block-text">{caption.text}</span>
            </div>
          ))}
          
          {/* Playhead */}
          <div 
            className="playhead"
            style={{ left: `${(previewTime / videoDuration) * 100}%` }}
          />
        </div>

        {/* Coverage bar */}
        <div className="coverage-bar">
          <div 
            className="coverage-fill"
            style={{ width: `${coveragePercentage}%` }}
          />
          <span className="coverage-label">{coveragePercentage}% pokrivenost</span>
        </div>
      </div>

      {/* Add New Caption Form */}
      <div className="add-caption-form">
        <h4>Dodaj novi titl</h4>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-row">
          <div className="form-group flex-grow">
            <label>Tekst</label>
            <input
              type="text"
              value={newCaption.text}
              onChange={(e) => updateNewCaption('text', e.target.value)}
              placeholder="Unesite tekst titla..."
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Početak (s)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max={videoDuration}
              value={newCaption.start}
              onChange={(e) => updateNewCaption('start', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="form-group">
            <label>Kraj (s)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max={videoDuration}
              value={newCaption.end}
              onChange={(e) => updateNewCaption('end', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="form-group">
            <label>Stil</label>
            <div className="style-dropdown">
              <button 
                className="style-btn"
                onClick={() => setShowStyleDropdown(!showStyleDropdown)}
              >
                {stylePresets[newCaption.style]?.name || 'Default'}
                <FiChevronDown />
              </button>
              {showStyleDropdown && (
                <div className="style-options">
                  {Object.entries(stylePresets).map(([key, preset]) => (
                    <div
                      key={key}
                      className={`style-option ${newCaption.style === key ? 'selected' : ''}`}
                      onClick={() => {
                        updateNewCaption('style', key);
                        setShowStyleDropdown(false);
                      }}
                    >
                      <span className="style-name">{preset.name}</span>
                      <span 
                        className="style-preview"
                        style={{
                          fontFamily: preset.fontFamily,
                          color: preset.color,
                          backgroundColor: preset.backgroundColor
                        }}
                      >
                        Abc
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button 
            className="btn-add"
            onClick={handleAddCaption}
            disabled={!newCaption.text.trim()}
          >
            <FiPlus /> Dodaj
          </button>
        </div>
      </div>

      {/* Captions List */}
      {captionCount > 0 && (
        <div className="captions-list">
          <h4>Dodati titlovi</h4>
          {captions.map((caption, index) => (
            <div 
              key={caption.id} 
              className={`caption-item ${editingId === caption.id ? 'editing' : ''}`}
            >
              <div className="caption-number">{index + 1}</div>
              
              {editingId === caption.id ? (
                // Edit mode
                <div className="caption-edit-form">
                  <input
                    type="text"
                    value={caption.text}
                    onChange={(e) => handleUpdateCaption(caption.id, 'text', e.target.value)}
                    autoFocus
                  />
                  <div className="edit-times">
                    <input
                      type="number"
                      step="0.5"
                      value={caption.start}
                      onChange={(e) => handleUpdateCaption(caption.id, 'start', parseFloat(e.target.value))}
                    />
                    <span>→</span>
                    <input
                      type="number"
                      step="0.5"
                      value={caption.end}
                      onChange={(e) => handleUpdateCaption(caption.id, 'end', parseFloat(e.target.value))}
                    />
                  </div>
                  <button className="btn-icon save" onClick={stopEditing}>
                    <FiCheck />
                  </button>
                </div>
              ) : (
                // View mode
                <>
                  <div className="caption-content">
                    <span className="caption-text">"{caption.text}"</span>
                    <span className="caption-timing">
                      {formatTime(caption.start)} → {formatTime(caption.end)}
                    </span>
                  </div>
                  <div className="caption-actions">
                    <button 
                      className="btn-icon"
                      onClick={() => setPreviewTime(caption.start)}
                      title="Pregled"
                    >
                      <FiPlay />
                    </button>
                    <button 
                      className="btn-icon"
                      onClick={() => startEditing(caption.id)}
                      title="Uredi"
                    >
                      <FiEdit2 />
                    </button>
                    <button 
                      className="btn-icon"
                      onClick={() => duplicateCaption(caption.id)}
                      title="Dupliraj"
                    >
                      <FiCopy />
                    </button>
                    <button 
                      className="btn-icon danger"
                      onClick={() => removeCaption(caption.id)}
                      title="Obriši"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaptionEditor;
