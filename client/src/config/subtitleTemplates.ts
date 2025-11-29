/**
 * Subtitle Templates for AI Video Generator
 * 
 * Professional text overlay templates for Instagram Reels & TikTok videos
 * Each template includes styling, animation, and positioning options
 */

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type SubtitlePosition = 
  | 'top' 
  | 'center' 
  | 'bottom' 
  | 'top-left' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-right';

export type AnimationType = 
  | 'none'
  | 'fade-in'
  | 'fade-out'
  | 'fade-in-out'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'pop'
  | 'bounce'
  | 'typewriter'
  | 'word-by-word'
  | 'highlight'
  | 'glitch'
  | 'wave';

export type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';

export type TextCase = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;          // in pixels (base size, scales with video)
  fontWeight: FontWeight;
  color: string;             // hex or rgba
  backgroundColor?: string;  // for highlight/box styles
  outlineColor?: string;
  outlineWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  letterSpacing?: number;
  lineHeight?: number;
  textCase?: TextCase;
  italic?: boolean;
  underline?: boolean;
}

export interface SubtitleTemplate {
  id: string;
  name: string;
  description: string;
  category: SubtitleCategory;
  style: SubtitleStyle;
  position: SubtitlePosition;
  animation: AnimationType;
  animationDuration?: number;  // ms
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  maxWidth?: number;           // percentage of video width
  preview?: string;            // preview image URL
  tags?: string[];
}

export type SubtitleCategory = 
  | 'minimal'
  | 'bold'
  | 'cinematic'
  | 'social'
  | 'neon'
  | 'retro'
  | 'elegant'
  | 'fun'
  | 'corporate'
  | 'custom';

// ============================================================
// FONT STACK OPTIONS
// ============================================================

export const FONT_FAMILIES = {
  // Sans-serif (Modern)
  inter: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  poppins: "'Poppins', sans-serif",
  montserrat: "'Montserrat', sans-serif",
  roboto: "'Roboto', sans-serif",
  openSans: "'Open Sans', sans-serif",
  
  // Display / Impact
  oswald: "'Oswald', sans-serif",
  bebas: "'Bebas Neue', sans-serif",
  anton: "'Anton', sans-serif",
  impact: "'Impact', 'Arial Black', sans-serif",
  
  // Elegant
  playfair: "'Playfair Display', serif",
  cormorant: "'Cormorant Garamond', serif",
  lora: "'Lora', serif",
  
  // Fun / Creative
  pacifico: "'Pacifico', cursive",
  lobster: "'Lobster', cursive",
  bangers: "'Bangers', cursive",
  
  // Monospace
  firaCode: "'Fira Code', monospace",
  jetbrains: "'JetBrains Mono', monospace",
  
  // System fallback
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
} as const;

// ============================================================
// COLOR PALETTES
// ============================================================

export const COLORS = {
  // Basic
  white: '#FFFFFF',
  black: '#000000',
  
  // Neutrals
  gray100: '#F3F4F6',
  gray500: '#6B7280',
  gray900: '#111827',
  
  // Primary brand colors
  blue: '#3B82F6',
  purple: '#8B5CF6',
  pink: '#EC4899',
  red: '#EF4444',
  orange: '#F97316',
  yellow: '#EAB308',
  green: '#22C55E',
  teal: '#14B8A6',
  cyan: '#06B6D4',
  
  // Neon / Glow
  neonPink: '#FF10F0',
  neonBlue: '#00F0FF',
  neonGreen: '#39FF14',
  neonPurple: '#BF00FF',
  neonYellow: '#FFFF00',
  
  // Gradients (for reference)
  gradientSunset: 'linear-gradient(135deg, #F97316, #EC4899)',
  gradientOcean: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
  gradientPurple: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
} as const;

// ============================================================
// SUBTITLE TEMPLATES
// ============================================================

