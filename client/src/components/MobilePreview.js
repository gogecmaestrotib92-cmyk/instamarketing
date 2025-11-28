import React from 'react';
import './MobilePreview.css';

/**
 * MobilePreview Component
 * Displays video in a 9:16 mobile frame with no black bars.
 * Uses object-fit: cover to fill the entire frame.
 * 
 * @param {string} videoUrl - URL of the video to display
 * @param {string} posterUrl - Poster image URL
 */
const MobilePreview = ({ videoUrl, posterUrl }) => {
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
        className="mobile-preview__video"
        src={videoUrl} 
        poster={posterUrl}
        controls
      />
    </div>
  );
};

export default MobilePreview;
