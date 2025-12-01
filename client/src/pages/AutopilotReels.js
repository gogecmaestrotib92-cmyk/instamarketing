import React, { useState, useEffect, useCallback } from 'react';
import {
  FiCpu,
  FiPlay,
  FiPause,
  FiSettings,
  FiClock,
  FiCalendar,
  FiList,
  FiCheck,
  FiTrash2,
  FiSend,
  FiX,
  FiPlus,
  FiMusic,
  FiType,
  FiGrid,
  FiRefreshCw,
  FiEye,
  FiEdit2,
  FiHash,
  FiCheckCircle
} from 'react-icons/fi';
import api from '../services/api';
import './AutopilotReels.css';

const AutopilotReels = () => {
  const [activeTab, setActiveTab] = useState('queue');
  const [isAutopilotActive, setIsAutopilotActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [editingCaption, setEditingCaption] = useState(null);

  // Settings State
  const [settings, setSettings] = useState({
    niche: 'motivational',
    style: 'cinematic',
    topics: '',
    hashtags: '#viral #trending #reels',
    postsPerDay: 3,
    preferredTimes: ['09:00', '14:00', '19:00'],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    activeDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    },
    textOverlay: {
      enabled: true,
      autoGenerate: true,
      position: 'center',
      style: 'bold'
    },
    music: {
      enabled: true,
      genre: 'trending',
      autoSelect: true
    },
    autoApprove: false,
    requireReview: true
  });

  // Load autopilot state on mount
  useEffect(() => {
    loadAutopilotStatus();
    loadQueue();
    loadHistory();
  }, []);

  const loadAutopilotStatus = async () => {
    try {
      const response = await api.get('/api/ai/autopilot/reels/status');
      setIsAutopilotActive(response.data.active);
      if (response.data.settings) {
        setSettings(prev => ({ ...prev, ...response.data.settings }));
      }
    } catch (error) {
      console.log('No active autopilot session');
    }
  };

  const loadQueue = async () => {
    try {
      const response = await api.get('/api/ai/autopilot/reels/queue');
      setQueue(response.data.queue || []);
    } catch (error) {
      console.error('Failed to load queue:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await api.get('/api/ai/autopilot/reels/history');
      setHistory(response.data.history || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const toggleAutopilot = async () => {
    setIsLoading(true);
    try {
      if (isAutopilotActive) {
        await api.post('/api/ai/autopilot/reels/stop');
        setIsAutopilotActive(false);
      } else {
        await api.post('/api/ai/autopilot/reels/start', { settings });
        setIsAutopilotActive(true);
      }
    } catch (error) {
      console.error('Failed to toggle autopilot:', error);
      alert('Failed to toggle autopilot: ' + (error.response?.data?.message || error.message));
    }
    setIsLoading(false);
  };

  const generateNow = async () => {
    setIsGenerating(true);
    try {
      const response = await api.post('/api/ai/autopilot/reels/generate', { settings });
      if (response.data.video) {
        setQueue(prev => [response.data.video, ...prev]);
        setActiveTab('queue');
      }
    } catch (error) {
      console.error('Failed to generate:', error);
      alert('Failed to generate video: ' + (error.response?.data?.message || error.message));
    }
    setIsGenerating(false);
  };

  const approveVideo = async (videoId) => {
    try {
      await api.post(`/api/ai/autopilot/reels/queue/${videoId}/approve`);
      setQueue(prev => prev.map(v => v.id === videoId ? { ...v, status: 'approved' } : v));
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const deleteVideo = async (videoId) => {
    if (!window.confirm('Delete this video from queue?')) return;
    try {
      await api.delete(`/api/ai/autopilot/reels/queue/${videoId}`);
      setQueue(prev => prev.filter(v => v.id !== videoId));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const postNow = async (videoId) => {
    try {
      await api.post(`/api/ai/autopilot/reels/queue/${videoId}/post`);
      const video = queue.find(v => v.id === videoId);
      if (video) {
        setHistory(prev => [{ ...video, postedAt: new Date().toISOString() }, ...prev]);
        setQueue(prev => prev.filter(v => v.id !== videoId));
      }
    } catch (error) {
      console.error('Failed to post:', error);
      alert('Failed to post: ' + (error.response?.data?.message || error.message));
    }
  };

  const updateCaption = async (videoId, newCaption) => {
    try {
      await api.patch(`/api/ai/autopilot/reels/queue/${videoId}`, { caption: newCaption });
      setQueue(prev => prev.map(v => v.id === videoId ? { ...v, caption: newCaption } : v));
      setEditingCaption(null);
    } catch (error) {
      console.error('Failed to update caption:', error);
    }
  };

  const addPreferredTime = () => {
    const newTime = '12:00';
    setSettings(prev => ({
      ...prev,
      preferredTimes: [...prev.preferredTimes, newTime]
    }));
  };

  const removePreferredTime = (index) => {
    setSettings(prev => ({
      ...prev,
      preferredTimes: prev.preferredTimes.filter((_, i) => i !== index)
    }));
  };

  const updatePreferredTime = (index, value) => {
    setSettings(prev => ({
      ...prev,
      preferredTimes: prev.preferredTimes.map((t, i) => i === index ? value : t)
    }));
  };

  const formatScheduledTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const tabs = [
    { id: 'queue', label: 'Queue', icon: FiList },
    { id: 'settings', label: 'Settings', icon: FiSettings },
    { id: 'history', label: 'History', icon: FiClock }
  ];

  return (
    <div className="autopilot-page">
      {/* Header */}
      <div className="autopilot-header">
        <div className="header-content">
          <h1>
            <FiCpu />
            Reels Auto-pilot
          </h1>
          <p>AI automatically generates, edits, and posts Reels on your schedule</p>
        </div>
        <div className="header-actions">
          <button 
            className="generate-btn"
            onClick={generateNow}
            disabled={isGenerating}
          >
            {isGenerating ? <FiRefreshCw className="spin" /> : <FiPlus />}
            {isGenerating ? 'Generating...' : 'Generate Now'}
          </button>
          <div className={`autopilot-status ${isAutopilotActive ? 'active' : 'inactive'}`}>
            <span className="status-dot"></span>
            {isAutopilotActive ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="autopilot-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="autopilot-content">
        {/* Main Control */}
        <div className="control-card main-control">
          <div className="control-header">
            <FiCpu className="control-icon" />
            <h2>Auto-pilot Control</h2>
          </div>
          <p className="control-description">
            When active, AI will automatically generate and post Reels based on your settings
          </p>
          <button
            className={`autopilot-toggle-btn ${isAutopilotActive ? 'active' : ''}`}
            onClick={toggleAutopilot}
            disabled={isLoading}
          >
            {isLoading ? (
              <FiRefreshCw className="spin" />
            ) : isAutopilotActive ? (
              <>
                <FiPause />
                Stop Auto-pilot
              </>
            ) : (
              <>
                <FiPlay />
                Start Auto-pilot
              </>
            )}
          </button>
        </div>

        {/* Queue Tab */}
        {activeTab === 'queue' && (
          <div className="queue-section">
            {queue.length === 0 ? (
              <div className="empty-state">
                <FiList className="empty-icon" />
                <h3>No videos in queue</h3>
                <p>Click "Generate Now" to create your first video, or start Auto-pilot</p>
                <button className="generate-btn" onClick={generateNow} disabled={isGenerating}>
                  <FiPlus />
                  Generate Video
                </button>
              </div>
            ) : (
              <div className="queue-list">
                {queue.map(video => (
                  <div key={video.id} className={`queue-item status-${video.status}`}>
                    <div className="queue-item-preview">
                      <video src={video.videoUrl} muted />
                      <button className="preview-btn" onClick={() => setPreviewVideo(video)}>
                        <FiEye />
                      </button>
                    </div>
                    <div className="queue-item-content">
                      <div className="queue-item-header">
                        <span className={`status-badge ${video.status}`}>
                          {video.status === 'approved' ? <FiCheckCircle /> : <FiClock />}
                          {video.status}
                        </span>
                        <span className="scheduled-time">
                          <FiCalendar />
                          {formatScheduledTime(video.scheduledAt)}
                        </span>
                      </div>
                      {editingCaption === video.id ? (
                        <div className="caption-edit-form">
                          <textarea
                            defaultValue={video.caption}
                            autoFocus
                            onBlur={(e) => updateCaption(video.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                updateCaption(video.id, e.target.value);
                              }
                              if (e.key === 'Escape') setEditingCaption(null);
                            }}
                          />
                        </div>
                      ) : (
                        <p className="caption-text" onClick={() => setEditingCaption(video.id)}>
                          {video.caption}
                          <FiEdit2 className="edit-icon" />
                        </p>
                      )}
                      <p className="hashtags-text">{video.hashtags}</p>
                    </div>
                    <div className="queue-item-actions">
                      {video.status !== 'approved' && (
                        <button className="action-btn approve" onClick={() => approveVideo(video.id)}>
                          <FiCheck />
                          Approve
                        </button>
                      )}
                      <button className="action-btn post-now" onClick={() => postNow(video.id)}>
                        <FiSend />
                        Post Now
                      </button>
                      <button className="action-btn delete" onClick={() => deleteVideo(video.id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="settings-grid">
            {/* Content Settings */}
            <div className="setting-card">
              <div className="setting-header">
                <FiGrid className="setting-icon" />
                <h3>Niche</h3>
              </div>
              <select
                className="setting-select"
                value={settings.niche}
                onChange={(e) => setSettings(prev => ({ ...prev, niche: e.target.value }))}
              >
                <option value="motivational">Motivational</option>
                <option value="fitness">Fitness</option>
                <option value="business">Business/Finance</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="travel">Travel</option>
                <option value="food">Food</option>
                <option value="tech">Technology</option>
                <option value="fashion">Fashion</option>
                <option value="comedy">Comedy</option>
                <option value="educational">Educational</option>
              </select>
            </div>

            <div className="setting-card">
              <div className="setting-header">
                <FiPlay className="setting-icon" />
                <h3>Video Style</h3>
              </div>
              <select
                className="setting-select"
                value={settings.style}
                onChange={(e) => setSettings(prev => ({ ...prev, style: e.target.value }))}
              >
                <option value="cinematic">Cinematic</option>
                <option value="energetic">Energetic</option>
                <option value="minimal">Minimal</option>
                <option value="aesthetic">Aesthetic</option>
                <option value="bold">Bold</option>
                <option value="vintage">Vintage</option>
              </select>
            </div>

            <div className="setting-card wide">
              <div className="setting-header">
                <FiHash className="setting-icon" />
                <h3>Default Hashtags</h3>
              </div>
              <input
                type="text"
                className="setting-input"
                value={settings.hashtags}
                onChange={(e) => setSettings(prev => ({ ...prev, hashtags: e.target.value }))}
                placeholder="#hashtag1 #hashtag2 ..."
              />
            </div>

            {/* Schedule Settings */}
            <div className="setting-card">
              <div className="setting-header">
                <FiCalendar className="setting-icon" />
                <h3>Posts Per Day</h3>
              </div>
              <select
                className="setting-select"
                value={settings.postsPerDay}
                onChange={(e) => setSettings(prev => ({ ...prev, postsPerDay: parseInt(e.target.value) }))}
              >
                <option value={1}>1 post/day</option>
                <option value={2}>2 posts/day</option>
                <option value={3}>3 posts/day</option>
                <option value={4}>4 posts/day</option>
                <option value={5}>5 posts/day</option>
              </select>
            </div>

            <div className="setting-card">
              <div className="setting-header">
                <FiClock className="setting-icon" />
                <h3>Preferred Times</h3>
                <button className="add-time-btn" onClick={addPreferredTime}>
                  <FiPlus />
                </button>
              </div>
              <div className="time-slots">
                {settings.preferredTimes.map((time, index) => (
                  <div key={index} className="time-slot">
                    <input
                      type="time"
                      className="time-input-small"
                      value={time}
                      onChange={(e) => updatePreferredTime(index, e.target.value)}
                    />
                    <button className="remove-time-btn" onClick={() => removePreferredTime(index)}>
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Text Overlay Settings */}
            <div className="setting-card">
              <div className="setting-header">
                <FiType className="setting-icon" />
                <h3>Text Overlay</h3>
              </div>
              <div className="toggle-options">
                <label className="toggle-option">
                  <input
                    type="checkbox"
                    checked={settings.textOverlay.enabled}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      textOverlay: { ...prev.textOverlay, enabled: e.target.checked }
                    }))}
                  />
                  Enable text overlays
                </label>
                <label className="toggle-option">
                  <input
                    type="checkbox"
                    checked={settings.textOverlay.autoGenerate}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      textOverlay: { ...prev.textOverlay, autoGenerate: e.target.checked }
                    }))}
                  />
                  AI-generate captions
                </label>
              </div>
            </div>

            {/* Music Settings */}
            <div className="setting-card">
              <div className="setting-header">
                <FiMusic className="setting-icon" />
                <h3>Background Music</h3>
              </div>
              <div className="toggle-options">
                <label className="toggle-option">
                  <input
                    type="checkbox"
                    checked={settings.music.enabled}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      music: { ...prev.music, enabled: e.target.checked }
                    }))}
                  />
                  Add background music
                </label>
                <label className="toggle-option">
                  <input
                    type="checkbox"
                    checked={settings.music.autoSelect}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      music: { ...prev.music, autoSelect: e.target.checked }
                    }))}
                  />
                  Auto-select trending music
                </label>
              </div>
            </div>

            {/* Auto-approve */}
            <div className="setting-card">
              <div className="setting-header">
                <FiCheck className="setting-icon" />
                <h3>Approval Mode</h3>
              </div>
              <div className="toggle-options">
                <label className="toggle-option">
                  <input
                    type="checkbox"
                    checked={settings.autoApprove}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      autoApprove: e.target.checked,
                      requireReview: !e.target.checked
                    }))}
                  />
                  Auto-approve all videos
                </label>
                <label className="toggle-option">
                  <input
                    type="checkbox"
                    checked={settings.requireReview}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      requireReview: e.target.checked,
                      autoApprove: !e.target.checked
                    }))}
                  />
                  Require manual review
                </label>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="history-section">
            {history.length === 0 ? (
              <div className="empty-state">
                <FiClock className="empty-icon" />
                <h3>No posts yet</h3>
                <p>Your posted Reels will appear here</p>
              </div>
            ) : (
              <div className="history-list">
                {history.map(video => (
                  <div key={video.id} className="history-item">
                    <div className="history-item-preview">
                      <video src={video.videoUrl} muted onClick={() => setPreviewVideo(video)} />
                    </div>
                    <div className="history-item-content">
                      <p>{video.caption}</p>
                      <span className="history-date">
                        <FiCheckCircle />
                        Posted {formatScheduledTime(video.postedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewVideo && (
        <div className="preview-modal-overlay" onClick={() => setPreviewVideo(null)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setPreviewVideo(null)}>
              <FiX />
            </button>
            <video
              className="preview-video"
              src={previewVideo.videoUrl}
              controls
              autoPlay
            />
            <div className="preview-details">
              <p>{previewVideo.caption}</p>
              <p className="preview-hashtags">{previewVideo.hashtags}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutopilotReels;
