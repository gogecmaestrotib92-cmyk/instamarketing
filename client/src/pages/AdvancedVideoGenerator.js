import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FiVideo, 
  FiZap, 
  FiFolder, 
  FiTarget, 
  FiSettings, 
  FiEye, 
  FiDownload, 
  FiLayers,
  FiActivity,
  FiAperture,
  FiEdit3,
  FiSlash,
  FiClock,
  FiMaximize2,
  FiSliders,
  FiMusic,
  FiType,
  FiCheckCircle,
  FiPlus,
  FiTrash2,
  FiMic,
  FiVolume2
} from 'react-icons/fi';
import SEO from '../components/SEO';
import './AdvancedVideoGenerator.css';

const AdvancedVideoGenerator = () => {
  const [activeTab, setActiveTab] = useState('generate');
  const [loading, setLoading] = useState(false);
  const [presets, setPresets] = useState(null);
  const [generatedVideos, setGeneratedVideos] = useState([]);
  const [enhancedVideo, setEnhancedVideo] = useState(null);
  const [finalizedVideo, setFinalizedVideo] = useState(null);
  
  // Generation form state
  const [formData, setFormData] = useState({
    subject: '',
    action: '',
    shotType: 'medium',
    style: 'cinematic',
    cameraMovement: 'static',
    lighting: 'natural',
    setting: '',
    mood: '',
    audioCues: '',
    customPrompt: '',
    negatives: '',
    template: '',
    model: 'damo-text2video',
    numVariations: 3,
    numFrames: 16,
    fps: 8,
    guidanceScale: 7.5
  });

  // Enhancement form state
  const [enhanceData, setEnhanceData] = useState({
    videoUrl: '',
    upscale: true,
    upscaleScale: 2,
    interpolate: false,
    targetFps: 30,
    denoise: true,
    denoiseStrength: 'medium',
    temporalEnhance: true,
    colorGrade: ''
  });

  // Finalization form state
  const [finalizeData, setFinalizeData] = useState({
    videoUrl: '',
    voiceoverUrl: '',
    musicUrl: '',
    overlays: []
  });

  // New overlay state
  const [newOverlay, setNewOverlay] = useState({
    text: '',
    start: 0,
    end: 3
  });

  // Voiceover state
  const [voiceoverScript, setVoiceoverScript] = useState('');
  const [voiceoverStyle, setVoiceoverStyle] = useState('energetic');
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);

  // Stock music library
  const stockMusic = [
    { name: 'Energetic Beat', url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1732800000/music/energetic-beat.mp3', category: 'Upbeat' },
    { name: 'Cinematic Ambient', url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1732800000/music/cinematic-ambient.mp3', category: 'Cinematic' },
    { name: 'Corporate Lo-Fi', url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1732800000/music/corporate-lofi.mp3', category: 'Business' },
    { name: 'Chill Vibes', url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1732800000/music/chill-vibes.mp3', category: 'Relaxed' },
    { name: 'Epic Trailer', url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1732800000/music/epic-trailer.mp3', category: 'Dramatic' },
  ];

  // Built prompt preview
  const [promptPreview, setPromptPreview] = useState('');

  useEffect(() => {
    fetchPresets();
  }, []);

  useEffect(() => {
    buildPromptPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const fetchPresets = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/video/presets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPresets(res.data);
    } catch (error) {
      console.error('Failed to fetch presets:', error);
    }
  };

  const buildPromptPreview = () => {
    const parts = [];
    
    if (formData.shotType) {
      parts.push(formData.shotType.replace(/_/g, ' '));
    }
    if (formData.subject) {
      parts.push(`of ${formData.subject}`);
    }
    if (formData.action) {
      parts.push(formData.action);
    }
    if (formData.setting) {
      parts.push(`in ${formData.setting}`);
    }
    if (formData.style) {
      parts.push(`${formData.style} style`);
    }
    if (formData.lighting) {
      parts.push(`${formData.lighting} lighting`);
    }
    if (formData.cameraMovement && formData.cameraMovement !== 'static') {
      parts.push(`camera ${formData.cameraMovement.replace(/_/g, ' ')}`);
    }
    if (formData.mood) {
      parts.push(`${formData.mood} mood`);
    }
    
    setPromptPreview(parts.join(', '));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEnhanceInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEnhanceData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFinalizeInputChange = (e) => {
    const { name, value } = e.target;
    setFinalizeData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddOverlay = () => {
    if (!newOverlay.text) return;
    setFinalizeData(prev => ({
      ...prev,
      overlays: [...prev.overlays, { ...newOverlay }]
    }));
    setNewOverlay({ text: '', start: 0, end: 3 });
  };

  const handleRemoveOverlay = (index) => {
    setFinalizeData(prev => ({
      ...prev,
      overlays: prev.overlays.filter((_, i) => i !== index)
    }));
  };

  const handleSelectMusic = (musicUrl) => {
    setFinalizeData(prev => ({ ...prev, musicUrl }));
    toast.success('Muzika izabrana!');
  };

  const handleGenerateVoiceover = async () => {
    if (!voiceoverScript) return toast.error('Unesite tekst za voiceover');
    setIsGeneratingVoice(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/ai/voiceover', {
        script: voiceoverScript,
        style: voiceoverStyle
      }, { headers: { Authorization: `Bearer ${token}` }});
      
      setFinalizeData(prev => ({ ...prev, voiceoverUrl: res.data.audioUrl }));
      toast.success('Voiceover generisan!');
    } catch (err) {
      toast.error('Greška pri generisanju voiceover-a');
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const pollStatus = async (predictionId) => {
    const token = localStorage.getItem('token');
    const checkStatus = async () => {
      try {
        const res = await axios.get(`/api/ai/video/status/${predictionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const { status, output } = res.data;
        
        if (status === 'succeeded') {
          setGeneratedVideos(prev => prev.map(v => 
            v.predictionId === predictionId ? { ...v, videoUrl: output, status: 'succeeded' } : v
          ));
          toast.success('Video je spreman!');
          setLoading(false);
        } else if (status === 'failed' || status === 'canceled') {
          setGeneratedVideos(prev => prev.map(v => 
            v.predictionId === predictionId ? { ...v, status: 'failed' } : v
          ));
          toast.error('Generisanje nije uspelo.');
          setLoading(false);
        } else {
          setTimeout(checkStatus, 3000);
        }
      } catch (error) {
        console.error('Error polling status:', error);
        setLoading(false);
      }
    };
    checkStatus();
  };

  const pollBracketedStatus = async (jobId) => {
    const token = localStorage.getItem('token');
    const checkStatus = async () => {
      try {
        const res = await axios.get(`/api/video/bracketing-status/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const { status, results } = res.data;
        
        if (status === 'completed') {
          setGeneratedVideos(prev => prev.map(v => {
            if (v.jobId === jobId) {
              const result = results.find(r => r.id === v.predictionId);
              return result ? { ...v, videoUrl: result.output, status: 'succeeded' } : v;
            }
            return v;
          }));
          toast.success('Varijacije su spremne!');
          setLoading(false);
        } else if (status === 'failed') {
           setGeneratedVideos(prev => prev.map(v => 
            v.jobId === jobId ? { ...v, status: 'failed' } : v
          ));
          toast.error('Generisanje varijacija nije uspelo.');
          setLoading(false);
        } else {
          setTimeout(checkStatus, 3000);
        }
      } catch (error) {
        console.error('Error polling bracketed status:', error);
        setLoading(false);
      }
    };
    checkStatus();
  };

  const handleGenerateSingle = async () => {
    if (!formData.subject && !formData.customPrompt) {
      toast.error('Unesite subjekat ili prilagođeni prompt');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/video/generate', {
        ...formData,
        negatives: formData.negatives.split(',').map(n => n.trim()).filter(n => n)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newVideo = {
        ...res.data,
        status: 'processing'
      };
      setGeneratedVideos([newVideo, ...generatedVideos]);
      
      pollStatus(res.data.predictionId);
      
      toast.info('Generisanje započeto. Molimo sačekajte...');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Greška pri generisanju');
      setLoading(false);
    }
  };

  const handleGenerateBracketed = async () => {
    if (!formData.subject && !formData.customPrompt) {
      toast.error('Unesite subjekat ili prilagođeni prompt');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/video/generate-bracketed', {
        ...formData,
        negatives: formData.negatives.split(',').map(n => n.trim()).filter(n => n)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { jobId, variations } = res.data;
      
      const newVideos = variations.map(v => ({
        ...v,
        status: 'processing',
        jobId
      }));
      
      setGeneratedVideos([...newVideos, ...generatedVideos]);
      
      pollBracketedStatus(jobId);
      
      toast.info(`Generisanje ${variations.length} varijacija započeto...`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Greška pri generisanju');
      setLoading(false);
    }
  };

  const handleEnhance = async () => {
    if (!enhanceData.videoUrl) {
      toast.error('Unesite URL videa');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/video/enhance', enhanceData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEnhancedVideo(res.data);
      toast.success('Video uspešno poboljšan!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Greška pri poboljšanju');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!finalizeData.videoUrl) {
      toast.error('Unesite URL videa');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/video/finalize', finalizeData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFinalizedVideo(res.data.url);
      toast.success('Video uspešno finalizovan!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Greška pri finalizaciji');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (templateId) => {
    const templates = {
      product_showcase: {
        shotType: 'close_up',
        style: 'commercial',
        cameraMovement: 'orbit',
        lighting: 'studio',
        mood: 'professional'
      },
      lifestyle: {
        shotType: 'medium_wide',
        style: 'cinematic',
        cameraMovement: 'steadicam',
        lighting: 'natural',
        mood: 'relaxed'
      },
      testimonial: {
        shotType: 'medium_close_up',
        style: 'documentary',
        cameraMovement: 'static',
        lighting: 'soft',
        mood: 'authentic'
      },
      tutorial: {
        shotType: 'close_up',
        style: 'minimal',
        cameraMovement: 'static',
        lighting: 'studio',
        mood: 'educational'
      },
      cinematic: {
        shotType: 'wide',
        style: 'cinematic',
        cameraMovement: 'dolly_in',
        lighting: 'dramatic',
        mood: 'epic'
      },
      social_hook: {
        shotType: 'medium',
        style: 'social',
        cameraMovement: 'handheld',
        lighting: 'natural',
        mood: 'energetic'
      }
    };

    if (templates[templateId]) {
      setFormData(prev => ({
        ...prev,
        ...templates[templateId],
        template: templateId
      }));
    }
  };

  return (
    <main className="advanced-video-generator">
      <SEO 
        title="Napredni Video Generator"
        description="Profesionalno AI generisanje videa sa naprednim opcijama"
      />

      <header className="page-header">
        <h1><FiVideo className="header-icon" aria-hidden="true" /> Napredni AI Video Generator</h1>
        <p>Kreirajte profesionalne videe sa naprednim AI opcijama</p>
      </header>

      <nav className="tabs" role="tablist" aria-label="Generator tabs">
        <button 
          className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
          role="tab"
          aria-selected={activeTab === 'generate'}
        >
          <FiVideo aria-hidden="true" /> Generisanje
        </button>
        <button 
          className={`tab ${activeTab === 'enhance' ? 'active' : ''}`}
          onClick={() => setActiveTab('enhance')}
          role="tab"
          aria-selected={activeTab === 'enhance'}
        >
          <FiZap aria-hidden="true" /> Poboljšanje
        </button>
        <button 
          className={`tab ${activeTab === 'finalize' ? 'active' : ''}`}
          onClick={() => setActiveTab('finalize')}
          role="tab"
          aria-selected={activeTab === 'finalize'}
        >
          <FiCheckCircle aria-hidden="true" /> Finalizacija
        </button>
        <button 
          className={`tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
          role="tab"
          aria-selected={activeTab === 'results'}
        >
          <FiFolder aria-hidden="true" /> Rezultati ({generatedVideos.length})
        </button>
      </nav>

      {/* GENERATE TAB */}
      {activeTab === 'generate' && (
        <div className="generate-section" role="tabpanel">
          {/* Templates */}
          <section className="section templates-section">
            <h3><FiLayers aria-hidden="true" /> Brzi Šabloni</h3>
            <div className="templates-grid">
              {presets?.templates?.map(template => (
                <button
                  key={template.id}
                  className={`template-btn ${formData.template === template.id ? 'active' : ''}`}
                  onClick={() => applyTemplate(template.id)}
                >
                  <span className="template-name">{template.name}</span>
                  <span className="template-desc">{template.description}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Main Form */}
          <div className="form-grid">
            {/* Left Column - Basic */}
            <div className="form-column">
              <section className="section">
                <h3><FiTarget aria-hidden="true" /> Osnovni Sadržaj</h3>
                
                <div className="form-group">
                  <label htmlFor="subject">Subjekat *</label>
                  <input
                    id="subject"
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="npr. elegantna žena, moderni telefon, šolja kafe"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="action">Akcija</label>
                  <input
                    id="action"
                    type="text"
                    name="action"
                    value={formData.action}
                    onChange={handleInputChange}
                    placeholder="npr. hoda kroz ulicu, rotira se, svetluca"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="setting">Lokacija/Okruženje</label>
                  <input
                    id="setting"
                    type="text"
                    name="setting"
                    value={formData.setting}
                    onChange={handleInputChange}
                    placeholder="npr. moderna kancelarija, plaža pri zalasku"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="mood">Raspoloženje/Atmosfera</label>
                  <input
                    id="mood"
                    type="text"
                    name="mood"
                    value={formData.mood}
                    onChange={handleInputChange}
                    placeholder="npr. energična, mirna, misteriozna"
                  />
                </div>
              </section>

              {/* Advanced Prompt */}
              <section className="section">
                <h3><FiEdit3 aria-hidden="true" /> Prilagođeni Prompt</h3>
                <div className="form-group">
                  <textarea
                    id="customPrompt"
                    name="customPrompt"
                    value={formData.customPrompt}
                    onChange={handleInputChange}
                    placeholder="Ili unesite potpuno prilagođeni prompt ovde..."
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="negatives"><FiSlash aria-hidden="true" /> Negativni Promptovi</label>
                  <input
                    id="negatives"
                    type="text"
                    name="negatives"
                    value={formData.negatives}
                    onChange={handleInputChange}
                    placeholder="blurry, low quality, distorted (odvojeno zarezom)"
                  />
                </div>
              </section>
            </div>

            {/* Right Column - Technical */}
            <div className="form-column">
              <section className="section">
                <h3><FiAperture aria-hidden="true" /> Vizuelni Stil</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="shotType">Kadar</label>
                    <select id="shotType" name="shotType" value={formData.shotType} onChange={handleInputChange}>
                      {presets?.shotTypes?.map(shot => (
                        <option key={shot.id} value={shot.id}>{shot.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="style">Stil</label>
                    <select id="style" name="style" value={formData.style} onChange={handleInputChange}>
                      {presets?.styles?.map(style => (
                        <option key={style.id} value={style.id}>{style.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="cameraMovement">Pokret Kamere</label>
                    <select id="cameraMovement" name="cameraMovement" value={formData.cameraMovement} onChange={handleInputChange}>
                      {presets?.cameraMovements?.map(move => (
                        <option key={move.id} value={move.id}>{move.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="lighting">Osvetljenje</label>
                    <select id="lighting" name="lighting" value={formData.lighting} onChange={handleInputChange}>
                      {presets?.lighting?.map(light => (
                        <option key={light.id} value={light.id}>{light.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section className="section">
                <h3><FiSettings aria-hidden="true" /> Tehnički Parametri</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="model">AI Model</label>
                    <select id="model" name="model" value={formData.model} onChange={handleInputChange}>
                      <option value="damo-text2video">DAMO Text-to-Video</option>
                      <option value="stable-video-diffusion">Stable Video Diffusion</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="numVariations">Broj Varijacija</label>
                    <select id="numVariations" name="numVariations" value={formData.numVariations} onChange={handleInputChange}>
                      <option value={1}>1</option>
                      <option value={3}>3 (preporučeno)</option>
                      <option value={5}>5</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="numFrames">Broj Frejmova</label>
                    <input
                      id="numFrames"
                      type="number"
                      name="numFrames"
                      value={formData.numFrames}
                      onChange={handleInputChange}
                      min={8}
                      max={64}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fps">FPS</label>
                    <select id="fps" name="fps" value={formData.fps} onChange={handleInputChange}>
                      <option value={8}>8 FPS</option>
                      <option value={12}>12 FPS</option>
                      <option value={16}>16 FPS</option>
                      <option value={24}>24 FPS</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="guidanceScale">Guidance Scale: {formData.guidanceScale}</label>
                  <input
                    id="guidanceScale"
                    type="range"
                    name="guidanceScale"
                    value={formData.guidanceScale}
                    onChange={handleInputChange}
                    min={1}
                    max={20}
                    step={0.5}
                  />
                  <small>Viša vrednost = striktnije praćenje prompta</small>
                </div>
              </section>
            </div>
          </div>

          {/* Prompt Preview */}
          <section className="section prompt-preview">
            <h3><FiEye aria-hidden="true" /> Pregled Prompta</h3>
            <div className="preview-box">
              {formData.customPrompt || promptPreview || 'Vaš prompt će se pojaviti ovde...'}
            </div>
          </section>

          {/* Generate Buttons */}
          <div className="actions">
            <button 
              className="btn-primary"
              onClick={handleGenerateSingle}
              disabled={loading}
            >
              {loading ? <><FiClock className="spin" /> Generisanje...</> : <><FiVideo /> Generiši Video</>}
            </button>
            <button 
              className="btn-secondary"
              onClick={handleGenerateBracketed}
              disabled={loading}
            >
              {loading ? <><FiClock className="spin" /> Generisanje...</> : <><FiLayers /> Generiši {formData.numVariations} Varijacije</>}
            </button>
          </div>
        </div>
      )}

      {/* ENHANCE TAB */}
      {activeTab === 'enhance' && (
        <div className="enhance-section" role="tabpanel">
          <section className="section">
            <h3><FiVideo aria-hidden="true" /> Izvorni Video</h3>
            <div className="form-group">
              <label htmlFor="enhanceVideoUrl">Video URL</label>
              <input
                id="enhanceVideoUrl"
                type="text"
                name="videoUrl"
                value={enhanceData.videoUrl}
                onChange={handleEnhanceInputChange}
                placeholder="https://example.com/video.mp4"
              />
            </div>
          </section>

          <div className="enhancement-options">
            <section className="section">
              <h3><FiMaximize2 aria-hidden="true" /> Upscaling</h3>
              <div className="checkbox-group">
                <input
                  id="upscale"
                  type="checkbox"
                  name="upscale"
                  checked={enhanceData.upscale}
                  onChange={handleEnhanceInputChange}
                />
                <label htmlFor="upscale">Omogući Upscaling</label>
              </div>
              {enhanceData.upscale && (
                <div className="form-group">
                  <label htmlFor="upscaleScale">Skaliranje</label>
                  <select id="upscaleScale" name="upscaleScale" value={enhanceData.upscaleScale} onChange={handleEnhanceInputChange}>
                    <option value={2}>2x</option>
                    <option value={4}>4x</option>
                  </select>
                </div>
              )}
            </section>

            <section className="section">
              <h3><FiActivity aria-hidden="true" /> Frame Interpolacija</h3>
              <div className="checkbox-group">
                <input
                  id="interpolate"
                  type="checkbox"
                  name="interpolate"
                  checked={enhanceData.interpolate}
                  onChange={handleEnhanceInputChange}
                />
                <label htmlFor="interpolate">Omogući Interpolaciju</label>
              </div>
              {enhanceData.interpolate && (
                <div className="form-group">
                  <label htmlFor="targetFps">Ciljani FPS</label>
                  <select id="targetFps" name="targetFps" value={enhanceData.targetFps} onChange={handleEnhanceInputChange}>
                    <option value={24}>24 FPS</option>
                    <option value={30}>30 FPS</option>
                    <option value={60}>60 FPS</option>
                  </select>
                </div>
              )}
            </section>

            <section className="section">
              <h3><FiSliders aria-hidden="true" /> Denoising</h3>
              <div className="checkbox-group">
                <input
                  id="denoise"
                  type="checkbox"
                  name="denoise"
                  checked={enhanceData.denoise}
                  onChange={handleEnhanceInputChange}
                />
                <label htmlFor="denoise">Omogući Denoising</label>
              </div>
              {enhanceData.denoise && (
                <div className="form-group">
                  <label htmlFor="denoiseStrength">Jačina</label>
                  <select id="denoiseStrength" name="denoiseStrength" value={enhanceData.denoiseStrength} onChange={handleEnhanceInputChange}>
                    <option value="light">Lagana</option>
                    <option value="medium">Srednja</option>
                    <option value="strong">Jaka</option>
                  </select>
                </div>
              )}
            </section>

            <section className="section">
              <h3><FiAperture aria-hidden="true" /> Color Grading</h3>
              <div className="form-group">
                <label htmlFor="colorGrade">Preset</label>
                <select id="colorGrade" name="colorGrade" value={enhanceData.colorGrade} onChange={handleEnhanceInputChange}>
                  <option value="">Bez promene</option>
                  {presets?.colorGrades?.map(grade => (
                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                  ))}
                </select>
              </div>
            </section>

            <section className="section">
              <h3><FiClock aria-hidden="true" /> Temporalna Stabilnost</h3>
              <div className="checkbox-group">
                <input
                  id="temporalEnhance"
                  type="checkbox"
                  name="temporalEnhance"
                  checked={enhanceData.temporalEnhance}
                  onChange={handleEnhanceInputChange}
                />
                <label htmlFor="temporalEnhance">Poboljšaj Konzistentnost</label>
              </div>
            </section>
          </div>

          <div className="actions">
            <button 
              className="btn-primary"
              onClick={handleEnhance}
              disabled={loading || !enhanceData.videoUrl}
            >
              {loading ? <><FiClock className="spin" /> Poboljšavanje...</> : <><FiZap /> Pokreni Poboljšanje</>}
            </button>
          </div>

          {enhancedVideo && (
            <section className="section result-section">
              <h3><FiVideo aria-hidden="true" /> Poboljšani Video</h3>
              <video controls src={enhancedVideo.output} style={{ maxWidth: '100%' }} />
              <div className="result-info">
                <p>Primenjene obrade: {enhancedVideo.appliedEnhancements?.join(', ')}</p>
                <a href={enhancedVideo.output} download className="btn-download">
                  <FiDownload /> Preuzmi
                </a>
              </div>
            </section>
          )}
        </div>
      )}

      {/* FINALIZE TAB */}
      {activeTab === 'finalize' && (
        <div className="finalize-section" role="tabpanel">
          <section className="section">
            <h3><FiVideo aria-hidden="true" /> Izvorni Video</h3>
            <div className="form-group">
              <label htmlFor="finalizeVideoUrl">Video URL *</label>
              <input
                id="finalizeVideoUrl"
                type="text"
                name="videoUrl"
                value={finalizeData.videoUrl}
                onChange={handleFinalizeInputChange}
                placeholder="https://example.com/video.mp4"
              />
            </div>
            <p className="hint">Unesite URL generisanog videa ili izaberite iz Rezultata taba</p>
          </section>

          <div className="form-grid">
            {/* Audio Section */}
            <div className="form-column">
              <section className="section">
                <h3><FiMic aria-hidden="true" /> Voiceover</h3>
                
                <div className="form-group">
                  <label htmlFor="voiceoverUrl">Voiceover URL (MP3)</label>
                  <input
                    id="voiceoverUrl"
                    type="text"
                    name="voiceoverUrl"
                    value={finalizeData.voiceoverUrl}
                    onChange={handleFinalizeInputChange}
                    placeholder="https://example.com/voice.mp3"
                  />
                </div>

                <div className="divider">ili generiši novi</div>

                <div className="form-group">
                  <label htmlFor="voiceoverScript">Tekst za Voiceover</label>
                  <textarea
                    id="voiceoverScript"
                    value={voiceoverScript}
                    onChange={(e) => setVoiceoverScript(e.target.value)}
                    placeholder="Unesite tekst koji će biti izgovoren..."
                    rows={3}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="voiceoverStyle">Stil Glasa</label>
                    <select 
                      id="voiceoverStyle" 
                      value={voiceoverStyle} 
                      onChange={(e) => setVoiceoverStyle(e.target.value)}
                    >
                      <option value="energetic">Energičan</option>
                      <option value="calm">Miran</option>
                      <option value="professional">Profesionalan</option>
                      <option value="friendly">Prijateljski</option>
                    </select>
                  </div>
                  <button 
                    className="btn-secondary"
                    onClick={handleGenerateVoiceover}
                    disabled={isGeneratingVoice || !voiceoverScript}
                  >
                    {isGeneratingVoice ? <FiClock className="spin" /> : <FiMic />} Generiši
                  </button>
                </div>
              </section>

              <section className="section">
                <h3><FiMusic aria-hidden="true" /> Pozadinska Muzika</h3>
                
                <div className="form-group">
                  <label htmlFor="musicUrl">Music URL (MP3)</label>
                  <input
                    id="musicUrl"
                    type="text"
                    name="musicUrl"
                    value={finalizeData.musicUrl}
                    onChange={handleFinalizeInputChange}
                    placeholder="https://example.com/music.mp3"
                  />
                </div>

                <div className="divider">ili izaberi iz biblioteke</div>

                <div className="stock-music-list">
                  {stockMusic.map((track, index) => (
                    <div 
                      key={index} 
                      className={`music-item ${finalizeData.musicUrl === track.url ? 'selected' : ''}`}
                      onClick={() => handleSelectMusic(track.url)}
                    >
                      <FiVolume2 />
                      <div className="music-info">
                        <span className="music-name">{track.name}</span>
                        <span className="music-category">{track.category}</span>
                      </div>
                      {finalizeData.musicUrl === track.url && <FiCheckCircle className="check-icon" />}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Subtitles Section */}
            <div className="form-column">
              <section className="section">
                <h3><FiType aria-hidden="true" /> Tekstualni Titlovi (Subtitles)</h3>
                <p className="section-desc">Dodajte tekst koji će se pojaviti na videu u određeno vreme</p>
                
                <div className="overlays-list">
                  {finalizeData.overlays.length === 0 ? (
                    <p className="empty-hint">Nema dodatih titlova. Dodajte prvi ispod.</p>
                  ) : (
                    finalizeData.overlays.map((overlay, index) => (
                      <div key={index} className="overlay-item">
                        <div className="overlay-info">
                          <span className="overlay-text">"{overlay.text}"</span>
                          <span className="overlay-time">{overlay.start}s - {overlay.end}s</span>
                        </div>
                        <button 
                          className="btn-icon-small"
                          onClick={() => handleRemoveOverlay(index)}
                          aria-label="Ukloni"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="add-overlay-form">
                  <div className="form-group">
                    <label htmlFor="overlayText">Tekst Titla</label>
                    <input
                      id="overlayText"
                      type="text"
                      value={newOverlay.text}
                      onChange={(e) => setNewOverlay({...newOverlay, text: e.target.value})}
                      placeholder="Unesite tekst koji će se prikazati..."
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="overlayStart">Početak (sekunde)</label>
                      <input
                        id="overlayStart"
                        type="number"
                        step="0.5"
                        min="0"
                        value={newOverlay.start}
                        onChange={(e) => setNewOverlay({...newOverlay, start: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="overlayEnd">Kraj (sekunde)</label>
                      <input
                        id="overlayEnd"
                        type="number"
                        step="0.5"
                        min="0"
                        value={newOverlay.end}
                        onChange={(e) => setNewOverlay({...newOverlay, end: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                  <button 
                    className="btn-secondary"
                    onClick={handleAddOverlay}
                    disabled={!newOverlay.text}
                  >
                    <FiPlus /> Dodaj Titl
                  </button>
                </div>
              </section>
            </div>
          </div>

          <div className="actions">
            <button 
              className="btn-primary"
              onClick={handleFinalize}
              disabled={loading || !finalizeData.videoUrl}
            >
              {loading ? <><FiClock className="spin" /> Finalizacija...</> : <><FiCheckCircle /> Finalizuj Video</>}
            </button>
          </div>

          {finalizedVideo && (
            <section className="section result-section">
              <h3><FiVideo aria-hidden="true" /> Finalni Video</h3>
              <video controls src={finalizedVideo} style={{ maxWidth: '100%' }} />
              <div className="result-info">
                <a href={finalizedVideo} download className="btn-download">
                  <FiDownload /> Preuzmi Finalni Video
                </a>
              </div>
            </section>
          )}
        </div>
      )}

      {/* RESULTS TAB */}
      {activeTab === 'results' && (
        <div className="results-section" role="tabpanel">
          {generatedVideos.length === 0 ? (
            <div className="empty-state">
              <FiVideo size={48} />
              <p>Nema generisanih videa. Idite na tab "Generisanje" da kreirate video.</p>
            </div>
          ) : (
            <div className="videos-grid">
              {generatedVideos.map((video, index) => (
                <article key={index} className="video-card">
                  {video.status === 'processing' ? (
                    <div className="video-placeholder processing">
                      <FiClock className="spin" />
                      <p>Generisanje u toku...</p>
                    </div>
                  ) : video.status === 'failed' ? (
                    <div className="video-placeholder error">
                      <FiSlash />
                      <p>Generisanje nije uspelo</p>
                    </div>
                  ) : (
                    <video controls src={video.videoUrl || video.output}>
                      Vaš pregledač ne podržava video tag.
                    </video>
                  )}
                  <div className="video-info">
                    {video.seed && <span className="seed">Seed: {video.seed}</span>}
                    {video.qualityScore && (
                      <span className="quality">Kvalitet: {(video.qualityScore * 100).toFixed(0)}%</span>
                    )}
                    <div className="video-actions">
                      <a 
                        href={video.videoUrl || video.output} 
                        download 
                        className="btn-small"
                        aria-label="Preuzmi"
                      >
                        <FiDownload />
                      </a>
                      <button 
                        className="btn-small"
                        onClick={() => {
                          setEnhanceData(prev => ({
                            ...prev,
                            videoUrl: video.videoUrl || video.output
                          }));
                          setActiveTab('enhance');
                        }}
                        aria-label="Poboljšaj"
                      >
                        <FiZap />
                      </button>
                      <button 
                        className="btn-small"
                        onClick={() => {
                          setFinalizeData(prev => ({
                            ...prev,
                            videoUrl: video.videoUrl || video.output
                          }));
                          setActiveTab('finalize');
                        }}
                        aria-label="Finalizuj"
                      >
                        <FiCheckCircle />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default AdvancedVideoGenerator;
