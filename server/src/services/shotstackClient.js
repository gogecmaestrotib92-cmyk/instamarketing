/**
 * Shotstack Video Rendering Client
 * 
 * Handles video rendering with music and subtitles using Shotstack API.
 * Used as replacement for FFmpeg on serverless platforms like Vercel.
 * 
 * Docs: https://shotstack.io/docs/api/
 */

const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY || 'dJmabLRWzY6RK4RnAAXQoIec84p8Uv9i1Cyo0qDE';
const SHOTSTACK_HOST = process.env.SHOTSTACK_HOST || 'https://api.shotstack.io/stage'; // Use 'https://api.shotstack.io/v1' for production

/**
 * Default subtitle style configuration
 * Valid Shotstack styles: minimal, blockbuster, vogue, sketchy, skinny, chunk, chunkLight, marker, future, subtitle
 */
const DEFAULT_SUBTITLE_STYLE = {
  style: 'blockbuster', // Bold, attention-grabbing style for reels
  color: '#ffffff',
  size: 'medium', // small, medium, large, x-large
  background: '#000000', // Background color for readability
  position: 'bottom',
  offset: {
    x: 0,
    y: -0.1 // Offset from bottom
  }
};

/**
 * Build Shotstack timeline JSON for 9:16 vertical video (1080x1920)
 * 
 * @param {string} videoUrl - URL of the source video
 * @param {string} audioUrl - URL of background music
 * @param {Array} subtitles - Array of subtitle objects {text, start, end}
 * @param {Object} options - Additional options
 * @returns {Object} Shotstack timeline object
 */
function buildTimeline(videoUrl, audioUrl, subtitles = [], options = {}) {
  const {
    duration = null, // Auto-detect if not provided
    subtitleStyle = DEFAULT_SUBTITLE_STYLE,
    videoVolume = 0, // Mute original video audio by default
    musicVolume = 1,
    fps = 25,
    resolution = 'hd' // hd = 1080p
  } = options;

  // Calculate duration from subtitles if not provided
  let videoDuration = duration;
  if (!videoDuration && subtitles.length > 0) {
    videoDuration = Math.max(...subtitles.map(s => s.end));
  }
  if (!videoDuration) {
    videoDuration = 6; // Default 6 seconds if nothing else
  }

  // Build tracks array (bottom to top layering)
  const tracks = [];

  // Track 1: Main video (bottom layer)
  tracks.push({
    clips: [
      {
        asset: {
          type: 'video',
          src: videoUrl,
          volume: videoVolume
        },
        start: 0,
        length: videoDuration,
        fit: 'cover', // Cover entire frame, crop if needed
        scale: 1,
        position: 'center'
      }
    ]
  });

  // Track 2: Subtitles (middle layer)
  if (subtitles && subtitles.length > 0) {
    const subtitleClips = subtitles.map((subtitle, index) => {
      const isFirst = index === 0;
      const isLast = index === subtitles.length - 1;
      const clipDuration = subtitle.end - subtitle.start;

      // Build transitions
      const transition = {};
      if (isFirst) {
        transition.in = 'fade';
      }
      if (isLast) {
        transition.out = 'fade';
      }

      // Valid Shotstack styles: minimal, blockbuster, vogue, sketchy, skinny, chunk, chunkLight, marker, future, subtitle
      return {
        asset: {
          type: 'title',
          text: subtitle.text,
          style: subtitleStyle.style || 'blockbuster',
          size: subtitleStyle.size || 'medium',
          color: subtitleStyle.color || '#ffffff',
          background: subtitleStyle.background || '#000000',
          position: subtitleStyle.position || 'bottom',
          offset: subtitleStyle.offset || { x: 0, y: -0.1 }
        },
        start: subtitle.start,
        length: clipDuration,
        transition: Object.keys(transition).length > 0 ? transition : undefined
      };
    });

    tracks.push({ clips: subtitleClips });
  }

  // Build soundtrack object (not array!)
  let soundtrack = null;
  if (audioUrl) {
    soundtrack = {
      src: audioUrl,
      effect: 'fadeOut', // Fade out at the end
      volume: musicVolume
    };
  }

  // Build full timeline
  const timeline = {
    background: '#000000',
    tracks: tracks,
    ...(soundtrack && { soundtrack })
  };

  // Build output configuration
  // Note: Can't use both 'resolution' and 'size' - they conflict
  const output = {
    format: 'mp4',
    fps: fps,
    size: {
      width: 1080,
      height: 1920
    }
  };

  return {
    timeline,
    output
  };
}

/**
 * Submit a render job to Shotstack
 * 
 * @param {string} videoUrl - URL of source video
 * @param {string} audioUrl - URL of background music (optional)
 * @param {Array} subtitles - Array of {text, start, end}
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - { success, jobId, message }
 */
