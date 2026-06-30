# 🎨 Image Muse

> AI-powered image gallery with intelligent metadata extraction, multi-provider AI fallback, and real-time discovery feeds.

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21.2-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/alanemohan/image-muse)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/alanemohan/image-muse)

---

## ✨ Features

> **Note:** GitHub shows this project as "84.7% TypeScript" because all React components are written in TypeScript (`.tsx` files). The actual stack is React 18 + TypeScript for the frontend.

### 🖼️ Smart Image Gallery
- **Secure Authentication** - JWT-based signup/signin with user profiles
- **Image Upload & Management** - Upload, organize, and manage your image library
- **AI-Powered Analysis** - Automatic title, description, caption, and tag generation
- **Multi-Provider AI** - Automatic fallback between Gemini, OpenRouter, and HuggingFace
- **Favorites System** - Save and organize your favorite images
- **Advanced Search** - Search by tags, metadata, and AI-generated content

### 🤖 AI Hub
- **Provider Health Monitoring** - Real-time status of all AI providers
- **Latency Metrics** - Track response times and performance
- **Model Discovery** - See available models from each provider
- **Fallback Visibility** - Understand which provider handled each request

### 🌍 Explore Page
- **NASA APOD** - Astronomy Picture of the Day with detailed descriptions
- **NASA Image Library** - Browse space imagery with AI-enhanced metadata
- **Free API Integration** - No API key required for basic features

### 📡 Pulse Page
- **Real-time Weather** - Current conditions powered by Open-Meteo API
- **Space News Feed** - Latest articles from Spaceflight News API
- **Live Updates** - Fresh content every visit

### 👤 User Features
- **Profile Management** - Customize your name and avatar
- **Settings Panel** - Configure auto-analysis, watermarks, and display preferences
- **Admin Dashboard** - System stats, user management, and AI logs (admin only)
- **Error Logs** - Track and debug AI operations (admin only)

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI with hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **Framer Motion** - Smooth animations
- **React Query** - Powerful data fetching

### Backend
- **Node.js + Express** - RESTful API server
- **SQLite + better-sqlite3** - Fast, embedded database
- **JWT** - Secure token-based authentication
- **Multer** - File upload handling
- **bcryptjs** - Password hashing
- **Zod** - Runtime validation

### AI Providers
- **Google Gemini** - Primary vision model (gemini-2.5-flash, gemini-2.0-flash)
- **OpenRouter** - Fallback with multiple models (Llama 3.2 Vision)
- **HuggingFace** - Caption generation (BLIP)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (recommend Node 22)
- npm or yarn
- Git

### Local Development

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/alanemohan/image-muse.git
cd image-muse
```

#### 2️⃣ Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
npm install --prefix server
```

#### 3️⃣ Configure Environment Variables

**Frontend (`.env`):**
```env
VITE_API_BASE_URL=http://localhost:4000
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_UNSPLASH_API_KEY=your-unsplash-api-key
VITE_NASA_API_KEY=DEMO_KEY
```

**Backend (`server/.env`):**
```env
PORT=4000
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
GEMINI_API_KEY=your-gemini-api-key
CORS_ORIGIN=http://localhost:5173
DB_PATH=./data.db
ADMIN_EMAILS=your-email@example.com

# Optional: Additional AI providers
OPENROUTER_API_KEY=
HUGGINGFACE_API_KEY=

# AI Model Configuration
GEMINI_MODELS=gemini-2.5-flash,gemini-2.0-flash
OPENROUTER_MODEL=meta-llama/llama-3.2-11b-vision-instruct:free
HUGGINGFACE_VISION_MODEL=Salesforce/blip-image-captioning-large
```

> **📝 Note:** Copy `.env.example` files as templates

#### 4️⃣ Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Visit **http://localhost:5173** 🎉

---

## 📦 Database

### SQLite Database
- **Location:** `server/data.db`
- **Tables:** users, images, favorites, user_settings, ai_logs
- **Persistence:** Automatic with WAL mode enabled

### Check Your Data
```bash
cd server
npm run check-db
```

This will show:
- 👥 Number of users
- 🖼️ Number of images
- ❤️ Number of favorites
- ⚙️ User settings
- 📝 AI operation logs

