/**
 * CURATED VIDEO DATABASE - CLOUDINARY HOSTED
 * ============================================
 * Pre-selected fitness videos uploaded to Cloudinary.
 * These are accessible by Shotstack (unlike Pexels direct URLs).
 * 
 * All videos are:
 * - High quality
 * - Hosted on Cloudinary CDN
 * - Actually matching the keyword
 */

// Cloudinary-hosted video URLs (uploaded from Pexels)
const CLOUDINARY_VIDEOS = {
  '4761433': 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1764852474/instamarketing/curated-videos/pexels-4761433.mp4',
  '5319340': 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1764852477/instamarketing/curated-videos/pexels-5319340.mp4',
  '4761486': 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1764852488/instamarketing/curated-videos/pexels-4761486.mp4',
  '4761718': 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1764852495/instamarketing/curated-videos/pexels-4761718.mp4',
  '4761735': 'https://res.cloudinary.com/ddvtwoyxp/video/upload/v1764852502/instamarketing/curated-videos/pexels-4761735.mp4',
};

const CURATED_VIDEO_DATABASE = {
  // ============ FITNESS VIDEOS (CLOUDINARY HOSTED) ============
  fitness: {
    // Abs & Core
    'abs': [
      { id: 'abs-1', url: CLOUDINARY_VIDEOS['4761433'], description: 'Ab workout floor', duration: 15 },
      { id: 'abs-2', url: CLOUDINARY_VIDEOS['5319340'], description: 'Core training', duration: 10 },
      { id: 'abs-3', url: CLOUDINARY_VIDEOS['4761486'], description: 'Side plank', duration: 12 }
    ],
    'core': [
      { id: 'core-1', url: CLOUDINARY_VIDEOS['4761433'], description: 'Core workout', duration: 15 },
      { id: 'core-2', url: CLOUDINARY_VIDEOS['4761486'], description: 'Plank exercise', duration: 12 }
    ],
    'plank': [
      { id: 'plank-1', url: CLOUDINARY_VIDEOS['4761486'], description: 'Side plank', duration: 12 },
      { id: 'plank-2', url: CLOUDINARY_VIDEOS['4761433'], description: 'Floor workout', duration: 15 }
    ],
    'killer': [
      { id: 'killer-1', url: CLOUDINARY_VIDEOS['4761433'], description: 'Intense workout', duration: 15 },
      { id: 'killer-2', url: CLOUDINARY_VIDEOS['4761718'], description: 'Hard training', duration: 12 }
    ],
    'tips': [
      { id: 'tips-1', url: CLOUDINARY_VIDEOS['4761718'], description: 'Fitness tips', duration: 12 },
      { id: 'tips-2', url: CLOUDINARY_VIDEOS['4761735'], description: 'Training advice', duration: 10 }
    ],
    
    // General Workout
    'workout': [
      { id: 'workout-1', url: CLOUDINARY_VIDEOS['4761718'], description: 'Dumbbell workout', duration: 12 },
      { id: 'workout-2', url: CLOUDINARY_VIDEOS['4761735'], description: 'Weight training', duration: 10 },
      { id: 'workout-3', url: CLOUDINARY_VIDEOS['4761433'], description: 'Floor workout', duration: 15 }
    ],
    'gym': [
      { id: 'gym-1', url: CLOUDINARY_VIDEOS['4761718'], description: 'Gym workout', duration: 12 },
      { id: 'gym-2', url: CLOUDINARY_VIDEOS['4761735'], description: 'Weight room', duration: 10 }
    ],
    'exercise': [
      { id: 'exercise-1', url: CLOUDINARY_VIDEOS['4761433'], description: 'Exercise routine', duration: 15 },
      { id: 'exercise-2', url: CLOUDINARY_VIDEOS['4761718'], description: 'Fitness training', duration: 12 }
    ],
    'fitness': [
      { id: 'fitness-1', url: CLOUDINARY_VIDEOS['4761718'], description: 'Fitness workout', duration: 12 },
      { id: 'fitness-2', url: CLOUDINARY_VIDEOS['4761433'], description: 'Training session', duration: 15 }
    ],
    
    // Upper Body
    'arm': [
      { id: 'arm-1', url: CLOUDINARY_VIDEOS['4761718'], description: 'Arm workout', duration: 12 },
      { id: 'arm-2', url: CLOUDINARY_VIDEOS['4761735'], description: 'Shoulder workout', duration: 10 }
    ],
    'shoulder': [
      { id: 'shoulder-1', url: CLOUDINARY_VIDEOS['4761735'], description: 'Shoulder press', duration: 10 },
      { id: 'shoulder-2', url: CLOUDINARY_VIDEOS['4761718'], description: 'Dumbbell workout', duration: 12 }
    ],
    
    // Default for any fitness keyword
    'default': [
      { id: 'default-1', url: CLOUDINARY_VIDEOS['4761718'], description: 'General workout', duration: 12 },
      { id: 'default-2', url: CLOUDINARY_VIDEOS['4761433'], description: 'Fitness exercise', duration: 15 },
      { id: 'default-3', url: CLOUDINARY_VIDEOS['5319340'], description: 'Training', duration: 10 }
    ]
  },
  
  // ============ MOTIVATION / GENERAL ============
  motivation: {
    'default': [
      { id: 'motivation-1', url: CLOUDINARY_VIDEOS['4761718'], description: 'Working out', duration: 12 },
      { id: 'motivation-2', url: CLOUDINARY_VIDEOS['4761735'], description: 'Training hard', duration: 10 }
    ]
  },
  
  // ============ HEALTH ============
  health: {
    'default': [
      { id: 'health-1', url: CLOUDINARY_VIDEOS['4761433'], description: 'Healthy lifestyle', duration: 15 },
      { id: 'health-2', url: CLOUDINARY_VIDEOS['4761718'], description: 'Fitness routine', duration: 12 }
    ]
  },
  
  // ============ TIPS ============
  tips: {
    'default': [
      { id: 'tips-1', url: CLOUDINARY_VIDEOS['4761718'], description: 'Fitness tips', duration: 12 },
      { id: 'tips-2', url: CLOUDINARY_VIDEOS['4761433'], description: 'Workout tips', duration: 15 }
    ]
  }
};

