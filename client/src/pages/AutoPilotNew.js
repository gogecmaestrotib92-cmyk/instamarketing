import React, { useState, useEffect } from 'react';
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
  FiPlus
} from 'react-icons/fi';
import api from '../services/api';
import './AutoPilotNew.css';

const AutoPilotNew = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  
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
  
  // Step 3: Brand Details
  const [brandDetails, setBrandDetails] = useState({
    brandName: '',
    brandDescription: '',
    targetAudience: '',
    brandTone: 'professional',
    callToAction: '',
    hashtags: ''
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

  // Toggle time slot
  const toggleTimeSlot = (time) => {
    if (timeSlots.includes(time)) {
      if (timeSlots.length > 1) {
        setTimeSlots(timeSlots.filter(t => t !== time));
      }
    } else {
      setTimeSlots([...timeSlots, time].sort());
    }
  };

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
        return timeSlots.length > 0 && Object.values(postTypes).some(v => v);
      case 3:
        return brandDetails.brandName.trim() !== '';
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
        </header>

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
                <p className="setting-hint">Choose preferred posting times</p>
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

              {/* Brand Details */}
              <div className="setting-section">
                <h3>Brand Details</h3>
                <div className="brand-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Brand/Business Name <span className="required">*</span></label>
                      <input
                        type="text"
                        value={brandDetails.brandName}
                        onChange={(e) => setBrandDetails({...brandDetails, brandName: e.target.value})}
                        placeholder="Your brand name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Brand Tone</label>
                      <select
                        value={brandDetails.brandTone}
                        onChange={(e) => setBrandDetails({...brandDetails, brandTone: e.target.value})}
                      >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual & Friendly</option>
                        <option value="humorous">Humorous</option>
                        <option value="inspirational">Inspirational</option>
                        <option value="educational">Educational</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Brand Description</label>
                    <textarea
                      value={brandDetails.brandDescription}
                      onChange={(e) => setBrandDetails({...brandDetails, brandDescription: e.target.value})}
                      placeholder="Brief description of your brand/product..."
                      rows={2}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Target Audience</label>
                      <input
                        type="text"
                        value={brandDetails.targetAudience}
                        onChange={(e) => setBrandDetails({...brandDetails, targetAudience: e.target.value})}
                        placeholder="e.g., entrepreneurs, fitness enthusiasts..."
                      />
                    </div>
                    <div className="form-group">
                      <label>Call to Action</label>
                      <input
                        type="text"
                        value={brandDetails.callToAction}
                        onChange={(e) => setBrandDetails({...brandDetails, callToAction: e.target.value})}
                        placeholder="e.g., Follow for more tips!"
                      />
                    </div>
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

                {/* Start Button */}
                <div className="start-section">
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
                        Start Auto Posting
                      </>
                    )}
                  </button>
                  <p className="start-hint">
                    AI will create and schedule content automatically based on your settings
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
    </div>
  );
};

export default AutoPilotNew;
