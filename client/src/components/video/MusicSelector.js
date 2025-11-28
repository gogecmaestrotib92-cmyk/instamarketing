import React, { useState, useCallback } from 'react';
import { 
  FiMusic, 
  FiPlay, 
  FiPause, 
  FiVolume2, 
  FiVolumeX,
  FiUpload,
  FiLink,
  FiCheck,
  FiX,
  FiSearch
} from 'react-icons/fi';
import './MusicSelector.css';

/**
 * MusicSelector Component
 * Allows users to select background music from library, upload custom, or enter URL
 */
const MusicSelector = ({ 
  musicHook, // Result from useMusicLibrary hook
  onSelect,
  compact = false 
}) => {
  const {
    selectedMusic,
    musicVolume,
    isPlaying,
    currentTime,
    duration,
    customMusicUrl,
    stockMusic,
    categories,
    selectMusic,
    setCustomUrl,
    handleFileUpload,
    setMusicVolume,
    togglePlay,
    seek,
    clearSelection,
    hasSelection
  } = musicHook;

  const [activeTab, setActiveTab] = useState('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isUrlValid, setIsUrlValid] = useState(true);

  // Filter music based on search and category
  const filteredMusic = stockMusic.filter(track => {
    const matchesSearch = !searchQuery || 
      track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.mood.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || track.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Handle file drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file).catch(err => {
        console.error('Upload error:', err);
      });
    }
  }, [handleFileUpload]);

  // Handle file input
  const handleFileInput = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file).catch(err => {
        console.error('Upload error:', err);
      });
    }
  }, [handleFileUpload]);

  // Handle URL submit
  const handleUrlSubmit = useCallback(() => {
    // Basic URL validation
    try {
      new URL(urlInput);
      setIsUrlValid(true);
      setCustomUrl(urlInput);
      if (onSelect) onSelect({ type: 'url', url: urlInput });
    } catch {
      setIsUrlValid(false);
    }
  }, [urlInput, setCustomUrl, onSelect]);

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle track selection
  const handleTrackSelect = useCallback((track) => {
    selectMusic(track);
    if (onSelect) onSelect({ type: 'library', track });
  }, [selectMusic, onSelect]);

  if (compact) {
    // Compact mode for inline use
    return (
      <div className="music-selector-compact">
        <div className="compact-header">
          <FiMusic />
          <span>{hasSelection ? (selectedMusic?.name || 'Custom Music') : 'No music selected'}</span>
          {hasSelection && (
            <button className="btn-icon" onClick={clearSelection}>
              <FiX />
            </button>
          )}
        </div>
        {hasSelection && (
          <div className="compact-controls">
            <button className="btn-icon" onClick={togglePlay}>
              {isPlaying ? <FiPause /> : <FiPlay />}
            </button>
            <input 
              type="range" 
              min="0" 
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="seek-bar"
            />
            <span className="time">{formatTime(currentTime)}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="music-selector">
      {/* Tabs */}
      <div className="music-tabs">
        <button 
          className={`tab ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <FiMusic /> Biblioteka
        </button>
        <button 
          className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <FiUpload /> Upload
        </button>
        <button 
          className={`tab ${activeTab === 'url' ? 'active' : ''}`}
          onClick={() => setActiveTab('url')}
        >
          <FiLink /> URL
        </button>
      </div>

      {/* Library Tab */}
      {activeTab === 'library' && (
        <div className="library-content">
          {/* Search and Filter */}
          <div className="library-filters">
            <div className="search-box">
              <FiSearch />
              <input 
                type="text"
                placeholder="Pretraži muziku..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-filter"
            >
              <option value="">Sve kategorije</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Music Grid */}
          <div className="music-grid">
            {filteredMusic.map(track => (
              <div 
                key={track.id}
                className={`music-card ${selectedMusic?.id === track.id ? 'selected' : ''}`}
                onClick={() => handleTrackSelect(track)}
              >
                <div className="music-card-header">
                  <span className="music-name">{track.name}</span>
                  {selectedMusic?.id === track.id && <FiCheck className="check-icon" />}
                </div>
                <div className="music-card-meta">
                  <span className="category-badge">{track.category}</span>
                  <span className="duration">{formatTime(track.duration)}</span>
                </div>
                <div className="music-card-footer">
                  <span className="mood">{track.mood}</span>
                  <span className="bpm">{track.bpm} BPM</span>
                </div>
              </div>
            ))}
          </div>

          {filteredMusic.length === 0 && (
            <div className="empty-state">
              <FiMusic size={32} />
              <p>Nema rezultata za "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div 
          className="upload-zone"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <FiUpload size={40} />
          <p>Prevucite audio fajl ovde</p>
          <span>ili</span>
          <label className="upload-btn">
            Izaberite fajl
            <input 
              type="file" 
              accept="audio/*"
              onChange={handleFileInput}
              hidden
            />
          </label>
          <small>MP3, WAV, OGG - Max 10MB</small>
        </div>
      )}

      {/* URL Tab */}
      {activeTab === 'url' && (
        <div className="url-input-section">
          <div className="url-input-group">
            <input 
              type="text"
              placeholder="https://example.com/music.mp3"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setIsUrlValid(true);
              }}
              className={!isUrlValid ? 'invalid' : ''}
            />
            <button 
              className="btn-primary"
              onClick={handleUrlSubmit}
              disabled={!urlInput}
            >
              <FiCheck /> Primeni
            </button>
          </div>
          {!isUrlValid && (
            <span className="error-text">Unesite validan URL</span>
          )}
        </div>
      )}

      {/* Preview & Controls */}
      {hasSelection && (
        <div className="music-preview">
          <div className="preview-header">
            <div className="preview-info">
              <FiMusic />
              <div>
                <strong>{selectedMusic?.name || 'Custom Music'}</strong>
                {selectedMusic && <span className="preview-meta">{selectedMusic.category}</span>}
              </div>
            </div>
            <button className="btn-clear" onClick={clearSelection}>
              <FiX /> Ukloni
            </button>
          </div>

          <div className="preview-player">
            <button className="play-btn" onClick={togglePlay}>
              {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
            </button>
            
            <div className="seek-container">
              <input 
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="seek-slider"
              />
              <div className="time-display">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          <div className="volume-control">
            <button className="btn-icon" onClick={() => setMusicVolume(musicVolume > 0 ? 0 : 0.3)}>
              {musicVolume > 0 ? <FiVolume2 /> : <FiVolumeX />}
            </button>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVolume}
              onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
              className="volume-slider"
            />
            <span className="volume-label">{Math.round(musicVolume * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicSelector;
