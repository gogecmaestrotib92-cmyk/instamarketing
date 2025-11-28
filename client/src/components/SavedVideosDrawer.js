import React, { useState } from 'react';
import { FiX, FiPlay, FiClock, FiDownload, FiInstagram, FiTrash2 } from 'react-icons/fi';
import MobilePreview from './MobilePreview';
import './SavedVideosDrawer.css';

/**
 * SavedVideosDrawer Component
 * A slide-in drawer from the right for viewing saved AI videos.
 * 
 * @param {boolean} isOpen - Whether the drawer is open
 * @param {Function} onClose - Callback to close the drawer
 * @param {Array} videos - Array of SavedVideo objects
 * @param {Function} onDelete - Callback when delete is clicked
 * @param {Function} onPostToInstagram - Callback when post to Instagram is clicked
 */

const SavedVideosDrawer = ({ 
  isOpen, 
  onClose, 
  videos = [],
  onDelete,
  onPostToInstagram
}) => {
  const [selectedVideoId, setSelectedVideoId] = useState(null);

  // Set initial selection when drawer opens
  React.useEffect(() => {
    if (isOpen && videos.length > 0 && !selectedVideoId) {
      setSelectedVideoId(videos[0].id);
    }
  }, [isOpen, videos, selectedVideoId]);

  const selectedVideo = videos.find(v => v.id === selectedVideoId);

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="drawer-overlay" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div 
        className="saved-videos-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="drawer-header">
          <h2 id="drawer-title">Moji AI Videi</h2>
          <span className="drawer-count">{videos.length} videa</span>
          <button 
            className="drawer-close" 
            onClick={onClose}
            aria-label="Zatvori"
          >
            <FiX />
          </button>
        </div>

        {/* Content */}
        <div className="drawer-content">
          {videos.length === 0 ? (
            <div className="drawer-empty">
              <FiPlay size={48} />
              <h4>Nema sačuvanih videa</h4>
              <p>Generisani videi će se pojaviti ovde</p>
            </div>
          ) : (
            <div className="drawer-layout">
              {/* Video Grid */}
              <div className="drawer-grid">
                {videos.map((video) => (
                  <div 
                    key={video.id}
                    className={`drawer-video-card ${selectedVideoId === video.id ? 'drawer-video-card--selected' : ''}`}
                    onClick={() => setSelectedVideoId(video.id)}
                  >
                    <div className="drawer-video-thumb">
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt={video.title} />
                      ) : (
                        <video src={video.videoUrl} muted />
                      )}
                      <span className="drawer-video-duration">
                        {formatDuration(video.durationSeconds)}
                      </span>
                      {video.postedToInstagram && (
                        <span className="drawer-video-posted">
                          <FiInstagram size={10} />
                        </span>
                      )}
                      <div className="drawer-video-overlay">
                        <FiPlay size={24} />
                      </div>
                    </div>
                    <div className="drawer-video-info">
                      <p className="drawer-video-title">{video.title}</p>
                      <span className="drawer-video-date">
                        <FiClock size={10} /> {formatDate(video.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Preview Section */}
              {selectedVideo && (
                <div className="drawer-preview-section">
                  <div className="drawer-preview-wrapper">
                    <MobilePreview 
                      videoUrl={selectedVideo.videoUrl}
                      autoPlay={true}
                      controls={true}
                    />
                  </div>

                  <div className="drawer-preview-info">
                    <h4>{selectedVideo.title}</h4>
                    <p className="drawer-preview-date">
                      Kreirano: {formatDate(selectedVideo.createdAt)}
                    </p>
                  </div>

                  <div className="drawer-preview-actions">
                    <a 
                      href={selectedVideo.videoUrl}
                      download
                      className="drawer-action-btn"
                    >
                      <FiDownload /> Download
                    </a>
                    {!selectedVideo.postedToInstagram && onPostToInstagram && (
                      <button 
                        className="drawer-action-btn drawer-action-btn--primary"
                        onClick={() => onPostToInstagram(selectedVideo.id)}
                      >
                        <FiInstagram /> Objavi
                      </button>
                    )}
                    {onDelete && (
                      <button 
                        className="drawer-action-btn drawer-action-btn--danger"
                        onClick={() => {
                          onDelete(selectedVideo.id);
                          // Select next video if available
                          const idx = videos.findIndex(v => v.id === selectedVideo.id);
                          const next = videos[idx + 1] || videos[idx - 1];
                          setSelectedVideoId(next?.id || null);
                        }}
                      >
                        <FiTrash2 /> Obriši
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SavedVideosDrawer;

/*
  USAGE EXAMPLE:
  
  // In your AiVideoPage component:
  
  import SavedVideosDrawer from '../components/SavedVideosDrawer';
  
  const AiVideoPage = () => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [videos, setVideos] = useState([...]);
    
    return (
      <div>
        <button 
          className="btn btn-secondary"
          onClick={() => setIsDrawerOpen(true)}
        >
          Moji AI Videi ({videos.length})
        </button>
        
        <SavedVideosDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          videos={videos}
          onDelete={(id) => handleDelete(id)}
          onPostToInstagram={(id) => handlePostToInstagram(id)}
        />
      </div>
    );
  };
*/
