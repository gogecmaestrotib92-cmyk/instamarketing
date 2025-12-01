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

  return (
    <main className="autopilot-page post-autopilot">
      {/* Header */}
      <header className="page-header">
        <h1>
          <FiImage className="header-icon" aria-hidden="true" />
          Post Auto-pilot
        </h1>
        <p>AI automatically generates images and captions, then posts on your schedule</p>
        <div className="header-actions">
          <button 
            className="btn-primary"
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
      </header>

      {/* Tabs */}
      <nav className="tabs" role="tablist" aria-label="Autopilot tabs">
        <button 
          className={`tab ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
          role="tab"
          aria-selected={activeTab === 'queue'}
        >
          <FiList aria-hidden="true" /> Queue
        </button>
        <button 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
          role="tab"
          aria-selected={activeTab === 'settings'}
        >
          <FiSettings aria-hidden="true" /> Settings
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          role="tab"
          aria-selected={activeTab === 'history'}
        >
          <FiClock aria-hidden="true" /> History
        </button>
      </nav>

      {/* Main Control */}
      <section className="section control-section">
        <h3><FiCpu aria-hidden="true" /> Auto-pilot Control</h3>
        <p>When active, AI will automatically generate and post images based on your settings</p>
        <div className="actions" style={{ marginTop: '20px', padding: '0' }}>
          <button
            className={`btn-primary ${isAutopilotActive ? 'btn-danger' : ''}`}
            onClick={toggleAutopilot}
            disabled={isLoading}
            style={isAutopilotActive ? { background: 'linear-gradient(135deg, #ef4444, #dc2626)' } : {}}
          >
            {isLoading ? (
              <FiRefreshCw className="spin" />
            ) : isAutopilotActive ? (
              <>
                <FiPause /> Stop Auto-pilot
              </>
            ) : (
              <>
                <FiPlay /> Start Auto-pilot
              </>
            )}
          </button>
        </div>
      </section>

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <section role="tabpanel">
          {queue.length === 0 ? (
            <div className="empty-state">
              <FiImage />
              <h3>No posts in queue</h3>
              <p>Click "Generate Now" to create your first post, or start Auto-pilot</p>
              <button className="btn-primary" onClick={generateNow} disabled={isGenerating}>
                <FiPlus /> Generate Post
              </button>
            </div>
          ) : (
            <div className="post-queue-grid">
              {queue.map(post => (
                <article key={post.id} className={`post-queue-card ${post.status}`}>
                  <div className="post-image-preview" onClick={() => setPreviewPost(post)}>
                    <img src={post.imageUrl} alt="Post preview" />
                    <button className="btn-preview">
                      <FiEye />
                    </button>
                  </div>
                  <div className="post-queue-content">
                    <div className="post-queue-header">
                      <span className={`status-badge ${post.status}`}>
                        {post.status === 'approved' ? <FiCheckCircle /> : <FiClock />}
                        {post.status}
                      </span>
                      <span className="schedule-info">
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
                      <p className="queue-caption" onClick={() => setEditingCaption(post.id)}>
                        <span>{post.caption?.substring(0, 100)}...</span>
                        <FiEdit2 className="edit-icon" />
                      </p>
                    )}
                    <p className="queue-hashtags">{post.hashtags}</p>
                  </div>
                  <div className="post-queue-actions">
                    {post.status !== 'approved' && (
                      <button className="btn-action approve" onClick={() => approvePost(post.id)}>
                        <FiCheck />
                      </button>
                    )}
                    <button className="btn-action post" onClick={() => postNow(post.id)}>
                      <FiSend />
                    </button>
                    <button className="btn-action delete" onClick={() => deletePost(post.id)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <section role="tabpanel">
          <div className="settings-grid">
            {/* Niche */}
            <div className="section">
              <h3><FiGrid aria-hidden="true" /> Niche</h3>
              <div className="form-group">
                <select
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
            </div>

            {/* Image Style */}
            <div className="section">
              <h3><FiImage aria-hidden="true" /> Image Style</h3>
              <div className="form-group">
                <select
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
            </div>

            {/* Hashtags */}
            <div className="section setting-card wide">
              <h3><FiHash aria-hidden="true" /> Default Hashtags</h3>
              <div className="form-group">
                <input
                  type="text"
                  value={settings.hashtags}
                  onChange={(e) => setSettings(prev => ({ ...prev, hashtags: e.target.value }))}
                  placeholder="#hashtag1 #hashtag2 ..."
                />
              </div>
            </div>

            {/* Posts Per Day */}
            <div className="section">
              <h3><FiCalendar aria-hidden="true" /> Posts Per Day</h3>
              <div className="form-group">
                <select
                  value={settings.postsPerDay}
                  onChange={(e) => setSettings(prev => ({ ...prev, postsPerDay: parseInt(e.target.value) }))}
                >
                  <option value={1}>1 post/day</option>
                  <option value={2}>2 posts/day</option>
                  <option value={3}>3 posts/day</option>
                  <option value={4}>4 posts/day</option>
                </select>
              </div>
            </div>

            {/* Preferred Times */}
            <div className="section">
              <h3><FiClock aria-hidden="true" /> Preferred Times</h3>
              <div className="time-slots-container">
                {settings.preferredTimes.map((time, index) => (
                  <div key={index} className="time-slot">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => updatePreferredTime(index, e.target.value)}
                    />
                    <button className="btn-remove-time" onClick={() => removePreferredTime(index)}>
                      <FiX />
                    </button>
                  </div>
                ))}
                <button className="btn-add-time" onClick={addPreferredTime}>
                  <FiPlus /> Add
                </button>
              </div>
            </div>

            {/* Caption Style */}
            <div className="section">
              <h3><FiType aria-hidden="true" /> Caption Style</h3>
              <div className="form-group">
                <select
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
            </div>

            {/* Approval Mode */}
            <div className="section">
              <h3><FiCheck aria-hidden="true" /> Approval Mode</h3>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="postAutoApprove"
                  checked={settings.autoApprove}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    autoApprove: e.target.checked,
                    requireReview: !e.target.checked
                  }))}
                />
                <label htmlFor="postAutoApprove">Auto-approve all posts</label>
              </div>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="postRequireReview"
                  checked={settings.requireReview}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    requireReview: e.target.checked,
                    autoApprove: !e.target.checked
                  }))}
                />
                <label htmlFor="postRequireReview">Require manual review</label>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <section role="tabpanel">
          {history.length === 0 ? (
            <div className="empty-state">
              <FiClock />
              <h3>No posts yet</h3>
              <p>Your posted content will appear here</p>
            </div>
          ) : (
            <div className="post-history-grid">
              {history.map(post => (
                <article key={post.id} className="post-history-card" onClick={() => setPreviewPost(post)}>
                  <div className="post-history-image">
                    <img src={post.imageUrl} alt="Posted content" />
                  </div>
                  <div className="post-history-info">
                    <p>{post.caption?.substring(0, 60)}...</p>
                    <span className="history-date">
                      <FiCheckCircle />
                      {formatScheduledTime(post.postedAt)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Preview Modal */}
      {previewPost && (
        <div className="modal-overlay" onClick={() => setPreviewPost(null)}>
          <div className="modal-content post-modal" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setPreviewPost(null)}>
              <FiX />
            </button>
            <img
              className="modal-image"
              src={previewPost.imageUrl}
              alt="Post preview"
            />
            <div className="modal-details">
              <p>{previewPost.caption}</p>
              <p className="modal-hashtags">{previewPost.hashtags}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default AutopilotPost;
