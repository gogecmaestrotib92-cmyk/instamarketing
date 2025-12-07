import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiPlay, FiImage, FiSquare, FiSmartphone, FiMonitor, FiMic, FiDownload, FiRefreshCw, FiZap, FiX, FiFilm, FiAlertCircle, FiCheckCircle, FiBox, FiEdit3, FiTrendingUp, FiBook, FiAward, FiHeart, FiArrowRight } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';
import { saveVideoToHub, saveImageToHub } from '../services/assetService';
import './BusinessTrending.css';

const BusinessTrending = () => {
  const navigate = useNavigate();
  
  // Current step (1, 2, or 3)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Business Info from Business Hub - REQUIRED
  const [businessInfo, setBusinessInfo] = useState(null);
  const [hasBrand, setHasBrand] = useState(false);
  
  // Step 1: Content Strategy
  const [contentPurpose, setContentPurpose] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [contentGoal, setContentGoal] = useState('');
  
  // Step 2: Style Settings
  const [selectedTemplate, setSelectedTemplate] = useState('viral-karaoke');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [backgroundType, setBackgroundType] = useState('stock-video');
  const [selectedVoice, setSelectedVoice] = useState('Rachel');
  const [selectedVoiceId, setSelectedVoiceId] = useState('21m00Tcm4TlvDq8ikWAM');
  
  // ElevenLabs state
  const [elevenLabsVoices, setElevenLabsVoices] = useState([]);
  const [elevenLabsStatus, setElevenLabsStatus] = useState({ available: false, subscription: null });
  const [voiceStyle, setVoiceStyle] = useState('energetic');
  const [playingPreview, setPlayingPreview] = useState(null);
  const [previewAudio, setPreviewAudio] = useState(null);
  
  // Step 3: Generate
  const [postTopic, setPostTopic] = useState('');
  const [useBrandContext, setUseBrandContext] = useState(true);
  
  // Pending job state for resume capability
  const [pendingJobInfo, setPendingJobInfo] = useState(null);
  
  // Load business info on mount - BRAND IS REQUIRED
  useEffect(() => {
    const saved = localStorage.getItem('businessInfo');
    if (saved) {
      const parsed = JSON.parse(saved);
      setBusinessInfo(parsed);
      // Check for meaningful brand data
      const hasData = parsed.businessName && (parsed.description || parsed.industry || (parsed.products && parsed.products.length > 0));
      setHasBrand(hasData);
    } else {
      setHasBrand(false);
    }
    
    // Load ElevenLabs voices
    loadElevenLabsVoices();
    
    // Check for pending premium jobs and resume polling
    // Define inline to avoid ESLint dependency warning
    const checkPendingJobs = async () => {
      try {
        const pendingJob = localStorage.getItem('pendingPremiumJob');
        if (!pendingJob) {
          setPendingJobInfo(null);
          return;
        }
        
        const { jobId, startedAt, metadata } = JSON.parse(pendingJob);
        console.log('🔄 Found pending premium job:', jobId);
        
        // Check if job is too old (more than 30 minutes)
        const jobAge = Date.now() - new Date(startedAt).getTime();
        if (jobAge > 30 * 60 * 1000) {
          console.log('⏰ Pending job too old, removing');
          localStorage.removeItem('pendingPremiumJob');
          setPendingJobInfo(null);
          return;
        }
        
        // Poll for status
        const statusResponse = await fetch('/api/ai/video/premium-job-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId })
        });
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'done' && statusData.videoUrl) {
          console.log('✅ Pending premium job completed! Saving to Asset Hub...');
          
          // Save to Asset Hub
          saveVideoToHub({
            name: metadata?.name || 'Premium AI Video',
            url: statusData.videoUrl,
            caption: metadata?.caption || 'Premium AI Generated Video',
            tags: metadata?.tags || ['premium-ai', 'multi-scene'],
            source: 'BusinessTrending-Premium',
            metadata: { ...metadata, jobId, voiceoverScript: statusData.voiceoverScript }
          });
          
          // Clear pending job
          localStorage.removeItem('pendingPremiumJob');
          setPendingJobInfo(null);
          console.log('✅ Auto-saved completed premium video to Asset Hub');
          
          // Show completion message
          setGenerationStep('');
          setGeneratedResult({
            id: Date.now().toString(),
            type: 'premium-ai-video',
            name: metadata?.name || 'Premium AI Video',
            script: statusData.voiceoverScript,
            audioUrl: statusData.audioUrl,
            composedVideoUrl: statusData.videoUrl,
            backgroundType: 'premium-ai',
            ttsProvider: 'ElevenLabs',
            createdAt: new Date().toISOString(),
            metadata: { ...metadata, jobId },
            instructions: '🎬 Premium AI video ready! (Resumed from background)'
          });
          
        } else if (statusData.status === 'failed') {
          console.log('❌ Pending job failed:', statusData.error);
          localStorage.removeItem('pendingPremiumJob');
          setPendingJobInfo(null);
          setGenerationError(`Previous job failed: ${statusData.error}`);
          
        } else if (statusData.status === 'pending' || statusData.status === 'starting') {
          // Job exists but hasn't started/stalled - show banner for manual resume
          console.log('🔄 Job pending/starting, showing resume banner...');
          const elapsedMin = Math.floor(jobAge / 60000);
          setPendingJobInfo({
            jobId,
            startedAt,
            metadata,
            status: statusData.status,
            statusMessage: `Job created ${elapsedMin} min ago - needs processing`,
            canResume: true
          });
          
        } else if (statusData.status && statusData.status !== 'not_found') {
          // Still processing - show banner with current status
          console.log('⏳ Premium job still processing:', statusData.statusMessage);
          const elapsedMin = Math.floor(jobAge / 60000);
          setPendingJobInfo({
            jobId,
            startedAt,
            metadata,
            status: statusData.status,
            statusMessage: statusData.statusMessage || `Processing... (${elapsedMin} min)`,
            progress: statusData.progress || lastProgress,
            canResume: false
          });
          
          // Auto-poll for updates
          setGenerationStep(`🔄 Resuming: ${statusData.statusMessage || 'Processing...'}`);
          setIsGenerating(true);
          resumePremiumJobPolling(jobId, metadata);
          
        } else {
          // Job not found - clean up
          localStorage.removeItem('pendingPremiumJob');
          setPendingJobInfo(null);
        }
      } catch (err) {
        console.warn('Failed to check pending premium jobs:', err.message);
        // Show banner with error for manual retry
        const pendingJob = localStorage.getItem('pendingPremiumJob');
        if (pendingJob) {
          const { jobId, startedAt, metadata } = JSON.parse(pendingJob);
          setPendingJobInfo({
            jobId,
            startedAt,
            metadata,
            status: 'unknown',
            statusMessage: 'Could not check status - click Resume to retry',
            canResume: true
          });
        }
      }
    };
    
    checkPendingJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Rebuild topic when brand context toggle changes (only if on step 3)
  useEffect(() => {
    if (currentStep === 3 && contentPurpose) {
      // Rebuild topic with new brand context setting
      const product = getSelectedProductDetails();
      const goal = contentGoals.find(g => g.id === contentGoal);
      
      let topic = '';
      
      if (useBrandContext && businessInfo?.businessName) {
        topic += `For ${businessInfo.businessName}`;
        if (businessInfo.industry) topic += ` (${businessInfo.industry})`;
        topic += ': ';
      }
      
      switch (contentPurpose) {
        case 'tips':
          topic += `Share expert tips about ${customTopic || (useBrandContext ? product?.name : null) || (useBrandContext ? businessInfo?.industry : null) || 'your expertise'}`;
          break;
        case 'behind-scenes':
          topic += `Show behind the scenes of ${customTopic || 'how we work'}`;
          break;
        case 'product-feature':
          topic += `Highlight ${(useBrandContext ? product?.name : null) || customTopic || 'our product'}: ${(useBrandContext ? product?.description : null) || 'key benefits and features'}`;
          break;
        case 'customer-story':
          topic += `Share a customer success story about ${(useBrandContext ? product?.name : null) || customTopic || 'results achieved'}`;
          break;
        case 'industry-news':
          topic += `Share insights about ${customTopic || (useBrandContext ? businessInfo?.industry : null) || 'industry trends'}`;
          break;
        case 'motivation':
          topic += `Motivational content for ${(useBrandContext ? businessInfo?.targetAudience : null) || 'our audience'}: ${customTopic || 'inspirational message'}`;
          break;
        default:
          topic += customTopic || 'engaging content';
      }
      
      if (goal) {
        topic += `. Goal: ${goal.description}`;
      }
      
      if (useBrandContext && businessInfo?.brandVoice) {
        topic += `. Tone: ${businessInfo.brandVoice}`;
      }
      
      setPostTopic(topic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useBrandContext]);
  
  // Resume polling for a pending premium job
  const resumePremiumJobPolling = async (jobId, metadata) => {
    let attempts = 0;
    const maxAttempts = 120;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
      
      try {
        const statusResponse = await fetch('/api/ai/video/premium-job-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId })
        });
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'done' && statusData.videoUrl) {
          // Save to Asset Hub
          saveVideoToHub({
            name: metadata?.name || 'Premium AI Video',
            url: statusData.videoUrl,
            caption: metadata?.caption || 'Premium AI Generated Video',
            tags: metadata?.tags || ['premium-ai', 'multi-scene'],
            source: 'BusinessTrending-Premium',
            metadata: { ...metadata, jobId, voiceoverScript: statusData.voiceoverScript }
          });
          
          localStorage.removeItem('pendingPremiumJob');
          setIsGenerating(false);
          setGenerationStep('');
          console.log('✅ Resumed job saved to Asset Hub');
          
          // Show success notification
          alert('Your Premium AI video is ready! Check Asset Hub to view it.');
          return;
          
        } else if (statusData.status === 'failed') {
          localStorage.removeItem('pendingPremiumJob');
          setIsGenerating(false);
          setGenerationStep('');
          console.log('❌ Resumed job failed');
          return;
        }
        
        // Update progress
        const statusMsg = statusData.statusMessage || `Processing... (${statusData.status})`;
        setGenerationStep(`🔄 ${statusMsg} ${statusData.progress ? `(${statusData.progress}%)` : ''}`);
        
      } catch (pollErr) {
        console.warn('Resume poll error:', pollErr.message);
      }
    }
    
    // Timed out
    setIsGenerating(false);
    setGenerationStep('');
  };
  
  // Manual resume for pending jobs (triggered by user clicking Resume button)
  const handleManualResume = async () => {
    if (!pendingJobInfo?.jobId) return;
    
    const { jobId, metadata } = pendingJobInfo;
    console.log('🔄 Manual resume triggered for job:', jobId);
    
    setIsGenerating(true);
    setPendingJobInfo(null); // Hide the banner
    setGenerationStep('🔄 Resuming job - checking status...');
    
    try {
      // First check current status
      const statusResponse = await fetch('/api/ai/video/premium-job-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });
      const statusData = await statusResponse.json();
      
      if (statusData.status === 'done' && statusData.videoUrl) {
        // Already done! Save it
        saveVideoToHub({
          name: metadata?.name || 'Premium AI Video',
          url: statusData.videoUrl,
          caption: metadata?.caption || 'Premium AI Generated Video',
          tags: metadata?.tags || ['premium-ai', 'multi-scene'],
          source: 'BusinessTrending-Premium',
          metadata: { ...metadata, jobId, voiceoverScript: statusData.voiceoverScript }
        });
        
        localStorage.removeItem('pendingPremiumJob');
        setIsGenerating(false);
        setGenerationStep('');
        setGeneratedResult({
          id: Date.now().toString(),
          type: 'premium-ai-video',
          name: metadata?.name || 'Premium AI Video',
          script: statusData.voiceoverScript,
          audioUrl: statusData.audioUrl,
          composedVideoUrl: statusData.videoUrl,
          backgroundType: 'premium-ai',
          ttsProvider: 'ElevenLabs',
          createdAt: new Date().toISOString(),
          metadata: { ...metadata, jobId },
          instructions: '🎬 Premium AI video ready!'
        });
        return;
      }
      
      if (statusData.status === 'failed') {
        localStorage.removeItem('pendingPremiumJob');
        setIsGenerating(false);
        setGenerationError(`Job failed: ${statusData.error}`);
        return;
      }
      
      // If pending/starting, trigger processing again
      if (statusData.status === 'pending' || statusData.status === 'starting') {
        setGenerationStep('🚀 Triggering processing...');
        
        // Fire process request (may timeout, that's OK)
        fetch('/api/ai/video/premium-process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId })
        }).catch(() => console.log('Process request sent'));
        
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Start polling
      setGenerationStep(`🔄 ${statusData.statusMessage || 'Processing...'}`);
      resumePremiumJobPolling(jobId, metadata);
      
    } catch (err) {
      console.error('Manual resume failed:', err);
      setIsGenerating(false);
      setGenerationError(`Resume failed: ${err.message}`);
    }
  };
  
  // Cancel/clear a pending job
  const handleCancelPendingJob = () => {
    localStorage.removeItem('pendingPremiumJob');
    setPendingJobInfo(null);
    setIsGenerating(false);
    setGenerationStep('');
    console.log('🗑️ Pending job cancelled');
  };
  
  // Load ElevenLabs voices and status
  const loadElevenLabsVoices = async () => {
    try {
      // Check ElevenLabs status
      const statusRes = await fetch('/api/ai/elevenlabs/status');
      const statusData = await statusRes.json();
      setElevenLabsStatus(statusData);
      
      // Load recommended voices
      const voicesRes = await fetch('/api/ai/elevenlabs/voices/recommended');
      const voicesData = await voicesRes.json();
      
      if (voicesData.success && voicesData.voices) {
        setElevenLabsVoices(voicesData.voices);
        // Set default voice if we have voices
        if (voicesData.voices.length > 0) {
          const defaultVoice = voicesData.voices.find(v => v.name === 'Rachel') || voicesData.voices[0];
          setSelectedVoice(defaultVoice.name);
          setSelectedVoiceId(defaultVoice.id);
          setVoiceStyle(defaultVoice.style || 'conversational');
        }
      }
    } catch (error) {
      console.log('ElevenLabs not available:', error.message);
    }
  };
  
  // Play voice preview
  const playVoicePreview = (voice) => {
    // Stop any currently playing preview
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
    }
    
    if (voice.previewUrl) {
      const audio = new Audio(voice.previewUrl);
      setPreviewAudio(audio);
      setPlayingPreview(voice.id);
      
      audio.play().catch(err => {
        console.log('Preview play failed:', err);
        setPlayingPreview(null);
      });
      
      audio.onended = () => {
        setPlayingPreview(null);
      };
    }
  };
  
  // Stop voice preview
  const stopVoicePreview = () => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
    }
    setPlayingPreview(null);
  };
  
  // Content purpose types for brand content
  const contentPurposes = [
    { 
      id: 'tips', 
      label: 'Tips & How-To', 
      icon: FiBook, 
      description: 'Share expertise from your industry',
      color: '#3b82f6'
    },
    { 
      id: 'behind-scenes', 
      label: 'Behind the Scenes', 
      icon: FiFilm, 
      description: 'Show your brand process',
      color: '#ec4899'
    },
    { 
      id: 'product-feature', 
      label: 'Product Feature', 
      icon: FiBox, 
      description: 'Highlight benefits & uses',
      color: '#10b981'
    },
    { 
      id: 'customer-story', 
      label: 'Customer Success', 
      icon: FiHeart, 
      description: 'Share customer wins',
      color: '#f59e0b'
    },
    { 
      id: 'industry-news', 
      label: 'Industry Insights', 
      icon: FiTrendingUp, 
      description: 'Share relevant news & trends',
      color: '#8b5cf6'
    },
    { 
      id: 'motivation', 
      label: 'Motivational', 
      icon: FiAward, 
      description: 'Inspire your audience',
      color: '#ef4444'
    },
  ];
  
  // Content goals
  const contentGoals = [
    { id: 'educate', label: 'Educate', description: 'Teach something valuable' },
    { id: 'entertain', label: 'Entertain', description: 'Make them smile' },
    { id: 'inspire', label: 'Inspire', description: 'Motivate action' },
    { id: 'promote', label: 'Soft Sell', description: 'Subtle promotion' },
    { id: 'engage', label: 'Drive Engagement', description: 'Get comments/shares' },
  ];
  
  // AI Advice state
  const [showAdvice, setShowAdvice] = useState(false);
  const [aiAdvice, setAiAdvice] = useState([]);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [generatedResult, setGeneratedResult] = useState(null);
  const [generationError, setGenerationError] = useState(null);

  // Template options (simplified from subtitleTemplates)
  const templates = [
    { id: 'viral-karaoke', name: 'Karaoke Highlight', preview: 'Word by word highlight', color: '#FFD700' },
    { id: 'viral-tiktok-caption', name: 'TikTok Caption', preview: 'Clean auto caption look', color: '#FFFFFF' },
    { id: 'viral-bold-top', name: 'Bold Attention', preview: 'Big bold hook style', color: '#FFFFFF' },
    { id: 'viral-motivation-center', name: 'Motivational', preview: 'Elegant centered quote', color: '#FFFFFF' },
    { id: 'viral-netflix', name: 'Netflix Style', preview: 'Yellow subtitle', color: '#F1C40F' },
    { id: 'viral-mrbeast', name: 'MrBeast Style', preview: 'Bold with thick stroke', color: '#FFFFFF' },
    { id: 'neon-pink', name: 'Neon Pink', preview: 'Glowing neon effect', color: '#FF10F0' },
    { id: 'viral-story-yellow', name: 'Story Yellow', preview: 'Emotional storytelling', color: '#FFD700' },
  ];

  // Aspect ratio options
  const aspectRatios = [
    { id: '9:16', label: '9:16', icon: FiSmartphone, description: 'Story/Reel' },
    { id: '1:1', label: '1:1', icon: FiSquare, description: 'Square' },
    { id: '16:9', label: '16:9', icon: FiMonitor, description: 'Landscape' },
  ];

  // Background types
  const backgroundTypes = [
    { id: 'stock-video', label: 'Stock Videos', icon: FiFilm, description: 'Auto-matched clips', recommended: true },
    { id: 'ai-video', label: 'AI Video', icon: FiZap, description: 'Single AI scene (5s)' },
    { id: 'premium-ai', label: 'Premium AI', icon: FiZap, description: 'Multi-scene + voice', premium: true },
    { id: 'ai-images', label: 'AI Background', icon: FiImage, description: 'AI-generated visuals' },
  ];

  // Fallback voice options (used when API is not available)
  const fallbackVoiceOptions = [
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', style: 'conversational', emoji: '👩', description: 'Warm, friendly female voice - ideal for social media', category: 'premade' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', style: 'professional', emoji: '👩‍💼', description: 'Clear, professional female voice - great for business content', category: 'premade' },
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', style: 'narrator', emoji: '👨', description: 'Deep, authoritative male voice - perfect for narration', category: 'premade' },
    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', style: 'energetic', emoji: '🎤', description: 'Energetic young female voice - great for exciting content', category: 'premade' },
    { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', style: 'dynamic', emoji: '🧑', description: 'Dynamic young male voice - energetic and engaging', category: 'premade' },
    { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', style: 'luxury', emoji: '🎩', description: 'Deep, rich male voice - great for luxury brands', category: 'premade' },
    { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', style: 'youthful', emoji: '👧', description: 'Youthful female voice - perfect for Gen Z content', category: 'premade' },
    { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', style: 'british', emoji: '🎭', description: 'British male voice - sophisticated and refined', category: 'premade' },
  ];
  
  // Voice styles for ElevenLabs
  const voiceStyles = [
    { id: 'energetic', label: 'Energetic', description: 'High energy, exciting' },
    { id: 'conversational', label: 'Conversational', description: 'Natural, casual' },
    { id: 'professional', label: 'Professional', description: 'Clear, business-like' },
    { id: 'dramatic', label: 'Dramatic', description: 'Cinematic feel' },
    { id: 'calm', label: 'Calm', description: 'Relaxed, soothing' },
    { id: 'narrator', label: 'Narrator', description: 'Documentary style' },
  ];
  
  // Get available voices (API or fallback)
  const getAvailableVoices = () => {
    return elevenLabsVoices.length > 0 ? elevenLabsVoices : fallbackVoiceOptions;
  };

  // Voice style mapping based on selected voice
  const getVoiceStyle = () => {
    return voiceStyle || 'energetic';
  };
  
  // Get voice ID from name
  const getVoiceId = () => {
    return selectedVoiceId || '21m00Tcm4TlvDq8ikWAM'; // Default to Rachel
  };
  
  // Select a voice
  const selectVoice = (voice) => {
    setSelectedVoice(voice.name);
    setSelectedVoiceId(voice.id);
    if (voice.style) {
      setVoiceStyle(voice.style);
    }
  };
  
  // Get selected product details
  const getSelectedProductDetails = () => {
    if (selectedProduct && businessInfo?.products) {
      return businessInfo.products.find(p => p.name === selectedProduct);
    }
    return null;
  };
  
  // Build brand-focused content topic (respects useBrandContext toggle)
  const buildBrandTopic = (includeBrand = true) => {
    const product = getSelectedProductDetails();
    const goal = contentGoals.find(g => g.id === contentGoal);
    
    let topic = '';
    
    // Only add brand context if includeBrand is true
    if (includeBrand && businessInfo?.businessName) {
      topic += `For ${businessInfo.businessName}`;
      if (businessInfo.industry) topic += ` (${businessInfo.industry})`;
      topic += ': ';
    }
    
    // Add purpose-specific context
    switch (contentPurpose) {
      case 'tips':
        topic += `Share expert tips about ${customTopic || (includeBrand ? product?.name : null) || (includeBrand ? businessInfo?.industry : null) || 'your expertise'}`;
        break;
      case 'behind-scenes':
        topic += `Show behind the scenes of ${customTopic || 'how we work'}`;
        break;
      case 'product-feature':
        topic += `Highlight ${(includeBrand ? product?.name : null) || customTopic || 'our product'}: ${(includeBrand ? product?.description : null) || 'key benefits and features'}`;
        break;
      case 'customer-story':
        topic += `Share a customer success story about ${(includeBrand ? product?.name : null) || customTopic || 'results achieved'}`;
        break;
      case 'industry-news':
        topic += `Share insights about ${customTopic || (includeBrand ? businessInfo?.industry : null) || 'industry trends'}`;
        break;
      case 'motivation':
        topic += `Motivational content for ${(includeBrand ? businessInfo?.targetAudience : null) || 'our audience'}: ${customTopic || 'inspirational message'}`;
        break;
      default:
        topic += customTopic || 'engaging content';
    }
    
    // Add goal context
    if (goal) {
      topic += `. Goal: ${goal.description}`;
    }
    
    // Add brand voice only if including brand
    if (includeBrand && businessInfo?.brandVoice) {
      topic += `. Tone: ${businessInfo.brandVoice}`;
    }
    
    return topic;
  };

  // Navigation
  const handleNext = () => {
    if (currentStep < 3) {
      // Build the topic when moving to step 3
      if (currentStep === 2) {
        setPostTopic(buildBrandTopic());
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/dashboard/business/create');
    }
  };

  // Check if can proceed to next step
  const canProceedStep1 = contentPurpose && (selectedProduct || customTopic.trim());
  const canProceedStep2 = selectedTemplate && aspectRatio && selectedVoice;

  // Generate AI Advice based on user's topic and business info
  const generateAIAdvice = async () => {
    setIsLoadingAdvice(true);
    setShowAdvice(true);
    
    try {
      const purpose = contentPurposes.find(p => p.id === contentPurpose);
      const product = getSelectedProductDetails();
      
      // Build context from business info
      let businessContext = '';
      if (businessInfo) {
        const parts = [];
        if (businessInfo.businessName) parts.push(`Business: ${businessInfo.businessName}`);
        if (businessInfo.industry) parts.push(`Industry: ${businessInfo.industry}`);
        if (businessInfo.brandVoice) parts.push(`Brand voice: ${businessInfo.brandVoice}`);
        if (businessInfo.targetAudience) parts.push(`Target audience: ${businessInfo.targetAudience.substring(0, 100)}`);
        if (product) parts.push(`Product focus: ${product.name} - ${product.description || ''}`);
        if (parts.length > 0) {
          businessContext = `\n\nBusiness Context:\n${parts.join('\n')}`;
        }
      }
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate 6 viral short-form video script ideas for "${purpose?.label || 'content'}" content.${businessContext}

Topic context: ${customTopic || product?.name || businessInfo?.industry || 'general'}

Each should be catchy, engaging, and perfect for Instagram/TikTok.

For each suggestion, provide:
1. A hook (attention-grabbing first line)
2. Brief description of the content flow

Format as JSON array:
[
  {
    "title": "Short catchy title",
    "hook": "The opening hook line",
    "description": "Brief content flow description"
  }
]

Focus on trending formats, emotional hooks, and viral potential. Make them authentic to the brand.

IMPORTANT: Always respond in English regardless of business name or context.`,
          systemPrompt: 'You are a viral content strategist for brands. Return ONLY valid JSON array, no markdown or extra text. Always respond in English.'
        })
      });

      const data = await response.json();
      
      if (data.response) {
        try {
          let jsonStr = data.response.trim();
          // Remove markdown code blocks
          if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '');
          }
          // Try to extract JSON array if there's extra text
          const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            jsonStr = arrayMatch[0];
          }
          // Fix common JSON issues: trailing commas, single quotes
          jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1'); // Remove trailing commas
          const suggestions = JSON.parse(jsonStr);
          setAiAdvice(suggestions);
        } catch (parseError) {
          console.error('Failed to parse AI advice:', parseError);
          const topic = customTopic || product?.name || 'your expertise';
          setAiAdvice([
            { title: `${purpose?.label || 'Content'}: ${topic}`, hook: `Here's what nobody tells you about ${topic}...`, description: 'Eye-opening insights that challenge common beliefs' },
            { title: `3 ${topic} secrets`, hook: `Stop scrolling! These 3 tips changed everything...`, description: 'Quick, actionable tips with visual examples' },
            { title: `${topic} mistakes`, hook: `You're making these mistakes every day...`, description: 'Common errors and how to fix them instantly' },
          ]);
        }
      }
    } catch (error) {
      console.error('AI advice error:', error);
      setAiAdvice([
        { title: `Viral Tips`, hook: `Here's what nobody tells you...`, description: 'Eye-opening insights' },
        { title: `3 Secrets`, hook: `Stop scrolling! These tips changed everything...`, description: 'Quick, actionable tips' },
        { title: `Common Mistakes`, hook: `You're making these mistakes every day...`, description: 'Common errors and fixes' },
      ]);
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  // Apply AI suggestion
  const applyAdviceSuggestion = (suggestion) => {
    setCustomTopic(`${suggestion.hook} ${suggestion.description}`);
    setShowAdvice(false);
  };

  // Build AI video prompt from brand context
  const buildAIVideoPrompt = () => {
    const product = getSelectedProductDetails();
    
    // Start with the actual topic/script content
    let prompt = postTopic ? `${postTopic}. ` : '';
    
    // Only add brand context if toggle is enabled
    if (useBrandContext) {
      // Add business context
      if (businessInfo?.businessName) {
        prompt += `For ${businessInfo.businessName}. `;
      }
      
      // Add product context if available
      if (product?.name) {
        prompt += `Featuring ${product.name}. `;
      }
    }
    
    // Add scene style based on content purpose
    switch (contentPurpose) {
      case 'tips':
        prompt += `Educational style, clean modern setting, professional atmosphere. `;
        break;
      case 'behind-scenes':
        prompt += `Behind the scenes style, workspace view, authentic creative process. `;
        break;
      case 'product-feature':
        prompt += `Product showcase style, elegant presentation, premium quality visuals. `;
        break;
      case 'customer-story':
        prompt += `Testimonial style, positive happy atmosphere, success story mood. `;
        break;
      case 'industry-news':
        prompt += `News style, professional informative setting. `;
        break;
      case 'motivation':
        prompt += `Inspirational style, uplifting visuals, motivational cinematic feel. `;
        break;
      default:
        prompt += `Professional brand content style. `;
    }
    
    // Add industry/brand styling context only if toggle is enabled
    if (useBrandContext) {
      // Add industry context
      if (businessInfo?.industry) {
        prompt += `${businessInfo.industry} industry setting. `;
      }
      
      // Add brand colors if available
      if (businessInfo?.brandColors?.length > 0) {
        prompt += `Color palette: ${businessInfo.brandColors.join(', ')}. `;
      }
    }
    
    // Quality modifiers
    prompt += `Cinematic quality, smooth motion, professional lighting, high resolution. `;
    
    // No text in video (AI video generators struggle with text)
    prompt += `No text, no logos, no watermarks in the video.`;
    
    console.log('📝 Built AI video prompt:', prompt);
    return prompt;
  };

  const handleGenerate = async () => {
    if (!postTopic.trim()) return;
    
    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedResult(null);
    
    try {
      // Use job-based generation for stock videos
      if (backgroundType === 'stock-video') {
        setGenerationStep('Generating brand content video...');
        console.log('🎬 Creating video generation job');
        
        // Build enhanced topic with brand context
        const enhancedTopic = postTopic;
        
        const response = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: enhancedTopic,
            contentType: contentPurpose,
            targetDuration: 15,
            voiceId: getVoiceId(),
            businessInfo: businessInfo, // Pass full brand context
            forceStockVideo: true // User selected stock video background
          })
        });
        
        const data = await response.json();
        
        if (!response.ok || data.error || data.status === 'failed') {
          throw new Error(data.error || 'Failed to generate video');
        }
        
        console.log('📦 Job response:', data);
        
        // If job needs polling (isProductVideo), poll for completion
        let finalData = data;
        if (data.isProductVideo || data.status === 'pending') {
          console.log('⏳ Polling for job completion...');
          setGenerationStep('Processing video... (this may take 1-2 minutes)');
          
          // Trigger processing
          try {
            await fetch(`/api/jobs/${data.jobId}/process`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
          } catch (triggerErr) {
            console.log('Process trigger sent (may timeout, polling will catch result)');
          }
          
          // Poll for completion
          const maxAttempts = 150; // 5 minutes max (AI video can take 5-10 min)
          let attempts = 0;
          let lastStatus = '';
          let waitingForAiCount = 0;
          
          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            attempts++;
            
            const pollRes = await fetch(`/api/jobs/${data.jobId}`);
            const pollData = await pollRes.json();
            
            console.log(`📊 Poll ${attempts}:`, pollData.status, pollData.progress);
            
            // Better status messages
            if (pollData.status === 'waiting_for_ai') {
              waitingForAiCount++;
              const aiMinutes = Math.floor(waitingForAiCount * 2 / 60);
              const aiSeconds = (waitingForAiCount * 2) % 60;
              setGenerationStep(`🤖 AI generating videos... ${aiMinutes}:${aiSeconds.toString().padStart(2, '0')} (can take 5-10 min)`);
              
              // Every 30 seconds, trigger a check on pending predictions
              if (waitingForAiCount % 15 === 0) {
                console.log('🔄 Triggering AI status check...');
                try {
                  await fetch(`/api/jobs/${data.jobId}/check-ai`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                  });
                } catch (e) {
                  console.log('AI check triggered');
                }
              }
            } else {
              setGenerationStep(`Processing... ${pollData.progress || 0}%`);
            }
            
            lastStatus = pollData.status;
            
            if (pollData.status === 'done') {
              finalData = {
                ...data,
                videoUrl: pollData.videoUrl,
                audioUrl: pollData.audioUrl,
                status: 'done'
              };
              break;
            } else if (pollData.status === 'failed') {
              throw new Error(pollData.error || 'Video generation failed');
            }
          }
          
          if (finalData.status !== 'done' && !finalData.videoUrl) {
            throw new Error(`Video generation timed out (status: ${lastStatus}). AI videos can take 5-10 minutes - please try again or use Stock Video option.`);
          }
        }
        
        console.log('✅ Video generated:', finalData);
        
        // Build result
        const purpose = contentPurposes.find(p => p.id === contentPurpose);
        const product = getSelectedProductDetails();
        
        const result = {
          id: Date.now().toString(),
          type: 'voiceover-video',
          name: `${purpose?.label || 'Content'} - ${product?.name || businessInfo?.businessName || 'Brand Video'}`,
          script: null,
          audioUrl: finalData.audioUrl,
          backgroundUrl: null,
          composedVideoUrl: finalData.videoUrl,
          backgroundType: 'stock-video',
          template: selectedTemplate,
          aspectRatio: aspectRatio,
          contentType: contentPurpose,
          ttsProvider: 'ElevenLabs',
          createdAt: new Date().toISOString(),
          metadata: {
            postTopic,
            contentPurpose,
            template: selectedTemplate,
            aspectRatio,
            backgroundType: 'stock-video',
            jobId: finalData.jobId,
            businessName: businessInfo?.businessName,
            productName: product?.name
          },
          instructions: '✅ Your brand content video is ready! Subtitles are synced to voiceover.'
        };
        
        setGeneratedResult(result);
        
        // Auto-save to Asset Hub
        try {
          saveVideoToHub({
            name: result.name,
            url: finalData.videoUrl,
            caption: postTopic.substring(0, 100),
            tags: [contentPurpose, 'voiceover', 'brand-content', businessInfo?.industry].filter(Boolean),
            source: 'BusinessTrending',
            metadata: result.metadata
          });
          console.log('✅ Auto-saved to Asset Hub');
        } catch (saveError) {
          console.error('Failed to save to Asset Hub:', saveError);
        }
        
        setGenerationStep('');
        return;
      }
      
      // AI Video Generation with Replicate
      if (backgroundType === 'ai-video') {
        setGenerationStep('🎬 Generating AI video... (this may take 1-2 minutes)');
        console.log('🎬 Starting AI video generation with Replicate');
        
        // Step 1: Generate voiceover first
        setGenerationStep('🎙️ Generating AI voiceover...');
        
        let voiceoverData = null;
        try {
          const elevenLabsResponse = await fetch('/api/ai/elevenlabs/full-voiceover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic: postTopic,
              duration: 9, // Match Luma Ray video duration
              voiceId: getVoiceId(),
              voiceStyle: getVoiceStyle()
            })
          });
          
          const elevenLabsData = await elevenLabsResponse.json();
          
          if (elevenLabsResponse.ok && !elevenLabsData.error && elevenLabsData.audioUrl) {
            voiceoverData = elevenLabsData;
            console.log('✅ Voiceover generated:', voiceoverData.audioUrl);
          }
        } catch (elevenLabsError) {
          console.warn('ElevenLabs failed:', elevenLabsError);
        }
        
        if (!voiceoverData) {
          // Fallback to Google TTS
          const googleResponse = await fetch('/api/ai/full-voiceover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic: postTopic,
              duration: 9,
              voiceStyle: getVoiceStyle()
            })
          });
          
          voiceoverData = await googleResponse.json();
          
          if (!googleResponse.ok || voiceoverData.error) {
            throw new Error(voiceoverData.error || 'Failed to generate voiceover');
          }
        }
        
        // Step 2: Generate AI video with smart image-first pipeline
        setGenerationStep('🎨 Creating AI visual + animation... (2-3 minutes)');
        
        const videoPrompt = buildAIVideoPrompt();
        console.log('🎬 AI Video context:', videoPrompt);
        
        // Use smart pipeline: GPT prompt optimization → FLUX image → Kling animation
        const videoResponse = await fetch('/api/ai/video/generate-smart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: videoPrompt,
            businessName: businessInfo?.businessName,
            industry: businessInfo?.industry,
            contentPurpose: contentPurpose,
            duration: 5,
            aspectRatio: aspectRatio
          })
        });
        
        const videoData = await videoResponse.json();
        
        if (!videoResponse.ok || videoData.error) {
          throw new Error(videoData.error || 'Failed to generate AI video');
        }
        
        console.log('✅ AI Video generated:', videoData.videoUrl);
        console.log('🖼️ Base image (FLUX):', videoData.imageUrl);
        console.log('📝 Image prompt used:', videoData.imagePrompt);
        console.log('🎬 Motion prompt:', videoData.motionPrompt);
        console.log('🔧 Pipeline:', videoData.pipeline);
        console.log('📊 Debug info:', videoData.debug);
        
        // Build result - AI video + voiceover (no composition for now)
        const purpose = contentPurposes.find(p => p.id === contentPurpose);
        const product = getSelectedProductDetails();
        
        const result = {
          id: Date.now().toString(),
          type: 'ai-video',
          name: `${purpose?.label || 'Content'} - ${product?.name || businessInfo?.businessName || 'AI Video'}`,
          script: voiceoverData.script,
          audioUrl: voiceoverData.audioUrl,
          backgroundUrl: videoData.videoUrl,
          composedVideoUrl: null, // Separate video + audio for now
          backgroundType: 'ai-video',
          template: selectedTemplate,
          aspectRatio: aspectRatio,
          contentType: contentPurpose,
          ttsProvider: 'ElevenLabs',
          createdAt: new Date().toISOString(),
          metadata: {
            postTopic,
            contentPurpose,
            template: selectedTemplate,
            aspectRatio,
            backgroundType: 'ai-video',
            aiVideoPrompt: videoPrompt,
            imagePrompt: videoData.imagePrompt,  // GPT-optimized visual prompt
            motionPrompt: videoData.motionPrompt, // Kling animation prompt
            baseImageUrl: videoData.imageUrl,    // FLUX-generated base image
            pipeline: videoData.pipeline || 'image-first',
            businessName: businessInfo?.businessName,
            productName: product?.name
          },
          instructions: '🎬 AI video generated with smart pipeline! FLUX image → Kling animation. Download both files and combine in your editor, or use the video as a silent background.'
        };
        
        setGeneratedResult(result);
        
        // Auto-save video to Asset Hub
        try {
          saveVideoToHub({
            name: result.name,
            url: videoData.videoUrl,
            caption: `AI-generated: ${postTopic.substring(0, 80)}`,
            tags: [contentPurpose, 'ai-video', 'brand-content', 'smart-pipeline', businessInfo?.industry].filter(Boolean),
            source: 'BusinessTrending-AI-Smart',
            metadata: result.metadata
          });
          console.log('✅ AI Video auto-saved to Asset Hub');
          
          // Also save the FLUX base image to Asset Hub (useful for reuse/editing)
          if (videoData.imageUrl) {
            saveImageToHub({
              name: `${result.name} - Base Frame`,
              url: videoData.imageUrl,
              caption: videoData.imagePrompt?.substring(0, 100) || `Base frame for: ${postTopic.substring(0, 60)}`,
              tags: [contentPurpose, 'ai-image', 'flux', 'base-frame', 'smart-pipeline', businessInfo?.industry].filter(Boolean),
              source: 'BusinessTrending-FLUX',
              metadata: {
                postTopic,
                contentPurpose,
                imagePrompt: videoData.imagePrompt,
                pipeline: 'smart-flux-kling',
                linkedVideoUrl: videoData.videoUrl,
                businessName: businessInfo?.businessName,
                productName: product?.name
              }
            });
            console.log('✅ FLUX base image auto-saved to Asset Hub');
          }
        } catch (saveError) {
          console.error('Failed to save to Asset Hub:', saveError);
        }
        
        setGenerationStep('');
        return;
      }
      
      // PREMIUM AI Multi-Scene Video Generation (job-based to avoid timeout)
      if (backgroundType === 'premium-ai') {
        console.log('🎬 Starting Premium AI multi-scene video generation (job-based)');
        
        const videoPrompt = buildAIVideoPrompt();
        console.log('📝 Premium video topic:', videoPrompt);
        
        // Get brand images with user-classified types
        const allBrandImages = businessInfo?.brandImages || [];
        
        // Separate images by user-defined type
        const userClassifiedLogo = allBrandImages.find(img => img.imageType === 'logo');
        const userClassifiedProducts = allBrandImages.filter(img => img.imageType === 'product').map(img => img.url);
        const userClassifiedLifestyle = allBrandImages.filter(img => img.imageType === 'lifestyle').map(img => img.url);
        const unclassifiedImages = allBrandImages.filter(img => !img.imageType).map(img => img.url);
        
        // Use user-classified logo, or fall back to first image
        const brandLogo = userClassifiedLogo?.url || allBrandImages[0]?.url || null;
        
        // Combine classified product images + unclassified (GPT will classify unclassified ones)
        const brandImages = [...userClassifiedProducts, ...userClassifiedLifestyle, ...unclassifiedImages];
        
        console.log('🏷️ Logo:', brandLogo ? 'Found (user-classified)' : 'None');
        console.log('📦 Product images:', userClassifiedProducts.length, 'classified +', unclassifiedImages.length, 'to auto-classify');
        console.log('👤 Lifestyle images:', userClassifiedLifestyle.length, 'classified');
        
        // Get selected product images if a specific product is selected
        const selectedProductData = getSelectedProductDetails();
        const productImages = selectedProductData?.images || [];
        
        // ============================================
        // STEP 1: Start job (returns immediately)
        // ============================================
        setGenerationStep('🚀 Starting Premium AI generation...');
        
        const startResponse = await fetch('/api/ai/video/start-premium', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: videoPrompt,
            businessName: businessInfo?.businessName,
            industry: businessInfo?.industry,
            contentPurpose: contentPurpose,
            aspectRatio: aspectRatio,
            voice: getVoiceId(),
            includeSubtitles: true,
            subtitleStyle: selectedTemplate || 'modern',
            logoUrl: brandLogo,
            logoPosition: 'topRight',
            logoSize: 0.12,
            // Send images with pre-classification info
            brandImages: brandImages,
            productImages: productImages,
            // Pass user classifications to skip GPT Vision for already-classified images
            userClassifiedProducts: userClassifiedProducts,
            userClassifiedLifestyle: userClassifiedLifestyle,
            productName: selectedProductData?.name,
            productDescription: selectedProductData?.description
          })
        });
        
        const startData = await startResponse.json();
        
        if (!startResponse.ok || !startData.success) {
          throw new Error(startData.error || 'Failed to start premium video generation');
        }
        
        const jobId = startData.jobId;
        console.log('✅ Job created:', jobId);
        
        // Save pending job to localStorage so we can resume if user navigates away
        const purposeForSave = contentPurposes.find(p => p.id === contentPurpose);
        const productForSave = getSelectedProductDetails();
        const pendingJobData = {
          jobId,
          startedAt: new Date().toISOString(),
          metadata: {
            name: `${purposeForSave?.label || 'Content'} - ${productForSave?.name || businessInfo?.businessName || 'Premium AI Video'}`,
            caption: `Premium AI: ${postTopic.substring(0, 80)}`,
            tags: [contentPurpose, 'premium-ai', 'multi-scene', 'composed', businessInfo?.industry].filter(Boolean),
            businessName: businessInfo?.businessName,
            productName: productForSave?.name,
            postTopic,
            contentPurpose,
            template: selectedTemplate,
            aspectRatio
          }
        };
        localStorage.setItem('pendingPremiumJob', JSON.stringify(pendingJobData));
        console.log('💾 Saved pending job to localStorage for resume capability');
        
        // ============================================
        // STEP 2: Trigger processing (separate call to avoid timeout)
        // ============================================
        setGenerationStep('📝 Creating script and generating scenes...');
        
        // Start processing in background - don't await, just fire and poll
        fetch('/api/ai/video/premium-process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId })
        }).catch(err => {
          // Process endpoint may timeout but job continues - that's OK
          console.log('Process request sent (may timeout, polling will catch result)');
        });
        
        // Give processing a head start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // ============================================
        // STEP 3: Poll for completion
        // ============================================
        let attempts = 0;
        const maxAttempts = 180; // 15 minutes max (5s intervals) - Premium videos can take longer
        let finalJob = null;
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          attempts++;
          
          try {
            const statusResponse = await fetch('/api/ai/video/premium-job-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jobId })
            });
            const statusData = await statusResponse.json();
            
            // Update localStorage with latest status so resume works better
            const updatedPendingJob = {
              ...pendingJobData,
              lastStatus: statusData.status,
              lastProgress: statusData.progress,
              lastChecked: new Date().toISOString()
            };
            localStorage.setItem('pendingPremiumJob', JSON.stringify(updatedPendingJob));
            
            if (statusData.status === 'done' && statusData.videoUrl) {
              finalJob = {
                finalVideoUrl: statusData.videoUrl,
                audioUrl: statusData.audioUrl,
                voiceoverScript: statusData.voiceoverScript,
                scenes: []
              };
              console.log('✅ Premium video complete:', statusData.videoUrl);
              // Clear pending job on success
              localStorage.removeItem('pendingPremiumJob');
              break;
            } else if (statusData.status === 'failed') {
              localStorage.removeItem('pendingPremiumJob');
              throw new Error(statusData.error || 'Video generation failed');
            }
            
            // Update status message from server with time elapsed
            const elapsedMin = Math.floor((attempts * 5) / 60);
            const elapsedSec = (attempts * 5) % 60;
            const timeStr = `${elapsedMin}:${elapsedSec.toString().padStart(2, '0')}`;
            const statusMsg = statusData.statusMessage || `Processing... (${statusData.status})`;
            
            // Also show progress percentage if available
            if (statusData.progress > 0) {
              setGenerationStep(`${statusMsg} (${statusData.progress}%) - ${timeStr} elapsed`);
            } else {
              setGenerationStep(`${statusMsg} - ${timeStr} elapsed`);
            }
            
          } catch (pollErr) {
            console.warn('Poll error:', pollErr.message);
            // Continue polling unless it's a definite failure
            if (pollErr.message.includes('failed')) {
              throw pollErr;
            }
          }
        }
        
        if (!finalJob || !finalJob.finalVideoUrl) {
          // Don't clear localStorage - allow resume
          console.log('⏳ Video generation timed out but job may still be processing. Check Asset Hub later or refresh page to resume.');
          throw new Error('Video generation timed out after 15 minutes. The job may still be processing in the background - refresh the page to check status or look in Asset Hub.');
        }
        
        // Build result from completed job
        const purpose = contentPurposes.find(p => p.id === contentPurpose);
        const product = getSelectedProductDetails();
        
        const result = {
          id: Date.now().toString(),
          type: 'premium-ai-video',
          name: `${purpose?.label || 'Content'} - ${product?.name || businessInfo?.businessName || 'Premium AI Video'}`,
          script: finalJob.voiceoverScript || postTopic,
          audioUrl: finalJob.audioUrl,
          backgroundUrl: finalJob.finalVideoUrl,
          composedVideoUrl: finalJob.finalVideoUrl,
          backgroundType: 'premium-ai',
          template: selectedTemplate,
          aspectRatio: aspectRatio,
          contentType: contentPurpose,
          ttsProvider: 'ElevenLabs',
          createdAt: new Date().toISOString(),
          metadata: {
            postTopic,
            contentPurpose,
            template: selectedTemplate,
            aspectRatio,
            backgroundType: 'premium-ai',
            scenes: finalJob.scenes || [],
            pipeline: 'premium-job-based',
            businessName: businessInfo?.businessName,
            productName: product?.name,
            jobId: jobId
          },
          instructions: '🎬 Premium AI video ready! Includes voiceover + subtitles. Download and share directly!'
        };
        
        setGeneratedResult(result);
        
        // Auto-save to Asset Hub
        try {
          saveVideoToHub({
            name: result.name,
            url: finalJob.finalVideoUrl,
            caption: `Premium AI: ${postTopic.substring(0, 80)}`,
            tags: [contentPurpose, 'premium-ai', 'multi-scene', 'composed', businessInfo?.industry].filter(Boolean),
            source: 'BusinessTrending-Premium',
            metadata: result.metadata
          });
          console.log('✅ Premium AI Video auto-saved to Asset Hub');
          
          // Clear pending job from localStorage since it completed successfully
          localStorage.removeItem('pendingPremiumJob');
          console.log('🧹 Cleared pending job from localStorage');
        } catch (saveError) {
          console.error('Failed to save to Asset Hub:', saveError);
        }
        
        setGenerationStep('');
        return;
      }

      // AI background image fallback
      setGenerationStep('Generating AI voiceover...');
      
      let voiceoverData = null;
      
      try {
        const elevenLabsResponse = await fetch('/api/ai/elevenlabs/full-voiceover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: postTopic,
            duration: 15,
            voiceStyle: getVoiceStyle()
          })
        });
        
        const elevenLabsData = await elevenLabsResponse.json();
        
        if (elevenLabsResponse.ok && !elevenLabsData.error && elevenLabsData.audioUrl) {
          voiceoverData = elevenLabsData;
        }
      } catch (elevenLabsError) {
        console.warn('ElevenLabs failed:', elevenLabsError);
      }
      
      if (!voiceoverData) {
        const googleResponse = await fetch('/api/ai/full-voiceover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: postTopic,
            duration: 15,
            voiceStyle: getVoiceStyle()
          })
        });
        
        voiceoverData = await googleResponse.json();
        
        if (!googleResponse.ok || voiceoverData.error) {
          throw new Error(voiceoverData.error || 'Failed to generate voiceover');
        }
      }

      // Generate AI background
      setGenerationStep('Creating visual background...');
      let backgroundUrl = null;
      
      if (backgroundType === 'ai-images') {
        const imagePrompt = `${contentPurpose} content background for ${businessInfo?.industry || 'brand'}, ${postTopic.substring(0, 50)}, professional, high quality, 9:16 vertical`;
        
        const imageResponse = await fetch('/api/ai/image/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: imagePrompt,
            aspectRatio: aspectRatio
          })
        });
        
        const imageData = await imageResponse.json();
        
        if (imageData.success && imageData.imageUrl) {
          backgroundUrl = imageData.imageUrl;
        }
      }

      // Prepare final result
      setGenerationStep('Preparing your content...');
      
      const purpose = contentPurposes.find(p => p.id === contentPurpose);
      const product = getSelectedProductDetails();
      
      const result = {
        id: Date.now().toString(),
        type: 'voiceover-video',
        name: `${purpose?.label || 'Content'} - ${product?.name || businessInfo?.businessName || 'Brand'}`,
        script: voiceoverData.script,
        audioUrl: voiceoverData.audioUrl,
        backgroundUrl: backgroundUrl,
        composedVideoUrl: null,
        backgroundType: backgroundType,
        template: selectedTemplate,
        aspectRatio: aspectRatio,
        contentType: contentPurpose,
        ttsProvider: 'AI',
        createdAt: new Date().toISOString(),
        metadata: {
          postTopic,
          contentPurpose,
          template: selectedTemplate,
          aspectRatio,
          backgroundType,
          businessName: businessInfo?.businessName,
          productName: product?.name
        }
      };
      
      setGeneratedResult(result);
      
      // Auto-save
      try {
        if (backgroundUrl) {
          saveImageToHub({
            name: result.name,
            url: backgroundUrl,
            caption: result.script?.substring(0, 100) + '...',
            tags: [contentPurpose, 'voiceover', backgroundType],
            source: 'BusinessTrending',
            metadata: result.metadata
          });
        }
      } catch (saveError) {
        console.error('Failed to save to Asset Hub:', saveError);
      }
      
      setGenerationStep('');
      
    } catch (error) {
      console.error('Generation error:', error);
      setGenerationError(error.message || 'Failed to generate. Please try again.');
      setGenerationStep('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      window.open(url, '_blank');
    }
  };

  const handleRegenerate = () => {
    setGeneratedResult(null);
    handleGenerate();
  };

  // If no brand is set up, show required notice
  if (!hasBrand) {
    return (
      <div className="business-trending-page">
        <div className="business-trending-container">
          <div className="trending-header">
            <button className="back-btn" onClick={() => navigate('/dashboard/business/create')}>
              <FiArrowLeft />
            </button>
            <h1>Brand Content Creator</h1>
          </div>
          
          <div className="brand-required-notice">
            <div className="notice-icon">
              <FiAlertCircle />
            </div>
            <h2>Brand Setup Required</h2>
            <p>
              Brand Content Creator generates viral short-form content specifically for your brand.
              To create content that matches your brand voice and promotes your products/services, please set up your brand first.
            </p>
            <div className="notice-features">
              <div className="feature-item">
                <FiCheckCircle />
                <span>AI voiceover videos for your brand</span>
              </div>
              <div className="feature-item">
                <FiCheckCircle />
                <span>Content tailored to your industry</span>
              </div>
              <div className="feature-item">
                <FiCheckCircle />
                <span>Scripts in your brand voice</span>
              </div>
            </div>
            <Link to="/dashboard/business/hub" className="setup-brand-btn">
              <FiZap />
              <span>Set Up Your Brand</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="business-trending-page">
      <div className="business-trending-container">
        
        {/* Header with Brand Banner */}
        <div className="trending-header">
          <button className="back-btn" onClick={handleBack}>
            <FiArrowLeft />
          </button>
          <h1>Brand Content Creator</h1>
        </div>
        
        {/* Brand Info Banner */}
        <div className="brand-info-banner">
          <div className="brand-banner-content">
            <div className="brand-avatar">
              {businessInfo?.businessName?.charAt(0)?.toUpperCase() || 'B'}
            </div>
            <div className="brand-details">
              <h3>{businessInfo?.businessName}</h3>
              <p>{businessInfo?.industry || 'Your Brand'}</p>
            </div>
          </div>
          <Link to="/dashboard/business/hub" className="edit-brand-link">
            Edit Brand
          </Link>
        </div>

        {/* Pending Job Banner */}
        {pendingJobInfo && !isGenerating && (
          <div className="pending-job-banner">
            <div className="pending-job-icon">⏳</div>
            <div className="pending-job-info">
              <h4>Premium Video In Progress</h4>
              <p>{pendingJobInfo.statusMessage || 'Your video is being generated...'}</p>
              {pendingJobInfo.progress > 0 && (
                <div className="pending-job-progress">
                  <div className="progress-bar" style={{ width: `${pendingJobInfo.progress}%` }}></div>
                </div>
              )}
            </div>
            <div className="pending-job-actions">
              {pendingJobInfo.canResume && (
                <button className="resume-btn" onClick={handleManualResume}>
                  <FiRefreshCw /> Resume
                </button>
              )}
              <button className="cancel-btn" onClick={handleCancelPendingJob}>
                <FiX /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="steps-progress">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <span>Content</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <span>Style</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Generate</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="step-content">
          
          {/* STEP 1: Content Strategy */}
          {currentStep === 1 && (
            <div className="step-panel">
              <div className="step-header">
                <span className="step-label">Step 1 of 3</span>
                <h2>What Content Are You Creating?</h2>
                <p>Choose your content type and what to feature</p>
              </div>

              {/* Content Purpose Selection */}
              <div className="selection-section">
                <h3>Content Type</h3>
                <div className="campaign-grid">
                  {contentPurposes.map(purpose => (
                    <div 
                      key={purpose.id}
                      className={`campaign-card ${contentPurpose === purpose.id ? 'selected' : ''}`}
                      onClick={() => setContentPurpose(purpose.id)}
                      style={{ '--campaign-color': purpose.color }}
                    >
                      <div className="campaign-icon">
                        <purpose.icon />
                      </div>
                      <h4>{purpose.label}</h4>
                      <p>{purpose.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product/Topic Selection */}
              {contentPurpose && (
                <div className="selection-section">
                  <h3>What to Feature</h3>
                  <p className="section-hint">Select a product/service or enter a custom topic</p>
                  
                  <div className="product-selection">
                    {/* Products from Business Hub */}
                    {businessInfo?.products && businessInfo.products.length > 0 && (
                      <div className="product-list">
                        {businessInfo.products.map((product, idx) => (
                          <div 
                            key={idx}
                            className={`product-card ${selectedProduct === product.name ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedProduct(product.name);
                              setCustomTopic('');
                            }}
                          >
                            <div className="product-icon">
                              <FiBox />
                            </div>
                            <div className="product-info">
                              <h4>{product.name}</h4>
                              {product.description && <p>{product.description}</p>}
                            </div>
                            {selectedProduct === product.name && (
                              <FiCheckCircle className="selected-check" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Custom Topic Input */}
                    <div className="custom-topic-section">
                      <label>Or describe your content topic:</label>
                      <textarea
                        placeholder="e.g., 3 tips for better sleep, behind the scenes of our workshop..."
                        value={customTopic}
                        onChange={(e) => {
                          setCustomTopic(e.target.value);
                          if (e.target.value.trim()) setSelectedProduct('');
                        }}
                        rows={3}
                      />
                      <button 
                        className="ai-advice-btn"
                        onClick={generateAIAdvice}
                        disabled={isLoadingAdvice || !contentPurpose}
                      >
                        <FiZap />
                        <span>AI Suggestions</span>
                      </button>
                    </div>
                    
                    {/* AI Advice Panel */}
                    {showAdvice && (
                      <div className="ai-advice-panel">
                        <div className="advice-header">
                          <h4><FiZap /> Content Ideas</h4>
                          <button className="close-advice" onClick={() => setShowAdvice(false)}>
                            <FiX />
                          </button>
                        </div>
                        
                        {isLoadingAdvice ? (
                          <div className="advice-loading">
                            <div className="advice-spinner"></div>
                            <span>Generating ideas for your brand...</span>
                          </div>
                        ) : (
                          <div className="advice-grid">
                            {aiAdvice.map((suggestion, index) => (
                              <button
                                key={index}
                                className="advice-card"
                                onClick={() => applyAdviceSuggestion(suggestion)}
                              >
                                <span className="advice-title">{suggestion.title}</span>
                                <span className="advice-hook">"{suggestion.hook}"</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Content Goal */}
              {contentPurpose && (selectedProduct || customTopic.trim()) && (
                <div className="selection-section">
                  <h3>Content Goal (Optional)</h3>
                  <div className="goal-pills">
                    {contentGoals.map(goal => (
                      <button
                        key={goal.id}
                        className={`goal-pill ${contentGoal === goal.id ? 'active' : ''}`}
                        onClick={() => setContentGoal(contentGoal === goal.id ? '' : goal.id)}
                      >
                        {goal.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step Actions */}
              <div className="step-actions">
                <button className="btn-back" onClick={handleBack}>
                  <FiArrowLeft />
                  <span>Back</span>
                </button>
                <button 
                  className="btn-next"
                  onClick={handleNext}
                  disabled={!canProceedStep1}
                >
                  <span>Continue</span>
                  <FiArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Style Settings */}
          {currentStep === 2 && (
            <div className="step-panel">
              <div className="step-header">
                <span className="step-label">Step 2 of 3</span>
                <h2>Video Style</h2>
                <p>Choose your subtitle style, voice, and format</p>
              </div>

              {/* Voice Selection - Enhanced ElevenLabs */}
              <div className="settings-section elevenlabs-section">
                <div className="section-header">
                  <h3><FiMic /> AI Voice</h3>
                  {elevenLabsStatus.available && (
                    <span className="elevenlabs-badge">
                      ⚡ ElevenLabs Premium
                    </span>
                  )}
                </div>
                
                {!elevenLabsStatus.available && (
                  <div className="elevenlabs-warning">
                    <FiAlertCircle />
                    <span>ElevenLabs not configured - using fallback voices</span>
                  </div>
                )}
                
                {/* Voice Grid */}
                <div className="voice-grid enhanced">
                  {getAvailableVoices().map(voice => (
                    <div 
                      key={voice.id}
                      className={`voice-card ${selectedVoiceId === voice.id ? 'selected' : ''}`}
                      onClick={() => selectVoice(voice)}
                    >
                      <div className="voice-card-header">
                        <span className="voice-emoji">{voice.emoji || '🎙️'}</span>
                        <h4>{voice.name}</h4>
                        {voice.style && (
                          <span className="voice-style-tag">{voice.style}</span>
                        )}
                      </div>
                      <p className="voice-description">{voice.description}</p>
                      {voice.previewUrl && (
                        <button 
                          className={`voice-preview-btn ${playingPreview === voice.id ? 'playing' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (playingPreview === voice.id) {
                              stopVoicePreview();
                            } else {
                              playVoicePreview(voice);
                            }
                          }}
                        >
                          {playingPreview === voice.id ? (
                            <>■ Stop</>
                          ) : (
                            <>▶ Preview</>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Voice Style Selection */}
                <div className="voice-style-section">
                  <h4>Voice Style</h4>
                  <div className="voice-style-pills">
                    {voiceStyles.map(style => (
                      <button
                        key={style.id}
                        className={`style-pill ${voiceStyle === style.id ? 'active' : ''}`}
                        onClick={() => setVoiceStyle(style.id)}
                        title={style.description}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* ElevenLabs Usage Info */}
                {elevenLabsStatus.subscription && (
                  <div className="elevenlabs-usage">
                    <span className="usage-label">Character Usage:</span>
                    <div className="usage-bar">
                      <div 
                        className="usage-fill"
                        style={{ 
                          width: `${(elevenLabsStatus.subscription.characterCount / elevenLabsStatus.subscription.characterLimit) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="usage-text">
                      {elevenLabsStatus.subscription.characterCount?.toLocaleString()} / {elevenLabsStatus.subscription.characterLimit?.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Subtitle Template */}
              <div className="settings-section">
                <h3>Subtitle Style</h3>
                <div className="template-grid">
                  {templates.map(template => (
                    <div 
                      key={template.id}
                      className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTemplate(template.id)}
                      style={{ '--template-color': template.color }}
                    >
                      <div className="template-preview" style={{ color: template.color }}>
                        Aa
                      </div>
                      <h4>{template.name}</h4>
                      <p>{template.preview}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio & Background */}
              <div className="settings-row-compact">
                <div className="setting-group">
                  <h4>Aspect Ratio</h4>
                  <div className="aspect-pills">
                    {aspectRatios.map(ratio => (
                      <button
                        key={ratio.id}
                        className={`aspect-pill ${aspectRatio === ratio.id ? 'active' : ''}`}
                        onClick={() => setAspectRatio(ratio.id)}
                      >
                        <ratio.icon />
                        <span>{ratio.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="setting-group">
                  <h4>Background</h4>
                  <div className="bg-pills">
                    {backgroundTypes.map(bg => (
                      <button
                        key={bg.id}
                        className={`bg-pill ${backgroundType === bg.id ? 'active' : ''} ${bg.premium ? 'premium' : ''}`}
                        onClick={() => setBackgroundType(bg.id)}
                        title={bg.description}
                      >
                        <bg.icon />
                        <span>{bg.label}</span>
                        {bg.recommended && <span className="rec-badge">★</span>}
                        {bg.premium && <span className="premium-badge">✨</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step Actions */}
              <div className="step-actions">
                <button className="btn-back" onClick={handleBack}>
                  <FiArrowLeft />
                  <span>Back</span>
                </button>
                <button 
                  className="btn-next"
                  onClick={handleNext}
                  disabled={!canProceedStep2}
                >
                  <span>Continue</span>
                  <FiArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Generate */}
          {currentStep === 3 && (
            <div className="step-panel">
              <div className="step-header">
                <span className="step-label">Step 3 of 3</span>
                <h2>Review & Generate</h2>
                <p>Review your content settings and generate</p>
              </div>

              {/* Content Summary */}
              <div className="content-summary">
                <h3>📋 Content Summary</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Brand</span>
                    <span className="summary-value">{businessInfo?.businessName}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Content Type</span>
                    <span className="summary-value">
                      {contentPurposes.find(p => p.id === contentPurpose)?.label}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Topic/Product</span>
                    <span className="summary-value">
                      {selectedProduct || customTopic.substring(0, 30) + (customTopic.length > 30 ? '...' : '')}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Voice</span>
                    <span className="summary-value">{selectedVoice}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Style</span>
                    <span className="summary-value">
                      {templates.find(t => t.id === selectedTemplate)?.name}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Format</span>
                    <span className="summary-value">{aspectRatio}</span>
                  </div>
                </div>
              </div>

              {/* Brand Context Toggle */}
              <div className="brand-context-toggle">
                <div className="toggle-row">
                  <div className="toggle-info">
                    <h4>🏢 Include Brand Context</h4>
                    <p>{useBrandContext ? 'Brand details will be included in generation' : 'Generic content without brand mentions'}</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={useBrandContext}
                      onChange={(e) => setUseBrandContext(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              {/* Generated Topic Preview */}
              <div className="topic-preview">
                <h4>📝 Content Prompt</h4>
                <p className="topic-text">{postTopic}</p>
                <button 
                  className="edit-topic-btn"
                  onClick={() => setCurrentStep(1)}
                >
                  <FiEdit3 />
                  <span>Edit</span>
                </button>
              </div>

              {/* Error Message */}
              {generationError && (
                <div className="generation-error">
                  <span>⚠️ {generationError}</span>
                  <button onClick={() => setGenerationError(null)}>×</button>
                </div>
              )}

              {/* Generation Progress */}
              {isGenerating && generationStep && (
                <div className="generation-progress">
                  <div className="progress-spinner"></div>
                  <span>{generationStep}</span>
                </div>
              )}

              {/* Generated Result */}
              {generatedResult && !isGenerating && (
                <div className="generation-result">
                  <div className="result-header">
                    <h3>🎉 Your Brand Content is Ready!</h3>
                    <span className="tts-provider">
                      {generatedResult.ttsProvider || 'AI'}
                    </span>
                  </div>
                  
                  <div className="result-content">
                    {generatedResult.composedVideoUrl ? (
                      <div className="result-media">
                        <video 
                          src={generatedResult.composedVideoUrl} 
                          controls 
                          autoPlay 
                          muted
                          loop
                          playsInline
                        />
                      </div>
                    ) : generatedResult.audioUrl && (
                      <div className="result-audio">
                        <label>🎙️ Voiceover</label>
                        <audio src={generatedResult.audioUrl} controls />
                      </div>
                    )}
                    
                    {generatedResult.script && (
                      <div className="result-script">
                        <label>📝 Script</label>
                        <p>{generatedResult.script}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="result-actions">
                    {generatedResult.composedVideoUrl && (
                      <button className="btn-action download primary" onClick={() => handleDownload(generatedResult.composedVideoUrl, `${businessInfo?.businessName || 'brand'}-content-${Date.now()}.mp4`)}>
                        <FiDownload /> Download Video
                      </button>
                    )}
                    {generatedResult.audioUrl && (
                      <button className="btn-action download" onClick={() => handleDownload(generatedResult.audioUrl, `voiceover-${Date.now()}.mp3`)}>
                        <FiDownload /> Audio
                      </button>
                    )}
                    <button className="btn-action secondary" onClick={handleRegenerate}>
                      <FiRefreshCw /> Regenerate
                    </button>
                  </div>
                </div>
              )}

              {/* Step Actions */}
              <div className="step-actions">
                <button className="btn-back" onClick={handleBack}>
                  <FiArrowLeft />
                  <span>Back</span>
                </button>
                <button 
                  className="btn-generate"
                  onClick={handleGenerate}
                  disabled={!postTopic.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <div className="spinner"></div>
                      <span>{generationStep || 'Generating...'}</span>
                    </>
                  ) : (
                    <>
                      <FiPlay />
                      <span>Generate Content</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BusinessTrending;
