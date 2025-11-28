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
  FiSave
} from 'react-icons/fi';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import SEO from '../components/SEO';
import api from '../services/api';
import './AIVideo.css';

const AIVideo = () => {
  const [activeTab, setActiveTab] = useState('text-to-video');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [aspectRatio, setAspectRatio] = useState('9:16'); // Default for Reels
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [myVideos, setMyVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);

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
          aspectRatio
        });
      } else {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('prompt', prompt);
        formData.append('duration', duration);
        formData.append('aspectRatio', aspectRatio);

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
                  <label htmlFor="aspect-select">Format</label>
                  <select 
                    id="aspect-select"
                    value={aspectRatio} 
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="select"
                  >
                    <option value="9:16">9:16 (Reels/TikTok)</option>
                    <option value="16:9">16:9 (YouTube)</option>
                    <option value="1:1">1:1 (Square)</option>
                  </select>
                </div>
              </div>

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
                <button 
                  className="btn btn-success"
                  onClick={() => saveVideoToLocal(generatedVideo)}
                >
                  <FiSave aria-hidden="true" /> Sačuvaj Video
                </button>
                <a 
                  href={generatedVideo.videoUrl} 
                  download 
                  className="btn btn-secondary"
                >
                  <FiDownload aria-hidden="true" /> Download
                </a>
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
            <div className="card-header">
              <h3 id="my-videos-heading">Moji AI Videi</h3>
              <span className="video-count">{myVideos.length} videa</span>
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
              <div className="videos-grid" role="list">
                {myVideos.map((video) => (
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
                    <div className="video-thumbnail">
                      <video 
                        src={video.videoUrl} 
                        muted 
                        loop 
                        onMouseOver={e => e.target.play()} 
                        onMouseOut={e => e.target.pause()} 
                        aria-hidden="true"
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
    </main>
  );
};

export default AIVideo;
