# 🖼️ Image Muse - AI Image Gallery (v2.0)

A modern, AI-powered image gallery app that automatically generates titles, descriptions, and captions using Google Gemini. Upload images, extract metadata, search, edit, and download with watermarks.

## ✨ Key Features

- **Smart Image Upload** - Drag-and-drop multiple images (JPG, PNG, GIF, WebP)
- **AI-Powered Captions** - Auto-generate titles & descriptions with Google Gemini
- **EXIF Metadata** - Extract camera info, ISO, focal length, GPS coordinates
- **Advanced Search** - Filter by title, description, caption, or aspect ratio
- **Image Editing** - Inline editing with regenerate AI captions
- **Watermark Download** - Download images with custom watermark overlay
- **Dark Mode UI** - Glassmorphism design with smooth animations
- **Local Storage** - Persistent gallery using browser storage
- **Fully Responsive** - Works on mobile, tablet, and desktop

## 🛠️ Tech Stack

**Frontend:** React 18 + TypeScript | **Build:** Vite | **UI:** Tailwind CSS + shadcn/ui  
**AI:** Google Gemini API | **Backend:** Supabase Edge Functions | **Icons:** Lucide React

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Google Gemini API Key
- Supabase account (optional)

### Setup

```bash
# Clone repo
git clone https://github.com/yourusername/image-muse.git
cd image-muse

# Install dependencies
npm install  # or: bun install

# Create .env.local with your API keys
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-key
VITE_GEMINI_API_KEY=your-gemini-key
VITE_UNSPLASH_API_KEY=your-unsplash-key

# Start dev server
npm run dev  # or: bun run dev
```

App runs at: **http://localhost:8082**

## 📦 Available Scripts

```bash
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run test       # Run tests
npm run test:watch # Watch mode tests
```

## 🔐 Security

- ✅ All API keys in `.env.local` (ignored by Git)
- ✅ No sensitive data in source code
- ✅ Environment variables for configuration
- ✅ `.gitignore` properly configured
- ✅ Safe to push to GitHub

## 📝 License

MIT License - feel free to use this project!
