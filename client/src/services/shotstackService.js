/**
 * Shotstack Video Render Service
 * 
 * Frontend helper for rendering videos with music and subtitles
 * using the Shotstack cloud rendering API.
 */

import api from './api';

/**
 * Render a video with music and subtitles using Shotstack
 * 
 * @param {Object} data - Render data
 * @param {string} data.videoUrl - URL of the source video (from Replicate)
 * @param {string} [data.audioUrl] - URL of background music
 * @param {Array} [data.subtitles] - Array of {text, start, end}
 * @param {Object} [data.options] - Additional render options
 * @param {Function} [onProgress] - Progress callback
 * @returns {Promise<Object>} - { success, url, error }
 * 
 * @example
 * const result = await renderFinalVideo({
 *   videoUrl: 'https://replicate.delivery/...',
 *   audioUrl: 'https://soundhelix.com/...',
 *   subtitles: [
 *     { text: 'Hello World', start: 0, end: 2.5 },
 *     { text: 'This is awesome!', start: 2.5, end: 5 }
 *   ]
 * });
 */
export async function renderFinalVideo(data, onProgress = null) {
  const { videoUrl, audioUrl, subtitles, options = {} } = data;

  if (!videoUrl) {
    return { success: false, error: 'videoUrl is required' };
  }

  try {
    // Option 1: Synchronous render (waits for completion)
    // This is simpler but may timeout on Vercel for long videos
    const response = await api.post('/render-video', {
      videoUrl,
      audioUrl,
      subtitles: subtitles || [],
      options
    });

    if (response.data.success) {
      return {
        success: true,
        url: response.data.url
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Render failed'
      };
    }

  } catch (error) {
    console.error('renderFinalVideo error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Render failed'
    };
  }
}

/**
 * Start an async render job (doesn't wait for completion)
 * Use this for long videos to avoid timeout
 * 
 * @param {Object} data - Same as renderFinalVideo
 * @returns {Promise<Object>} - { success, jobId, error }
 */
export async function startRenderJob(data) {
  const { videoUrl, audioUrl, subtitles, options = {} } = data;

  if (!videoUrl) {
    return { success: false, error: 'videoUrl is required' };
  }

  try {
    const response = await api.post('/render-video/start', {
      videoUrl,
      audioUrl,
      subtitles: subtitles || [],
      options
    });

    if (response.data.success) {
      return {
        success: true,
        jobId: response.data.jobId
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Failed to start render'
      };
    }

  } catch (error) {
    console.error('startRenderJob error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
}

/**
 * Check the status of a render job
 * 
 * @param {string} jobId - Shotstack job ID
 * @returns {Promise<Object>} - { success, status, progress, url, error }
 */
export async function checkRenderStatus(jobId) {
  if (!jobId) {
    return { success: false, error: 'jobId is required' };
  }

  try {
    const response = await api.get(`/render-video/status/${jobId}`);
    return {
      success: true,
      status: response.data.status,
      progress: response.data.progress,
      url: response.data.url,
      error: response.data.error
    };

  } catch (error) {
    console.error('checkRenderStatus error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
}

/**
 * Poll for render completion
 * 
 * @param {string} jobId - Shotstack job ID
 * @param {Object} options - Polling options
 * @param {number} [options.maxAttempts=60] - Max poll attempts
 * @param {number} [options.pollInterval=5000] - Ms between polls
 * @param {Function} [options.onProgress] - Progress callback
 * @returns {Promise<Object>} - { success, url, error }
 */
export async function pollRenderCompletion(jobId, options = {}) {
  const {
    maxAttempts = 60,
    pollInterval = 5000,
    onProgress = null
  } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const status = await checkRenderStatus(jobId);

    if (onProgress) {
      onProgress({
        attempt,
        maxAttempts,
        status: status.status,
        progress: status.progress
      });
    }

    // Check terminal states
    if (status.status === 'done' && status.url) {
      return { success: true, url: status.url };
    }

    if (status.status === 'failed') {
      return { success: false, error: status.error || 'Render failed' };
    }

    // Wait before next poll
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  return { success: false, error: 'Render timed out' };
}

/**
 * Complete async render workflow
 * Starts job, polls for completion, returns final URL
 * 
 * @param {Object} data - Render data
 * @param {Function} [onProgress] - Progress callback
 * @returns {Promise<Object>} - { success, url, error }
 */
export async function renderFinalVideoAsync(data, onProgress = null) {
  // Start the job
  const startResult = await startRenderJob(data);
  
  if (!startResult.success) {
    return startResult;
  }

  // Poll for completion
  return pollRenderCompletion(startResult.jobId, {
    maxAttempts: 120, // 10 minutes
    pollInterval: 5000,
    onProgress
  });
}

export default {
  renderFinalVideo,
  renderFinalVideoAsync,
  startRenderJob,
  checkRenderStatus,
  pollRenderCompletion
};
