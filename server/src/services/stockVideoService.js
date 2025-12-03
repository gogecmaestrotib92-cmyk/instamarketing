/**
 * Stock Video Service
 * 
 * Integrates with Pexels and Pixabay APIs to fetch stock video loops
 * for background videos that match voiceover duration.
 * 
 * APIs:
 * - Pexels: https://www.pexels.com/api/documentation/#videos
 * - Pixabay: https://pixabay.com/api/docs/#api_search_videos
 */

// Read API keys at runtime (not module load time) for Vercel compatibility
// Fallback to hardcoded key if env variable not set
const PEXELS_HARDCODED_KEY = '9kV0qJ9k1b1Ou9BTGXFDPyFrqjU4oqGsuJ0tbzor5r2O942zz6WMyIyl';
const getPexelsKey = () => process.env.PEXELS_API_KEY || PEXELS_HARDCODED_KEY;
const getPixabayKey = () => process.env.PIXABAY_API_KEY;

// Popular categories for vertical videos
const VIDEO_CATEGORIES = {
  'tips': ['lifestyle', 'technology', 'office', 'work', 'professional'],
  'facts': ['technology', 'science', 'data', 'abstract', 'documentary'],
  'quotes': ['nature', 'sunset', 'ocean', 'mountains', 'peaceful', 'inspirational'],
  'story': ['people', 'urban', 'lifestyle', 'journey', 'cinematic', 'storytelling'],
  'tutorial': ['hands', 'workspace', 'technology', 'demonstration', 'step by step'],
  'motivation': ['nature', 'sunrise', 'ocean', 'mountains', 'city', 'success', 'achievement'],
  'education': ['books', 'study', 'technology', 'abstract', 'learning'],
  'lifestyle': ['urban', 'nature', 'travel', 'city life'],
  'business': ['office', 'meeting', 'technology', 'work', 'professional'],
  'fitness': ['gym', 'running', 'yoga', 'sports'],
  'food': ['cooking', 'kitchen', 'food', 'restaurant'],
  'travel': ['travel', 'airplane', 'beach', 'city'],
  'fashion': ['fashion', 'style', 'shopping', 'urban'],
  'tech': ['technology', 'computer', 'coding', 'abstract'],
  'default': ['abstract', 'light', 'particles', 'gradient', 'motion']
};

// Map concepts to cinematic stock video search terms
const CONCEPT_TO_VIDEO_MAP = {
  // Emotions/States
  'success': 'celebration victory',
  'happy': 'happy people smiling',
  'sad': 'rain melancholy',
  'excited': 'celebration party',
  'calm': 'peaceful nature water',
  'stressed': 'busy city chaos',
  'confident': 'confident person walking',
  
  // Topics
  'money': 'money finance wealth',
  'business': 'business office corporate',
  'health': 'healthy lifestyle fitness',
  'fitness': 'workout gym exercise',
  'food': 'cooking food kitchen',
  'travel': 'travel adventure destination',
  'technology': 'technology digital modern',
  'nature': 'nature landscape scenic',
  'love': 'couple romance love',
  'family': 'family together home',
  
  // Actions
  'growth': 'growth progress success',
  'change': 'transformation change',
  'think': 'thinking contemplating',
  'learn': 'learning education study',
  'work': 'working professional office',
  'create': 'creative art design',
  'build': 'construction building',
  
  // Time
  'morning': 'sunrise morning',
  'night': 'night city lights',
  'future': 'futuristic technology',
  'past': 'vintage nostalgic',
  
  // Abstract
  'idea': 'lightbulb inspiration idea',
  'dream': 'dreamy clouds fantasy',
  'power': 'power energy strong',
  'freedom': 'freedom flying birds'
};

/**
 * Search videos from Pexels API
 * 
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of video objects
 */
