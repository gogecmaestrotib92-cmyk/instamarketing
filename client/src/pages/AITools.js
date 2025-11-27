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
  const [reelVideoUrl, setReelVideoUrl] = useState('');
  const [reelFinalUrl, setReelFinalUrl] = useState('');
  const [reelStatus, setReelStatus] = useState('');
  const [reelLoading, setReelLoading] = useState(false);
  const [reelStep, setReelStep] = useState(0);

  const handleGenerateCaption = async () => {
    if (!captionTopic.trim()) {
      toast.error('Unesite temu za caption');
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
      toast.success('Caption generisan! ✨');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Greška pri generisanju');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHashtags = async () => {
    if (!hashtagTopic.trim()) {
      toast.error('Unesite temu za hashtag-ove');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/ai/hashtags', {
        topic: hashtagTopic,
        count: 20
      });
      setGeneratedHashtags(response.data.hashtags);
      toast.success('Hashtag-ovi generisani! #️⃣');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Greška pri generisanju');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!scriptTopic.trim()) {
      toast.error('Unesite temu za script');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/ai/script', {
        topic: scriptTopic,
        duration: scriptDuration
      });
      setGeneratedScript(response.data.script);
      toast.success('Script generisan! 🎬');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Greška pri generisanju');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateIdeas = async () => {
    if (!ideasNiche.trim()) {
      toast.error('Unesite vašu nišu');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/ai/ideas', {
        niche: ideasNiche,
        count: 5
      });
      setGeneratedIdeas(response.data.ideas);
      toast.success('Ideje generisane! 💡');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Greška pri generisanju');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVoiceover = async () => {
    if (!ttsText.trim()) {
      toast.error('Unesite tekst za voiceover');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/ai/voiceover', {
        script: ttsText,
        style: voiceStyle
      });
      setAudioUrl(response.data.audioUrl);
      toast.success('Voiceover generisan! 🎤');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Greška pri generisanju');
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
      toast.error(error.response?.data?.error || 'Greška u chatu');
    } finally {
      setLoading(false);
    }
  };

  // Video generation handler - async with polling
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) {
      toast.error('Unesite opis za video');
      return;
    }
    
    setVideoLoading(true);
    setVideoStatus('Pokrećem generisanje...');
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
      setVideoStatus('Video se generiše... (može trajati 1-3 min)');
      toast.info('Video generisanje pokrenuto! ⏳');
      
      // Poll for status
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max
      
      const pollStatus = async () => {
        if (attempts >= maxAttempts) {
          setVideoStatus('Timeout - pokušajte ponovo');
          setVideoLoading(false);
          return;
        }
        
        attempts++;
        
        try {
          const statusResponse = await api.get(`/ai/video/status/${predictionId}`);
          const status = statusResponse.data;
          
          if (status.status === 'succeeded') {
            setVideoUrl(status.output);
            setVideoStatus('Video uspešno generisan! 🎉');
            setVideoLoading(false);
            toast.success('Video je spreman! 🎬');
          } else if (status.status === 'failed') {
            setVideoStatus('Greška: ' + (status.error || 'Video generisanje nije uspelo'));
            setVideoLoading(false);
            toast.error('Video generisanje nije uspelo');
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
      setVideoStatus('Greška: ' + errorMsg);
      toast.error(errorMsg);
      setVideoLoading(false);
    }
  };

  // Reel Creator - Full workflow
  const handleCreateReel = async () => {
    if (!reelTopic.trim() && !reelVideoPrompt.trim()) {
      toast.error('Unesite temu ili opis videa');
      return;
    }

    setReelLoading(true);
    setReelStep(1);
    setReelStatus('Korak 1/4: Generisanje skripte...');
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
        setReelStatus('Korak 2/4: Voiceover generisan!');
      }

      if (response.data.audioUrl) {
        setReelAudioUrl(response.data.audioUrl);
      }

      const predictionId = response.data.videoPredictionId;
      if (!predictionId) {
        throw new Error('Video generation failed to start');
      }

      setReelStep(3);
      setReelStatus('Korak 3/4: Video se generiše... (1-3 min)');
      toast.info('Reel kreiranje u toku! ⏳');

      // Poll for video completion
      let attempts = 0;
      const maxAttempts = 60;

      const pollVideo = async () => {
        if (attempts >= maxAttempts) {
          setReelStatus('Timeout - pokušajte ponovo');
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
            setReelStatus('Korak 4/4: Kombinovanje video + audio + tekst...');

            // Finalize reel - combine video + audio + text
            try {
              const finalResponse = await api.post('/ai/reel/finalize', {
                videoUrl: status.output,
                audioUrl: response.data.audioUrl,
                text: reelTextOverlay || response.data.script?.substring(0, 40),
                textPosition: 'bottom'
              });

              if (finalResponse.data.success) {
                setReelFinalUrl(`http://localhost:5000${finalResponse.data.videoUrl}`);
                setReelStatus('✅ Reel spreman za objavljivanje!');
                toast.success('Reel je spreman! 🎬🎉');
              } else {
                // If composition fails, still show the video without audio/text
                setReelFinalUrl(status.output);
                setReelStatus('Video spreman (bez audio/tekst overlay)');
              }
            } catch (composeErr) {
              console.error('Compose error:', composeErr);
              setReelFinalUrl(status.output);
              setReelStatus('Video spreman (kompozicija nije uspela)');
            }
            
            setReelLoading(false);
          } else if (status.status === 'failed') {
            setReelStatus('Greška: Video generisanje nije uspelo');
            setReelLoading(false);
            toast.error('Video generisanje nije uspelo');
          } else {
            setReelStatus(`Korak 3/4: Video se generiše... (${attempts}/${maxAttempts})`);
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
      setReelStatus('Greška: ' + errorMsg);
      toast.error(errorMsg);
      setReelLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Kopirano! 📋');
  };

  const tabs = [
    { id: 'caption', icon: FiEdit3, label: 'Caption' },
    { id: 'hashtags', icon: FiHash, label: 'Hashtags' },
    { id: 'script', icon: FiFileText, label: 'Script' },
    { id: 'ideas', icon: FiSun, label: 'Ideje' },
    { id: 'reel', icon: FiPlay, label: '🎬 Reel Creator' },
    { id: 'video', icon: FiVideo, label: 'AI Video' },
    { id: 'voiceover', icon: FiMic, label: 'Voiceover' },
    { id: 'chat', icon: FiMessageSquare, label: 'AI Chat' }
  ];

  return (
    <div className="ai-tools-page">
      <SEO 
        title="AI Alati za Instagram"
        description="Koristite veštačku inteligenciju za kreiranje Instagram sadržaja. AI Caption generator, hashtag predlozi, skripta za rilsove, AI video generisanje i voiceover. Najbolji AI alati za Instagram marketing u Srbiji."
        keywords="AI instagram, generator captiona, hashtag generator, AI video, voiceover, skripta za rilsove, veštačka inteligencija marketing, instagram AI srbija"
        url="/ai-tools"
        breadcrumbs={[
          { name: 'Početna', url: '/' },
          { name: 'AI Alati', url: '/ai-tools' }
        ]}
        faq={[
          {
            question: 'Kako funkcioniše AI generisanje sadržaja?',
            answer: 'Naši AI alati koriste napredne modele veštačke inteligencije (GPT-4) za generisanje captiona, hashtag-ova, skripti za video, pa čak i samog video sadržaja na osnovu vaših uputstava.'
          },
          {
            question: 'Da li je AI sadržaj jedinstven?',
            answer: 'Da, svaki generisani sadržaj je potpuno jedinstven i kreiran specijalno za vaše potrebe na osnovu teme i tona koji odaberete.'
          },
          {
            question: 'Koliko hashtag-ova mogu da generišem?',
            answer: 'Možete generisati neograničen broj hashtag-ova. AI analizira vašu temu i predlaže najrelevantnije hashtag-ove za maksimalan reach.'
          }
        ]}
      />

      <div className="page-header">
        <div>
          <h1><FaRobot /> AI Alati</h1>
          <p>Generiši sadržaj pomoću AI - caption-i, hashtag-ovi, script-ovi i voiceover</p>
        </div>
      </div>

      <div className="ai-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`ai-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="ai-content">
        {/* Caption Generator */}
        {activeTab === 'caption' && (
          <div className="ai-section">
            <h2><FiEdit3 /> Caption Generator</h2>
            <p>Generiši engaging caption-e za svoje postove</p>
            
            <div className="form-group">
              <label>Tema / Opis posta</label>
              <textarea
                value={captionTopic}
                onChange={(e) => setCaptionTopic(e.target.value)}
                placeholder="Npr: Novi proizvod za negu kože, prirodni sastojci, savršen za zimu..."
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Ton</label>
                <select value={captionTone} onChange={(e) => setCaptionTone(e.target.value)}>
                  <option value="engaging">Engaging</option>
                  <option value="professional">Profesionalan</option>
                  <option value="funny">Smešan</option>
                  <option value="inspirational">Inspirativan</option>
                  <option value="casual">Opušten</option>
                </select>
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={includeEmojis} 
                    onChange={(e) => setIncludeEmojis(e.target.checked)} 
                  />
                  Uključi emoji-je
                </label>
                <label>
                  <input 
                    type="checkbox" 
                    checked={includeHashtags} 
                    onChange={(e) => setIncludeHashtags(e.target.checked)} 
                  />
                  Uključi hashtag-ove
                </label>
              </div>
            </div>

            <button 
              className="generate-btn" 
              onClick={handleGenerateCaption}
              disabled={loading}
            >
              {loading ? <FiRefreshCw className="spin" /> : <FaWandMagicSparkles />}
              {loading ? 'Generisanje...' : 'Generiši Caption'}
            </button>

            {generatedCaption && (
              <div className="result-box">
                <div className="result-header">
                  <h3>Generisani Caption</h3>
                  <button onClick={() => copyToClipboard(generatedCaption)}>
                    <FiCopy /> Kopiraj
                  </button>
                </div>
                <div className="result-content">
                  {generatedCaption}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hashtag Generator */}
        {activeTab === 'hashtags' && (
          <div className="ai-section">
            <h2><FiHash /> Hashtag Generator</h2>
            <p>Generiši relevantne hashtag-ove za veći reach</p>
            
            <div className="form-group">
              <label>Tema</label>
              <input
                type="text"
                value={hashtagTopic}
                onChange={(e) => setHashtagTopic(e.target.value)}
                placeholder="Npr: fitness, zdravlje, vežbanje kod kuće"
              />
            </div>

            <button 
              className="generate-btn" 
              onClick={handleGenerateHashtags}
              disabled={loading}
            >
              {loading ? <FiRefreshCw className="spin" /> : <FiHash />}
              {loading ? 'Generisanje...' : 'Generiši Hashtag-ove'}
            </button>

            {generatedHashtags.length > 0 && (
              <div className="result-box">
                <div className="result-header">
                  <h3>Generisani Hashtag-ovi</h3>
                  <button onClick={() => copyToClipboard(generatedHashtags.join(' '))}>
                    <FiCopy /> Kopiraj sve
                  </button>
                </div>
                <div className="hashtags-grid">
                  {generatedHashtags.map((tag, i) => (
                    <span 
                      key={i} 
                      className="hashtag-chip"
                      onClick={() => copyToClipboard(tag)}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Script Generator */}
        {activeTab === 'script' && (
          <div className="ai-section">
            <h2><FiFileText /> Reel Script Generator</h2>
            <p>Generiši script za viralane Reels</p>
            
            <div className="form-group">
              <label>Tema Reel-a</label>
              <textarea
                value={scriptTopic}
                onChange={(e) => setScriptTopic(e.target.value)}
                placeholder="Npr: 5 saveta za produktivnost, jutarnja rutina, kako zaraditi online..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Trajanje (sekundi)</label>
              <select value={scriptDuration} onChange={(e) => setScriptDuration(Number(e.target.value))}>
                <option value={15}>15 sekundi</option>
                <option value={30}>30 sekundi</option>
                <option value={60}>60 sekundi</option>
                <option value={90}>90 sekundi</option>
              </select>
            </div>

            <button 
              className="generate-btn" 
              onClick={handleGenerateScript}
              disabled={loading}
            >
              {loading ? <FiRefreshCw className="spin" /> : <FiZap />}
              {loading ? 'Generisanje...' : 'Generiši Script'}
            </button>

            {generatedScript && (
              <div className="result-box">
                <div className="result-header">
                  <h3>Generisani Script</h3>
                  <button onClick={() => copyToClipboard(generatedScript)}>
                    <FiCopy /> Kopiraj
                  </button>
                </div>
                <div className="result-content script-content">
                  {generatedScript}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ideas Generator */}
        {activeTab === 'ideas' && (
          <div className="ai-section">
            <h2><FiSun /> Content Ideje</h2>
            <p>Dobij kreativne ideje za sadržaj u tvojoj niši</p>
            
            <div className="form-group">
              <label>Tvoja Niša</label>
              <input
                type="text"
                value={ideasNiche}
                onChange={(e) => setIdeasNiche(e.target.value)}
                placeholder="Npr: fitness, moda, tehnologija, hrana, putovanja..."
              />
            </div>

            <button 
              className="generate-btn" 
              onClick={handleGenerateIdeas}
              disabled={loading}
            >
              {loading ? <FiRefreshCw className="spin" /> : <FiSun />}
              {loading ? 'Generisanje...' : 'Generiši Ideje'}
            </button>

            {generatedIdeas.length > 0 && (
              <div className="ideas-list">
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
          </div>
        )}

        {/* 🎬 Reel Creator - Full Workflow */}
        {activeTab === 'reel' && (
          <div className="ai-section reel-creator">
            <h2><FiPlay /> 🎬 Reel Creator</h2>
            <p>Kreiraj kompletan Reel sa AI videom, voiceover-om i tekstom!</p>
            
            <div className="reel-workflow-info">
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
                <span className="step-label">Finalno</span>
              </div>
            </div>

            <div className="form-group">
              <label>Tema Reel-a (za script i voiceover)</label>
              <input
                type="text"
                value={reelTopic}
                onChange={(e) => setReelTopic(e.target.value)}
                placeholder="Npr: 5 saveta za produktivnost, Jutarnja rutina, Fitness motivacija..."
              />
            </div>

            <div className="form-group">
              <label>Video Prompt (opis scene - engleski preporučen)</label>
              <textarea
                value={reelVideoPrompt}
                onChange={(e) => setReelVideoPrompt(e.target.value)}
                placeholder="Npr: Person working on laptop in modern office, morning light, cinematic..."
                rows={2}
              />
              <small>Ako ostavite prazno, automatski će se generisati na osnovu teme</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Stil glasa</label>
                <select value={reelVoiceStyle} onChange={(e) => setReelVoiceStyle(e.target.value)}>
                  <option value="energetic">Energičan</option>
                  <option value="calm">Smiren</option>
                  <option value="professional">Profesionalan</option>
                  <option value="friendly">Prijateljski</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tekst overlay (opciono)</label>
                <input
                  type="text"
                  value={reelTextOverlay}
                  onChange={(e) => setReelTextOverlay(e.target.value)}
                  placeholder="Tekst koji će se prikazati na videu"
                />
              </div>
            </div>

            <button 
              className="generate-btn reel-btn" 
              onClick={handleCreateReel}
              disabled={reelLoading}
            >
              {reelLoading ? <FiRefreshCw className="spin" /> : <FaWandMagicSparkles />}
              {reelLoading ? 'Kreiranje...' : '✨ Kreiraj Reel'}
            </button>

            {reelStatus && (
              <div className={`status-box ${reelFinalUrl ? 'success' : reelLoading ? 'loading' : 'info'}`}>
                <p>{reelStatus}</p>
              </div>
            )}

            {/* Show progress */}
            {reelScript && (
              <div className="reel-progress-item">
                <h4>📝 Generisani Script:</h4>
                <p>{reelScript}</p>
                <button className="copy-btn small" onClick={() => copyToClipboard(reelScript)}>
                  <FiCopy /> Kopiraj
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
                <h3>🎬 Tvoj Reel je spreman!</h3>
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
                  >
                    <FiDownload /> Preuzmi Reel
                  </a>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(reelFinalUrl)}
                  >
                    <FiCopy /> Kopiraj URL
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Video Generator */}
        {activeTab === 'video' && (
          <div className="ai-section">
            <h2><FiVideo /> AI Video Generator</h2>
            <p>Generiši kratke video klipove pomoću AI - savršeno za Reels!</p>
            
            <div className="form-group">
              <label>Opis videa (engleski daje bolje rezultate)</label>
              <textarea
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="Npr: A beautiful sunset over the ocean with gentle waves, cinematic, 4K quality"
                rows={3}
              />
            </div>

            <div className="info-box">
              <p>💡 <strong>Saveti za bolje rezultate:</strong></p>
              <ul>
                <li>Koristite engleski jezik za opise</li>
                <li>Budite što detaljniji u opisu scene</li>
                <li>Dodajte stil: "cinematic", "4K", "slow motion"</li>
                <li>Generisanje traje 1-3 minuta</li>
              </ul>
            </div>

            <button 
              className="generate-btn" 
              onClick={handleGenerateVideo}
              disabled={videoLoading}
            >
              {videoLoading ? <FiRefreshCw className="spin" /> : <FiVideo />}
              {videoLoading ? 'Generisanje...' : 'Generiši Video'}
            </button>

            {videoStatus && (
              <div className={`status-box ${videoUrl ? 'success' : videoLoading ? 'loading' : 'error'}`}>
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
                  >
                    <FiDownload /> Preuzmi Video
                  </a>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(videoUrl)}
                  >
                    <FiCopy /> Kopiraj URL
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Voiceover Generator */}
        {activeTab === 'voiceover' && (
          <div className="ai-section">
            <h2><FiMic /> Voiceover Generator</h2>
            <p>Pretvori tekst u prirodni govor za Reels</p>
            
            <div className="form-group">
              <label>Tekst za voiceover</label>
              <textarea
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                placeholder="Unesite tekst koji želite da pretvorite u govor..."
                rows={5}
              />
              <small>{ttsText.length}/5000 karaktera</small>
            </div>

            <div className="form-group">
              <label>Stil glasa</label>
              <select value={voiceStyle} onChange={(e) => setVoiceStyle(e.target.value)}>
                <option value="energetic">Energičan (za Reels)</option>
                <option value="calm">Smiren</option>
                <option value="professional">Profesionalan</option>
                <option value="friendly">Prijateljski</option>
              </select>
            </div>

            <button 
              className="generate-btn" 
              onClick={handleGenerateVoiceover}
              disabled={loading || !ttsText.trim()}
            >
              {loading ? <FiRefreshCw className="spin" /> : <FiVolume2 />}
              {loading ? 'Generisanje...' : 'Generiši Voiceover'}
            </button>

            {audioUrl && (
              <div className="result-box audio-result">
                <h3>Generisani Audio</h3>
                <audio controls src={`http://localhost:5000${audioUrl}`}>
                  Your browser does not support the audio element.
                </audio>
                <a 
                  href={`http://localhost:5000${audioUrl}`} 
                  download 
                  className="download-btn"
                >
                  <FiPlay /> Preuzmi MP3
                </a>
              </div>
            )}
          </div>
        )}

        {/* AI Chat */}
        {activeTab === 'chat' && (
          <div className="ai-section chat-section">
            <h2><FiMessageSquare /> AI Marketing Asistent</h2>
            <p>Pitaj AI za savete o Instagram marketingu</p>
            
            <div className="chat-container">
              <div className="chat-messages">
                {chatHistory.length === 0 && (
                  <div className="chat-welcome">
                    <FaRobot size={48} />
                    <h3>Zdravo! 👋</h3>
                    <p>Ja sam tvoj AI marketing asistent. Pitaj me bilo šta o:</p>
                    <ul>
                      <li>📝 Content strategiji</li>
                      <li>📈 Rastu pratilaca</li>
                      <li>#️⃣ Hashtag strategiji</li>
                      <li>🎬 Idejama za Reels</li>
                      <li>💡 Engagement tipsovima</li>
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
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="chat-input">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Pitaj nešto..."
                  onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                />
                <button onClick={handleChat} disabled={loading || !chatMessage.trim()}>
                  <FiZap />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AITools;
