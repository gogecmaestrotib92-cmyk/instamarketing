import React, { useState, useMemo } from 'react';
import { FiCheck, FiSearch, FiEye } from 'react-icons/fi';
import './SubtitleTemplateSelector.css';

/**
 * Subtitle Template Data (JavaScript version of subtitleTemplates.ts)
 */

const FONT_FAMILIES = {
  inter: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  poppins: "'Poppins', sans-serif",
  montserrat: "'Montserrat', sans-serif",
  roboto: "'Roboto', sans-serif",
  oswald: "'Oswald', sans-serif",
  bebas: "'Bebas Neue', sans-serif",
  playfair: "'Playfair Display', serif",
  impact: "'Impact', 'Arial Black', sans-serif",
  pacifico: "'Pacifico', cursive",
  bangers: "'Bangers', cursive",
  firaCode: "'Fira Code', monospace",
};

const COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  yellow: '#EAB308',
  neonPink: '#FF10F0',
  neonBlue: '#00F0FF',
  purple: '#8B5CF6',
  blue: '#3B82F6',
  red: '#EF4444',
  green: '#22C55E',
};

// Subtitle templates
const SUBTITLE_TEMPLATES = [
  // ============ VIRAL - MOST POPULAR ============
  {
    id: 'viral-tiktok-caption',
    name: 'TikTok Caption',
    description: 'Most used TikTok style',
    category: 'viral',
    style: {
      fontFamily: FONT_FAMILIES.inter,
      fontSize: 30,
      fontWeight: 'semibold',
      color: COLORS.white,
      shadowColor: 'rgba(0, 0, 0, 0.7)',
      shadowBlur: 4,
      outlineColor: null,
      outlineWidth: 0,
    },
    position: 'bottom',
    animation: 'fade-in',
  },
  {
    id: 'viral-karaoke',
    name: 'Karaoke Highlight',
    description: 'Word-by-word highlight',
    category: 'viral',
    style: {
      fontFamily: FONT_FAMILIES.poppins,
      fontSize: 34,
      fontWeight: 'bold',
      color: COLORS.white,
      outlineColor: COLORS.black,
      outlineWidth: 2,
      shadowColor: 'rgba(0, 0, 0, 0.6)',
      shadowBlur: 4,
    },
    position: 'bottom',
    animation: 'highlight',
  },
  {
    id: 'viral-mrbeast',
    name: 'MrBeast Style',
    description: 'Bold white with thick stroke',
    category: 'viral',
    style: {
      fontFamily: FONT_FAMILIES.bebas,
      fontSize: 44,
      fontWeight: 'bold',
      color: COLORS.white,
      outlineColor: COLORS.black,
      outlineWidth: 4,
      textCase: 'uppercase',
    },
    position: 'center',
    animation: 'pop',
  },
  {
    id: 'viral-netflix',
    name: 'Netflix Yellow',
    description: 'Classic yellow subtitle',
    category: 'viral',
    style: {
      fontFamily: FONT_FAMILIES.roboto,
      fontSize: 30,
      fontWeight: 'semibold',
      color: '#F1C40F',
      shadowColor: 'rgba(0, 0, 0, 0.9)',
      shadowBlur: 6,
    },
    position: 'bottom',
    animation: 'fade-in-out',
  },
  {
    id: 'viral-bold-hook',
    name: 'Bold Hook',
    description: 'Attention grabbing top text',
    category: 'viral',
    style: {
      fontFamily: FONT_FAMILIES.bebas,
      fontSize: 38,
      fontWeight: 'bold',
      color: COLORS.white,
      outlineColor: COLORS.black,
      outlineWidth: 3,
      textCase: 'uppercase',
    },
    position: 'top',
    animation: 'pop',
  },

  // ============ MINIMAL ============
  {
    id: 'minimal-clean',
    name: 'Clean White',
    description: 'Simple and elegant',
    category: 'minimal',
    style: {
      fontFamily: FONT_FAMILIES.inter,
      fontSize: 32,
      fontWeight: 'medium',
      color: COLORS.white,
      shadowColor: 'rgba(0, 0, 0, 0.5)',
      shadowBlur: 4,
    },
    position: 'bottom',
    animation: 'fade-in-out',
  },
  {
    id: 'minimal-outline',
    name: 'Outline Style',
    description: 'White with black outline',
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
  },
  {
    id: 'minimal-aesthetic',
    name: 'Aesthetic Soft',
    description: 'Soft minimal for IG stories',
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
  },

  // ============ BOLD ============
  {
    id: 'bold-impact',
    name: 'Impact Bold',
    description: 'Heavy attention grabber',
    category: 'bold',
    style: {
      fontFamily: FONT_FAMILIES.bebas,
      fontSize: 48,
      fontWeight: 'bold',
      color: COLORS.white,
      outlineColor: COLORS.black,
      outlineWidth: 3,
      textCase: 'uppercase',
      letterSpacing: 2,
    },
    position: 'center',
    animation: 'pop',
  },
  {
    id: 'bold-yellow',
    name: 'Yellow Punch',
    description: 'Yellow with black background',
    category: 'bold',
    style: {
      fontFamily: FONT_FAMILIES.oswald,
      fontSize: 40,
      fontWeight: 'bold',
      color: COLORS.yellow,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      textCase: 'uppercase',
    },
    position: 'bottom',
    animation: 'slide-up',
  },
  {
    id: 'bold-red-warning',
    name: 'Red Warning',
    description: 'Urgent attention style',
    category: 'bold',
    style: {
      fontFamily: FONT_FAMILIES.oswald,
      fontSize: 36,
      fontWeight: 'bold',
      color: COLORS.red,
      outlineColor: COLORS.black,
      outlineWidth: 3,
      textCase: 'uppercase',
    },
    position: 'top',
    animation: 'pop',
  },

  // ============ CINEMATIC ============
  {
    id: 'cinematic-trailer',
    name: 'Movie Trailer',
    description: 'Epic cinematic title',
    category: 'cinematic',
    style: {
      fontFamily: FONT_FAMILIES.oswald,
      fontSize: 52,
      fontWeight: 'bold',
      color: COLORS.white,
      outlineColor: 'rgba(0, 0, 0, 0.8)',
      outlineWidth: 2,
      textCase: 'uppercase',
      letterSpacing: 4,
      shadowColor: 'rgba(0, 0, 0, 0.6)',
      shadowBlur: 20,
    },
    position: 'center',
    animation: 'fade-in-out',
  },
  {
    id: 'cinematic-elegant',
    name: 'Elegant Serif',
    description: 'Luxury refined style',
    category: 'cinematic',
    style: {
      fontFamily: FONT_FAMILIES.playfair,
      fontSize: 42,
      fontWeight: 'medium',
      color: COLORS.white,
      italic: true,
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      shadowBlur: 8,
    },
    position: 'center',
    animation: 'fade-in',
  },

  // ============ NEON ============
  {
    id: 'neon-pink',
    name: 'Neon Pink',
    description: 'Glowing pink effect',
    category: 'neon',
    style: {
      fontFamily: FONT_FAMILIES.montserrat,
      fontSize: 40,
      fontWeight: 'bold',
      color: COLORS.neonPink,
      shadowColor: COLORS.neonPink,
      shadowBlur: 20,
      textCase: 'uppercase',
    },
    position: 'center',
    animation: 'fade-in',
  },
  {
    id: 'neon-cyan',
    name: 'Neon Cyan',
    description: 'Cyberpunk glow',
    category: 'neon',
    style: {
      fontFamily: FONT_FAMILIES.montserrat,
      fontSize: 40,
      fontWeight: 'bold',
      color: COLORS.neonBlue,
      shadowColor: COLORS.neonBlue,
      shadowBlur: 25,
      textCase: 'uppercase',
    },
    position: 'center',
    animation: 'glitch',
  },

  // ============ FUN ============
  {
    id: 'fun-handwritten',
    name: 'Handwritten',
    description: 'Casual script font',
    category: 'fun',
    style: {
      fontFamily: FONT_FAMILIES.pacifico,
      fontSize: 42,
      fontWeight: 'normal',
      color: COLORS.white,
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      shadowBlur: 6,
    },
    position: 'bottom',
    animation: 'fade-in',
  },
  {
    id: 'fun-comic',
    name: 'Comic Pop',
    description: 'Comic book style',
    category: 'fun',
    style: {
      fontFamily: FONT_FAMILIES.bangers,
      fontSize: 44,
      fontWeight: 'normal',
      color: COLORS.yellow,
      outlineColor: COLORS.black,
      outlineWidth: 3,
      shadowColor: COLORS.red,
      shadowOffsetX: 4,
      shadowOffsetY: 4,
      textCase: 'uppercase',
    },
    position: 'center',
    animation: 'bounce',
  },
  {
    id: 'fun-meme',
    name: 'Meme Classic',
    description: 'Classic meme font',
    category: 'fun',
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
  },

  // ============ MOTIVATION ============
  {
    id: 'motivation-quote',
    name: 'Quote Style',
    description: 'Elegant centered quote',
    category: 'motivation',
    style: {
      fontFamily: FONT_FAMILIES.playfair,
      fontSize: 32,
      fontWeight: 'normal',
      color: COLORS.white,
      italic: true,
      shadowColor: 'rgba(0, 0, 0, 0.5)',
      shadowBlur: 6,
    },
    position: 'center',
    animation: 'fade-in-out',
  },
  {
    id: 'motivation-gym',
    name: 'Gym Bold',
    description: 'Fitness motivation',
    category: 'motivation',
    style: {
      fontFamily: FONT_FAMILIES.bebas,
      fontSize: 40,
      fontWeight: 'bold',
      color: COLORS.white,
      outlineColor: COLORS.black,
      outlineWidth: 3,
      textCase: 'uppercase',
      letterSpacing: 3,
    },
    position: 'center',
    animation: 'pop',
  },
];

