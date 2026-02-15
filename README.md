# Image Muse

AI-powered image gallery with multi-provider fallback and API-driven discovery pages.

## Stack
- Frontend: React + JavaScript + Vite + Tailwind CSS
- Backend: Node.js + Express + SQLite
- Auth: JWT
- AI Providers: Gemini, OpenRouter, HuggingFace, local fallback

## Core Features
- Secure signup/signin with profile and settings
- Image upload and gallery management
- AI title/description/caption generation with provider fallback
- Favorites, admin logs, and provider status monitoring
- Explore page (NASA APOD + NASA Image Library)
- Pulse page (Open-Meteo + Spaceflight News)
- AI Hub page (provider health and fallback visibility)

## Routes
- `/` Gallery
- `/explore` Free API discovery
- `/pulse` Live weather + space news
- `/ai-hub` AI provider status
- `/favorites`, `/profile`, `/settings`, `/about`

## Local Setup

### 1) Install
```bash
npm install
npm --prefix server install
```

### 2) Configure frontend env (`.env`)
```env
VITE_API_BASE_URL=http://localhost:4000
VITE_NASA_API_KEY=DEMO_KEY
```

### 3) Configure backend env (`server/.env`)
```env
PORT=4000
JWT_SECRET=replace-with-long-random-secret
DB_PATH=./data.db
CORS_ORIGIN=http://localhost:5173
ADMIN_EMAILS=

GEMINI_API_KEY=
OPENROUTER_API_KEY=
HUGGINGFACE_API_KEY=

GEMINI_MODELS=gemini-2.5-flash,gemini-2.0-flash
OPENROUTER_MODEL=meta-llama/llama-3.2-11b-vision-instruct:free
HUGGINGFACE_VISION_MODEL=Salesforce/blip-image-captioning-large
OPENROUTER_SITE_URL=http://localhost:5173
```

### 4) Run
```bash
# terminal 1
npm --prefix server run dev

# terminal 2
npm run dev
```

Frontend usually runs on `http://localhost:5173` and backend on `http://localhost:4000`.

## Scripts
```bash
npm run lint
npm run test
npm run build
```

## Notes
- Settings page stores OpenRouter and HuggingFace keys in localStorage for local development.
- If a provider fails or is rate-limited, backend automatically tries the next provider.
- `.env` files must stay local only; commit only `.env.example` files.
