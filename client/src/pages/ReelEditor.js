import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FiVideo, 
  FiMusic, 
  FiType, 
  FiDownload,
  FiPlay,
  FiPause,
  FiRefreshCw,
  FiPlus,
  FiTrash2,
  FiUpload,
  FiCheck,
  FiChevronRight,
  FiVolume2,
  FiVolumeX,
  FiEdit3,
  FiCopy,
  FiSave,
  FiImage
} from 'react-icons/fi';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import SEO from '../components/SEO';
import api from '../services/api';
import './ReelEditor.css';

const ReelEditor = () => {
  // Current step in the pipeline
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: AI Video Generation
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoStatus, setVideoStatus] = useState('');
  const [videoDuration, setVideoDuration] = useState(5);
  
  // Step 2: Music
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [musicLibrary, setMusicLibrary] = useState([]);
  const [musicVolume, setMusicVolume] = useState(0.8);
  const [uploadedMusic, setUploadedMusic] = useState(null);
  const [musicLoading, setMusicLoading] = useState(false);
  
  // Step 3: Text & Subtitles
  const [textOverlays, setTextOverlays] = useState([]);
  const [subtitles, setSubtitles] = useState([]);
  const [autoSubtitleText, setAutoSubtitleText] = useState('');
  const [subtitleStyle, setSubtitleStyle] = useState('minimal');
  
  // Step 4: Final Render
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [finalVideoUrl, setFinalVideoUrl] = useState('');
  
  // Preview controls
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Load music library on mount
  useEffect(() => {
    loadMusicLibrary();
  }, []);

  const loadMusicLibrary = async () => {
    try {
      // Mock music library - replace with actual API call
      setMusicLibrary([
        { id: 1, name: 'Energetic Beat', duration: 30, category: 'upbeat', url: '/music/energetic.mp3' },
        { id: 2, name: 'Chill Vibes', duration: 45, category: 'chill', url: '/music/chill.mp3' },
        { id: 3, name: 'Motivational', duration: 60, category: 'inspirational', url: '/music/motivational.mp3' },
        { id: 4, name: 'Modern Pop', duration: 30, category: 'pop', url: '/music/modern-pop.mp3' },
        { id: 5, name: 'Cinematic', duration: 45, category: 'cinematic', url: '/music/cinematic.mp3' },
      ]);
    } catch (error) {
      console.error('Failed to load music library:', error);
    }
  };

  // ============== STEP 1: AI VIDEO GENERATION ==============
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) {
      toast.error('Unesite opis za video');
      return;
    }

    setVideoLoading(true);
    setVideoStatus('Pokrećem AI generisanje...');
    setVideoUrl('');

    try {
      // Start video generation (video only, no audio/text)
      const response = await api.post('/ai/video/generate-clean', {
        prompt: videoPrompt,
        duration: videoDuration,
        aspectRatio: '9:16'
      });

      if (!response.data.success) {
        throw new Error(response.data.error);
      }

      const predictionId = response.data.predictionId;
      setVideoStatus('Video se generiše... (1-3 min)');
      toast.info('AI generisanje pokrenuto! ⏳');

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 60;

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
            setVideoStatus('✅ Video generisan!');
            setVideoLoading(false);
            toast.success('Video je spreman! Pređite na sledeći korak.');
          } else if (status.status === 'failed') {
            setVideoStatus('Greška: ' + (status.error || 'Generisanje nije uspelo'));
            setVideoLoading(false);
            toast.error('Generisanje nije uspelo');
          } else {
            setVideoStatus(`Generisanje... (${attempts}/${maxAttempts})`);
            setTimeout(pollStatus, 5000);
          }
        } catch (err) {
          console.error('Poll error:', err);
          setTimeout(pollStatus, 5000);
        }
      };

      setTimeout(pollStatus, 5000);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setVideoStatus('Greška: ' + errorMsg);
      toast.error(errorMsg);
      setVideoLoading(false);
    }
  };

  const handleUploadVideo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Molimo izaberite video fajl');
      return;
    }

    setVideoLoading(true);
    setVideoStatus('Otpremanje videa...');

    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await api.post('/upload/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setVideoUrl(response.data.url);
      setVideoStatus('✅ Video otpremljen!');
      toast.success('Video uspešno otpremljen!');
    } catch (error) {
      toast.error('Greška pri otpremanju');
      setVideoStatus('');
    } finally {
      setVideoLoading(false);
    }
  };

  // ============== STEP 2: MUSIC ==============
  const handleSelectMusic = (music) => {
    setSelectedMusic(music);
    setUploadedMusic(null);
    toast.success(`Izabrana muzika: ${music.name}`);
  };

  const handleUploadMusic = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Molimo izaberite audio fajl');
      return;
    }

    setMusicLoading(true);

    try {
      const formData = new FormData();
      formData.append('audio', file);

      const response = await api.post('/upload/audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadedMusic({
        name: file.name,
        url: response.data.url
      });
      setSelectedMusic(null);
      toast.success('Muzika uspešno otpremljena!');
    } catch (error) {
      toast.error('Greška pri otpremanju muzike');
    } finally {
      setMusicLoading(false);
    }
  };

  const handleRemoveMusic = () => {
    setSelectedMusic(null);
    setUploadedMusic(null);
  };

  // ============== STEP 3: TEXT & SUBTITLES ==============
  const addTextOverlay = () => {
    setTextOverlays([
      ...textOverlays,
      {
        id: Date.now(),
        text: '',
        position: 'center',
        startTime: 0,
        endTime: videoDuration,
        fontSize: 'medium',
        color: '#ffffff',
        background: 'rgba(0,0,0,0.6)'
      }
    ]);
  };

  const updateTextOverlay = (id, field, value) => {
    setTextOverlays(textOverlays.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const removeTextOverlay = (id) => {
    setTextOverlays(textOverlays.filter(t => t.id !== id));
  };

  const generateAutoSubtitles = async () => {
    if (!autoSubtitleText.trim()) {
      toast.error('Unesite tekst za titlove');
      return;
    }

    try {
      const response = await api.post('/ai/subtitles/generate', {
        text: autoSubtitleText,
        duration: videoDuration,
        style: subtitleStyle
      });

      if (response.data.success) {
        setSubtitles(response.data.captions);
        toast.success(`Generisano ${response.data.captions.length} titlova!`);
      }
    } catch (error) {
      toast.error('Greška pri generisanju titlova');
    }
  };

  const addSubtitle = () => {
    const lastEnd = subtitles.length > 0 
      ? subtitles[subtitles.length - 1].end 
      : 0;
    
    setSubtitles([
      ...subtitles,
      {
        id: Date.now(),
        text: '',
        start: lastEnd,
        end: Math.min(lastEnd + 2, videoDuration)
      }
    ]);
  };

  const updateSubtitle = (id, field, value) => {
    setSubtitles(subtitles.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const removeSubtitle = (id) => {
    setSubtitles(subtitles.filter(s => s.id !== id));
  };

  // ============== STEP 4: RENDER ==============
  const handleRenderFinal = async () => {
    if (!videoUrl) {
      toast.error('Nema videa za renderovanje');
      return;
    }

    setRendering(true);
    setRenderProgress(10);

    try {
      const audioUrl = uploadedMusic?.url || selectedMusic?.url || null;

      // Prepare render request
      const renderData = {
        videoUrl,
        audioUrl,
        audioVolume: musicVolume,
        textOverlays: textOverlays.filter(t => t.text.trim()),
        subtitles: subtitles.filter(s => s.text.trim()),
        subtitleStyle,
        output: {
          format: 'mp4',
          resolution: 'hd',
          aspectRatio: '9:16'
        }
      };

      setRenderProgress(30);

      const response = await api.post('/ai/video/render-final', renderData);

      if (!response.data.success) {
        throw new Error(response.data.error);
      }

      // Poll for render completion
      const renderId = response.data.renderId;
      
      const pollRender = async () => {
        try {
          const statusResponse = await api.get(`/ai/video/render-status/${renderId}`);
          const status = statusResponse.data;

          if (status.status === 'done') {
            setRenderProgress(100);
            setFinalVideoUrl(status.url);
            setRendering(false);
            toast.success('Reel je spreman za preuzimanje! 🎉');
          } else if (status.status === 'failed') {
            throw new Error(status.error || 'Renderovanje nije uspelo');
          } else {
            setRenderProgress(prev => Math.min(prev + 10, 90));
            setTimeout(pollRender, 3000);
          }
        } catch (err) {
          console.error('Render poll error:', err);
          setTimeout(pollRender, 3000);
        }
      };

      setTimeout(pollRender, 3000);
    } catch (error) {
      toast.error(error.message || 'Greška pri renderovanju');
      setRendering(false);
      setRenderProgress(0);
    }
  };

  // ============== PREVIEW CONTROLS ==============
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        if (audioRef.current) audioRef.current.pause();
      } else {
        videoRef.current.play();
        if (audioRef.current) {
          audioRef.current.currentTime = videoRef.current.currentTime;
          audioRef.current.play();
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const canProceed = (step) => {
    switch (step) {
      case 1: return !!videoUrl;
      case 2: return true; // Music is optional
      case 3: return true; // Text is optional
      case 4: return !!videoUrl;
      default: return false;
    }
  };

  const goToStep = (step) => {
    if (step < currentStep || canProceed(step - 1)) {
      setCurrentStep(step);
    } else {
      toast.warning('Molimo završite trenutni korak');
    }
  };

  return (
    <div className="reel-editor-page">
      <SEO 
        title="Reel Editor - AI Video Creator"
        description="Kreirajte profesionalne reelove sa AI videom, muzikom i titlovima"
      />

      <div className="page-header">
        <h1><FiVideo /> Reel Editor</h1>
        <p>Kreirajte reel u 4 koraka: AI Video → Muzika → Tekst → Export</p>
      </div>

      {/* Step Progress Bar */}
      <div className="step-progress">
        {[
          { num: 1, icon: FiVideo, label: 'AI Video' },
          { num: 2, icon: FiMusic, label: 'Muzika' },
          { num: 3, icon: FiType, label: 'Tekst & Titlovi' },
          { num: 4, icon: FiDownload, label: 'Export' }
        ].map((step, index) => (
          <React.Fragment key={step.num}>
            <div 
              className={`step-item ${currentStep === step.num ? 'active' : ''} ${currentStep > step.num ? 'completed' : ''} ${canProceed(step.num - 1) || step.num <= currentStep ? 'clickable' : ''}`}
              onClick={() => goToStep(step.num)}
            >
              <div className="step-icon">
                {currentStep > step.num ? <FiCheck /> : <step.icon />}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
            {index < 3 && <div className={`step-connector ${currentStep > step.num ? 'completed' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="editor-layout">
        {/* Left Panel - Controls */}
        <div className="editor-controls">
          
          {/* STEP 1: AI Video Generation */}
          {currentStep === 1 && (
            <div className="step-content">
              <h2><FiVideo /> Korak 1: AI Video</h2>
              <p className="step-description">
                Generišite video samo pomoću AI - bez muzike i teksta. 
                Najčistiji i najkvalitetniji rezultat.
              </p>

              <div className="form-group">
                <label>Video Prompt (engleski preporučen)</label>
                <textarea
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder="Npr: A person walking through a modern city at sunset, cinematic, smooth camera movement..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Trajanje</label>
                <select 
                  value={videoDuration} 
                  onChange={(e) => setVideoDuration(Number(e.target.value))}
                >
                  <option value={5}>5 sekundi</option>
                  <option value={10}>10 sekundi</option>
                </select>
              </div>

              <button 
                className="btn-primary full-width"
                onClick={handleGenerateVideo}
                disabled={videoLoading}
              >
                {videoLoading ? (
                  <><FiRefreshCw className="spin" /> {videoStatus}</>
                ) : (
                  <><FaWandMagicSparkles /> Generiši AI Video</>
                )}
              </button>

              <div className="divider">
                <span>ili</span>
              </div>

              <label className="btn-secondary full-width upload-btn">
                <FiUpload /> Otpremi sopstveni video
                <input 
                  type="file" 
                  accept="video/*" 
                  onChange={handleUploadVideo}
                  hidden 
                />
              </label>

              {videoUrl && (
                <div className="success-badge">
                  <FiCheck /> Video spreman
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Music */}
          {currentStep === 2 && (
            <div className="step-content">
              <h2><FiMusic /> Korak 2: Muzika</h2>
              <p className="step-description">
                Dodajte pozadinsku muziku iz biblioteke ili otpremite svoju.
              </p>

              <h3>Biblioteka Muzike</h3>
              <div className="music-library">
                {musicLibrary.map(music => (
                  <div 
                    key={music.id}
                    className={`music-item ${selectedMusic?.id === music.id ? 'selected' : ''}`}
                    onClick={() => handleSelectMusic(music)}
                  >
                    <div className="music-info">
                      <span className="music-name">{music.name}</span>
                      <span className="music-duration">{music.duration}s</span>
                    </div>
                    <span className="music-category">{music.category}</span>
                  </div>
                ))}
              </div>

              <div className="divider">
                <span>ili</span>
              </div>

              <label className="btn-secondary full-width upload-btn">
                <FiUpload /> {musicLoading ? 'Otpremanje...' : 'Otpremi svoju muziku'}
                <input 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleUploadMusic}
                  hidden 
                  disabled={musicLoading}
                />
              </label>

              {(selectedMusic || uploadedMusic) && (
                <div className="selected-music">
                  <div className="music-selected-info">
                    <FiMusic />
                    <span>{selectedMusic?.name || uploadedMusic?.name}</span>
                  </div>
                  <button className="btn-icon" onClick={handleRemoveMusic}>
                    <FiTrash2 />
                  </button>
                </div>
              )}

              <div className="form-group">
                <label>Jačina Muzike: {Math.round(musicVolume * 100)}%</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(Number(e.target.value))}
                />
              </div>

              <div className="info-box">
                <p>💡 Muzika je opciona. Možete preskočiti ovaj korak.</p>
              </div>
            </div>
          )}

          {/* STEP 3: Text & Subtitles */}
          {currentStep === 3 && (
            <div className="step-content">
              <h2><FiType /> Korak 3: Tekst & Titlovi</h2>
              <p className="step-description">
                Dodajte tekst overlay i/ili automatske titlove.
              </p>

              {/* Text Overlays */}
              <div className="section">
                <div className="section-header">
                  <h3><FiEdit3 /> Tekst Overlay</h3>
                  <button className="btn-small" onClick={addTextOverlay}>
                    <FiPlus /> Dodaj
                  </button>
                </div>

                {textOverlays.map((overlay, index) => (
                  <div key={overlay.id} className="text-overlay-item">
                    <div className="overlay-header">
                      <span>Tekst #{index + 1}</span>
                      <button 
                        className="btn-icon small danger"
                        onClick={() => removeTextOverlay(overlay.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={overlay.text}
                      onChange={(e) => updateTextOverlay(overlay.id, 'text', e.target.value)}
                      placeholder="Unesite tekst..."
                    />
                    <div className="overlay-options">
                      <select
                        value={overlay.position}
                        onChange={(e) => updateTextOverlay(overlay.id, 'position', e.target.value)}
                      >
                        <option value="top">Vrh</option>
                        <option value="center">Centar</option>
                        <option value="bottom">Dno</option>
                      </select>
                      <select
                        value={overlay.fontSize}
                        onChange={(e) => updateTextOverlay(overlay.id, 'fontSize', e.target.value)}
                      >
                        <option value="small">Mali</option>
                        <option value="medium">Srednji</option>
                        <option value="large">Veliki</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Auto Subtitles */}
              <div className="section">
                <h3><FaWandMagicSparkles /> Automatski Titlovi</h3>
                <div className="form-group">
                  <label>Tekst za titlove</label>
                  <textarea
                    value={autoSubtitleText}
                    onChange={(e) => setAutoSubtitleText(e.target.value)}
                    placeholder="Unesite tekst koji će biti podeljen u titlove..."
                    rows={3}
                  />
                </div>
                <div className="form-row">
                  <select
                    value={subtitleStyle}
                    onChange={(e) => setSubtitleStyle(e.target.value)}
                  >
                    <option value="minimal">Minimalan</option>
                    <option value="bold">Bold</option>
                    <option value="karaoke">Karaoke</option>
                    <option value="shadow">Sa Senkom</option>
                  </select>
                  <button 
                    className="btn-primary"
                    onClick={generateAutoSubtitles}
                    disabled={!autoSubtitleText.trim()}
                  >
                    <FaWandMagicSparkles /> Generiši
                  </button>
                </div>
              </div>

              {/* Manual Subtitles */}
              {subtitles.length > 0 && (
                <div className="section subtitles-section">
                  <div className="section-header">
                    <h3>Titlovi ({subtitles.length})</h3>
                    <button className="btn-small" onClick={addSubtitle}>
                      <FiPlus />
                    </button>
                  </div>
                  <div className="subtitles-list">
                    {subtitles.map((sub, index) => (
                      <div key={sub.id} className="subtitle-edit-item">
                        <div className="subtitle-timing">
                          <input
                            type="number"
                            value={sub.start}
                            onChange={(e) => updateSubtitle(sub.id, 'start', Number(e.target.value))}
                            step="0.1"
                            min="0"
                          />
                          <span>-</span>
                          <input
                            type="number"
                            value={sub.end}
                            onChange={(e) => updateSubtitle(sub.id, 'end', Number(e.target.value))}
                            step="0.1"
                            min="0"
                          />
                        </div>
                        <input
                          type="text"
                          value={sub.text}
                          onChange={(e) => updateSubtitle(sub.id, 'text', e.target.value)}
                          placeholder="Tekst titla..."
                        />
                        <button 
                          className="btn-icon small danger"
                          onClick={() => removeSubtitle(sub.id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="info-box">
                <p>💡 Tekst i titlovi su opcioni. Možete preskočiti ovaj korak.</p>
              </div>
            </div>
          )}

          {/* STEP 4: Export */}
          {currentStep === 4 && (
            <div className="step-content">
              <h2><FiDownload /> Korak 4: Export</h2>
              <p className="step-description">
                Renderujte finalni video sa svim elementima.
              </p>

              <div className="export-summary">
                <h3>Rezime</h3>
                <div className="summary-item">
                  <FiVideo />
                  <span>Video: {videoUrl ? '✅ Spreman' : '❌ Nedostaje'}</span>
                </div>
                <div className="summary-item">
                  <FiMusic />
                  <span>Muzika: {selectedMusic || uploadedMusic ? `✅ ${selectedMusic?.name || uploadedMusic?.name}` : '⏭️ Preskočeno'}</span>
                </div>
                <div className="summary-item">
                  <FiType />
                  <span>Tekst: {textOverlays.length} overlay, {subtitles.length} titlova</span>
                </div>
              </div>

              {rendering ? (
                <div className="render-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${renderProgress}%` }}
                    />
                  </div>
                  <span>Renderovanje... {renderProgress}%</span>
                </div>
              ) : finalVideoUrl ? (
                <div className="render-complete">
                  <FiCheck className="success-icon" />
                  <h3>Reel je spreman!</h3>
                  <div className="download-actions">
                    <a 
                      href={finalVideoUrl} 
                      download="reel.mp4"
                      className="btn-primary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FiDownload /> Preuzmi MP4
                    </a>
                    <button 
                      className="btn-secondary"
                      onClick={() => navigator.clipboard.writeText(finalVideoUrl)}
                    >
                      <FiCopy /> Kopiraj URL
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  className="btn-primary full-width large"
                  onClick={handleRenderFinal}
                  disabled={!videoUrl}
                >
                  <FaWandMagicSparkles /> Renderiuj Finalni Video
                </button>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="step-navigation">
            {currentStep > 1 && (
              <button 
                className="btn-secondary"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                ← Nazad
              </button>
            )}
            {currentStep < 4 && (
              <button 
                className="btn-primary"
                onClick={() => goToStep(currentStep + 1)}
                disabled={currentStep === 1 && !videoUrl}
              >
                Sledeći korak <FiChevronRight />
              </button>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="editor-preview">
          <h3>Pregled</h3>
          <div className="preview-container">
            {videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="preview-video"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  loop
                />
                
                {/* Text Overlays Preview */}
                {textOverlays.map((overlay) => (
                  overlay.text && currentTime >= overlay.startTime && currentTime <= overlay.endTime && (
                    <div 
                      key={overlay.id}
                      className={`preview-text-overlay ${overlay.position}`}
                      style={{ 
                        fontSize: overlay.fontSize === 'small' ? '14px' : overlay.fontSize === 'large' ? '24px' : '18px',
                        color: overlay.color,
                        background: overlay.background
                      }}
                    >
                      {overlay.text}
                    </div>
                  )
                ))}

                {/* Subtitles Preview */}
                {subtitles.map((sub) => (
                  sub.text && currentTime >= sub.start && currentTime <= sub.end && (
                    <div key={sub.id} className={`preview-subtitle ${subtitleStyle}`}>
                      {sub.text}
                    </div>
                  )
                ))}

                {/* Audio element for music */}
                {(selectedMusic || uploadedMusic) && (
                  <audio
                    ref={audioRef}
                    src={selectedMusic?.url || uploadedMusic?.url}
                    loop
                  />
                )}
              </>
            ) : (
              <div className="preview-placeholder">
                <FiImage />
                <p>Video pregled će se pojaviti ovde</p>
              </div>
            )}
          </div>

          {/* Preview Controls */}
          {videoUrl && (
            <div className="preview-controls">
              <button className="btn-icon" onClick={togglePlay}>
                {isPlaying ? <FiPause /> : <FiPlay />}
              </button>
              <div className="time-display">
                {currentTime.toFixed(1)}s / {videoDuration}s
              </div>
              {(selectedMusic || uploadedMusic) && (
                <button className="btn-icon" onClick={toggleMute}>
                  {isMuted ? <FiVolumeX /> : <FiVolume2 />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReelEditor;
