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
  FiVideo,
  FiDownload
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
  const [settingsSaved, setSettingsSaved] = useState(false);
  
  // Background jobs state
  const [backgroundJobs, setBackgroundJobs] = useState([]);
  const [pollingJobIds, setPollingJobIds] = useState([]);

  // Load saved settings from localStorage or use defaults
  const getDefaultSettings = () => ({
    // Business Identity
    businessName: '',
    businessType: 'personal_brand',
    targetAudience: '',
    brandTone: 'professional',
    callToAction: '',
    websiteUrl: '',
    
    // Content Settings
    niche: 'motivational',
    style: 'cinematic',
    topics: '',
    contentGoal: 'engagement',
    hookStyle: 'question',
    
    // Hashtags & Caption
    hashtags: '#viral #trending #reels',
    captionStyle: 'short',
    includeEmojis: true,
    includeCTA: true,
    
    // Scheduling
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
    
    // Visual Style
    textOverlay: {
      enabled: true,
      autoGenerate: true,
      position: 'bottom',
      style: 'chunk',
      color: 'white',
      animation: 'fade'
    },
    
    // Audio
    music: {
      enabled: true,
      genre: 'trending',
      mood: 'upbeat',
      autoSelect: true
    },
    voiceover: {
      enabled: true,
      provider: 'elevenlabs',
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      voiceName: 'Rachel',
      style: 'conversational',
      speed: 'normal'
    },
    
    // Approval
    autoApprove: false,
    requireReview: true
  });

  const loadSavedSettings = () => {
    try {
      const saved = localStorage.getItem('autopilotReelsSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...getDefaultSettings(), ...parsed };
      }
    } catch (e) {
      console.log('Failed to load saved settings:', e);
    }
    return getDefaultSettings();
  };

  // Settings State - initialize from localStorage
  const [settings, setSettings] = useState(loadSavedSettings);

  // ElevenLabs voices
  const [elevenLabsVoices, setElevenLabsVoices] = useState([]);
  const [elevenLabsStatus, setElevenLabsStatus] = useState({ available: false });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('autopilotReelsSettings', JSON.stringify(settings));
    } catch (e) {
      console.log('Failed to save settings:', e);
    }
  }, [settings]);

  // Save settings manually with feedback
  const saveSettings = () => {
    try {
      localStorage.setItem('autopilotReelsSettings', JSON.stringify(settings));
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  // Reset settings to defaults
  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      const defaults = getDefaultSettings();
      setSettings(defaults);
      localStorage.setItem('autopilotReelsSettings', JSON.stringify(defaults));
    }
  };

  useEffect(() => {
    loadAutopilotStatus();
    loadQueue();
    loadHistory();
    loadElevenLabsVoices();
    loadBackgroundJobs(); // Load any existing background jobs
  }, []);

  // Poll for background job updates
  useEffect(() => {
    const processingJobs = backgroundJobs.filter(j => j.status === 'processing');
    
    if (processingJobs.length === 0) return;
    
    const pollInterval = setInterval(async () => {
      for (const job of processingJobs) {
        try {
          const response = await api.get(`/ai/autopilot/reels/jobs/${job.id}`);
          if (response.data.job) {
            setBackgroundJobs(prev => prev.map(j => 
              j.id === job.id ? response.data.job : j
            ));
            
            // If completed, refresh the queue
            if (response.data.job.status === 'completed') {
              loadQueue();
            }
          }
        } catch (error) {
          console.error('Failed to poll job:', error);
        }
      }
    }, 3000); // Poll every 3 seconds
    
    return () => clearInterval(pollInterval);
  }, [backgroundJobs]);

  const loadBackgroundJobs = async () => {
    try {
      const response = await api.get('/ai/autopilot/reels/jobs');
      if (response.data.jobs) {
        setBackgroundJobs(response.data.jobs);
      }
    } catch (error) {
      console.log('No background jobs');
    }
  };

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
    setGenerationStatus('Starting background generation...');
    try {
      // Use background generation endpoint
      const response = await api.post('/ai/autopilot/reels/generate/background', { settings });
      
      if (response.data.success && response.data.jobId) {
        const jobId = response.data.jobId;
        
        // Add job to state
        const newJob = {
          id: jobId,
          status: 'processing',
          progress: 0,
          stepMessage: 'Starting...',
          createdAt: new Date().toISOString()
        };
        setBackgroundJobs(prev => [newJob, ...prev]);
        
        setGenerationStatus('🚀 Video generating in background! You can leave this page.');
        setActiveTab('queue'); // Switch to queue to show progress
        
        // Clear status after a few seconds
        setTimeout(() => setGenerationStatus(''), 5000);
      }
    } catch (error) {
      console.error('Failed to start generation:', error);
      setGenerationStatus('');
      alert('Failed to start video generation: ' + (error.response?.data?.message || error.message));
    }
    setIsGenerating(false);
  };

  // Cancel a background job
  const cancelBackgroundJob = async (jobId) => {
    try {
      await api.delete(`/ai/autopilot/reels/jobs/${jobId}`);
      setBackgroundJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
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
          {/* Background Jobs Section */}
          {backgroundJobs.filter(j => j.status === 'processing').length > 0 && (
            <div className="background-jobs-section">
              <h3><FiRefreshCw className="spin" /> Generating in Background</h3>
              <p className="background-jobs-hint">These videos will continue generating even if you leave this page</p>
              <div className="background-jobs-list">
                {backgroundJobs.filter(j => j.status === 'processing').map(job => (
                  <div key={job.id} className="background-job-card">
                    <div className="job-progress-bar">
                      <div 
                        className="job-progress-fill" 
                        style={{ width: `${job.progress || 0}%` }}
                      />
                    </div>
                    <div className="job-info">
                      <span className="job-step">{job.stepMessage || 'Processing...'}</span>
                      <span className="job-percent">{job.progress || 0}%</span>
                    </div>
                    <button 
                      className="btn-cancel-job" 
                      onClick={() => cancelBackgroundJob(job.id)}
                      title="Cancel job"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {queue.length === 0 && backgroundJobs.filter(j => j.status === 'processing').length === 0 ? (
            <div className="empty-state">
              <FiList />
              <h3>No videos in queue</h3>
              <p>Click "Generate Now" to create your first video, or start Auto-pilot</p>
              <button className="btn-primary" onClick={generateNow} disabled={isGenerating}>
                <FiPlus /> Generate Video
              </button>
            </div>
          ) : queue.length > 0 ? (
            <div className="queue-grid">
              {queue.map(video => (
                <article key={video.id} className={`queue-card ${video.status}`}>
                  <div className="queue-preview">
                    {video.videoUrl && video.videoUrl.startsWith('http') ? (
                      <video 
                        src={video.videoUrl} 
                        muted 
                        playsInline 
                        onError={(e) => {
                          console.error('Video load error:', video.videoUrl);
                          e.target.style.display = 'none';
                          e.target.parentNode.querySelector('.video-placeholder')?.style.removeProperty('display');
                        }}
                      />
                    ) : null}
                    <div className="video-placeholder" style={video.videoUrl && video.videoUrl.startsWith('http') ? {display: 'none'} : {}}>
                      <FiVideo />
                      <span>{video.videoUrl ? 'Loading video...' : 'Video generating...'}</span>
                    </div>
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
                      {video.videoUrl && (
                        <a 
                          href={video.videoUrl} 
                          download={`reel-${video.id}.mp4`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-action download"
                        >
                          <FiDownload /> Download
                        </a>
                      )}
                      <button className="btn-action delete" onClick={() => deleteVideo(video.id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <section role="tabpanel">
          <div className="settings-grid">
            
            {/* ===== BUSINESS IDENTITY SECTION ===== */}
            <div className="settings-section-header wide">
              <h2>🏢 Business Identity</h2>
              <p>Tell us about your business so AI creates content that matches your brand</p>
            </div>
            
            {/* Business Name */}
            <div className="section">
              <h3>📛 Business/Brand Name</h3>
              <div className="form-group">
                <input
                  type="text"
                  value={settings.businessName}
                  onChange={(e) => setSettings(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Your Business Name"
                />
              </div>
            </div>
            
            {/* Business Type */}
            <div className="section">
              <h3>🏷️ Business Type</h3>
              <div className="form-group">
                <select
                  value={settings.businessType}
                  onChange={(e) => setSettings(prev => ({ ...prev, businessType: e.target.value }))}
                >
                  <option value="personal_brand">Personal Brand / Influencer</option>
                  <option value="ecommerce">E-commerce / Online Store</option>
                  <option value="saas">SaaS / Software</option>
                  <option value="agency">Marketing Agency</option>
                  <option value="coaching">Coaching / Consulting</option>
                  <option value="restaurant">Restaurant / Food Business</option>
                  <option value="fitness">Gym / Fitness Studio</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="healthcare">Healthcare / Wellness</option>
                  <option value="education">Education / Courses</option>
                  <option value="local_service">Local Service Business</option>
                  <option value="nonprofit">Non-Profit</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            {/* Target Audience */}
            <div className="section wide">
              <h3>🎯 Target Audience</h3>
              <div className="form-group">
                <input
                  type="text"
                  value={settings.targetAudience}
                  onChange={(e) => setSettings(prev => ({ ...prev, targetAudience: e.target.value }))}
                  placeholder="e.g., Entrepreneurs aged 25-40 interested in productivity"
                />
                <small>Describe who you want to reach with your content</small>
              </div>
            </div>
            
            {/* Brand Tone */}
            <div className="section">
              <h3>🎭 Brand Voice/Tone</h3>
              <div className="form-group">
                <select
                  value={settings.brandTone}
                  onChange={(e) => setSettings(prev => ({ ...prev, brandTone: e.target.value }))}
                >
                  <option value="professional">Professional & Authoritative</option>
                  <option value="friendly">Friendly & Approachable</option>
                  <option value="inspirational">Inspirational & Motivational</option>
                  <option value="humorous">Humorous & Fun</option>
                  <option value="educational">Educational & Informative</option>
                  <option value="luxury">Luxury & Premium</option>
                  <option value="casual">Casual & Relatable</option>
                  <option value="bold">Bold & Provocative</option>
                  <option value="empathetic">Empathetic & Supportive</option>
                </select>
              </div>
            </div>
            
            {/* Call to Action */}
            <div className="section">
              <h3>📢 Default Call-to-Action</h3>
              <div className="form-group">
                <input
                  type="text"
                  value={settings.callToAction}
                  onChange={(e) => setSettings(prev => ({ ...prev, callToAction: e.target.value }))}
                  placeholder="e.g., Follow for more tips!"
                />
              </div>
            </div>
            
            {/* Website URL */}
            <div className="section">
              <h3>🔗 Website/Link</h3>
              <div className="form-group">
                <input
                  type="url"
                  value={settings.websiteUrl}
                  onChange={(e) => setSettings(prev => ({ ...prev, websiteUrl: e.target.value }))}
                  placeholder="https://yourbusiness.com"
                />
              </div>
            </div>
            
            {/* ===== CONTENT STRATEGY SECTION ===== */}
            <div className="settings-section-header wide">
              <h2>📝 Content Strategy</h2>
              <p>Define what kind of content you want to create</p>
            </div>
            
            {/* Niche */}
            <div className="section">
              <h3><FiGrid aria-hidden="true" /> Content Niche</h3>
              <div className="form-group">
                <select
                  value={settings.niche}
                  onChange={(e) => setSettings(prev => ({ ...prev, niche: e.target.value }))}
                >
                  <option value="motivational">Motivational</option>
                  <option value="fitness">Fitness & Health</option>
                  <option value="business">Business & Finance</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="travel">Travel</option>
                  <option value="food">Food & Cooking</option>
                  <option value="tech">Technology</option>
                  <option value="fashion">Fashion & Beauty</option>
                  <option value="comedy">Comedy & Entertainment</option>
                  <option value="educational">Educational</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="marketing">Marketing Tips</option>
                  <option value="entrepreneurship">Entrepreneurship</option>
                  <option value="productivity">Productivity</option>
                  <option value="mindset">Mindset & Self-Improvement</option>
                </select>
              </div>
            </div>
            
            {/* Content Goal */}
            <div className="section">
              <h3>🎯 Content Goal</h3>
              <div className="form-group">
                <select
                  value={settings.contentGoal}
                  onChange={(e) => setSettings(prev => ({ ...prev, contentGoal: e.target.value }))}
                >
                  <option value="engagement">Maximize Engagement (Likes, Comments)</option>
                  <option value="followers">Grow Followers</option>
                  <option value="sales">Drive Sales/Conversions</option>
                  <option value="awareness">Build Brand Awareness</option>
                  <option value="education">Educate Audience</option>
                  <option value="traffic">Drive Website Traffic</option>
                  <option value="trust">Build Trust & Authority</option>
                </select>
              </div>
            </div>
            
            {/* Hook Style */}
            <div className="section">
              <h3>🪝 Hook Style</h3>
              <div className="form-group">
                <select
                  value={settings.hookStyle}
                  onChange={(e) => setSettings(prev => ({ ...prev, hookStyle: e.target.value }))}
                >
                  <option value="question">Start with a Question</option>
                  <option value="statistic">Start with a Statistic</option>
                  <option value="bold_claim">Bold Claim / Controversy</option>
                  <option value="story">Storytelling Hook</option>
                  <option value="problem">Problem-Solution</option>
                  <option value="curiosity">Curiosity Gap</option>
                  <option value="stop_scroll">"Stop Scrolling" Pattern Interrupt</option>
                  <option value="secret">Secret/Insider Knowledge</option>
                </select>
                <small>How should the video grab attention in the first 2 seconds?</small>
              </div>
            </div>

            {/* Video Style */}
            <div className="section">
              <h3><FiPlay aria-hidden="true" /> Visual Style</h3>
              <div className="form-group">
                <select
                  value={settings.style}
                  onChange={(e) => setSettings(prev => ({ ...prev, style: e.target.value }))}
                >
                  <option value="cinematic">Cinematic & Dramatic</option>
                  <option value="energetic">Energetic & Fast-Paced</option>
                  <option value="minimal">Minimal & Clean</option>
                  <option value="aesthetic">Aesthetic & Moody</option>
                  <option value="bold">Bold & Colorful</option>
                  <option value="vintage">Vintage & Retro</option>
                  <option value="professional">Professional & Corporate</option>
                  <option value="playful">Playful & Fun</option>
                </select>
              </div>
            </div>
            
            {/* Topics */}
            <div className="section wide">
              <h3>💡 Specific Topics (Optional)</h3>
              <div className="form-group">
                <textarea
                  value={settings.topics}
                  onChange={(e) => setSettings(prev => ({ ...prev, topics: e.target.value }))}
                  placeholder="Enter specific topics you want to cover, one per line. e.g.:&#10;How to grow on Instagram&#10;Best productivity hacks&#10;Morning routine tips"
                  rows={4}
                />
                <small>Leave empty to let AI generate trending topics for your niche</small>
              </div>
            </div>

            {/* ===== CAPTION & HASHTAGS SECTION ===== */}
            <div className="settings-section-header wide">
              <h2>#️⃣ Caption & Hashtags</h2>
              <p>Customize how your captions and hashtags are generated</p>
            </div>

            {/* Hashtags */}
            <div className="section wide">
              <h3><FiHash aria-hidden="true" /> Default Hashtags</h3>
              <div className="form-group">
                <input
                  type="text"
                  value={settings.hashtags}
                  onChange={(e) => setSettings(prev => ({ ...prev, hashtags: e.target.value }))}
                  placeholder="#yourbrand #yourniche #viral #trending"
                />
                <small>These will be added to every post (AI will also suggest trending ones)</small>
              </div>
            </div>
            
            {/* Caption Style */}
            <div className="section">
              <h3>📝 Caption Length</h3>
              <div className="form-group">
                <select
                  value={settings.captionStyle}
                  onChange={(e) => setSettings(prev => ({ ...prev, captionStyle: e.target.value }))}
                >
                  <option value="short">Short & Punchy (1-2 lines)</option>
                  <option value="medium">Medium (3-5 lines)</option>
                  <option value="long">Long-form Story (6+ lines)</option>
                </select>
              </div>
            </div>
            
            {/* Caption Options */}
            <div className="section">
              <h3>✨ Caption Options</h3>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="includeEmojis"
                  checked={settings.includeEmojis}
                  onChange={(e) => setSettings(prev => ({ ...prev, includeEmojis: e.target.checked }))}
                />
                <label htmlFor="includeEmojis">Include emojis in captions</label>
              </div>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="includeCTA"
                  checked={settings.includeCTA}
                  onChange={(e) => setSettings(prev => ({ ...prev, includeCTA: e.target.checked }))}
                />
                <label htmlFor="includeCTA">Include call-to-action</label>
              </div>
            </div>

            {/* ===== SCHEDULING SECTION ===== */}
            <div className="settings-section-header wide">
              <h2>📅 Scheduling</h2>
              <p>Set your posting schedule</p>
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
            
            {/* ===== VISUAL & AUDIO SECTION ===== */}
            <div className="settings-section-header wide">
              <h2>🎬 Visual & Audio</h2>
              <p>Customize the look and sound of your reels</p>
            </div>

            {/* Text Overlay */}
            <div className="section">
              <h3><FiType aria-hidden="true" /> Text/Subtitles</h3>
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
              {settings.textOverlay.enabled && (
                <>
                  <div className="form-group" style={{ marginTop: '10px' }}>
                    <label>Text Style</label>
                    <select
                      value={settings.textOverlay.style}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        textOverlay: { ...prev.textOverlay, style: e.target.value }
                      }))}
                    >
                      <option value="chunk">Bold Viral (TikTok/Reels)</option>
                      <option value="blockbuster">Blockbuster</option>
                      <option value="minimal">Minimal Clean</option>
                      <option value="subtitle">Classic Subtitle</option>
                      <option value="marker">Handwritten</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Position</label>
                    <select
                      value={settings.textOverlay.position}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        textOverlay: { ...prev.textOverlay, position: e.target.value }
                      }))}
                    >
                      <option value="bottom">Bottom (Recommended)</option>
                      <option value="center">Center</option>
                      <option value="top">Top</option>
                    </select>
                  </div>
                </>
              )}
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
              {settings.music.enabled && (
                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label>Music Mood</label>
                  <select
                    value={settings.music.mood}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      music: { ...prev.music, mood: e.target.value }
                    }))}
                  >
                    <option value="upbeat">Upbeat & Energetic</option>
                    <option value="chill">Chill & Relaxed</option>
                    <option value="cinematic">Cinematic & Epic</option>
                    <option value="electronic">Electronic & Modern</option>
                    <option value="inspiring">Inspiring & Motivational</option>
                  </select>
                </div>
              )}
            </div>

            {/* Voiceover - ElevenLabs */}
            <div className="section">
              <h3>🎙️ AI Voiceover</h3>
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
                <label htmlFor="voiceoverEnabled">Add AI voiceover</label>
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

            {/* ===== APPROVAL SECTION ===== */}
            <div className="settings-section-header wide">
              <h2>✅ Approval & Automation</h2>
              <p>Control how videos are reviewed before posting</p>
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
            
            {/* Save/Reset Buttons */}
            <div className="settings-actions wide">
              <button 
                className="btn btn-secondary"
                onClick={resetSettings}
              >
                <FiRefreshCw /> Reset to Defaults
              </button>
              <button 
                className={`btn btn-primary ${settingsSaved ? 'saved' : ''}`}
                onClick={saveSettings}
              >
                {settingsSaved ? (
                  <>
                    <FiCheck /> Settings Saved!
                  </>
                ) : (
                  <>
                    <FiCheck /> Save Settings
                  </>
                )}
              </button>
            </div>
            
            <p className="settings-note wide">
              💾 Settings are automatically saved as you make changes
            </p>
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