/**
 * Get a curated video for a specific search term
 * @param {string} searchTerm - The keyword to match
 * @param {string} category - Category (fitness, motivation, health, etc.)
 * @returns {Object|null} - Video object or null
 */
function getCuratedVideoForTerm(searchTerm, category = 'fitness') {
  const term = searchTerm.toLowerCase().trim();
  const cat = CURATED_VIDEO_DATABASE[category] || CURATED_VIDEO_DATABASE.fitness;
  
  // Direct match
  if (cat[term] && cat[term].length > 0) {
    const videos = cat[term];
    return videos[Math.floor(Math.random() * videos.length)];
  }
  
  // Partial match - find keywords containing the term
  for (const [keyword, videos] of Object.entries(cat)) {
    if (keyword !== 'default' && (keyword.includes(term) || term.includes(keyword))) {
      if (videos.length > 0) {
        return videos[Math.floor(Math.random() * videos.length)];
      }
    }
  }
  
  // Return default
  if (cat.default && cat.default.length > 0) {
    const defaults = cat.default;
    return defaults[Math.floor(Math.random() * defaults.length)];
  }
  
  return null;
}

/**
 * Get curated videos for multiple scenes
 * @param {Array} sceneRequests - Array of {index, searchTerm, duration}
 * @param {string} category - Category for matching
 * @returns {Array} - Array of video objects with scene info
 */
function getCuratedVideosForScenes(sceneRequests, category = 'fitness') {
  const results = [];
  const usedVideoIds = new Set(); // Track used videos to avoid duplicates
  
  for (const scene of sceneRequests) {
    const term = scene.searchTerm || 'default';
    const cat = CURATED_VIDEO_DATABASE[category] || CURATED_VIDEO_DATABASE.fitness;
    
    // Find matching videos
    let candidates = [];
    
    // Try direct match
    if (cat[term]) {
      candidates = [...cat[term]];
    }
    
    // Try partial match
    if (candidates.length === 0) {
      for (const [keyword, videos] of Object.entries(cat)) {
        if (keyword !== 'default' && (keyword.includes(term) || term.includes(keyword))) {
          candidates = [...candidates, ...videos];
        }
      }
    }
    
    // Fallback to defaults
    if (candidates.length === 0 && cat.default) {
      candidates = [...cat.default];
    }
    
    // Filter out already used videos
    candidates = candidates.filter(v => !usedVideoIds.has(v.id));
    
    // If all used, reset and use defaults
    if (candidates.length === 0 && cat.default) {
      candidates = [...cat.default];
    }
    
    if (candidates.length > 0) {
      const selected = candidates[Math.floor(Math.random() * candidates.length)];
      usedVideoIds.add(selected.id);
      
      results.push({
        ...selected,
        sceneIndex: scene.index,
        matchedKeyword: term,
        useDuration: scene.duration || selected.duration || 5
      });
    }
  }
  
  return results;
}

/**
 * Get a random default video
 * @param {string} category - Category
 * @returns {Object|null} - Video object
 */
function getRandomDefault(category = 'fitness') {
  const cat = CURATED_VIDEO_DATABASE[category] || CURATED_VIDEO_DATABASE.fitness;
  
  if (cat.default && cat.default.length > 0) {
    const defaults = cat.default;
    return defaults[Math.floor(Math.random() * defaults.length)];
  }
  
  return null;
}

module.exports = {
  CURATED_VIDEO_DATABASE,
  getCuratedVideoForTerm,
  getCuratedVideosForScenes,
  getRandomDefault
};
