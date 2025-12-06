# InstaMarketing AI Agent Instructions

## Architecture Overview

**Monorepo Structure**: React SPA client + Express/Node.js API server + MongoDB

```
/                    # Root with dev scripts (npm run dev starts both)
├── client/          # React 18 app (CRA), proxies /api to server:5000
├── server/          # Express API with MongoDB/Mongoose
└── api/             # Vercel serverless entry point (production)
```

**Key Data Flow**:
1. Client → `/api/*` → Server routes → Services → External APIs (OpenAI, Replicate, Shotstack, Cloudinary)
2. Video generation is async: Replicate creates video → polls status → Shotstack adds music/subtitles → Cloudinary stores final

## Critical Services Architecture

### Master Brain (`server/src/services/masterBrain.js`)
Central AI content generation system. ALL AI features use this unified prompt system for consistency. See `MASTER_BRAIN_CHEATSHEET.md` for copy-paste prompts.

### Video Pipeline
- **Replicate** (`replicate.js`): AI video generation (Luma, Kling models)
- **Shotstack** (`shotstackClient.js`): Cloud video processing (music, subtitles) - required for Vercel deployment
- **FFmpeg** (`videoPipeline.js`): Local video processing fallback (development only)
- **Cloudinary** (`cloudinary.js`): All media storage - Replicate URLs expire, always upload to Cloudinary

### Authentication
JWT-based auth in `server/src/middleware/auth.js`. Token stored in localStorage, auto-attached via axios interceptor in `client/src/services/api.js`.

## Development Commands

```bash
# Start both client and server (recommended)
npm run dev

# Install all dependencies (root + client + server)
npm run install-all

# Server only (port 5000)
cd server && npm run dev

# Client only (port 3000, proxies to 5000)
cd client && npm start

# Production build
npm run build
```

## Environment Variables

**Required in `server/.env`**:
```
MONGODB_URI=          # MongoDB Atlas connection
JWT_SECRET=           # Auth token signing
OPENAI_API_KEY=       # Content generation
REPLICATE_API_TOKEN=  # AI video generation
CLOUDINARY_*=         # Media storage (CLOUD_NAME, API_KEY, API_SECRET)
```

**Optional for full features**:
```
ELEVENLABS_API_KEY=   # AI voiceover
SHOTSTACK_API_KEY=    # Cloud video rendering (required for Vercel)
PEXELS_API_KEY=       # Stock video search
```

## Key Patterns

### API Route Structure
Routes in `server/src/routes/` follow pattern: auth middleware → validation → service call → response
```javascript
router.post('/endpoint', auth, async (req, res) => {
  const result = await someService.method(req.body);
  res.json(result);
});
```

### Client API Calls
Use axios instance from `client/src/services/api.js` - auto-handles auth and base URL:
```javascript
import api from '../services/api';
const response = await api.post('/some-endpoint', data);
```

### Video Generation Flow
1. User submits prompt → `POST /api/ai-video/generate`
2. Replicate starts async generation → returns predictionId
3. Client polls `POST /api/ai-video/status` with predictionId
4. On success: upload to Cloudinary (Replicate URLs expire!)
5. If music/subtitles: Shotstack renders final video

### React Component Patterns
- Pages in `client/src/pages/`, components in `client/src/components/`
- Each feature has paired `.js` and `.css` files
- Auth context: `useAuth()` from `context/AuthContext.js`
- Theme context: `useTheme()` from `context/ThemeContext.js`

## Serverless Considerations (Vercel)

- **Stateless**: No in-memory state persists between requests
- **Timeouts**: 10s default, 120s max (configured in `vercel.json`)
- **FFmpeg unavailable**: Use Shotstack for video processing in production
- **DB connection**: Reuse via `isConnected` check in `server/src/index.js`

## External API Integration Points

| Service | Purpose | Config | Key File |
|---------|---------|--------|----------|
| OpenAI | Captions, scripts, content | `OPENAI_API_KEY` | `services/openai.js` |
| Replicate | AI video generation | `REPLICATE_API_TOKEN` | `services/replicate.js` |
| Shotstack | Video rendering | `SHOTSTACK_API_KEY` | `services/shotstackClient.js` |
| Cloudinary | Media storage | `CLOUDINARY_*` | `services/cloudinary.js` |
| ElevenLabs | AI voiceover | `ELEVENLABS_API_KEY` | `services/elevenlabs.js` |
| Pexels/Pixabay | Stock videos | `PEXELS_API_KEY` | `services/stockVideoService.js` |

## Common Tasks

**Adding a new API endpoint**:
1. Create route in `server/src/routes/`
2. Register in `server/src/index.js`
3. Add service logic in `server/src/services/`
4. Call from client via `api.post('/api/your-route')`

**Adding a new page**:
1. Create `PageName.js` and `PageName.css` in `client/src/pages/`
2. Add route in `client/src/App.js`
3. Wrap with `<Layout>` for consistent navigation

**Video with music/subtitles**:
Always use Shotstack path (`services/shotstackClient.js`) - FFmpeg only works locally.
