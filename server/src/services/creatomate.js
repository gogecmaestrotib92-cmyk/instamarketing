/**
 * Creatomate Video Composition Service
 * 
 * Creatomate is a cloud-based video generation API that allows
 * composing videos with audio, text overlays, and multiple clips.
 * 
 * Free tier: 50 videos/month, no watermarks
 * 
 * API Docs: https://creatomate.com/docs/api/introduction
 */

const CREATOMATE_API_KEY = process.env.CREATOMATE_API_KEY;
const CREATOMATE_API_URL = 'https://api.creatomate.com/v1';

/**
 * Check if Creatomate is configured
 */
function isAvailable() {
  return !!CREATOMATE_API_KEY;
}

/**
 * Create a video render job
 * 
 * @param {Object} options - Render options
 * @param {Array} options.clips - Array of video clip objects with url, duration, startTime
 * @param {string} options.audioUrl - URL of the audio track
 * @param {Array} options.subtitles - Array of subtitle objects with text, start, end
 * @param {number} options.duration - Total video duration in seconds
 * @param {string} options.aspectRatio - Aspect ratio (9:16 for vertical)
 * @returns {Promise<Object>} - Render job response
 */
async function createRender(options) {
  const {
    clips = [],
    audioUrl,
    subtitles = [],
    duration = 15,
    aspectRatio = '9:16',
    width = 1080,
    height = 1920
  } = options;

  if (!CREATOMATE_API_KEY) {
    throw new Error('Creatomate API key not configured');
  }

  console.log('🎬 Creating Creatomate render...');
  console.log(`   Clips: ${clips.length}`);
  console.log(`   Audio: ${audioUrl ? 'yes' : 'no'}`);
  console.log(`   Subtitles: ${subtitles.length}`);
  console.log(`   Duration: ${duration}s`);

  // Build the template elements
  const elements = [];

  // Add video clips as composition elements
  if (clips.length > 0) {
    clips.forEach((clip, index) => {
      elements.push({
        type: 'video',
        source: clip.url,
        duration: clip.duration || clip.useDuration,
        time: clip.startTime || clip.startAt || 0,
        // Fit video to frame
        fit: 'cover',
        // Trim source video if needed
        trim_start: 0,
        trim_duration: clip.duration || clip.useDuration
      });
    });
  }

  // Add audio track
  if (audioUrl) {
    elements.push({
      type: 'audio',
      source: audioUrl,
      duration: duration,
      time: 0
    });
  }

  // Add subtitles as text elements
  if (subtitles.length > 0) {
    subtitles.forEach((sub, index) => {
      elements.push({
        type: 'text',
        text: sub.text,
        time: sub.start,
        duration: sub.duration || (sub.end - sub.start),
        // Positioning at bottom
        y: '85%',
        width: '90%',
        x_alignment: '50%',
        // Styling
        font_family: 'Montserrat',
        font_weight: '700',
        font_size: '7 vmin',
        fill_color: '#ffffff',
        stroke_color: '#000000',
        stroke_width: '0.5 vmin',
        background_color: 'rgba(0,0,0,0.6)',
        background_x_padding: '3%',
        background_y_padding: '2%',
        background_border_radius: '5%'
      });
    });
  }

  // Create the render request
  const renderData = {
    output_format: 'mp4',
    width: width,
    height: height,
    frame_rate: 30,
    elements: elements
  };

  try {
    const response = await fetch(`${CREATOMATE_API_URL}/renders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CREATOMATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(renderData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Creatomate API error:', response.status, errorText);
      throw new Error(`Creatomate API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Creatomate render created:', result.id || result[0]?.id);

    // Creatomate returns an array of renders
    const render = Array.isArray(result) ? result[0] : result;

    return {
      success: true,
      renderId: render.id,
      status: render.status,
      url: render.url // Will be populated when render completes
    };
  } catch (error) {
    console.error('Creatomate render error:', error);
    throw error;
  }
}

/**
 * Create a multi-clip video with scene transitions
 * 
 * @param {Object} options - Render options
 */
async function createMultiClipRender(options) {
  const {
    clips = [],
    audioUrl,
    subtitles = [],
    totalDuration = 15
  } = options;

  if (!CREATOMATE_API_KEY) {
    throw new Error('Creatomate API key not configured');
  }

  console.log('🎬 Creating Creatomate multi-clip render...');
  console.log(`   Clips: ${clips.length}`);
  console.log(`   Audio: ${audioUrl ? 'yes' : 'no'}`);
  console.log(`   Subtitles: ${subtitles.length}`);
  console.log(`   Total Duration: ${totalDuration}s`);

  // Build video track with clips in sequence
  const videoElements = [];
  let currentTime = 0;

  clips.forEach((clip, index) => {
    const clipDuration = clip.useDuration || clip.duration || (totalDuration / clips.length);
    
    videoElements.push({
      type: 'video',
      track: 1,
      source: clip.url,
      time: currentTime,
      duration: clipDuration,
      fit: 'cover',
      trim_start: 0,
      trim_duration: Math.min(clipDuration, clip.sourceDuration || 60)
    });

    currentTime += clipDuration;
  });

  // Audio track
  const audioElements = [];
  if (audioUrl) {
    audioElements.push({
      type: 'audio',
      track: 2,
      source: audioUrl,
      time: 0,
      duration: totalDuration
    });
  }

  // Subtitle track
  const subtitleElements = [];
  subtitles.forEach((sub) => {
    subtitleElements.push({
      type: 'text',
      track: 3,
      text: sub.text,
      time: sub.start,
      duration: sub.duration || (sub.end - sub.start),
      y: '80%',
      width: '90%',
      x_alignment: '50%',
      y_alignment: '50%',
      font_family: 'Montserrat',
      font_weight: '800',
      font_size: '6 vmin',
      fill_color: '#ffffff',
      stroke_color: '#000000',
      stroke_width: '0.4 vmin',
      shadow_color: 'rgba(0,0,0,0.8)',
      shadow_blur: '2 vmin',
      background_color: 'rgba(0,0,0,0.5)',
      background_x_padding: '4%',
      background_y_padding: '2%',
      background_border_radius: '8%'
    });
  });

  const allElements = [...videoElements, ...audioElements, ...subtitleElements];

  const renderData = {
    output_format: 'mp4',
    width: 1080,
    height: 1920,
    frame_rate: 30,
    duration: totalDuration,
    elements: allElements
  };

  try {
    const response = await fetch(`${CREATOMATE_API_URL}/renders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CREATOMATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(renderData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Creatomate API error:', response.status, errorText);
      throw new Error(`Creatomate API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const render = Array.isArray(result) ? result[0] : result;

    console.log('✅ Creatomate multi-clip render created:', render.id);
    console.log(`   Status: ${render.status}`);

    return {
      success: true,
      renderId: render.id,
      status: render.status,
      url: render.url
    };
  } catch (error) {
    console.error('Creatomate multi-clip render error:', error);
    throw error;
  }
}

/**
 * Check render status
 * 
 * @param {string} renderId - The render job ID
 * @returns {Promise<Object>} - Render status
 */
async function getRenderStatus(renderId) {
  if (!CREATOMATE_API_KEY) {
    throw new Error('Creatomate API key not configured');
  }

  try {
    const response = await fetch(`${CREATOMATE_API_URL}/renders/${renderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CREATOMATE_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get render status: ${response.status}`);
    }

    const render = await response.json();

    return {
      success: true,
      renderId: render.id,
      status: render.status, // 'planned', 'rendering', 'succeeded', 'failed'
      progress: render.progress,
      url: render.url, // Available when status is 'succeeded'
      error: render.error_message
    };
  } catch (error) {
    console.error('Creatomate status check error:', error);
    throw error;
  }
}

/**
 * Wait for render to complete (with polling)
 * 
 * @param {string} renderId - The render job ID
 * @param {number} maxWaitTime - Maximum wait time in ms (default 5 minutes)
 * @returns {Promise<Object>} - Final render result
 */
async function waitForRender(renderId, maxWaitTime = 300000) {
  const startTime = Date.now();
  const pollInterval = 3000; // Check every 3 seconds

  while (Date.now() - startTime < maxWaitTime) {
    const status = await getRenderStatus(renderId);

    if (status.status === 'succeeded') {
      console.log('✅ Creatomate render completed:', status.url);
      return status;
    }

    if (status.status === 'failed') {
      throw new Error(`Render failed: ${status.error}`);
    }

    console.log(`   Render progress: ${status.progress || 0}%`);
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Render timed out');
}

module.exports = {
  isAvailable,
  createRender,
  createMultiClipRender,
  getRenderStatus,
  waitForRender
};
