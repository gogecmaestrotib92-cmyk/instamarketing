import React from 'react';
import './MobilePreview.css';

/**
 * MobilePreview Component
 * Displays video in a 9:16 mobile frame with no black bars.
 * Uses object-fit: cover to fill the entire frame.
 * 
 * @param {string} videoUrl - URL of the video to display
 * @param {boolean} autoPlay - Whether to autoplay the video (default: false)
 * @param {boolean} loop - Whether to loop the video (default: true)
 * @param {boolean} muted - Whether to mute the video (default: false)
 * @param {boolean} controls - Whether to show video controls (default: true)
 */
const MobilePreview = ({ 
  videoUrl, 
  autoPlay = false, 
  loop = true, 
  muted = false,
  controls = true,
  poster = null
}) => {
  if (!videoUrl) {
    return (
      <div className="mobile-preview mobile-preview--empty">
        <div className="mobile-preview__placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          <span>Izaberite video</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-preview">
      <video 
        src={videoUrl} 
        controls={controls}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        poster={poster}
        className="mobile-preview__video"
        playsInline
      />
    </div>
  );
};

export default MobilePreview;
