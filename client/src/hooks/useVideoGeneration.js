import { useState, useCallback } from 'react';
import axios from 'axios';

/**
 * Hook for generating videos with music and captions
 * Integrates with the /api/video/generate endpoint
 */
export const useVideoGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [currentJobId, setCurrentJobId] = useState(null);

  /**
   * Generate video with pre-generation options (music, captions)
   * @param {Object} videoOptions - Base video generation options
   * @param {Object} preGenPayload - Music and caption payload from useVideoPreGeneration
   */
  const generateVideo = useCallback(async (videoOptions, preGenPayload) => {
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      
      // Prepare the final payload
      const payload = {
        // Video generation options
        prompt: videoOptions.prompt || videoOptions.customPrompt,
        subject: videoOptions.subject,
        action: videoOptions.action,
        style: videoOptions.style,
        shotType: videoOptions.shotType,
        cameraMovement: videoOptions.cameraMovement,
        lighting: videoOptions.lighting,
        setting: videoOptions.setting,
        mood: videoOptions.mood,
        negatives: videoOptions.negatives,
        model: videoOptions.model || 'damo-text2video',
        numFrames: videoOptions.numFrames || 16,
        fps: videoOptions.fps || 8,
        guidanceScale: videoOptions.guidanceScale || 7.5,
        
        // Pre-generation options from music/caption modals
        music: preGenPayload?.music || null,
        captions: preGenPayload?.captions || [],
        subtitles: preGenPayload?.subtitles || null, // SRT format
        
        // Post-processing flags
        applyMusic: !!preGenPayload?.music,
        applyCaptions: preGenPayload?.captions?.length > 0,
      };

      // Initial generation request
      const response = await axios.post('/api/video/generate', payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const { predictionId, jobId } = response.data;
      setCurrentJobId(jobId || predictionId);
      setProgress(10);

      // Poll for status
      const pollStatus = async () => {
        try {
          const statusRes = await axios.get(
            `/api/ai/video/status/${predictionId}`,
            { headers: { Authorization: `Bearer ${token}` }}
          );

          const { status, output, progress: serverProgress } = statusRes.data;

          if (serverProgress) {
            setProgress(Math.max(10, Math.min(90, serverProgress)));
          }

          if (status === 'succeeded') {
            // If we have music or captions, finalize the video
            if (preGenPayload?.music || preGenPayload?.captions?.length > 0) {
              setProgress(90);
              const finalResult = await finalizeVideo(output, preGenPayload, token);
              setResult(finalResult);
            } else {
              setResult({ videoUrl: output, status: 'succeeded' });
            }
            setProgress(100);
            setIsGenerating(false);
            return;
          } else if (status === 'failed' || status === 'canceled') {
            throw new Error('Video generation failed');
          } else {
            // Continue polling
            setTimeout(pollStatus, 3000);
          }
        } catch (pollError) {
          console.error('Polling error:', pollError);
          setError(pollError.message);
          setIsGenerating(false);
        }
      };

      // Start polling
      pollStatus();

    } catch (err) {
      console.error('Generation error:', err);
      setError(err.response?.data?.error || err.message);
      setIsGenerating(false);
    }
  }, []);

  /**
   * Finalize video with music and captions
   */
  const finalizeVideo = async (videoUrl, preGenPayload, token) => {
    try {
      const finalizePayload = {
        videoUrl,
        musicUrl: preGenPayload.music?.url || null,
        musicVolume: preGenPayload.music?.volume || 0.7,
        overlays: preGenPayload.captions?.map(caption => ({
          text: caption.text,
          start: caption.startTime,
          end: caption.endTime,
          style: caption.style,
          animation: caption.animation,
          position: caption.position
        })) || [],
        subtitles: preGenPayload.subtitles // SRT format
      };

      const finalizeRes = await axios.post('/api/video/finalize', finalizePayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return {
        videoUrl: finalizeRes.data.url,
        originalUrl: videoUrl,
        status: 'succeeded',
        hasMusic: !!preGenPayload.music,
        hasCaptions: preGenPayload.captions?.length > 0
      };
    } catch (err) {
      console.error('Finalization error:', err);
      // Return original video if finalization fails
      return {
        videoUrl,
        status: 'partial',
        error: 'Finalization failed, returning base video'
      };
    }
  };

  /**
   * Cancel current generation
   */
  const cancelGeneration = useCallback(async () => {
    if (currentJobId) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`/api/video/cancel/${currentJobId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Cancel error:', err);
      }
    }
    setIsGenerating(false);
    setProgress(0);
    setCurrentJobId(null);
  }, [currentJobId]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setIsGenerating(false);
    setProgress(0);
    setError(null);
    setResult(null);
    setCurrentJobId(null);
  }, []);

  return {
    isGenerating,
    progress,
    error,
    result,
    generateVideo,
    cancelGeneration,
    reset
  };
};

export default useVideoGeneration;
