import React, { useState, useMemo } from 'react';
import MobilePreview from './MobilePreview';
import './SavedVideosPanel.css';

/**
 * SavedVideosPanel Component
 * Right column: scrollable list of saved videos + big mobile preview
 * 
 * @param {Array} videos - Array of SavedVideo objects
 * 
 * SavedVideo type:
 * {
 *   id: string;
 *   title: string;
 *   durationSeconds: number;
 *   createdAt: string;       // e.g. "2025-11-28"
 *   thumbnailUrl: string;
 *   videoUrl: string;
 * }
 */

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
};

const SavedVideosPanel = ({ videos = [] }) => {
  const [selectedVideoId, setSelectedVideoId] = useState(
    videos.length > 0 ? videos[0].id : null
  );

  const selectedVideo = useMemo(
    () => videos.find((v) => v.id === selectedVideoId) || null,
    [videos, selectedVideoId]
  );

  return (
    <aside className="saved-videos">
      <header className="saved-videos__header">
        <div>
          <h3 className="saved-videos__title">Moji AI Videi</h3>
          <p className="saved-videos__subtitle">
            Sačuvani AI Reels koje ste generisali
          </p>
        </div>
        <span className="saved-videos__badge">
          {videos.length} videa
        </span>
      </header>

      <div className="saved-videos__body">
        {/* list */}
        <div className="saved-videos__list">
          {videos.length === 0 && (
            <div className="saved-videos__empty">
              Još uvek nemate sačuvane videe.
            </div>
          )}

          {videos.map((video) => {
            const isActive = video.id === selectedVideoId;
            return (
              <button
                key={video.id}
                type="button"
                onClick={() => setSelectedVideoId(video.id)}
                className={
                  'saved-videos__item' +
                  (isActive ? ' saved-videos__item--active' : '')
                }
              >
                <div className="saved-videos__thumb-wrapper">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="saved-videos__thumb"
                    />
                  ) : (
                    <video 
                      src={video.videoUrl} 
                      muted 
                      className="saved-videos__thumb"
                    />
                  )}
                  <span className="saved-videos__duration">
                    {formatDuration(video.durationSeconds || 0)}
                  </span>
                </div>
                <div className="saved-videos__meta">
                  <div className="saved-videos__item-title">
                    {video.title}
                  </div>
                  <div className="saved-videos__item-date">
                    {video.createdAt}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* preview */}
        {selectedVideo && (
          <div className="saved-videos__preview">
            <MobilePreview
              videoUrl={selectedVideo.videoUrl}
              posterUrl={selectedVideo.thumbnailUrl}
            />
          </div>
        )}
      </div>
    </aside>
  );
};

export default SavedVideosPanel;