async function searchPexelsVideos(query, options = {}) {
  const PEXELS_API_KEY = getPexelsKey();
  
  console.log(`🔍 PEXELS DEBUG: Checking API key...`);
  console.log(`   Key exists: ${!!PEXELS_API_KEY}`);
  console.log(`   Key length: ${PEXELS_API_KEY ? PEXELS_API_KEY.length : 0}`);
  console.log(`   Query: "${query}"`);
  
  if (!PEXELS_API_KEY) {
    console.log('⚠️ Pexels API key not configured (env: PEXELS_API_KEY)');
    return [];
  }

  const {
    orientation = 'portrait', // portrait for 9:16
    perPage = 10,
    minDuration = 5,
    maxDuration = 60
  } = options;

  try {
    const url = new URL('https://api.pexels.com/videos/search');
    url.searchParams.append('query', query);
    url.searchParams.append('orientation', orientation);
    url.searchParams.append('per_page', perPage);
    url.searchParams.append('size', 'medium'); // medium quality for faster loading

    console.log(`🎬 Searching Pexels for: "${query}" (key: ${PEXELS_API_KEY ? 'present' : 'missing'})`);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    });

    console.log(`   Pexels response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   Pexels error response: ${errorText}`);
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`   Pexels returned ${data.videos?.length || 0} videos total`);

    // Filter and transform videos
    const videos = (data.videos || [])
      .filter(video => video.duration >= minDuration && video.duration <= maxDuration)
      .map(video => {
        // Get the best quality file for mobile (720p or 1080p)
        const videoFile = video.video_files.find(f => 
          f.quality === 'hd' && f.width <= 1920
        ) || video.video_files.find(f => 
          f.quality === 'sd'
        ) || video.video_files[0];

        return {
          id: video.id,
          source: 'pexels',
          url: videoFile?.link,
          thumbnail: video.image,
          duration: video.duration,
          width: videoFile?.width || video.width,
          height: videoFile?.height || video.height,
          user: video.user?.name,
          userUrl: video.user?.url
        };
      })
      .filter(v => v.url); // Only include videos with valid URLs

    console.log(`   Found ${videos.length} videos from Pexels`);
    return videos;

  } catch (error) {
    console.error('Pexels search error:', error.message);
    return [];
  }
}

/**
 * Search videos from Pixabay API
 * 
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of video objects
 */
async function searchPixabayVideos(query, options = {}) {
  const PIXABAY_API_KEY = getPixabayKey();
  
  if (!PIXABAY_API_KEY) {
    console.log('⚠️ Pixabay API key not configured');
    return [];
  }

  const {
    perPage = 10,
    minDuration = 5,
    maxDuration = 60,
    videoType = 'all' // film, animation, all
  } = options;

  try {
    const url = new URL('https://pixabay.com/api/videos/');
    url.searchParams.append('key', PIXABAY_API_KEY);
    url.searchParams.append('q', query);
    url.searchParams.append('per_page', perPage);
    url.searchParams.append('video_type', videoType);
    url.searchParams.append('safesearch', 'true');

    console.log(`🎬 Searching Pixabay for: "${query}"`);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status}`);
    }

    const data = await response.json();

    // Filter and transform videos
    const videos = (data.hits || [])
      .filter(video => video.duration >= minDuration && video.duration <= maxDuration)
      .map(video => {
        // Get medium quality for balance of quality and speed
        const videoFile = video.videos?.medium || video.videos?.small || video.videos?.large;

        return {
          id: video.id,
          source: 'pixabay',
          url: videoFile?.url,
          thumbnail: `https://i.vimeocdn.com/video/${video.picture_id}_640x360.jpg`,
          duration: video.duration,
          width: videoFile?.width || 1920,
          height: videoFile?.height || 1080,
          user: video.user,
          userUrl: `https://pixabay.com/users/${video.user}-${video.user_id}/`
        };
      })
      .filter(v => v.url);

    console.log(`   Found ${videos.length} videos from Pixabay`);
    return videos;

  } catch (error) {
    console.error('Pixabay search error:', error.message);
    return [];
  }
}

/**
 * Search all stock video sources
 * 
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Combined array of videos from all sources
 */
async function searchStockVideos(query, options = {}) {
  console.log(`🎬 Searching stock videos for: "${query}"`);
  
  // Search both APIs in parallel
  const [pexelsVideos, pixabayVideos] = await Promise.all([
    searchPexelsVideos(query, options),
    searchPixabayVideos(query, options)
  ]);

  // Combine and shuffle results for variety
  const combined = [...pexelsVideos, ...pixabayVideos];
  
  // Shuffle array
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  console.log(`   Total: ${combined.length} videos found`);
  return combined;
}

/**
 * Get the best keyword for video search based on content type
 * 
 * @param {string} topic - User's topic
 * @param {string} contentType - Type of content (tips, motivation, etc.)
 * @returns {string} - Optimized search query
 */
function getOptimizedQuery(topic, contentType = 'default') {
  const categories = VIDEO_CATEGORIES[contentType.toLowerCase()] || VIDEO_CATEGORIES.default;
  
  // Extract key words from topic
  const topicWords = topic.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => word.length > 3)
    .slice(0, 2);

  // If we have topic words, use them with a category keyword
  if (topicWords.length > 0) {
    return `${topicWords.join(' ')} ${categories[0]}`;
  }

  // Otherwise use category keywords
  return categories.join(' ');
}

