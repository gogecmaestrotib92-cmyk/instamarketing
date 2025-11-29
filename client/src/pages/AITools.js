import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { 
  FiEdit3, 
  FiHash, 
  FiMessageSquare, 
  FiMic, 
  FiPlay,
  FiCopy,
  FiRefreshCw,
  FiZap,
  FiFileText,
  FiSun,
  FiVolume2,
  FiVideo,
  FiDownload
} from 'react-icons/fi';
import { FaRobot, FaWandMagicSparkles } from 'react-icons/fa6';
import SEO from '../components/SEO';
import api from '../services/api';
import './AITools.css';

const AITools = () => {
  const [activeTab, setActiveTab] = useState('caption');
  const [loading, setLoading] = useState(false);
  
  // Caption generator state
  const [captionTopic, setCaptionTopic] = useState('');
  const [captionTone, setCaptionTone] = useState('engaging');
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [generatedCaption, setGeneratedCaption] = useState('');
  
  // Hashtag generator state
  const [hashtagTopic, setHashtagTopic] = useState('');
  const [generatedHashtags, setGeneratedHashtags] = useState([]);
  
  // Script generator state
  const [scriptTopic, setScriptTopic] = useState('');
  const [scriptDuration, setScriptDuration] = useState(30);
  const [generatedScript, setGeneratedScript] = useState('');
  
  // Ideas generator state
  const [ideasNiche, setIdeasNiche] = useState('');
  const [generatedIdeas, setGeneratedIdeas] = useState([]);
  
  // TTS state
  const [ttsText, setTtsText] = useState('');
  const [voiceStyle, setVoiceStyle] = useState('energetic');
  const [audioUrl, setAudioUrl] = useState('');
  
  // Chat state
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  // Video generator state
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [videoPredictionId, setVideoPredictionId] = useState('');
  const [videoStatus, setVideoStatus] = useState('');
  const [videoLoading, setVideoLoading] = useState(false);

  // Reel Creator state
  const [reelTopic, setReelTopic] = useState('');
  const [reelVideoPrompt, setReelVideoPrompt] = useState('');
  const [reelVoiceStyle, setReelVoiceStyle] = useState('energetic');
  const [reelTextOverlay, setReelTextOverlay] = useState('');
  const [reelScript, setReelScript] = useState('');
  const [reelAudioUrl, setReelAudioUrl] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [reelVideoUrl, setReelVideoUrl] = useState('');
  const [reelFinalUrl, setReelFinalUrl] = useState('');
  const [reelStatus, setReelStatus] = useState('');
  const [reelLoading, setReelLoading] = useState(false);
  const [reelStep, setReelStep] = useState(0);

  const handleGenerateCaption = async () => {
    if (!captionTopic.trim()) {
      toast.error('Enter a topic for caption');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/ai/caption', {
        topic: captionTopic,
        tone: captionTone,
        includeEmojis,
        includeHashtags
      });
      setGeneratedCaption(response.data.caption);
      toast.success('Caption generated! ✨');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error generating');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHashtags = async () => {
    if (!hashtagTopic.trim()) {
      toast.error('Enter a topic for hashtags');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/ai/hashtags', {
        topic: hashtagTopic,
        count: 20
      });
      setGeneratedHashtags(response.data.hashtags);
      toast.success('Hashtags generated! #️⃣');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error generating');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!scriptTopic.trim()) {
      toast.error('Enter a topic for script');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/ai/script', {
        topic: scriptTopic,
        duration: scriptDuration
      });
      setGeneratedScript(response.data.script);
      toast.success('Script generated! 🎬');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error generating');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateIdeas = async () => {
    if (!ideasNiche.trim()) {
      toast.error('Enter your niche');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/ai/ideas', {
        niche: ideasNiche,
        count: 5
      });
      setGeneratedIdeas(response.data.ideas);
      toast.success('Ideas generated! 💡');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error generating');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVoiceover = async () => {
    if (!ttsText.trim()) {
      toast.error('Enter text for voiceover');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/ai/voiceover', {
        script: ttsText,
        style: voiceStyle
      });
      setAudioUrl(response.data.audioUrl);
      toast.success('Voiceover generated! 🎤');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error generating');
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;
    
    const userMessage = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    
    setLoading(true);
    try {
      const response = await api.post('/ai/chat', {
        message: userMessage,
        history: chatHistory
      });
      setChatHistory(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Chat error');
    } finally {
      setLoading(false);
    }
  };

  // Video generation handler - async with polling
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) {
      toast.error('Enter a description for the video');
      return;
    }
    
    setVideoLoading(true);
    setVideoStatus('Starting generation...');
    setVideoUrl('');
    
    try {
      // Start async generation
      const startResponse = await api.post('/ai/video/start', {
        prompt: videoPrompt,
        numFrames: 16,
        fps: 8
      });
      
      if (!startResponse.data.success) {
        throw new Error(startResponse.data.error);
      }
      
      const predictionId = startResponse.data.predictionId;
      setVideoPredictionId(predictionId);
      setVideoStatus('Video is generating... (may take 1-3 min)');
      toast.info('Video generation started! ⏳');
      
      // Poll for status
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max
      
      const pollStatus = async () => {
        if (attempts >= maxAttempts) {
          setVideoStatus('Timeout - please try again');
          setVideoLoading(false);
          return;
        }
        
        attempts++;
        
        try {
          const statusResponse = await api.get(`/ai/video/status/${predictionId}`);
          const status = statusResponse.data;
          
          if (status.status === 'succeeded') {
            setVideoUrl(status.output);
            setVideoStatus('Video generated successfully! 🎉');
            setVideoLoading(false);
            toast.success('Video is ready! 🎬');
          } else if (status.status === 'failed') {
            setVideoStatus('Error: ' + (status.error || 'Video generation failed'));
            setVideoLoading(false);
            toast.error('Video generation failed');
          } else {
            setVideoStatus(`Status: ${status.status} (${attempts}/${maxAttempts})`);
            setTimeout(pollStatus, 5000); // Poll every 5 seconds
          }
        } catch (err) {
          console.error('Poll error:', err);
          setTimeout(pollStatus, 5000);
        }
      };
      
      // Start polling after 5 seconds
      setTimeout(pollStatus, 5000);
      
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setVideoStatus('Error: ' + errorMsg);
      toast.error(errorMsg);
      setVideoLoading(false);
    }
  };

  // Reel Creator - Full workflow
  const handleCreateReel = async () => {
    if (!reelTopic.trim() && !reelVideoPrompt.trim()) {
      toast.error('Enter a topic or video description');
      return;
    }

    setReelLoading(true);
    setReelStep(1);
    setReelStatus('Step 1/4: Generating script...');
    setReelScript('');
    setReelAudioUrl('');
    setReelVideoUrl('');
    setReelFinalUrl('');

    try {
      // Step 1: Start reel creation
      const response = await api.post('/ai/reel/create', {
        topic: reelTopic,
        videoPrompt: reelVideoPrompt || undefined,
        voiceStyle: reelVoiceStyle,
        textOverlay: reelTextOverlay || undefined
      });

      if (response.data.script) {
        setReelScript(response.data.script);
        setReelStep(2);
        setReelStatus('Step 2/4: Voiceover generated!');
      }

      if (response.data.audioUrl) {
        setReelAudioUrl(response.data.audioUrl);
      }

      const predictionId = response.data.videoPredictionId;
      if (!predictionId) {
        throw new Error('Video generation failed to start');
      }

      setReelStep(3);
      setReelStatus('Step 3/4: Video is generating... (1-3 min)');
      toast.info('Reel creation in progress! ⏳');

      // Poll for video completion
      let attempts = 0;
      const maxAttempts = 60;

      const pollVideo = async () => {
        if (attempts >= maxAttempts) {
          setReelStatus('Timeout - please try again');
          setReelLoading(false);
          return;
        }

        attempts++;
        
        try {
          const statusResponse = await api.get(`/ai/video/status/${predictionId}`);
          const status = statusResponse.data;

          if (status.status === 'succeeded') {
            setReelVideoUrl(status.output);
            setReelStep(4);
            setReelStatus('Step 4/4: Combining video + audio + text...');

            // Finalize reel - combine video + audio + text
            try {
              const finalResponse = await api.post('/ai/reel/finalize', {
                videoUrl: status.output,
                audioUrl: response.data.audioUrl,
                text: reelTextOverlay || response.data.script?.substring(0, 40),
                textPosition: 'bottom'
              });

              if (finalResponse.data.success) {
                // Shotstack returns full URL, FFmpeg returns relative path
                const finalUrl = finalResponse.data.videoUrl.startsWith('http') 
                  ? finalResponse.data.videoUrl 
                  : `${process.env.REACT_APP_API_URL || ''}${finalResponse.data.videoUrl}`;
                setReelFinalUrl(finalUrl);
                setReelStatus('✅ Reel ready for posting!');
                toast.success('Reel is ready! 🎬🎉');
              } else {
                // If composition fails, still show the video without audio/text
                setReelFinalUrl(status.output);
                setReelStatus('Video ready (without audio/text overlay)');
              }
            } catch (composeErr) {
              console.error('Compose error:', composeErr);
              setReelFinalUrl(status.output);
              setReelStatus('Video ready (composition failed)');
            }
            
            setReelLoading(false);
          } else if (status.status === 'failed') {
            setReelStatus('Error: Video generation failed');
            setReelLoading(false);
            toast.error('Video generation failed');
          } else {
            setReelStatus(`Step 3/4: Video is generating... (${attempts}/${maxAttempts})`);
            setTimeout(pollVideo, 5000);
          }
        } catch (err) {
          console.error('Poll error:', err);
          setTimeout(pollVideo, 5000);
        }
      };

      setTimeout(pollVideo, 5000);

    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setReelStatus('Error: ' + errorMsg);
      toast.error(errorMsg);
      setReelLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied! 📋');
  };

  const tabs = [
    { id: 'caption', icon: FiEdit3, label: 'Caption' },
    { id: 'hashtags', icon: FiHash, label: 'Hashtags' },
    { id: 'script', icon: FiFileText, label: 'Script' },
    { id: 'ideas', icon: FiSun, label: 'Ideas' },
    { id: 'reel', icon: FiPlay, label: '🎬 Reel Creator' },
    { id: 'video', icon: FiVideo, label: 'AI Video' },
    { id: 'voiceover', icon: FiMic, label: 'Voiceover' },
    { id: 'chat', icon: FiMessageSquare, label: 'AI Chat' }
  ];

  return (
    <main className="ai-tools-page">
      <SEO 
        title="AI Tools for Instagram"
        description="Use artificial intelligence to create Instagram content. AI Caption generator, hashtag suggestions, reel scripts, AI video generation and voiceover. Best AI tools for Instagram marketing."
        keywords="AI instagram, caption generator, hashtag generator, AI video, voiceover, reel scripts, AI marketing, instagram AI tools"
        url="/ai-tools"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'AI Tools', url: '/ai-tools' }
        ]}
        faq={[
          {
            question: 'How does AI content generation work?',
            answer: 'Our AI tools use advanced artificial intelligence models (GPT-4) to generate captions, hashtags, video scripts, and even video content based on your instructions.'
          },
          {
            question: 'Is AI content unique?',
            answer: 'Yes, each generated content is completely unique and created specifically for your needs based on the topic and tone you choose.'
          },
          {
            question: 'How many hashtags can I generate?',
            answer: 'You can generate unlimited hashtags. AI analyzes your topic and suggests the most relevant hashtags for maximum reach.'
          }
        ]}
      />

      <header className="page-header">
        <div>
          <h1><FaRobot aria-hidden="true" /> AI Tools</h1>
          <p>Generate content with AI - captions, hashtags, scripts and voiceover</p>
        </div>
      </header>

      <nav className="ai-tabs" aria-label="AI Tools navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`ai-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <tab.icon aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <section className="ai-content">
        {/* Caption Generator */}
        {activeTab === 'caption' && (
          <article className="ai-section" aria-labelledby="caption-heading">
            <h2 id="caption-heading"><FiEdit3 aria-hidden="true" /> Caption Generator</h2>
            <p>Generate engaging captions for your posts</p>
            
            <div className="form-group">
              <label htmlFor="captionTopic">Topic / Post Description</label>
              <textarea
                id="captionTopic"
                value={captionTopic}
                onChange={(e) => setCaptionTopic(e.target.value)}
                placeholder="E.g.: New skincare product, natural ingredients, perfect for winter..."
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="captionTone">Tone</label>
                <select id="captionTone" value={captionTone} onChange={(e) => setCaptionTone(e.target.value)}>
                  <option value="engaging">Engaging</option>
                  <option value="professional">Professional</option>
                  <option value="funny">Funny</option>
                  <option value="inspirational">Inspirational</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={includeEmojis} 
                    onChange={(e) => setIncludeEmojis(e.target.checked)} 
                  />
                  Include emojis
                </label>
                <label>
                  <input 
                    type="checkbox" 
                    checked={includeHashtags} 
                    onChange={(e) => setIncludeHashtags(e.target.checked)} 
                  />
                  Include hashtags
                </label>
              </div>
            </div>

            <button 
              className="generate-btn" 
              onClick={handleGenerateCaption}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? <FiRefreshCw className="spin" aria-hidden="true" /> : <FaWandMagicSparkles aria-hidden="true" />}
              {loading ? 'Generating...' : 'Generate Caption'}
            </button>

            {generatedCaption && (
              <div className="result-box" aria-live="polite">
                <div className="result-header">
                  <h3>Generated Caption</h3>
                  <button onClick={() => copyToClipboard(generatedCaption)} aria-label="Copy caption">
                    <FiCopy aria-hidden="true" /> Copy
                  </button>
                </div>
                <div className="result-content">
                  {generatedCaption}
                </div>
              </div>
            )}
          </article>
        )}

        {/* Hashtag Generator */}
        {activeTab === 'hashtags' && (
          <article className="ai-section" aria-labelledby="hashtag-heading">
            <h2 id="hashtag-heading"><FiHash aria-hidden="true" /> Hashtag Generator</h2>
            <p>Generate relevant hashtags for greater reach</p>
            
            <div className="form-group">
              <label htmlFor="hashtagTopic">Topic</label>
              <input
                id="hashtagTopic"
                type="text"
                value={hashtagTopic}
                onChange={(e) => setHashtagTopic(e.target.value)}
                placeholder="E.g.: fitness, health, home workouts"
              />
            </div>

            <button 
              className="generate-btn" 
              onClick={handleGenerateHashtags}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? <FiRefreshCw className="spin" aria-hidden="true" /> : <FiHash aria-hidden="true" />}
              {loading ? 'Generating...' : 'Generate Hashtags'}
            </button>

            {generatedHashtags.length > 0 && (
              <div className="result-box" aria-live="polite">
                <div className="result-header">
                  <h3>Generated Hashtags</h3>
                  <button onClick={() => copyToClipboard(generatedHashtags.join(' '))} aria-label="Copy all hashtags">
                    <FiCopy aria-hidden="true" /> Copy all
                  </button>
                </div>
                <div className="hashtags-grid">
                  {generatedHashtags.map((tag, i) => (
                    <button 
                      key={i} 
                      className="hashtag-chip"
                      onClick={() => copyToClipboard(tag)}
                      aria-label={`Copy hashtag ${tag}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </article>
        )}

        {/* Script Generator */}
        {activeTab === 'script' && (
          <article className="ai-section" aria-labelledby="script-heading">
            <h2 id="script-heading"><FiFileText aria-hidden="true" /> Reel Script Generator</h2>
            <p>Generate scripts for viral Reels</p>
            
            <div className="form-group">
              <label htmlFor="scriptTopic">Reel Topic</label>
              <textarea
                id="scriptTopic"
                value={scriptTopic}
                onChange={(e) => setScriptTopic(e.target.value)}
                placeholder="E.g.: 5 productivity tips, morning routine, how to make money online..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="scriptDuration">Duration (seconds)</label>
              <select id="scriptDuration" value={scriptDuration} onChange={(e) => setScriptDuration(Number(e.target.value))}>
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
                <option value={90}>90 seconds</option>
              </select>
            </div>

            <button 
              className="generate-btn" 
              onClick={handleGenerateScript}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? <FiRefreshCw className="spin" aria-hidden="true" /> : <FiZap aria-hidden="true" />}
              {loading ? 'Generating...' : 'Generate Script'}
            </button>

            {generatedScript && (
              <div className="result-box" aria-live="polite">
                <div className="result-header">
                  <h3>Generated Script</h3>
                  <button onClick={() => copyToClipboard(generatedScript)} aria-label="Copy script">
                    <FiCopy aria-hidden="true" /> Copy
                  </button>
                </div>
                <div className="result-content script-content">
                  {generatedScript}
                </div>
              </div>
            )}
          </article>
        )}

        {/* Ideas Generator */}
        {activeTab === 'ideas' && (
          <article className="ai-section" aria-labelledby="ideas-heading">
            <h2 id="ideas-heading"><FiSun aria-hidden="true" /> Content Ideas</h2>
            <p>Get creative content ideas for your niche</p>
            
            <div className="form-group">
              <label htmlFor="ideasNiche">Your Niche</label>
              <input
                id="ideasNiche"
                type="text"
                value={ideasNiche}
                onChange={(e) => setIdeasNiche(e.target.value)}
                placeholder="E.g.: fitness, fashion, technology, food, travel..."
              />
            </div>

            <button 
              className="generate-btn" 
              onClick={handleGenerateIdeas}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? <FiRefreshCw className="spin" aria-hidden="true" /> : <FiSun aria-hidden="true" />}
              {loading ? 'Generating...' : 'Generate Ideas'}
            </button>

            {generatedIdeas.length > 0 && (
              <div className="ideas-list" aria-live="polite">
                {generatedIdeas.map((idea, i) => (
                  <div key={i} className="idea-card">
                    <div className="idea-type">{idea.type || 'Post'}</div>
                    <h3>{idea.title}</h3>
                    <p>{idea.description}</p>
                    {idea.hook && <div className="idea-hook">🎣 Hook: {idea.hook}</div>}
                  </div>
                ))}
              </div>
            )}
          </article>
        )}

        {/* 🎬 Reel Creator - Full Workflow */}
        {activeTab === 'reel' && (
          <article className="ai-section reel-creator" aria-labelledby="reel-heading">
            <h2 id="reel-heading"><FiPlay aria-hidden="true" /> 🎬 Reel Creator</h2>
            <p>Create a complete Reel with AI video, voiceover and text!</p>
            
            <div className="reel-workflow-info" aria-label="Reel creation progress">
              <div className={`workflow-step ${reelStep >= 1 ? 'active' : ''} ${reelStep > 1 ? 'done' : ''}`}>
                <span className="step-number">1</span>
                <span className="step-label">Script</span>
              </div>
              <div className={`workflow-step ${reelStep >= 2 ? 'active' : ''} ${reelStep > 2 ? 'done' : ''}`}>
                <span className="step-number">2</span>
                <span className="step-label">Voiceover</span>
              </div>
              <div className={`workflow-step ${reelStep >= 3 ? 'active' : ''} ${reelStep > 3 ? 'done' : ''}`}>
                <span className="step-number">3</span>
                <span className="step-label">Video</span>
              </div>
              <div className={`workflow-step ${reelStep >= 4 ? 'active' : ''}`}>
                <span className="step-number">4</span>
                <span className="step-label">Final</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reelTopic">Reel Topic (for script and voiceover)</label>
              <input
                id="reelTopic"
                type="text"
                value={reelTopic}
                onChange={(e) => setReelTopic(e.target.value)}
                placeholder="E.g.: 5 productivity tips, Morning routine, Fitness motivation..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="reelVideoPrompt">Video Prompt (scene description - English recommended)</label>
              <textarea
                id="reelVideoPrompt"
                value={reelVideoPrompt}
                onChange={(e) => setReelVideoPrompt(e.target.value)}
                placeholder="E.g.: Person working on laptop in modern office, morning light, cinematic..."
                rows={2}
              />
              <small>If left empty, it will be automatically generated based on the topic</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reelVoiceStyle">Voice Style</label>
                <select id="reelVoiceStyle" value={reelVoiceStyle} onChange={(e) => setReelVoiceStyle(e.target.value)}>
                  <option value="energetic">Energetic</option>
                  <option value="calm">Calm</option>
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="reelTextOverlay">Text overlay (optional)</label>
                <input
                  id="reelTextOverlay"
                  type="text"
                  value={reelTextOverlay}
                  onChange={(e) => setReelTextOverlay(e.target.value)}
                  placeholder="Text to display on the video"
                />
              </div>
            </div>

            <button 
              className="generate-btn reel-btn" 
              onClick={handleCreateReel}
              disabled={reelLoading}
              aria-busy={reelLoading}
            >
              {reelLoading ? <FiRefreshCw className="spin" aria-hidden="true" /> : <FaWandMagicSparkles aria-hidden="true" />}
              {reelLoading ? 'Creating...' : '✨ Create Reel'}
            </button>

            {reelStatus && (
              <div className={`status-box ${reelFinalUrl ? 'success' : reelLoading ? 'loading' : 'info'}`} aria-live="polite">
                <p>{reelStatus}</p>
              </div>
            )}

            {/* Show progress */}
            {reelScript && (
              <div className="reel-progress-item">
                <h4>📝 Generated Script:</h4>
                <p>{reelScript}</p>
                <button className="copy-btn small" onClick={() => copyToClipboard(reelScript)} aria-label="Copy script">
                  <FiCopy aria-hidden="true" /> Copy
                </button>
              </div>
            )}

            {reelAudioUrl && (
              <div className="reel-progress-item">
                <h4>🎤 Voiceover:</h4>
                <audio src={reelAudioUrl} controls />
              </div>
            )}

            {/* Final Result */}
            {reelFinalUrl && (
              <div className="video-result reel-result">
                <h3>🎬 Your Reel is ready!</h3>
                <video 
                  src={reelFinalUrl} 
                  controls 
                  autoPlay 
                  loop 
                  className="generated-video"
                />
                <div className="video-actions">
                  <a 
                    href={reelFinalUrl} 
                    download="reel.mp4" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="download-btn"
                    aria-label="Download Reel"
                  >
                    <FiDownload aria-hidden="true" /> Download Reel
                  </a>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(reelFinalUrl)}
                    aria-label="Copy Reel URL"
                  >
                    <FiCopy aria-hidden="true" /> Copy URL
                  </button>
                </div>
              </div>
            )}
          </article>
        )}

        {/* AI Video Generator */}
        {activeTab === 'video' && (
          <article className="ai-section" aria-labelledby="video-heading">
            <h2 id="video-heading"><FiVideo aria-hidden="true" /> AI Video Generator</h2>
            <p>Generate short video clips with AI - perfect for Reels!</p>
            
            <div className="form-group">
              <label htmlFor="videoPrompt">Video Description (English gives better results)</label>
              <textarea
                id="videoPrompt"
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="E.g.: A beautiful sunset over the ocean with gentle waves, cinematic, 4K quality"
                rows={3}
              />
            </div>

            <div className="info-box">
              <p>💡 <strong>Tips for better results:</strong></p>
              <ul>
                <li>Use English for descriptions</li>
                <li>Be as detailed as possible describing the scene</li>
                <li>Add style: "cinematic", "4K", "slow motion"</li>
                <li>Generation takes 1-3 minutes</li>
              </ul>
            </div>

            <button 
              className="generate-btn" 
              onClick={handleGenerateVideo}
              disabled={videoLoading}
              aria-busy={videoLoading}
            >
              {videoLoading ? <FiRefreshCw className="spin" aria-hidden="true" /> : <FiVideo aria-hidden="true" />}
              {videoLoading ? 'Generating...' : 'Generate Video'}
            </button>

            {videoStatus && (
              <div className={`status-box ${videoUrl ? 'success' : videoLoading ? 'loading' : 'error'}`} aria-live="polite">
                <p>{videoStatus}</p>
              </div>
            )}

            {videoUrl && (
              <div className="video-result">
                <video 
                  src={videoUrl} 
                  controls 
                  autoPlay 
                  loop 
                  className="generated-video"
                />
                <div className="video-actions">
                  <a 
                    href={videoUrl} 
                    download="ai-video.mp4" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="download-btn"
                    aria-label="Download video"
                  >
                    <FiDownload aria-hidden="true" /> Download Video
                  </a>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(videoUrl)}
                    aria-label="Copy video URL"
                  >
                    <FiCopy aria-hidden="true" /> Copy URL
                  </button>
                </div>
              </div>
            )}
          </article>
        )}

        {/* Voiceover Generator */}
        {activeTab === 'voiceover' && (
          <article className="ai-section" aria-labelledby="voiceover-heading">
            <h2 id="voiceover-heading"><FiMic aria-hidden="true" /> Voiceover Generator</h2>
            <p>Convert text to natural speech for Reels</p>
            
            <div className="form-group">
              <label htmlFor="ttsText">Text for voiceover</label>
              <textarea
                id="ttsText"
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                placeholder="Enter the text you want to convert to speech..."
                rows={5}
              />
              <small>{ttsText.length}/5000 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="voiceStyle">Voice Style</label>
              <select id="voiceStyle" value={voiceStyle} onChange={(e) => setVoiceStyle(e.target.value)}>
                <option value="energetic">Energetic (for Reels)</option>
                <option value="calm">Calm</option>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
              </select>
            </div>

            <button 
              className="generate-btn" 
              onClick={handleGenerateVoiceover}
              disabled={loading || !ttsText.trim()}
              aria-busy={loading}
            >
              {loading ? <FiRefreshCw className="spin" aria-hidden="true" /> : <FiVolume2 aria-hidden="true" />}
              {loading ? 'Generating...' : 'Generate Voiceover'}
            </button>

            {audioUrl && (
              <div className="result-box audio-result">
                <h3>Generated Audio</h3>
                <audio controls src={`http://localhost:5000${audioUrl}`}>
                  Your browser does not support the audio element.
                </audio>
                <a 
                  href={`http://localhost:5000${audioUrl}`} 
                  download 
                  className="download-btn"
                  aria-label="Download MP3"
                >
                  <FiPlay aria-hidden="true" /> Download MP3
                </a>
              </div>
            )}
          </article>
        )}

        {/* AI Chat */}
        {activeTab === 'chat' && (
          <article className="ai-section chat-section" aria-labelledby="chat-heading">
            <h2 id="chat-heading"><FiMessageSquare aria-hidden="true" /> AI Marketing Assistant</h2>
            <p>Ask AI for Instagram marketing advice</p>
            
            <div className="chat-container">
              <div className="chat-messages" aria-live="polite">
                {chatHistory.length === 0 && (
                  <div className="chat-welcome">
                    <FaRobot size={48} aria-hidden="true" />
                    <h3>Hello! 👋</h3>
                    <p>I'm your AI marketing assistant. Ask me anything about:</p>
                    <ul>
                      <li>📝 Content strategy</li>
                      <li>📈 Follower growth</li>
                      <li>#️⃣ Hashtag strategy</li>
                      <li>🎬 Ideas for Reels</li>
                      <li>💡 Engagement tips</li>
                    </ul>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`chat-message ${msg.role}`}>
                    <div className="message-content">{msg.content}</div>
                  </div>
                ))}
                {loading && (
                  <div className="chat-message assistant">
                    <div className="message-content typing">
                      <span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>
                      <span className="sr-only">AI is typing...</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="chat-input">
                <label htmlFor="chatMessage" className="sr-only">Your message</label>
                <input
                  id="chatMessage"
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ask something..."
                  onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                />
                <button onClick={handleChat} disabled={loading || !chatMessage.trim()} aria-label="Send message">
                  <FiZap aria-hidden="true" />
                </button>
              </div>
            </div>
          </article>
        )}
      </section>
    </main>
  );
};

export default AITools;