export const SUBTITLE_TEMPLATES: SubtitleTemplate[] = [
  // ============ MINIMAL ============
  {
    id: 'minimal-clean',
    name: 'Clean White',
    description: 'Simple white text with subtle shadow',
    category: 'minimal',
    style: {
      fontFamily: FONT_FAMILIES.inter,
      fontSize: 32,
      fontWeight: 'medium',
      color: COLORS.white,
      shadowColor: 'rgba(0, 0, 0, 0.5)',
      shadowBlur: 4,
      shadowOffsetX: 0,
      shadowOffsetY: 2,
    },
    position: 'bottom',
    animation: 'fade-in-out',
    animationDuration: 300,
    maxWidth: 90,
    tags: ['simple', 'clean', 'versatile'],
  },
  {
    id: 'minimal-black',
    name: 'Clean Black',
    description: 'Simple black text for light backgrounds',
    category: 'minimal',
    style: {
      fontFamily: FONT_FAMILIES.inter,
      fontSize: 32,
      fontWeight: 'medium',
      color: COLORS.gray900,
      shadowColor: 'rgba(255, 255, 255, 0.5)',
      shadowBlur: 4,
      shadowOffsetX: 0,
      shadowOffsetY: 1,
    },
    position: 'bottom',
    animation: 'fade-in-out',
    animationDuration: 300,
    maxWidth: 90,
    tags: ['simple', 'clean', 'light-bg'],
  },
  {
    id: 'minimal-outline',
    name: 'Outline Style',
    description: 'White text with black outline for any background',
    category: 'minimal',
    style: {
      fontFamily: FONT_FAMILIES.inter,
      fontSize: 34,
      fontWeight: 'semibold',
      color: COLORS.white,
      outlineColor: COLORS.black,
      outlineWidth: 2,
    },
    position: 'bottom',
    animation: 'fade-in',
    animationDuration: 200,
    maxWidth: 85,
    tags: ['outline', 'readable', 'any-background'],
  },

  // ============ BOLD / IMPACT ============
  {
    id: 'bold-impact',
    name: 'Impact Bold',
    description: 'Heavy impact font for attention-grabbing text',
    category: 'bold',
    style: {
      fontFamily: FONT_FAMILIES.bebas,
      fontSize: 48,
      fontWeight: 'bold',
      color: COLORS.white,
      outlineColor: COLORS.black,
      outlineWidth: 3,
      letterSpacing: 2,
      textCase: 'uppercase',
    },
    position: 'center',
    animation: 'pop',
    animationDuration: 400,
    maxWidth: 90,
    tags: ['bold', 'impact', 'attention'],
  },
  {
    id: 'bold-yellow',
    name: 'Yellow Punch',
    description: 'Bright yellow with black background box',
    category: 'bold',
    style: {
      fontFamily: FONT_FAMILIES.oswald,
      fontSize: 40,
      fontWeight: 'bold',
      color: COLORS.yellow,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      textCase: 'uppercase',
      letterSpacing: 1,
    },
    position: 'bottom',
    animation: 'slide-up',
    animationDuration: 350,
    padding: { top: 12, right: 20, bottom: 12, left: 20 },
    maxWidth: 95,
    tags: ['bold', 'yellow', 'highlighted'],
  },
  {
    id: 'bold-highlight',
    name: 'Highlight Box',
    description: 'White text in colored highlight box',
    category: 'bold',
    style: {
      fontFamily: FONT_FAMILIES.poppins,
      fontSize: 36,
      fontWeight: 'bold',
      color: COLORS.white,
      backgroundColor: COLORS.purple,
    },
    position: 'bottom',
    animation: 'pop',
    animationDuration: 300,
    padding: { top: 10, right: 18, bottom: 10, left: 18 },
    maxWidth: 90,
    tags: ['bold', 'highlight', 'box'],
  },

  // ============ CINEMATIC ============
  {
    id: 'cinematic-trailer',
    name: 'Movie Trailer',
    description: 'Epic cinematic title style',
    category: 'cinematic',
    style: {
      fontFamily: FONT_FAMILIES.oswald,
      fontSize: 52,
      fontWeight: 'bold',
      color: COLORS.white,
      outlineColor: 'rgba(0, 0, 0, 0.8)',
      outlineWidth: 2,
      letterSpacing: 4,
      textCase: 'uppercase',
      shadowColor: 'rgba(0, 0, 0, 0.6)',
      shadowBlur: 20,
      shadowOffsetX: 0,
      shadowOffsetY: 4,
    },
    position: 'center',
    animation: 'fade-in-out',
    animationDuration: 500,
    maxWidth: 85,
    tags: ['cinematic', 'movie', 'epic'],
  },
  {
    id: 'cinematic-elegant',
    name: 'Elegant Serif',
    description: 'Refined serif font for luxury/elegant content',
    category: 'cinematic',
    style: {
      fontFamily: FONT_FAMILIES.playfair,
      fontSize: 42,
      fontWeight: 'medium',
      color: COLORS.white,
      letterSpacing: 1,
      italic: true,
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      shadowBlur: 8,
      shadowOffsetX: 0,
      shadowOffsetY: 2,
    },
    position: 'center',
    animation: 'fade-in',
    animationDuration: 600,
    maxWidth: 80,
    tags: ['elegant', 'luxury', 'serif'],
  },
  {
    id: 'cinematic-letterbox',
    name: 'Letterbox Style',
    description: 'Cinematic bars with centered text',
    category: 'cinematic',
    style: {
      fontFamily: FONT_FAMILIES.inter,
      fontSize: 28,
      fontWeight: 'normal',
      color: COLORS.white,
      letterSpacing: 3,
      textCase: 'uppercase',
    },
    position: 'bottom',
    animation: 'typewriter',
    animationDuration: 1000,
    maxWidth: 80,
    tags: ['cinematic', 'letterbox', 'film'],
  },

  // ============ SOCIAL MEDIA ============
  {
    id: 'social-tiktok',
    name: 'TikTok Style',
    description: 'Popular TikTok caption look',
    category: 'social',
    style: {
      fontFamily: FONT_FAMILIES.poppins,
      fontSize: 38,
      fontWeight: 'bold',
      color: COLORS.white,
      outlineColor: COLORS.black,
      outlineWidth: 2,
      textCase: 'uppercase',
    },
    position: 'center',
    animation: 'word-by-word',
    animationDuration: 200,
    maxWidth: 85,
    tags: ['tiktok', 'viral', 'social'],
  },
  {
    id: 'social-instagram',
    name: 'Instagram Reels',
    description: 'Clean Instagram Reels caption style',
    category: 'social',
    style: {
      fontFamily: FONT_FAMILIES.inter,
      fontSize: 34,
      fontWeight: 'semibold',
      color: COLORS.white,
      shadowColor: 'rgba(0, 0, 0, 0.6)',
      shadowBlur: 6,
      shadowOffsetX: 0,
      shadowOffsetY: 2,
    },
    position: 'bottom',
    animation: 'slide-up',
    animationDuration: 300,
    maxWidth: 90,
    tags: ['instagram', 'reels', 'clean'],
  },
  {
    id: 'social-meme',
    name: 'Meme Classic',
    description: 'Classic meme impact font',
    category: 'social',
    style: {
      fontFamily: FONT_FAMILIES.impact,
      fontSize: 44,
      fontWeight: 'bold',
      color: COLORS.white,
      outlineColor: COLORS.black,
      outlineWidth: 3,
      textCase: 'uppercase',
    },
    position: 'top',
    animation: 'none',
    maxWidth: 95,
    tags: ['meme', 'classic', 'funny'],
  },

  // ============ NEON / GLOW ============
  {
    id: 'neon-pink',
    name: 'Neon Pink',
    description: 'Glowing pink neon effect',
    category: 'neon',
    style: {
      fontFamily: FONT_FAMILIES.montserrat,
      fontSize: 40,
      fontWeight: 'bold',
      color: COLORS.neonPink,
      shadowColor: COLORS.neonPink,
      shadowBlur: 20,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      textCase: 'uppercase',
    },
    position: 'center',
    animation: 'fade-in',
    animationDuration: 400,
    maxWidth: 85,
    tags: ['neon', 'glow', 'pink', 'night'],
  },
  {
    id: 'neon-blue',
    name: 'Neon Cyan',
    description: 'Cyberpunk cyan glow effect',
    category: 'neon',
    style: {
      fontFamily: FONT_FAMILIES.montserrat,
      fontSize: 40,
      fontWeight: 'bold',
      color: COLORS.neonBlue,
      shadowColor: COLORS.neonBlue,
      shadowBlur: 25,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      textCase: 'uppercase',
    },
    position: 'center',
    animation: 'glitch',
    animationDuration: 500,
    maxWidth: 85,
    tags: ['neon', 'glow', 'cyan', 'cyberpunk'],
  },
  {
    id: 'neon-multi',
    name: 'Neon Multi-Glow',
    description: 'Multiple neon glow layers',
    category: 'neon',
    style: {
      fontFamily: FONT_FAMILIES.bebas,
      fontSize: 46,
      fontWeight: 'bold',
      color: COLORS.white,
      shadowColor: COLORS.neonPurple,
      shadowBlur: 30,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      outlineColor: COLORS.neonPink,
      outlineWidth: 2,
      textCase: 'uppercase',
      letterSpacing: 2,
    },
    position: 'center',
    animation: 'pop',
    animationDuration: 400,
    maxWidth: 85,
    tags: ['neon', 'glow', 'multi', 'party'],
  },

  // ============ RETRO ============
  {
    id: 'retro-80s',
    name: '80s Retro',
    description: 'Synthwave / 80s aesthetic',
    category: 'retro',
    style: {
      fontFamily: FONT_FAMILIES.bebas,
      fontSize: 48,
      fontWeight: 'bold',
      color: '#FF6B9D',
      outlineColor: '#00D4FF',
      outlineWidth: 2,
      shadowColor: '#FF6B9D',
      shadowBlur: 15,
      shadowOffsetX: 4,
      shadowOffsetY: 4,
      textCase: 'uppercase',
      letterSpacing: 3,
    },
    position: 'center',
    animation: 'slide-up',
    animationDuration: 400,
    maxWidth: 85,
    tags: ['retro', '80s', 'synthwave', 'vaporwave'],
  },
  {
    id: 'retro-vhs',
    name: 'VHS Glitch',
    description: 'VHS tape glitch effect',
    category: 'retro',
    style: {
      fontFamily: FONT_FAMILIES.firaCode,
      fontSize: 36,
      fontWeight: 'bold',
      color: COLORS.white,
      outlineColor: '#FF0000',
      outlineWidth: 1,
      shadowColor: '#00FFFF',
      shadowBlur: 0,
      shadowOffsetX: 3,
      shadowOffsetY: 0,
      textCase: 'uppercase',
    },
    position: 'center',
    animation: 'glitch',
    animationDuration: 600,
    maxWidth: 90,
    tags: ['retro', 'vhs', 'glitch', 'vintage'],
  },

  // ============ FUN / CREATIVE ============
  {
    id: 'fun-handwritten',
    name: 'Handwritten',
    description: 'Casual handwritten script',
    category: 'fun',
    style: {
      fontFamily: FONT_FAMILIES.pacifico,
      fontSize: 42,
      fontWeight: 'normal',
      color: COLORS.white,
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      shadowBlur: 6,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
    },
    position: 'bottom',
    animation: 'fade-in',
    animationDuration: 400,
    maxWidth: 85,
    tags: ['fun', 'handwritten', 'casual', 'friendly'],
  },
  {
    id: 'fun-comic',
    name: 'Comic Pop',
    description: 'Comic book style text',
    category: 'fun',
    style: {
      fontFamily: FONT_FAMILIES.bangers,
      fontSize: 44,
      fontWeight: 'normal',
      color: COLORS.yellow,
      outlineColor: COLORS.black,
      outlineWidth: 3,
      shadowColor: COLORS.red,
      shadowBlur: 0,
      shadowOffsetX: 4,
      shadowOffsetY: 4,
      textCase: 'uppercase',
      letterSpacing: 2,
    },
    position: 'center',
    animation: 'bounce',
    animationDuration: 500,
    maxWidth: 90,
    tags: ['fun', 'comic', 'pop', 'energetic'],
  },
  {
    id: 'fun-rainbow',
    name: 'Rainbow Gradient',
    description: 'Multi-color gradient text (CSS gradient support)',
    category: 'fun',
    style: {
      fontFamily: FONT_FAMILIES.poppins,
      fontSize: 40,
      fontWeight: 'bold',
      color: COLORS.white, // Fallback, use CSS gradient
      outlineColor: COLORS.black,
      outlineWidth: 2,
      textCase: 'uppercase',
    },
    position: 'center',
    animation: 'wave',
    animationDuration: 800,
    maxWidth: 85,
    tags: ['fun', 'rainbow', 'gradient', 'colorful'],
  },

  // ============ CORPORATE ============
  {
    id: 'corporate-clean',
    name: 'Corporate Clean',
    description: 'Professional business presentation style',
    category: 'corporate',
    style: {
      fontFamily: FONT_FAMILIES.inter,
      fontSize: 32,
      fontWeight: 'medium',
      color: COLORS.gray900,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
    },
    position: 'bottom',
    animation: 'fade-in',
    animationDuration: 300,
    padding: { top: 14, right: 24, bottom: 14, left: 24 },
    maxWidth: 85,
    tags: ['corporate', 'professional', 'clean', 'business'],
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Blue accent professional style',
    category: 'corporate',
    style: {
      fontFamily: FONT_FAMILIES.roboto,
      fontSize: 30,
      fontWeight: 'medium',
      color: COLORS.white,
      backgroundColor: COLORS.blue,
    },
    position: 'bottom',
    animation: 'slide-up',
    animationDuration: 350,
    padding: { top: 12, right: 20, bottom: 12, left: 20 },
    maxWidth: 80,
    tags: ['corporate', 'blue', 'professional'],
  },
  {
    id: 'corporate-minimal',
    name: 'Corporate Minimal',
    description: 'Ultra-minimal lower third style',
    category: 'corporate',
    style: {
      fontFamily: FONT_FAMILIES.inter,
      fontSize: 24,
      fontWeight: 'normal',
      color: COLORS.gray100,
      letterSpacing: 1,
    },
    position: 'bottom-left',
    animation: 'fade-in',
    animationDuration: 400,
    padding: { top: 20, right: 0, bottom: 20, left: 30 },
    maxWidth: 70,
    tags: ['corporate', 'minimal', 'lower-third'],
  },

  // ============================================================
  // 🔥 VIRAL TEMPLATES - MOST USED ON TIKTOK & REELS
  // ============================================================

  // ============ VIRAL HOOKS (Top Text) ============
  {
    id: 'viral-bold-top',
    name: 'Bold Top Attention',
    description: 'STOP SCROLLING - Big bold hook at top for maximum attention',
    category: 'bold',
    style: {
      fontFamily: FONT_FAMILIES.bebas,
      fontSize: 38,
      fontWeight: 'bold',
      color: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 3,
      shadowColor: 'rgba(0, 0, 0, 0.8)',
      shadowBlur: 8,
      shadowOffsetX: 0,
      shadowOffsetY: 4,
      textCase: 'uppercase',
    },
    position: 'top',
    animation: 'pop',
    animationDuration: 400,
    maxWidth: 95,
    tags: ['viral', 'hook', 'attention', 'tiktok', 'reels', 'motivation'],
  },
  {
    id: 'viral-stop-scrolling',
    name: 'Stop Scrolling Hook',
    description: 'READ THIS BEFORE YOU SCROLL - Grabs attention instantly',
    category: 'bold',
    style: {
      fontFamily: FONT_FAMILIES.oswald,
      fontSize: 42,
      fontWeight: 'bold',
      color: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 4,
      textCase: 'uppercase',
      letterSpacing: 2,
    },
    position: 'top',
    animation: 'slide-down',
    animationDuration: 350,
    maxWidth: 90,
    tags: ['viral', 'hook', 'stop-scroll', 'business', 'motivational'],
  },
  {
    id: 'viral-watch-till-end',
    name: 'Watch Till End',
    description: 'WATCH TILL THE END - Creates curiosity and retention',
    category: 'bold',
    style: {
      fontFamily: FONT_FAMILIES.montserrat,
      fontSize: 36,
      fontWeight: 'bold',
      color: '#FFD700',
      outlineColor: '#000000',
      outlineWidth: 3,
      shadowColor: 'rgba(255, 215, 0, 0.4)',
      shadowBlur: 10,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      textCase: 'uppercase',
    },
    position: 'top',
    animation: 'bounce',
    animationDuration: 500,
    maxWidth: 90,
    tags: ['viral', 'hook', 'retention', 'curiosity'],
  },

  // ============ STORY SUBTITLE (Yellow Highlight) ============
  {
    id: 'viral-story-yellow',
    name: 'Story Subtitle Yellow',
    description: 'Everything changed after this moment... - Emotional storytelling',
    category: 'cinematic',
    style: {
      fontFamily: FONT_FAMILIES.poppins,
      fontSize: 28,
      fontWeight: 'medium',
      color: '#FFD700',
      shadowColor: 'rgba(0, 0, 0, 0.8)',
      shadowBlur: 6,
      shadowOffsetX: 0,
      shadowOffsetY: 2,
    },
    position: 'bottom',
    animation: 'fade-in',
    animationDuration: 400,
    maxWidth: 90,
    tags: ['viral', 'story', 'emotional', 'yellow', 'storytelling'],
  },
  {
    id: 'viral-story-reveal',
    name: 'Story Reveal',
    description: 'Here\'s the truth they hide from you... - Creates mystery',
    category: 'cinematic',
    style: {
      fontFamily: FONT_FAMILIES.inter,
      fontSize: 26,
      fontWeight: 'medium',
      color: '#F1C40F',
      shadowColor: 'rgba(0, 0, 0, 0.9)',
      shadowBlur: 8,
      shadowOffsetX: 0,
      shadowOffsetY: 3,
      italic: true,
    },
    position: 'bottom',
    animation: 'typewriter',
    animationDuration: 1200,
    maxWidth: 85,
    tags: ['viral', 'story', 'mystery', 'reveal', 'emotional'],
  },

  // ============ TIKTOK AUTO CAPTION STYLE ============
  {
    id: 'viral-tiktok-caption',
    name: 'TikTok Caption Style',
    description: 'Let me tell you something important... - Auto caption look',
    category: 'social',
    style: {
      fontFamily: FONT_FAMILIES.inter,
      fontSize: 30,
      fontWeight: 'semibold',
      color: '#FFFFFF',
      shadowColor: 'rgba(0, 0, 0, 0.7)',
      shadowBlur: 4,
      shadowOffsetX: 0,
      shadowOffsetY: 2,
    },
    position: 'bottom',
    animation: 'fade-in',
    animationDuration: 200,
    maxWidth: 90,
    tags: ['viral', 'tiktok', 'caption', 'auto-caption', 'talking-head'],
  },
  {
    id: 'viral-tiktok-rounded',
    name: 'TikTok Rounded BG',
    description: 'TikTok style with subtle rounded background',
    category: 'social',
    style: {
      fontFamily: FONT_FAMILIES.inter,
      fontSize: 28,
      fontWeight: 'semibold',
      color: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      shadowColor: 'rgba(0, 0, 0, 0.5)',
      shadowBlur: 2,
      shadowOffsetX: 0,
      shadowOffsetY: 1,
    },
    position: 'bottom',
    animation: 'slide-up',
    animationDuration: 250,
    padding: { top: 10, right: 16, bottom: 10, left: 16 },
    maxWidth: 85,
    tags: ['viral', 'tiktok', 'rounded', 'background', 'tutorial'],
  },

  // ============ MOTIVATIONAL QUOTE CENTER ============
  {
    id: 'viral-motivation-center',
    name: 'Motivational Quote',
    description: 'Discipline builds everything. - Elegant centered quote',
    category: 'elegant',
    style: {
      fontFamily: FONT_FAMILIES.playfair,
      fontSize: 32,
      fontWeight: 'normal',
      color: '#FFFFFF',
      shadowColor: 'rgba(0, 0, 0, 0.5)',
      shadowBlur: 6,
      shadowOffsetX: 0,
      shadowOffsetY: 2,
      italic: true,
      letterSpacing: 1,
    },
    position: 'center',
    animation: 'fade-in-out',
    animationDuration: 600,
    maxWidth: 80,
    tags: ['viral', 'motivation', 'quote', 'elegant', 'gym', 'mindset'],
  },
  {
    id: 'viral-motivation-bold',
    name: 'Bold Motivation',
    description: 'If it was easy, everyone would do it. - Impact style',
    category: 'bold',
    style: {
      fontFamily: FONT_FAMILIES.oswald,
      fontSize: 36,
      fontWeight: 'bold',
      color: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 2,
      textCase: 'uppercase',
      letterSpacing: 2,
    },
    position: 'center',
    animation: 'pop',
    animationDuration: 400,
    maxWidth: 85,
    tags: ['viral', 'motivation', 'bold', 'gym', 'grind'],
  },

  // ============ MEME STYLE (TOP + BOTTOM) ============
  {
    id: 'viral-meme-top',
    name: 'Meme Top Text',
    description: 'When you start using AI... - Classic meme top',
    category: 'fun',
    style: {
      fontFamily: FONT_FAMILIES.impact,
      fontSize: 40,
      fontWeight: 'bold',
      color: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 3,
      textCase: 'uppercase',
    },
    position: 'top',
    animation: 'none',
    maxWidth: 95,
    tags: ['viral', 'meme', 'funny', 'top-text'],
  },
  {
    id: 'viral-meme-bottom',
    name: 'Meme Bottom Text',
    description: '...and suddenly life becomes 10x easier - Classic meme bottom',
    category: 'fun',
    style: {
      fontFamily: FONT_FAMILIES.impact,
      fontSize: 40,
      fontWeight: 'bold',
      color: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 3,
      textCase: 'uppercase',
    },
    position: 'bottom',
    animation: 'none',
    maxWidth: 95,
    tags: ['viral', 'meme', 'funny', 'bottom-text'],
  },

  // ============ KARAOKE HIGHLIGHT (MOST VIRAL NOW) ============
  {
    id: 'viral-karaoke',
    name: 'Karaoke Highlight',
    description: 'Word by word highlight - Most viral subtitle style',
    category: 'social',
    style: {
      fontFamily: FONT_FAMILIES.poppins,
      fontSize: 34,
      fontWeight: 'bold',
      color: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 2,
      shadowColor: 'rgba(0, 0, 0, 0.6)',
      shadowBlur: 4,
      shadowOffsetX: 0,
      shadowOffsetY: 2,
    },
    position: 'bottom',
    animation: 'highlight',
    animationDuration: 300,
    maxWidth: 90,
    tags: ['viral', 'karaoke', 'highlight', 'music', 'emotional', 'gym'],
  },
  {
    id: 'viral-karaoke-neon',
    name: 'Karaoke Neon',
    description: 'Neon yellow highlight word by word',
    category: 'neon',
    style: {
      fontFamily: FONT_FAMILIES.montserrat,
      fontSize: 36,
      fontWeight: 'bold',
      color: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 2,
      shadowColor: '#FFD700',
      shadowBlur: 15,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
    },
    position: 'bottom',
    animation: 'word-by-word',
    animationDuration: 200,
    maxWidth: 90,
    tags: ['viral', 'karaoke', 'neon', 'yellow', 'glow'],
  },

  // ============ NETFLIX SUBTITLE STYLE ============
  {
    id: 'viral-netflix',
    name: 'Netflix Style',
    description: 'This is the truth... - Netflix yellow subtitle',
    category: 'cinematic',
    style: {
      fontFamily: FONT_FAMILIES.roboto,
      fontSize: 30,
      fontWeight: 'semibold',
      color: '#F1C40F',
      shadowColor: 'rgba(0, 0, 0, 0.9)',
      shadowBlur: 6,
      shadowOffsetX: 0,
      shadowOffsetY: 2,
    },
    position: 'bottom',
    animation: 'fade-in-out',
    animationDuration: 300,
    maxWidth: 85,
    tags: ['viral', 'netflix', 'cinematic', 'yellow', 'movie'],
  },

  // ============ MRBEAST STYLE ============
  {
    id: 'viral-mrbeast',
    name: 'MrBeast Style',
    description: 'Bold white with thick black stroke - Maximum readability',
    category: 'bold',
    style: {
      fontFamily: FONT_FAMILIES.bebas,
      fontSize: 44,
      fontWeight: 'bold',
      color: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 4,
      textCase: 'uppercase',
      letterSpacing: 1,
    },
    position: 'center',
    animation: 'pop',
    animationDuration: 350,
    maxWidth: 90,
    tags: ['viral', 'mrbeast', 'youtube', 'bold', 'readable'],
  },

  // ============ SPEECH BUBBLE STYLE ============
  {
    id: 'viral-speech-bubble',
    name: 'Speech Bubble',
    description: 'Rounded rectangle background - Great for tutorials',
    category: 'social',
    style: {
      fontFamily: FONT_FAMILIES.inter,
      fontSize: 26,
      fontWeight: 'medium',
      color: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
    },
    position: 'bottom',
    animation: 'slide-up',
    animationDuration: 300,
    padding: { top: 14, right: 20, bottom: 14, left: 20 },
    maxWidth: 85,
    tags: ['viral', 'speech-bubble', 'tutorial', 'talking-head', 'explainer'],
  },

  // ============ MINIMAL AESTHETIC (IG Stories) ============
  {
    id: 'viral-minimal-aesthetic',
    name: 'Minimal Aesthetic',
    description: 'Thin soft white - Perfect for IG stories aesthetic',
    category: 'minimal',
    style: {
      fontFamily: FONT_FAMILIES.inter,
      fontSize: 24,
      fontWeight: 'normal',
      color: 'rgba(255, 255, 255, 0.9)',
      letterSpacing: 2,
    },
    position: 'center',
    animation: 'fade-in',
    animationDuration: 500,
    maxWidth: 80,
    tags: ['viral', 'aesthetic', 'minimal', 'instagram', 'stories', 'soft'],
  },

  // ============ BUSINESS / MONEY HOOKS ============
  {
    id: 'viral-business-hook',
    name: 'Business Hook',
    description: 'Watch this before you start a business - Money/biz content',
    category: 'corporate',
    style: {
      fontFamily: FONT_FAMILIES.montserrat,
      fontSize: 32,
      fontWeight: 'bold',
      color: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 2,
      shadowColor: 'rgba(0, 0, 0, 0.7)',
      shadowBlur: 6,
      shadowOffsetX: 0,
      shadowOffsetY: 3,
    },
    position: 'top',
    animation: 'slide-down',
    animationDuration: 400,
    maxWidth: 90,
    tags: ['viral', 'business', 'money', 'entrepreneur', 'hook'],
  },
  {
    id: 'viral-money-mistake',
    name: 'Money Mistake Hook',
    description: 'This ONE mistake is ruining your growth - Creates urgency',
    category: 'bold',
    style: {
      fontFamily: FONT_FAMILIES.oswald,
      fontSize: 34,
      fontWeight: 'bold',
      color: '#FF4444',
      outlineColor: '#000000',
      outlineWidth: 3,
      textCase: 'uppercase',
    },
    position: 'top',
    animation: 'pop',
    animationDuration: 400,
    maxWidth: 90,
    tags: ['viral', 'business', 'mistake', 'urgency', 'warning'],
  },

  // ============ GYM / FITNESS HOOKS ============
  {
    id: 'viral-gym-motivation',
    name: 'Gym Motivation',
    description: 'Remember why you started - Fitness motivation',
    category: 'bold',
    style: {
      fontFamily: FONT_FAMILIES.bebas,
      fontSize: 40,
      fontWeight: 'bold',
      color: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 3,
      textCase: 'uppercase',
      letterSpacing: 3,
    },
    position: 'center',
    animation: 'pop',
    animationDuration: 450,
    maxWidth: 90,
    tags: ['viral', 'gym', 'fitness', 'motivation', 'workout'],
  },
  {
    id: 'viral-gym-pain',
    name: 'Pain Temporary',
    description: 'Pain is temporary. Pride is forever. - Classic gym quote',
    category: 'bold',
    style: {
      fontFamily: FONT_FAMILIES.oswald,
      fontSize: 38,
      fontWeight: 'bold',
      color: '#FFD700',
      outlineColor: '#000000',
      outlineWidth: 3,
      textCase: 'uppercase',
    },
    position: 'center',
    animation: 'fade-in',
    animationDuration: 500,
    maxWidth: 85,
    tags: ['viral', 'gym', 'pain', 'pride', 'motivation'],
  },

  // ============ LIFESTYLE HOOKS ============
  {
    id: 'viral-lifestyle-change',
    name: 'Lifestyle Change',
    description: 'This changed everything for me - Personal transformation',
    category: 'cinematic',
    style: {
      fontFamily: FONT_FAMILIES.poppins,
      fontSize: 30,
      fontWeight: 'medium',
      color: '#FFFFFF',
      shadowColor: 'rgba(0, 0, 0, 0.7)',
      shadowBlur: 8,
      shadowOffsetX: 0,
      shadowOffsetY: 3,
    },
    position: 'bottom',
    animation: 'fade-in',
    animationDuration: 500,
    maxWidth: 85,
    tags: ['viral', 'lifestyle', 'transformation', 'personal', 'growth'],
  },
  {
    id: 'viral-nobody-talks',
    name: 'Nobody Talks About',
    description: 'Nobody talks about this enough... - Creates intrigue',
    category: 'cinematic',
    style: {
      fontFamily: FONT_FAMILIES.inter,
      fontSize: 28,
      fontWeight: 'medium',
      color: '#FFFFFF',
      shadowColor: 'rgba(0, 0, 0, 0.8)',
      shadowBlur: 6,
      shadowOffsetX: 0,
      shadowOffsetY: 2,
      italic: true,
    },
    position: 'bottom',
    animation: 'typewriter',
    animationDuration: 1000,
    maxWidth: 85,
    tags: ['viral', 'intrigue', 'mystery', 'storytelling', 'lifestyle'],
  },
];

