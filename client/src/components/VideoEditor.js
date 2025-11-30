import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiMusic, FiType, FiVolume2, FiDownload, FiPlay, FiPause } from 'react-icons/fi';
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

  // Music library (sample tracks)
  const musicLibrary = [
    { id: 1, name: 'Upbeat Energy', duration: '2:30', mood: 'energetic' },
    { id: 2, name: 'Chill Vibes', duration: '3:15', mood: 'relaxed' },
    { id: 3, name: 'Epic Cinematic', duration: '2:45', mood: 'dramatic' },
    { id: 4, name: 'Lo-Fi Beat', duration: '3:00', mood: 'calm' },
    { id: 5, name: 'Trending Pop', duration: '2:20', mood: 'trendy' },
  ];

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

        {/* Voiceover Panel */}
        {activePanel === 'voiceover' && (
          <div className="tool-panel">
            <h4>AI Voiceover</h4>
            <textarea 
              className="voiceover-text"
              placeholder="Enter text for AI voiceover..."
              value={voiceover || ''}
              onChange={(e) => setVoiceover(e.target.value)}
            />
            <button 
              className="generate-voice-btn"
              onClick={() => toast.info('AI voice generation coming soon')}
            >
              Generate Voice
            </button>
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
