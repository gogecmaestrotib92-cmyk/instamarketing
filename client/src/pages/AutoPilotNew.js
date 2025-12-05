import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCpu,
  FiClock,
  FiCalendar,
  FiImage,
  FiVideo,
  FiMic,
  FiLayers,
  FiCheck,
  FiChevronRight,
  FiChevronLeft,
  FiPlay,
  FiEdit2,
  FiRefreshCw,
  FiZap,
  FiTarget,
  FiSettings,
  FiPlus,
  FiEye,
  FiList,
  FiLink,
  FiExternalLink,
  FiBriefcase
} from 'react-icons/fi';
import api from '../services/api';
import AutoPilotPreviewModal from '../components/AutoPilotPreviewModal';
import './AutoPilotNew.css';

const AutoPilotNew = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewDraft, setPreviewDraft] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [showDrafts, setShowDrafts] = useState(false);
  
  // Step 1: Topics
  const [topics, setTopics] = useState(['', '', '', '', '', '', '', '', '']);
  const [mainTopicEntered, setMainTopicEntered] = useState(false);
  
  // Step 2: Frequency & Settings
  const [frequency, setFrequency] = useState('once');
  const [timeSlots, setTimeSlots] = useState(['09:00']);
  const [postTypes, setPostTypes] = useState({
    singleImage: true,
    videos: false,
    voiceoverVideos: false,
    carousel: false
  });
  
  // Connected Brand from BusinessHub
  const [connectedBrand, setConnectedBrand] = useState(null);
  const [brandDetails, setBrandDetails] = useState({
    brandName: '',
    brandDescription: '',
    targetAudience: '',
    brandTone: 'professional',
    callToAction: '',
    hashtags: '',
    industry: ''
  });

  // Available time slots
  const availableTimeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  // Load saved data from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('autoPilotNewSettings');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.topics) setTopics(data.topics);
        if (data.frequency) setFrequency(data.frequency);
        if (data.timeSlots) setTimeSlots(data.timeSlots);
        if (data.postTypes) setPostTypes(data.postTypes);
        if (data.brandDetails) setBrandDetails(data.brandDetails);
      }
      
      // Auto-connect brand from BusinessHub if available
      const businessInfo = localStorage.getItem('businessInfo');
      if (businessInfo) {
        const parsed = JSON.parse(businessInfo);
        if (parsed.businessName) {
          setConnectedBrand(parsed);
          // Map to brandDetails format
          setBrandDetails(prev => ({
            ...prev,
            brandName: parsed.businessName || prev.brandName,
            brandDescription: parsed.description || prev.brandDescription,
            targetAudience: parsed.targetAudience || prev.targetAudience,
            brandTone: parsed.brandVoice || prev.brandTone,
            industry: parsed.industry || prev.industry
          }));
        }
      }
    } catch (e) {
      console.log('Failed to load saved settings');
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    try {
      localStorage.setItem('autoPilotNewSettings', JSON.stringify({
        topics,
        frequency,
        timeSlots,
        postTypes,
        brandDetails
      }));
    } catch (e) {
      console.log('Failed to save settings');
    }
  }, [topics, frequency, timeSlots, postTypes, brandDetails]);

  // Generate related topics using AI
  const generateRelatedTopics = async (mainTopic) => {
    if (!mainTopic.trim()) return;
    
    setIsGeneratingTopics(true);
    try {
      const response = await api.post('/ai/generate-topics', { 
        mainTopic: mainTopic.trim(),
        count: 8 
      });
      
      if (response.data.success && response.data.topics) {
        const newTopics = [mainTopic, ...response.data.topics.slice(0, 8)];
        setTopics(newTopics);
      }
    } catch (error) {
      console.error('Failed to generate topics:', error);
      // Fallback: generate simple variations
      const variations = [
        `${mainTopic} tips`,
        `${mainTopic} for beginners`,
        `Advanced ${mainTopic}`,
        `${mainTopic} mistakes to avoid`,
        `Best ${mainTopic} strategies`,
        `${mainTopic} trends`,
        `${mainTopic} success stories`,
        `How to improve ${mainTopic}`
      ];
      setTopics([mainTopic, ...variations]);
    }
    setIsGeneratingTopics(false);
  };

  // Handle first topic change
  const handleFirstTopicChange = (value) => {
    const newTopics = [...topics];
    newTopics[0] = value;
    setTopics(newTopics);
    
    // If user enters a topic and hasn't generated yet
    if (value.trim().length > 2 && !mainTopicEntered) {
      setMainTopicEntered(true);
    }
  };

  // Handle first topic blur - auto generate
  const handleFirstTopicBlur = () => {
    if (topics[0].trim().length > 2 && topics[1] === '') {
      generateRelatedTopics(topics[0]);
    }
  };

  // Handle topic change
  const handleTopicChange = (index, value) => {
    const newTopics = [...topics];
    newTopics[index] = value;
    setTopics(newTopics);
  };

  // Regenerate all topics
  const regenerateTopics = () => {
    if (topics[0].trim()) {
      generateRelatedTopics(topics[0]);
    }
  };

  // Get max time slots based on frequency
  const getMaxTimeSlots = () => {
    const limits = {
      alternate: 1,
      once: 1,
      twice: 2,
      thrice: 3
    };
    return limits[frequency] || 1;
  };

  // Toggle time slot (with frequency limit)
  const toggleTimeSlot = (time) => {
    const maxSlots = getMaxTimeSlots();
    
    if (timeSlots.includes(time)) {
      // Allow deselecting if more than 1 selected
      if (timeSlots.length > 1) {
        setTimeSlots(timeSlots.filter(t => t !== time));
      }
    } else {
      // Only add if under the limit
      if (timeSlots.length < maxSlots) {
        setTimeSlots([...timeSlots, time].sort());
      } else {
        // Replace the oldest slot with the new one
        const newSlots = [...timeSlots.slice(1), time].sort();
        setTimeSlots(newSlots);
      }
    }
  };

  // Reset time slots when frequency changes (to respect new limit)
  useEffect(() => {
    const limits = { alternate: 1, once: 1, twice: 2, thrice: 3 };
    const maxSlots = limits[frequency] || 1;
    setTimeSlots(prev => prev.length > maxSlots ? prev.slice(0, maxSlots) : prev);
  }, [frequency]);

  // Toggle post type
  const togglePostType = (type) => {
    const newTypes = { ...postTypes, [type]: !postTypes[type] };
    // Ensure at least one is selected
    if (Object.values(newTypes).some(v => v)) {
      setPostTypes(newTypes);
    }
  };

  // Get frequency label
  const getFrequencyLabel = () => {
    const labels = {
      alternate: 'Every Other Day',
      once: 'Once a Day',
      twice: 'Twice a Day',
      thrice: 'Three Times a Day'
    };
    return labels[frequency] || 'Once a Day';
  };

  // Get selected post types
  const getSelectedPostTypes = () => {
    const types = [];
    if (postTypes.singleImage) types.push('Single Image');
    if (postTypes.videos) types.push('Videos');
    if (postTypes.voiceoverVideos) types.push('Voice-over Videos');
    if (postTypes.carousel) types.push('Carousel');
    return types;
  };

  // Count filled topics
  const filledTopicsCount = topics.filter(t => t.trim()).length;

  // Validate current step
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return filledTopicsCount >= 9;
      case 2:
        // Brand connection is recommended but not required
        return timeSlots.length > 0 && Object.values(postTypes).some(v => v);
      case 3:
        // Review step - always valid if we got here
        return true;
      default:
        return true;
    }
  };

  // Start auto posting
  const startAutoPosting = async () => {
    setIsStarting(true);
    try {
      const response = await api.post('/ai/autopilot/v2/start', {
        topics: topics.filter(t => t.trim()),
        frequency,
        timeSlots,
        postTypes,
        brandDetails
      });
      
      if (response.data.success) {
        alert('🚀 Auto-Pilot started successfully! Your content will be created and posted automatically.');
      }
    } catch (error) {
      console.error('Failed to start auto-pilot:', error);
      alert('Failed to start auto-pilot: ' + (error.response?.data?.message || error.message));
    }
    setIsStarting(false);
  };

  // Generate preview for a single topic
  const generatePreview = async () => {
    setIsGeneratingPreview(true);
    try {
      // Pick a random topic and content type
      const validTopics = topics.filter(t => t.trim());
      const randomTopic = validTopics[Math.floor(Math.random() * validTopics.length)];
      
      // Get active content types
      const activeTypes = [];
      if (postTypes.singleImage) activeTypes.push('single_image');
      if (postTypes.carousel) activeTypes.push('carousel');
      if (postTypes.videos) activeTypes.push('reel');
      if (postTypes.voiceoverVideos) activeTypes.push('voiceover_video');
      
      const randomType = activeTypes[Math.floor(Math.random() * activeTypes.length)];
      
      console.log('Generating preview for:', randomTopic, randomType);
      
      const response = await api.post('/ai/autopilot/v2/generate-preview', {
        topic: randomTopic,
        contentType: randomType,
        brandDetails,
        userId: localStorage.getItem('userId') || 'demo'
      });
      
      if (response.data.success) {
        setPreviewDraft(response.data.draft);
        setShowPreviewModal(true);
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
      alert('Failed to generate preview: ' + (error.response?.data?.message || error.message));
    }
    setIsGeneratingPreview(false);
  };

  // Fetch existing drafts
  const fetchDrafts = async () => {
    try {
      const response = await api.get('/ai/autopilot/v2/drafts', {
        params: {
          userId: localStorage.getItem('userId') || 'demo',
          status: 'pending_review',
          limit: 20
        }
      });
      if (response.data.success) {
        setDrafts(response.data.drafts);
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
    }
  };

  // Handle draft approval
  const handleApproveDraft = async (draftId, scheduledFor = null) => {
    setIsApproving(true);
    try {
      const response = await api.post(`/ai/autopilot/v2/drafts/${draftId}/approve`, {
        scheduledFor
      });
      
      if (response.data.success) {
        alert(scheduledFor 
          ? '📅 Content scheduled successfully!' 
          : '✅ Content approved and will be posted!'
        );
        setShowPreviewModal(false);
        setPreviewDraft(null);
        fetchDrafts();
      }
    } catch (error) {
      console.error('Failed to approve draft:', error);
      alert('Failed to approve: ' + (error.response?.data?.message || error.message));
    }
    setIsApproving(false);
  };

  // Handle draft regeneration
  const handleRegenerateDraft = async (draftId) => {
    setIsRegenerating(true);
    try {
      const response = await api.post(`/ai/autopilot/v2/drafts/${draftId}/regenerate`);
      
      if (response.data.success) {
        setPreviewDraft(response.data.draft);
      }
    } catch (error) {
      console.error('Failed to regenerate draft:', error);
      if (error.response?.status === 400) {
        alert('Maximum regenerations reached. Please create a new preview.');
      } else {
        alert('Failed to regenerate: ' + (error.response?.data?.message || error.message));
      }
    }
    setIsRegenerating(false);
  };

  // Handle draft rejection
  const handleRejectDraft = async (draftId) => {
    try {
      await api.post(`/ai/autopilot/v2/drafts/${draftId}/reject`, {
        reason: 'User rejected'
      });
      setShowPreviewModal(false);
      setPreviewDraft(null);
      fetchDrafts();
    } catch (error) {
      console.error('Failed to reject draft:', error);
    }
  };

  // Fetch drafts on mount
  useEffect(() => {
    fetchDrafts();
  }, []);

  return (
    <div className="autopilot-new-page">
      <div className="autopilot-new-container">
        {/* Header */}
        <header className="page-header">
          <div className="header-content">
            <h1>
              <FiCpu className="header-icon" />
              AI Auto-Pilot
            </h1>
            <p>Set up your automated content creation and posting</p>
          </div>
          {drafts.length > 0 && (
            <button 
              className="btn-drafts"
              onClick={() => setShowDrafts(!showDrafts)}
            >
              <FiList />
              {drafts.length} Pending Drafts
            </button>
          )}
        </header>

        {/* Pending Drafts Panel */}
        {showDrafts && drafts.length > 0 && (
          <div className="drafts-panel">
            <h3>Pending Drafts</h3>
            <div className="drafts-list">
              {drafts.map((draft) => (
                <div 
                  key={draft._id} 
                  className="draft-item"
                  onClick={() => {
                    setPreviewDraft(draft);
                    setShowPreviewModal(true);
                  }}
                >
                  <div className="draft-preview">
                    {draft.preview?.thumbnailUrl ? (
                      <img src={draft.preview.thumbnailUrl} alt="Preview" />
                    ) : (
                      <FiImage />
                    )}
                  </div>
                  <div className="draft-info">
                    <span className="draft-type">{draft.contentType?.replace(/_/g, ' ')}</span>
                    <span className="draft-topic">{draft.topic}</span>
                  </div>
                  <FiEye className="view-icon" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">{currentStep > 1 ? <FiCheck /> : '1'}</div>
            <span>Topics</span>
          </div>
          <div className="step-line" />
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">{currentStep > 2 ? <FiCheck /> : '2'}</div>
            <span>Schedule</span>
          </div>
          <div className="step-line" />
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Review</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="step-content">
          {/* Step 1: Topics */}
          {currentStep === 1 && (
            <div className="step-panel">
              <div className="step-header">
                <FiTarget className="step-icon" />
                <div>
                  <h2>Auto Posting Topics</h2>
                  <p>Enter your main topic and we'll automatically generate 8 related topics for diverse content</p>
                </div>
              </div>

              <div className="topics-grid">
                {/* Main Topic */}
                <div className="topic-card main-topic">
                  <label>Main Topic <span className="required">*</span></label>
                  <div className="topic-input-wrapper">
                    <input
                      type="text"
                      value={topics[0]}
                      onChange={(e) => handleFirstTopicChange(e.target.value)}
                      onBlur={handleFirstTopicBlur}
                      placeholder="e.g., Digital Marketing, Fitness Tips, Cooking..."
                      className="topic-input"
                    />
                    {isGeneratingTopics && (
                      <div className="generating-indicator">
                        <FiRefreshCw className="spin" />
                      </div>
                    )}
                  </div>
                  <span className="topic-hint">Enter your main topic and press Tab to auto-generate related topics</span>
                </div>

                {/* Related Topics */}
                {topics.slice(1).map((topic, index) => (
                  <div key={index + 1} className={`topic-card ${topic.trim() ? 'filled' : ''}`}>
                    <label>Topic {index + 2}</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => handleTopicChange(index + 1, e.target.value)}
                      placeholder={isGeneratingTopics ? 'Generating...' : 'Related topic...'}
                      className="topic-input"
                      disabled={isGeneratingTopics}
                    />
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="topics-actions">
                {topics[0].trim() && (
                  <button 
                    className="btn-regenerate"
                    onClick={regenerateTopics}
                    disabled={isGeneratingTopics}
                  >
                    <FiRefreshCw className={isGeneratingTopics ? 'spin' : ''} />
                    More Related Topics
                  </button>
                )}
                <button 
                  className="btn-add-topic"
                  onClick={() => setTopics([...topics, ''])}
                >
                  <FiPlus />
                  Add Topic
                </button>
              </div>

              <div className="topics-counter">
                <span className={filledTopicsCount >= 9 ? 'complete' : ''}>
                  {filledTopicsCount}/9 topics filled
                </span>
                {filledTopicsCount < 9 && (
                  <span className="counter-hint">Minimum 9 topics required for content diversity</span>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Frequency & Settings */}
          {currentStep === 2 && (
            <div className="step-panel">
              <div className="step-header">
                <FiClock className="step-icon" />
                <div>
                  <h2>Post Frequency & Types</h2>
                  <p>How often should we post for you?</p>
                </div>
              </div>

              {/* Frequency Selection */}
              <div className="setting-section">
                <h3>Posting Frequency</h3>
                <div className="frequency-options">
                  <button 
                    className={`frequency-option ${frequency === 'alternate' ? 'active' : ''}`}
                    onClick={() => setFrequency('alternate')}
                  >
                    <FiCalendar />
                    <span>Alternate Days</span>
                  </button>
                  <button 
                    className={`frequency-option ${frequency === 'once' ? 'active' : ''}`}
                    onClick={() => setFrequency('once')}
                  >
                    <span className="frequency-number">1x</span>
                    <span>Once a Day</span>
                  </button>
                  <button 
                    className={`frequency-option ${frequency === 'twice' ? 'active' : ''}`}
                    onClick={() => setFrequency('twice')}
                  >
                    <span className="frequency-number">2x</span>
                    <span>Twice a Day</span>
                  </button>
                  <button 
                    className={`frequency-option ${frequency === 'thrice' ? 'active' : ''}`}
                    onClick={() => setFrequency('thrice')}
                  >
                    <span className="frequency-number">3x</span>
                    <span>Thrice a Day</span>
                  </button>
                </div>
              </div>

              {/* Time Slots */}
              <div className="setting-section">
                <h3>Select Time Slots</h3>
                <p className="setting-hint">
                  Choose {getMaxTimeSlots()} posting time{getMaxTimeSlots() > 1 ? 's' : ''} 
                  <span className="slots-counter"> ({timeSlots.length}/{getMaxTimeSlots()} selected)</span>
                </p>
                <div className="time-slots-grid">
                  {availableTimeSlots.map(time => (
                    <button
                      key={time}
                      className={`time-slot ${timeSlots.includes(time) ? 'active' : ''}`}
                      onClick={() => toggleTimeSlot(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Post Types */}
              <div className="setting-section">
                <h3>Select Post Types</h3>
                <div className="post-types-grid">
                  <button 
                    className={`post-type-card ${postTypes.singleImage ? 'active' : ''}`}
                    onClick={() => togglePostType('singleImage')}
                  >
                    <FiImage className="post-type-icon" />
                    <span>Single Image</span>
                    {postTypes.singleImage && <FiCheck className="check-icon" />}
                  </button>
                  <button 
                    className={`post-type-card ${postTypes.videos ? 'active' : ''}`}
                    onClick={() => togglePostType('videos')}
                  >
                    <FiVideo className="post-type-icon" />
                    <span>Videos</span>
                    {postTypes.videos && <FiCheck className="check-icon" />}
                  </button>
                  <button 
                    className={`post-type-card ${postTypes.voiceoverVideos ? 'active' : ''}`}
                    onClick={() => togglePostType('voiceoverVideos')}
                  >
                    <FiMic className="post-type-icon" />
                    <span>Voice-over Videos</span>
                    {postTypes.voiceoverVideos && <FiCheck className="check-icon" />}
                  </button>
                  <button 
                    className={`post-type-card ${postTypes.carousel ? 'active' : ''}`}
                    onClick={() => togglePostType('carousel')}
                  >
                    <FiLayers className="post-type-icon" />
                    <span>Carousel</span>
                    {postTypes.carousel && <FiCheck className="check-icon" />}
                  </button>
                </div>
              </div>

              {/* Brand Connection */}
              <div className="setting-section">
                <h3>Connect Your Brand</h3>
                
                {connectedBrand ? (
                  <div className="connected-brand-card">
                    <div className="brand-connected-header">
                      <div className="brand-icon">
                        <FiBriefcase />
                      </div>
                      <div className="brand-info">
                        <span className="brand-name">{connectedBrand.businessName}</span>
                        {connectedBrand.industry && (
                          <span className="brand-industry">{connectedBrand.industry}</span>
                        )}
                      </div>
                      <div className="brand-status connected">
                        <FiCheck /> Connected
                      </div>
                    </div>
                    
                    {connectedBrand.description && (
                      <p className="brand-description">{connectedBrand.description.substring(0, 150)}...</p>
                    )}
                    
                    <div className="brand-details-row">
                      {connectedBrand.brandVoice && (
                        <span className="brand-tag">🎯 {connectedBrand.brandVoice}</span>
                      )}
                      {connectedBrand.targetAudience && (
                        <span className="brand-tag">👥 {connectedBrand.targetAudience.substring(0, 30)}</span>
                      )}
                    </div>
                    
                    <div className="brand-actions">
                      <button 
                        className="btn-edit-brand"
                        onClick={() => navigate('/app/business-hub')}
                      >
                        <FiEdit2 /> Edit Brand Details
                      </button>
                      <button 
                        className="btn-disconnect"
                        onClick={() => {
                          setConnectedBrand(null);
                          setBrandDetails({
                            brandName: '',
                            brandDescription: '',
                            targetAudience: '',
                            brandTone: 'professional',
                            callToAction: '',
                            hashtags: '',
                            industry: ''
                          });
                        }}
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="no-brand-connected">
                    <div className="no-brand-icon">
                      <FiLink />
                    </div>
                    <h4>No Brand Connected</h4>
                    <p>Connect your brand to use your business details for AI-generated content</p>
                    
                    <div className="brand-connect-actions">
                      <button 
                        className="btn-connect-brand"
                        onClick={() => {
                          const businessInfo = localStorage.getItem('businessInfo');
                          if (businessInfo) {
                            const parsed = JSON.parse(businessInfo);
                            if (parsed.businessName) {
                              setConnectedBrand(parsed);
                              setBrandDetails(prev => ({
                                ...prev,
                                brandName: parsed.businessName || '',
                                brandDescription: parsed.description || '',
                                targetAudience: parsed.targetAudience || '',
                                brandTone: parsed.brandVoice || 'professional',
                                industry: parsed.industry || ''
                              }));
                            } else {
                              alert('Please set up your brand in Business Hub first');
                              navigate('/app/business-hub');
                            }
                          } else {
                            alert('Please set up your brand in Business Hub first');
                            navigate('/app/business-hub');
                          }
                        }}
                      >
                        <FiLink /> Connect Existing Brand
                      </button>
                      <button 
                        className="btn-setup-brand"
                        onClick={() => navigate('/app/business-hub')}
                      >
                        <FiExternalLink /> Set Up Brand in Business Hub
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Optional: CTA & Hashtags */}
              <div className="setting-section optional-section">
                <h3>Optional Settings</h3>
                <div className="brand-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Call to Action</label>
                      <input
                        type="text"
                        value={brandDetails.callToAction}
                        onChange={(e) => setBrandDetails({...brandDetails, callToAction: e.target.value})}
                        placeholder="e.g., Follow for more tips!"
                      />
                    </div>
                    <div className="form-group">
                      <label>Default Hashtags</label>
                      <input
                        type="text"
                        value={brandDetails.hashtags}
                        onChange={(e) => setBrandDetails({...brandDetails, hashtags: e.target.value})}
                        placeholder="#yourbrand #marketing #tips"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Start */}
          {currentStep === 3 && (
            <div className="step-panel">
              <div className="step-header">
                <FiZap className="step-icon" />
                <div>
                  <h2>Review & Start Auto Posting</h2>
                  <p>Summary of your setup</p>
                </div>
              </div>

              <div className="review-sections">
                {/* Topics Summary */}
                <div className="review-section">
                  <div className="review-header">
                    <h3><FiTarget /> Topics ({filledTopicsCount})</h3>
                    <button className="btn-edit" onClick={() => setCurrentStep(1)}>
                      <FiEdit2 /> Edit
                    </button>
                  </div>
                  <div className="review-topics">
                    {topics.filter(t => t.trim()).map((topic, index) => (
                      <span key={index} className="review-topic-tag">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Schedule Summary */}
                <div className="review-section">
                  <div className="review-header">
                    <h3><FiClock /> Schedule</h3>
                    <button className="btn-edit" onClick={() => setCurrentStep(2)}>
                      <FiEdit2 /> Edit
                    </button>
                  </div>
                  <div className="review-details">
                    <div className="review-item">
                      <span className="review-label">Frequency:</span>
                      <span className="review-value">{getFrequencyLabel()}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Time Slots:</span>
                      <span className="review-value">{timeSlots.join(', ')}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Post Types:</span>
                      <span className="review-value">{getSelectedPostTypes().join(', ')}</span>
                    </div>
                  </div>
                </div>

                {/* Brand Summary */}
                <div className="review-section">
                  <div className="review-header">
                    <h3><FiSettings /> Brand Details</h3>
                    <button className="btn-edit" onClick={() => setCurrentStep(2)}>
                      <FiEdit2 /> Edit
                    </button>
                  </div>
                  <div className="review-details">
                    <div className="review-item">
                      <span className="review-label">Brand:</span>
                      <span className="review-value">{brandDetails.brandName || 'Not set'}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Tone:</span>
                      <span className="review-value" style={{textTransform: 'capitalize'}}>{brandDetails.brandTone}</span>
                    </div>
                    {brandDetails.targetAudience && (
                      <div className="review-item">
                        <span className="review-label">Audience:</span>
                        <span className="review-value">{brandDetails.targetAudience}</span>
                      </div>
                    )}
                    {brandDetails.callToAction && (
                      <div className="review-item">
                        <span className="review-label">CTA:</span>
                        <span className="review-value">{brandDetails.callToAction}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview & Start Buttons */}
                <div className="start-section">
                  {/* Generate Preview Button */}
                  <button 
                    className="btn-generate-preview"
                    onClick={generatePreview}
                    disabled={isGeneratingPreview}
                  >
                    {isGeneratingPreview ? (
                      <>
                        <FiRefreshCw className="spin" />
                        Generating Preview...
                      </>
                    ) : (
                      <>
                        <FiEye />
                        Generate Preview First
                      </>
                    )}
                  </button>
                  <p className="preview-hint">
                    Preview and approve content before enabling auto-posting
                  </p>

                  <div className="divider-with-text">
                    <span>or</span>
                  </div>

                  {/* Start Auto Posting Button */}
                  <button 
                    className="btn-start-posting"
                    onClick={startAutoPosting}
                    disabled={isStarting}
                  >
                    {isStarting ? (
                      <>
                        <FiRefreshCw className="spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <FiPlay />
                        Start Auto Posting (Skip Preview)
                      </>
                    )}
                  </button>
                  <p className="start-hint">
                    AI will create and post content automatically without preview
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="step-navigation">
          {currentStep > 1 && (
            <button 
              className="btn-nav btn-prev"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              <FiChevronLeft />
              Previous
            </button>
          )}
          <div className="nav-spacer" />
          {currentStep < 3 && (
            <button 
              className="btn-nav btn-next"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!isStepValid()}
            >
              Next
              <FiChevronRight />
            </button>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <AutoPilotPreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewDraft(null);
        }}
        draft={previewDraft}
        onApprove={handleApproveDraft}
        onRegenerate={handleRegenerateDraft}
        onReject={handleRejectDraft}
        isApproving={isApproving}
        isRegenerating={isRegenerating}
      />
    </div>
  );
};

export default AutoPilotNew;
