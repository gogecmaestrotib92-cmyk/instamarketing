import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FiVideo, FiMusic, FiType, FiPlay, FiX, FiCheck, FiUpload, FiVolume2, FiPlus, FiTrash2, FiClock } from 'react-icons/fi';
import axios from 'axios';
import './CreateVideo.css';

// Types
const PRESET_TRACKS = [
  { label: 'Ambient Flow', url: '/audio/ambient1.mp3' },
  { label: 'Uplifting Beat', url: '/audio/uplift1.mp3' },
  { label: 'Soft Piano', url: '/audio/piano1.mp3' },
];

// MusicModal Component
const MusicModal = ({ isOpen, onClose, onApply }) => {
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [volume, setVolume] = useState(0.35);

  if (!isOpen) return null;

  const handleApply = () => {
    const config = {
      enabled: true,
      trackUrl: uploadedFile ? null : selectedTrack,
      uploadedFileName: uploadedFile ? uploadedFile.name : null,
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
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2><FiMusic /> Add Background Music</h2>
          <button onClick={onClose} className="modal-close"><FiX /></button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Select Preset Track</label>
            <select
              value={selectedTrack || ''}
              onChange={(e) => {
                setSelectedTrack(e.target.value || null);
                setUploadedFile(null);
              }}
            >
              <option value="">-- Choose a track --</option>
              {PRESET_TRACKS.map((track) => (
                <option key={track.url} value={track.url}>{track.label}</option>
              ))}
            </select>
          </div>

          <div className="divider"><span>or</span></div>

          <div className="form-group">
            <label>Upload Custom Audio</label>
            <div className="file-upload">
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file) {
                    setUploadedFile(file);
                    setSelectedTrack(null);
                  }
                }}
                id="audio-upload"
              />
              <label htmlFor="audio-upload" className="file-upload-btn">
                <FiUpload /> {uploadedFile ? uploadedFile.name : 'Click to upload audio file'}
              </label>
            </div>
          </div>

          <div className="form-group">
            <label><FiVolume2 /> Volume: {Math.round(volume * 100)}%</label>
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
          <button onClick={handleRemove} className="btn-text-danger">Remove Music</button>
          <div className="modal-footer-actions">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleApply} disabled={!hasSelection} className="btn-primary">
              <FiCheck /> Apply Music
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// TextModal Component
const TextModal = ({ isOpen, onClose, onApply }) => {
  const [overlayText, setOverlayText] = useState('');
  const [captions, setCaptions] = useState([]);
  const [newText, setNewText] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleAddCaption = () => {
    setError(null);

    if (!newText.trim()) {
      setError('Caption text is required');
      return;
    }

    const startNum = parseFloat(newStart);
    const endNum = parseFloat(newEnd);

    if (isNaN(startNum) || startNum < 0) {
      setError('Start time must be a valid positive number');
      return;
    }

    if (isNaN(endNum) || endNum <= startNum) {
      setError('End time must be greater than start time');
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
    <div className="modal-overlay">
      <div className="modal-card modal-card-wide">
        <div className="modal-header">
          <h2><FiType /> Add Text & Captions</h2>
          <button onClick={onClose} className="modal-close"><FiX /></button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Overlay Text (displayed throughout video)</label>
            <textarea
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              placeholder="Enter text to display on video..."
              rows={2}
            />
          </div>

          <div className="divider"><span>Timed Captions</span></div>

          <div className="caption-form">
            <div className="form-group">
              <label>Caption Text</label>
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Enter caption text..."
              />
            </div>

            <div className="caption-timing">
              <div className="form-group">
                <label><FiClock /> Start (sec)</label>
                <input
                  type="number"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label><FiClock /> End (sec)</label>
                <input
                  type="number"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  placeholder="3"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            {error && <p className="error-text">{error}</p>}

            <button onClick={handleAddCaption} className="btn-add-caption">
              <FiPlus /> Add Caption
            </button>
          </div>

          {captions.length > 0 && (
            <div className="caption-list">
              <label>Captions ({captions.length})</label>
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
              <p>No captions added yet</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={handleRemove} className="btn-text-danger">Remove Text</button>
          <div className="modal-footer-actions">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleApply} disabled={!hasContent} className="btn-primary">
              <FiCheck /> Apply Text
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main CreateVideo Page
const CreateVideo = () => {
  const [script, setScript] = useState('');
  const [musicConfig, setMusicConfig] = useState(null);
  const [textConfig, setTextConfig] = useState(null);
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isTextOpen, setIsTextOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!script.trim()) {
      toast.error('Please enter a script for your video');
      return;
    }

    setError(null);
    setResultUrl(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/video/generate', {
        script: script.trim(),
        musicConfig,
        textConfig,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success || response.data.url || response.data.predictionId) {
        setResultUrl(response.data.url || 'Processing...');
        toast.success('Video generation started!');
      } else {
        throw new Error(response.data.error || 'Failed to generate video');
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'An error occurred';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-video-page">
      <div className="create-video-container">
        {/* Header */}
        <div className="page-header">
          <div className="header-icon">
            <FiVideo />
          </div>
          <h1>Create AI Video</h1>
          <p>Enter your script and customize music & text overlays</p>
        </div>

        {/* Main Card */}
        <div className="main-card">
          {/* Script Input */}
          <div className="form-group">
            <label>Video Script (Voiceover Text)</label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Enter the script for your AI video. This will be used as the voiceover narration..."
              rows={6}
            />
            <span className="char-count">{script.length} characters</span>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button 
              onClick={() => setIsMusicOpen(true)} 
              className={`btn-action btn-music ${musicConfig ? 'active' : ''}`}
            >
              <FiMusic /> 
              {musicConfig ? 'Music Added ✓' : 'Add Music'}
            </button>
            <button 
              onClick={() => setIsTextOpen(true)} 
              className={`btn-action btn-text ${textConfig ? 'active' : ''}`}
            >
              <FiType /> 
              {textConfig ? 'Text Added ✓' : 'Add Text'}
            </button>
          </div>

          {/* Config Summary */}
          {(musicConfig || textConfig) && (
            <div className="config-summary">
              <h4>Configuration</h4>
              {musicConfig && (
                <div className="config-item">
                  <span className="config-dot purple"></span>
                  <span>Music: {musicConfig.uploadedFileName || musicConfig.trackUrl?.split('/').pop() || 'Selected'}</span>
                  <span className="config-detail">({Math.round(musicConfig.volume * 100)}% volume)</span>
                </div>
              )}
              {textConfig && (
                <div className="config-item">
                  <span className="config-dot blue"></span>
                  <span>
                    Text: {textConfig.overlayText ? `"${textConfig.overlayText.substring(0, 30)}${textConfig.overlayText.length > 30 ? '...' : ''}"` : ''}
                    {textConfig.captions.length > 0 && ` + ${textConfig.captions.length} caption${textConfig.captions.length !== 1 ? 's' : ''}`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="error-box">
              <p>{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-generate"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Generating Video...
              </>
            ) : (
              <>
                <FiPlay /> Generate Video
              </>
            )}
          </button>

          {/* Result */}
          {resultUrl && (
            <div className="result-box">
              <div className="result-header">
                <FiCheck />
                <span>Video Generated Successfully!</span>
              </div>
              <a href={resultUrl} target="_blank" rel="noopener noreferrer">
                {resultUrl}
              </a>
            </div>
          )}
        </div>

        {/* Debug Payload */}
        <details className="debug-section">
          <summary>View API Payload</summary>
          <pre>
            {JSON.stringify({ script: script.trim(), musicConfig, textConfig }, null, 2)}
          </pre>
        </details>
      </div>

      {/* Modals */}
      <MusicModal
        isOpen={isMusicOpen}
        onClose={() => setIsMusicOpen(false)}
        onApply={setMusicConfig}
      />

      <TextModal
        isOpen={isTextOpen}
        onClose={() => setIsTextOpen(false)}
        onApply={setTextConfig}
      />
    </div>
  );
};

export default CreateVideo;
