# InstaMarketing AI Agent Instructions

## Architecture Overview

**Monorepo**: React SPA (client:3000) + Express API (server:5000) + MongoDB + Vercel serverless (api/)

```
/                    # npm run dev starts both client and server
├── client/          # React 18 (CRA), proxies /api → server:5000
├── server/          # Express API with Mongoose models
└── api/             # Vercel serverless entry (production only)
```

**Data Flow**: Client → `/api/*` → Routes → Services → External APIs (OpenAI, Replicate, Shotstack, Cloudinary)

## Critical Services

| Service | File | Purpose | Key Pattern |
|---------|------|---------|-------------|
| **Master Brain** | `server/src/services/masterBrain.js` | Central AI prompt system | All AI content uses unified prompts |
| **Replicate** | `services/replicate.js` | AI video generation (Kling) | Async polling via predictionId |
| **Shotstack** | `services/shotstackClient.js` | Cloud video render | Required for Vercel (no FFmpeg) |
| **Cloudinary** | `services/cloudinary.js` | Media storage | **Always upload** - Replicate URLs expire! |

## Video Generation Flow (Critical)

1. `POST /api/ai-video/generate` → Replicate creates async job → returns `predictionId`
2. Client polls `POST /api/ai-video/status` with `{ id, musicConfig, textConfig }` (stateless!)
3. On success: **Must upload to Cloudinary immediately** (Replicate URLs expire in hours)
4. If music/subtitles needed: Shotstack renders final video

## Development

```bash
npm run dev          # Starts both (recommended)
npm run install-all  # Install root + client + server deps
```

**Environment** (server/.env or root .env.local):
```
MONGODB_URI, JWT_SECRET, OPENAI_API_KEY, REPLICATE_API_TOKEN
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
SHOTSTACK_API_KEY (required for production video processing)
```

## Code Patterns

### API Routes (`server/src/routes/`)
```javascript
const { auth } = require('../middleware/auth');
router.post('/endpoint', auth, async (req, res) => {
  const result = await someService.method(req.body);
  res.json(result);
});
// Register in server/src/index.js
```

### Client API Calls (`client/src/services/api.js`)
```javascript
import api from '../services/api';  // Auto-attaches JWT from localStorage
const response = await api.post('/some-endpoint', data);
// For file uploads: { headers: { 'Content-Type': 'multipart/form-data' } }
```

### React Pages
- Create `PageName.js` + `PageName.css` in `client/src/pages/`
- Add route in `client/src/App.js` wrapped with `<Layout>`
- Use `useAuth()` for user state, `useTheme()` for dark/light mode

### Models (`server/src/models/`)
User, Post, Reel, Campaign, GeneratedVideo, VideoJob, AutoPilotDraft, ScheduledItem

## Vercel/Serverless Constraints

- **Stateless**: No in-memory state between requests (see `pendingPredictions` Map workaround in ai-video.js)
- **Timeouts**: 300s max configured in `vercel.json`
- **No FFmpeg**: Use Shotstack for all video processing
- **DB reuse**: Check `isConnected` before connecting (server/src/index.js middleware)

## Master Brain AI System

The `masterBrain.js` (1000+ lines) is the central AI intelligence. All content generation flows through it.

**Key exports to use:**
```javascript
const { MASTER_BRAIN_SYSTEM, BRAND_VOICE_LAYER, NICHE_LAYER } = require('./masterBrain');
// Use BRAND_VOICE_LAYER[voice].rules for tone: professional, casual, bold, inspiring, educational, humorous
// Use NICHE_LAYER[niche] for industry-specific vocabulary: business, fitness, lifestyle, tech, creative, finance, ecommerce
```

**Adding new AI features:**
1. Use `MASTER_BRAIN_SYSTEM` as the base system prompt
2. Add feature-specific instructions from `MASTER_BRAIN_CHEATSHEET.md`
3. Call via `openaiService.generateCaption()`, `generateReelScript()`, or `generateCarouselSlides()`

## Testing

Client uses React Testing Library (CRA default):
```bash
cd client && npm test    # Jest watch mode
```

Server has no test framework configured - manual testing via Postman/curl or test files:
- `server/test-replicate.js` - Test Replicate API
- `server/src/test-shotstack-render.js` - Test Shotstack rendering

## Environment Troubleshooting

**MongoDB connection fails:**
- Check `MONGODB_URI` format: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`
- Ensure IP is whitelisted in MongoDB Atlas Network Access

**Cloudinary upload fails:**
- All three vars required: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Find in Cloudinary Dashboard → Settings → API Keys

**Replicate video stuck:**
- Check `REPLICATE_API_TOKEN` at replicate.com → Account → API tokens
- Videos take 1-5 minutes; poll status, don't wait synchronously

**Shotstack render fails:**
- `SHOTSTACK_API_KEY` from shotstack.io dashboard
- Use sandbox API for testing: set `SHOTSTACK_HOST=https://api.shotstack.io/stage`

## Adding Features

**New API endpoint**: Create route → Register in index.js → Add service logic → Call from client

**New page**: Create Page.js + Page.css → Add route in App.js → Use Layout wrapper

**Video with effects**: Always use Shotstack (`shotstackClient.js`), never assume FFmpeg availability
