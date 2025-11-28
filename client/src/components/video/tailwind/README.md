# Video Pre-Generation Components Documentation

## Overview
These components allow users to add music and text captions before generating a video. The system uses Tailwind CSS for styling and includes modal dialogs for music selection and caption editing.

## Components

### 1. MusicSelectorModal
Modal for selecting background music from presets, uploading custom audio, or providing a URL.

**Props:**
- `isOpen` (boolean) - Whether modal is visible
- `onClose` (function) - Called when modal is closed
- `onSelect` (function) - Called with selected music object
- `selectedMusic` (object) - Currently selected music

### 2. TextCaptionEditorModal
Modal for adding timed text captions with styling and animation options.

**Props:**
- `isOpen` (boolean) - Whether modal is visible
- `onClose` (function) - Called when modal is closed
- `onSave` (function) - Called with array of captions
- `existingCaptions` (array) - Pre-existing captions
- `videoDuration` (number) - Video duration in seconds

### 3. VideoPreGenerationControls
Wrapper component with buttons and state management for both modals.

**Props:**
- `onPayloadChange` (function) - Called when music or captions change
- `videoDuration` (number) - Video duration in seconds
- `className` (string) - Additional CSS classes

## Hooks

### useVideoPreGeneration
State management for music selection and caption editing.

```javascript
const {
  selectedMusic,
  musicVolume,
  captions,
  handleMusicSelect,
  handleCaptionsSave,
  buildPayload,
  generateSRT,
  validateCaptions,
  isMusicModalOpen,
  setIsMusicModalOpen,
  isCaptionModalOpen,
  setIsCaptionModalOpen
} = useVideoPreGeneration(videoDuration);
```

### useVideoGeneration
Handles the video generation API calls with music and caption integration.

```javascript
const {
  isGenerating,
  progress,
  error,
  result,
  generateVideo,
  cancelGeneration,
  reset
} = useVideoGeneration();
```

## API Payload Structure

### Final Payload sent to `/api/video/generate`

```json
{
  "prompt": "A serene sunset over the ocean with gentle waves",
  "subject": "sunset",
  "action": "waves crashing",
  "style": "cinematic",
  "shotType": "wide",
  "cameraMovement": "static",
  "lighting": "golden_hour",
  "setting": "beach",
  "mood": "peaceful",
  "model": "damo-text2video",
  "numFrames": 16,
  "fps": 8,
  "guidanceScale": 7.5,
  
  "music": {
    "id": "cinematic-ambient",
    "url": "/audio/presets/cinematic-ambient.mp3",
    "name": "Cinematic Ambient",
    "volume": 0.7
  },
  
  "captions": [
    {
      "id": 1701234567890,
      "text": "Welcome to the beach",
      "startTime": 0,
      "endTime": 3,
      "style": {
        "fontSize": 24,
        "fontWeight": "normal",
        "color": "#FFFFFF",
        "background": "rgba(0,0,0,0.7)"
      },
      "animation": "fade",
      "position": "bottom"
    },
    {
      "id": 1701234567891,
      "text": "Watch the sunset",
      "startTime": 3.5,
      "endTime": 6,
      "style": {
        "fontSize": 28,
        "fontWeight": "bold",
        "color": "#FFFF00",
        "background": "rgba(0,0,0,0.9)"
      },
      "animation": "slide-up",
      "position": "center"
    }
  ],
  
  "subtitles": "1\n00:00:00,000 --> 00:00:03,000\nWelcome to the beach\n\n2\n00:00:03,500 --> 00:00:06,000\nWatch the sunset\n",
  
  "applyMusic": true,
  "applyCaptions": true
}
```

### Finalization Payload (sent to `/api/video/finalize`)

```json
{
  "videoUrl": "https://example.com/generated-video.mp4",
  "musicUrl": "/audio/presets/cinematic-ambient.mp3",
  "musicVolume": 0.7,
  "overlays": [
    {
      "text": "Welcome to the beach",
      "start": 0,
      "end": 3,
      "style": {
        "fontSize": 24,
        "fontWeight": "normal",
        "color": "#FFFFFF",
        "background": "rgba(0,0,0,0.7)"
      },
      "animation": "fade",
      "position": "bottom"
    }
  ],
  "subtitles": "1\n00:00:00,000 --> 00:00:03,000\nWelcome to the beach\n"
}
```

## Usage Example

```jsx
import React, { useState } from 'react';
import { VideoPreGenerationControls } from './components/video/tailwind';
import { useVideoGeneration } from './hooks/useVideoGeneration';

const MyVideoPage = () => {
  const [prompt, setPrompt] = useState('');
  const [preGenPayload, setPreGenPayload] = useState(null);
  const { generateVideo, isGenerating, result } = useVideoGeneration();

  const handleGenerate = async () => {
    await generateVideo({ prompt }, preGenPayload);
  };

  return (
    <div className="p-8">
      <textarea 
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter video prompt..."
        className="w-full p-4 bg-gray-800 rounded-xl"
      />
      
      {/* Music & Caption Controls */}
      <VideoPreGenerationControls
        videoDuration={30}
        onPayloadChange={setPreGenPayload}
      />
      
      <button 
        onClick={handleGenerate}
        disabled={isGenerating}
        className="mt-4 px-6 py-3 bg-purple-500 rounded-xl"
      >
        Generate Video
      </button>

      {result && (
        <video src={result.videoUrl} controls className="mt-4 w-full" />
      )}
    </div>
  );
};

export default MyVideoPage;
```

## Tailwind CSS Requirements

Make sure your `tailwind.config.js` includes:

```javascript
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#0a0a0f',
        }
      }
    },
  },
  plugins: [],
}
```

## File Structure

```
client/src/
├── components/
│   └── video/
│       └── tailwind/
│           ├── index.js
│           ├── MusicSelectorModal.jsx
│           ├── TextCaptionEditorModal.jsx
│           ├── VideoPreGenerationControls.jsx
│           └── VideoGeneratorPage.jsx
└── hooks/
    ├── useVideoPreGeneration.js
    └── useVideoGeneration.js
```
