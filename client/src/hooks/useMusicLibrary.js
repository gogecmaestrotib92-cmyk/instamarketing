import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for managing music library selection and preview
 * Handles both stock music and custom uploads
 */
export const useMusicLibrary = () => {
  // Selected music state
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [musicVolume, setMusicVolume] = useState(0.3); // Default 30% for background
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Custom upload state
  const [customMusicFile, setCustomMusicFile] = useState(null);
  const [customMusicUrl, setCustomMusicUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Audio element ref for preview
  const audioRef = useRef(null);

  // Stock music library
  const stockMusic = [
    { 
      id: 'energetic-beat',
      name: 'Energetic Beat', 
      url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1732800000/music/energetic-beat.mp3', 
      category: 'Upbeat',
      duration: 30,
      mood: 'energetic',
      bpm: 120
    },
    { 
      id: 'cinematic-ambient',
      name: 'Cinematic Ambient', 
      url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1732800000/music/cinematic-ambient.mp3', 
      category: 'Cinematic',
      duration: 45,
      mood: 'dramatic',
      bpm: 80
    },
    { 
      id: 'corporate-lofi',
      name: 'Corporate Lo-Fi', 
      url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1732800000/music/corporate-lofi.mp3', 
      category: 'Business',
      duration: 35,
      mood: 'professional',
      bpm: 90
    },
    { 
      id: 'chill-vibes',
      name: 'Chill Vibes', 
      url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1732800000/music/chill-vibes.mp3', 
      category: 'Relaxed',
      duration: 40,
      mood: 'calm',
      bpm: 70
    },
    { 
      id: 'epic-trailer',
      name: 'Epic Trailer', 
      url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1732800000/music/epic-trailer.mp3', 
      category: 'Dramatic',
      duration: 25,
      mood: 'epic',
      bpm: 140
    },
    { 
      id: 'happy-upbeat',
      name: 'Happy Upbeat', 
      url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1732800000/music/happy-upbeat.mp3', 
      category: 'Upbeat',
      duration: 30,
      mood: 'happy',
      bpm: 110
    },
    { 
      id: 'motivational',
      name: 'Motivational', 
      url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1732800000/music/motivational.mp3', 
      category: 'Inspiring',
      duration: 35,
      mood: 'inspiring',
      bpm: 100
    },
    { 
      id: 'tech-future',
      name: 'Tech Future', 
      url: 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1732800000/music/tech-future.mp3', 
      category: 'Modern',
      duration: 30,
      mood: 'futuristic',
      bpm: 128
    }
  ];

  // Categories for filtering
  const categories = [...new Set(stockMusic.map(m => m.category))];
  const moods = [...new Set(stockMusic.map(m => m.mood))];

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = musicVolume;
    
    audioRef.current.addEventListener('timeupdate', () => {
      setCurrentTime(audioRef.current.currentTime);
    });
    
    audioRef.current.addEventListener('loadedmetadata', () => {
      setDuration(audioRef.current.duration);
    });
    
    audioRef.current.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

  // Select music from library
  const selectMusic = useCallback((music) => {
    setSelectedMusic(music);
    setCustomMusicUrl('');
    setCustomMusicFile(null);
    
    if (audioRef.current) {
      audioRef.current.src = music.url;
      audioRef.current.load();
    }
  }, []);

  // Set custom music URL
  const setCustomUrl = useCallback((url) => {
    setCustomMusicUrl(url);
    setSelectedMusic(null);
    setCustomMusicFile(null);
    
    if (audioRef.current && url) {
      audioRef.current.src = url;
      audioRef.current.load();
    }
  }, []);

  // Handle custom file upload
  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload MP3, WAV, or OGG.');
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File too large. Maximum size is 10MB.');
    }
    
    setCustomMusicFile(file);
    setSelectedMusic(null);
    setCustomMusicUrl('');
    
    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file);
    if (audioRef.current) {
      audioRef.current.src = objectUrl;
      audioRef.current.load();
    }
    
    return objectUrl;
  }, []);

  // Preview controls
  const play = useCallback(() => {
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    stop();
    setSelectedMusic(null);
    setCustomMusicUrl('');
    setCustomMusicFile(null);
    if (audioRef.current) {
      audioRef.current.src = '';
    }
  }, [stop]);

  // Filter music by category
  const filterByCategory = useCallback((category) => {
    if (!category) return stockMusic;
    return stockMusic.filter(m => m.category === category);
  }, [stockMusic]);

  // Filter music by mood
  const filterByMood = useCallback((mood) => {
    if (!mood) return stockMusic;
    return stockMusic.filter(m => m.mood === mood);
  }, [stockMusic]);

  // Get the final music URL to use
  const getMusicUrl = useCallback(() => {
    if (selectedMusic) return selectedMusic.url;
    if (customMusicUrl) return customMusicUrl;
    if (customMusicFile) return URL.createObjectURL(customMusicFile);
    return null;
  }, [selectedMusic, customMusicUrl, customMusicFile]);

  // Get music data for API
  const getMusicData = useCallback(() => {
    return {
      url: getMusicUrl(),
      volume: musicVolume,
      source: selectedMusic ? 'stock' : (customMusicUrl ? 'url' : (customMusicFile ? 'upload' : null)),
      name: selectedMusic?.name || customMusicFile?.name || 'Custom Music'
    };
  }, [getMusicUrl, musicVolume, selectedMusic, customMusicUrl, customMusicFile]);

  return {
    // State
    selectedMusic,
    musicVolume,
    isPlaying,
    currentTime,
    duration,
    customMusicUrl,
    customMusicFile,
    isUploading,
    
    // Data
    stockMusic,
    categories,
    moods,
    
    // Actions
    selectMusic,
    setCustomUrl,
    handleFileUpload,
    setMusicVolume,
    play,
    pause,
    togglePlay,
    seek,
    stop,
    clearSelection,
    filterByCategory,
    filterByMood,
    
    // Getters
    getMusicUrl,
    getMusicData,
    
    // Helpers
    hasSelection: !!(selectedMusic || customMusicUrl || customMusicFile),
    audioRef
  };
};

export default useMusicLibrary;
