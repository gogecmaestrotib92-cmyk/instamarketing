/**
 * Shotstack Timeline Templates
 * 
 * Pre-built templates for common video formats.
 * These can be used as starting points for custom renders.
 */

/**
 * 9:16 Vertical Reel Template (TikTok, Instagram Reels, YouTube Shorts)
 * 
 * Resolution: 1080x1920 (Full HD Portrait)
 * Aspect Ratio: 9:16
 * FPS: 25
 */
const VERTICAL_REEL_TEMPLATE = {
  timeline: {
    background: '#000000',
    fonts: [
      {
        src: 'https://shotstack-assets.s3.amazonaws.com/fonts/Montserrat-ExtraBold.ttf'
      }
    ],
    tracks: [
      // Track 0: Main Video Layer (Bottom)
      {
        clips: [
          {
            asset: {
              type: 'video',
              src: '{{VIDEO_URL}}',
              volume: 0 // Mute original audio
            },
            start: 0,
            length: '{{DURATION}}',
            fit: 'cover',      // Cover entire frame, crop if needed
            scale: 1,
            position: 'center',
            transition: {
              in: 'fade',      // Fade in at start
              out: 'fade'      // Fade out at end
            }
          }
        ]
      },
      // Track 1: Subtitle Text Layer (Top)
      {
        clips: [
          // Example subtitle - replace with actual subtitles
          {
            asset: {
              type: 'title',
              text: '{{SUBTITLE_TEXT}}',
              style: 'Montserrat ExtraBold',
              size: '44px',
              color: '#ffffff',
              background: 'rgba(0, 0, 0, 0.6)', // Semi-transparent background
              position: 'bottom',
              offset: {
                x: 0,
                y: -0.12  // 12% from bottom
              }
            },
            start: '{{START}}',
            length: '{{LENGTH}}',
            transition: {
              in: 'fade',
              out: 'fade'
            },
            effect: 'zoomIn'  // Subtle zoom effect
          }
        ]
      }
    ],
    soundtrack: [
      {
        src: '{{AUDIO_URL}}',
        effect: 'fadeInFadeOut', // Smooth fade in and out
        volume: 0.8
      }
    ]
  },
  output: {
    format: 'mp4',
    resolution: 'hd',        // 1080p
    aspectRatio: '9:16',
    fps: 25,
    scaleTo: 'preview',      // Use 'preview' for faster renders, 'hd' for production
    quality: 'high',
    size: {
      width: 1080,
      height: 1920
    }
  }
};

/**
 * Subtitle Style Presets
 */
const SUBTITLE_STYLES = {
  // TikTok-style: Bold white with shadow
  tiktok: {
    font: 'Montserrat ExtraBold',
    fontSize: 44,
    color: '#ffffff',
    background: 'transparent',
    position: 'bottom',
    offset: { x: 0, y: -0.15 },
    shadow: true,
    outline: '#000000'
  },
  
  // Netflix-style: Yellow with black background
  netflix: {
    font: 'Arial',
    fontSize: 36,
    color: '#f1c40f',
    background: 'rgba(0, 0, 0, 0.8)',
    position: 'bottom',
    offset: { x: 0, y: -0.08 },
    shadow: false
  },
  
  // Minimal: Clean white
  minimal: {
    font: 'Inter',
    fontSize: 32,
    color: '#ffffff',
    background: 'transparent',
    position: 'bottom',
    offset: { x: 0, y: -0.12 },
    shadow: true
  },
  
  // Bold: Large impact text
  bold: {
    font: 'Bebas Neue',
    fontSize: 56,
    color: '#ffffff',
    background: 'transparent',
    position: 'center',
    offset: { x: 0, y: 0 },
    shadow: true,
    outline: '#000000'
  },
  
  // Neon: Glowing effect
  neon: {
    font: 'Montserrat ExtraBold',
    fontSize: 40,
    color: '#00ffff',
    background: 'transparent',
    position: 'bottom',
    offset: { x: 0, y: -0.15 },
    shadow: true,
    glow: '#00ffff'
  }
};

/**
 * Available Shotstack Fonts
 * These fonts are available by default on Shotstack
 */
