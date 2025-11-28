import React, { useState, useEffect, useMemo } from 'react';
import { FiInstagram, FiCalendar, FiDownload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import MobilePreview from './MobilePreview';
import PublishToInstagramModal from './PublishToInstagramModal';
import api from '../services/api';
import './SavedVideosPanel.css';

/**
 * SavedVideosPanel Component
 * Right column: scrollable list of saved videos + big mobile preview + action buttons
 */

const formatDuration = (seconds) => {
  if (!seconds) return '5s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const SavedVideosPanel = ({ videos = [] }) => {
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  
  // Publish modal state
  const [publishMode, setPublishMode] = useState(null); // "now" | "schedule" | null
  const [publishOpen, setPublishOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Auto-select first video when videos change
  useEffect(() => {
    if (videos.length > 0) {
      const exists = videos.find(v => v.id === selectedVideoId);
      if (!selectedVideoId || !exists) {
        setSelectedVideoId(videos[0].id);
      }
    } else {
      setSelectedVideoId(null);
    }
  }, [videos, selectedVideoId]);

  // Load Instagram accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      setLoadingAccounts(true);
      try {
        // TODO: Prilagodi endpoint prema tvom backendu
        const response = await api.get('/instagram/accounts');
        setAccounts(response.data.accounts || []);
      } catch (error) {
        console.log('No Instagram accounts loaded:', error.message);
        // Fallback - možda korisnik nema povezane naloge
        setAccounts([]);
      } finally {
        setLoadingAccounts(false);
      }
    };
    fetchAccounts();
  }, []);

  const selectedVideo = useMemo(
    () => videos.find((v) => v.id === selectedVideoId) || null,
    [videos, selectedVideoId]
  );

  // Handle publish now button click
  const handlePublishNow = () => {
    if (!selectedVideo) return;
    setPublishMode('now');
    setPublishOpen(true);
  };

  // Handle schedule button click
  const handleSchedule = () => {
    if (!selectedVideo) return;
    setPublishMode('schedule');
    setPublishOpen(true);
  };

  // Handle download button click
  const handleDownload = () => {
    if (!selectedVideo?.videoUrl) return;
    
    // Create temporary link to trigger download
    const link = document.createElement('a');
    link.href = selectedVideo.videoUrl;
    link.download = `ai-video-${selectedVideo.id}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('⬇️ Preuzimanje započeto!');
  };

  // Handle modal close
  const handleCloseModal = () => {
    setPublishOpen(false);
    setPublishMode(null);
  };

  // Handle publish submit
  const handleSubmitPublish = async (payload) => {
    try {
      if (payload.mode === 'now') {
        // TODO: Prilagodi endpoint prema tvom backendu
        await api.post('/instagram/publish', {
          videoId: payload.videoId,
          videoUrl: payload.videoUrl,
          accountId: payload.accountId,
          caption: payload.caption,
          hashtags: payload.hashtags,
        });
        toast.success('🎉 Video uspešno objavljen na Instagram!');
      } else {
        // Schedule mode
        // TODO: Prilagodi endpoint prema tvom backendu
        await api.post('/instagram/schedule', {
          videoId: payload.videoId,
          videoUrl: payload.videoUrl,
          accountId: payload.accountId,
          caption: payload.caption,
          hashtags: payload.hashtags,
          scheduledAt: payload.scheduledAt,
        });
        toast.success('📅 Objava zakazana!');
      }
      
      handleCloseModal();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Greška pri slanju';
      throw new Error(errorMsg);
    }
  };

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
              🎬 Još uvek nemate sačuvane videe
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
                    {video.title?.substring(0, 30) || 'AI Video'}
                    {video.title?.length > 30 ? '...' : ''}
                  </div>
                  <div className="saved-videos__item-date">
                    {video.createdAt}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* preview - always show */}
        <div className="saved-videos__preview">
          <MobilePreview
            videoUrl={selectedVideo?.videoUrl}
            posterUrl={selectedVideo?.thumbnailUrl}
          />
        </div>

        {/* Action buttons - only show if video selected */}
        {selectedVideo && (
          <div className="saved-videos__actions">
            <button
              className="saved-videos__action-btn saved-videos__action-btn--primary"
              onClick={handlePublishNow}
              disabled={loadingAccounts}
            >
              <FiInstagram /> Objavi na Instagram
            </button>
            <button
              className="saved-videos__action-btn saved-videos__action-btn--secondary"
              onClick={handleSchedule}
              disabled={loadingAccounts}
            >
              <FiCalendar /> Zakaži
            </button>
            <button
              className="saved-videos__action-btn saved-videos__action-btn--neutral"
              onClick={handleDownload}
            >
              <FiDownload />
            </button>
          </div>
        )}
      </div>

      {/* Publish Modal */}
      <PublishToInstagramModal
        open={publishOpen}
        mode={publishMode}
        video={selectedVideo}
        accounts={accounts}
        onClose={handleCloseModal}
        onSubmit={handleSubmitPublish}
      />
    </aside>
  );
};

export default SavedVideosPanel;
