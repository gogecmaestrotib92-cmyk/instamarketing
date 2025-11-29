import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FiMusic, 
  FiX, 
  FiCheck, 
  FiUpload, 
  FiVolume2,
  FiVolumeX,
  FiLoader,
  FiPlay,
  FiPause,
  FiTrash2,
  FiCpu,
  FiDisc,
  FiFolder,
  FiSkipForward,
  FiClock
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import './MusicModalV2.css';

/**
 * MusicModalV2 - Professional Music Selection with Advanced Audio Preview
 * 
 * Features:
 * - Play/Pause preview for each track
 * - 10-second quick preview option  
 * - Full mini audio player (timeline + volume)
 * - Waveform visualization
 * - Proper cleanup on close/unmount
 * 
 * @typedef {"library" | "upload" | "ai"} MusicSourceType
 * 
 * @typedef {Object} MusicTrack
 * @property {string} id
 * @property {string} name
 * @property {string} url
 * @property {number} [durationSeconds]
 * @property {MusicSourceType} sourceType
 * @property {string[]} [tags]
 */

// ============================================================
// ROYALTY-FREE MUSIC LIBRARY
// Using SoundHelix - Always accessible streaming audio samples
// ============================================================
const LIBRARY_TRACKS = [
  // 🎵 Upbeat / Energetic
  { id: 'lib-1', name: 'Energy Boost', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', durationSeconds: 374, sourceType: 'library', tags: ['electronic', 'upbeat'], genre: 'Upbeat' },
  { id: 'lib-2', name: 'Power Drive', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', durationSeconds: 318, sourceType: 'library', tags: ['indie', 'energetic'], genre: 'Upbeat' },
  { id: 'lib-3', name: 'Funky Beat', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', durationSeconds: 295, sourceType: 'library', tags: ['funky', 'beat'], genre: 'Upbeat' },
  { id: 'lib-4', name: 'Night Rider', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', durationSeconds: 340, sourceType: 'library', tags: ['electronic', 'cool'], genre: 'Upbeat' },
  
  // 🌆 Chill / Lo-Fi
  { id: 'lib-5', name: 'Mellow Vibes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', durationSeconds: 282, sourceType: 'library', tags: ['ambient', 'chill'], genre: 'Chill' },
  { id: 'lib-6', name: 'Peaceful Mind', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', durationSeconds: 325, sourceType: 'library', tags: ['calm', 'peaceful'], genre: 'Chill' },
  { id: 'lib-7', name: 'Soft Glow', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', durationSeconds: 298, sourceType: 'library', tags: ['chill', 'happy'], genre: 'Chill' },
  
  // 🌅 Cinematic / Emotional
  { id: 'lib-8', name: 'Epic Journey', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', durationSeconds: 356, sourceType: 'library', tags: ['cinematic', 'emotional'], genre: 'Cinematic' },
  { id: 'lib-9', name: 'Grand Adventure', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', durationSeconds: 312, sourceType: 'library', tags: ['piano', 'beautiful'], genre: 'Cinematic' },
  { id: 'lib-10', name: 'Dramatic Rise', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', durationSeconds: 278, sourceType: 'library', tags: ['dramatic', 'epic'], genre: 'Cinematic' },
  
  // 🤖 Electronic / Future
  { id: 'lib-11', name: 'Digital Pulse', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', durationSeconds: 334, sourceType: 'library', tags: ['synth', 'electronic'], genre: 'Electronic' },
  { id: 'lib-12', name: 'Tech Flow', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', durationSeconds: 289, sourceType: 'library', tags: ['tech', 'digital'], genre: 'Electronic' },
  { id: 'lib-13', name: 'Cyber Wave', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', durationSeconds: 267, sourceType: 'library', tags: ['electronic', 'edgy'], genre: 'Electronic' },
  
  // 🌴 Happy / Positive
  { id: 'lib-14', name: 'Sunny Days', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', durationSeconds: 301, sourceType: 'library', tags: ['sunny', 'positive'], genre: 'Tropical' },
  { id: 'lib-15', name: 'Beach Vibes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', durationSeconds: 345, sourceType: 'library', tags: ['summer', 'happy'], genre: 'Tropical' },
  { id: 'lib-16', name: 'Party Time', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', durationSeconds: 256, sourceType: 'library', tags: ['party', 'fun'], genre: 'Tropical' },
];

const GENRES = ['All', 'Upbeat', 'Chill', 'Cinematic', 'Electronic', 'Tropical'];
const AI_STYLES = ['Cinematic', 'Trap', 'Lofi', 'Ambient', 'Synthwave', 'Afrobeat', 'Pop', 'Rock', 'Classical'];
const AI_MOODS = ['Happy', 'Dark', 'Dramatic', 'Chill', 'Inspiring', 'Energetic', 'Sad', 'Mysterious'];

// ============================================================
// WAVEFORM COMPONENT
// ============================================================
const AudioWaveform = ({ audioRef, isPlaying, color = '#3b82f6' }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyzerRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio) return;

    const ctx = canvas.getContext('2d');
    
    // Initialize audio context and analyzer
    const initAnalyzer = () => {
      if (audioContextRef.current) return;
      
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 64;
        
        if (!sourceRef.current) {
          sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
          sourceRef.current.connect(analyzerRef.current);
          analyzerRef.current.connect(audioContextRef.current.destination);
        }
      } catch (e) {
        console.warn('Waveform visualization not available:', e);
      }
    };

    const draw = () => {
      if (!analyzerRef.current || !ctx) return;
      
      const bufferLength = analyzerRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyzerRef.current.getByteFrequencyData(dataArray);
      
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = (width / bufferLength) * 1.5;
      
      ctx.clearRect(0, 0, width, height);
      
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.9;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, `${color}40`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        
        x += barWidth;
      }
      
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    if (isPlaying) {
      initAnalyzer();
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      draw();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Draw idle state
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 16;
      const barWidth = (canvas.width / bars) * 0.8;
      for (let i = 0; i < bars; i++) {
        const barHeight = 4 + Math.random() * 8;
        ctx.fillStyle = '#2a3142';
        ctx.fillRect(i * (canvas.width / bars) + 2, (canvas.height - barHeight) / 2, barWidth, barHeight);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioRef, isPlaying, color]);

  return (
    <canvas 
      ref={canvasRef} 
      className="mm2-waveform"
      width={200}
      height={40}
    />
  );
};

// ============================================================
// MINI AUDIO PLAYER COMPONENT
// ============================================================
const MiniAudioPlayer = ({ 
  track, 
  audioRef,
  isPlaying, 
  currentTime,
  duration,
  volume,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onQuickPreview,
  onClose
}) => {
  const [showVolume, setShowVolume] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const progressRef = useRef(null);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    onSeek(pos * duration);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mm2-player">
      <div className="mm2-player__header">
        <div className="mm2-player__track-info">
          <FiMusic className="mm2-player__icon" />
          <div className="mm2-player__meta">
            <span className="mm2-player__title">{track.name}</span>
            <span className="mm2-player__source">
              {track.sourceType === 'ai' ? 'AI Generated' : 
               track.sourceType === 'upload' ? 'Uploaded' : 'Library'}
            </span>
          </div>
        </div>
        <button className="mm2-player__close" onClick={onClose}>
          <FiX />
        </button>
      </div>

      {/* Waveform */}
      <div className="mm2-player__waveform-container">
        <AudioWaveform 
          audioRef={audioRef} 
          isPlaying={isPlaying}
          color="#3b82f6"
        />
      </div>

      {/* Progress Bar */}
      <div 
        ref={progressRef}
        className="mm2-player__progress"
        onClick={handleProgressClick}
      >
        <div 
          className="mm2-player__progress-fill"
          style={{ width: `${progress}%` }}
        />
        <div 
          className="mm2-player__progress-thumb"
          style={{ left: `${progress}%` }}
        />
      </div>

      {/* Time Display */}
      <div className="mm2-player__time">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="mm2-player__controls">
        <button 
          className="mm2-player__btn mm2-player__btn--quick"
          onClick={onQuickPreview}
          title="10 second preview"
        >
          <FiClock />
          <span>10s</span>
        </button>

        <button 
          className="mm2-player__btn mm2-player__btn--play"
          onClick={onPlayPause}
        >
          {isPlaying ? <FiPause /> : <FiPlay />}
        </button>

        <div 
          className="mm2-player__volume-wrapper"
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
        >
          <button 
            className="mm2-player__btn"
            onClick={handleMuteToggle}
          >
            {isMuted ? <FiVolumeX /> : <FiVolume2 />}
          </button>
          
          {showVolume && (
            <div className="mm2-player__volume-popup">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setIsMuted(false);
                  onVolumeChange(parseFloat(e.target.value));
                }}
                className="mm2-player__volume-slider"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// TRACK CARD COMPONENT
// ============================================================
const TrackCard = ({ 
  track, 
  isSelected, 
  isPlaying, 
  onSelect, 
  onPlayPause,
  onQuickPreview,
  getSourceIcon
}) => {
  return (
    <div
      className={`mm2-track-card ${isSelected ? 'mm2-track-card--selected' : ''} ${isPlaying ? 'mm2-track-card--playing' : ''}`}
      onClick={onSelect}
    >
      <div className="mm2-track-card__left">
        <button
          className="mm2-track-card__play-btn"
          onClick={(e) => {
            e.stopPropagation();
            onPlayPause();
          }}
        >
          {isPlaying ? <FiPause /> : <FiPlay />}
          {isPlaying && <span className="mm2-track-card__pulse" />}
        </button>
        
        <div className="mm2-track-card__info">
          <span className="mm2-track-card__name">{track.name}</span>
          <div className="mm2-track-card__meta">
            {getSourceIcon(track.sourceType)}
            <span className="mm2-track-card__duration">
              {track.durationSeconds ? `${track.durationSeconds}s` : '--'}
            </span>
            {track.tags && track.tags.length > 0 && (
              <span className="mm2-track-card__tag">{track.tags[0]}</span>
            )}
          </div>
        </div>
      </div>

      <div className="mm2-track-card__right">
        <button
          className="mm2-track-card__quick-btn"
          onClick={(e) => {
            e.stopPropagation();
            onQuickPreview();
          }}
          title="10 second preview"
        >
          <FiSkipForward />
          10s
        </button>
        
        {isSelected && (
          <div className="mm2-track-card__badge">
            <FiCheck />
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const MusicModalV2 = ({
  open,
  initialConfig,
  initialTrack,
  onApply,
  onClose,
}) => {
  // Tabs
  const [activeTab, setActiveTab] = useState('library');
  
  // Tracks
  const [libraryTracks] = useState(LIBRARY_TRACKS);
  const [userTracks, setUserTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(initialTrack || null);
  const [selectedGenre, setSelectedGenre] = useState('All');
  
  // Audio player state
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [previewVolume, setPreviewVolume] = useState(0.5);
  const [quickPreviewTimeout, setQuickPreviewTimeout] = useState(null);
  const audioRef = useRef(null);
  
  // Volume & enabled
  const [volume, setVolume] = useState(initialConfig?.volume ?? 0.35);
  const [enabled, setEnabled] = useState(initialConfig?.enabled ?? !!initialTrack);
  
  // AI generation state
  const [aiStyle, setAiStyle] = useState('Cinematic');
  const [aiMood, setAiMood] = useState('Inspiring');
  const [aiDuration, setAiDuration] = useState(15);
  const [aiBpm, setAiBpm] = useState(120);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  
  // Upload state
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // ============================================================
  // STOP ALL AUDIO
  // ============================================================
  const stopAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setActiveTrack(null);
    setCurrentTime(0);
    setDuration(0);
    
    if (quickPreviewTimeout) {
      clearTimeout(quickPreviewTimeout);
      setQuickPreviewTimeout(null);
    }
  }, [quickPreviewTimeout]);

  // ============================================================
  // RESET STATE WHEN MODAL OPENS
  // ============================================================
  useEffect(() => {
    if (open) {
      setSelectedTrack(initialTrack || null);
      setVolume(initialConfig?.volume ?? 0.35);
      setEnabled(initialConfig?.enabled ?? !!initialTrack);
      setActiveTab('library');
      setAiError(null);
      setUploadError(null);
      stopAllAudio();
    }
  }, [open, initialConfig, initialTrack, stopAllAudio]);

  // ============================================================
  // STOP AUDIO WHEN MODAL CLOSES OR COMPONENT UNMOUNTS
  // ============================================================
  useEffect(() => {
    if (!open) {
      stopAllAudio();
    }
    
    return () => {
      stopAllAudio();
    };
  }, [open, stopAllAudio]);

  // ============================================================
  // AUDIO EVENT HANDLERS
  // ============================================================
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // Filter library tracks by genre
  const filteredLibraryTracks = selectedGenre === 'All'
    ? libraryTracks
    : libraryTracks.filter(t => t.genre === selectedGenre);

  const hasUserTracks = userTracks.length > 0;

  // ============================================================
  // PLAY/PAUSE TRACK
  // ============================================================
  const handlePlayPause = useCallback((track) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Clear any quick preview timeout
    if (quickPreviewTimeout) {
      clearTimeout(quickPreviewTimeout);
      setQuickPreviewTimeout(null);
    }

    if (activeTrack?.id === track.id) {
      // Toggle current track
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(console.error);
      }
    } else {
      // Play new track
      audio.src = track.url;
      audio.volume = previewVolume;
      audio.currentTime = 0;
      setActiveTrack(track);
      setCurrentTime(0);
      setDuration(track.durationSeconds || 0);
      audio.play().catch(console.error);
    }
  }, [activeTrack, isPlaying, previewVolume, quickPreviewTimeout]);

  // ============================================================
  // 10-SECOND QUICK PREVIEW
  // ============================================================
  const handleQuickPreview = useCallback((track) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Clear previous timeout
    if (quickPreviewTimeout) {
      clearTimeout(quickPreviewTimeout);
    }

    // If same track is playing, just set timeout
    if (activeTrack?.id === track.id && isPlaying) {
      const timeout = setTimeout(() => {
        audio.pause();
        setIsPlaying(false);
      }, 10000);
      setQuickPreviewTimeout(timeout);
      toast.info('⏱️ 10 second preview started');
      return;
    }

    // Start new track
    audio.src = track.url;
    audio.volume = previewVolume;
    audio.currentTime = 0;
    setActiveTrack(track);
    setCurrentTime(0);
    setDuration(track.durationSeconds || 0);
    
    audio.play().then(() => {
      const timeout = setTimeout(() => {
        audio.pause();
        setIsPlaying(false);
      }, 10000);
      setQuickPreviewTimeout(timeout);
      toast.info('⏱️ 10 second preview started');
    }).catch(console.error);
  }, [activeTrack, isPlaying, previewVolume, quickPreviewTimeout]);

  // ============================================================
  // SEEK
  // ============================================================
  const handleSeek = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  // ============================================================
  // PREVIEW VOLUME CHANGE
  // ============================================================
  const handlePreviewVolumeChange = useCallback((newVolume) => {
    setPreviewVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  // ============================================================
  // CLOSE MINI PLAYER
  // ============================================================
  const handleCloseMiniPlayer = useCallback(() => {
    stopAllAudio();
  }, [stopAllAudio]);

  // ============================================================
  // SELECT TRACK
  // ============================================================
  const handleSelectTrack = (track) => {
    setSelectedTrack(track);
    setEnabled(true);
  };

  // ============================================================
  // AI MUSIC GENERATION
  // ============================================================
  const handleGenerateAI = async () => {
    setAiLoading(true);
    setAiError(null);

    try {
      const response = await api.post('/music/generate', {
        style: aiStyle,
        mood: aiMood,
        durationSeconds: aiDuration,
        bpm: aiBpm,
      });

      const newTrack = {
        id: response.data.id || `ai-${Date.now()}`,
        name: response.data.name || `AI ${aiStyle} - ${aiMood}`,
        url: response.data.url,
        durationSeconds: response.data.durationSeconds || aiDuration,
        sourceType: 'ai',
        tags: [aiStyle.toLowerCase(), 'ai'],
      };

      setUserTracks(prev => [newTrack, ...prev]);
      setSelectedTrack(newTrack);
      setEnabled(true);
      toast.success('🎵 AI music generated successfully!');
      
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Error generating AI music';
      setAiError(errorMsg);
      console.error('AI music generation error:', error);
    } finally {
      setAiLoading(false);
    }
  };

  // ============================================================
  // FILE UPLOAD
  // ============================================================
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setUploadError('Please select an audio file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File is too large (max 10MB)');
      return;
    }

    setUploadLoading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('audio', file);

      const response = await api.post('/music/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newTrack = {
        id: response.data.id || `upload-${Date.now()}`,
        name: response.data.name || file.name.replace(/\.[^/.]+$/, ''),
        url: response.data.url,
        durationSeconds: response.data.durationSeconds,
        sourceType: 'upload',
        tags: ['custom', 'upload'],
      };

      setUserTracks(prev => [newTrack, ...prev]);
      setSelectedTrack(newTrack);
      setEnabled(true);
      toast.success('🎵 Music uploaded successfully!');

    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Error uploading';
      setUploadError(errorMsg);
      console.error('Upload error:', error);
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ============================================================
  // REMOVE MUSIC
  // ============================================================
  const handleRemoveMusic = () => {
    stopAllAudio();
    setSelectedTrack(null);
    setEnabled(false);
    onApply({ enabled: false, trackId: null, volume }, null);
    onClose();
  };

  // ============================================================
  // APPLY
  // ============================================================
  const handleApply = () => {
    if (enabled && !selectedTrack) {
      toast.error('Select music before applying');
      return;
    }

    stopAllAudio();
    onApply(
      {
        enabled,
        trackId: selectedTrack?.id ?? null,
        volume,
      },
      selectedTrack
    );
    onClose();
  };

  // ============================================================
  // GET SOURCE ICON
  // ============================================================
  const getSourceIcon = (sourceType) => {
    switch (sourceType) {
      case 'ai': return <FiCpu className="mm2-source-icon mm2-source-icon--ai" />;
      case 'upload': return <FiFolder className="mm2-source-icon mm2-source-icon--upload" />;
      default: return <FiDisc className="mm2-source-icon mm2-source-icon--library" />;
    }
  };

  if (!open) return null;

  return (
    <div className="mm2-overlay" onClick={onClose}>
      <div className="mm2-modal" onClick={(e) => e.stopPropagation()}>
        {/* Hidden audio element */}
        <audio ref={audioRef} preload="metadata" />

        {/* Header */}
        <div className="mm2-header">
          <h2 className="mm2-title">
            <FiMusic /> Add Background Music
          </h2>
          <button className="mm2-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* Mini Audio Player (shows when a track is being previewed) */}
        {activeTrack && (
          <MiniAudioPlayer
            track={activeTrack}
            audioRef={audioRef}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={previewVolume}
            onPlayPause={() => handlePlayPause(activeTrack)}
            onSeek={handleSeek}
            onVolumeChange={handlePreviewVolumeChange}
            onQuickPreview={() => handleQuickPreview(activeTrack)}
            onClose={handleCloseMiniPlayer}
          />
        )}

        {/* Tabs */}
        <div className="mm2-tabs">
          <button
            className={`mm2-tab ${activeTab === 'library' ? 'mm2-tab--active' : ''}`}
            onClick={() => setActiveTab('library')}
          >
            <FiDisc /> Library
          </button>
          <button
            className={`mm2-tab ${activeTab === 'ai' ? 'mm2-tab--active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <FiCpu /> AI Music
          </button>
          <button
            className={`mm2-tab ${activeTab === 'upload' ? 'mm2-tab--active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <FiUpload /> Upload
          </button>
        </div>

        {/* Tab Content */}
        <div className="mm2-content">
          {/* LIBRARY TAB */}
          {activeTab === 'library' && (
            <div className="mm2-library">
              {/* Genre Filter */}
              <div className="mm2-genres">
                {GENRES.map((genre) => (
                  <button
                    key={genre}
                    className={`mm2-genre-btn ${selectedGenre === genre ? 'mm2-genre-btn--active' : ''}`}
                    onClick={() => setSelectedGenre(genre)}
                  >
                    {genre}
                  </button>
                ))}
              </div>

              {/* Track List */}
              <div className="mm2-track-list">
                {filteredLibraryTracks.map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    isSelected={selectedTrack?.id === track.id}
                    isPlaying={activeTrack?.id === track.id && isPlaying}
                    onSelect={() => handleSelectTrack(track)}
                    onPlayPause={() => handlePlayPause(track)}
                    onQuickPreview={() => handleQuickPreview(track)}
                    getSourceIcon={getSourceIcon}
                  />
                ))}
              </div>
            </div>
          )}

          {/* AI TAB */}
          {activeTab === 'ai' && (
            <div className="mm2-ai">
              <p className="mm2-ai-desc">
                Generate unique AI music tailored to your video
              </p>

              <div className="mm2-ai-form">
                <div className="mm2-ai-row">
                  <div className="mm2-ai-field">
                    <label>Style</label>
                    <select
                      value={aiStyle}
                      onChange={(e) => setAiStyle(e.target.value)}
                      disabled={aiLoading}
                    >
                      {AI_STYLES.map((style) => (
                        <option key={style} value={style}>{style}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mm2-ai-field">
                    <label>Mood</label>
                    <select
                      value={aiMood}
                      onChange={(e) => setAiMood(e.target.value)}
                      disabled={aiLoading}
                    >
                      {AI_MOODS.map((mood) => (
                        <option key={mood} value={mood}>{mood}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mm2-ai-row">
                  <div className="mm2-ai-field">
                    <label>Duration (seconds)</label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={aiDuration}
                      onChange={(e) => setAiDuration(Number(e.target.value))}
                      disabled={aiLoading}
                    />
                  </div>
                  <div className="mm2-ai-field">
                    <label>BPM (optional)</label>
                    <input
                      type="number"
                      min="60"
                      max="200"
                      value={aiBpm}
                      onChange={(e) => setAiBpm(Number(e.target.value))}
                      disabled={aiLoading}
                    />
                  </div>
                </div>

                <button
                  className="mm2-ai-generate-btn"
                  onClick={handleGenerateAI}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <>
                      <FiLoader className="mm2-spinner" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FiCpu /> Generate AI Music
                    </>
                  )}
                </button>

                {aiError && (
                  <div className="mm2-error">{aiError}</div>
                )}
              </div>
            </div>
          )}

          {/* UPLOAD TAB */}
          {activeTab === 'upload' && (
            <div className="mm2-upload">
              <div
                className="mm2-upload-zone"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadLoading ? (
                  <>
                    <FiLoader className="mm2-spinner" size={32} />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <FiUpload size={32} />
                    <span>Click to upload audio file</span>
                    <span className="mm2-upload-hint">MP3, WAV, M4A (max 10MB)</span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  hidden
                />
              </div>

              {uploadError && (
                <div className="mm2-error">{uploadError}</div>
              )}

              <div className="mm2-upload-disclaimer">
                <strong>⚠️ Copyright notice:</strong>
                <p>
                  By uploading your own music, you take responsibility for copyrights. 
                  Instagram may remove videos with copyrighted music.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* User Tracks Section */}
        {hasUserTracks && (
          <div className="mm2-user-tracks">
            <h4 className="mm2-section-title">My Music</h4>
            <div className="mm2-user-list">
              {userTracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  isSelected={selectedTrack?.id === track.id}
                  isPlaying={activeTrack?.id === track.id && isPlaying}
                  onSelect={() => handleSelectTrack(track)}
                  onPlayPause={() => handlePlayPause(track)}
                  onQuickPreview={() => handleQuickPreview(track)}
                  getSourceIcon={getSourceIcon}
                />
              ))}
            </div>
          </div>
        )}

        {/* Selected Track Info */}
        {selectedTrack && (
          <div className="mm2-selected-info">
            <span className="mm2-selected-label">Selected:</span>
            {getSourceIcon(selectedTrack.sourceType)}
            <span className="mm2-selected-name">{selectedTrack.name}</span>
            <button 
              className="mm2-preview-selected-btn"
              onClick={() => handlePlayPause(selectedTrack)}
            >
              {activeTrack?.id === selectedTrack.id && isPlaying ? <FiPause /> : <FiPlay />}
              Preview
            </button>
          </div>
        )}

        {/* Output Volume Slider */}
        <div className="mm2-volume">
          <label className="mm2-volume-label">
            <FiVolume2 /> Output Volume: {Math.round(volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="mm2-volume-slider"
          />
          <p className="mm2-volume-hint">This controls the music volume in your final video</p>
        </div>

        {/* Footer */}
        <div className="mm2-footer">
          <button
            className="mm2-btn mm2-btn--danger"
            onClick={handleRemoveMusic}
          >
            <FiTrash2 /> Remove Music
          </button>
          <div className="mm2-footer-right">
            <button
              className="mm2-btn mm2-btn--secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="mm2-btn mm2-btn--primary"
              onClick={handleApply}
            >
              <FiCheck /> Apply
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mm2-disclaimer">
          Note: By using your own audio files, you take responsibility for copyrights. 
          We recommend royalty-free or AI generated music.
        </div>

        {/* Hidden Audio Element */}
        <audio 
          ref={audioRef} 
          preload="auto"
        />
      </div>
    </div>
  );
};

export default MusicModalV2;
