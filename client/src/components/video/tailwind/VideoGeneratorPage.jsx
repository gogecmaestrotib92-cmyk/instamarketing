import React, { useState } from 'react';
import { FiVideo, FiPlay, FiLoader, FiDownload, FiRefreshCw } from 'react-icons/fi';
import VideoPreGenerationControls from './VideoPreGenerationControls';
import { useVideoGeneration } from '../../../hooks/useVideoGeneration';

/**
 * Example page showing how to use the VideoPreGenerationControls
 * with the video generation flow
 */
const VideoGeneratorPage = () => {
  // Video generation state
  const [prompt, setPrompt] = useState('');
  const [videoDuration, setVideoDuration] = useState(10);
  const [preGenPayload, setPreGenPayload] = useState(null);

  const {
    isGenerating,
    progress,
    error,
    result,
    generateVideo,
    cancelGeneration,
    reset
  } = useVideoGeneration();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a video prompt');
      return;
    }

    const videoOptions = {
      prompt,
      style: 'cinematic',
      model: 'damo-text2video',
      numFrames: 16,
      fps: 8
    };

    await generateVideo(videoOptions, preGenPayload);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4">
            <FiVideo className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">AI Video Generator</h1>
          <p className="text-gray-400">Create stunning videos with AI, music, and captions</p>
        </div>

        {/* Main Form */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-6">
          {/* Prompt Input */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Video Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the video you want to create... e.g., 'A serene sunset over the ocean with gentle waves crashing on the shore'"
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Duration */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Video Duration (seconds)</label>
            <input
              type="number"
              value={videoDuration}
              onChange={(e) => setVideoDuration(parseInt(e.target.value) || 10)}
              min={5}
              max={60}
              className="w-32 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Pre-Generation Controls (Music & Captions) */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-3">Add Music & Captions</label>
            <VideoPreGenerationControls
              videoDuration={videoDuration}
              onPayloadChange={setPreGenPayload}
            />
          </div>

          {/* Generate Button */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <FiLoader className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FiPlay className="w-5 h-5" />
                  Generate Video
                </>
              )}
            </button>

            {isGenerating && (
              <button
                onClick={cancelGeneration}
                className="px-6 py-4 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Generating video...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Generated Video</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(result.videoUrl, '_blank')}
                  className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <FiDownload className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  New Video
                </button>
              </div>
            </div>

            <video
              src={result.videoUrl}
              controls
              className="w-full rounded-xl"
            />

            {/* Status badges */}
            <div className="flex gap-2 mt-4">
              {result.hasMusic && (
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                  🎵 Music Added
                </span>
              )}
              {result.hasCaptions && (
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                  📝 Captions Added
                </span>
              )}
            </div>
          </div>
        )}

        {/* Example Payload Preview (for debugging) */}
        {preGenPayload && (preGenPayload.music || preGenPayload.captions?.length > 0) && (
          <details className="mt-6">
            <summary className="text-gray-400 cursor-pointer hover:text-white">
              View API Payload Preview
            </summary>
            <pre className="mt-2 p-4 bg-gray-900 rounded-xl text-xs text-gray-400 overflow-auto max-h-64">
              {JSON.stringify(preGenPayload, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default VideoGeneratorPage;
