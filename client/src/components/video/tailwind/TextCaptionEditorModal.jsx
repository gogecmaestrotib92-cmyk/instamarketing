import React, { useState, useRef, useEffect } from 'react';
import { FiType, FiPlus, FiTrash2, FiX, FiCheck, FiClock, FiMove, FiAlignCenter, FiEdit2 } from 'react-icons/fi';

// Caption styling presets
const STYLE_PRESETS = [
  { id: 'default', name: 'Default', fontSize: 24, fontWeight: 'normal', color: '#FFFFFF', background: 'rgba(0,0,0,0.7)' },
  { id: 'bold', name: 'Bold', fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', background: 'rgba(0,0,0,0.8)' },
  { id: 'subtle', name: 'Subtle', fontSize: 20, fontWeight: 'normal', color: '#E0E0E0', background: 'rgba(0,0,0,0.5)' },
  { id: 'highlight', name: 'Highlight', fontSize: 26, fontWeight: 'bold', color: '#FFFF00', background: 'rgba(0,0,0,0.9)' },
  { id: 'modern', name: 'Modern', fontSize: 24, fontWeight: '500', color: '#FFFFFF', background: 'transparent' },
];

const ANIMATION_OPTIONS = [
  { id: 'none', name: 'None' },
  { id: 'fade', name: 'Fade In/Out' },
  { id: 'slide-up', name: 'Slide Up' },
  { id: 'typewriter', name: 'Typewriter' },
  { id: 'bounce', name: 'Bounce In' },
];

const TextCaptionEditorModal = ({ isOpen, onClose, onSave, existingCaptions = [], videoDuration = 30 }) => {
  const [captions, setCaptions] = useState(existingCaptions);
  const [editingIndex, setEditingIndex] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('default');
  const [selectedAnimation, setSelectedAnimation] = useState('fade');
  const [currentCaption, setCurrentCaption] = useState({
    text: '',
    startTime: 0,
    endTime: 3,
    style: STYLE_PRESETS[0],
    animation: 'fade',
    position: 'bottom' // 'top' | 'center' | 'bottom'
  });
  
  const timelineRef = useRef(null);
  const [timelineWidth, setTimelineWidth] = useState(0);

  useEffect(() => {
    if (timelineRef.current) {
      setTimelineWidth(timelineRef.current.offsetWidth);
    }
  }, [isOpen]);

  useEffect(() => {
    if (existingCaptions.length > 0) {
      setCaptions(existingCaptions);
    }
  }, [existingCaptions]);

  // Format time as MM:SS.ms
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  // Parse time input
  const parseTimeInput = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : Math.max(0, Math.min(num, videoDuration));
  };

  // Add new caption
  const handleAddCaption = () => {
    if (!currentCaption.text.trim()) return;

    const stylePreset = STYLE_PRESETS.find(s => s.id === selectedStyle) || STYLE_PRESETS[0];
    
    const newCaption = {
      ...currentCaption,
      id: Date.now(),
      style: stylePreset,
      animation: selectedAnimation
    };

    if (editingIndex !== null) {
      const updated = [...captions];
      updated[editingIndex] = newCaption;
      setCaptions(updated);
      setEditingIndex(null);
    } else {
      setCaptions([...captions, newCaption]);
    }

    // Reset form
    setCurrentCaption({
      text: '',
      startTime: currentCaption.endTime,
      endTime: Math.min(currentCaption.endTime + 3, videoDuration),
      style: stylePreset,
      animation: selectedAnimation,
      position: 'bottom'
    });
  };

  // Edit existing caption
  const handleEditCaption = (index) => {
    const caption = captions[index];
    setCurrentCaption(caption);
    setSelectedStyle(caption.style?.id || 'default');
    setSelectedAnimation(caption.animation || 'fade');
    setEditingIndex(index);
  };

  // Delete caption
  const handleDeleteCaption = (index) => {
    setCaptions(captions.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setCurrentCaption({
        text: '',
        startTime: 0,
        endTime: 3,
        style: STYLE_PRESETS[0],
        animation: 'fade',
        position: 'bottom'
      });
    }
  };

  // Save all captions
  const handleSave = () => {
    onSave(captions);
    onClose();
  };

  // Calculate position on timeline
  const getTimelinePosition = (time) => {
    return (time / videoDuration) * 100;
  };

  // Get width on timeline
  const getTimelineWidth = (start, end) => {
    return ((end - start) / videoDuration) * 100;
  };

  // Sort captions by start time
  const sortedCaptions = [...captions].sort((a, b) => a.startTime - b.startTime);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FiType className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Text Captions Editor</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* Left Panel - Caption Form */}
          <div className="w-1/2 p-4 border-r border-gray-800 overflow-y-auto">
            <div className="space-y-4">
              {/* Caption Text */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Caption Text</label>
                <textarea
                  value={currentCaption.text}
                  onChange={(e) => setCurrentCaption({ ...currentCaption, text: e.target.value })}
                  placeholder="Enter caption text..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              {/* Timing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    <FiClock className="inline mr-1" /> Start Time (sec)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={videoDuration}
                    value={currentCaption.startTime}
                    onChange={(e) => setCurrentCaption({ 
                      ...currentCaption, 
                      startTime: parseTimeInput(e.target.value) 
                    })}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    <FiClock className="inline mr-1" /> End Time (sec)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={videoDuration}
                    value={currentCaption.endTime}
                    onChange={(e) => setCurrentCaption({ 
                      ...currentCaption, 
                      endTime: parseTimeInput(e.target.value) 
                    })}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Duration Display */}
              <div className="text-sm text-gray-500 text-center">
                Duration: {(currentCaption.endTime - currentCaption.startTime).toFixed(1)}s
              </div>

              {/* Style Presets */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Style Preset</label>
                <div className="grid grid-cols-5 gap-2">
                  {STYLE_PRESETS.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-2 rounded-lg text-xs font-medium transition-all ${
                        selectedStyle === style.id
                          ? 'bg-blue-500 text-white ring-2 ring-blue-400'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animation */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Animation</label>
                <select
                  value={selectedAnimation}
                  onChange={(e) => setSelectedAnimation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {ANIMATION_OPTIONS.map(anim => (
                    <option key={anim.id} value={anim.id}>{anim.name}</option>
                  ))}
                </select>
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <FiAlignCenter className="inline mr-1" /> Position
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['top', 'center', 'bottom'].map(pos => (
                    <button
                      key={pos}
                      onClick={() => setCurrentCaption({ ...currentCaption, position: pos })}
                      className={`py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                        currentCaption.position === pos
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add/Update Button */}
              <button
                onClick={handleAddCaption}
                disabled={!currentCaption.text.trim()}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {editingIndex !== null ? (
                  <>
                    <FiCheck className="w-5 h-5" />
                    Update Caption
                  </>
                ) : (
                  <>
                    <FiPlus className="w-5 h-5" />
                    Add Caption
                  </>
                )}
              </button>

              {editingIndex !== null && (
                <button
                  onClick={() => {
                    setEditingIndex(null);
                    setCurrentCaption({
                      text: '',
                      startTime: 0,
                      endTime: 3,
                      style: STYLE_PRESETS[0],
                      animation: 'fade',
                      position: 'bottom'
                    });
                  }}
                  className="w-full py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel Editing
                </button>
              )}
            </div>
          </div>

          {/* Right Panel - Caption List & Timeline */}
          <div className="w-1/2 p-4 overflow-y-auto">
            {/* Preview Area */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Preview</label>
              <div 
                className="relative bg-gray-800 rounded-xl overflow-hidden"
                style={{ aspectRatio: '16/9' }}
              >
                {/* Video placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-600 text-sm">Video Preview Area</span>
                </div>
                
                {/* Caption Preview */}
                {currentCaption.text && (
                  <div 
                    className={`absolute left-0 right-0 flex justify-center px-4 ${
                      currentCaption.position === 'top' ? 'top-4' : 
                      currentCaption.position === 'center' ? 'top-1/2 -translate-y-1/2' : 
                      'bottom-4'
                    }`}
                  >
                    <span 
                      className="px-4 py-2 rounded-lg text-center max-w-[90%]"
                      style={{
                        fontSize: STYLE_PRESETS.find(s => s.id === selectedStyle)?.fontSize || 24,
                        fontWeight: STYLE_PRESETS.find(s => s.id === selectedStyle)?.fontWeight || 'normal',
                        color: STYLE_PRESETS.find(s => s.id === selectedStyle)?.color || '#FFFFFF',
                        background: STYLE_PRESETS.find(s => s.id === selectedStyle)?.background || 'rgba(0,0,0,0.7)',
                      }}
                    >
                      {currentCaption.text}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Timeline ({videoDuration}s)</label>
              <div 
                ref={timelineRef}
                className="relative h-16 bg-gray-800 rounded-xl overflow-hidden"
              >
                {/* Time markers */}
                <div className="absolute inset-x-0 top-0 h-4 flex">
                  {Array.from({ length: 11 }).map((_, i) => (
                    <div key={i} className="flex-1 text-center">
                      <span className="text-[10px] text-gray-500">{Math.round((videoDuration / 10) * i)}s</span>
                    </div>
                  ))}
                </div>
                
                {/* Caption blocks */}
                <div className="absolute inset-x-2 top-5 bottom-2">
                  {sortedCaptions.map((caption, index) => (
                    <div
                      key={caption.id}
                      onClick={() => handleEditCaption(index)}
                      className="absolute h-full bg-blue-500/60 rounded cursor-pointer hover:bg-blue-500/80 transition-colors flex items-center justify-center overflow-hidden"
                      style={{
                        left: `${getTimelinePosition(caption.startTime)}%`,
                        width: `${getTimelineWidth(caption.startTime, caption.endTime)}%`,
                      }}
                    >
                      <span className="text-[10px] text-white truncate px-1">
                        {caption.text.substring(0, 15)}...
                      </span>
                    </div>
                  ))}
                  
                  {/* Current caption preview on timeline */}
                  {currentCaption.text && editingIndex === null && (
                    <div
                      className="absolute h-full bg-green-500/40 rounded border-2 border-dashed border-green-400 flex items-center justify-center"
                      style={{
                        left: `${getTimelinePosition(currentCaption.startTime)}%`,
                        width: `${getTimelineWidth(currentCaption.startTime, currentCaption.endTime)}%`,
                      }}
                    >
                      <span className="text-[10px] text-green-300">New</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Caption List */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Captions ({captions.length})
              </label>
              
              {captions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiType className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No captions added yet</p>
                  <p className="text-sm">Add your first caption using the form</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {sortedCaptions.map((caption, index) => (
                    <div
                      key={caption.id}
                      className={`flex items-center gap-2 p-3 rounded-xl transition-colors ${
                        editingIndex === index 
                          ? 'bg-blue-500/20 border border-blue-500/50' 
                          : 'bg-gray-800/50 hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{caption.text}</p>
                        <p className="text-gray-500 text-xs">
                          {formatTime(caption.startTime)} - {formatTime(caption.endTime)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEditCaption(captions.indexOf(caption))}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <FiEdit2 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteCaption(captions.indexOf(caption))}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-800 bg-gray-900">
          <button
            onClick={() => setCaptions([])}
            className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
            disabled={captions.length === 0}
          >
            Clear All
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Save Captions ({captions.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextCaptionEditorModal;