/**
 * Get a random stock video based on topic and content type
 * Useful for background videos that match voiceover content
 * 
 * @param {string} topic - User's topic/prompt
 * @param {string} contentType - Type of content
 * @param {Object} options - Search options
 * @returns {Promise<Object|null>} - Video object or null
 */
async function getRandomStockVideo(topic, contentType = 'default', options = {}) {
  const query = getOptimizedQuery(topic, contentType);
  const videos = await searchStockVideos(query, { 
    ...options,
    perPage: 15 // Get more options
  });

  if (videos.length === 0) {
    // Fallback to abstract/generic backgrounds
    console.log('⚠️ No videos found, trying fallback search...');
    const fallbackVideos = await searchStockVideos('abstract light particles background', {
      ...options,
      perPage: 10
    });
    
    if (fallbackVideos.length > 0) {
      return fallbackVideos[Math.floor(Math.random() * fallbackVideos.length)];
    }
    
    return null;
  }

  // Return a random video from results
  return videos[Math.floor(Math.random() * videos.length)];
}

/**
 * Get multiple stock video clips for stitching
 * Useful for creating longer videos from multiple short clips
 * 
 * @param {string} topic - Search topic
 * @param {number} targetDuration - Desired total duration in seconds
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of video clips that sum to target duration
 */
async function getVideoClipsForDuration(topic, targetDuration = 30, options = {}) {
  const query = getOptimizedQuery(topic, options.contentType);
  const videos = await searchStockVideos(query, {
    ...options,
    perPage: 20,
    minDuration: 3,
    maxDuration: 30
  });

  if (videos.length === 0) {
    return [];
  }

  // Select videos to fill the target duration
  const selectedClips = [];
  let totalDuration = 0;

  // Shuffle videos for variety
  const shuffled = [...videos].sort(() => Math.random() - 0.5);

  for (const video of shuffled) {
    if (totalDuration >= targetDuration) break;

    const remainingDuration = targetDuration - totalDuration;
    
    // Calculate how much of this clip to use
    const clipDuration = Math.min(video.duration, remainingDuration);
    
    selectedClips.push({
      ...video,
      useDuration: clipDuration,
      startAt: 0 // Start from beginning
    });
    
    totalDuration += clipDuration;
  }

  console.log(`📹 Selected ${selectedClips.length} clips for ${totalDuration}s (target: ${targetDuration}s)`);
  return selectedClips;
}

/**
 * Curated list of generic looping background videos
 * Using direct Pexels video URLs that are known to work
 * These serve as fallback when Pexels API search returns empty
 */
const CURATED_BACKGROUNDS = {
  abstract: [
    { name: 'Abstract Particles', url: 'https://videos.pexels.com/video-files/3129671/3129671-sd_640_360_30fps.mp4', duration: 10 },
    { name: 'Blue Motion', url: 'https://videos.pexels.com/video-files/852400/852400-sd_640_360_30fps.mp4', duration: 12 }
  ],
  nature: [
    { name: 'Ocean Waves', url: 'https://videos.pexels.com/video-files/1093662/1093662-sd_640_360_30fps.mp4', duration: 15 },
    { name: 'Forest', url: 'https://videos.pexels.com/video-files/857251/857251-sd_640_360_30fps.mp4', duration: 10 }
  ],
  urban: [
    { name: 'City Lights', url: 'https://videos.pexels.com/video-files/1826896/1826896-sd_640_360_25fps.mp4', duration: 12 }
  ],
  tech: [
    { name: 'Tech Abstract', url: 'https://videos.pexels.com/video-files/3129671/3129671-sd_640_360_30fps.mp4', duration: 10 }
  ],
  fitness: [
    { name: 'Gym Workout', url: 'https://videos.pexels.com/video-files/4761440/4761440-sd_640_360_25fps.mp4', duration: 15 }
  ]
};

/**
 * Get a curated background video by category
 * 
 * @param {string} category - abstract, nature, urban, tech
 * @returns {Object|null} - Video object
 */
function getCuratedBackground(category = 'abstract') {
  const backgrounds = CURATED_BACKGROUNDS[category] || CURATED_BACKGROUNDS.abstract;
  return backgrounds[Math.floor(Math.random() * backgrounds.length)];
}

/**
 * Improve search term using concept mapping for better stock video results
 * Maps abstract concepts to more visual, searchable terms
 */
