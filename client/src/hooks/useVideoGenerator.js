import { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useMusicLibrary } from './useMusicLibrary';
import { useTextCaptions } from './useTextCaptions';

/**
 * Main Video Generator Hook
 * Integrates music selection, text captions, and API calls
 * for complete video generation workflow
 */
export const useVideoGenerator = (options = {}) => {
  const {
    apiEndpoint = '/api/video/finalize',
    generateEndpoint = '/api/video/generate',
    onProgress,
    onComplete,
    onError
  } = options;

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  
  // Video settings
  const [videoSettings, setVideoSettings] = useState({
    prompt: '',
    subject: '',
    action: '',
    style: 'cinematic',
    aspectRatio: '9:16',
    duration: 10,
    model: 'damo-text2video',
    numFrames: 16,
    fps: 8
  });

  // Voiceover settings
  const [voiceoverSettings, setVoiceoverSettings] = useState({
    enabled: false,
    script: '',
    style: 'energetic',
    url: ''
  });

  // Preview state
  const [previewTime, setPreviewTime] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  // Use sub-hooks for music and captions
  const musicLibrary = useMusicLibrary();
  const textCaptions = useTextCaptions(videoSettings.duration);

  // Cancel token for aborting requests
  const cancelTokenRef = useRef(null);

  // Get auth token
  const getAuthToken = useCallback(() => {
    return localStorage.getItem('token');
  }, []);

  // Update video settings
  const updateVideoSettings = useCallback((updates) => {
    setVideoSettings(prev => ({
      ...prev,
      ...updates
    }));
    
    // If duration changes, update captions hook
    if (updates.duration && updates.duration !== videoSettings.duration) {
      // Captions hook will handle duration validation
    }
  }, [videoSettings.duration]);

  // Update voiceover settings
  const updateVoiceoverSettings = useCallback((updates) => {
    setVoiceoverSettings(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Generate voiceover from script
  const generateVoiceover = useCallback(async () => {
    if (!voiceoverSettings.script) {
      setError('Voiceover script is required');
      return { success: false, error: 'Script required' };
    }

    try {
      setGenerationStatus('Generating voiceover...');
      const token = getAuthToken();
      
      const response = await axios.post('/api/ai/voiceover', {
        script: voiceoverSettings.script,
        style: voiceoverSettings.style
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.audioUrl) {
        setVoiceoverSettings(prev => ({
          ...prev,
          url: response.data.audioUrl
        }));
        return { success: true, audioUrl: response.data.audioUrl };
      }
      
      return { success: false, error: 'No audio URL returned' };
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [voiceoverSettings, getAuthToken, onError]);

  // Generate base video from prompt
  const generateBaseVideo = useCallback(async () => {
    if (!videoSettings.prompt && !videoSettings.subject) {
      setError('Video prompt or subject is required');
      return { success: false, error: 'Prompt required' };
    }

    try {
      setIsGenerating(true);
      setGenerationProgress(10);
      setGenerationStatus('Starting video generation...');
      setError(null);
      
      const token = getAuthToken();
      cancelTokenRef.current = axios.CancelToken.source();

      const response = await axios.post(generateEndpoint, {
        ...videoSettings,
        negatives: videoSettings.negatives?.split(',').map(n => n.trim()).filter(n => n) || []
      }, {
        headers: { Authorization: `Bearer ${token}` },
        cancelToken: cancelTokenRef.current.token
      });

      if (response.data.predictionId) {
        // Start polling for status
        return await pollGenerationStatus(response.data.predictionId);
      }

      return { success: false, error: 'No prediction ID returned' };
    } catch (err) {
      if (axios.isCancel(err)) {
        return { success: false, error: 'Generation cancelled' };
      }
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [videoSettings, generateEndpoint, getAuthToken, onError]);

  // Poll for generation status
  const pollGenerationStatus = useCallback(async (predictionId) => {
    const token = getAuthToken();
    let attempts = 0;
    const maxAttempts = 60; // 3 minutes max

    const checkStatus = async () => {
      try {
        const response = await axios.get(`/api/ai/video/status/${predictionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const { status, output } = response.data;

        if (status === 'succeeded') {
          setGenerationProgress(50);
          setGenerationStatus('Video generated! Processing...');
          return { success: true, videoUrl: output };
        }
        
        if (status === 'failed' || status === 'canceled') {
          throw new Error('Video generation failed');
        }

        // Still processing
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Generation timed out');
        }

        setGenerationProgress(10 + (attempts / maxAttempts) * 40);
        setGenerationStatus(`Generating video... ${Math.round((attempts / maxAttempts) * 100)}%`);
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        return await checkStatus();
      } catch (err) {
        throw err;
      }
    };

    return await checkStatus();
  }, [getAuthToken]);

  // Finalize video with music and captions
  const finalizeVideo = useCallback(async (baseVideoUrl) => {
    try {
      setGenerationProgress(60);
      setGenerationStatus('Adding audio and captions...');
      
      const token = getAuthToken();
      
      const payload = {
        videoUrl: baseVideoUrl,
        overlays: textCaptions.getCaptionsForApi()
      };

      // Add voiceover if available
      if (voiceoverSettings.enabled && voiceoverSettings.url) {
        payload.voiceoverUrl = voiceoverSettings.url;
      }

      // Add music if selected
      const musicData = musicLibrary.getMusicData();
      if (musicData.url) {
        payload.musicUrl = musicData.url;
        payload.musicVolume = musicData.volume;
      }

      setGenerationProgress(70);
      
      const response = await axios.post(apiEndpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.url) {
        setGenerationProgress(100);
        setGenerationStatus('Complete!');
        setGeneratedVideoUrl(response.data.url);
        
        if (onComplete) onComplete(response.data.url);
        
        return { success: true, videoUrl: response.data.url };
      }

      throw new Error('No finalized video URL returned');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [apiEndpoint, getAuthToken, textCaptions, voiceoverSettings, musicLibrary, onComplete, onError]);

  // Main generate function - full pipeline
  const generateVideo = useCallback(async () => {
    try {
      setIsGenerating(true);
      setError(null);

      // Step 1: Generate voiceover if needed
      if (voiceoverSettings.enabled && voiceoverSettings.script && !voiceoverSettings.url) {
        setGenerationProgress(5);
        setGenerationStatus('Generating voiceover...');
        const voiceResult = await generateVoiceover();
        if (!voiceResult.success) {
          throw new Error(voiceResult.error);
        }
      }

      // Step 2: Generate base video
      const videoResult = await generateBaseVideo();
      if (!videoResult.success) {
        throw new Error(videoResult.error);
      }

      // Step 3: Finalize with audio and captions
      const finalResult = await finalizeVideo(videoResult.videoUrl);
      if (!finalResult.success) {
        throw new Error(finalResult.error);
      }

      return { success: true, videoUrl: finalResult.videoUrl };
    } catch (err) {
      setError(err.message);
      if (onError) onError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsGenerating(false);
    }
  }, [voiceoverSettings, generateVoiceover, generateBaseVideo, finalizeVideo, onError]);

  // Finalize existing video (skip generation)
  const finalizeExistingVideo = useCallback(async (existingVideoUrl) => {
    if (!existingVideoUrl) {
      setError('Video URL is required');
      return { success: false, error: 'Video URL required' };
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      // Generate voiceover if needed
      if (voiceoverSettings.enabled && voiceoverSettings.script && !voiceoverSettings.url) {
        await generateVoiceover();
      }

      const result = await finalizeVideo(existingVideoUrl);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsGenerating(false);
    }
  }, [voiceoverSettings, generateVoiceover, finalizeVideo]);

  // Cancel generation
  const cancelGeneration = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Generation cancelled by user');
    }
    setIsGenerating(false);
    setGenerationStatus('Cancelled');
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setIsGenerating(false);
    setGenerationProgress(0);
    setGenerationStatus('');
    setGeneratedVideoUrl(null);
    setError(null);
    setVideoSettings({
      prompt: '',
      subject: '',
      action: '',
      style: 'cinematic',
      aspectRatio: '9:16',
      duration: 10,
      model: 'damo-text2video',
      numFrames: 16,
      fps: 8
    });
    setVoiceoverSettings({
      enabled: false,
      script: '',
      style: 'energetic',
      url: ''
    });
    musicLibrary.clearSelection();
    textCaptions.clearAllCaptions();
  }, [musicLibrary, textCaptions]);

  // Get preview data for rendering
  const getPreviewData = useCallback(() => {
    return {
      music: musicLibrary.getMusicData(),
      captions: textCaptions.getCaptionsForApi(),
      voiceover: voiceoverSettings.enabled ? voiceoverSettings : null,
      videoSettings
    };
  }, [musicLibrary, textCaptions, voiceoverSettings, videoSettings]);

  return {
    // Generation state
    isGenerating,
    generationProgress,
    generationStatus,
    generatedVideoUrl,
    error,
    
    // Video settings
    videoSettings,
    updateVideoSettings,
    
    // Voiceover settings
    voiceoverSettings,
    updateVoiceoverSettings,
    generateVoiceover,
    
    // Sub-hooks (exposed for direct access)
    musicLibrary,
    textCaptions,
    
    // Preview
    previewTime,
    setPreviewTime,
    isPreviewPlaying,
    setIsPreviewPlaying,
    
    // Actions
    generateVideo,
    generateBaseVideo,
    finalizeVideo,
    finalizeExistingVideo,
    cancelGeneration,
    reset,
    
    // Helpers
    getPreviewData,
    hasMusic: musicLibrary.hasSelection,
    hasCaptions: textCaptions.hasCaption,
    hasVoiceover: voiceoverSettings.enabled && (voiceoverSettings.url || voiceoverSettings.script)
  };
};

export default useVideoGenerator;
