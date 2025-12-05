import React, { useState, useRef } from 'react';
import {
  FiX,
  FiCheck,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiCalendar,
  FiPlay,
  FiPause,
  FiImage,
  FiVideo,
  FiLayers,
  FiMic
} from 'react-icons/fi';
import './AutoPilotPreviewModal.css';

const AutoPilotPreviewModal = ({
  isOpen,
  onClose,
  draft,
  onApprove,
  onRegenerate,
  onReject,
  isApproving,
  isRegenerating
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [copied, setCopied] = useState(false);
  const videoRef = useRef(null);

  if (!isOpen || !draft) return null;

  const { contentType, media = [], caption, topic, preview } = draft;

  // Content type icons
  const getContentTypeIcon = () => {
    switch (contentType) {
      case 'carousel': return <FiLayers />;
      case 'reel': return <FiVideo />;
      case 'voiceover_video': return <FiMic />;
      default: return <FiImage />;
    }
  };

  const getContentTypeLabel = () => {
    switch (contentType) {
      case 'single_image': return 'Single Image';
      case 'carousel': return 'Carousel';
      case 'reel': return 'Reel';
      case 'voiceover_video': return 'Voiceover Video';
      default: return contentType;
    }
  };

  // Handle carousel navigation
  const goToPrevSlide = () => {
    setCurrentSlide(prev => (prev > 0 ? prev - 1 : media.length - 1));
  };

  const goToNextSlide = () => {
    setCurrentSlide(prev => (prev < media.length - 1 ? prev + 1 : 0));
  };

  // Handle video playback
  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Copy caption to clipboard
  const copyCaption = () => {
    const fullCaption = caption?.text + (caption?.hashtags?.length > 0 ? '\n\n' + caption.hashtags.map(h => `#${h}`).join(' ') : '');
    navigator.clipboard.writeText(fullCaption).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Handle approval
  const handleApprove = () => {
    if (showScheduler && scheduledDate) {
      const scheduleDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      onApprove(draft._id, scheduleDateTime.toISOString());
    } else {
      onApprove(draft._id);
    }
  };

  // Render media preview
  const renderMediaPreview = () => {
    if (!media || media.length === 0) {
      // Show thumbnail/placeholder
      return (
        <div className="preview-placeholder">
          <FiImage />
          <span>Generating preview...</span>
        </div>
      );
    }

    // For videos
    if (contentType === 'reel' || contentType === 'voiceover_video') {
      const videoUrl = preview?.lowResVideoUrl || media[0]?.url;
      return (
        <div className="video-preview-container">
          <video
            ref={videoRef}
            src={videoUrl}
            poster={preview?.thumbnailUrl || media[0]?.thumbnail}
            loop
            playsInline
            onEnded={() => setIsPlaying(false)}
          />
          <button className="video-play-btn" onClick={toggleVideoPlay}>
            {isPlaying ? <FiPause /> : <FiPlay />}
          </button>
          <div className="video-label">
            <FiVideo /> Preview Quality (HD on approval)
          </div>
        </div>
      );
    }

    // For carousel
    if (contentType === 'carousel' && media.length > 1) {
      return (
        <div className="carousel-preview-container">
          <div className="carousel-slide">
            <img src={media[currentSlide]?.url} alt={`Slide ${currentSlide + 1}`} />
          </div>
          <button className="carousel-nav prev" onClick={goToPrevSlide}>
            <FiChevronLeft />
          </button>
          <button className="carousel-nav next" onClick={goToNextSlide}>
            <FiChevronRight />
          </button>
          <div className="carousel-indicators">
            {media.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
          <div className="carousel-counter">
            {currentSlide + 1} / {media.length}
          </div>
        </div>
      );
    }

    // For single image
    return (
      <div className="single-image-preview">
        <img src={media[0]?.url} alt="Preview" />
      </div>
    );
  };

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="preview-modal-header">
          <div className="content-type-badge">
            {getContentTypeIcon()}
            <span>{getContentTypeLabel()}</span>
          </div>
          <h2>Preview: {topic}</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* Content */}
        <div className="preview-modal-content">
          {/* Media Preview (Phone Frame) */}
          <div className="preview-phone-frame">
            <div className="phone-notch" />
            <div className="phone-screen">
              {renderMediaPreview()}
            </div>
          </div>

          {/* Caption & Actions */}
          <div className="preview-sidebar">
            {/* Caption Preview */}
            <div className="caption-preview-section">
              <div className="section-header">
                <h3>Caption</h3>
                <button 
                  className={`copy-btn ${copied ? 'copied' : ''}`} 
                  onClick={copyCaption}
                >
                  <FiCopy />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="caption-text">
                {caption?.text || 'No caption generated'}
              </div>
              {caption?.hashtags && caption.hashtags.length > 0 && (
                <div className="hashtags-preview">
                  {caption.hashtags.map((tag, i) => (
                    <span key={i} className="hashtag">#{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Regeneration Info */}
            {draft.regenerationCount > 0 && (
              <div className="regeneration-info">
                Regenerated {draft.regenerationCount}/{draft.maxRegenerations} times
              </div>
            )}

            {/* Schedule Option */}
            <div className="schedule-option">
              <label className="schedule-toggle">
                <input
                  type="checkbox"
                  checked={showScheduler}
                  onChange={(e) => setShowScheduler(e.target.checked)}
                />
                <span>Schedule for later</span>
                <FiCalendar />
              </label>
              {showScheduler && (
                <div className="schedule-inputs">
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <select
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <option key={hour} value={`${hour}:00`}>{hour}:00</option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="preview-actions">
              <button
                className="btn-approve"
                onClick={handleApprove}
                disabled={isApproving || (showScheduler && !scheduledDate)}
              >
                {isApproving ? (
                  <>
                    <FiRefreshCw className="spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <FiCheck />
                    {showScheduler ? 'Schedule' : 'Approve & Post'}
                  </>
                )}
              </button>
              <button
                className="btn-regenerate"
                onClick={() => onRegenerate(draft._id)}
                disabled={isRegenerating || !draft.canRegenerate?.()}
              >
                {isRegenerating ? (
                  <>
                    <FiRefreshCw className="spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <FiRefreshCw />
                    Regenerate
                  </>
                )}
              </button>
              <button
                className="btn-reject"
                onClick={() => onReject(draft._id)}
              >
                <FiX />
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoPilotPreviewModal;