function improveSearchTerm(term) {
  if (!term || term.length < 3) return 'abstract background';
  
  const words = term.toLowerCase().split(/\s+/);
  const improvedWords = [];
  
  // Check each word against concept map
  for (const word of words) {
    if (CONCEPT_TO_VIDEO_MAP[word]) {
      // Found a mapping - use the video-friendly term
      return CONCEPT_TO_VIDEO_MAP[word];
    }
    improvedWords.push(word);
  }
  
  // Check for partial matches in the full term
  for (const [concept, videoTerm] of Object.entries(CONCEPT_TO_VIDEO_MAP)) {
    if (term.toLowerCase().includes(concept)) {
      return videoTerm;
    }
  }
  
  // Add "cinematic" to make results more video-appropriate
  const improvedTerm = improvedWords.slice(0, 2).join(' ');
  if (improvedTerm.length > 3) {
    return improvedTerm + ' cinematic';
  }
  
  return 'abstract motion background';
}

module.exports = {
  searchPexelsVideos,
  searchPixabayVideos,
  searchStockVideos,
  getRandomStockVideo,
  getVideoClipsForDuration,
  getVideosForScenes,
  getOptimizedQuery,
  getCuratedBackground,
  improveSearchTerm,
  VIDEO_CATEGORIES,
  CURATED_BACKGROUNDS
};

/**
 * Get different stock videos for each scene/segment
 * Perfect for voiceover videos where visuals change with the story
 * 
 * @param {Array} scenes - Array of { searchTerm, duration, startTime, endTime }
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of video clips matched to scenes
 */
async function getVideosForScenes(scenes, options = {}) {
  if (!scenes || scenes.length === 0) {
    return [];
  }

  console.log(`🎬 Finding videos for ${scenes.length} scenes...`);
  
  const sceneClips = [];
  const usedVideoIds = new Set(); // Track used videos to avoid duplicates
  
  for (const scene of scenes) {
    // Use the search term directly - it's already been AI-generated or properly formatted
    let searchTerm = scene.searchTerm || scene.keywords || 'fitness workout';
    const sceneDuration = scene.duration || (scene.endTime - scene.startTime) || 10;
    
    console.log(`   Scene ${scene.index + 1}: Searching "${searchTerm}" (${sceneDuration.toFixed(1)}s)`);
    
    // Search for videos matching this scene - use the term DIRECTLY
    let videos = await searchStockVideos(searchTerm, {
      ...options,
      perPage: 15,
      minDuration: Math.max(3, sceneDuration * 0.5),
      maxDuration: 60
    });
    
    console.log(`      Found ${videos.length} videos for "${searchTerm}"`);
    
    // If no results, try simpler search with first 2 words
    if (videos.length === 0) {
      const simpleTerms = searchTerm.split(' ').slice(0, 2).join(' ');
      console.log(`      No results, trying simpler: "${simpleTerms}"`);
      videos = await searchStockVideos(simpleTerms, {
        ...options,
        perPage: 15,
        minDuration: 3,
        maxDuration: 60
      });
    }
    
    // Filter out already used videos
    const availableVideos = videos.filter(v => !usedVideoIds.has(`${v.source}-${v.id}`));
    
    if (availableVideos.length > 0) {
      // Pick a random video from results
      const video = availableVideos[Math.floor(Math.random() * Math.min(5, availableVideos.length))];
      usedVideoIds.add(`${video.source}-${video.id}`);
      
      sceneClips.push({
        ...video,
        sceneIndex: scene.index,
        sceneSearchTerm: searchTerm,
        useDuration: sceneDuration,
        startAt: scene.startTime || 0,
        endAt: scene.endTime || (scene.startTime + sceneDuration),
        // For Shotstack multi-clip
        playbackStart: scene.startTime || 0,
        playbackDuration: sceneDuration
      });
      
      console.log(`      ✅ Found: ${video.source} #${video.id} (${video.duration}s)`);
    } else {
      // Fallback: try generic search
      console.log(`      ⚠️ No results, trying fallback...`);
      const fallbackVideos = await searchStockVideos('abstract motion background', { perPage: 5 });
      const fallback = fallbackVideos.find(v => !usedVideoIds.has(`${v.source}-${v.id}`)) || fallbackVideos[0];
      
      if (fallback) {
        usedVideoIds.add(`${fallback.source}-${fallback.id}`);
        sceneClips.push({
          ...fallback,
          sceneIndex: scene.index,
          sceneSearchTerm: 'fallback',
          useDuration: sceneDuration,
          startAt: scene.startTime || 0,
          endAt: scene.endTime || (scene.startTime + sceneDuration),
          playbackStart: scene.startTime || 0,
          playbackDuration: sceneDuration
        });
        console.log(`      ✅ Fallback: ${fallback.source} #${fallback.id}`);
      }
    }
  }
  
  console.log(`   📹 Total: ${sceneClips.length} scene clips ready`);
  return sceneClips;
}