// ============================================================
// VIRAL HOOK TEMPLATES (Ready-to-use text)
// ============================================================

export interface ViralHook {
  id: string;
  text: string;
  category: 'business' | 'motivation' | 'lifestyle' | 'gym' | 'general';
  position: SubtitlePosition;
  suggestedTemplateId: string;
}

export const VIRAL_HOOKS: ViralHook[] = [
  // Business / Money
  { id: 'hook-1', text: 'STOP SCROLLING', category: 'general', position: 'top', suggestedTemplateId: 'viral-bold-top' },
  { id: 'hook-2', text: 'READ THIS BEFORE YOU SCROLL', category: 'general', position: 'top', suggestedTemplateId: 'viral-stop-scrolling' },
  { id: 'hook-3', text: 'THIS WILL CHANGE YOUR LIFE', category: 'motivation', position: 'top', suggestedTemplateId: 'viral-bold-top' },
  { id: 'hook-4', text: 'WATCH TILL THE END', category: 'general', position: 'top', suggestedTemplateId: 'viral-watch-till-end' },
  { id: 'hook-5', text: 'The 3-second rule nobody tells you about…', category: 'business', position: 'top', suggestedTemplateId: 'viral-business-hook' },
  { id: 'hook-6', text: 'Watch this before you start a business.', category: 'business', position: 'top', suggestedTemplateId: 'viral-business-hook' },
  { id: 'hook-7', text: 'I wish someone told me this earlier…', category: 'business', position: 'top', suggestedTemplateId: 'viral-story-yellow' },
  { id: 'hook-8', text: 'Do this if you want to make money in 2025.', category: 'business', position: 'top', suggestedTemplateId: 'viral-bold-top' },
  { id: 'hook-9', text: 'This ONE mistake is ruining your growth.', category: 'business', position: 'top', suggestedTemplateId: 'viral-money-mistake' },
  
  // Motivation / Gym
  { id: 'hook-10', text: 'Read this when you feel like giving up.', category: 'motivation', position: 'center', suggestedTemplateId: 'viral-motivation-center' },
  { id: 'hook-11', text: 'Remember why you started.', category: 'gym', position: 'center', suggestedTemplateId: 'viral-gym-motivation' },
  { id: 'hook-12', text: 'Your only competition is you.', category: 'motivation', position: 'center', suggestedTemplateId: 'viral-motivation-bold' },
  { id: 'hook-13', text: 'Pain is temporary. Pride is forever.', category: 'gym', position: 'center', suggestedTemplateId: 'viral-gym-pain' },
  { id: 'hook-14', text: 'Discipline builds everything.', category: 'motivation', position: 'center', suggestedTemplateId: 'viral-motivation-center' },
  { id: 'hook-15', text: 'If it was easy, everyone would do it.', category: 'motivation', position: 'center', suggestedTemplateId: 'viral-motivation-bold' },
  { id: 'hook-16', text: 'Be stronger than your excuses.', category: 'gym', position: 'center', suggestedTemplateId: 'viral-gym-motivation' },
  
  // Lifestyle / Story
  { id: 'hook-17', text: 'Nobody talks about this enough…', category: 'lifestyle', position: 'bottom', suggestedTemplateId: 'viral-nobody-talks' },
  { id: 'hook-18', text: 'This changed everything for me.', category: 'lifestyle', position: 'bottom', suggestedTemplateId: 'viral-lifestyle-change' },
  { id: 'hook-19', text: 'The moment you choose yourself, life gets better.', category: 'lifestyle', position: 'center', suggestedTemplateId: 'viral-motivation-center' },
  { id: 'hook-20', text: 'I didn\'t know this would happen…', category: 'lifestyle', position: 'bottom', suggestedTemplateId: 'viral-story-yellow' },
  { id: 'hook-21', text: 'Everything changed after this moment.', category: 'lifestyle', position: 'bottom', suggestedTemplateId: 'viral-story-yellow' },
  { id: 'hook-22', text: 'Here\'s the truth they hide from you.', category: 'lifestyle', position: 'bottom', suggestedTemplateId: 'viral-story-reveal' },
];

