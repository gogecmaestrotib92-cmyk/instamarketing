import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';
import { 
  FiPlay, FiPause, FiTrash2, FiVideo, FiMusic, FiType, 
  FiVolume2, FiVolumeX, FiDownload, FiSave, FiInstagram, FiX, FiCheck,
  FiChevronLeft, FiChevronRight, FiChevronDown, FiLoader, FiPlus, FiSearch, FiZap,
  FiMaximize2, FiMinimize2
} from 'react-icons/fi';
import './VideoEdit.css';

const VideoEdit = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const audioPreviewRef = useRef(null);
  const musicAudioRef = useRef(null); // For synced music playback
  
  // Video library state
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoVolume, setVideoVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  
  // Editing state
  const [activePanel, setActivePanel] = useState('music');
  const [musicTrack, setMusicTrack] = useState(null);
  const [musicVolume, setMusicVolume] = useState(70);
  const [subtitles, setSubtitles] = useState([]);
  const [textOverlays, setTextOverlays] = useState([]);
  const [soundEffects, setSoundEffects] = useState([]);
  
  // Render state
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [isRendered, setIsRendered] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [renderJobId, setRenderJobId] = useState(null);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState(null);
  
  // Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Audio preview state
  const [playingPreviewId, setPlayingPreviewId] = useState(null);
  
  // Mobile video picker modal
  const [showMobileVideoPicker, setShowMobileVideoPicker] = useState(false);
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenContainerRef = useRef(null);

  // Filtered videos based on search
  const filteredVideos = videos.filter(video => 
    video.prompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    formatDate(video.createdAt).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Music library (songs for background)
  const musicLibrary = [
    { id: 1, name: 'Christmas Happy', duration: '2:30', mood: 'festive', icon: '🎄', audioUrl: '/music/christmas-happy-background-442036.mp3' },
    { id: 2, name: 'Comic Humor TikTok', duration: '1:45', mood: 'funny', icon: '😂', audioUrl: '/music/comic-humor-memes-tiktok-music-357342.mp3' },
    { id: 3, name: 'D3ath', duration: '2:00', mood: 'intense', icon: '💀', audioUrl: '/music/d3ath-202001.mp3' },
    { id: 4, name: 'Dark Horror Suspense', duration: '2:15', mood: 'horror', icon: '👻', audioUrl: '/music/dark-horror-suspense-442042.mp3' },
    { id: 5, name: 'Hold Me Tight', duration: '2:30', mood: 'romantic', icon: '💕', audioUrl: '/music/hold-me-tight-278286.mp3' },
    { id: 6, name: 'Leather', duration: '2:00', mood: 'edgy', icon: '🎸', audioUrl: '/music/leather-442654.mp3' },
    { id: 7, name: 'Phonk Music', duration: '1:30', mood: 'phonk', icon: '🔊', audioUrl: '/music/phonk-music-439636.mp3' },
    { id: 8, name: 'Phonk TikTok', duration: '1:45', mood: 'viral', icon: '📱', audioUrl: '/music/phonk-tiktok-instagram-youtube-music-303287.mp3' },
    { id: 9, name: 'Piano Music', duration: '3:00', mood: 'calm', icon: '🎹', audioUrl: '/music/piano-music-443004.mp3' },
    { id: 10, name: 'Play House', duration: '2:30', mood: 'electronic', icon: '🎧', audioUrl: '/music/play-house-thousand-sounds-official-audio-382805.mp3' },
    { id: 11, name: 'Rap Beat', duration: '2:00', mood: 'hiphop', icon: '🎤', audioUrl: '/music/rap-beat-183034.mp3' },
    { id: 12, name: 'Viral Energy Pop', duration: '1:30', mood: 'energetic', icon: '⚡', audioUrl: '/music/viral-energy-pop-fashion-sports-dubstep-promo-reels-312770.mp3' },
    { id: 13, name: 'YouTube Background', duration: '2:45', mood: 'chill', icon: '▶️', audioUrl: '/music/youtube-background-music-409205.mp3' },
  ];

  // Sound effects library (ambient & effects)
  const soundsLibrary = [
    { id: 1, name: 'Alert', icon: '🔔', type: 'notification', audioUrl: '/sounds/alerte-346112.mp3' },
    { id: 2, name: 'Robot Footstep', icon: '🤖', type: 'sci-fi', audioUrl: '/sounds/big-robot-footstep-014-445104.mp3' },
    { id: 3, name: 'Calming Rain', icon: '🌧️', type: 'ambient', audioUrl: '/sounds/calming-rain-257596.mp3' },
    { id: 4, name: 'Fire Sound', icon: '🔥', type: 'ambient', audioUrl: '/sounds/fire-sound-334130.mp3' },
    { id: 5, name: 'Pool Splash', icon: '🏊', type: 'action', audioUrl: '/sounds/jumping-into-swimming-pool-438546.mp3' },
    { id: 6, name: 'Mouse Click', icon: '🖱️', type: 'tech', audioUrl: '/sounds/mouse-click-290204.mp3' },
    { id: 7, name: 'Pig Grunting', icon: '🐷', type: 'funny', audioUrl: '/sounds/pig-grunting-playing-in-mud-sound-effect-440220.mp3' },
    { id: 8, name: 'Clock Ticking', icon: '⏰', type: 'suspense', audioUrl: '/sounds/slow-cinematic-clock-ticking-357979.mp3' },
    { id: 9, name: 'Clock Ticking Alt', icon: '🕐', type: 'suspense', audioUrl: '/sounds/slow-cinematic-clock-ticking-405471.mp3' },
    { id: 10, name: 'Motorcycle', icon: '🏍️', type: 'action', audioUrl: '/sounds/small-off-road-motorcycle-passing-445143.mp3' },
    { id: 11, name: 'Thunder Storm', icon: '⛈️', type: 'ambient', audioUrl: '/sounds/thunder-storm-and-raining-sound-effect-444739.mp3' },
  ];

  // Text styles
  const textStyles = [
    { id: 'modern', name: 'Modern', preview: 'Aa' },
    { id: 'bold', name: 'Bold', preview: 'Aa' },
    { id: 'minimal', name: 'Minimal', preview: 'Aa' },
    { id: 'neon', name: 'Neon', preview: 'Aa' },
  ];

  useEffect(() => {
    // Load saved videos from localStorage
    const savedVideos = JSON.parse(localStorage.getItem('aiVideos') || '[]');
    
    // Filter out videos with invalid URLs
    const normalizedVideos = savedVideos
      .map(v => ({
        ...v,
        url: v.url || v.videoUrl
      }))
      .filter(v => {
        const videoUrl = v.url || v.videoUrl;
        
        // Filter out blob URLs as they are session-specific
        if (videoUrl && videoUrl.startsWith('blob:')) {
          console.log('Removing invalid blob URL video:', v.id);
          return false;
        }
        
        // Filter out empty or invalid URLs
        if (!videoUrl || videoUrl === 'undefined' || videoUrl === 'null') {
          console.log('Removing video with invalid URL:', v.id);
          return false;
        }
        
        // Keep only videos with http/https URLs
        if (!videoUrl.startsWith('http')) {
          console.log('Removing video with non-http URL:', v.id, videoUrl);
          return false;
        }
        
        return true;
      });
    
    // Update localStorage to remove invalid videos
    if (normalizedVideos.length !== savedVideos.length) {
      console.log(`Cleaned up ${savedVideos.length - normalizedVideos.length} invalid videos`);
      localStorage.setItem('aiVideos', JSON.stringify(normalizedVideos));
    }
    
    setVideos(normalizedVideos);
    
    // Check if video was passed from navigation
    if (location.state?.video) {
      // Normalize video object to ensure 'url' property exists
      const navVideo = location.state.video;
      const videoUrl = navVideo.url || navVideo.videoUrl;
      
      // Check if it's a valid URL
      if (!videoUrl || videoUrl.startsWith('blob:') || !videoUrl.startsWith('http')) {
        console.warn('Cannot use invalid URL from navigation:', videoUrl);
        // Try to select first valid video instead
        if (normalizedVideos.length > 0) {
          setSelectedVideo(normalizedVideos[0]);
        }
      } else {
        const normalizedVideo = {
          ...navVideo,
          url: videoUrl
        };
        console.log('Setting selected video from navigation:', normalizedVideo.url);
        setSelectedVideo(normalizedVideo);
      }
    } else if (normalizedVideos.length > 0) {
      // Auto-select first video if available
      console.log('Auto-selecting first video:', normalizedVideos[0].url);
      setSelectedVideo(normalizedVideos[0]);
    }
  }, [location.state]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl) {
      const handleTimeUpdate = () => {
        setCurrentTime(videoEl.currentTime);
        // Sync music audio time if playing
        if (musicAudioRef.current && musicTrack && isPlaying) {
          const timeDiff = Math.abs(musicAudioRef.current.currentTime - videoEl.currentTime);
          if (timeDiff > 0.3) { // Resync if drifted more than 0.3s
            musicAudioRef.current.currentTime = videoEl.currentTime;
          }
        }
      };
      const handleLoadedMetadata = () => setDuration(videoEl.duration || 5);
      const handleEnded = () => {
        setIsPlaying(false);
        // Stop music too
        if (musicAudioRef.current) {
          musicAudioRef.current.pause();
          musicAudioRef.current.currentTime = 0;
        }
      };
      
      videoEl.addEventListener('timeupdate', handleTimeUpdate);
      videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoEl.addEventListener('ended', handleEnded);
      
      return () => {
        videoEl.removeEventListener('timeupdate', handleTimeUpdate);
        videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoEl.removeEventListener('ended', handleEnded);
      };
    }
  }, [selectedVideo, musicTrack, isPlaying]);
  
  // Effect to load music audio when music track changes
  useEffect(() => {
    if (musicTrack?.audioUrl) {
      // Create or update audio element
      if (!musicAudioRef.current) {
        musicAudioRef.current = new Audio();
      }
      musicAudioRef.current.src = musicTrack.audioUrl;
      musicAudioRef.current.load();
    } else if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.src = '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicTrack]);
  
  // Effect to update music volume
  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = musicVolume / 100;
    }
  }, [musicVolume]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        // Pause music too
        if (musicAudioRef.current) {
          musicAudioRef.current.pause();
        }
      } else {
        videoRef.current.play();
        // Play music synced with video
        if (musicAudioRef.current && musicTrack) {
          musicAudioRef.current.currentTime = videoRef.current.currentTime;
          musicAudioRef.current.play().catch(e => console.log('Music play error:', e));
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handlePlaybackSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleVolumeChange = (value) => {
    setVideoVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value / 100;
    }
    if (value > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };
  
  // Fullscreen toggle function
  const toggleFullscreen = () => {
    if (!fullscreenContainerRef.current) return;
    
    if (!isFullscreen) {
      // Enter fullscreen
      if (fullscreenContainerRef.current.requestFullscreen) {
        fullscreenContainerRef.current.requestFullscreen();
      } else if (fullscreenContainerRef.current.webkitRequestFullscreen) {
        fullscreenContainerRef.current.webkitRequestFullscreen();
      } else if (fullscreenContainerRef.current.msRequestFullscreen) {
        fullscreenContainerRef.current.msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };
  
  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      ));
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle selecting video from mobile picker
  const handleSelectVideoFromPicker = (video) => {
    setSelectedVideo({ ...video, url: video.url || video.videoUrl });
    setShowMobileVideoPicker(false);
  };

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      // Sync music audio time
      if (musicAudioRef.current && musicTrack) {
        musicAudioRef.current.currentTime = newTime;
      }
    }
  };

  const selectMusic = (track) => {
    setMusicTrack(track);
    toast.success(`Added: ${track.name}`);
  };

  const addTextOverlay = () => {
    const videoDuration = duration || 5;
    const textDuration = 3; // Default text duration
    // If current time is near the end, adjust start time to fit the text
    const adjustedStart = Math.min(currentTime, Math.max(0, videoDuration - textDuration));
    const newText = {
      id: Date.now(),
      text: 'Your text here',
      position: 'bottom-center', // 9-grid: top-left, top-center, top-right, center-left, center, center-right, bottom-left, bottom-center, bottom-right
      style: 'modern',
      fontSize: 42,
      offsetX: 0,
      offsetY: 0,
      startTime: adjustedStart,
      endTime: Math.min(adjustedStart + textDuration, videoDuration)
    };
    setTextOverlays([...textOverlays, newText]);
  };

  const addSubtitle = () => {
    const videoDuration = duration || 5;
    const subtitleDuration = 2; // Default subtitle duration
    // If current time is near the end, adjust start time to fit the subtitle
    const adjustedStart = Math.min(currentTime, Math.max(0, videoDuration - subtitleDuration));
    const newSubtitle = {
      id: Date.now(),
      text: 'Subtitle text',
      startTime: adjustedStart,
      endTime: Math.min(adjustedStart + subtitleDuration, videoDuration)
    };
    setSubtitles([...subtitles, newSubtitle]);
  };

  const addSoundEffect = (sound) => {
    const newEffect = {
      ...sound,
      instanceId: Date.now(),
      time: currentTime
    };
    setSoundEffects([...soundEffects, newEffect]);
    toast.success(`Added: ${sound.name}`);
  };

  const handleRender = async () => {
    if (!selectedVideo) {
      toast.error('Please select a video first');
      return;
    }
    
    setIsRendering(true);
    setRenderProgress(0);
    setRenderedVideoUrl(null);
    
    try {
      // Build subtitles array for backend - include both subtitles AND text overlays
      const subtitlesData = [
        // Regular subtitles
        ...subtitles.map(sub => ({
          text: sub.text,
          start: sub.startTime,
          end: sub.endTime,
          position: 'bottom-center',
          fontSize: 42
        })),
        // Text overlays with position, fontSize, and offsets
        ...textOverlays.map(overlay => ({
          text: overlay.text,
          start: overlay.startTime,
          end: overlay.endTime,
          position: overlay.position || 'bottom-center',
          fontSize: overlay.fontSize || 42,
          offsetX: overlay.offsetX || 0,
          offsetY: overlay.offsetY || 0,
          style: overlay.style || 'blockbuster'
        }))
      ];
      
      console.log('Sending to render:', { subtitlesCount: subtitlesData.length, subtitlesData });
      
      // Get the audio URL - need to upload to cloud if it's a local file
      let audioUrl = null;
      if (musicTrack?.audioUrl) {
        const localAudioPath = musicTrack.audioUrl;
        
        // Check if it's a local path that needs to be uploaded
        if (localAudioPath.startsWith('/music/') || localAudioPath.startsWith('/')) {
          toast.info('Uploading music to cloud...');
          setRenderProgress(3);
          
          try {
            // Fetch the local audio file
            const audioResponse = await fetch(localAudioPath);
            if (!audioResponse.ok) throw new Error('Failed to fetch audio file');
            const audioBlob = await audioResponse.blob();
            
            // Upload to server (which will upload to Cloudinary)
            const formData = new FormData();
            formData.append('audio', audioBlob, localAudioPath.split('/').pop());
            
            const uploadRes = await fetch('/api/ai/upload-audio', {
              method: 'POST',
              body: formData
            });
            
            const uploadResult = await uploadRes.json();
            
            if (uploadResult.success && uploadResult.url) {
              audioUrl = uploadResult.url;
              toast.success('Music uploaded!');
              setRenderProgress(8);
            } else {
              console.warn('Audio upload failed, continuing without music:', uploadResult.error);
              toast.warning('Continuing without music');
            }
          } catch (audioError) {
            console.warn('Audio upload error, continuing without music:', audioError);
            toast.warning('Continuing without music');
          }
        } else if (localAudioPath.startsWith('http')) {
          // Already a cloud URL
          audioUrl = localAudioPath;
        }
      }
      
      // Get video URL - upload to cloud if it's a blob
      let videoUrl = selectedVideo.url || selectedVideo.videoUrl;
      // Check if already a cloud URL (Cloudinary, Replicate, etc) - no need to re-upload
      const isCloudUrl = videoUrl.startsWith('https://res.cloudinary.com') || 
                         videoUrl.startsWith('https://replicate.delivery') ||
                         (videoUrl.startsWith('http') && !videoUrl.includes('localhost') && !videoUrl.includes('blob:'));
      
      if (videoUrl.startsWith('blob:')) {
        toast.info('Uploading video to cloud...');
        setRenderProgress(5);
        
        // Fetch the blob and upload it
        try {
          const blobResponse = await fetch(videoUrl);
          const blob = await blobResponse.blob();
          
          // Check file size - warn if large
          const fileSizeMB = blob.size / (1024 * 1024);
          console.log('Video blob size:', fileSizeMB.toFixed(2) + 'MB');
          
          if (fileSizeMB > 50) {
            toast.error('Video is too large (max 50MB). Please use a smaller video.');
            setIsRendering(false);
            return;
          }
          
          const formData = new FormData();
          formData.append('video', blob, 'video.mp4');
          
          const uploadRes = await fetch('/api/ai/upload-video', {
            method: 'POST',
            body: formData
          });
          
          // Check for 413 payload too large BEFORE trying to parse JSON
          if (uploadRes.status === 413) {
            toast.error(`Video too large (${fileSizeMB.toFixed(1)}MB). Max upload size is ~4MB. Use AI-generated videos instead.`);
            setIsRendering(false);
            return;
          }
          
          // Check for other error status codes
          if (!uploadRes.ok) {
            const errorText = await uploadRes.text();
            throw new Error(errorText || `Upload failed with status ${uploadRes.status}`);
          }
          
          const uploadResult = await uploadRes.json();
          
          if (uploadResult.success && uploadResult.url) {
            videoUrl = uploadResult.url;
            toast.success('Video uploaded!');
            setRenderProgress(15);
          } else {
            throw new Error(uploadResult.error || 'Video upload failed');
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          if (uploadError.message.includes('413') || uploadError.message.includes('payload')) {
            toast.error('Video is too large. Please use a smaller video or one already on cloud.');
          } else {
            toast.error('Failed to upload video: ' + uploadError.message);
          }
          setIsRendering(false);
          return;
        }
      } else if (isCloudUrl) {
        console.log('Using existing cloud URL:', videoUrl);
        setRenderProgress(15);
        
        // If it's not a Cloudinary URL, we need to upload it to Cloudinary for text overlays
        if (!videoUrl.includes('cloudinary.com')) {
          toast.info('Transferring video to Cloudinary for text overlays...');
          try {
            // Use server endpoint to download and re-upload to Cloudinary
            const transferRes = await fetch('/api/ai/transfer-to-cloudinary', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ videoUrl })
            });
            
            if (transferRes.ok) {
              const transferResult = await transferRes.json();
              if (transferResult.success && transferResult.url) {
                videoUrl = transferResult.url;
                toast.success('Video transferred to Cloudinary!');
              }
            } else {
              console.warn('Transfer failed, will try render anyway');
            }
          } catch (transferError) {
            console.warn('Transfer error:', transferError);
            // Continue anyway, render might still work
          }
        }
      } else if (videoUrl.includes('localhost')) {
        // Local server URL won't work in production
        if (window.location.hostname !== 'localhost') {
          toast.error('Local video URLs cannot be used in production. Please upload the video first.');
          setIsRendering(false);
          return;
        }
      }
      
      // Use Cloudinary for rendering (more reliable than Shotstack for text overlays)
      console.log('Using Cloudinary render with subtitles:', subtitlesData);
      console.log('Audio URL:', audioUrl);
      setRenderProgress(20);
      toast.info('Processing video with text and audio...');
      
      // Use URL-based transformation (supports both text and audio)
      const response = await fetch('/api/ai/cloudinary/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl,
          audioUrl,
          subtitles: subtitlesData,
          options: {
            duration: duration || 5,
            musicVolume: musicVolume / 100,
            videoVolume: isMuted ? 0 : videoVolume / 100
          }
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.url) {
        setRenderProgress(100);
        setIsRendering(false);
        setIsRendered(true);
        setRenderedVideoUrl(result.url);
        toast.success('Video rendered successfully!');
      } else {
        throw new Error(result.error || 'Render failed');
      }
      
    } catch (error) {
      console.error('Render error:', error);
      setIsRendering(false);
      toast.error('Render failed: ' + error.message);
    }
  };

  const handleSaveVideo = () => {
    if (!selectedVideo) return;
    
    const editedVideo = {
      ...selectedVideo,
      // Save the rendered video URL if available
      url: renderedVideoUrl || selectedVideo.url,
      videoUrl: renderedVideoUrl || selectedVideo.videoUrl,
      renderedUrl: renderedVideoUrl,
      musicTrack,
      textOverlays,
      subtitles,
      soundEffects,
      editedAt: new Date().toISOString(),
      isRendered: !!renderedVideoUrl
    };
    
    const updatedVideos = videos.map(v => 
      v.id === selectedVideo.id ? editedVideo : v
    );
    
    setVideos(updatedVideos);
    setSelectedVideo(editedVideo);
    localStorage.setItem('aiVideos', JSON.stringify(updatedVideos));
    toast.success('Video saved successfully!');
  };

  const handlePostToInstagram = () => {
    toast.info('Instagram posting coming soon!');
  };

  const handleDeleteVideo = (videoId) => {
    const updatedVideos = videos.filter(v => v.id !== videoId);
    setVideos(updatedVideos);
    localStorage.setItem('aiVideos', JSON.stringify(updatedVideos));
    
    if (selectedVideo?.id === videoId) {
      setSelectedVideo(updatedVideos[0] || null);
    }
    toast.success('Video deleted');
  };

  const handleDownload = async () => {
    // Prefer rendered video URL if available
    const downloadUrl = renderedVideoUrl || selectedVideo?.url || selectedVideo?.videoUrl;
    if (!downloadUrl) {
      toast.error('No video available to download');
      return;
    }
    
    try {
      toast.info('Preparing download...');
      
      // For cross-origin URLs (like Shotstack CDN), we need to fetch as blob
      if (downloadUrl.startsWith('http') && !downloadUrl.startsWith(window.location.origin)) {
        // Fetch the video as a blob
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error('Failed to fetch video');
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `video-${selectedVideo?.id || Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL after a short delay
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } else {
        // For local/same-origin URLs, direct download works
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `video-${selectedVideo?.id || Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast.success('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: open in new tab
      window.open(downloadUrl, '_blank');
      toast.info('Video opened in new tab - right-click to save');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const playPreview = (id, audioUrl) => {
    if (playingPreviewId === id) {
      // Stop current preview
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current.currentTime = 0;
      }
      setPlayingPreviewId(null);
    } else {
      // Stop any existing audio
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current.currentTime = 0;
      }
      
      setPlayingPreviewId(id);
      
      try {
        // Play actual audio file
        const audio = new Audio(audioUrl);
        audioPreviewRef.current = audio;
        audio.volume = 0.7;
        
        audio.onended = () => {
          setPlayingPreviewId(prev => prev === id ? null : prev);
        };
        
        audio.onerror = () => {
          console.log('Audio load error');
          toast.error('Could not load audio');
          setPlayingPreviewId(null);
        };
        
        audio.play().catch(e => {
          console.log('Audio play error:', e);
          toast.error('Could not play audio');
          setPlayingPreviewId(null);
        });
      } catch (e) {
        console.log('Audio error:', e);
        toast.error('Could not play audio');
        setPlayingPreviewId(null);
      }
    }
  };

  // Handle video file upload - upload to Cloudinary immediately
  const handleFileUpload = async (file) => {
    if (!file) return;
    
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    console.log('Uploading video file:', file.name, fileSizeMB.toFixed(2) + 'MB');
    
    if (fileSizeMB > 100) {
      toast.error('Video is too large (max 100MB)');
      return;
    }
    
    // Show temporary blob URL for preview while uploading
    const blobUrl = URL.createObjectURL(file);
    const tempVideo = {
      id: Date.now(),
      url: blobUrl,
      prompt: file.name,
      createdAt: new Date().toISOString(),
      duration: 5,
      uploading: true
    };
    
    setVideos(prev => [tempVideo, ...prev]);
    setSelectedVideo(tempVideo);
    
    // Upload to Cloudinary via server
    toast.info('Uploading video to cloud...');
    
    try {
      const formData = new FormData();
      formData.append('video', file);
      
      const uploadRes = await fetch('/api/ai/upload-video', {
        method: 'POST',
        body: formData
      });
      
      // Check for 413 payload too large
      if (uploadRes.status === 413) {
        toast.error(`Video too large (${fileSizeMB.toFixed(1)}MB). Max upload is ~4MB for cloud. Try compressing the video.`);
        // Remove the temp video
        setVideos(prev => prev.filter(v => v.id !== tempVideo.id));
        setSelectedVideo(null);
        URL.revokeObjectURL(blobUrl);
        return;
      }
      
      if (!uploadRes.ok) {
        throw new Error(`Upload failed: ${uploadRes.status}`);
      }
      
      const uploadResult = await uploadRes.json();
      
      if (uploadResult.success && uploadResult.url) {
        // Update video with cloud URL
        const cloudVideo = {
          ...tempVideo,
          url: uploadResult.url,
          videoUrl: uploadResult.url,
          uploading: false
        };
        
        setVideos(prev => {
          const updated = prev.map(v => v.id === tempVideo.id ? cloudVideo : v);
          localStorage.setItem('aiVideos', JSON.stringify(updated));
          return updated;
        });
        setSelectedVideo(cloudVideo);
        
        URL.revokeObjectURL(blobUrl);
        toast.success('Video uploaded successfully!');
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload: ' + err.message);
      // Remove temp video on error
      setVideos(prev => prev.filter(v => v.id !== tempVideo.id));
      setSelectedVideo(null);
      URL.revokeObjectURL(blobUrl);
    }
  };

  return (
    <main className="video-edit-page">
      <SEO title="Edit Videos" description="Edit your AI generated videos" noindex={true} />
      
      <div className="edit-studio">
        {/* Video Library Sidebar - LEFT PANEL */}
        <aside className={`video-library ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="library-header">
            {!sidebarCollapsed && <h2>Project</h2>}
            <button 
              className="collapse-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {sidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </button>
          </div>
          
          {!sidebarCollapsed && (
            <>
              {/* Search Bar */}
              <div className="library-search">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Find my videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              {/* Generate New Button */}
              <button 
                className="generate-new-btn"
                onClick={() => navigate('/app/ai-video')}
              >
                <FiZap /> Generate New Video
              </button>

              {/* Video Count */}
              <div className="video-count">
                <span>{filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Video List */}
              <div className="video-list">
                {filteredVideos.length === 0 ? (
                  <div className="empty-library">
                    <FiVideo />
                    <p>{searchQuery ? 'No videos found' : 'No videos yet'}</p>
                    <span className="empty-hint">
                      {searchQuery ? 'Try a different search' : 'Generate your first video'}
                    </span>
                  </div>
                ) : (
                  filteredVideos.map((video) => (
                    <div 
                      key={video.id} 
                      className={`video-item ${selectedVideo?.id === video.id ? 'active' : ''}`}
                      onClick={() => setSelectedVideo({ ...video, url: video.url || video.videoUrl })}
                    >
                      <div className="video-thumb">
                        {(video.url || video.videoUrl) ? (
                          <video 
                            src={video.url || video.videoUrl} 
                            muted 
                            playsInline 
                            preload="metadata"
                            onError={(e) => {
                              // Hide broken video thumbnails
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <FiVideo />
                        )}
                        <span className="video-duration-badge">
                          {video.duration || '5'}s
                        </span>
                      </div>
                      <div className="video-meta">
                        <p className="video-title">{video.prompt?.slice(0, 40) || 'AI Video'}</p>
                        <span className="video-date">{formatDate(video.createdAt)}</span>
                      </div>
                      <div className="video-item-actions">
                        <button 
                          className="add-to-edit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVideo({ ...video, url: video.url || video.videoUrl });
                            toast.success('Video added to preview');
                          }}
                          title="Add to preview"
                        >
                          <FiPlus />
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVideo(video.id);
                          }}
                          title="Delete video"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </aside>

        {/* CENTER PANEL - Hero Video Preview */}
        <div className="editor-main">
          {/* Mobile Add Video Button - only shows on mobile */}
          <div className="mobile-add-video-header">
            <button 
              className="mobile-add-video-btn"
              onClick={() => setShowMobileVideoPicker(true)}
            >
              <FiPlus /> Add Video
            </button>
            {selectedVideo && (
              <span className="mobile-video-indicator">
                {selectedVideo.prompt?.slice(0, 20) || 'Video selected'}...
              </span>
            )}
          </div>

          <div className="hero-preview-wrapper">
            {/* Glow Frame Container */}
            <div className={`preview-glow-frame ${isFullscreen ? 'fullscreen-mode' : ''}`} ref={fullscreenContainerRef}>
              {/* Fullscreen Button */}
              {selectedVideo && (
                <button 
                  className="fullscreen-btn"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
                </button>
              )}
              
              {/* 9:16 Aspect Ratio Container */}
              <div className="preview-container-9-16">
                {/* Show rendered video if available, otherwise show original */}
                {renderedVideoUrl ? (
                  <video 
                    ref={videoRef}
                    src={renderedVideoUrl}
                    className="preview-video-hero"
                    onClick={togglePlay}
                    muted={isMuted}
                    playsInline
                    preload="auto"
                    controls
                    onLoadedData={() => {
                      console.log('Rendered video loaded:', renderedVideoUrl);
                      if (videoRef.current) {
                        setDuration(videoRef.current.duration || 5);
                      }
                    }}
                  />
                ) : selectedVideo && (selectedVideo.url || selectedVideo.videoUrl) ? (
                  <video 
                    ref={videoRef}
                    src={selectedVideo.url || selectedVideo.videoUrl}
                    className="preview-video-hero"
                    onClick={togglePlay}
                    muted={isMuted}
                    playsInline
                    preload="auto"
                    onError={(e) => {
                      const videoUrl = selectedVideo.url || selectedVideo.videoUrl;
                      const errorCode = e.target.error?.code;
                      const errorMsg = e.target.error?.message || 'Unknown error';
                      
                      console.error('Video load error:', { 
                        code: errorCode, 
                        message: errorMsg, 
                        url: videoUrl 
                      });
                      
                      // Error codes: 1=ABORTED, 2=NETWORK, 3=DECODE, 4=SRC_NOT_SUPPORTED
                      // Remove video if it's a format error, decode error, or invalid source
                      if (errorCode === 4 || errorCode === 3 || videoUrl?.startsWith('blob:')) {
                        toast.error('Video format not supported or expired. Removing from library.');
                        
                        // Remove the invalid video from the list
                        const updatedVideos = videos.filter(v => v.id !== selectedVideo.id);
                        setVideos(updatedVideos);
                        localStorage.setItem('aiVideos', JSON.stringify(updatedVideos));
                        
                        // Select another video if available
                        if (updatedVideos.length > 0) {
                          setSelectedVideo(updatedVideos[0]);
                        } else {
                          setSelectedVideo(null);
                        }
                      } else if (errorCode === 2) {
                        toast.error('Network error loading video. Check your connection.');
                      } else {
                        toast.error('Failed to load video: ' + errorMsg);
                      }
                    }}
                    onLoadedData={() => {
                      console.log('Video loaded successfully:', selectedVideo.url || selectedVideo.videoUrl);
                      if (videoRef.current) {
                        setDuration(videoRef.current.duration || 5);
                      }
                    }}
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        setDuration(videoRef.current.duration || 5);
                      }
                    }}
                  />
                ) : (
                  <div className="preview-empty-state">
                    <div className="empty-icon-wrapper">
                      <FiVideo />
                    </div>
                    <h3>No Video Selected</h3>
                    <p>Choose from your saved videos or upload a new file</p>
                    <div className="empty-state-actions">
                      {videos.length > 0 && (
                        <button 
                          className="empty-state-btn primary"
                          onClick={() => setShowMobileVideoPicker(true)}
                        >
                          <FiVideo /> Add Video
                        </button>
                      )}
                      <label className="empty-state-btn outline">
                        <FiPlus /> Upload File
                        <input 
                          type="file" 
                          accept="video/*" 
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              const newVideo = {
                                id: Date.now(),
                                url,
                                prompt: file.name,
                                createdAt: new Date().toISOString(),
                                duration: 5
                              };
                              const updated = [newVideo, ...videos];
                              setVideos(updated);
                              setSelectedVideo(newVideo);
                              localStorage.setItem('aiVideos', JSON.stringify(updated));
                            }
                          }}
                        />
                      </label>
                      <button 
                        className="empty-state-btn secondary"
                        onClick={() => navigate('/app/ai-video')}
                      >
                        <FiZap /> Generate New
                      </button>
                    </div>
                  </div>
                )}
                    
                {/* Text Overlays Container - Only show when NOT rendered (preview mode only) */}
                {selectedVideo && textOverlays.length > 0 && !renderedVideoUrl && (
                  <div 
                    className="text-overlays-container"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      pointerEvents: 'none',
                      zIndex: 15
                    }}
                  >
                    {textOverlays.map(overlay => {
                      // Only show if within time range
                      if (currentTime < overlay.startTime || currentTime > overlay.endTime) {
                        return null;
                      }
                      
                      const pos = overlay.position || 'bottom-center';
                      const offsetX = overlay.offsetX || 0;
                      const offsetY = overlay.offsetY || 0;
                      // Scale down font size for preview (preview is smaller than actual video)
                      // Actual video is ~1080px wide, preview is ~300px, so scale by ~0.35
                      const fontSize = Math.round((overlay.fontSize || 24) * 0.4);
                      
                      // Build style object based on 9-grid position
                      let style = {
                        position: 'absolute',
                        fontSize: `${fontSize}px`,
                        maxWidth: '85%',
                        wordWrap: 'break-word',
                        textAlign: 'center',
                        pointerEvents: 'auto',
                        padding: '4px 8px'
                      };
                      
                      // TOP ROW
                      if (pos === 'top-left') {
                        style.top = `calc(5% + ${offsetY * 0.4}px)`;
                        style.left = `calc(5% + ${offsetX * 0.4}px)`;
                      } else if (pos === 'top-center') {
                        style.top = `calc(5% + ${offsetY * 0.4}px)`;
                        style.left = '50%';
                        style.transform = `translateX(calc(-50% + ${offsetX * 0.4}px))`;
                      } else if (pos === 'top-right') {
                        style.top = `calc(5% + ${offsetY * 0.4}px)`;
                        style.right = `calc(5% - ${offsetX * 0.4}px)`;
                      }
                      // MIDDLE ROW  
                      else if (pos === 'center-left') {
                        style.top = '50%';
                        style.left = `calc(5% + ${offsetX * 0.4}px)`;
                        style.transform = `translateY(calc(-50% + ${offsetY * 0.4}px))`;
                      } else if (pos === 'center') {
                        style.top = '50%';
                        style.left = '50%';
                        style.transform = `translate(calc(-50% + ${offsetX * 0.4}px), calc(-50% + ${offsetY * 0.4}px))`;
                      } else if (pos === 'center-right') {
                        style.top = '50%';
                        style.right = `calc(5% - ${offsetX * 0.4}px)`;
                        style.transform = `translateY(calc(-50% + ${offsetY * 0.4}px))`;
                      }
                      // BOTTOM ROW
                      else if (pos === 'bottom-left') {
                        style.bottom = `calc(12% - ${offsetY * 0.4}px)`;
                        style.left = `calc(5% + ${offsetX * 0.4}px)`;
                      } else if (pos === 'bottom-center') {
                        style.bottom = `calc(12% - ${offsetY * 0.4}px)`;
                        style.left = '50%';
                        style.transform = `translateX(calc(-50% + ${offsetX * 0.4}px))`;
                      } else if (pos === 'bottom-right') {
                        style.bottom = `calc(12% - ${offsetY * 0.4}px)`;
                        style.right = `calc(5% - ${offsetX * 0.4}px)`;
                      }
                      
                      return (
                        <div 
                          key={overlay.id} 
                          className={`preview-text-overlay style-${overlay.style || 'modern'}`}
                          style={style}
                        >
                          {overlay.text}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Subtitles */}
                {selectedVideo && subtitles.map(sub => (
                  currentTime >= sub.startTime && currentTime <= sub.endTime && (
                    <div key={sub.id} className="preview-subtitle">
                      {sub.text}
                    </div>
                  )
                ))}

                {/* Play button overlay */}
                {selectedVideo && (
                  <div className="hero-play-overlay" onClick={togglePlay}>
                    <div className="hero-play-btn">
                      {isPlaying ? <FiPause /> : <FiPlay />}
                    </div>
                  </div>
                )}

                {/* Music indicator */}
                {musicTrack && (
                  <div className="hero-music-badge">
                    <FiMusic /> {musicTrack.name}
                  </div>
                )}
              </div>
            </div>

            {/* Playback Controls Bar */}
            <div className="playback-controls-bar">
              <div className="controls-left">
                <button className="play-pause-btn" onClick={togglePlay} disabled={!selectedVideo}>
                  {isPlaying ? <FiPause /> : <FiPlay />}
                </button>
                <span className="time-display-hero">
                  {formatTime(currentTime)} / {formatTime(duration || 5)}
                </span>
                
                {/* Add New Video Button */}
                <label className="add-new-video-btn" title="Add new video">
                  <FiPlus />
                  <input 
                    type="file" 
                    accept="video/*" 
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  />
                </label>
              </div>

              <div className="controls-right">
                {/* Playback Speed */}
                <div className="speed-control">
                  <button 
                    className="speed-btn" 
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  >
                    {playbackSpeed}x <FiChevronDown />
                  </button>
                  {showSpeedMenu && (
                    <div className="speed-dropdown">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                        <button 
                          key={speed}
                          className={`speed-option ${playbackSpeed === speed ? 'active' : ''}`}
                          onClick={() => {
                            handlePlaybackSpeedChange(speed);
                            setShowSpeedMenu(false);
                          }}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Volume Control */}
                <div className="volume-control">
                  <button className="volume-btn" onClick={toggleMute}>
                    {isMuted || videoVolume === 0 ? <FiVolumeX /> : <FiVolume2 />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : videoVolume}
                    onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                    className="volume-slider"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Scrubber Timeline Section - Apple Style */}
          <div className="scrubber-timeline-section">
            <div className="scrubber-timeline-header">
              <span className="timeline-label">Timeline</span>
              <span className="timeline-duration">{formatTime(duration || 5)}</span>
            </div>
            
            {/* Timeline Ruler */}
            <div className="timeline-ruler">
              {[...Array(11)].map((_, i) => (
                <div key={i} className="ruler-mark">
                  <span>{formatTime((duration || 5) * (i / 10))}</span>
                </div>
              ))}
            </div>
            
            {/* Main Timeline Track */}
            <div className="timeline-track-modern" onClick={selectedVideo ? handleSeek : undefined}>
              {/* Progress overlay */}
              <div 
                className="timeline-progress-modern" 
                style={{ width: `${(currentTime / (duration || 5)) * 100}%` }}
              />
              
              {/* Playhead */}
              <div 
                className="timeline-playhead-modern"
                style={{ left: `${(currentTime / (duration || 5)) * 100}%` }}
              >
                <div className="playhead-handle" />
              </div>

              {/* Video Clip Chip */}
              {selectedVideo && (
                <div className="timeline-chip video-chip">
                  <div className="chip-icon"><FiVideo /></div>
                  <span className="chip-label">Video</span>
                  <div className="chip-resize-handle left" />
                  <div className="chip-resize-handle right" />
                </div>
              )}
              
              {/* Music Clip Chip */}
              {musicTrack && (
                <div className="timeline-chip music-chip">
                  <div className="chip-icon"><FiMusic /></div>
                  <span className="chip-label">{musicTrack.name}</span>
                  <div className="chip-resize-handle left" />
                  <div className="chip-resize-handle right" />
                </div>
              )}
              
              {/* Text Overlay Chips */}
              {textOverlays.map(overlay => (
                <div 
                  key={overlay.id}
                  className="timeline-chip text-chip"
                  style={{ 
                    left: `${(overlay.startTime / (duration || 5)) * 100}%`,
                    width: `${((overlay.endTime - overlay.startTime) / (duration || 5)) * 100}%`
                  }}
                >
                  <div className="chip-icon"><FiType /></div>
                  <span className="chip-label">{overlay.text.slice(0, 10)}</span>
                  <div className="chip-resize-handle left" />
                  <div className="chip-resize-handle right" />
                </div>
              ))}

              {/* Subtitle Chips */}
              {subtitles.map(sub => (
                <div 
                  key={sub.id}
                  className="timeline-chip subtitle-chip"
                  style={{ 
                    left: `${(sub.startTime / (duration || 5)) * 100}%`,
                    width: `${((sub.endTime - sub.startTime) / (duration || 5)) * 100}%`
                  }}
                >
                  <div className="chip-icon"><FiType /></div>
                  <span className="chip-label">Sub</span>
                  <div className="chip-resize-handle left" />
                  <div className="chip-resize-handle right" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Editing Tools Card */}
        <aside className="editing-tools-card">
            <div className="tools-card-header">
              <h3>Edit Tools</h3>
            </div>
            
            <div className="tool-tabs-container">
              <div className="tool-tabs">
                <button 
                  className={`tool-tab ${activePanel === 'music' ? 'active' : ''}`}
                  onClick={() => setActivePanel('music')}
                >
                  <FiMusic />
                  <span>Music</span>
                </button>
                <button 
                  className={`tool-tab ${activePanel === 'sounds' ? 'active' : ''}`}
                  onClick={() => setActivePanel('sounds')}
                >
                  <FiVolume2 />
                  <span>Sounds</span>
                </button>
                <button 
                  className={`tool-tab ${activePanel === 'text' ? 'active' : ''}`}
                  onClick={() => setActivePanel('text')}
                >
                  <FiType />
                  <span>Text</span>
                </button>
                <button 
                  className={`tool-tab ${activePanel === 'subtitles' ? 'active' : ''}`}
                  onClick={() => setActivePanel('subtitles')}
                >
                  <FiType />
                  <span>Subtitles</span>
                </button>
                <button 
                  className={`tool-tab ${activePanel === 'styles' ? 'active' : ''}`}
                  onClick={() => setActivePanel('styles')}
                >
                  <FiZap />
                  <span>Styles</span>
                </button>
              </div>
            </div>

            <div className="tool-panel-content">
              {/* Music Panel */}
              {activePanel === 'music' && (
                <div className="panel-content">
                  {musicTrack && (
                    <div className="selected-music">
                      <div className="music-info">
                        <span className="music-icon">{musicTrack.icon}</span>
                        <span>{musicTrack.name}</span>
                      </div>
                      <div className="volume-slider">
                        <FiVolume2 />
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={musicVolume}
                          onChange={(e) => setMusicVolume(parseInt(e.target.value))}
                        />
                        <span>{musicVolume}%</span>
                      </div>
                      <button className="remove-music" onClick={() => setMusicTrack(null)}>
                        <FiX />
                      </button>
                    </div>
                  )}
                  <div className="music-grid">
                    {musicLibrary.map(track => (
                      <div 
                        key={track.id}
                        className={`music-card ${musicTrack?.id === track.id ? 'selected' : ''}`}
                      >
                        <button 
                          className={`music-preview-btn ${playingPreviewId === `music-${track.id}` ? 'playing' : ''}`}
                          onClick={() => playPreview(`music-${track.id}`, track.audioUrl)}
                          title={playingPreviewId === `music-${track.id}` ? 'Stop preview' : 'Preview'}
                        >
                          {playingPreviewId === `music-${track.id}` ? <FiPause /> : <FiPlay />}
                        </button>
                        <div className="music-info-col" onClick={() => { selectMusic(track); }}>
                          <span className="music-icon">{track.icon}</span>
                          <span className="music-name">{track.name}</span>
                          <span className="music-mood">{track.mood}</span>
                        </div>
                        <button 
                          className="music-add-btn"
                          onClick={() => { selectMusic(track); }}
                          title="Add to timeline"
                        >
                          <FiPlus />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sounds Panel */}
              {activePanel === 'sounds' && (
                <div className="panel-content">
                  <div className="sounds-grid">
                    {soundsLibrary.map(sound => (
                      <div 
                        key={sound.id}
                        className="sound-card"
                      >
                        <button 
                          className={`sound-preview-btn ${playingPreviewId === `sound-${sound.id}` ? 'playing' : ''}`}
                          onClick={() => playPreview(`sound-${sound.id}`, sound.audioUrl)}
                          title={playingPreviewId === `sound-${sound.id}` ? 'Stop preview' : 'Preview'}
                        >
                          {playingPreviewId === `sound-${sound.id}` ? <FiPause /> : <FiPlay />}
                        </button>
                        <div className="sound-info" onClick={() => { addSoundEffect(sound); }}>
                          <span className="sound-icon">{sound.icon}</span>
                          <span className="sound-name">{sound.name}</span>
                        </div>
                        <button 
                          className="sound-add-btn"
                          onClick={() => { addSoundEffect(sound); }}
                          title="Add to timeline"
                        >
                          <FiPlus />
                        </button>
                      </div>
                    ))}
                  </div>
                  {soundEffects.length > 0 && (
                    <div className="added-sounds">
                      <h4>Added Effects</h4>
                      {soundEffects.map(effect => (
                        <div key={effect.instanceId} className="sound-item">
                          <span>{effect.icon} {effect.name}</span>
                          <span className="sound-time">@ {formatTime(effect.time)}</span>
                          <button onClick={() => setSoundEffects(soundEffects.filter(s => s.instanceId !== effect.instanceId))}>
                            <FiX />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Text Panel */}
              {activePanel === 'text' && (
                <div className="panel-content">
                  <button className="add-element-btn" onClick={addTextOverlay}>
                    <FiPlus /> Add Text
                  </button>
                  <div className="text-styles">
                    {textStyles.map(style => (
                      <button key={style.id} className="style-btn">
                        <span className={`style-preview style-${style.id}`}>{style.preview}</span>
                        <span>{style.name}</span>
                      </button>
                    ))}
                  </div>
                  {textOverlays.length > 0 && (
                    <div className="text-list">
                      {textOverlays.map(overlay => (
                        <div key={overlay.id} className="text-item-enhanced">
                          <div className="text-item-row">
                            <input 
                              type="text" 
                              value={overlay.text}
                              placeholder="Enter text..."
                              className="text-input-main"
                              onChange={(e) => {
                                setTextOverlays(textOverlays.map(t => 
                                  t.id === overlay.id ? { ...t, text: e.target.value } : t
                                ));
                              }}
                            />
                            <button className="text-delete-btn" onClick={() => setTextOverlays(textOverlays.filter(t => t.id !== overlay.id))}>
                              <FiX />
                            </button>
                          </div>
                          
                          {/* Visual 9-Grid Position Picker */}
                          <div className="position-picker-container">
                            <label>Position</label>
                            <div className="position-grid-9">
                              {[
                                { pos: 'top-left', label: '↖' },
                                { pos: 'top-center', label: '↑' },
                                { pos: 'top-right', label: '↗' },
                                { pos: 'center-left', label: '←' },
                                { pos: 'center', label: '●' },
                                { pos: 'center-right', label: '→' },
                                { pos: 'bottom-left', label: '↙' },
                                { pos: 'bottom-center', label: '↓' },
                                { pos: 'bottom-right', label: '↘' }
                              ].map(({ pos, label }) => (
                                <button
                                  key={pos}
                                  className={`position-btn ${(overlay.position || 'bottom-center') === pos ? 'active' : ''}`}
                                  onClick={() => {
                                    setTextOverlays(textOverlays.map(t => 
                                      t.id === overlay.id ? { ...t, position: pos } : t
                                    ));
                                  }}
                                  title={pos.replace('-', ' ')}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Font Size Slider */}
                          <div className="text-item-controls">
                            <div className="control-group size-control">
                              <label>Font Size</label>
                              <div className="size-slider-row">
                                <input 
                                  type="range" 
                                  min="16" 
                                  max="80" 
                                  value={overlay.fontSize || 42}
                                  onChange={(e) => {
                                    setTextOverlays(textOverlays.map(t => 
                                      t.id === overlay.id ? { ...t, fontSize: parseInt(e.target.value) } : t
                                    ));
                                  }}
                                />
                                <span className="size-value">{overlay.fontSize || 42}px</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Fine-tune Offsets */}
                          <div className="text-item-offsets">
                            <div className="offset-group">
                              <label>Fine-tune X</label>
                              <div className="offset-input-row">
                                <button 
                                  className="offset-btn"
                                  onClick={() => setTextOverlays(textOverlays.map(t => 
                                    t.id === overlay.id ? { ...t, offsetX: (t.offsetX || 0) - 10 } : t
                                  ))}
                                >−</button>
                                <input 
                                  type="number" 
                                  value={overlay.offsetX || 0}
                                  onChange={(e) => {
                                    setTextOverlays(textOverlays.map(t => 
                                      t.id === overlay.id ? { ...t, offsetX: parseInt(e.target.value) || 0 } : t
                                    ));
                                  }}
                                />
                                <button 
                                  className="offset-btn"
                                  onClick={() => setTextOverlays(textOverlays.map(t => 
                                    t.id === overlay.id ? { ...t, offsetX: (t.offsetX || 0) + 10 } : t
                                  ))}
                                >+</button>
                              </div>
                            </div>
                            <div className="offset-group">
                              <label>Fine-tune Y</label>
                              <div className="offset-input-row">
                                <button 
                                  className="offset-btn"
                                  onClick={() => setTextOverlays(textOverlays.map(t => 
                                    t.id === overlay.id ? { ...t, offsetY: (t.offsetY || 0) - 10 } : t
                                  ))}
                                >−</button>
                                <input 
                                  type="number" 
                                  value={overlay.offsetY || 0}
                                  onChange={(e) => {
                                    setTextOverlays(textOverlays.map(t => 
                                      t.id === overlay.id ? { ...t, offsetY: parseInt(e.target.value) || 0 } : t
                                    ));
                                  }}
                                />
                                <button 
                                  className="offset-btn"
                                  onClick={() => setTextOverlays(textOverlays.map(t => 
                                    t.id === overlay.id ? { ...t, offsetY: (t.offsetY || 0) + 10 } : t
                                  ))}
                                >+</button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Time Range */}
                          <div className="text-time-range">
                            <div className="time-input-group">
                              <label>Start</label>
                              <input 
                                type="number" 
                                step="0.1"
                                min="0"
                                max={duration || 10}
                                value={overlay.startTime || 0}
                                onChange={(e) => {
                                  setTextOverlays(textOverlays.map(t => 
                                    t.id === overlay.id ? { ...t, startTime: parseFloat(e.target.value) || 0 } : t
                                  ));
                                }}
                              />
                              <span>s</span>
                            </div>
                            <span className="time-separator">→</span>
                            <div className="time-input-group">
                              <label>End</label>
                              <input 
                                type="number" 
                                step="0.1"
                                min="0"
                                max={duration || 10}
                                value={overlay.endTime || 5}
                                onChange={(e) => {
                                  setTextOverlays(textOverlays.map(t => 
                                    t.id === overlay.id ? { ...t, endTime: parseFloat(e.target.value) || 5 } : t
                                  ));
                                }}
                              />
                              <span>s</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Subtitles Panel */}
              {activePanel === 'subtitles' && (
                <div className="panel-content">
                  <button className="add-element-btn" onClick={addSubtitle}>
                    <FiPlus /> Add Subtitle
                  </button>
                  {subtitles.length > 0 && (
                    <div className="subtitle-list">
                      {subtitles.map(sub => (
                        <div key={sub.id} className="subtitle-item">
                          <input 
                            type="text" 
                            value={sub.text}
                            onChange={(e) => {
                              setSubtitles(subtitles.map(s => 
                                s.id === sub.id ? { ...s, text: e.target.value } : s
                              ));
                            }}
                          />
                          <span className="sub-time">
                            {formatTime(sub.startTime)} - {formatTime(sub.endTime)}
                          </span>
                          <button onClick={() => setSubtitles(subtitles.filter(s => s.id !== sub.id))}>
                            <FiX />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Styles Panel */}
              {activePanel === 'styles' && (
                <div className="panel-content">
                  <div className="styles-section">
                    <h4 className="section-label">Video Filters</h4>
                    <div className="filter-grid">
                      <button className="filter-btn active">
                        <div className="filter-preview original"></div>
                        <span>Original</span>
                      </button>
                      <button className="filter-btn">
                        <div className="filter-preview cinematic"></div>
                        <span>Cinematic</span>
                      </button>
                      <button className="filter-btn">
                        <div className="filter-preview vintage"></div>
                        <span>Vintage</span>
                      </button>
                      <button className="filter-btn">
                        <div className="filter-preview noir"></div>
                        <span>B&W</span>
                      </button>
                      <button className="filter-btn">
                        <div className="filter-preview warm"></div>
                        <span>Warm</span>
                      </button>
                      <button className="filter-btn">
                        <div className="filter-preview cool"></div>
                        <span>Cool</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="styles-section">
                    <h4 className="section-label">Adjustments</h4>
                    <div className="adjustment-controls">
                      <div className="adjustment-row">
                        <span>Brightness</span>
                        <input type="range" min="-100" max="100" defaultValue="0" />
                        <span className="adj-value">0</span>
                      </div>
                      <div className="adjustment-row">
                        <span>Contrast</span>
                        <input type="range" min="-100" max="100" defaultValue="0" />
                        <span className="adj-value">0</span>
                      </div>
                      <div className="adjustment-row">
                        <span>Saturation</span>
                        <input type="range" min="-100" max="100" defaultValue="0" />
                        <span className="adj-value">0</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="tools-action-bar">
              {!isRendered ? (
                <button 
                  className="render-btn"
                  onClick={handleRender}
                  disabled={isRendering || !selectedVideo}
                >
                  {isRendering ? (
                    <>
                      <FiLoader className="spin" /> Rendering {Math.round(renderProgress)}%
                    </>
                  ) : (
                    <>
                      <FiCheck /> Render Video
                    </>
                  )}
                </button>
              ) : (
                <div className="export-actions-wrapper">
                  {/* Debug: Show rendered URL */}
                  <div className="rendered-url-debug" style={{
                    fontSize: '10px',
                    color: '#9ca3af',
                    wordBreak: 'break-all',
                    marginBottom: '8px',
                    padding: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '6px',
                    maxHeight: '60px',
                    overflow: 'auto'
                  }}>
                    <strong>Debug URL:</strong><br/>
                    {renderedVideoUrl}
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(renderedVideoUrl);
                        toast.success('URL copied!');
                      }}
                      style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        fontSize: '9px',
                        background: '#8b5cf6',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  
                  <div className="export-actions">
                    <button className="action-btn save" onClick={handleSaveVideo}>
                      <FiSave /> Save
                    </button>
                    <button className="action-btn download" onClick={handleDownload}>
                      <FiDownload /> Download
                    </button>
                    <button className="action-btn instagram" onClick={handlePostToInstagram}>
                      <FiInstagram /> Post
                    </button>
                  </div>
                  
                  {/* Edit Again button */}
                  <button 
                    className="edit-again-btn"
                    onClick={() => {
                      setIsRendered(false);
                      setRenderedVideoUrl(null);
                      toast.info('You can now edit the video again');
                    }}
                    style={{
                      marginTop: '8px',
                      padding: '8px 16px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      fontSize: '12px',
                      width: '100%'
                    }}
                  >
                    ← Edit Again
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Mobile Video Picker Modal */}
        {showMobileVideoPicker && (
          <div className="mobile-video-picker-overlay" onClick={() => setShowMobileVideoPicker(false)}>
            <div className="mobile-video-picker-modal" onClick={(e) => e.stopPropagation()}>
              <div className="picker-header">
                <h3>Select Video</h3>
                <button className="picker-close" onClick={() => setShowMobileVideoPicker(false)}>
                  <FiX />
                </button>
              </div>
              <div className="picker-videos-grid">
                {videos.length > 0 ? (
                  videos.map((video) => (
                    <div 
                      key={video.id} 
                      className={`picker-video-card ${selectedVideo?.id === video.id ? 'selected' : ''}`}
                    >
                      <div 
                        className="picker-video-thumbnail"
                        onClick={() => handleSelectVideoFromPicker(video)}
                      >
                        <video 
                          src={video.url || video.videoUrl} 
                          muted 
                          playsInline
                          preload="metadata"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div className="picker-play-icon"><FiPlay /></div>
                      </div>
                      <div className="picker-video-info">
                        <span className="picker-video-title">{video.prompt?.slice(0, 25) || 'Untitled'}...</span>
                        <span className="picker-video-date">
                          {new Date(video.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="picker-video-actions">
                        <button 
                          className="picker-add-btn"
                          onClick={() => handleSelectVideoFromPicker(video)}
                          title="Add to preview"
                        >
                          <FiPlus /> Add
                        </button>
                        <button 
                          className="picker-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVideo(video.id);
                          }}
                          title="Delete video"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="picker-empty">
                    <FiVideo />
                    <p>No videos yet</p>
                    <button onClick={() => { setShowMobileVideoPicker(false); navigate('/app/ai-video'); }}>
                      Generate Your First Video
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    );
  };
  
  export default VideoEdit;
