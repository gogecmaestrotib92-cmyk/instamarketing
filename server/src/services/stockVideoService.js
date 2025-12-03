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

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

// Popular categories for vertical videos
const VIDEO_CATEGORIES = {
  'tips': ['lifestyle', 'technology', 'office', 'work'],
  'motivation': ['nature', 'sunrise', 'ocean', 'mountains', 'city'],
  'education': ['books', 'study', 'technology', 'abstract'],
  'lifestyle': ['urban', 'nature', 'travel', 'city life'],
  'business': ['office', 'meeting', 'technology', 'work'],
  'fitness': ['gym', 'running', 'yoga', 'sports'],
  'food': ['cooking', 'kitchen', 'food', 'restaurant'],
  'travel': ['travel', 'airplane', 'beach', 'city'],
  'fashion': ['fashion', 'style', 'shopping', 'urban'],
  'tech': ['technology', 'computer', 'coding', 'abstract'],
  'default': ['abstract', 'light', 'particles', 'gradient']
};

/**
 * Search videos from Pexels API
 * 
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of video objects
 */
async function searchPexelsVideos(query, options = {}) {
  if (!PEXELS_API_KEY) {
    console.log('⚠️ Pexels API key not configured');
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

    console.log(`🎬 Searching Pexels for: "${query}"`);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();

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
 * These are popular, royalty-free videos that work for most content
 */
const CURATED_BACKGROUNDS = {
  abstract: [
    { name: 'Particles', url: 'https://cdn.pixabay.com/vimeo/328940142/particles-22839.mp4' },
    { name: 'Gradient', url: 'https://cdn.pixabay.com/vimeo/414608626/abstract-38891.mp4' },
    { name: 'Light Rays', url: 'https://cdn.pixabay.com/vimeo/414608670/abstract-38892.mp4' }
  ],
  nature: [
    { name: 'Clouds', url: 'https://cdn.pixabay.com/vimeo/153666206/sky-4251.mp4' },
    { name: 'Ocean', url: 'https://cdn.pixabay.com/vimeo/175346741/sea-7509.mp4' },
    { name: 'Forest', url: 'https://cdn.pixabay.com/vimeo/253497792/forest-13410.mp4' }
  ],
  urban: [
    { name: 'City Lights', url: 'https://cdn.pixabay.com/vimeo/210982254/city-10286.mp4' },
    { name: 'Street', url: 'https://cdn.pixabay.com/vimeo/182558174/street-8367.mp4' }
  ],
  tech: [
    { name: 'Code', url: 'https://cdn.pixabay.com/vimeo/302242858/computer-19729.mp4' },
    { name: 'Digital', url: 'https://cdn.pixabay.com/vimeo/295316419/technology-18447.mp4' }
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

module.exports = {
  searchPexelsVideos,
  searchPixabayVideos,
  searchStockVideos,
  getRandomStockVideo,
  getVideoClipsForDuration,
  getOptimizedQuery,
  getCuratedBackground,
  VIDEO_CATEGORIES,
  CURATED_BACKGROUNDS
};