/**
 * Get viral hooks by category
 */
export const getViralHooksByCategory = (category: ViralHook['category']): ViralHook[] => {
  return VIRAL_HOOKS.filter(h => h.category === category);
};

/**
 * Get random viral hook
 */
export const getRandomViralHook = (category?: ViralHook['category']): ViralHook => {
  const hooks = category ? getViralHooksByCategory(category) : VIRAL_HOOKS;
  return hooks[Math.floor(Math.random() * hooks.length)];
};
};

/**
 * Get category display info
 */
export const getCategoryInfo = (category: SubtitleCategory) => {
  const info: Record<SubtitleCategory, { name: string; icon: string; description: string }> = {
    minimal: { name: 'Minimal', icon: '✨', description: 'Clean, simple text styles' },
    bold: { name: 'Bold', icon: '💪', description: 'High-impact attention grabbers' },
    cinematic: { name: 'Cinematic', icon: '🎬', description: 'Movie-style epic text' },
    social: { name: 'Social', icon: '📱', description: 'TikTok & Instagram viral styles' },
    neon: { name: 'Neon', icon: '💡', description: 'Glowing neon effects' },
    retro: { name: 'Retro', icon: '📼', description: '80s, VHS, vintage looks' },
    elegant: { name: 'Elegant', icon: '👑', description: 'Luxury, refined styles' },
    fun: { name: 'Fun', icon: '🎉', description: 'Playful, creative text' },
    corporate: { name: 'Corporate', icon: '💼', description: 'Professional business styles' },
    custom: { name: 'Custom', icon: '🎨', description: 'Your custom styles' },
  };
  return info[category];
};

