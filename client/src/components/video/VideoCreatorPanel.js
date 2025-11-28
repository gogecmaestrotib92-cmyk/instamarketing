import React, { useState, useRef, useEffect } from 'react';
import { FiMusic, FiType, FiPlay, FiPause, FiVideo, FiCheck, FiArrowRight, FiArrowLeft, FiEye } from 'react-icons/fi';
import { MusicSelector } from './MusicSelector';
import { CaptionEditor } from './CaptionEditor';
import { useVideoGenerator } from '../../hooks/useVideoGenerator';
import './VideoCreatorPanel.css';

export const VideoCreatorPanel = ({ 
  onVideoGenerated,
  defaultPrompt = '',
  defaultDuration = 10,
  showPreview = true
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [duration, setDuration] = useState(defaultDuration);
  const [style, setStyle] = useState('cinematic');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const previewVideoRef = useRef(null);
  
  const {
    musicLibrary,
    textCaptions,
    isGenerating,
    progress,
    error,
    result,
    generateVideo,
    generateWithPresets,
    reset
  } = useVideoGenerator();

  const steps = [
    { id: 1, title: 'Video Settings', icon: FiVideo },
    { id: 2, title: 'Add Music', icon: FiMusic },
    { id: 3, title: 'Add Captions', icon: FiType },
    { id: 4, title: 'Preview & Generate', icon: FiPlay }
  ];

  const styles = [
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'anime', label: 'Anime' },
    { value: 'realistic', label: 'Realistic' },
    { value: 'abstract', label: 'Abstract' },
    { value: 'vintage', label: 'Vintage' },
    { value: 'neon', label: 'Neon' }
  ];

  const aspectRatios = [
    { value: '16:9', label: '16:9 (Landscape)' },
    { value: '9:16', label: '9:16 (Portrait/Reels)' },
    { value: '1:1', label: '1:1 (Square)' },
    { value: '4:3', label: '4:3 (Classic)' }
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return prompt.trim().length > 0 && duration > 0;
      case 2:
        return true; // Music is optional
      case 3:
        return true; // Captions are optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    const videoOptions = {
      prompt,
      duration,
      style,
      aspectRatio
    };

    const result = await generateVideo(videoOptions);
    
    if (result && onVideoGenerated) {
      onVideoGenerated(result);
    }
  };

  const handlePresetGenerate = async (presetName) => {
    const videoOptions = {
      prompt,
      duration,
      style,
      aspectRatio
    };

    const result = await generateWithPresets(videoOptions, presetName);
    
    if (result && onVideoGenerated) {
      onVideoGenerated(result);
    }
  };

  // Effect to notify parent when result changes
  useEffect(() => {
    if (result && onVideoGenerated) {
      onVideoGenerated(result);
    }
  }, [result, onVideoGenerated]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content video-settings">
            <div className="form-group">
              <label htmlFor="prompt">Video Prompt</label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want to create... e.g., 'A serene sunset over the ocean with gentle waves'"
                rows={4}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="duration">Duration (seconds)</label>
                <input
                  type="number"
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 10)}
                  min={1}
                  max={60}
                />
              </div>

              <div className="form-group">
                <label htmlFor="style">Style</label>
                <select
                  id="style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                >
                  {styles.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="aspectRatio">Aspect Ratio</label>
                <select
                  id="aspectRatio"
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                >
                  {aspectRatios.map(ar => (
                    <option key={ar.value} value={ar.value}>{ar.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content music-step">
            <MusicSelector
              selectedMusic={musicLibrary.selectedMusic}
              onMusicSelect={musicLibrary.selectMusic}
              isPlaying={musicLibrary.isPlaying}
              onPlayPause={() => musicLibrary.isPlaying ? musicLibrary.pause() : musicLibrary.preview()}
              volume={musicLibrary.volume}
              onVolumeChange={musicLibrary.setVolume}
              onAddCustomTrack={musicLibrary.addCustomTrack}
            />
          </div>
        );

      case 3:
        return (
          <div className="step-content captions-step">
            <CaptionEditor
              captions={textCaptions.captions}
              onAddCaption={textCaptions.addCaption}
              onUpdateCaption={textCaptions.updateCaption}
              onDeleteCaption={textCaptions.deleteCaption}
              onReorderCaptions={textCaptions.reorderCaptions}
              videoDuration={duration}
              onExportSRT={textCaptions.exportSRT}
            />
          </div>
        );

      case 4:
        return (
          <div className="step-content preview-generate">
            <div className="preview-summary">
              <h3>Video Summary</h3>
              
              <div className="summary-section">
                <h4><FiVideo /> Video Settings</h4>
                <div className="summary-item">
                  <span>Prompt:</span>
                  <p>{prompt}</p>
                </div>
                <div className="summary-row">
                  <div className="summary-item">
                    <span>Duration:</span>
                    <p>{duration} seconds</p>
                  </div>
                  <div className="summary-item">
                    <span>Style:</span>
                    <p>{styles.find(s => s.value === style)?.label}</p>
                  </div>
                  <div className="summary-item">
                    <span>Aspect Ratio:</span>
                    <p>{aspectRatio}</p>
                  </div>
                </div>
              </div>

              <div className="summary-section">
                <h4><FiMusic /> Music</h4>
                {musicLibrary.selectedMusic ? (
                  <div className="summary-item">
                    <span>Track:</span>
                    <p>
                      {musicLibrary.selectedMusic.name}
                      <span className="music-volume">Volume: {Math.round(musicLibrary.volume * 100)}%</span>
                    </p>
                    <button 
                      className="preview-btn"
                      onClick={() => musicLibrary.isPlaying ? musicLibrary.pause() : musicLibrary.preview()}
                    >
                      {musicLibrary.isPlaying ? <FiPause /> : <FiPlay />}
                    </button>
                  </div>
                ) : (
                  <p className="no-content">No music selected</p>
                )}
              </div>

              <div className="summary-section">
                <h4><FiType /> Captions</h4>
                {textCaptions.captions.length > 0 ? (
                  <div className="captions-summary">
                    <p>{textCaptions.captions.length} caption(s) added</p>
                    <ul>
                      {textCaptions.captions.slice(0, 3).map((caption, index) => (
                        <li key={caption.id}>
                          <span className="caption-time">
                            {caption.startTime.toFixed(1)}s - {caption.endTime.toFixed(1)}s:
                          </span>
                          <span className="caption-text">
                            {caption.text.substring(0, 50)}{caption.text.length > 50 ? '...' : ''}
                          </span>
                        </li>
                      ))}
                      {textCaptions.captions.length > 3 && (
                        <li className="more-captions">
                          ...and {textCaptions.captions.length - 3} more
                        </li>
                      )}
                    </ul>
                  </div>
                ) : (
                  <p className="no-content">No captions added</p>
                )}
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {isGenerating ? (
              <div className="generation-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p>Generating video... {progress}%</p>
              </div>
            ) : result ? (
              <div className="generation-result">
                <FiCheck className="success-icon" />
                <h4>Video Generated Successfully!</h4>
                {result.videoUrl && (
                  <video 
                    ref={previewVideoRef}
                    src={result.videoUrl} 
                    controls 
                    className="result-video"
                  />
                )}
                <button className="btn-secondary" onClick={reset}>
                  Create Another Video
                </button>
              </div>
            ) : (
              <div className="generate-actions">
                <button 
                  className="btn-primary generate-btn"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  <FiPlay /> Generate Video
                </button>
                
                <div className="preset-options">
                  <p>Or use a preset:</p>
                  <div className="preset-buttons">
                    <button 
                      className="btn-preset"
                      onClick={() => handlePresetGenerate('quick')}
                    >
                      Quick (Lower Quality)
                    </button>
                    <button 
                      className="btn-preset"
                      onClick={() => handlePresetGenerate('balanced')}
                    >
                      Balanced
                    </button>
                    <button 
                      className="btn-preset"
                      onClick={() => handlePresetGenerate('quality')}
                    >
                      High Quality
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="video-creator-panel">
      {/* Step Indicator */}
      <div className="steps-indicator">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div 
              className={`step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
              onClick={() => currentStep > step.id && setCurrentStep(step.id)}
            >
              <div className="step-icon">
                {currentStep > step.id ? <FiCheck /> : <step.icon />}
              </div>
              <span className="step-title">{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`step-connector ${currentStep > step.id ? 'completed' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="step-container">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="step-navigation">
        <button 
          className="btn-secondary"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <FiArrowLeft /> Back
        </button>

        {showPreview && currentStep < 4 && (
          <button 
            className="btn-preview"
            onClick={() => setIsPreviewOpen(true)}
          >
            <FiEye /> Preview
          </button>
        )}

        {currentStep < 4 ? (
          <button 
            className="btn-primary"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Next <FiArrowRight />
          </button>
        ) : null}
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="preview-modal-overlay" onClick={() => setIsPreviewOpen(false)}>
          <div className="preview-modal" onClick={e => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h3>Preview</h3>
              <button onClick={() => setIsPreviewOpen(false)}>&times;</button>
            </div>
            <div className="preview-modal-content">
              <div className="preview-video-placeholder">
                <FiVideo size={48} />
                <p>Video preview will appear here after generation</p>
                {prompt && <p className="preview-prompt">Prompt: {prompt}</p>}
              </div>
              {musicLibrary.selectedMusic && (
                <div className="preview-music">
                  <FiMusic /> {musicLibrary.selectedMusic.name}
                  <button 
                    onClick={() => musicLibrary.isPlaying ? musicLibrary.pause() : musicLibrary.preview()}
                  >
                    {musicLibrary.isPlaying ? <FiPause /> : <FiPlay />}
                  </button>
                </div>
              )}
              {textCaptions.captions.length > 0 && (
                <div className="preview-captions">
                  <h4>Captions Preview</h4>
                  <div className="caption-preview-list">
                    {textCaptions.captions.map(caption => (
                      <div key={caption.id} className="caption-preview-item">
                        <span>{caption.startTime.toFixed(1)}s:</span>
                        <span>{caption.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCreatorPanel;
