import React from 'react';
import { FiMusic, FiType } from 'react-icons/fi';
import './NewVideoForm.css';

/**
 * NewVideoForm Component
 * Modern, clean video generation form
 * 
 * @param {string} activeTab - Current tab ('text-to-video' or 'image-to-video')
 * @param {Function} onTabChange - Tab change handler
 * @param {string} prompt - Current prompt value
 * @param {Function} onPromptChange - Prompt change handler
 * @param {number} duration - Selected duration
 * @param {Function} onDurationChange - Duration change handler
 * @param {boolean} loading - Loading state
 * @param {Function} onGenerate - Generate button handler
 * @param {Function} onMusicClick - Music button handler
 * @param {Function} onTextClick - Text button handler
 * @param {boolean} hasMusicConfig - Whether music is configured
 * @param {boolean} hasTextConfig - Whether text is configured
 */

const SUGGESTIONS = [
  "Cinematic drone shot flying over ocean waves at sunset",
  "Abstract colorful liquid flowing in slow motion",
  "Futuristic city with flying cars and neon lights",
  "Ocean waves crashing on rocks, golden hour"
];

const NewVideoForm = ({
  activeTab = 'text-to-video',
  onTabChange,
  prompt = '',
  onPromptChange,
  duration = 5,
  onDurationChange,
  loading = false,
  onGenerate,
  onMusicClick,
  onTextClick,
  hasMusicConfig = false,
  hasTextConfig = false,
  // Image upload props
  imagePreview,
  onImageChange,
  onImageRemove
}) => {
  return (
    <div className="video-generator">
      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'text-to-video' ? 'tab--active' : ''}`}
          onClick={() => onTabChange?.('text-to-video')}
        >
          Text to Video
        </button>
        <button 
          className={`tab ${activeTab === 'image-to-video' ? 'tab--active' : ''}`}
          onClick={() => onTabChange?.('image-to-video')}
        >
          Image to Video
        </button>
      </div>

      {/* Image Upload (for image-to-video) */}
      {activeTab === 'image-to-video' && (
        <section className="section">
          <label className="label">Izaberite sliku za animaciju</label>
          <div className="image-upload-area">
            {imagePreview ? (
              <div className="image-preview-container">
                <img src={imagePreview} alt="Preview" className="image-preview-img" />
                <button className="image-remove-btn" onClick={onImageRemove}>
                  Ukloni
                </button>
              </div>
            ) : (
              <label className="upload-placeholder">
                <span className="upload-icon">🖼️</span>
                <span>Kliknite za upload slike</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  hidden
                />
              </label>
            )}
          </div>
        </section>
      )}

      {/* Description */}
      <section className="section">
        <label className="label">
          {activeTab === 'text-to-video' 
            ? 'Opišite video koji želite' 
            : 'Opišite željenu animaciju (opciono)'}
        </label>
        <textarea
          className="textarea"
          placeholder={activeTab === 'text-to-video'
            ? "Npr: Cinematic drone shot of sunset over ocean waves, golden hour lighting, 4K kvalitet..."
            : "Npr: Slow zoom in with gentle movement, cinematic feel..."
          }
          value={prompt}
          onChange={(e) => onPromptChange?.(e.target.value)}
        />
      </section>

      {/* Suggestions */}
      {activeTab === 'text-to-video' && (
        <section className="section">
          <label className="label">Predlozi</label>
          <div className="chips">
            {SUGGESTIONS.map((suggestion, index) => (
              <button 
                key={index}
                className="chip"
                onClick={() => onPromptChange?.(suggestion)}
              >
                {suggestion.length > 40 ? suggestion.substring(0, 40) + '...' : suggestion}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Duration + Format */}
      <section className="row">
        <div className="section half">
          <label className="label">Trajanje</label>
          <select 
            className="select"
            value={duration}
            onChange={(e) => onDurationChange?.(Number(e.target.value))}
          >
            <option value={5}>5 sekundi</option>
            <option value={10}>10 sekundi</option>
          </select>
        </div>

        <div className="section half">
          <label className="label">Format</label>
          <button className="format-btn">📱 9:16 (Reels / TikTok)</button>
        </div>
      </section>

      {/* Music + Text */}
      <section className="row">
        <button 
          className={`addon-btn ${hasMusicConfig ? 'addon-btn--active' : ''}`}
          onClick={onMusicClick}
        >
          <FiMusic /> {hasMusicConfig ? 'Muzika ✓' : 'Dodaj Muziku'}
        </button>
        <button 
          className={`addon-btn ${hasTextConfig ? 'addon-btn--active' : ''}`}
          onClick={onTextClick}
        >
          <FiType /> {hasTextConfig ? 'Tekst ✓' : 'Dodaj Tekst'}
        </button>
      </section>

      {/* Generate button */}
      <button 
        className="generate-btn"
        onClick={onGenerate}
        disabled={loading}
      >
        {loading ? (
          <>⏳ Generisanje u toku... (1-3 min)</>
        ) : (
          <>⚡ Generiši Video</>
        )}
      </button>

      {/* Cost Info */}
      <p className="cost-info">
        Procenjeno vreme: 1-3 minuta | Cena: ~$0.25-0.50 po videu
      </p>
    </div>
  );
};

export default NewVideoForm;