/**
 * Generate CSS animation keyframes for a template
 */
export const getAnimationCSS = (animation: AnimationType, duration: number = 300): string => {
  const animations: Record<AnimationType, string> = {
    'none': '',
    'fade-in': `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      animation: fadeIn ${duration}ms ease-out;
    `,
    'fade-out': `
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      animation: fadeOut ${duration}ms ease-in;
    `,
    'fade-in-out': `
      @keyframes fadeInOut {
        0% { opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { opacity: 0; }
      }
      animation: fadeInOut ${duration}ms ease-in-out;
    `,
    'slide-up': `
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      animation: slideUp ${duration}ms ease-out;
    `,
    'slide-down': `
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      animation: slideDown ${duration}ms ease-out;
    `,
    'slide-left': `
      @keyframes slideLeft {
        from { opacity: 0; transform: translateX(30px); }
        to { opacity: 1; transform: translateX(0); }
      }
      animation: slideLeft ${duration}ms ease-out;
    `,
    'slide-right': `
      @keyframes slideRight {
        from { opacity: 0; transform: translateX(-30px); }
        to { opacity: 1; transform: translateX(0); }
      }
      animation: slideRight ${duration}ms ease-out;
    `,
    'pop': `
      @keyframes pop {
        0% { opacity: 0; transform: scale(0.5); }
        70% { transform: scale(1.1); }
        100% { opacity: 1; transform: scale(1); }
      }
      animation: pop ${duration}ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `,
    'bounce': `
      @keyframes bounce {
        0% { opacity: 0; transform: scale(0.3) translateY(-50px); }
        50% { transform: scale(1.05) translateY(0); }
        70% { transform: scale(0.95); }
        100% { opacity: 1; transform: scale(1); }
      }
      animation: bounce ${duration}ms ease-out;
    `,
    'typewriter': `
      overflow: hidden;
      white-space: nowrap;
      animation: typewriter ${duration}ms steps(40, end);
      @keyframes typewriter {
        from { width: 0; }
        to { width: 100%; }
      }
    `,
    'word-by-word': `
      @keyframes wordFade {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      animation: wordFade ${duration}ms ease-out;
    `,
    'highlight': `
      @keyframes highlight {
        0% { background-size: 0% 100%; }
        100% { background-size: 100% 100%; }
      }
      background: linear-gradient(transparent 60%, #FFEB3B 60%);
      background-size: 0% 100%;
      background-repeat: no-repeat;
      animation: highlight ${duration}ms ease-out forwards;
    `,
    'glitch': `
      @keyframes glitch {
        0% { transform: translate(0); }
        20% { transform: translate(-2px, 2px); }
        40% { transform: translate(-2px, -2px); }
        60% { transform: translate(2px, 2px); }
        80% { transform: translate(2px, -2px); }
        100% { transform: translate(0); }
      }
      animation: glitch ${duration}ms ease-in-out infinite;
    `,
    'wave': `
      @keyframes wave {
        0%, 100% { transform: translateY(0); }
        25% { transform: translateY(-5px); }
        75% { transform: translateY(5px); }
      }
      animation: wave ${duration}ms ease-in-out infinite;
    `,
  };
  
  return animations[animation] || '';
};