### GUI Tools (Optional)
Download [DB Browser for SQLite](https://sqlitebrowser.org/) to view/edit data visually.

---

## 🌐 Deployment

### Frontend (Vercel)

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/new)
   - Import your GitHub repository
   - Framework: **Vite**

2. **Environment Variables**
   ```env
   VITE_API_BASE_URL=https://your-backend-url.railway.app
   VITE_GEMINI_API_KEY=your-gemini-api-key
   VITE_UNSPLASH_API_KEY=your-unsplash-api-key
   VITE_NASA_API_KEY=DEMO_KEY
   ```

3. **Deploy** 🚀

### Backend (Railway)

1. **Create New Project**
   - Go to [Railway](https://railway.app)
   - New Project → Deploy from GitHub repo
   - Select `image-muse` repository

2. **Add Volume** (for SQLite persistence)
   - Service Settings → Volumes → New Volume
   - Mount path: `/app/server/data`
   - Size: 1GB (free tier)

3. **Environment Variables**
   ```env
   PORT=4000
   JWT_SECRET=your-super-secret-jwt-key
   GEMINI_API_KEY=your-gemini-api-key
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   DB_PATH=./data.db
   ADMIN_EMAILS=your-email@example.com
   ```

4. **Deploy** 🚀

5. **Update Frontend**
   - Copy your Railway URL (e.g., `https://image-muse.up.railway.app`)
   - Update `VITE_API_BASE_URL` in Vercel
   - Redeploy Vercel frontend

---

## 📚 API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Login
- `GET /auth/me` - Get current user
- `PATCH /auth/profile` - Update profile

### Images
- `GET /images` - List all user images
- `POST /images` - Create image record
- `PATCH /images/:id` - Update image
- `DELETE /images/:id` - Delete image
- `POST /images/bulk-delete` - Delete multiple images
- `POST /uploads` - Upload image file

### Favorites
- `GET /favorites` - List favorites
- `POST /favorites/:imageId` - Add to favorites
- `DELETE /favorites/:imageId` - Remove from favorites

### AI Operations
- `POST /analyze-image` - Analyze image with AI
- `GET /ai/providers` - Get provider status
- `POST /ai-chat` - AI chat interaction

### Admin (requires admin role)
- `GET /admin/stats` - System statistics
- `GET /admin/users` - List all users
- `GET /admin/logs` - AI operation logs

### User Settings
- `GET /settings` - Get user settings
- `PATCH /settings` - Update settings

---

## 🎯 Scripts

```bash
# Development
npm run dev              # Start frontend dev server
npm run dev --prefix server  # Start backend dev server

# Production
npm run build            # Build frontend
npm run preview          # Preview production build

# Backend
npm start --prefix server    # Start backend
npm run check-db --prefix server  # Inspect database

# Testing
npm run test             # Run tests
npm run test:watch       # Watch mode

# Linting
npm run lint             # Check code quality
```

---

## 🔐 Security

- **JWT Tokens** - 7-day expiration, secure HTTP-only recommended for production
- **Password Hashing** - bcryptjs with salt rounds
- **CORS Protection** - Configurable origin whitelist
- **Input Validation** - Zod schemas on all endpoints
- **File Upload Limits** - 10MB max per image
- **Rate Limiting** - AI provider timeout and retry logic
- **Admin-Only Routes** - Protected endpoints for sensitive operations

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Alane Mohan**
- GitHub: [@alanemohan](https://github.com/alanemohan)
- Email: alanemohan@gmail.com

---

## 🙏 Acknowledgments

- [Gemini AI](https://ai.google.dev/) - Primary vision model
- [OpenRouter](https://openrouter.ai/) - Multi-model API access
- [HuggingFace](https://huggingface.co/) - Open-source models
- [NASA APIs](https://api.nasa.gov/) - Space imagery and APOD
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Lucide Icons](https://lucide.dev/) - Icon library

---

## 📞 Support

If you encounter any issues or have questions:
- Open an [Issue](https://github.com/alanemohan/image-muse/issues)
- Check existing [Discussions](https://github.com/alanemohan/image-muse/discussions)

---

<div align="center">

**Made with ❤️ and AI**

⭐ Star this repo if you find it helpful!

</div>
