/**
 * JSON2Video - Video Composition Service
 * 
 * Simple JSON-based video generation API
 * Free tier: 10 videos/month, no watermarks
 * 
 * API Docs: https://json2video.com/docs/api/
 */

// Read API key at runtime for Vercel compatibility
const getApiKey = () => process.env.JSON2VIDEO_API_KEY;
const JSON2VIDEO_API_URL = 'https://api.json2video.com/v2';

/**
 * Check if JSON2Video is configured
 */
function isAvailable() {
  const key = getApiKey();
  console.log(`🔍 JSON2Video: Checking API key... exists: ${!!key}, length: ${key ? key.length : 0}`);
  return !!key;
}

/**
 * Create a video render with multiple clips, audio, and subtitles
 * 
 * @param {Object} options - Render options
 * @param {Array} options.clips - Array of video clip objects with url, duration
 * @param {string} options.audioUrl - URL of the audio track (voiceover)
 * @param {Array} options.subtitles - Array of subtitle objects with text, start, end
 * @param {number} options.totalDuration - Total video duration in seconds
 * @returns {Promise<Object>} - Render job response
 */
async function createMultiClipRender(options) {
  const {
    clips = [],
    audioUrl,
    subtitles = [],
    totalDuration = 15
  } = options;

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('JSON2Video API key not configured');
  }

  console.log('🎬 Creating JSON2Video render...');
  console.log(`   Clips: ${clips.length}`);
  console.log(`   Audio: ${audioUrl ? 'yes' : 'no'}`);
  console.log(`   Subtitles: ${subtitles.length}`);
  console.log(`   Duration: ${totalDuration}s`);

  // Build the movie JSON structure
  const scenes = [];
  
  // Create scenes from clips
  if (clips.length > 0) {
    clips.forEach((clip, index) => {
      const clipDuration = clip.useDuration || clip.duration || (totalDuration / clips.length);
      
      // Get subtitles for this time range
      const clipStart = clip.startTime || (index * clipDuration);
      const clipEnd = clipStart + clipDuration;
      const clipSubtitles = subtitles.filter(s => 
        s.start >= clipStart && s.start < clipEnd
      );

      const sceneElements = [
        {
          type: 'video',
          src: clip.url,
          duration: clipDuration,
          fit: 'cover'
        }
      ];

      // Add subtitles as text elements for this scene
      clipSubtitles.forEach(sub => {
        const relativeStart = sub.start - clipStart;
        const relativeDuration = (sub.end || (sub.start + sub.duration)) - sub.start;
        
        sceneElements.push({
          type: 'text',
          text: sub.text,
          start: relativeStart,
          duration: Math.min(relativeDuration, clipDuration - relativeStart),
          settings: {
            'font-family': 'Montserrat',
            'font-weight': '700',
            'font-size': '42px',
            'color': '#ffffff',
            'text-shadow': '2px 2px 4px rgba(0,0,0,0.8)',
            'background-color': 'rgba(0,0,0,0.6)',
            'padding': '10px 20px',
            'border-radius': '8px',
            'position': 'bottom',
            'margin-bottom': '100px'
          }
        });
      });

      scenes.push({
        duration: clipDuration,
        elements: sceneElements
      });
    });
  }

  // Build the movie object
  const movieData = {
    resolution: 'custom',
    width: 1080,
    height: 1920,
    quality: 'high',
    scenes: scenes
  };

  // Add audio track if provided
  if (audioUrl) {
    movieData.soundtrack = {
      src: audioUrl,
      volume: 1
    };
  }

  try {
    const response = await fetch(`${JSON2VIDEO_API_URL}/movies`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ movie: movieData })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('JSON2Video API error:', response.status, errorText);
      throw new Error(`JSON2Video API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ JSON2Video render created:', result.project);

    return {
      success: true,
      renderId: result.project,
      status: result.status || 'processing',
      message: result.message
    };
  } catch (error) {
    console.error('JSON2Video render error:', error);
    throw error;
  }
}

/**
 * Create a simple video with single background, audio, and subtitles
 */
async function createSimpleRender(options) {
  const {
    videoUrl,
    audioUrl,
    subtitles = [],
    duration = 15,
    loopVideo = true
  } = options;

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('JSON2Video API key not configured');
  }

  console.log('🎬 Creating simple JSON2Video render...');
  console.log(`   Video: ${videoUrl}`);
  console.log(`   Audio: ${audioUrl ? 'yes' : 'no'}`);
  console.log(`   Subtitles: ${subtitles.length}`);

  // Build elements array
  const elements = [
    {
      type: 'video',
      src: videoUrl,
      duration: duration,
      fit: 'cover',
      loop: loopVideo
    }
  ];

  // Add subtitles
  subtitles.forEach(sub => {
    elements.push({
      type: 'text',
      text: sub.text,
      start: sub.start,
      duration: sub.duration || (sub.end - sub.start),
      settings: {
        'font-family': 'Montserrat',
        'font-weight': '800',
        'font-size': '44px',
        'color': '#ffffff',
        'text-shadow': '2px 2px 6px rgba(0,0,0,0.9)',
        'background-color': 'rgba(0,0,0,0.65)',
        'padding': '12px 24px',
        'border-radius': '10px',
        'position': 'bottom',
        'margin-bottom': '120px',
        'text-align': 'center'
      }
    });
  });

  const movieData = {
    resolution: 'custom',
    width: 1080,
    height: 1920,
    quality: 'high',
    scenes: [{
      duration: duration,
      elements: elements
    }]
  };

  if (audioUrl) {
    movieData.soundtrack = {
      src: audioUrl,
      volume: 1
    };
  }

  try {
    const response = await fetch(`${JSON2VIDEO_API_URL}/movies`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ movie: movieData })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`JSON2Video API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ JSON2Video simple render created:', result.project);

    return {
      success: true,
      renderId: result.project,
      status: result.status || 'processing'
    };
  } catch (error) {
    console.error('JSON2Video simple render error:', error);
    throw error;
  }
}