// Categories with icons
const CATEGORIES = [
  { id: 'all', name: 'All', icon: '✨' },
  { id: 'viral', name: 'Viral', icon: '🔥' },
  { id: 'minimal', name: 'Minimal', icon: '◻️' },
  { id: 'bold', name: 'Bold', icon: '💪' },
  { id: 'cinematic', name: 'Cinematic', icon: '🎬' },
  { id: 'neon', name: 'Neon', icon: '💡' },
  { id: 'fun', name: 'Fun', icon: '🎉' },
  { id: 'motivation', name: 'Motivation', icon: '🔥' },
];

// Viral hooks
const VIRAL_HOOKS = [
  { text: 'STOP SCROLLING', category: 'attention' },
  { text: 'WATCH TILL THE END', category: 'attention' },
  { text: 'READ THIS BEFORE YOU SCROLL', category: 'attention' },
  { text: 'THIS WILL CHANGE YOUR LIFE', category: 'motivation' },
  { text: 'Remember why you started.', category: 'motivation' },
  { text: 'Pain is temporary. Pride is forever.', category: 'gym' },
  { text: 'Discipline builds everything.', category: 'motivation' },
  { text: 'Nobody talks about this enough…', category: 'story' },
  { text: 'This changed everything for me.', category: 'story' },
  { text: 'Here\'s the truth they hide from you.', category: 'story' },
  { text: 'I wish someone told me this earlier…', category: 'business' },
  { text: 'Watch this before you start a business.', category: 'business' },
];

