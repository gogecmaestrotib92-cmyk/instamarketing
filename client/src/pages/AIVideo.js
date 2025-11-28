import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FiVideo, 
  FiImage, 
  FiPlay, 
  FiDownload, 
  FiInstagram,
  FiClock,
  FiTrash2,
  FiLoader,
  FiZap,
  FiSave,
  FiMusic,
  FiType,
  FiX,
  FiCheck,
  FiUpload,
  FiVolume2,
  FiPlus
} from 'react-icons/fi';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import SEO from '../components/SEO';
import api from '../services/api';
import './AIVideo.css';

// Preset music tracks
const PRESET_TRACKS = [
  { label: 'Upbeat Energy', value: 'upbeat' },
  { label: 'Chill Vibes', value: 'chill' },
  { label: 'Epic Cinematic', value: 'epic' },
  { label: 'Soft Piano', value: 'piano' },
  { label: 'Electronic Beat', value: 'electronic' },
];

// MusicModal Component
const MusicModal = ({ isOpen, onClose, onApply, currentConfig }) => {
  const [selectedTrack, setSelectedTrack] = useState(currentConfig?.preset || '');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [volume, setVolume] = useState(currentConfig?.volume || 0.35);

  useEffect(() => {
    if (currentConfig) {
      setSelectedTrack(currentConfig.preset || '');
      setVolume(currentConfig.volume || 0.35);
    }
  }, [currentConfig, isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    const config = {
      enabled: true,
      preset: uploadedFile ? null : selectedTrack,
      uploadedFile: uploadedFile,
      volume,
    };
    onApply(config);
    onClose();
  };

  const handleRemove = () => {
    onApply(null);
    onClose();
  };

  const hasSelection = selectedTrack || uploadedFile;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><FiMusic /> Dodaj Pozadinsku Muziku</h2>
          <button onClick={onClose} className="modal-close"><FiX /></button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Izaberi Muziku</label>
            <div className="music-presets">
              {PRESET_TRACKS.map((track) => (
                <button
                  key={track.value}
                  className={`preset-btn ${selectedTrack === track.value ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedTrack(track.value);
                    setUploadedFile(null);
                  }}
                >
                  <FiMusic /> {track.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divider"><span>ili</span></div>

          <div className="form-group">
            <label>Upload Sopstvenu Muziku</label>
            <div className="file-upload">
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file) {
                    setUploadedFile(file);
                    setSelectedTrack('');
                  }
                }}
                id="audio-upload"
              />
              <label htmlFor="audio-upload" className="file-upload-btn">
                <FiUpload /> {uploadedFile ? uploadedFile.name : 'Klikni za upload audio fajla'}
              </label>
            </div>
          </div>

          <div className="form-group">
            <label><FiVolume2 /> Glasnoća: {Math.round(volume * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="volume-slider"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={handleRemove} className="btn btn-text-danger">Ukloni Muziku</button>
          <div className="modal-footer-actions">
            <button onClick={onClose} className="btn btn-secondary">Otkaži</button>
            <button onClick={handleApply} disabled={!hasSelection} className="btn btn-primary">
              <FiCheck /> Primeni
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// TextModal Component
const TextModal = ({ isOpen, onClose, onApply, currentConfig }) => {
  const [overlayText, setOverlayText] = useState(currentConfig?.overlayText || '');
  const [captions, setCaptions] = useState(currentConfig?.captions || []);
  const [newText, setNewText] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentConfig) {
      setOverlayText(currentConfig.overlayText || '');
      setCaptions(currentConfig.captions || []);
    }
  }, [currentConfig, isOpen]);

  if (!isOpen) return null;

  const handleAddCaption = () => {
    setError(null);

    if (!newText.trim()) {
      setError('Unesite tekst titla');
      return;
    }

    const startNum = parseFloat(newStart);
    const endNum = parseFloat(newEnd);

    if (isNaN(startNum) || startNum < 0) {
      setError('Start vreme mora biti pozitivan broj');
      return;
    }

    if (isNaN(endNum) || endNum <= startNum) {
      setError('End vreme mora biti veće od start vremena');
      return;
    }

    setCaptions([...captions, { text: newText.trim(), start: startNum, end: endNum }]);
    setNewText('');
    setNewStart('');
    setNewEnd('');
  };

  const handleDeleteCaption = (index) => {
    setCaptions(captions.filter((_, i) => i !== index));
  };

  const handleApply = () => {
    onApply({ overlayText: overlayText.trim(), captions });
    onClose();
  };

  const handleRemove = () => {
    onApply(null);
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  const hasContent = overlayText.trim() || captions.length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><FiType /> Dodaj Tekst i Titlove</h2>
          <button onClick={onClose} className="modal-close"><FiX /></button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Overlay Tekst (prikazan tokom celog videa)</label>
            <textarea
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              placeholder="Unesite tekst za prikaz na videu..."
              rows={2}
            />
          </div>

          <div className="divider"><span>Vremenski Titlovi</span></div>

          <div className="caption-form">
            <div className="caption-input-row">
              <div className="form-group flex-grow">
                <label>Tekst Titla</label>
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Unesite tekst titla..."
                />
              </div>
              <div className="form-group">
                <label><FiClock /> Start (sek)</label>
                <input
                  type="number"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  style={{ width: '80px' }}
                />
              </div>
              <div className="form-group">
                <label><FiClock /> End (sek)</label>
                <input
                  type="number"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  placeholder="3"
                  min="0"
                  step="0.1"
                  style={{ width: '80px' }}
                />
              </div>
              <button onClick={handleAddCaption} className="btn btn-primary btn-add-caption">
                <FiPlus /> Dodaj
              </button>
            </div>

            {error && <p className="error-text">{error}</p>}
          </div>

          {captions.length > 0 && (
            <div className="caption-list">
              <label>Titlovi ({captions.length})</label>
              {captions.map((caption, index) => (
                <div key={index} className="caption-item">
                  <div className="caption-info">
                    <p className="caption-text">{caption.text}</p>
                    <p className="caption-time">
                      {formatTime(caption.start)} → {formatTime(caption.end)}
                    </p>
                  </div>
                  <button onClick={() => handleDeleteCaption(index)} className="btn-delete">
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          )}

          {captions.length === 0 && (
            <div className="empty-captions">
              <FiType />
              <p>Još nema dodatih titlova</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={handleRemove} className="btn btn-text-danger">Ukloni Tekst</button>
          <div className="modal-footer-actions">
            <button onClick={onClose} className="btn btn-secondary">Otkaži</button>
            <button onClick={handleApply} disabled={!hasContent} className="btn btn-primary">
              <FiCheck /> Primeni
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AIVideo = () => {
  const [activeTab, setActiveTab] = useState('text-to-video');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [aspectRatio] = useState('9:16'); // Always 9:16 for TikTok/Reels
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [myVideos, setMyVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showAllVideos, setShowAllVideos] = useState(true); // Default to expanded
  
  // Music and Text states
  const [musicConfig, setMusicConfig] = useState(null);
  const [textConfig, setTextConfig] = useState(null);
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isTextOpen, setIsTextOpen] = useState(false);

  useEffect(() => {
    fetchMyVideos();
  }, []);

  const fetchMyVideos = async () => {
    try {
      // Load from localStorage first (for saved videos)
      const savedVideos = JSON.parse(localStorage.getItem('myAIVideos') || '[]');
      setMyVideos(savedVideos);
      
      // Also try to fetch from API (if server is available)
      try {
        const response = await api.get('/ai-video/my-videos');
        if (response.data.videos && response.data.videos.length > 0) {
          // Merge API videos with local (avoiding duplicates)
          const apiVideos = response.data.videos;
          const allVideos = [...savedVideos];
          apiVideos.forEach(v => {
            if (!allVideos.find(sv => sv._id === v._id)) {
              allVideos.push(v);
            }
          });
          setMyVideos(allVideos);
        }
      } catch (apiError) {
        // API not available, use localStorage only
        console.log('Using localStorage for videos');
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const saveVideoToLocal = (video) => {
    const savedVideos = JSON.parse(localStorage.getItem('myAIVideos') || '[]');
    const newVideo = {
      _id: video.id || Date.now().toString(),
      videoUrl: video.videoUrl,
      prompt: video.prompt || prompt,
      duration: video.duration || duration,
      aspectRatio: video.aspectRatio || aspectRatio,
      type: activeTab === 'text-to-video' ? 'Text-to-Video' : 'Image-to-Video',
      createdAt: new Date().toISOString(),
      postedToInstagram: false
    };
    
    // Check if video already saved
    if (savedVideos.find(v => v.videoUrl === newVideo.videoUrl)) {
      toast.info('Video je već sačuvan');
      return;
    }
    
    savedVideos.unshift(newVideo);
    localStorage.setItem('myAIVideos', JSON.stringify(savedVideos));
    setMyVideos(savedVideos);
    toast.success('✅ Video sačuvan u Moji Videi!');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGenerate = async () => {
    if (activeTab === 'text-to-video' && !prompt.trim()) {
      toast.error('Unesite prompt za video');
      return;
    }

    if (activeTab === 'image-to-video' && !imageFile) {
      toast.error('Izaberite sliku za animaciju');
      return;
    }

    setLoading(true);
    setGeneratedVideo(null);

    try {
      let response;

      if (activeTab === 'text-to-video') {
        response = await api.post('/ai-video/text-to-video', {
          prompt,
          duration,
          aspectRatio,
          musicConfig,
          textConfig
        });
      } else {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('prompt', prompt);
        formData.append('duration', duration);
        formData.append('aspectRatio', aspectRatio);
        if (musicConfig) formData.append('musicConfig', JSON.stringify(musicConfig));
        if (textConfig) formData.append('textConfig', JSON.stringify(textConfig));

        response = await api.post('/ai-video/image-to-video', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setGeneratedVideo(response.data.video);
      toast.success('🎬 Video uspešno generisan!');
      fetchMyVideos();

    } catch (error) {
      console.error('Generation error:', error);
      const errorMsg = error.response?.data?.error || 'Greška pri generisanju videa';
      
      // Check if payment is required
      if (errorMsg.includes('Payment required') || errorMsg.includes('payment method') || errorMsg.includes('402')) {
        toast.error(
          <div>
            <strong>💳 Potrebna uplata</strong>
            <p style={{fontSize: '12px', marginTop: '5px'}}>
              Dodajte način plaćanja na <a href="https://replicate.com/account/billing" target="_blank" rel="noopener noreferrer" style={{color: '#00ff88'}}>replicate.com/account/billing</a>
              <br/>Cena: ~$0.01-0.05 po videu
            </p>
          </div>,
          { autoClose: 10000 }
        );
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePostToInstagram = async (videoId) => {
    const video = myVideos.find(v => v._id === videoId);
    if (!video) return;

    const caption = window.prompt('Unesite caption za Instagram Reel:');
    if (!caption) return;

    const toastId = toast.loading('Objavljivanje na Instagram... (ovo može potrajati minut)');

    try {
      await api.post(`/ai-video/${videoId}/post-to-instagram`, {
        caption,
        hashtags: ['ai', 'reels', 'viral'],
        videoUrl: video.videoUrl // Send URL in case it's not in DB
      });
      
      toast.update(toastId, { 
        render: '🎉 Video objavljen na Instagram!', 
        type: 'success', 
        isLoading: false, 
        autoClose: 5000 
      });
      
      fetchMyVideos();
    } catch (error) {
      console.error('Post error:', error);
      toast.update(toastId, { 
        render: error.response?.data?.error || 'Greška pri objavljivanju', 
        type: 'error', 
        isLoading: false, 
        autoClose: 5000 
      });
    }
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('Da li ste sigurni da želite obrisati ovaj video?')) return;

    try {
      // Remove from localStorage
      const savedVideos = JSON.parse(localStorage.getItem('myAIVideos') || '[]');
      const updatedVideos = savedVideos.filter(v => v._id !== videoId);
      localStorage.setItem('myAIVideos', JSON.stringify(updatedVideos));
      setMyVideos(updatedVideos);
      
      // Also try to delete from API
      try {
        await api.delete(`/ai-video/${videoId}`);
      } catch (apiError) {
        // API delete failed, but localStorage is already updated
      }
      
      toast.success('Video obrisan');
    } catch (error) {
      toast.error('Greška pri brisanju');
    }
  };

  const promptSuggestions = [
    "Cinematic drone shot flying over beautiful mountains at sunset",
    "Abstract colorful liquid flowing in slow motion",
    "Futuristic city with flying cars and neon lights at night",
    "Ocean waves crashing on rocks, golden hour lighting",
    "Product showcase with elegant spinning motion, studio lighting",
    "Fashion model walking on runway, dramatic lighting",
    "Food preparation in slow motion, steam rising",
    "Nature timelapse of flowers blooming"
  ];

  return (
    <main className="ai-video-page">
      <SEO 
        title="AI Video Generator"
        description="Generate stunning AI videos for Instagram Reels with Runway ML Gen-3"
        noindex={true}
      />

      <header className="page-header">
        <div>
          <h1><FaWandMagicSparkles aria-hidden="true" /> AI Video Generator</h1>
          <p className="page-subtitle">Kreirajte neverovatne videe pomoću AI za Instagram Reels</p>
        </div>
      </header>

      <div className="ai-video-container">
        {/* Generator Section */}
        <section className="generator-section" aria-labelledby="generator-heading">
          <div className="card">
            <div className="card-header">
              <h3 id="generator-heading">Generiši Video</h3>
            </div>

            {/* Tabs */}
            <div className="generator-tabs" role="tablist" aria-label="Tip generisanja">
              <button 
                className={`tab ${activeTab === 'text-to-video' ? 'active' : ''}`}
                onClick={() => setActiveTab('text-to-video')}
                role="tab"
                aria-selected={activeTab === 'text-to-video'}
                aria-controls="generator-panel"
                id="tab-text-to-video"
              >
                <FiVideo aria-hidden="true" /> Text to Video
              </button>
              <button 
                className={`tab ${activeTab === 'image-to-video' ? 'active' : ''}`}
                onClick={() => setActiveTab('image-to-video')}
                role="tab"
                aria-selected={activeTab === 'image-to-video'}
                aria-controls="generator-panel"
                id="tab-image-to-video"
              >
                <FiImage aria-hidden="true" /> Image to Video
              </button>
            </div>

            <div className="generator-form" role="tabpanel" id="generator-panel" aria-labelledby={`tab-${activeTab}`}>
              {/* Image upload for image-to-video */}
              {activeTab === 'image-to-video' && (
                <div className="form-group">
                  <label htmlFor="image-upload">Izaberite sliku za animaciju</label>
                  <div className="image-upload-area">
                    {imagePreview ? (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => { setImageFile(null); setImagePreview(null); }}
                          aria-label="Ukloni sliku"
                        >
                          Ukloni
                        </button>
                      </div>
                    ) : (
                      <label className="upload-placeholder" htmlFor="image-upload">
                        <FiImage size={48} aria-hidden="true" />
                        <span>Kliknite za upload slike</span>
                        <input 
                          id="image-upload"
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageChange}
                          hidden 
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Prompt */}
              <div className="form-group">
                <label htmlFor="prompt-input">
                  {activeTab === 'text-to-video' ? 'Opišite video koji želite' : 'Opišite željenu animaciju (opciono)'}
                </label>
                <textarea
                  id="prompt-input"
                  className="prompt-input"
                  placeholder={activeTab === 'text-to-video' 
                    ? "Npr: Cinematic drone shot of sunset over ocean waves, golden hour lighting, 4K quality..."
                    : "Npr: Slow zoom in with gentle movement, cinematic feel..."
                  }
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Prompt Suggestions */}
              {activeTab === 'text-to-video' && (
                <div className="prompt-suggestions">
                  <span className="label-text">Predlozi:</span>
                  <div className="suggestions-list">
                    {promptSuggestions.slice(0, 4).map((suggestion, index) => (
                      <button 
                        key={index}
                        className="suggestion-chip"
                        onClick={() => setPrompt(suggestion)}
                        aria-label={`Koristi predlog: ${suggestion}`}
                      >
                        {suggestion.substring(0, 40)}...
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="options-row">
                <div className="form-group">
                  <label htmlFor="duration-select">Trajanje</label>
                  <select 
                    id="duration-select"
                    value={duration} 
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="select"
                  >
                    <option value={5}>5 sekundi</option>
                    <option value={10}>10 sekundi</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Format</label>
                  <div className="format-badge">
                    📱 9:16 (TikTok/Reels)
                  </div>
                </div>
              </div>

              {/* Music & Text Buttons */}
              <div className="media-options">
                <button 
                  className={`btn btn-media ${musicConfig ? 'active' : ''}`}
                  onClick={() => setIsMusicOpen(true)}
                  type="button"
                >
                  <FiMusic /> {musicConfig ? 'Muzika ✓' : 'Dodaj Muziku'}
                </button>
                <button 
                  className={`btn btn-media ${textConfig ? 'active' : ''}`}
                  onClick={() => setIsTextOpen(true)}
                  type="button"
                >
                  <FiType /> {textConfig ? 'Tekst ✓' : 'Dodaj Tekst'}
                </button>
              </div>

              {/* Config Summary */}
              {(musicConfig || textConfig) && (
                <div className="config-summary">
                  {musicConfig && (
                    <div className="config-item">
                      <FiMusic className="config-icon" />
                      <span>Muzika: {musicConfig.preset ? PRESET_TRACKS.find(t => t.value === musicConfig.preset)?.label : musicConfig.uploadedFile?.name}</span>
                      <span className="config-detail">({Math.round(musicConfig.volume * 100)}%)</span>
                    </div>
                  )}
                  {textConfig && (
                    <div className="config-item">
                      <FiType className="config-icon" />
                      <span>
                        {textConfig.overlayText ? `"${textConfig.overlayText.substring(0, 25)}${textConfig.overlayText.length > 25 ? '...' : ''}"` : ''}
                        {textConfig.captions?.length > 0 && ` + ${textConfig.captions.length} titl${textConfig.captions.length !== 1 ? 'a' : ''}`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Generate Button */}
              <button 
                className="btn btn-primary btn-full btn-generate"
                onClick={handleGenerate}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <FiLoader className="spinner" aria-hidden="true" /> Generisanje u toku... (1-3 min)
                  </>
                ) : (
                  <>
                    <FiZap aria-hidden="true" /> Generiši Video
                  </>
                )}
              </button>

              {/* Cost Info */}
              <p className="cost-info">
                <FiClock aria-hidden="true" /> Procenjeno vreme: 1-3 minuta | Cena: ~$0.25-0.50 po videu
              </p>
            </div>
          </div>

          {/* Generated Video Preview */}
          {generatedVideo && (
            <article className="card generated-preview" aria-label="Generisan video">
              <div className="card-header">
                <h3>✨ Generisan Video</h3>
              </div>
              <div className="video-preview">
                <video 
                  src={generatedVideo.videoUrl} 
                  controls 
                  autoPlay 
                  loop
                  className={`aspect-${aspectRatio.replace(':', '-')}`}
                  aria-label="Pregled generisanog videa"
                />
              </div>
              <div className="video-actions">
                <a 
                  href={generatedVideo.videoUrl} 
                  download 
                  className="btn btn-secondary"
                >
                  <FiDownload aria-hidden="true" /> Download
                </a>
                <button 
                  className="btn btn-success"
                  onClick={() => saveVideoToLocal(generatedVideo)}
                >
                  <FiSave aria-hidden="true" /> Sačuvaj
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => handlePostToInstagram(generatedVideo.id)}
                >
                  <FiInstagram aria-hidden="true" /> Objavi na Instagram
                </button>
              </div>
            </article>
          )}
        </section>

        {/* My Videos Section */}
        <section className="my-videos-section" aria-labelledby="my-videos-heading">
          <div className="card">
            <div 
              className="card-header clickable-header" 
              onClick={() => setShowAllVideos(prev => !prev)}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <h3 id="my-videos-heading" style={{ pointerEvents: 'none' }}>Moji AI Videi</h3>
              <span className="video-count" style={{ pointerEvents: 'none' }}>{myVideos.length} videa {showAllVideos ? '▲' : '▼'}</span>
            </div>

            {loadingVideos ? (
              <div className="loading-placeholder" aria-label="Učitavanje videa">
                <FiLoader className="spinner" aria-hidden="true" />
              </div>
            ) : myVideos.length === 0 ? (
              <div className="empty-state">
                <FiVideo size={48} aria-hidden="true" />
                <p>Još nemate generisanih videa</p>
              </div>
            ) : (
              <div className={`videos-grid ${showAllVideos ? 'expanded' : ''}`} role="list">
                {(showAllVideos ? myVideos : myVideos.slice(0, 4)).map((video) => (
                  <article 
                    key={video._id} 
                    className="video-card" 
                    onClick={() => setSelectedVideo(video)}
                    role="listitem"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedVideo(video);
                      }
                    }}
                    aria-label={`Video: ${video.prompt}`}
                  >
                    <div 
                      className="video-thumbnail"
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: 0,
                        paddingBottom: '177.78%',
                        background: '#000',
                        borderRadius: '16px',
                        overflow: 'hidden'
                      }}
                    >
                      <video 
                        src={video.videoUrl} 
                        muted 
                        loop 
                        onMouseOver={e => e.target.play()} 
                        onMouseOut={e => e.target.pause()} 
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <div className="video-overlay">
                        <div className="overlay-content">
                          <div className="play-icon" aria-hidden="true">
                            <FiPlay size={40} />
                          </div>
                          <div className="overlay-actions">
                            <a 
                              href={video.videoUrl}
                              download
                              className="action-btn"
                              title="Download"
                              onClick={(e) => e.stopPropagation()}
                              aria-label="Preuzmi video"
                            >
                              <FiDownload aria-hidden="true" />
                            </a>
                            {!video.postedToInstagram && (
                              <button 
                                className="action-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePostToInstagram(video._id);
                                }}
                                title="Objavi na Instagram"
                                aria-label="Objavi na Instagram"
                              >
                                <FiInstagram aria-hidden="true" />
                              </button>
                            )}
                            <button 
                              className="action-btn delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(video._id);
                              }}
                              title="Obriši"
                              aria-label="Obriši video"
                            >
                              <FiTrash2 aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <span className="video-duration">{video.duration}s</span>
                      <span className={`status-badge ${video.postedToInstagram ? 'posted' : ''}`} aria-label={video.postedToInstagram ? "Objavljeno na Instagramu" : "Nije objavljeno"}>
                        {video.postedToInstagram ? <FiInstagram aria-hidden="true" /> : <FiVideo aria-hidden="true" />}
                      </span>
                    </div>
                    <div className="video-info">
                      <p className="video-prompt">{video.prompt}</p>
                      <span className="video-date">{new Date(video.createdAt).toLocaleDateString()}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {myVideos.length > 4 && (
              <button 
                className="btn btn-show-more"
                onClick={() => setShowAllVideos(!showAllVideos)}
              >
                {showAllVideos ? 'Prikaži manje ▲' : `Prikaži sve (${myVideos.length}) ▼`}
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div 
          className="video-modal-overlay" 
          onClick={() => setSelectedVideo(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="video-modal-content" onClick={e => e.stopPropagation()}>
            <button 
              className="video-modal-close" 
              onClick={() => setSelectedVideo(null)}
              aria-label="Zatvori"
            >
              ×
            </button>
            <div className="video-modal-header">
              <h3 id="modal-title">{selectedVideo.type}</h3>
              <span className="video-date">{new Date(selectedVideo.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="video-modal-player">
              <video 
                src={selectedVideo.videoUrl} 
                controls 
                autoPlay 
                className={`aspect-${selectedVideo.aspectRatio?.replace(':', '-') || '9-16'}`}
                aria-label="Video plejer"
              />
            </div>
            <div className="video-modal-details">
              <p className="video-prompt-full">{selectedVideo.prompt}</p>
              <div className="video-actions">
                <a 
                  href={selectedVideo.videoUrl} 
                  download 
                  className="btn btn-secondary"
                >
                  <FiDownload aria-hidden="true" /> Download
                </a>
                <button 
                  className="btn btn-primary"
                  onClick={() => handlePostToInstagram(selectedVideo._id)}
                >
                  <FiInstagram aria-hidden="true" /> Objavi na Instagram
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Music Modal */}
      <MusicModal
        isOpen={isMusicOpen}
        onClose={() => setIsMusicOpen(false)}
        onApply={setMusicConfig}
        currentConfig={musicConfig}
      />

      {/* Text Modal */}
      <TextModal
        isOpen={isTextOpen}
        onClose={() => setIsTextOpen(false)}
        onApply={setTextConfig}
        currentConfig={textConfig}
      />
    </main>
  );
};

export default AIVideo;