/**
 * Check render status
 * 
 * @param {string} projectId - The project/render ID
 * @returns {Promise<Object>} - Render status
 */
async function getRenderStatus(projectId) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('JSON2Video API key not configured');
  }

  try {
    const response = await fetch(`${JSON2VIDEO_API_URL}/movies?project=${projectId}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get render status: ${response.status}`);
    }

    const result = await response.json();

    // JSON2Video status: "waiting", "rendering", "done", "error"
    const statusMap = {
      'waiting': 'queued',
      'rendering': 'rendering',
      'done': 'succeeded',
      'error': 'failed'
    };

    return {
      success: true,
      renderId: projectId,
      status: statusMap[result.status] || result.status,
      progress: result.progress || 0,
      url: result.url, // Available when status is 'done'
      error: result.error
    };
  } catch (error) {
    console.error('JSON2Video status check error:', error);
    throw error;
  }
}

/**
 * Wait for render to complete (with polling)
 * 
 * @param {string} projectId - The project/render ID
 * @param {number} maxWaitTime - Maximum wait time in ms (default 5 minutes)
 * @returns {Promise<Object>} - Final render result
 */
async function waitForRender(projectId, maxWaitTime = 300000) {
  const startTime = Date.now();
  const pollInterval = 5000; // Check every 5 seconds

  while (Date.now() - startTime < maxWaitTime) {
    const status = await getRenderStatus(projectId);

    if (status.status === 'succeeded' || status.status === 'done') {
      console.log('✅ JSON2Video render completed:', status.url);
      return status;
    }

    if (status.status === 'failed' || status.status === 'error') {
      throw new Error(`Render failed: ${status.error}`);
    }

    console.log(`   Render status: ${status.status} (${status.progress || 0}%)`);
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Render timed out');
}

module.exports = {
  isAvailable,
  createMultiClipRender,
  createSimpleRender,
  getRenderStatus,
  waitForRender
};
