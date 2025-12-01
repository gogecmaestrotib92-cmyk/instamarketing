import React, { useState, useEffect } from 'react';
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
  FiImage,
  FiType,
  FiGrid,
  FiRefreshCw,
  FiEye,
  FiEdit2,
  FiHash,
  FiCheckCircle
} from 'react-icons/fi';
import api from '../services/api';
import './AutopilotPost.css';

const AutopilotPost = () => {
  const [activeTab, setActiveTab] = useState('queue');
  const [isAutopilotActive, setIsAutopilotActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [previewPost, setPreviewPost] = useState(null);
  const [editingCaption, setEditingCaption] = useState(null);

  // Settings State
  const [settings, setSettings] = useState({
    niche: 'motivational',
    style: 'aesthetic',
    topics: '',
    hashtags: '#viral #trending #instagram',
    postsPerDay: 2,
    preferredTimes: ['10:00', '18:00'],
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
    imageType: 'ai-generated',
    captionStyle: 'engaging',
    autoApprove: false,
    requireReview: true
  });

  useEffect(() => {
    loadAutopilotStatus();
    loadQueue();
    loadHistory();
  }, []);

  const loadAutopilotStatus = async () => {
    try {
      const response = await api.get('/api/ai/autopilot/post/status');
      setIsAutopilotActive(response.data.active);
      if (response.data.settings) {
        setSettings(prev => ({ ...prev, ...response.data.settings }));
      }
    } catch (error) {
      console.log('No active post autopilot session');
    }
  };

  const loadQueue = async () => {
    try {
      const response = await api.get('/api/ai/autopilot/post/queue');
      setQueue(response.data.queue || []);
    } catch (error) {
      console.error('Failed to load queue:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await api.get('/api/ai/autopilot/post/history');
      setHistory(response.data.history || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const toggleAutopilot = async () => {
    setIsLoading(true);
    try {
      if (isAutopilotActive) {
        await api.post('/api/ai/autopilot/post/stop');
        setIsAutopilotActive(false);
      } else {
        await api.post('/api/ai/autopilot/post/start', { settings });
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
      const response = await api.post('/api/ai/autopilot/post/generate', { settings });
      if (response.data.post) {
        setQueue(prev => [response.data.post, ...prev]);
        setActiveTab('queue');
      }
    } catch (error) {
      console.error('Failed to generate:', error);
      alert('Failed to generate post: ' + (error.response?.data?.message || error.message));
    }
    setIsGenerating(false);
  };

  const approvePost = async (postId) => {
    try {
      await api.post(`/api/ai/autopilot/post/queue/${postId}/approve`);
      setQueue(prev => prev.map(p => p.id === postId ? { ...p, status: 'approved' } : p));
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Delete this post from queue?')) return;
    try {
      await api.delete(`/api/ai/autopilot/post/queue/${postId}`);
      setQueue(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const postNow = async (postId) => {
    try {
      await api.post(`/api/ai/autopilot/post/queue/${postId}/post`);
      const post = queue.find(p => p.id === postId);
      if (post) {
        setHistory(prev => [{ ...post, postedAt: new Date().toISOString() }, ...prev]);
        setQueue(prev => prev.filter(p => p.id !== postId));
      }
    } catch (error) {
      console.error('Failed to post:', error);
      alert('Failed to post: ' + (error.response?.data?.message || error.message));
    }
  };

  const updateCaption = async (postId, newCaption) => {
    try {
      await api.patch(`/api/ai/autopilot/post/queue/${postId}`, { caption: newCaption });
      setQueue(prev => prev.map(p => p.id === postId ? { ...p, caption: newCaption } : p));
      setEditingCaption(null);
    } catch (error) {
      console.error('Failed to update caption:', error);
    }
  };

  const addPreferredTime = () => {
    setSettings(prev => ({
      ...prev,
      preferredTimes: [...prev.preferredTimes, '12:00']
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
    <div className="autopilot-page post-autopilot">
      {/* Header */}
      <div className="autopilot-header">
        <div className="header-content">
          <h1>
            <FiImage />
            Post Auto-pilot
          </h1>
          <p>AI automatically generates images and captions, then posts on your schedule</p>
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
            When active, AI will automatically generate and post images based on your settings
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
                <FiImage className="empty-icon" />
                <h3>No posts in queue</h3>
                <p>Click "Generate Now" to create your first post, or start Auto-pilot</p>
                <button className="generate-btn" onClick={generateNow} disabled={isGenerating}>
                  <FiPlus />
                  Generate Post
                </button>
              </div>
            ) : (
              <div className="post-queue-grid">
                {queue.map(post => (
                  <div key={post.id} className={`post-queue-item status-${post.status}`}>
                    <div className="post-image-preview" onClick={() => setPreviewPost(post)}>
                      <img src={post.imageUrl} alt="Post preview" />
                      <button className="preview-btn">
                        <FiEye />
                      </button>
                    </div>
                    <div className="post-queue-content">
                      <div className="post-queue-header">
                        <span className={`status-badge ${post.status}`}>
                          {post.status === 'approved' ? <FiCheckCircle /> : <FiClock />}
                          {post.status}
                        </span>
                        <span className="scheduled-time">
                          <FiCalendar />
                          {formatScheduledTime(post.scheduledAt)}
                        </span>
                      </div>
                      {editingCaption === post.id ? (
                        <div className="caption-edit-form">
                          <textarea
                            defaultValue={post.caption}
                            autoFocus
                            onBlur={(e) => updateCaption(post.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                updateCaption(post.id, e.target.value);
                              }
                              if (e.key === 'Escape') setEditingCaption(null);
                            }}
                          />
                        </div>
                      ) : (
                        <p className="caption-text" onClick={() => setEditingCaption(post.id)}>
                          {post.caption?.substring(0, 100)}...
                          <FiEdit2 className="edit-icon" />
                        </p>
                      )}
                      <p className="hashtags-text">{post.hashtags}</p>
                    </div>
                    <div className="post-queue-actions">
                      {post.status !== 'approved' && (
                        <button className="action-btn approve" onClick={() => approvePost(post.id)}>
                          <FiCheck />
                        </button>
                      )}
                      <button className="action-btn post-now" onClick={() => postNow(post.id)}>
                        <FiSend />
                      </button>
                      <button className="action-btn delete" onClick={() => deletePost(post.id)}>
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
                <option value="motivational">Motivational Quotes</option>
                <option value="fitness">Fitness Tips</option>
                <option value="business">Business/Finance</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="travel">Travel</option>
                <option value="food">Food</option>
                <option value="tech">Technology</option>
                <option value="fashion">Fashion</option>
                <option value="art">Art/Design</option>
                <option value="educational">Educational</option>
              </select>
            </div>

            <div className="setting-card">
              <div className="setting-header">
                <FiImage className="setting-icon" />
                <h3>Image Style</h3>
              </div>
              <select
                className="setting-select"
                value={settings.style}
                onChange={(e) => setSettings(prev => ({ ...prev, style: e.target.value }))}
              >
                <option value="aesthetic">Aesthetic</option>
                <option value="minimal">Minimal</option>
                <option value="bold">Bold & Colorful</option>
                <option value="professional">Professional</option>
                <option value="artistic">Artistic</option>
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

            <div className="setting-card">
              <div className="setting-header">
                <FiType className="setting-icon" />
                <h3>Caption Style</h3>
              </div>
              <select
                className="setting-select"
                value={settings.captionStyle}
                onChange={(e) => setSettings(prev => ({ ...prev, captionStyle: e.target.value }))}
              >
                <option value="engaging">Engaging & Fun</option>
                <option value="professional">Professional</option>
                <option value="inspirational">Inspirational</option>
                <option value="informative">Informative</option>
                <option value="casual">Casual & Friendly</option>
              </select>
            </div>

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
                  Auto-approve all posts
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
                <p>Your posted content will appear here</p>
              </div>
            ) : (
              <div className="history-grid">
                {history.map(post => (
                  <div key={post.id} className="history-item" onClick={() => setPreviewPost(post)}>
                    <div className="history-item-image">
                      <img src={post.imageUrl} alt="Posted content" />
                    </div>
                    <div className="history-item-content">
                      <p>{post.caption?.substring(0, 60)}...</p>
                      <span className="history-date">
                        <FiCheckCircle />
                        {formatScheduledTime(post.postedAt)}
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
      {previewPost && (
        <div className="preview-modal-overlay" onClick={() => setPreviewPost(null)}>
          <div className="preview-modal post-preview" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setPreviewPost(null)}>
              <FiX />
            </button>
            <img
              className="preview-image"
              src={previewPost.imageUrl}
              alt="Post preview"
            />
            <div className="preview-details">
              <p>{previewPost.caption}</p>
              <p className="preview-hashtags">{previewPost.hashtags}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutopilotPost;
