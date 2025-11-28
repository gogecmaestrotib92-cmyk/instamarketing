import React, { useState } from 'react';
import { FiPlay, FiClock, FiDownload, FiInstagram, FiTrash2 } from 'react-icons/fi';
import MobilePreview from './MobilePreview';
import './SavedVideosPanel.css';

/**
 * SavedVideosPanel Component
 * Displays a scrollable list of saved videos with a large mobile preview.
 * 
 * @param {Array} videos - Array of SavedVideo objects
 * @param {Function} onDelete - Callback when delete is clicked
 * @param {Function} onPostToInstagram - Callback when post to Instagram is clicked
 */

/*
  SavedVideo type:
  {
    id: string;
    title: string;
    durationSeconds: number;
    createdAt: string;
    thumbnailUrl: string;
    videoUrl: string;
    postedToInstagram?: boolean;
  }
*/

const SavedVideosPanel = ({ 
  videos = [], 
  onDelete, 
  onPostToInstagram,
  onDownload 
}) => {
  const [selectedVideoId, setSelectedVideoId] = useState(
    videos.length > 0 ? videos[0].id : null
  );

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
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Danas';
    if (diffDays === 1) return 'Juče';
    if (diffDays < 7) return `Pre ${diffDays} dana`;
    
    return date.toLocaleDateString('sr-RS', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  if (videos.length === 0) {
    return (
      <div className="saved-videos-panel saved-videos-panel--empty">
        <div className="saved-videos-panel__empty-state">
          <FiPlay size={48} />
          <h4>Nema sačuvanih videa</h4>
          <p>Generisani videi će se pojaviti ovde</p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-videos-panel">
      {/* Header */}
      <div className="saved-videos-panel__header">
        <h3>Moji AI Videi</h3>
        <span className="saved-videos-panel__count">{videos.length}</span>
      </div>

      {/* Video List (Scrollable) */}
      <div className="saved-videos-panel__list">
        {videos.map((video) => (
          <div 
            key={video.id}
            className={`saved-video-item ${selectedVideoId === video.id ? 'saved-video-item--selected' : ''}`}
            onClick={() => setSelectedVideoId(video.id)}
          >
            <div className="saved-video-item__thumbnail">
              {video.thumbnailUrl ? (
                <img src={video.thumbnailUrl} alt={video.title} />
              ) : (
                <video src={video.videoUrl} muted />
              )}
              <span className="saved-video-item__duration">
                {formatDuration(video.durationSeconds)}
              </span>
              {video.postedToInstagram && (
                <span className="saved-video-item__posted">
                  <FiInstagram size={12} />
                </span>
              )}
            </div>
            <div className="saved-video-item__info">
              <p className="saved-video-item__title">{video.title}</p>
              <span className="saved-video-item__date">
                <FiClock size={12} /> {formatDate(video.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Large Preview */}
      <div className="saved-videos-panel__preview">
        <MobilePreview 
          videoUrl={selectedVideo?.videoUrl}
          autoPlay={false}
          controls={true}
        />
        
        {/* Action Buttons */}
        {selectedVideo && (
          <div className="saved-videos-panel__actions">
            {onDownload && (
              <a 
                href={selectedVideo.videoUrl}
                download
                className="panel-action-btn"
                title="Download"
              >
                <FiDownload />
              </a>
            )}
            {onPostToInstagram && !selectedVideo.postedToInstagram && (
              <button 
                className="panel-action-btn panel-action-btn--primary"
                onClick={() => onPostToInstagram(selectedVideo.id)}
                title="Objavi na Instagram"
              >
                <FiInstagram />
              </button>
            )}
            {onDelete && (
              <button 
                className="panel-action-btn panel-action-btn--danger"
                onClick={() => onDelete(selectedVideo.id)}
                title="Obriši"
              >
                <FiTrash2 />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedVideosPanel;

// Example dummy data for testing:
/*
const DUMMY_VIDEOS = [
  {
    id: '1',
    title: 'Cinematic sunset over mountains',
    durationSeconds: 10,
    createdAt: new Date().toISOString(),
    thumbnailUrl: null,
    videoUrl: 'https://example.com/video1.mp4',
    postedToInstagram: false
  },
  {
    id: '2',
    title: 'Abstract liquid motion',
    durationSeconds: 5,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    thumbnailUrl: null,
    videoUrl: 'https://example.com/video2.mp4',
    postedToInstagram: true
  },
  {
    id: '3',
    title: 'Product showcase spin',
    durationSeconds: 8,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    thumbnailUrl: null,
    videoUrl: 'https://example.com/video3.mp4',
    postedToInstagram: false
  }
];
*/