async function createShotstackRender(videoUrl, audioUrl, subtitles = [], options = {}) {
  if (!SHOTSTACK_API_KEY) {
    throw new Error('SHOTSTACK_API_KEY environment variable is not set');
  }

  if (!videoUrl) {
    throw new Error('videoUrl is required');
  }

  console.log('🎬 Creating Shotstack render job...');
  console.log('   Video URL:', videoUrl);
  console.log('   Audio URL:', audioUrl || 'none');
  console.log('   Subtitles:', subtitles.length);

  // Build the timeline
  const editPayload = buildTimeline(videoUrl, audioUrl, subtitles, options);

  console.log('📋 Timeline built:', JSON.stringify(editPayload, null, 2).substring(0, 500) + '...');

  try {
    const response = await fetch(`${SHOTSTACK_HOST}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SHOTSTACK_API_KEY
      },
      body: JSON.stringify(editPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Shotstack API error:', data);
      throw new Error(data.message || `Shotstack API error: ${response.status}`);
    }

    console.log('✅ Render job submitted:', data.response?.id);

    return {
      success: true,
      jobId: data.response?.id,
      message: data.response?.message || 'Render job created'
    };

  } catch (error) {
    console.error('❌ Shotstack createRender error:', error.message);
    throw error;
  }
}

/**
 * Get the status of a render job
 * 
 * @param {string} jobId - Shotstack render job ID
 * @returns {Promise<Object>} - { status, progress, url, error }
 */
async function getRenderStatus(jobId) {
  if (!SHOTSTACK_API_KEY) {
    throw new Error('SHOTSTACK_API_KEY environment variable is not set');
  }

  if (!jobId) {
    throw new Error('jobId is required');
  }

  try {
    const response = await fetch(`${SHOTSTACK_HOST}/render/${jobId}`, {
      method: 'GET',
      headers: {
        'x-api-key': SHOTSTACK_API_KEY
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Shotstack API error: ${response.status}`);
    }

    const renderResponse = data.response;
    const status = renderResponse.status;

    return {
      status: status,
      progress: renderResponse.progress || 0,
      url: status === 'done' ? renderResponse.url : null,
      error: status === 'failed' ? (renderResponse.error || 'Render failed') : null,
      raw: renderResponse
    };

  } catch (error) {
    console.error('❌ Shotstack getStatus error:', error.message);
    throw error;
  }
}

/**
 * Poll for render completion
 * 
 * @param {string} jobId - Shotstack render job ID
 * @param {Object} options - Polling options
 * @returns {Promise<Object>} - { success, url, error }
 */
async function pollRenderStatus(jobId, options = {}) {
  const {
    maxAttempts = 60,      // Max 5 minutes (60 * 5s)
    pollInterval = 5000,   // 5 seconds
    onProgress = null      // Callback function for progress updates
  } = options;

  console.log(`⏳ Polling render status for job: ${jobId}`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const status = await getRenderStatus(jobId);

      console.log(`   Attempt ${attempt}/${maxAttempts}: ${status.status} (${status.progress}%)`);

      // Call progress callback if provided
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
        console.log('✅ Render complete:', status.url);
        return {
          success: true,
          url: status.url
        };
      }

      if (status.status === 'failed') {
        console.error('❌ Render failed:', status.error);
        return {
          success: false,
          error: status.error || 'Render job failed'
        };
      }

      // Wait before next poll
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }

    } catch (error) {
      console.error(`   Poll attempt ${attempt} error:`, error.message);
      // Continue polling on transient errors
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
  }

  return {
    success: false,
    error: 'Render timed out after maximum attempts'
  };
}

/**
 * Complete render workflow: submit job and poll until done
 * 
 * @param {string} videoUrl - URL of source video
 * @param {string} audioUrl - URL of background music
 * @param {Array} subtitles - Array of {text, start, end}
 * @param {Object} options - Options for rendering and polling
 * @returns {Promise<Object>} - { success, url, error }
 */
async function renderVideo(videoUrl, audioUrl, subtitles = [], options = {}) {
  try {
    // Step 1: Submit render job
    const createResult = await createShotstackRender(videoUrl, audioUrl, subtitles, options);

    if (!createResult.success || !createResult.jobId) {
      throw new Error('Failed to create render job');
    }

    // Step 2: Poll for completion
    const renderResult = await pollRenderStatus(createResult.jobId, {
      maxAttempts: options.maxAttempts || 60,
      pollInterval: options.pollInterval || 5000,
      onProgress: options.onProgress
    });

    return renderResult;

  } catch (error) {
    console.error('❌ renderVideo error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Sample timeline template for 9:16 vertical reels
 * Use this as a reference for building custom timelines
 */
const VERTICAL_REEL_TEMPLATE = {
  timeline: {
    background: '#000000',
    tracks: [
      // Track 0: Main video (bottom layer)
      {
        clips: [
          {
            asset: {
              type: 'video',
              src: '{{VIDEO_URL}}',
              volume: 0
            },
            start: 0,
            length: '{{DURATION}}',
            fit: 'cover',
            scale: 1,
            position: 'center'
          }
        ]
      },
      // Track 1: Subtitles (top layer)
      {
        clips: [
          {
            asset: {
              type: 'title',
              text: '{{SUBTITLE_TEXT}}',
              style: 'Montserrat ExtraBold',
              size: '40px',
              color: '#ffffff',
              background: 'transparent',
              position: 'bottom',
              offset: {
                x: 0,
                y: -0.15
              }
            },
            start: '{{START}}',
            length: '{{LENGTH}}',
            transition: {
              in: 'fade',
              out: 'fade'
            }
          }
        ]
      }
    ],
    soundtrack: [
      {
        src: '{{AUDIO_URL}}',
        effect: 'fadeOut',
        volume: 1
      }
    ]
  },
  output: {
    format: 'mp4',
    resolution: 'hd',
    aspectRatio: '9:16',
    fps: 25,
    size: {
      width: 1080,
      height: 1920
    }
  }
};

module.exports = {
  createShotstackRender,
  getRenderStatus,
  pollRenderStatus,
  renderVideo,
  buildTimeline,
  DEFAULT_SUBTITLE_STYLE,
  VERTICAL_REEL_TEMPLATE
};
