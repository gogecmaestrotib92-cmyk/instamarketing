import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for managing text captions/subtitles with timing
 * Supports multiple captions with start/end times, styling, and validation
 */
export const useTextCaptions = (videoDuration = 10) => {
  // Captions list
  const [captions, setCaptions] = useState([]);
  
  // Current editing caption
  const [editingId, setEditingId] = useState(null);
  
  // New caption form state
  const [newCaption, setNewCaption] = useState({
    text: '',
    start: 0,
    end: 3,
    style: 'default'
  });

  // Caption style presets
  const stylePresets = {
    default: {
      name: 'Default',
      fontFamily: 'Arial',
      fontSize: 24,
      color: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.7)',
      position: 'bottom', // top, center, bottom
      animation: 'fade' // none, fade, slide, pop
    },
    bold: {
      name: 'Bold Impact',
      fontFamily: 'Impact',
      fontSize: 32,
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
      position: 'center',
      animation: 'pop'
    },
    minimal: {
      name: 'Minimal',
      fontFamily: 'Helvetica Neue',
      fontSize: 20,
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      position: 'bottom',
      animation: 'fade'
    },
    colorful: {
      name: 'Colorful',
      fontFamily: 'Montserrat',
      fontSize: 28,
      color: '#FFD700',
      backgroundColor: 'rgba(225,48,108,0.8)',
      position: 'center',
      animation: 'slide'
    },
    subtitle: {
      name: 'Subtitle',
      fontFamily: 'Open Sans',
      fontSize: 22,
      color: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.8)',
      position: 'bottom',
      animation: 'none'
    },
    social: {
      name: 'Social Media',
      fontFamily: 'Poppins',
      fontSize: 36,
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
      position: 'center',
      animation: 'pop'
    }
  };

  // Generate unique ID
  const generateId = useCallback(() => {
    return `caption_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Validate caption timing
  const validateTiming = useCallback((start, end, excludeId = null) => {
    const errors = [];
    
    if (start < 0) {
      errors.push('Start time cannot be negative');
    }
    
    if (end <= start) {
      errors.push('End time must be after start time');
    }
    
    if (end > videoDuration) {
      errors.push(`End time cannot exceed video duration (${videoDuration}s)`);
    }
    
    // Check for overlaps with existing captions
    const overlapping = captions.find(cap => {
      if (cap.id === excludeId) return false;
      return (start < cap.end && end > cap.start);
    });
    
    if (overlapping) {
      errors.push(`Overlaps with "${overlapping.text.substring(0, 20)}..."`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, [captions, videoDuration]);

  // Add new caption
  const addCaption = useCallback((captionData = null) => {
    const data = captionData || newCaption;
    
    if (!data.text.trim()) {
      return { success: false, error: 'Caption text is required' };
    }
    
    const validation = validateTiming(data.start, data.end);
    if (!validation.isValid) {
      return { success: false, error: validation.errors[0] };
    }
    
    const caption = {
      id: generateId(),
      text: data.text.trim(),
      start: parseFloat(data.start),
      end: parseFloat(data.end),
      style: data.style || 'default',
      createdAt: Date.now()
    };
    
    setCaptions(prev => [...prev, caption].sort((a, b) => a.start - b.start));
    
    // Reset new caption form
    setNewCaption({
      text: '',
      start: data.end, // Start next caption where this one ends
      end: Math.min(data.end + 3, videoDuration),
      style: data.style
    });
    
    return { success: true, caption };
  }, [newCaption, validateTiming, generateId, videoDuration]);

  // Update existing caption
  const updateCaption = useCallback((id, updates) => {
    const caption = captions.find(c => c.id === id);
    if (!caption) {
      return { success: false, error: 'Caption not found' };
    }
    
    const newData = { ...caption, ...updates };
    
    // Validate if timing changed
    if (updates.start !== undefined || updates.end !== undefined) {
      const validation = validateTiming(newData.start, newData.end, id);
      if (!validation.isValid) {
        return { success: false, error: validation.errors[0] };
      }
    }
    
    setCaptions(prev => 
      prev.map(c => c.id === id ? newData : c).sort((a, b) => a.start - b.start)
    );
    
    return { success: true, caption: newData };
  }, [captions, validateTiming]);

  // Remove caption
  const removeCaption = useCallback((id) => {
    setCaptions(prev => prev.filter(c => c.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  }, [editingId]);

  // Clear all captions
  const clearAllCaptions = useCallback(() => {
    setCaptions([]);
    setEditingId(null);
    setNewCaption({
      text: '',
      start: 0,
      end: 3,
      style: 'default'
    });
  }, []);

  // Duplicate caption
  const duplicateCaption = useCallback((id) => {
    const caption = captions.find(c => c.id === id);
    if (!caption) return;
    
    // Find next available time slot
    let newStart = caption.end;
    let newEnd = newStart + (caption.end - caption.start);
    
    if (newEnd > videoDuration) {
      return { success: false, error: 'No room to duplicate caption' };
    }
    
    return addCaption({
      text: caption.text,
      start: newStart,
      end: newEnd,
      style: caption.style
    });
  }, [captions, videoDuration, addCaption]);

  // Start editing a caption
  const startEditing = useCallback((id) => {
    setEditingId(id);
  }, []);

  // Stop editing
  const stopEditing = useCallback(() => {
    setEditingId(null);
  }, []);

  // Update new caption form
  const updateNewCaption = useCallback((field, value) => {
    setNewCaption(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Get caption at specific time
  const getCaptionAtTime = useCallback((time) => {
    return captions.find(c => time >= c.start && time < c.end);
  }, [captions]);

  // Get captions for API (formatted as overlays)
  const getCaptionsForApi = useCallback(() => {
    return captions.map(c => ({
      text: c.text,
      start: c.start,
      end: c.end,
      style: stylePresets[c.style] || stylePresets.default
    }));
  }, [captions, stylePresets]);

  // Calculate total caption duration
  const totalCaptionDuration = useMemo(() => {
    return captions.reduce((sum, c) => sum + (c.end - c.start), 0);
  }, [captions]);

  // Get coverage percentage
  const coveragePercentage = useMemo(() => {
    return Math.round((totalCaptionDuration / videoDuration) * 100);
  }, [totalCaptionDuration, videoDuration]);

  // Get timeline gaps (unused time slots)
  const timelineGaps = useMemo(() => {
    if (captions.length === 0) {
      return [{ start: 0, end: videoDuration }];
    }
    
    const gaps = [];
    const sorted = [...captions].sort((a, b) => a.start - b.start);
    
    // Check for gap at the beginning
    if (sorted[0].start > 0) {
      gaps.push({ start: 0, end: sorted[0].start });
    }
    
    // Check for gaps between captions
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].end < sorted[i + 1].start) {
        gaps.push({ start: sorted[i].end, end: sorted[i + 1].start });
      }
    }
    
    // Check for gap at the end
    const lastCaption = sorted[sorted.length - 1];
    if (lastCaption.end < videoDuration) {
      gaps.push({ start: lastCaption.end, end: videoDuration });
    }
    
    return gaps;
  }, [captions, videoDuration]);

  // Import captions from SRT format
  const importFromSRT = useCallback((srtContent) => {
    const blocks = srtContent.trim().split(/\n\n+/);
    const imported = [];
    
    blocks.forEach(block => {
      const lines = block.split('\n');
      if (lines.length < 3) return;
      
      const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
      if (!timeMatch) return;
      
      const startTime = 
        parseInt(timeMatch[1]) * 3600 + 
        parseInt(timeMatch[2]) * 60 + 
        parseInt(timeMatch[3]) + 
        parseInt(timeMatch[4]) / 1000;
      
      const endTime = 
        parseInt(timeMatch[5]) * 3600 + 
        parseInt(timeMatch[6]) * 60 + 
        parseInt(timeMatch[7]) + 
        parseInt(timeMatch[8]) / 1000;
      
      const text = lines.slice(2).join('\n');
      
      imported.push({
        id: generateId(),
        text,
        start: startTime,
        end: endTime,
        style: 'subtitle',
        createdAt: Date.now()
      });
    });
    
    setCaptions(imported.sort((a, b) => a.start - b.start));
    return { success: true, count: imported.length };
  }, [generateId]);

  // Export captions to SRT format
  const exportToSRT = useCallback(() => {
    const formatTime = (seconds) => {
      const date = new Date(0);
      date.setMilliseconds(seconds * 1000);
      return date.toISOString().substr(11, 12).replace('.', ',');
    };
    
    return captions
      .sort((a, b) => a.start - b.start)
      .map((caption, index) => {
        return `${index + 1}\n${formatTime(caption.start)} --> ${formatTime(caption.end)}\n${caption.text}`;
      })
      .join('\n\n');
  }, [captions]);

  return {
    // State
    captions,
    editingId,
    newCaption,
    
    // Data
    stylePresets,
    
    // Actions
    addCaption,
    updateCaption,
    removeCaption,
    clearAllCaptions,
    duplicateCaption,
    startEditing,
    stopEditing,
    updateNewCaption,
    importFromSRT,
    exportToSRT,
    
    // Getters
    getCaptionAtTime,
    getCaptionsForApi,
    
    // Computed
    totalCaptionDuration,
    coveragePercentage,
    timelineGaps,
    captionCount: captions.length,
    hasCaption: captions.length > 0,
    
    // Validation
    validateTiming
  };
};

export default useTextCaptions;
