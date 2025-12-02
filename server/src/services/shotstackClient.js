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
    resolution = 'hd', // hd = 1080p
    soundEffects = [] // Array of {url, startTime, name}
  } = options;

  // Calculate duration from subtitles if not provided
  let videoDuration = duration;
  if (!videoDuration && subtitles.length > 0) {
    videoDuration = Math.max(...subtitles.map(s => s.end));
  }
  if (!videoDuration) {
    videoDuration = 6; // Default 6 seconds if nothing else
  }

  // Build tracks array - IMPORTANT: In Shotstack, tracks are layered with the FIRST track on TOP
  // So we need to add text FIRST, then video LAST (so video is at the bottom)
  const tracks = [];

  // We'll build text clips first, then add them to tracks array in correct order
  let subtitleClips = [];
  
  // Build subtitle/text clips if any
  if (subtitles && subtitles.length > 0) {
    console.log('📝 Building subtitle/text clips:', subtitles.length, 'items');
    console.log('📝 Raw subtitles data:', JSON.stringify(subtitles, null, 2));
    
    // Filter out invalid subtitles (must have text and valid duration)
    const validSubtitles = subtitles.filter((sub, idx) => {
      console.log(`   [${idx}] Validating subtitle:`, JSON.stringify(sub));
      
      if (!sub.text || sub.text.trim() === '') {
        console.log(`   [${idx}] ❌ SKIPPED: Empty text`);
        return false;
      }
      if (typeof sub.start !== 'number' || typeof sub.end !== 'number') {
        console.log(`   [${idx}] ❌ SKIPPED: Invalid timing - start: ${typeof sub.start} (${sub.start}), end: ${typeof sub.end} (${sub.end})`);
        return false;
      }
      if (sub.end <= sub.start) {
        console.log(`   [${idx}] ❌ SKIPPED: Zero/negative duration - start: ${sub.start}, end: ${sub.end}, diff: ${sub.end - sub.start}`);
        return false;
      }
      console.log(`   [${idx}] ✅ VALID: "${sub.text.substring(0, 20)}..." (${sub.start}s - ${sub.end}s, duration: ${sub.end - sub.start}s)`);
      return true;
    });
    
    console.log(`📝 Valid subtitles after filtering: ${validSubtitles.length} of ${subtitles.length}`);
    
    if (validSubtitles.length > 0) {
      subtitleClips = validSubtitles.map((subtitle, index) => {
        const isFirst = index === 0;
        const isLast = index === validSubtitles.length - 1;
        const clipDuration = Math.max(0.1, subtitle.end - subtitle.start); // Minimum 0.1s duration

        // Build transitions
        const transition = {};
        if (isFirst) {
          transition.in = 'fade';
        }
        if (isLast) {
          transition.out = 'fade';
        }

        // Determine position offset based on position type
        // For 9:16 vertical video (1080x1920), keep text well within frame
        // Shotstack offset: positive y moves UP, negative y moves DOWN
        // Using center position with offset for more control
        let offset = { x: 0, y: -0.35 }; // Center position, offset down to lower third
        let position = 'center'; // Always use center for precise control
        
        // Adjust offset based on desired visual position
        const desiredPosition = subtitle.position || subtitleStyle.position || 'bottom';
        if (desiredPosition === 'top') {
          offset = { x: 0, y: 0.35 }; // Upper third of screen
        } else if (desiredPosition === 'center' || desiredPosition === 'middle') {
          offset = { x: 0, y: 0 }; // True center
        } else if (desiredPosition === 'bottom') {
          offset = { x: 0, y: -0.35 }; // Lower third - safe zone above Instagram UI
        }

        // Valid Shotstack styles: minimal, blockbuster, vogue, sketchy, skinny, chunk, chunkLight, marker, future, subtitle
        const VALID_STYLES = ['minimal', 'blockbuster', 'vogue', 'sketchy', 'skinny', 'chunk', 'chunkLight', 'marker', 'future', 'subtitle'];
        
        // Map custom styles to valid Shotstack styles
        const STYLE_MAP = {
          'modern': 'blockbuster',
          'classic': 'subtitle',
          'bold': 'chunk',
          'elegant': 'vogue',
          'handwritten': 'marker',
          'futuristic': 'future',
          'simple': 'minimal',
          'outline': 'skinny'
        };
        
        let requestedStyle = subtitle.style || subtitleStyle.style || 'blockbuster';
        let finalStyle = VALID_STYLES.includes(requestedStyle) 
          ? requestedStyle 
          : (STYLE_MAP[requestedStyle] || 'chunk');
        
        console.log(`   Style mapping: "${requestedStyle}" -> "${finalStyle}"`);
        console.log(`   Text ${index + 1}: "${subtitle.text?.substring(0, 30)}..." at ${position}, offset: ${JSON.stringify(offset)}`);

        // Instagram/YouTube Reels style - bold, punchy text
        // Using 'chunk' style for that viral TikTok/Reels look
        const clip = {
          asset: {
            type: 'title',
            text: subtitle.text.toUpperCase(), // ALL CAPS for viral style
            style: 'chunk', // Bold chunky style like viral reels
            size: 'medium', // Medium size - visible but fits on screen
            color: '#ffffff' // Pure white text
          },
          start: subtitle.start,
          length: clipDuration,
          position: position,
          offset: offset,
          transition: Object.keys(transition).length > 0 ? transition : undefined
        };
        
        console.log(`   📦 Created clip ${index + 1}:`, JSON.stringify(clip, null, 2));
        return clip;
      });

      console.log(`   ✅ Adding ${subtitleClips.length} subtitle clips to timeline`);
      // Store clips, we'll add them to tracks later in correct order
    } else {
      console.log('   ⚠️ No valid subtitles after filtering - text will NOT appear in video');
    }
  } else {
    console.log('📝 No subtitles/text array provided or empty');
  }

  // NOW build tracks in correct order
  // Per Shotstack docs: "Tracks are layered on top of each other in the same order 
  // they are added to the array with the TOP most track layered over those below it."
  // This means FIRST track in array = TOP layer, LAST track = BOTTOM layer
  // So we add TEXT FIRST (top), then VIDEO LAST (bottom)
  
  // Track 1: Subtitles/Text overlays (TOP layer - added FIRST!)
  if (subtitleClips.length > 0) {
    tracks.push({ clips: subtitleClips });
    console.log(`   📊 Added text track as track ${tracks.length} (TOP layer - first in array)`);
  }
  
  // Track 2: Main video (BOTTOM layer - added LAST!)
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
  console.log(`   📊 Added video track as track ${tracks.length} (BOTTOM layer - last in array)`);
  
  // Track 3: Sound effects (audio clips)
  if (soundEffects && soundEffects.length > 0) {
    console.log(`   🔊 Adding ${soundEffects.length} sound effect(s)...`);
    const soundClips = soundEffects.map((effect, index) => {
      console.log(`   🔊 Sound ${index + 1}: "${effect.name}" at ${effect.startTime || 0}s - URL: ${effect.url}`);
      return {
        asset: {
          type: 'audio',
          src: effect.url,
          volume: 1.5 // Boost sound effects volume
        },
        start: effect.startTime || 0,
        length: 10 // Max 10 seconds for sound effects (will be trimmed if shorter)
      };
    });
    
    tracks.push({ clips: soundClips });
    console.log(`   📊 Added sound effects track as track ${tracks.length}`);
  }
  
  console.log(`   📊 Total tracks: ${tracks.length}`);

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

  console.log('📋 Timeline built:', JSON.stringify(editPayload, null, 2));
  console.log('📋 Full timeline JSON (for debugging):');
  console.log(JSON.stringify(editPayload, null, 2));

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
      console.error('❌ Shotstack API error:', JSON.stringify(data, null, 2));
      // Log detailed validation errors
      if (data.response?.errors) {
        console.error('❌ Validation errors:', JSON.stringify(data.response.errors, null, 2));
      }
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
 * Get the status of a render job with FULL details
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
    // Add ?data=true to get the full timeline data back
    const response = await fetch(`${SHOTSTACK_HOST}/render/${jobId}?data=true`, {
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

    // Log detailed render info
    console.log(`📊 Render Status Details for ${jobId}:`);
    console.log(`   Status: ${status}`);
    console.log(`   Duration: ${renderResponse.duration || 'N/A'}s`);
    console.log(`   Render Time: ${renderResponse.renderTime || 'N/A'}ms`);
    
    if (renderResponse.error) {
      console.log(`   ❌ Error: ${renderResponse.error}`);
    }
    
    // Log the tracks info if available
    if (renderResponse.data?.timeline?.tracks) {
      console.log(`   📹 Tracks in render:`);
      renderResponse.data.timeline.tracks.forEach((track, i) => {
        console.log(`      Track ${i + 1}: ${track.clips?.length || 0} clips`);
        track.clips?.forEach((clip, j) => {
          console.log(`         Clip ${j + 1}: type=${clip.asset?.type}, start=${clip.start}, length=${clip.length}`);
          if (clip.asset?.type === 'text') {
            console.log(`            Text: "${clip.asset.text}"`);
          }
        });
      });
    }

    return {
      status: status,
      progress: renderResponse.progress || 0,
      url: status === 'done' ? renderResponse.url : null,
      error: status === 'failed' ? (renderResponse.error || 'Render failed') : null,
      duration: renderResponse.duration,
      renderTime: renderResponse.renderTime,
      data: renderResponse.data, // Include the full timeline data
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
