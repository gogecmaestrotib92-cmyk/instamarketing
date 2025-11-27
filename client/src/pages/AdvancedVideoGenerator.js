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
  FiPlay, 
  FiLayers,
  FiActivity,
  FiAperture,
  FiCamera,
  FiSun,
  FiSmile,
  FiMic,
  FiEdit3,
  FiSlash,
  FiMonitor,
  FiClock,
  FiMaximize2,
  FiSliders
} from 'react-icons/fi';
import SEO from '../components/SEO';
import './AdvancedVideoGenerator.css';

const AdvancedVideoGenerator = () => {
  const [activeTab, setActiveTab] = useState('generate');
  const [loading, setLoading] = useState(false);
  const [presets, setPresets] = useState(null);
  const [generatedVideos, setGeneratedVideos] = useState([]);
  const [enhancedVideo, setEnhancedVideo] = useState(null);
  
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

  // Built prompt preview
  const [promptPreview, setPromptPreview] = useState('');

  useEffect(() => {
    fetchPresets();
  }, []);

  useEffect(() => {
    buildPromptPreview();
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

  const buildPromptPreview = async () => {
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

      setGeneratedVideos([res.data]);
      toast.success('Video uspešno generisan!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Greška pri generisanju');
    } finally {
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

      setGeneratedVideos(res.data.results || []);
      toast.success(`${res.data.results?.length || 0} video varijacija generisano!`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Greška pri generisanju');
    } finally {
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
        shotType: 'extreme_close_up',
        style: 'social',
        cameraMovement: 'zoom_in',
        lighting: 'dramatic',
        mood: 'exciting'
      }
    };

    if (templates[templateId]) {
      setFormData(prev => ({
        ...prev,
        ...templates[templateId],
        template: templateId
      }));
      toast.info(`Šablon "${templateId}" primenjen`);
    }
  };

  return (
    <div className="advanced-video-generator">
      <SEO 
        title="Napredni Video Generator"
        description="Profesionalno AI generisanje videa sa naprednim opcijama"
      />

      <div className="page-header">
        <h1><FiVideo className="header-icon" /> Napredni AI Video Generator</h1>
        <p>Kreirajte profesionalne videe sa naprednim AI opcijama</p>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          <FiVideo /> Generisanje
        </button>
        <button 
          className={`tab ${activeTab === 'enhance' ? 'active' : ''}`}
          onClick={() => setActiveTab('enhance')}
        >
          <FiZap /> Poboljšanje
        </button>
        <button 
          className={`tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          <FiFolder /> Rezultati ({generatedVideos.length})
        </button>
      </div>

      {activeTab === 'generate' && (
        <div className="generate-section">
          {/* Templates */}
          <div className="section templates-section">
            <h3><FiLayers /> Brzi Šabloni</h3>
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
          </div>

          {/* Main Form */}
          <div className="form-grid">
            {/* Left Column - Basic */}
            <div className="form-column">
              <div className="section">
                <h3><FiTarget /> Osnovni Sadržaj</h3>
                
                <div className="form-group">
                  <label>Subjekat *</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="npr. elegantna žena, moderni telefon, šolja kafe"
                  />
                </div>

                <div className="form-group">
                  <label>Akcija</label>
                  <input
                    type="text"
                    name="action"
                    value={formData.action}
                    onChange={handleInputChange}
                    placeholder="npr. hoda kroz ulicu, rotira se, svetluca"
                  />
                </div>

                <div className="form-group">
                  <label>Lokacija/Okruženje</label>
                  <input
                    type="text"
                    name="setting"
                    value={formData.setting}
                    onChange={handleInputChange}
                    placeholder="npr. moderna kancelarija, plaža pri zalasku, urbana ulica"
                  />
                </div>

                <div className="form-group">
                  <label>Raspoloženje/Atmosfera</label>
                  <input
                    type="text"
                    name="mood"
                    value={formData.mood}
                    onChange={handleInputChange}
                    placeholder="npr. energična, mirna, misteriozna, vesela"
                  />
                </div>
              </div>

              {/* Advanced Prompt */}
              <div className="section">
                <h3><FiEdit3 /> Prilagođeni Prompt</h3>
                <div className="form-group">
                  <textarea
                    name="customPrompt"
                    value={formData.customPrompt}
                    onChange={handleInputChange}
                    placeholder="Ili unesite potpuno prilagođeni prompt ovde..."
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label><FiSlash /> Negativni Promptovi (šta izbegavati)</label>
                  <input
                    type="text"
                    name="negatives"
                    value={formData.negatives}
                    onChange={handleInputChange}
                    placeholder="blurry, low quality, distorted (odvojeno zarezom)"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Technical */}
            <div className="form-column">
              <div className="section">
                <h3><FiAperture /> Vizuelni Stil</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label>Kadar</label>
                    <select name="shotType" value={formData.shotType} onChange={handleInputChange}>
                      {presets?.shotTypes?.map(shot => (
                        <option key={shot.id} value={shot.id}>{shot.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Stil</label>
                    <select name="style" value={formData.style} onChange={handleInputChange}>
                      {presets?.styles?.map(style => (
                        <option key={style.id} value={style.id}>{style.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Pokret Kamere</label>
                    <select name="cameraMovement" value={formData.cameraMovement} onChange={handleInputChange}>
                      {presets?.cameraMovements?.map(move => (
                        <option key={move.id} value={move.id}>{move.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Osvetljenje</label>
                    <select name="lighting" value={formData.lighting} onChange={handleInputChange}>
                      {presets?.lighting?.map(light => (
                        <option key={light.id} value={light.id}>{light.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="section">
                <h3><FiSettings /> Tehnički Parametri</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label>AI Model</label>
                    <select name="model" value={formData.model} onChange={handleInputChange}>
                      <option value="damo-text2video">DAMO Text-to-Video</option>
                      <option value="stable-video-diffusion">Stable Video Diffusion</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Broj Varijacija</label>
                    <select name="numVariations" value={formData.numVariations} onChange={handleInputChange}>
                      <option value={1}>1</option>
                      <option value={3}>3 (preporučeno)</option>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Broj Frejmova</label>
                    <input
                      type="number"
                      name="numFrames"
                      value={formData.numFrames}
                      onChange={handleInputChange}
                      min={8}
                      max={64}
                    />
                  </div>

                  <div className="form-group">
                    <label>FPS</label>
                    <select name="fps" value={formData.fps} onChange={handleInputChange}>
                      <option value={8}>8 FPS</option>
                      <option value={12}>12 FPS</option>
                      <option value={16}>16 FPS</option>
                      <option value={24}>24 FPS</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Guidance Scale: {formData.guidanceScale}</label>
                  <input
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
              </div>
            </div>
          </div>

          {/* Prompt Preview */}
          <div className="section prompt-preview">
            <h3><FiEye /> Pregled Prompta</h3>
            <div className="preview-box">
              {formData.customPrompt || promptPreview || 'Vaš prompt će se pojaviti ovde...'}
            </div>
          </div>

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

      {activeTab === 'enhance' && (
        <div className="enhance-section">
          <div className="section">
            <h3><FiVideo /> Izvorni Video</h3>
            <div className="form-group">
              <label>Video URL</label>
              <input
                type="text"
                name="videoUrl"
                value={enhanceData.videoUrl}
                onChange={handleEnhanceInputChange}
                placeholder="https://example.com/video.mp4"
              />
            </div>
          </div>

          <div className="enhancement-options">
            <div className="section">
              <h3><FiMaximize2 /> Upscaling</h3>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  name="upscale"
                  checked={enhanceData.upscale}
                  onChange={handleEnhanceInputChange}
                />
                <label>Omogući Upscaling</label>
              </div>
              {enhanceData.upscale && (
                <div className="form-group">
                  <label>Skaliranje</label>
                  <select name="upscaleScale" value={enhanceData.upscaleScale} onChange={handleEnhanceInputChange}>
                    <option value={2}>2x</option>
                    <option value={4}>4x</option>
                  </select>
                </div>
              )}
            </div>

            <div className="section">
              <h3><FiActivity /> Frame Interpolacija</h3>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  name="interpolate"
                  checked={enhanceData.interpolate}
                  onChange={handleEnhanceInputChange}
                />
                <label>Omogući Interpolaciju</label>
              </div>
              {enhanceData.interpolate && (
                <div className="form-group">
                  <label>Ciljani FPS</label>
                  <select name="targetFps" value={enhanceData.targetFps} onChange={handleEnhanceInputChange}>
                    <option value={24}>24 FPS</option>
                    <option value={30}>30 FPS</option>
                    <option value={60}>60 FPS</option>
                  </select>
                </div>
              )}
            </div>

            <div className="section">
              <h3><FiSliders /> Denoising</h3>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  name="denoise"
                  checked={enhanceData.denoise}
                  onChange={handleEnhanceInputChange}
                />
                <label>Omogući Denoising</label>
              </div>
              {enhanceData.denoise && (
                <div className="form-group">
                  <label>Jačina</label>
                  <select name="denoiseStrength" value={enhanceData.denoiseStrength} onChange={handleEnhanceInputChange}>
                    <option value="light">Lagana</option>
                    <option value="medium">Srednja</option>
                    <option value="strong">Jaka</option>
                  </select>
                </div>
              )}
            </div>

            <div className="section">
              <h3><FiAperture /> Color Grading</h3>
              <div className="form-group">
                <label>Preset</label>
                <select name="colorGrade" value={enhanceData.colorGrade} onChange={handleEnhanceInputChange}>
                  <option value="">Bez promene</option>
                  {presets?.colorGrades?.map(grade => (
                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="section">
              <h3><FiClock /> Temporalna Stabilnost</h3>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  name="temporalEnhance"
                  checked={enhanceData.temporalEnhance}
                  onChange={handleEnhanceInputChange}
                />
                <label>Poboljšaj Konzistentnost Između Frejmova</label>
              </div>
            </div>
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
            <div className="section result-section">
              <h3><FiVideo /> Poboljšani Video</h3>
              <video controls src={enhancedVideo.output} style={{ maxWidth: '100%' }} />
              <div className="result-info">
                <p>Primenjene obrade: {enhancedVideo.appliedEnhancements?.join(', ')}</p>
                <a href={enhancedVideo.output} download className="btn-download">
                  <FiDownload /> Preuzmi
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="results-section">
          {generatedVideos.length === 0 ? (
            <div className="empty-state">
              <p>Nema generisanih videa. Idite na tab "Generisanje" da kreirate video.</p>
            </div>
          ) : (
            <div className="videos-grid">
              {generatedVideos.map((video, index) => (
                <div key={index} className="video-card">
                  <video controls src={video.videoUrl || video.output}>
                    Vaš pregledač ne podržava video tag.
                  </video>
                  <div className="video-info">
                    {video.seed && <span className="seed">Seed: {video.seed}</span>}
                    {video.qualityScore && (
                      <span className="quality">Kvalitet: {(video.qualityScore * 100).toFixed(0)}%</span>
                    )}
                    <div className="video-actions">
                      <a href={video.videoUrl || video.output} download className="btn-small">
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
                      >
                        <FiZap />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedVideoGenerator;
