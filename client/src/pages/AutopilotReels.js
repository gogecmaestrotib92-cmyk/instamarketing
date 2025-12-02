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
  FiMusic,
  FiType,
  FiGrid,
  FiRefreshCw,
  FiEye,
  FiEdit2,
  FiHash,
  FiCheckCircle,
  FiVideo
} from 'react-icons/fi';
import api from '../services/api';
import './AutopilotReels.css';

const AutopilotReels = () => {
  const [activeTab, setActiveTab] = useState('queue');
  const [isAutopilotActive, setIsAutopilotActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
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
    voiceover: {
      enabled: false,
      provider: 'elevenlabs',
      voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel - default
      voiceName: 'Rachel',
      style: 'conversational'
    },
    autoApprove: false,
    requireReview: true
  });

  // ElevenLabs voices
  const [elevenLabsVoices, setElevenLabsVoices] = useState([]);
  const [elevenLabsStatus, setElevenLabsStatus] = useState({ available: false });

  useEffect(() => {
    loadAutopilotStatus();
    loadQueue();
    loadHistory();
    loadElevenLabsVoices();
  }, []);

  const loadElevenLabsVoices = async () => {
    try {
      // Check status first
      const statusRes = await api.get('/ai/elevenlabs/status');
      setElevenLabsStatus(statusRes.data);
      
      // Load recommended voices
      const voicesRes = await api.get('/ai/elevenlabs/voices/recommended');
      if (voicesRes.data.success) {
        setElevenLabsVoices(voicesRes.data.voices);
      }
    } catch (error) {
      console.log('ElevenLabs not available:', error.message);
    }
  };

  const loadAutopilotStatus = async () => {
    try {
      const response = await api.get('/ai/autopilot/reels/status');
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
      const response = await api.get('/ai/autopilot/reels/queue');
      setQueue(response.data.queue || []);
    } catch (error) {
      console.error('Failed to load queue:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await api.get('/ai/autopilot/reels/history');
      setHistory(response.data.history || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const toggleAutopilot = async () => {
    setIsLoading(true);
    try {
      if (isAutopilotActive) {
        await api.post('/ai/autopilot/reels/stop');
        setIsAutopilotActive(false);
      } else {
        await api.post('/ai/autopilot/reels/start', { settings });
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
    setGenerationStatus('Starting viral video pipeline...');
    try {
      // Show progress simulation (actual progress comes from server)
      const statusMessages = [
        '✍️ Generating viral script with AI...',
        '🎬 Creating video with Replicate (this may take 2-3 minutes)...',
        '🎤 Adding voiceover...',
        '🎵 Selecting music...',
        '📝 Creating text overlays...',
        '🎨 Rendering final video...'
      ];
      
      let statusIndex = 0;
      const statusInterval = setInterval(() => {
        if (statusIndex < statusMessages.length - 1) {
          statusIndex++;
          setGenerationStatus(statusMessages[statusIndex]);
        }
      }, 15000); // Update every 15 seconds
      
      const response = await api.post('/ai/autopilot/reels/generate', { settings });
      
      clearInterval(statusInterval);
      
      if (response.data.video) {
        setGenerationStatus('✅ Video created successfully!');
        setQueue(prev => [response.data.video, ...prev]);
        setActiveTab('queue');
        setTimeout(() => setGenerationStatus(''), 3000);
      }
    } catch (error) {
      console.error('Failed to generate:', error);
      setGenerationStatus('');
      alert('Failed to generate video: ' + (error.response?.data?.message || error.message));
    }
    setIsGenerating(false);
  };

  const approveVideo = async (videoId) => {
    try {
      await api.post(`/ai/autopilot/reels/queue/${videoId}/approve`);
      setQueue(prev => prev.map(v => v.id === videoId ? { ...v, status: 'approved' } : v));
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const deleteVideo = async (videoId) => {
    if (!window.confirm('Delete this video from queue?')) return;
    try {
      await api.delete(`/ai/autopilot/reels/queue/${videoId}`);
      setQueue(prev => prev.filter(v => v.id !== videoId));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const postNow = async (videoId) => {
    try {
      await api.post(`/ai/autopilot/reels/queue/${videoId}/post`);
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
      await api.patch(`/ai/autopilot/reels/queue/${videoId}`, { caption: newCaption });
      setQueue(prev => prev.map(v => v.id === videoId ? { ...v, caption: newCaption } : v));
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
    <main className="autopilot-page">
      {/* Header */}
      <header className="page-header">
        <h1>
          <FiVideo className="header-icon" aria-hidden="true" />
          Reels Auto-pilot
        </h1>
        <p>AI automatically generates, edits, and posts Reels on your schedule</p>
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
        {generationStatus && (
          <div className="generation-status-banner">
            <FiRefreshCw className={isGenerating ? 'spin' : ''} />
            <span>{generationStatus}</span>
          </div>
        )}
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
        <p>When active, AI will automatically generate and post Reels based on your settings</p>
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
              <FiList />
              <h3>No videos in queue</h3>
              <p>Click "Generate Now" to create your first video, or start Auto-pilot</p>
              <button className="btn-primary" onClick={generateNow} disabled={isGenerating}>
                <FiPlus /> Generate Video
              </button>
            </div>
          ) : (
            <div className="queue-grid">
              {queue.map(video => (
                <article key={video.id} className={`queue-card ${video.status}`}>
                  <div className="queue-preview">
                    {video.videoUrl && !video.videoUrl.includes('demo/video') ? (
                      <video src={video.videoUrl} muted playsInline />
                    ) : (
                      <div className="video-placeholder">
                        <FiVideo />
                        <span>Video generating...</span>
                      </div>
                    )}
                    <button className="btn-preview" onClick={() => setPreviewVideo(video)}>
                      <FiEye />
                    </button>
                  </div>
                  <div className="queue-content">
                    <div className="queue-header">
                      <span className={`status-badge ${video.status}`}>
                        {video.status === 'approved' ? <FiCheckCircle /> : <FiClock />}
                        {video.status}
                      </span>
                      <span className="schedule-info">
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
                      <p className="queue-caption" onClick={() => setEditingCaption(video.id)}>
                        <span>{video.caption}</span>
                        <FiEdit2 className="edit-icon" />
                      </p>
                    )}
                    <p className="queue-hashtags">{video.hashtags}</p>
                    <div className="queue-actions">
                      {video.status !== 'approved' && (
                        <button className="btn-action approve" onClick={() => approveVideo(video.id)}>
                          <FiCheck /> Approve
                        </button>
                      )}
                      <button className="btn-action post" onClick={() => postNow(video.id)}>
                        <FiSend /> Post Now
                      </button>
                      <button className="btn-action delete" onClick={() => deleteVideo(video.id)}>
                        <FiTrash2 />
                      </button>
                    </div>
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
            </div>

            {/* Video Style */}
            <div className="section">
              <h3><FiPlay aria-hidden="true" /> Video Style</h3>
              <div className="form-group">
                <select
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
                  <option value={5}>5 posts/day</option>
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

            {/* Text Overlay */}
            <div className="section">
              <h3><FiType aria-hidden="true" /> Text Overlay</h3>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="textOverlayEnabled"
                  checked={settings.textOverlay.enabled}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    textOverlay: { ...prev.textOverlay, enabled: e.target.checked }
                  }))}
                />
                <label htmlFor="textOverlayEnabled">Enable text overlays</label>
              </div>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="textOverlayAuto"
                  checked={settings.textOverlay.autoGenerate}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    textOverlay: { ...prev.textOverlay, autoGenerate: e.target.checked }
                  }))}
                />
                <label htmlFor="textOverlayAuto">AI-generate captions</label>
              </div>
            </div>

            {/* Music */}
            <div className="section">
              <h3><FiMusic aria-hidden="true" /> Background Music</h3>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="musicEnabled"
                  checked={settings.music.enabled}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    music: { ...prev.music, enabled: e.target.checked }
                  }))}
                />
                <label htmlFor="musicEnabled">Add background music</label>
              </div>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="musicAutoSelect"
                  checked={settings.music.autoSelect}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    music: { ...prev.music, autoSelect: e.target.checked }
                  }))}
                />
                <label htmlFor="musicAutoSelect">Auto-select trending music</label>
              </div>
            </div>

            {/* Voiceover - ElevenLabs */}
            <div className="section">
              <h3>🎙️ AI Voiceover (ElevenLabs)</h3>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="voiceoverEnabled"
                  checked={settings.voiceover.enabled}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    voiceover: { ...prev.voiceover, enabled: e.target.checked }
                  }))}
                />
                <label htmlFor="voiceoverEnabled">Add AI voiceover to videos</label>
              </div>
              
              {settings.voiceover.enabled && (
                <>
                  {!elevenLabsStatus.available && (
                    <div className="warning-banner">
                      ⚠️ ElevenLabs API key not configured. Add ELEVENLABS_API_KEY to enable.
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label>Voice</label>
                    <select
                      value={settings.voiceover.voiceId}
                      onChange={(e) => {
                        const voice = elevenLabsVoices.find(v => v.id === e.target.value);
                        setSettings(prev => ({
                          ...prev,
                          voiceover: { 
                            ...prev.voiceover, 
                            voiceId: e.target.value,
                            voiceName: voice?.name || 'Custom'
                          }
                        }));
                      }}
                    >
                      {elevenLabsVoices.map(voice => (
                        <option key={voice.id} value={voice.id}>
                          {voice.name} - {voice.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Voice Style</label>
                    <select
                      value={settings.voiceover.style}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        voiceover: { ...prev.voiceover, style: e.target.value }
                      }))}
                    >
                      <option value="energetic">Energetic</option>
                      <option value="conversational">Conversational</option>
                      <option value="professional">Professional</option>
                      <option value="dramatic">Dramatic</option>
                      <option value="calm">Calm</option>
                      <option value="narrator">Narrator</option>
                      <option value="youthful">Youthful</option>
                      <option value="dynamic">Dynamic</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Approval Mode */}
            <div className="section">
              <h3><FiCheck aria-hidden="true" /> Approval Mode</h3>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="autoApprove"
                  checked={settings.autoApprove}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    autoApprove: e.target.checked,
                    requireReview: !e.target.checked
                  }))}
                />
                <label htmlFor="autoApprove">Auto-approve all videos</label>
              </div>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="requireReview"
                  checked={settings.requireReview}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    requireReview: e.target.checked,
                    autoApprove: !e.target.checked
                  }))}
                />
                <label htmlFor="requireReview">Require manual review</label>
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
              <p>Your posted Reels will appear here</p>
            </div>
          ) : (
            <div className="history-grid">
              {history.map(video => (
                <article key={video.id} className="history-card" onClick={() => setPreviewVideo(video)}>
                  <div className="history-preview">
                    <video src={video.videoUrl} muted />
                  </div>
                  <div className="history-info">
                    <p>{video.caption}</p>
                    <span className="history-date">
                      <FiCheckCircle />
                      Posted {formatScheduledTime(video.postedAt)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Preview Modal */}
      {previewVideo && (
        <div className="modal-overlay" onClick={() => setPreviewVideo(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setPreviewVideo(null)}>
              <FiX />
            </button>
            <video
              className="modal-video"
              src={previewVideo.videoUrl}
              controls
              autoPlay
            />
            <div className="modal-details">
              <p>{previewVideo.caption}</p>
              <p className="modal-hashtags">{previewVideo.hashtags}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default AutopilotReels;
