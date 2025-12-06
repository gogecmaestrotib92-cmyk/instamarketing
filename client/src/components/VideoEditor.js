import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiMusic, FiType, FiVolume2, FiDownload, FiPlay, FiPause, FiMic, FiAlertCircle } from 'react-icons/fi';
import './VideoEditor.css';

const VideoEditor = ({ video, onSave, onBack }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Editor state
  const [activePanel, setActivePanel] = useState(null);
  const [musicTrack, setMusicTrack] = useState(null);
  const [musicVolume, setMusicVolume] = useState(50);
  const [subtitles, setSubtitles] = useState([]);
  const [textOverlays, setTextOverlays] = useState([]);
  const [voiceover, setVoiceover] = useState(null);
  
  // ElevenLabs state
  const [elevenLabsVoices, setElevenLabsVoices] = useState([]);
  const [elevenLabsStatus, setElevenLabsStatus] = useState({ available: false });
  const [selectedVoiceId, setSelectedVoiceId] = useState('21m00Tcm4TlvDq8ikWAM');
  const [selectedVoiceName, setSelectedVoiceName] = useState('Rachel');
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState(null);
  const [playingPreview, setPlayingPreview] = useState(null);
  const [previewAudio, setPreviewAudio] = useState(null);

  // Music library (sample tracks)
  const musicLibrary = [
    { id: 1, name: 'Upbeat Energy', duration: '2:30', mood: 'energetic' },
    { id: 2, name: 'Chill Vibes', duration: '3:15', mood: 'relaxed' },
    { id: 3, name: 'Epic Cinematic', duration: '2:45', mood: 'dramatic' },
    { id: 4, name: 'Lo-Fi Beat', duration: '3:00', mood: 'calm' },
    { id: 5, name: 'Trending Pop', duration: '2:20', mood: 'trendy' },
  ];
  
  // Fallback voice options
  const fallbackVoices = [
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Warm, friendly', emoji: '👩' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Professional', emoji: '👩‍💼' },
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', description: 'Authoritative', emoji: '👨' },
    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', description: 'Energetic', emoji: '🎤' },
    { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', description: 'Dynamic', emoji: '🧑' },
    { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', description: 'Deep, rich', emoji: '🎩' },
  ];
  
  // Load ElevenLabs voices on mount
  useEffect(() => {
    loadElevenLabsVoices();
  }, []);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl) {
      const handleTimeUpdate = () => setCurrentTime(videoEl.currentTime);
      const handleLoadedMetadata = () => setDuration(videoEl.duration);
      const handleEnded = () => setIsPlaying(false);
      
      videoEl.addEventListener('timeupdate', handleTimeUpdate);
      videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoEl.addEventListener('ended', handleEnded);
      
      return () => {
        videoEl.removeEventListener('timeupdate', handleTimeUpdate);
        videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoEl.removeEventListener('ended', handleEnded);
      };
    }
  }, []);
  
  // Load ElevenLabs voices
  const loadElevenLabsVoices = async () => {
    try {
      const statusRes = await fetch('/api/ai/elevenlabs/status');
      const statusData = await statusRes.json();
      setElevenLabsStatus(statusData);
      
      const voicesRes = await fetch('/api/ai/elevenlabs/voices/recommended');
      const voicesData = await voicesRes.json();
      
      if (voicesData.success && voicesData.voices) {
        setElevenLabsVoices(voicesData.voices);
      }
    } catch (error) {
      console.log('ElevenLabs not available:', error.message);
    }
  };
  
  // Get available voices
  const getAvailableVoices = () => {
    return elevenLabsVoices.length > 0 ? elevenLabsVoices : fallbackVoices;
  };
  
  // Play voice preview
  const playVoicePreview = (voice) => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
    }
    
    if (voice.previewUrl) {
      const audio = new Audio(voice.previewUrl);
      setPreviewAudio(audio);
      setPlayingPreview(voice.id);
      audio.play().catch(() => setPlayingPreview(null));
      audio.onended = () => setPlayingPreview(null);
    }
  };
  
  // Generate voiceover with ElevenLabs
  const generateVoiceover = async () => {
    if (!voiceover || !voiceover.trim()) {
      toast.error('Please enter text for the voiceover');
      return;
    }
    
    setIsGeneratingVoice(true);
    
    try {
      const response = await fetch('/api/ai/elevenlabs/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voiceover,
          voiceId: selectedVoiceId
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.audioUrl) {
        setGeneratedAudioUrl(data.audioUrl);
        toast.success('Voiceover generated!');
      } else {
        throw new Error(data.error || 'Failed to generate voiceover');
      }
    } catch (error) {
      console.error('Voiceover generation error:', error);
      toast.error(error.message || 'Failed to generate voiceover');
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const selectMusic = (track) => {
    setMusicTrack(track);
    toast.success(`Added: ${track.name}`);
  };

  const addTextOverlay = () => {
    const newText = {
      id: Date.now(),
      text: 'Your text here',
      position: 'center',
      style: 'modern',
      startTime: currentTime,
      endTime: Math.min(currentTime + 3, duration)
    };
    setTextOverlays([...textOverlays, newText]);
    toast.success('Text added');
  };

  const addSubtitle = () => {
    const newSubtitle = {
      id: Date.now(),
      text: 'Subtitle text',
      startTime: currentTime,
      endTime: Math.min(currentTime + 2, duration)
    };
    setSubtitles([...subtitles, newSubtitle]);
    toast.success('Subtitle added');
  };

  const handleExport = async () => {
    toast.info('Export feature coming soon');
    // This would integrate with backend to render the final video
  };

  if (!video) {
    return (
      <div className="editor-empty">
        <p>No video selected</p>
        <button className="editor-btn" onClick={onBack}>Go back to generate</button>
      </div>
    );
  }

  return (
    <div className="video-editor">
      {/* Preview Section */}
      <div className="editor-preview">
        <div className="preview-container">
          <video 
            ref={videoRef}
            src={video.videoUrl}
            className="preview-video"
            onClick={togglePlay}
          />
          
          {/* Text Overlays Preview */}
          {textOverlays.map(overlay => (
            currentTime >= overlay.startTime && currentTime <= overlay.endTime && (
              <div key={overlay.id} className={`text-overlay text-overlay--${overlay.position}`}>
                {overlay.text}
              </div>
            )
          ))}

          {/* Play/Pause overlay */}
          <button className="play-overlay" onClick={togglePlay}>
            {isPlaying ? <FiPause /> : <FiPlay />}
          </button>
        </div>

        {/* Timeline */}
        <div className="editor-timeline">
          <span className="timeline-time">{formatTime(currentTime)}</span>
          <div className="timeline-bar" onClick={handleSeek}>
            <div 
              className="timeline-progress" 
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <div 
              className="timeline-handle"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          <span className="timeline-time">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Tool Panels */}
      <div className="editor-tools">
        <div className="tool-tabs">
          <button 
            className={`tool-tab ${activePanel === 'music' ? 'tool-tab--active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'music' ? null : 'music')}
          >
            <FiMusic /> Music
          </button>
          <button 
            className={`tool-tab ${activePanel === 'text' ? 'tool-tab--active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'text' ? null : 'text')}
          >
            <FiType /> Text
          </button>
          <button 
            className={`tool-tab ${activePanel === 'subtitles' ? 'tool-tab--active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'subtitles' ? null : 'subtitles')}
          >
            <FiType /> Subtitles
          </button>
          <button 
            className={`tool-tab ${activePanel === 'voiceover' ? 'tool-tab--active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'voiceover' ? null : 'voiceover')}
          >
            <FiVolume2 /> Voice
          </button>
        </div>

        {/* Music Panel */}
        {activePanel === 'music' && (
          <div className="tool-panel">
            <h4>Background Music</h4>
            {musicTrack && (
              <div className="selected-track">
                <span>{musicTrack.name}</span>
                <div className="volume-control">
                  <FiVolume2 />
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={musicVolume}
                    onChange={(e) => setMusicVolume(e.target.value)}
                  />
                  <span>{musicVolume}%</span>
                </div>
                <button className="remove-btn" onClick={() => setMusicTrack(null)}>Remove</button>
              </div>
            )}
            <div className="music-list">
              {musicLibrary.map(track => (
                <button 
                  key={track.id}
                  className={`music-item ${musicTrack?.id === track.id ? 'music-item--selected' : ''}`}
                  onClick={() => selectMusic(track)}
                >
                  <span className="music-name">{track.name}</span>
                  <span className="music-duration">{track.duration}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text Panel */}
        {activePanel === 'text' && (
          <div className="tool-panel">
            <h4>Text Overlays</h4>
            <button className="add-btn" onClick={addTextOverlay}>+ Add Text</button>
            <div className="text-list">
              {textOverlays.map(overlay => (
                <div key={overlay.id} className="text-item">
                  <input 
                    type="text" 
                    value={overlay.text}
                    onChange={(e) => {
                      setTextOverlays(textOverlays.map(t => 
                        t.id === overlay.id ? { ...t, text: e.target.value } : t
                      ));
                    }}
                  />
                  <select 
                    value={overlay.position}
                    onChange={(e) => {
                      setTextOverlays(textOverlays.map(t => 
                        t.id === overlay.id ? { ...t, position: e.target.value } : t
                      ));
                    }}
                  >
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom</option>
                  </select>
                  <button 
                    className="remove-btn"
                    onClick={() => setTextOverlays(textOverlays.filter(t => t.id !== overlay.id))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subtitles Panel */}
        {activePanel === 'subtitles' && (
          <div className="tool-panel">
            <h4>Subtitles</h4>
            <button className="add-btn" onClick={addSubtitle}>+ Add Subtitle</button>
            <div className="subtitle-list">
              {subtitles.map(sub => (
                <div key={sub.id} className="subtitle-item">
                  <input 
                    type="text" 
                    value={sub.text}
                    onChange={(e) => {
                      setSubtitles(subtitles.map(s => 
                        s.id === sub.id ? { ...s, text: e.target.value } : s
                      ));
                    }}
                  />
                  <span className="subtitle-time">
                    {formatTime(sub.startTime)} - {formatTime(sub.endTime)}
                  </span>
                  <button 
                    className="remove-btn"
                    onClick={() => setSubtitles(subtitles.filter(s => s.id !== sub.id))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voiceover Panel - Enhanced with ElevenLabs */}
        {activePanel === 'voiceover' && (
          <div className="tool-panel voiceover-panel">
            <div className="panel-header">
              <h4><FiMic /> AI Voiceover</h4>
              {elevenLabsStatus.available && (
                <span className="elevenlabs-badge">⚡ ElevenLabs</span>
              )}
            </div>
            
            {!elevenLabsStatus.available && (
              <div className="warning-notice">
                <FiAlertCircle />
                <span>ElevenLabs not configured</span>
              </div>
            )}
            
            {/* Voice Selection */}
            <div className="voice-select-section">
              <label>Select Voice:</label>
              <div className="voice-options-row">
                {getAvailableVoices().slice(0, 4).map(voice => (
                  <button
                    key={voice.id}
                    className={`voice-chip ${selectedVoiceId === voice.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedVoiceId(voice.id);
                      setSelectedVoiceName(voice.name);
                    }}
                    title={voice.description}
                  >
                    <span className="voice-emoji">{voice.emoji || '🎙️'}</span>
                    <span>{voice.name}</span>
                  </button>
                ))}
              </div>
              
              {/* Full voice dropdown for more options */}
              <select 
                className="voice-dropdown"
                value={selectedVoiceId}
                onChange={(e) => {
                  const voice = getAvailableVoices().find(v => v.id === e.target.value);
                  setSelectedVoiceId(e.target.value);
                  setSelectedVoiceName(voice?.name || 'Voice');
                }}
              >
                {getAvailableVoices().map(voice => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} - {voice.description}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Text Input */}
            <textarea 
              className="voiceover-text"
              placeholder="Enter text for AI voiceover..."
              value={voiceover || ''}
              onChange={(e) => setVoiceover(e.target.value)}
              rows={4}
            />
            
            {/* Generate Button */}
            <button 
              className={`generate-voice-btn ${isGeneratingVoice ? 'loading' : ''}`}
              onClick={generateVoiceover}
              disabled={isGeneratingVoice || !voiceover?.trim()}
            >
              {isGeneratingVoice ? (
                <>Generating...</>
              ) : (
                <>🎙️ Generate with {selectedVoiceName}</>
              )}
            </button>
            
            {/* Generated Audio Preview */}
            {generatedAudioUrl && (
              <div className="generated-audio">
                <span>✅ Voiceover ready!</span>
                <audio controls src={generatedAudioUrl} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Export Button */}
      <div className="editor-actions">
        <button className="editor-btn editor-btn--secondary" onClick={onBack}>
          Back
        </button>
        <button className="editor-btn editor-btn--primary" onClick={handleExport}>
          <FiDownload /> Export Video
        </button>
      </div>
    </div>
  );
};

export default VideoEditor;
