# 🖼️ AI Image Metadata & Caption Generator

A modern, AI-powered web application for uploading, analyzing, and managing images with automatic metadata extraction, smart captions, and rich gallery features.

## 🚀 Features

### 🖼️ Image Gallery Management
- Upload multiple images (JPG, PNG, GIF, WebP)
- Drag-and-drop upload support
- Responsive grid layout
- Full-screen preview modal with zoom & pan
- Auto-play image carousel with reordering

### 🤖 AI-Powered Image Analysis
- Automatic title, description, and caption generation
- Google Gemini AI integration
- EXIF metadata extraction:
  - Dimensions
  - Camera model
  - ISO, focal length
  - Date & GPS (if available)
- Smart fallback when AI is unavailable
- Retry logic with exponential backoff
- Confidence indicators

### 🔍 Search & Filtering
- Search by title, description, caption, or tags
- Sort by: Newest, Oldest, Title, Image size
- Filter by aspect ratio: Landscape, Portrait, Square
- Multi-select for bulk actions

### ✏️ Image Management
- Inline editing of title, description, and caption
- Regenerate AI captions
- Download images with watermark overlay
- Bulk delete support
- Local persistence using browser storage

### 🎨 UI & UX
- Dark mode enabled by default
- Glassmorphism UI style
- Animated transitions
- Dynamic Unsplash background images
- Fully responsive for mobile, tablet, and desktop

## 🧱 Tech Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **AI:** Google Gemini (gemini-1.5-flash)
- **Backend:** Supabase Edge Functions
- **State Management:** React Hooks
- **Icons:** Lucide React

## ⚡ Quick Start

### ✅ Prerequisites
- Node.js 18+ (or Bun)
- Google Gemini API Key
- Supabase account (for Edge Functions)

### 📥 Installation

```bash
# Clone the repository
git clone https://github.com/alanemohan/image-muse.git
cd image-muse

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun run dev
```

App runs at: 👉 **http://localhost:8082**

## 🔐 Environment Setup

Create a `.env.local` file:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-key
VITE_UNSPLASH_API_KEY=your-unsplash-key
```

⚠️ **Never commit .env files to GitHub.**

## ☁️ Supabase Edge Function Setup

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Link Project**
   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   ```

3. **Set Gemini API Key**
   ```bash
   supabase secrets set GEMINI_API_KEY=YOUR_API_KEY
   ```

4. **Deploy Function**
   ```bash
   supabase functions deploy analyze-image
   ```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Close preview |
| `+` | Zoom in |
| `-` | Zoom out |
| Drag | Pan image |

## ⚠️ Troubleshooting

### Images Not Showing
- Clear browser storage
- Refresh background image
- Check file formats

### AI Not Working
- Check API key in Supabase secrets
- Verify Edge Function deployment
- Check rate limits

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m "Add feature"`
4. Push: `git push origin feature/new-feature`
5. Open Pull Request

## 📄 License

MIT License — free to use, modify, and distribute
