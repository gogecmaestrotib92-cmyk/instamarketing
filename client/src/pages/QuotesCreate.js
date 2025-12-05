import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiMessageSquare,
  FiArrowLeft,
  FiRefreshCw,
  FiDownload,
  FiCopy,
  FiCheck,
  FiZap,
  FiEdit3,
  FiSave,
  FiType
} from 'react-icons/fi';
import api from '../services/api';
import { saveQuoteToHub } from '../services/assetService';
import './QuotesCreate.css';

const QuotesCreate = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  
  // Form state
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('');
  const [tone, setTone] = useState('inspirational');
  const [style, setStyle] = useState('one-liner');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);
  
  // UI state
  const [copiedField, setCopiedField] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedToHub, setSavedToHub] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGradient, setSelectedGradient] = useState(0);

  // Tone options
  const toneOptions = [
    { id: 'inspirational', label: 'Inspirational', emoji: '✨' },
    { id: 'philosophical', label: 'Philosophical', emoji: '🤔' },
    { id: 'motivational', label: 'Motivational', emoji: '💪' },
    { id: 'humorous', label: 'Humorous', emoji: '😄' },
    { id: 'bold', label: 'Bold & Direct', emoji: '🔥' },
    { id: 'calming', label: 'Calming', emoji: '🌊' }
  ];

  // Style options
  const styleOptions = [
    { id: 'one-liner', label: 'One-liner' },
    { id: 'two-part', label: 'Two-part' },
    { id: 'question-answer', label: 'Question & Answer' }
  ];

  // Niche suggestions
  const nicheSuggestions = [
    'Business', 'Fitness', 'Life', 'Success', 'Love', 
    'Mindfulness', 'Leadership', 'Creativity', 'Growth', 'Happiness'
  ];

  // Background gradients
  const gradients = [
    { id: 0, colors: ['#667eea', '#764ba2'], name: 'Purple Dream' },
    { id: 1, colors: ['#f093fb', '#f5576c'], name: 'Pink Sunset' },
    { id: 2, colors: ['#4facfe', '#00f2fe'], name: 'Ocean Blue' },
    { id: 3, colors: ['#43e97b', '#38f9d7'], name: 'Fresh Green' },
    { id: 4, colors: ['#fa709a', '#fee140'], name: 'Warm Glow' },
    { id: 5, colors: ['#a18cd1', '#fbc2eb'], name: 'Soft Lavender' },
    { id: 6, colors: ['#232526', '#414345'], name: 'Dark Minimal' },
    { id: 7, colors: ['#ee9ca7', '#ffdde1'], name: 'Rose Gold' }
  ];

  // Generate quote
  const generateQuote = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await api.post('/ai/generate-quote', {
        topic: topic.trim(),
        niche: niche.trim() || 'General',
        tone,
        style
      });

      if (response.data.success) {
        setQuote({
          text: response.data.quote,
          author: response.data.author || '',
          secondPart: response.data.secondPart || ''
        });
        setSavedToHub(false);
      } else {
        setError(response.data.error || 'Failed to generate quote');
      }
    } catch (err) {
      console.error('Quote generation error:', err);
      setError(err.response?.data?.error || 'Failed to generate quote. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Get full quote text
  const getFullQuoteText = () => {
    if (!quote) return '';
    let text = quote.text;
    if (quote.secondPart) text += '\n\n' + quote.secondPart;
    if (quote.author) text += '\n\n— ' + quote.author;
    return text;
  };

  // Export as image using Canvas
  const exportAsImage = useCallback(() => {
    if (!quote) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = 1080;
    const height = 1080;
    
    canvas.width = width;
    canvas.height = height;

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, gradients[selectedGradient].colors[0]);
    gradient.addColorStop(1, gradients[selectedGradient].colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Configure text
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw quote text
    const maxWidth = width - 120;
    const lineHeight = 60;
    const fontSize = 48;
    ctx.font = `italic ${fontSize}px Georgia, serif`;

    // Word wrap
    const words = quote.text.split(' ');
    const lines = [];
    let currentLine = '"';

    words.forEach((word) => {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine !== '"') {
        lines.push(currentLine);
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    });
    lines.push(currentLine.trim() + '"');

    // Add second part if exists
    if (quote.secondPart) {
      lines.push('');
      const secondWords = quote.secondPart.split(' ');
      let secondLine = '';
      secondWords.forEach((word) => {
        const testLine = secondLine + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && secondLine !== '') {
          lines.push(secondLine);
          secondLine = word + ' ';
        } else {
          secondLine = testLine;
        }
      });
      lines.push(secondLine.trim());
    }

    // Calculate starting Y position
    const totalHeight = lines.length * lineHeight;
    let startY = (height - totalHeight) / 2 - 30;

    // Draw each line
    lines.forEach((line, index) => {
      ctx.fillText(line, width / 2, startY + (index * lineHeight));
    });

    // Draw author
    if (quote.author) {
      ctx.font = '32px Georgia, serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('— ' + quote.author, width / 2, startY + (lines.length * lineHeight) + 50);
    }

    // Download
    const link = document.createElement('a');
    link.download = `quote-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [quote, selectedGradient, gradients]);

  // Save to Asset Hub
  const saveToAssetHub = async () => {
    if (!quote) return;
    
    setIsSaving(true);
    try {
      await saveQuoteToHub({
        quote: quote.text,
        author: quote.author,
        secondPart: quote.secondPart,
        topic,
        niche,
        tone,
        style,
        gradient: selectedGradient
      });
      setSavedToHub(true);
      setTimeout(() => setSavedToHub(false), 3000);
    } catch (err) {
      console.error('Save to hub failed:', err);
      setError('Failed to save to Asset Hub');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="quotes-create-page">
      <div className="quotes-create-container">
        {/* Header */}
        <header className="page-header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <FiArrowLeft />
          </button>
          <div className="header-content">
            <h1>
              <FiMessageSquare className="header-icon" />
              Create Quote
            </h1>
            <p>Generate inspirational quotes for Instagram</p>
          </div>
        </header>

        <div className="quotes-create-content">
          {/* Form Section */}
          <div className="form-section">
            <div className="form-card">
              <h3><FiEdit3 /> Quote Details</h3>
              
              {/* Topic */}
              <div className="input-group">
                <label>Topic / Theme <span className="required">*</span></label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., success, perseverance, self-love..."
                  className="topic-input"
                />
              </div>

              {/* Niche */}
              <div className="input-group">
                <label>Niche / Category</label>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g., Business, Fitness, Life..."
                />
                <div className="niche-suggestions">
                  {nicheSuggestions.map((n) => (
                    <button
                      key={n}
                      className={`niche-tag ${niche === n ? 'active' : ''}`}
                      onClick={() => setNiche(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone */}
              <div className="input-group">
                <label>Tone</label>
                <div className="tone-selector">
                  {toneOptions.map((t) => (
                    <button
                      key={t.id}
                      className={`tone-btn ${tone === t.id ? 'active' : ''}`}
                      onClick={() => setTone(t.id)}
                    >
                      <span className="tone-emoji">{t.emoji}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div className="input-group">
                <label>Quote Style</label>
                <div className="style-selector">
                  {styleOptions.map((s) => (
                    <button
                      key={s.id}
                      className={`style-btn ${style === s.id ? 'active' : ''}`}
                      onClick={() => setStyle(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button 
                className="btn-generate"
                onClick={generateQuote}
                disabled={isGenerating || !topic.trim()}
              >
                {isGenerating ? (
                  <>
                    <FiRefreshCw className="spin" />
                    Generating Quote...
                  </>
                ) : (
                  <>
                    <FiZap />
                    Generate Quote
                  </>
                )}
              </button>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Preview Section */}
          <div className="preview-section">
            {quote ? (
              <>
                {/* Quote Preview Card */}
                <div className="quote-preview-card">
                  <div className="preview-header">
                    <h3>Preview</h3>
                    <button 
                      className="btn-copy"
                      onClick={() => copyToClipboard(getFullQuoteText(), 'quote')}
                    >
                      {copiedField === 'quote' ? <FiCheck /> : <FiCopy />}
                      {copiedField === 'quote' ? 'Copied!' : 'Copy Text'}
                    </button>
                  </div>

                  {/* Quote Display */}
                  <div 
                    className="quote-display"
                    style={{
                      background: `linear-gradient(135deg, ${gradients[selectedGradient].colors[0]}, ${gradients[selectedGradient].colors[1]})`
                    }}
                  >
                    <div className="quote-content">
                      {isEditing ? (
                        <textarea
                          className="quote-edit-input"
                          value={quote.text}
                          onChange={(e) => setQuote({ ...quote, text: e.target.value })}
                          rows={4}
                        />
                      ) : (
                        <p className="quote-text">"{quote.text}"</p>
                      )}
                      
                      {quote.secondPart && (
                        isEditing ? (
                          <textarea
                            className="quote-edit-input secondary"
                            value={quote.secondPart}
                            onChange={(e) => setQuote({ ...quote, secondPart: e.target.value })}
                            rows={2}
                          />
                        ) : (
                          <p className="quote-second">{quote.secondPart}</p>
                        )
                      )}
                      
                      {quote.author && (
                        isEditing ? (
                          <input
                            className="author-edit-input"
                            value={quote.author}
                            onChange={(e) => setQuote({ ...quote, author: e.target.value })}
                            placeholder="Author name..."
                          />
                        ) : (
                          <p className="quote-author">— {quote.author}</p>
                        )
                      )}
                    </div>
                  </div>

                  {/* Edit Toggle */}
                  <button 
                    className={`btn-edit ${isEditing ? 'active' : ''}`}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <FiType />
                    {isEditing ? 'Done Editing' : 'Edit Text'}
                  </button>
                </div>

                {/* Background Selector */}
                <div className="gradient-selector-card">
                  <h4>Background Style</h4>
                  <div className="gradient-options">
                    {gradients.map((g) => (
                      <button
                        key={g.id}
                        className={`gradient-option ${selectedGradient === g.id ? 'active' : ''}`}
                        style={{
                          background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})`
                        }}
                        onClick={() => setSelectedGradient(g.id)}
                        title={g.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="preview-actions">
                  <button 
                    className="btn-regenerate"
                    onClick={generateQuote}
                    disabled={isGenerating}
                  >
                    <FiRefreshCw className={isGenerating ? 'spin' : ''} />
                    Regenerate
                  </button>
                  <button 
                    className="btn-download"
                    onClick={exportAsImage}
                  >
                    <FiDownload />
                    Download PNG
                  </button>
                  <button 
                    className="btn-save"
                    onClick={saveToAssetHub}
                    disabled={isSaving || savedToHub}
                  >
                    {savedToHub ? (
                      <>
                        <FiCheck />
                        Saved!
                      </>
                    ) : isSaving ? (
                      <>
                        <FiRefreshCw className="spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave />
                        Save to Hub
                      </>
                    )}
                  </button>
                </div>

                {/* Hidden Canvas for Export */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </>
            ) : (
              <div className="empty-preview">
                <FiMessageSquare className="empty-icon" />
                <h3>Your quote will appear here</h3>
                <p>Enter a topic and click "Generate Quote" to create an inspirational quote</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotesCreate;
