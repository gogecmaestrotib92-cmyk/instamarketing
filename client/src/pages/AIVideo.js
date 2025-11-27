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
  FiZap
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

  useEffect(() => {
    fetchMyVideos();
  }, []);

  const fetchMyVideos = async () => {
    try {
      const response = await api.get('/ai-video/my-videos');
      setMyVideos(response.data.videos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoadingVideos(false);
    }
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
    const caption = window.prompt('Unesite caption za Instagram Reel:');
    if (!caption) return;

    try {
      await api.post(`/ai-video/${videoId}/post-to-instagram`, {
        caption,
        hashtags: ['ai', 'reels', 'viral']
      });
      toast.success('🎉 Video objavljen na Instagram!');
      fetchMyVideos();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Greška pri objavljivanju');
    }
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('Da li ste sigurni da želite obrisati ovaj video?')) return;

    try {
      await api.delete(`/ai-video/${videoId}`);
      toast.success('Video obrisan');
      setMyVideos(myVideos.filter(v => v._id !== videoId));
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
    <div className="ai-video-page">
      <SEO 
        title="AI Video Generator"
        description="Generate stunning AI videos for Instagram Reels with Runway ML Gen-3"
        noindex={true}
      />

      <div className="page-header">
        <div>
          <h1><FaWandMagicSparkles /> AI Video Generator</h1>
          <p className="page-subtitle">Kreirajte neverovatne videe pomoću AI za Instagram Reels</p>
        </div>
      </div>

      <div className="ai-video-container">
        {/* Generator Section */}
        <div className="generator-section">
          <div className="card">
            <div className="card-header">
              <h3>Generiši Video</h3>
            </div>

            {/* Tabs */}
            <div className="generator-tabs">
              <button 
                className={`tab ${activeTab === 'text-to-video' ? 'active' : ''}`}
                onClick={() => setActiveTab('text-to-video')}
              >
                <FiVideo /> Text to Video
              </button>
              <button 
                className={`tab ${activeTab === 'image-to-video' ? 'active' : ''}`}
                onClick={() => setActiveTab('image-to-video')}
              >
                <FiImage /> Image to Video
              </button>
            </div>

            <div className="generator-form">
              {/* Image upload for image-to-video */}
              {activeTab === 'image-to-video' && (
                <div className="form-group">
                  <label>Izaberite sliku za animaciju</label>
                  <div className="image-upload-area">
                    {imagePreview ? (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => { setImageFile(null); setImagePreview(null); }}
                        >
                          Ukloni
                        </button>
                      </div>
                    ) : (
                      <label className="upload-placeholder">
                        <FiImage size={48} />
                        <span>Kliknite za upload slike</span>
                        <input 
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
                <label>
                  {activeTab === 'text-to-video' ? 'Opišite video koji želite' : 'Opišite željenu animaciju (opciono)'}
                </label>
                <textarea
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
                  <label>Predlozi:</label>
                  <div className="suggestions-list">
                    {promptSuggestions.slice(0, 4).map((suggestion, index) => (
                      <button 
                        key={index}
                        className="suggestion-chip"
                        onClick={() => setPrompt(suggestion)}
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
                  <label>Trajanje</label>
                  <select 
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
                  <select 
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
              >
                {loading ? (
                  <>
                    <FiLoader className="spinner" /> Generisanje u toku... (1-3 min)
                  </>
                ) : (
                  <>
                    <FiZap /> Generiši Video
                  </>
                )}
              </button>

              {/* Cost Info */}
              <p className="cost-info">
                <FiClock /> Procenjeno vreme: 1-3 minuta | Cena: ~$0.25-0.50 po videu
              </p>
            </div>
          </div>

          {/* Generated Video Preview */}
          {generatedVideo && (
            <div className="card generated-preview">
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
                />
              </div>
              <div className="video-actions">
                <a 
                  href={generatedVideo.videoUrl} 
                  download 
                  className="btn btn-secondary"
                >
                  <FiDownload /> Download
                </a>
                <button 
                  className="btn btn-primary"
                  onClick={() => handlePostToInstagram(generatedVideo.id)}
                >
                  <FiInstagram /> Objavi na Instagram
                </button>
              </div>
            </div>
          )}
        </div>

        {/* My Videos Section */}
        <div className="my-videos-section">
          <div className="card">
            <div className="card-header">
              <h3>Moji AI Videi</h3>
              <span className="video-count">{myVideos.length} videa</span>
            </div>

            {loadingVideos ? (
              <div className="loading-placeholder">
                <FiLoader className="spinner" />
              </div>
            ) : myVideos.length === 0 ? (
              <div className="empty-state">
                <FiVideo size={48} />
                <p>Još nemate generisanih videa</p>
              </div>
            ) : (
              <div className="videos-grid">
                {myVideos.map((video) => (
                  <div key={video._id} className="video-card">
                    <div className="video-thumbnail">
                      <video src={video.videoUrl} muted />
                      <div className="video-overlay">
                        <FiPlay size={32} />
                      </div>
                      <span className="video-duration">{video.duration}s</span>
                    </div>
                    <div className="video-info">
                      <p className="video-prompt">{video.prompt.substring(0, 50)}...</p>
                      <div className="video-meta">
                        <span className={`badge ${video.postedToInstagram ? 'badge-success' : 'badge-secondary'}`}>
                          {video.postedToInstagram ? 'Objavljeno' : video.type}
                        </span>
                      </div>
                    </div>
                    <div className="video-card-actions">
                      {!video.postedToInstagram && (
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handlePostToInstagram(video._id)}
                          title="Objavi na Instagram"
                        >
                          <FiInstagram />
                        </button>
                      )}
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(video._id)}
                        title="Obriši"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIVideo;