/**
 * Convert template style to CSS
 */
const styleToCSS = (style) => {
  const css = {
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight === 'normal' ? 400 :
                style.fontWeight === 'medium' ? 500 :
                style.fontWeight === 'semibold' ? 600 :
                style.fontWeight === 'bold' ? 700 : 700,
    color: style.color,
    letterSpacing: style.letterSpacing ? `${style.letterSpacing}px` : undefined,
    textTransform: style.textCase || 'none',
    fontStyle: style.italic ? 'italic' : 'normal',
    backgroundColor: style.backgroundColor || 'transparent',
    padding: style.backgroundColor ? '8px 16px' : undefined,
    borderRadius: style.backgroundColor ? '8px' : undefined,
  };
  
  // Build text shadow
  const shadows = [];
  
  if (style.outlineColor && style.outlineWidth) {
    const w = style.outlineWidth;
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

/**
 * SubtitleTemplateSelector Component
 */
const SubtitleTemplateSelector = ({ 
  selectedTemplate, 
  onSelectTemplate,
  onSelectHook,
  showHooks = true 
}) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return SUBTITLE_TEMPLATES.filter(template => {
      const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
      const matchesSearch = !searchQuery || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="sts-container">
      {/* Search */}
      <div className="sts-search">
        <FiSearch className="sts-search-icon" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sts-search-input"
        />
      </div>

      {/* Category Tabs */}
      <div className="sts-categories">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`sts-category ${activeCategory === cat.id ? 'sts-category--active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span className="sts-category-icon">{cat.icon}</span>
            <span className="sts-category-name">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="sts-templates-grid">
        {filteredTemplates.map(template => {
          const isSelected = selectedTemplate?.id === template.id;
          const previewStyle = styleToCSS(template.style);
          
          return (
            <div
              key={template.id}
              className={`sts-template-card ${isSelected ? 'sts-template-card--selected' : ''}`}
              onClick={() => onSelectTemplate(template)}
              onMouseEnter={() => setPreviewTemplate(template)}
              onMouseLeave={() => setPreviewTemplate(null)}
            >
              {/* Preview */}
              <div className="sts-template-preview">
                <div 
                  className="sts-template-preview-text"
                  style={previewStyle}
                >
                  Aa
                </div>
              </div>
              
              {/* Info */}
              <div className="sts-template-info">
                <span className="sts-template-name">{template.name}</span>
                <span className="sts-template-desc">{template.description}</span>
              </div>
              
              {/* Selected indicator */}
              {isSelected && (
                <div className="sts-template-selected">
                  <FiCheck />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Viral Hooks Section */}
      {showHooks && (
        <div className="sts-hooks-section">
          <h4 className="sts-hooks-title">
            🔥 Viral Hooks (Click to use)
          </h4>
          <div className="sts-hooks-list">
            {VIRAL_HOOKS.map((hook, index) => (
              <button
                key={index}
                className="sts-hook-chip"
                onClick={() => onSelectHook && onSelectHook(hook.text)}
              >
                {hook.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live Preview Panel */}
      {previewTemplate && (
        <div className="sts-live-preview">
          <div className="sts-live-preview-header">
            <FiEye /> Live Preview
          </div>
          <div className="sts-live-preview-phone">
            <div 
              className={`sts-live-preview-text sts-position-${previewTemplate.position}`}
              style={styleToCSS(previewTemplate.style)}
            >
              {previewTemplate.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { SUBTITLE_TEMPLATES, VIRAL_HOOKS, styleToCSS };
export default SubtitleTemplateSelector;
