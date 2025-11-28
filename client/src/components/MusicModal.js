import React, { useState, useEffect, useRef } from 'react';
import { 
  FiMusic, 
  FiX, 
  FiCheck, 
  FiUpload, 
  FiVolume2, 
  FiLoader,
  FiPlay,
  FiPause,
  FiTrash2,
  FiCpu,
  FiDisc,
  FiFolder
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import './MusicModal.css';

/**
 * MusicModal Component
 * Complete music selection system with:
 * - Royalty-free library
 * - AI generated music
 * - Custom upload
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
 * 
 * @typedef {Object} MusicConfig
 * @property {boolean} enabled
 * @property {string|null} [trackId]
 * @property {number} volume - 0 to 1
 * 
 * @param {Object} props
 * @param {boolean} props.open
 * @param {MusicConfig} [props.initialConfig]
 * @param {MusicTrack|null} [props.initialTrack]
 * @param {(config: MusicConfig, track: MusicTrack|null) => void} props.onApply
 * @param {() => void} props.onClose
 */

// ============================================================
// ROYALTY-FREE MUSIC LIBRARY (Hard-coded)
// ============================================================
const LIBRARY_TRACKS = [
  // Cinematic / Epic
  { id: 'lib-1', name: 'Epic Rising', url: '/audio/epic-rising.mp3', durationSeconds: 30, sourceType: 'library', tags: ['cinematic', 'epic'], genre: 'Cinematic' },
  { id: 'lib-2', name: 'Cinematic Drama', url: '/audio/cinematic-drama.mp3', durationSeconds: 25, sourceType: 'library', tags: ['cinematic', 'dramatic'], genre: 'Cinematic' },
  { id: 'lib-3', name: 'Hero Theme', url: '/audio/hero-theme.mp3', durationSeconds: 20, sourceType: 'library', tags: ['epic', 'inspiring'], genre: 'Cinematic' },
  
  // Chill / Lofi
  { id: 'lib-4', name: 'Lofi Study', url: '/audio/lofi-study.mp3', durationSeconds: 30, sourceType: 'library', tags: ['lofi', 'chill'], genre: 'Chill' },
  { id: 'lib-5', name: 'Sunset Vibes', url: '/audio/sunset-vibes.mp3', durationSeconds: 25, sourceType: 'library', tags: ['chill', 'ambient'], genre: 'Chill' },
  
  // Trap / Hip Hop
  { id: 'lib-6', name: 'Trap Energy', url: '/audio/trap-energy.mp3', durationSeconds: 20, sourceType: 'library', tags: ['trap', 'hiphop'], genre: 'Trap' },
  { id: 'lib-7', name: 'Street Beat', url: '/audio/street-beat.mp3', durationSeconds: 25, sourceType: 'library', tags: ['hiphop', 'urban'], genre: 'Trap' },
  
  // EDM / Festival
  { id: 'lib-8', name: 'Festival Drop', url: '/audio/festival-drop.mp3', durationSeconds: 30, sourceType: 'library', tags: ['edm', 'festival'], genre: 'EDM' },
  { id: 'lib-9', name: 'Electronic Pulse', url: '/audio/electronic-pulse.mp3', durationSeconds: 25, sourceType: 'library', tags: ['edm', 'electronic'], genre: 'EDM' },
  
  // Piano / Ambient
  { id: 'lib-10', name: 'Soft Piano', url: '/audio/soft-piano.mp3', durationSeconds: 30, sourceType: 'library', tags: ['piano', 'ambient'], genre: 'Ambient' },
  { id: 'lib-11', name: 'Ambient Dreams', url: '/audio/ambient-dreams.mp3', durationSeconds: 35, sourceType: 'library', tags: ['ambient', 'relaxing'], genre: 'Ambient' },
  { id: 'lib-12', name: 'Emotional Keys', url: '/audio/emotional-keys.mp3', durationSeconds: 25, sourceType: 'library', tags: ['piano', 'emotional'], genre: 'Ambient' },
];

// Genre categories for filtering
const GENRES = ['All', 'Cinematic', 'Chill', 'Trap', 'EDM', 'Ambient'];

// AI Music styles and moods
const AI_STYLES = ['Cinematic', 'Trap', 'Lofi', 'Ambient', 'Synthwave', 'Afrobeat', 'Pop', 'Rock', 'Classical'];
const AI_MOODS = ['Happy', 'Dark', 'Dramatic', 'Chill', 'Inspiring', 'Energetic', 'Sad', 'Mysterious'];

const MusicModal = ({
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
  const [userTracks, setUserTracks] = useState([]); // AI + Upload tracks
  const [selectedTrack, setSelectedTrack] = useState(initialTrack || null);
  const [selectedGenre, setSelectedGenre] = useState('Sve');
  
  // Audio player
  const [playingTrackId, setPlayingTrackId] = useState(null);
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

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedTrack(initialTrack || null);
      setVolume(initialConfig?.volume ?? 0.35);
      setEnabled(initialConfig?.enabled ?? !!initialTrack);
      setActiveTab('library');
      setAiError(null);
      setUploadError(null);
      setPlayingTrackId(null);
      
      // TODO: Load user's saved tracks from backend
      // fetchUserTracks();
    }
  }, [open, initialConfig, initialTrack]);

  // Stop audio when modal closes
  useEffect(() => {
    if (!open && audioRef.current) {
      audioRef.current.pause();
      setPlayingTrackId(null);
    }
  }, [open]);

  // Filter library tracks by genre
  const filteredLibraryTracks = selectedGenre === 'All'
    ? libraryTracks
    : libraryTracks.filter(t => t.genre === selectedGenre);

  // Combined user tracks (AI + Upload)
  const hasUserTracks = userTracks.length > 0;

  // ============================================================
  // AUDIO PREVIEW
  // ============================================================
  const handlePlayPreview = (track) => {
    if (playingTrackId === track.id) {
      // Stop current
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      // Play new
      if (audioRef.current) {
        audioRef.current.src = track.url;
        audioRef.current.volume = volume;
        audioRef.current.play().catch(console.error);
        setPlayingTrackId(track.id);
      }
    }
  };

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
      // TODO: Prilagodi /api/music/generate svom backendu
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

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      setUploadError('Please select an audio file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File is too large (max 10MB)');
      return;
    }

    setUploadLoading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('audio', file);

      // TODO: Prilagodi /api/music/upload svom backendu
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
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ============================================================
  // REMOVE MUSIC
  // ============================================================
  const handleRemoveMusic = () => {
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
      case 'ai': return <FiCpu className="music-modal__source-icon music-modal__source-icon--ai" />;
      case 'upload': return <FiFolder className="music-modal__source-icon music-modal__source-icon--upload" />;
      default: return <FiDisc className="music-modal__source-icon music-modal__source-icon--library" />;
    }
  };

  if (!open) return null;

  return (
    <div className="music-modal-overlay" onClick={onClose}>
      <div className="music-modal" onClick={(e) => e.stopPropagation()}>
        {/* Hidden audio element for preview */}
        <audio 
          ref={audioRef} 
          onEnded={() => setPlayingTrackId(null)}
        />

        {/* Header */}
        <div className="music-modal__header">
          <h2 className="music-modal__title">
            <FiMusic /> Add Background Music
          </h2>
          <button className="music-modal__close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* Tabs */}
        <div className="music-modal__tabs">
          <button
            className={`music-modal__tab ${activeTab === 'library' ? 'music-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('library')}
          >
            <FiDisc /> Library
          </button>
          <button
            className={`music-modal__tab ${activeTab === 'ai' ? 'music-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <FiCpu /> AI Music
          </button>
          <button
            className={`music-modal__tab ${activeTab === 'upload' ? 'music-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <FiUpload /> Upload
          </button>
        </div>

        {/* Tab Content */}
        <div className="music-modal__content">
          {/* ============================================================ */}
          {/* TAB: LIBRARY */}
          {/* ============================================================ */}
          {activeTab === 'library' && (
            <div className="music-modal__library">
              {/* Genre Filter */}
              <div className="music-modal__genres">
                {GENRES.map((genre) => (
                  <button
                    key={genre}
                    className={`music-modal__genre-btn ${selectedGenre === genre ? 'music-modal__genre-btn--active' : ''}`}
                    onClick={() => setSelectedGenre(genre)}
                  >
                    {genre}
                  </button>
                ))}
              </div>

              {/* Track Grid */}
              <div className="music-modal__track-grid">
                {filteredLibraryTracks.map((track) => {
                  const isSelected = selectedTrack?.id === track.id;
                  const isPlaying = playingTrackId === track.id;
                  
                  return (
                    <div
                      key={track.id}
                      className={`music-modal__track-card ${isSelected ? 'music-modal__track-card--selected' : ''}`}
                      onClick={() => handleSelectTrack(track)}
                    >
                      <div className="music-modal__track-info">
                        <span className="music-modal__track-name">{track.name}</span>
                        <span className="music-modal__track-duration">{track.durationSeconds}s</span>
                      </div>
                      <button
                        className="music-modal__preview-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayPreview(track);
                        }}
                      >
                        {isPlaying ? <FiPause /> : <FiPlay />}
                      </button>
                      {isSelected && (
                        <div className="music-modal__selected-badge">
                          <FiCheck />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB: AI MUSIC */}
          {/* ============================================================ */}
          {activeTab === 'ai' && (
            <div className="music-modal__ai">
              <p className="music-modal__ai-desc">
                Generate unique AI music tailored to your video
              </p>

              <div className="music-modal__ai-form">
                <div className="music-modal__ai-row">
                  <div className="music-modal__ai-field">
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
                  <div className="music-modal__ai-field">
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

                <div className="music-modal__ai-row">
                  <div className="music-modal__ai-field">
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
                  <div className="music-modal__ai-field">
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
                  className="music-modal__ai-generate-btn"
                  onClick={handleGenerateAI}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <>
                      <FiLoader className="music-modal__spinner" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FiCpu /> Generate AI Music
                    </>
                  )}
                </button>

                {aiError && (
                  <div className="music-modal__error">{aiError}</div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB: UPLOAD */}
          {/* ============================================================ */}
          {activeTab === 'upload' && (
            <div className="music-modal__upload">
              <div
                className="music-modal__upload-zone"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadLoading ? (
                  <>
                    <FiLoader className="music-modal__spinner" size={32} />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <FiUpload size={32} />
                    <span>Click to upload audio file</span>
                    <span className="music-modal__upload-hint">MP3, WAV, M4A (max 10MB)</span>
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
                <div className="music-modal__error">{uploadError}</div>
              )}

              <div className="music-modal__upload-disclaimer">
                <strong>⚠️ Copyright notice:</strong>
                <p>
                  By uploading your own music, you take responsibility for copyrights. 
                  Instagram may remove videos with copyrighted music.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* USER TRACKS (AI + Upload) */}
        {/* ============================================================ */}
        {hasUserTracks && (
          <div className="music-modal__user-tracks">
            <h4 className="music-modal__section-title">My music</h4>
            <div className="music-modal__user-list">
              {userTracks.map((track) => {
                const isSelected = selectedTrack?.id === track.id;
                const isPlaying = playingTrackId === track.id;
                
                return (
                  <div
                    key={track.id}
                    className={`music-modal__user-item ${isSelected ? 'music-modal__user-item--selected' : ''}`}
                    onClick={() => handleSelectTrack(track)}
                  >
                    {getSourceIcon(track.sourceType)}
                    <div className="music-modal__user-item-info">
                      <span className="music-modal__user-item-name">{track.name}</span>
                      {track.durationSeconds && (
                        <span className="music-modal__user-item-duration">{track.durationSeconds}s</span>
                      )}
                    </div>
                    <button
                      className="music-modal__preview-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPreview(track);
                      }}
                    >
                      {isPlaying ? <FiPause /> : <FiPlay />}
                    </button>
                    {isSelected && <FiCheck className="music-modal__check" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SELECTED TRACK INFO */}
        {/* ============================================================ */}
        {selectedTrack && (
          <div className="music-modal__selected-info">
            <span className="music-modal__selected-label">Selected:</span>
            {getSourceIcon(selectedTrack.sourceType)}
            <span className="music-modal__selected-name">{selectedTrack.name}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* VOLUME SLIDER */}
        {/* ============================================================ */}
        <div className="music-modal__volume">
          <label className="music-modal__volume-label">
            <FiVolume2 /> Volume: {Math.round(volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="music-modal__volume-slider"
          />
        </div>

        {/* ============================================================ */}
        {/* FOOTER */}
        {/* ============================================================ */}
        <div className="music-modal__footer">
          <button
            className="music-modal__btn music-modal__btn--danger"
            onClick={handleRemoveMusic}
          >
            <FiTrash2 /> Remove music
          </button>
          <div className="music-modal__footer-right">
            <button
              className="music-modal__btn music-modal__btn--secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="music-modal__btn music-modal__btn--primary"
              onClick={handleApply}
            >
              <FiCheck /> Apply
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* COPYRIGHT DISCLAIMER */}
        {/* ============================================================ */}
        <div className="music-modal__disclaimer">
          Note: By using your own audio files, you take responsibility for copyrights. 
          We recommend royalty-free or AI generated music.
        </div>
      </div>
    </div>
  );
};

export default MusicModal;