const AVAILABLE_FONTS = [
  'Arial',
  'Arial Black',
  'Comic Sans MS',
  'Courier New',
  'Georgia',
  'Impact',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
  // Google Fonts (need to be loaded)
  'Montserrat',
  'Montserrat ExtraBold',
  'Open Sans',
  'Roboto',
  'Roboto Bold',
  'Lato',
  'Oswald',
  'Raleway',
  'Poppins',
  'Playfair Display',
  'Bebas Neue',
  'Inter'
];

/**
 * Build a subtitle clip for Shotstack timeline
 * 
 * @param {Object} subtitle - { text, start, end }
 * @param {Object} style - Subtitle style preset or custom style
 * @param {boolean} isFirst - Is this the first subtitle?
 * @param {boolean} isLast - Is this the last subtitle?
 * @returns {Object} Shotstack clip object
 */
function buildSubtitleClip(subtitle, style = SUBTITLE_STYLES.tiktok, isFirst = false, isLast = false) {
  const duration = subtitle.end - subtitle.start;
  
  const clip = {
    asset: {
      type: 'title',
      text: subtitle.text,
      style: style.font || 'Montserrat ExtraBold',
      size: `${style.fontSize || 44}px`,
      color: style.color || '#ffffff',
      background: style.background || 'transparent',
      position: style.position || 'bottom',
      offset: style.offset || { x: 0, y: -0.15 }
    },
    start: subtitle.start,
    length: duration
  };

  // Add transitions
  const transition = {};
  if (isFirst) transition.in = 'fade';
  if (isLast) transition.out = 'fade';
  if (Object.keys(transition).length > 0) {
    clip.transition = transition;
  }

  return clip;
}

/**
 * Build complete subtitle track from array of subtitles
 * 
 * @param {Array} subtitles - Array of { text, start, end }
 * @param {Object|string} style - Style preset name or custom style object
 * @returns {Object} Shotstack track object
 */
function buildSubtitleTrack(subtitles, style = 'tiktok') {
  // Get style preset if string provided
  const styleObj = typeof style === 'string' 
    ? SUBTITLE_STYLES[style] || SUBTITLE_STYLES.tiktok 
    : style;

  const clips = subtitles.map((sub, index) => 
    buildSubtitleClip(
      sub, 
      styleObj, 
      index === 0, 
      index === subtitles.length - 1
    )
  );

  return { clips };
}

/**
 * Build complete Shotstack edit payload
 * 
 * @param {Object} params - Build parameters
 * @param {string} params.videoUrl - Source video URL
 * @param {string} params.audioUrl - Background music URL
 * @param {Array} params.subtitles - Array of { text, start, end }
 * @param {number} params.duration - Video duration in seconds
 * @param {string} params.subtitleStyle - Subtitle style preset name
 * @returns {Object} Complete Shotstack edit payload
 */
function buildShotstackPayload(params) {
  const { 
    videoUrl, 
    audioUrl, 
    subtitles = [], 
    duration = 6,
    subtitleStyle = 'tiktok'
  } = params;

  const tracks = [
    // Video track
    {
      clips: [
        {
          asset: {
            type: 'video',
            src: videoUrl,
            volume: 0
          },
          start: 0,
          length: duration,
          fit: 'cover',
          scale: 1,
          position: 'center'
        }
      ]
    }
  ];

  // Add subtitle track if subtitles provided
  if (subtitles.length > 0) {
    tracks.push(buildSubtitleTrack(subtitles, subtitleStyle));
  }

  // Build soundtrack
  const soundtrack = audioUrl ? [
    {
      src: audioUrl,
      effect: 'fadeOut',
      volume: 0.8
    }
  ] : [];

  return {
    timeline: {
      background: '#000000',
      tracks,
      ...(soundtrack.length > 0 && { soundtrack })
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
}

module.exports = {
  VERTICAL_REEL_TEMPLATE,
  SUBTITLE_STYLES,
  AVAILABLE_FONTS,
  buildSubtitleClip,
  buildSubtitleTrack,
  buildShotstackPayload
};
