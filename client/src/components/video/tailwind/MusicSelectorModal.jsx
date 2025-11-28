import React, { useState, useRef, useEffect } from 'react';
import { FiMusic, FiUpload, FiPlay, FiPause, FiX, FiCheck, FiVolume2, FiLink } from 'react-icons/fi';

// Preset music tracks
const PRESET_TRACKS = [
  { id: 'energetic-beat', name: 'Energetic Beat', category: 'Upbeat', duration: '2:30', url: '/audio/presets/energetic-beat.mp3' },
  { id: 'cinematic-ambient', name: 'Cinematic Ambient', category: 'Cinematic', duration: '3:15', url: '/audio/presets/cinematic-ambient.mp3' },
  { id: 'corporate-lofi', name: 'Corporate Lo-Fi', category: 'Business', duration: '2:45', url: '/audio/presets/corporate-lofi.mp3' },
  { id: 'chill-vibes', name: 'Chill Vibes', category: 'Relaxed', duration: '3:00', url: '/audio/presets/chill-vibes.mp3' },
  { id: 'epic-trailer', name: 'Epic Trailer', category: 'Dramatic', duration: '1:45', url: '/audio/presets/epic-trailer.mp3' },
  { id: 'happy-ukulele', name: 'Happy Ukulele', category: 'Upbeat', duration: '2:20', url: '/audio/presets/happy-ukulele.mp3' },
  { id: 'tech-future', name: 'Tech Future', category: 'Modern', duration: '2:55', url: '/audio/presets/tech-future.mp3' },
  { id: 'emotional-piano', name: 'Emotional Piano', category: 'Emotional', duration: '3:30', url: '/audio/presets/emotional-piano.mp3' },
];

const CATEGORIES = ['All', 'Upbeat', 'Cinematic', 'Business', 'Relaxed', 'Dramatic', 'Modern', 'Emotional'];

const MusicSelectorModal = ({ isOpen, onClose, onSelect, selectedMusic }) => {
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'upload' | 'url'
  const [selectedTrack, setSelectedTrack] = useState(selectedMusic);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [volume, setVolume] = useState(0.7);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewingTrack, setPreviewingTrack] = useState(null);
  const [customUrl, setCustomUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  // Filter tracks by category
  const filteredTracks = categoryFilter === 'All' 
    ? PRESET_TRACKS 
    : PRESET_TRACKS.filter(track => track.category === categoryFilter);

  // Handle audio preview
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handlePreview = (track) => {
    if (previewingTrack?.id === track.id && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      setPreviewingTrack(track);
      if (audioRef.current) {
        audioRef.current.src = track.url;
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  };

  const handleSelectTrack = (track) => {
    setSelectedTrack(track);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        alert('Please upload an audio file');
        return;
      }
      
      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      const url = URL.createObjectURL(file);
      setUploadedFile({
        id: 'uploaded-' + Date.now(),
        name: file.name,
        category: 'Uploaded',
        duration: 'Unknown',
        url: url,
        file: file
      });
      setSelectedTrack({
        id: 'uploaded-' + Date.now(),
        name: file.name,
        category: 'Uploaded',
        url: url,
        file: file
      });
    }
  };

  const handleUrlSubmit = () => {
    if (customUrl) {
      const track = {
        id: 'url-' + Date.now(),
        name: 'Custom Track',
        category: 'External',
        url: customUrl
      };
      setSelectedTrack(track);
    }
  };

  const handleConfirm = () => {
    if (selectedTrack) {
      onSelect({
        ...selectedTrack,
        volume: volume
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FiMusic className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Select Music</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'presets' 
                ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FiMusic className="inline-block mr-2" />
            Preset Library
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'upload' 
                ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FiUpload className="inline-block mr-2" />
            Upload
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'url' 
                ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FiLink className="inline-block mr-2" />
            From URL
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {/* Presets Tab */}
          {activeTab === 'presets' && (
            <div>
              {/* Category Filter */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      categoryFilter === category
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Tracks List */}
              <div className="space-y-2">
                {filteredTracks.map(track => (
                  <div
                    key={track.id}
                    onClick={() => handleSelectTrack(track)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      selectedTrack?.id === track.id
                        ? 'bg-purple-500/20 border border-purple-500/50'
                        : 'bg-gray-800/50 hover:bg-gray-800 border border-transparent'
                    }`}
                  >
                    {/* Play Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(track);
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        previewingTrack?.id === track.id && isPlaying
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-purple-500 hover:text-white'
                      }`}
                    >
                      {previewingTrack?.id === track.id && isPlaying ? (
                        <FiPause className="w-4 h-4" />
                      ) : (
                        <FiPlay className="w-4 h-4 ml-0.5" />
                      )}
                    </button>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{track.name}</h4>
                      <p className="text-gray-500 text-sm">{track.category} • {track.duration}</p>
                    </div>

                    {/* Selected Indicator */}
                    {selectedTrack?.id === track.id && (
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <FiCheck className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="text-center py-8">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {!uploadedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-700 rounded-2xl p-8 cursor-pointer hover:border-purple-500 transition-colors"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                    <FiUpload className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-white font-medium mb-1">Click to upload audio</p>
                  <p className="text-gray-500 text-sm">MP3, WAV, AAC up to 50MB</p>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-xl p-4">
                  {uploadProgress < 100 ? (
                    <div>
                      <p className="text-white mb-2">Uploading...</p>
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                        <FiCheck className="w-6 h-6 text-green-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium">{uploadedFile.name}</p>
                        <p className="text-gray-500 text-sm">Ready to use</p>
                      </div>
                      <button
                        onClick={() => handlePreview(uploadedFile)}
                        className="p-2 bg-gray-700 rounded-lg hover:bg-purple-500 transition-colors"
                      >
                        {previewingTrack?.id === uploadedFile.id && isPlaying ? (
                          <FiPause className="w-5 h-5 text-white" />
                        ) : (
                          <FiPlay className="w-5 h-5 text-white" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* URL Tab */}
          {activeTab === 'url' && (
            <div className="py-4">
              <label className="block text-sm text-gray-400 mb-2">Enter audio URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/audio.mp3"
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  onClick={handleUrlSubmit}
                  disabled={!customUrl}
                  className="px-4 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
              {selectedTrack?.category === 'External' && (
                <div className="mt-4 p-3 bg-gray-800 rounded-xl flex items-center gap-3">
                  <FiCheck className="w-5 h-5 text-green-400" />
                  <span className="text-white">URL added successfully</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Volume Control */}
        <div className="px-4 py-3 border-t border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-3">
            <FiVolume2 className="w-5 h-5 text-gray-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <span className="text-sm text-gray-400 w-12 text-right">{Math.round(volume * 100)}%</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-800 bg-gray-900">
          <button
            onClick={() => {
              setSelectedTrack(null);
              onSelect(null);
              onClose();
            }}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Remove Music
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedTrack}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Confirm Selection
            </button>
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
        />
      </div>
    </div>
  );
};

export default MusicSelectorModal;
