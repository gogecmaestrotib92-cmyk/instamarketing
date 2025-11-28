import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for managing video pre-generation state
 * Handles music selection and text captions
 */
export const useVideoPreGeneration = (defaultVideoDuration = 30) => {
  // Music state
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [musicVolume, setMusicVolume] = useState(0.7);
  
  // Captions state
  const [captions, setCaptions] = useState([]);
  
  // Video duration for timeline
  const [videoDuration, setVideoDuration] = useState(defaultVideoDuration);
  
  // Modal states
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [isCaptionModalOpen, setIsCaptionModalOpen] = useState(false);
  
  // Audio preview ref
  const audioPreviewRef = useRef(null);

  // Music handlers
  const handleMusicSelect = useCallback((music) => {
    setSelectedMusic(music);
    if (music?.volume) {
      setMusicVolume(music.volume);
    }
  }, []);

  const handleMusicRemove = useCallback(() => {
    setSelectedMusic(null);
    setMusicVolume(0.7);
  }, []);

  const handleMusicPreview = useCallback(() => {
    if (audioPreviewRef.current && selectedMusic?.url) {
      if (audioPreviewRef.current.paused) {
        audioPreviewRef.current.src = selectedMusic.url;
        audioPreviewRef.current.volume = musicVolume;
        audioPreviewRef.current.play().catch(console.error);
      } else {
        audioPreviewRef.current.pause();
      }
    }
  }, [selectedMusic, musicVolume]);

  // Caption handlers
  const handleCaptionsSave = useCallback((newCaptions) => {
    setCaptions(newCaptions);
  }, []);

  const handleCaptionsRemove = useCallback(() => {
    setCaptions([]);
  }, []);

  const addCaption = useCallback((caption) => {
    setCaptions(prev => [...prev, { ...caption, id: Date.now() }]);
  }, []);

  const updateCaption = useCallback((id, updates) => {
    setCaptions(prev => prev.map(cap => 
      cap.id === id ? { ...cap, ...updates } : cap
    ));
  }, []);

  const removeCaption = useCallback((id) => {
    setCaptions(prev => prev.filter(cap => cap.id !== id));
  }, []);

  // Validate captions (check for overlaps, out of bounds, etc.)
  const validateCaptions = useCallback(() => {
    const errors = [];
    const sorted = [...captions].sort((a, b) => a.startTime - b.startTime);
    
    sorted.forEach((caption, index) => {
      // Check bounds
      if (caption.startTime < 0) {
        errors.push({ captionId: caption.id, error: 'Start time cannot be negative' });
      }
      if (caption.endTime > videoDuration) {
        errors.push({ captionId: caption.id, error: 'End time exceeds video duration' });
      }
      if (caption.startTime >= caption.endTime) {
        errors.push({ captionId: caption.id, error: 'Start time must be before end time' });
      }
      
      // Check overlap with next caption
      if (index < sorted.length - 1) {
        const next = sorted[index + 1];
        if (caption.endTime > next.startTime) {
          errors.push({ captionId: caption.id, error: 'Caption overlaps with next caption' });
        }
      }
    });
    
    return errors;
  }, [captions, videoDuration]);

  // Generate SRT format subtitles
  const generateSRT = useCallback(() => {
    const sorted = [...captions].sort((a, b) => a.startTime - b.startTime);
    
    return sorted.map((caption, index) => {
      const formatSRTTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.round((seconds % 1) * 1000);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
      };
      
      return `${index + 1}\n${formatSRTTime(caption.startTime)} --> ${formatSRTTime(caption.endTime)}\n${caption.text}\n`;
    }).join('\n');
  }, [captions]);

  // Build the final API payload
  const buildPayload = useCallback((additionalData = {}) => {
    return {
      ...additionalData,
      music: selectedMusic ? {
        id: selectedMusic.id,
        url: selectedMusic.url,
        name: selectedMusic.name,
        volume: musicVolume,
        // Include file if it was uploaded
        ...(selectedMusic.file && { file: selectedMusic.file })
      } : null,
      captions: captions.map(caption => ({
        id: caption.id,
        text: caption.text,
        startTime: caption.startTime,
        endTime: caption.endTime,
        style: {
          fontSize: caption.style?.fontSize || 24,
          fontWeight: caption.style?.fontWeight || 'normal',
          color: caption.style?.color || '#FFFFFF',
          background: caption.style?.background || 'rgba(0,0,0,0.7)'
        },
        animation: caption.animation || 'fade',
        position: caption.position || 'bottom'
      })),
      subtitles: generateSRT() // Include SRT format for backend processing
    };
  }, [selectedMusic, musicVolume, captions, generateSRT]);

  // Get current state summary
  const getSummary = useCallback(() => ({
    hasMusic: !!selectedMusic,
    musicName: selectedMusic?.name || null,
    musicVolume,
    captionCount: captions.length,
    totalCaptionDuration: captions.reduce((acc, cap) => acc + (cap.endTime - cap.startTime), 0),
    videoDuration,
    isValid: validateCaptions().length === 0
  }), [selectedMusic, musicVolume, captions, videoDuration, validateCaptions]);

  return {
    // Music state
    selectedMusic,
    musicVolume,
    setMusicVolume,
    handleMusicSelect,
    handleMusicRemove,
    handleMusicPreview,
    audioPreviewRef,
    
    // Caption state
    captions,
    handleCaptionsSave,
    handleCaptionsRemove,
    addCaption,
    updateCaption,
    removeCaption,
    
    // Validation
    validateCaptions,
    generateSRT,
    
    // Video duration
    videoDuration,
    setVideoDuration,
    
    // Modal states
    isMusicModalOpen,
    setIsMusicModalOpen,
    isCaptionModalOpen,
    setIsCaptionModalOpen,
    
    // Payload builder
    buildPayload,
    getSummary
  };
};

export default useVideoPreGeneration;