/**
 * Convert template style to CSS object
 */
export const styleToCSS = (style: SubtitleStyle): React.CSSProperties => {
  const css: React.CSSProperties = {
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight === 'normal' ? 400 :
                style.fontWeight === 'medium' ? 500 :
                style.fontWeight === 'semibold' ? 600 :
                style.fontWeight === 'bold' ? 700 :
                style.fontWeight === 'extrabold' ? 800 : 900,
    color: style.color,
    letterSpacing: style.letterSpacing ? `${style.letterSpacing}px` : undefined,
    lineHeight: style.lineHeight || 1.4,
    textTransform: style.textCase === 'uppercase' ? 'uppercase' :
                   style.textCase === 'lowercase' ? 'lowercase' :
                   style.textCase === 'capitalize' ? 'capitalize' : 'none',
    fontStyle: style.italic ? 'italic' : 'normal',
    textDecoration: style.underline ? 'underline' : 'none',
  };
  
  if (style.backgroundColor) {
    css.backgroundColor = style.backgroundColor;
  }
  
  // Text shadow (outline + shadow combined)
  const shadows: string[] = [];
  
  if (style.outlineColor && style.outlineWidth) {
    const w = style.outlineWidth;
    // Create outline using multiple shadows
    shadows.push(
      `${-w}px ${-w}px 0 ${style.outlineColor}`,
      `${w}px ${-w}px 0 ${style.outlineColor}`,
      `${-w}px ${w}px 0 ${style.outlineColor}`,
      `${w}px ${w}px 0 ${style.outlineColor}`
    );
  }
  
  if (style.shadowColor) {
    shadows.push(
      `${style.shadowOffsetX || 0}px ${style.shadowOffsetY || 0}px ${style.shadowBlur || 0}px ${style.shadowColor}`
    );
  }
  
  if (shadows.length > 0) {
    css.textShadow = shadows.join(', ');
  }
  
  return css;
};

// Default export
export default SUBTITLE_TEMPLATES;
