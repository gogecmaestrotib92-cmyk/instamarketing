import React, { useState } from 'react';
import { FiImage, FiZap, FiArrowLeft, FiRefreshCw, FiDownload, FiCopy } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './BusinessImage.css';

const BusinessImage = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [showAdvice, setShowAdvice] = useState(false);

  // AI advice examples for inspiration
  const aiAdviceExamples = [
    {
      category: 'Product Launch',
      examples: [
        'Minimalist product showcase with soft shadows on white marble background',
        'Premium product floating with golden light rays and luxury feel',
        'Modern tech product with futuristic neon glow and dark background'
      ]
    },
    {
      category: 'Sale & Promotion',
      examples: [
        'Bold "50% OFF" text with confetti and celebration vibes',
        'Flash sale banner with countdown timer aesthetic and urgency',
        'Seasonal discount graphic with festive colors and decorations'
      ]
    },
    {
      category: 'Brand Awareness',
      examples: [
        'Inspirational quote with elegant typography on gradient background',
        'Behind-the-scenes style image showing brand authenticity',
        'Lifestyle shot featuring product in real-world setting'
      ]
    },
    {
      category: 'Social Proof',
      examples: [
        'Customer testimonial card with star ratings and clean design',
        'Before/after comparison split image with dramatic effect',
        'User-generated content style with authentic feel'
      ]
    },
    {
      category: 'Educational',
      examples: [
        'Infographic style showing 5 tips with icons and clean layout',
        'Step-by-step tutorial visual with numbered sections',
        'Did you know fact card with eye-catching statistics'
      ]
    }
  ];

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    // TODO: Connect to actual image generation API
    await new Promise(resolve => setTimeout(resolve, 2000));
    setGeneratedImage('/api/placeholder/1024/1024');
    setIsGenerating(false);
  };

  const handleUseAdvice = (example) => {
    setPrompt(example);
    setShowAdvice(false);
  };

  const handleCopyPrompt = (example) => {
    navigator.clipboard.writeText(example);
  };

  return (
    <div className="business-image-page">
      <div className="business-image-container">
        {/* Header */}
        <div className="page-header-row">
          <button className="back-btn" onClick={() => navigate('/app/create/business')}>
            <FiArrowLeft />
            <span>Back</span>
          </button>
          <div className="page-title">
            <FiImage className="title-icon" />
            <div>
              <h1>Text to Image</h1>
              <p>Create stunning AD & stacking designs with AI</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="image-creator-section">
          {/* Prompt Input Area */}
          <div className="prompt-section">
            <label className="prompt-label">Describe your image idea</label>
            <div className="prompt-input-row">
              <textarea
                className="prompt-textarea"
                placeholder="Describe what you want to create... e.g., 'A minimalist product showcase with soft lighting, featuring a luxury watch on a marble surface with gold accents'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
              <button 
                className="ai-advice-btn"
                onClick={() => setShowAdvice(!showAdvice)}
              >
                <FiZap />
                <span>AI Advice</span>
              </button>
            </div>

            {/* AI Advice Panel */}
            {showAdvice && (
              <div className="ai-advice-panel">
                <div className="advice-header">
                  <FiZap className="advice-icon" />
                  <h3>AI Inspiration Examples</h3>
                  <p>Click on any example to use it as your prompt</p>
                </div>
                <div className="advice-categories">
                  {aiAdviceExamples.map((category, idx) => (
                    <div key={idx} className="advice-category">
                      <h4>{category.category}</h4>
                      <div className="advice-examples">
                        {category.examples.map((example, exIdx) => (
                          <div key={exIdx} className="advice-example">
                            <p>{example}</p>
                            <div className="example-actions">
                              <button 
                                className="example-btn use"
                                onClick={() => handleUseAdvice(example)}
                              >
                                Use This
                              </button>
                              <button 
                                className="example-btn copy"
                                onClick={() => handleCopyPrompt(example)}
                              >
                                <FiCopy />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button 
              className={`generate-btn ${isGenerating ? 'generating' : ''}`}
              onClick={handleGenerateImage}
              disabled={!prompt.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <FiRefreshCw className="spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FiImage />
                  <span>Generate Image</span>
                </>
              )}
            </button>
          </div>

          {/* Preview Area */}
          <div className="preview-section">
            <div className="preview-label">Preview</div>
            <div className="preview-container">
              {generatedImage ? (
                <div className="generated-preview">
                  <img src={generatedImage} alt="Generated" />
                  <div className="preview-actions">
                    <button className="preview-action-btn">
                      <FiDownload />
                      <span>Download</span>
                    </button>
                    <button className="preview-action-btn" onClick={() => setGeneratedImage(null)}>
                      <FiRefreshCw />
                      <span>Regenerate</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="preview-placeholder">
                  <FiImage className="placeholder-icon" />
                  <p>Your generated image will appear here</p>
                  <span>Enter a prompt and click Generate</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessImage;
