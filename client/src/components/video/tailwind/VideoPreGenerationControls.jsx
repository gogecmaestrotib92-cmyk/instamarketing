import React from 'react';
import { FiMusic, FiType, FiX, FiCheck, FiVolume2 } from 'react-icons/fi';
import MusicSelectorModal from './MusicSelectorModal';
import TextCaptionEditorModal from './TextCaptionEditorModal';
import { useVideoPreGeneration } from '../../../hooks/useVideoPreGeneration';

/**
 * VideoPreGenerationControls - Buttons and modals for adding music and captions
 * before generating a video
 */
const VideoPreGenerationControls = ({ 
  onPayloadChange,
  videoDuration = 30,
  className = ''
}) => {
  const {
    selectedMusic,
    musicVolume,
    handleMusicSelect,
    handleMusicRemove,
    captions,
    handleCaptionsSave,
    handleCaptionsRemove,
    isMusicModalOpen,
    setIsMusicModalOpen,
    isCaptionModalOpen,
    setIsCaptionModalOpen,
    buildPayload,
    getSummary,
    audioPreviewRef
  } = useVideoPreGeneration(videoDuration);

  // Notify parent of payload changes
  React.useEffect(() => {
    if (onPayloadChange) {
      onPayloadChange(buildPayload());
    }
  }, [selectedMusic, musicVolume, captions, buildPayload, onPayloadChange]);

  const summary = getSummary();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3">
        {/* Music Button */}
        <button
          onClick={() => setIsMusicModalOpen(true)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
            selectedMusic 
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50 hover:bg-purple-500/30' 
              : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:border-gray-600'
          }`}
        >
          <FiMusic className="w-5 h-5" />
          <span>{selectedMusic ? 'Music Added' : 'Add Music'}</span>
          {selectedMusic && (
            <span className="ml-1 px-2 py-0.5 bg-purple-500/30 rounded-full text-xs">
              {selectedMusic.name?.substring(0, 15)}...
            </span>
          )}
        </button>

        {/* Caption Button */}
        <button
          onClick={() => setIsCaptionModalOpen(true)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
            captions.length > 0 
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30' 
              : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:border-gray-600'
          }`}
        >
          <FiType className="w-5 h-5" />
          <span>{captions.length > 0 ? 'Captions Added' : 'Add Captions'}</span>
          {captions.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-blue-500/30 rounded-full text-xs">
              {captions.length} caption{captions.length !== 1 ? 's' : ''}
            </span>
          )}
        </button>
      </div>

      {/* Selection Summary */}
      {(selectedMusic || captions.length > 0) && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <h4 className="text-sm text-gray-400 mb-3">Pre-generation additions:</h4>
          
          <div className="space-y-2">
            {/* Music Summary */}
            {selectedMusic && (
              <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <FiMusic className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{selectedMusic.name}</p>
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <FiVolume2 className="w-3 h-3" />
                      {Math.round(musicVolume * 100)}% volume
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleMusicRemove}
                  className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FiX className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            )}

            {/* Captions Summary */}
            {captions.length > 0 && (
              <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FiType className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {captions.length} Caption{captions.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Total: {summary.totalCaptionDuration.toFixed(1)}s of text
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCaptionsRemove}
                  className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FiX className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            )}
          </div>

          {/* Validation Status */}
          <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center gap-2">
            {summary.isValid ? (
              <>
                <FiCheck className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm">Ready to generate</span>
              </>
            ) : (
              <>
                <FiX className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm">Some captions have issues</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <MusicSelectorModal
        isOpen={isMusicModalOpen}
        onClose={() => setIsMusicModalOpen(false)}
        onSelect={handleMusicSelect}
        selectedMusic={selectedMusic}
      />

      <TextCaptionEditorModal
        isOpen={isCaptionModalOpen}
        onClose={() => setIsCaptionModalOpen(false)}
        onSave={handleCaptionsSave}
        existingCaptions={captions}
        videoDuration={videoDuration}
      />

      {/* Hidden audio element for preview */}
      <audio ref={audioPreviewRef} className="hidden" />
    </div>
  );
};

export default VideoPreGenerationControls;
