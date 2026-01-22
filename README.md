# AI Image Metadata and Caption Generator

A powerful, modern web application for uploading, analyzing, and managing images with AI-powered metadata extraction, automatic caption generation, and intelligent image analysis.

## Features

### 🖼️ Image Gallery Management
- **Upload Multiple Images** - Drag-and-drop or click to upload JPG, PNG, GIF, WebP
- **Image Carousel** - Auto-play slideshow with manual navigation and thumbnail reordering
- **Grid View** - Responsive gallery grid (1-3 columns based on screen size)
- **Image Preview Modal** - Full-screen view with zoom (1x-3x), pan, and keyboard shortcuts

### 🤖 AI-Powered Analysis
- **Automatic Caption Generation** - Google Gemini AI generates intelligent captions
- **Metadata Extraction** - Extracts EXIF data: dimensions, camera model, ISO, focal length, GPS location, date
- **Smart Fallback** - When AI unavailable, generates captions from image metadata
- **Retry Logic** - Exponential backoff for transient failures (up to 3 attempts)
- **Confidence Scoring** - Shows AI confidence levels for extracted data

### 🎨 Advanced UI Features
- **Dark Mode** - Beautiful dark theme enabled by default
- **Dynamic Backgrounds** - Unsplash API integration for random background images
- **Glassmorphism Design** - Modern frosted glass effect on components
- **Smooth Animations** - 25+ CSS animations for polished UX
- **Responsive Design** - Works perfectly on mobile, tablet, and desktop

### 🔍 Search & Filter
- **Real-time Search** - Search by title, description, caption, or tags
- **Sort Options** - Sort by newest, oldest, title, or file size
- **Aspect Ratio Filter** - Filter landscape, portrait, or square images
- **Multi-Select** - Select multiple images for bulk operations

### ✏️ Image Management
- **Edit Metadata** - Update title, description, caption with inline editing
- **Regenerate Captions** - Re-analyze images with AI
- **Watermark Download** - Download images with custom watermarks
- **Bulk Delete** - Delete multiple images at once
- **Local Persistence** - Images persist in localStorage (converted to base64)

## Tech Stack

- **Frontend**: React 18.3 + TypeScript + Tailwind CSS
- **Build**: Vite 5.4 with SWC compiler
- **AI**: Google Gemini API (gemini-1.5-flash model)
- **Backend**: Supabase Edge Functions
- **State Management**: React Hooks
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Storage**: Browser localStorage + Supabase (optional)

## Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Google Gemini API key (free tier available)
- Supabase account (optional, for production)

### Installation

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

The application will be available at `http://localhost:8082`

## Configuration

### Step 1: Get Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key

### Step 2: Configure Supabase (Production)

For production deployment, you need to set up the Edge Function with your API key:

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link to your Supabase project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Set the API key as a secret:
   ```bash
   supabase secrets set GEMINI_API_KEY=your-api-key
   ```

4. Deploy the function:
   ```bash
   supabase functions deploy analyze-image
   ```

## Project Structure

```
image-muse/
├── src/
│   ├── components/
│   │   ├── gallery/
│   │   │   ├── ImageGallery.tsx          # Main gallery component
│   │   │   ├── ImageCard.tsx             # Individual image card
│   │   │   ├── ImageCarousel.tsx         # Auto-play carousel
│   │   │   ├── ImagePreviewModal.tsx     # Full-screen preview
│   │   │   ├── ImageUploader.tsx         # Drag-drop upload
│   │   │   ├── GallerySearch.tsx         # Search & filter
│   │   │   ├── MetadataDisplay.tsx       # EXIF data viewer
│   │   │   └── ...
│   │   └── ui/                           # shadcn/ui components
│   ├── hooks/
│   │   ├── useGallery.ts                 # Gallery state management
│   │   ├── useImageMetadata.ts           # EXIF extraction
│   │   └── use-toast.ts                  # Toast notifications
│   ├── services/
│   │   ├── imageAnalysis.ts              # AI API client
│   │   └── backgroundService.ts          # Unsplash integration
│   ├── types/
│   │   └── gallery.ts                    # TypeScript types
│   ├── pages/
│   │   └── Index.tsx                     # Home page
│   ├── App.tsx                           # Root component
│   └── main.tsx                          # Entry point
├── supabase/
│   └── functions/
│       └── analyze-image/                # Edge Function for AI
├── public/                               # Static assets
└── index.html                            # HTML template
```

## Usage

### Uploading Images

1. Click the upload area or drag images directly
2. Supported formats: JPG, PNG, GIF, WebP
3. Images are automatically analyzed by AI
4. Metadata is extracted and displayed

### Using the Carousel

- **Auto-play**: Automatically rotates through images every 5 seconds
- **Navigation**: Use arrow buttons to manually navigate
- **Reordering**: Drag thumbnails to reorder the gallery
- **Toggle**: Click play/pause button to stop auto-play

### Searching & Filtering

- Type in search box to filter by title, description, or tags
- Use dropdown menus to sort and filter by aspect ratio
- Multi-select images with checkboxes for bulk operations

### Editing Metadata

- Click any field to edit inline
- Click the metadata icon to see full EXIF data
- Confidence indicators show AI reliability scores
- Changes are saved automatically to localStorage

## API Reference

### Image Analysis
```typescript
analyzeImage(base64Image: string): Promise<AIAnalysisResult>
```

Analyzes an image and returns:
- `title` - Generated title
- `description` - Generated description
- `caption` - Generated caption
- `tags` - Generated tags
- `confidence` - Confidence score

### Background Service
```typescript
setBackgroundImage(): Promise<void>
setBackgroundImage(imageUrl: string): Promise<void>
initializeBackground(): Promise<void>
getBackgroundImage(): string | null
```

## Deployment

### Deploy to Vercel

```bash
vercel
```

### Deploy to Netlify

```bash
npm run build
# Then connect to Netlify
```

### Deploy to GitHub Pages

```bash
npm run build
# Configure GitHub Pages to deploy from /dist folder
```

## Environment Variables

For local development, create a `.env.local` file:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For production, use your hosting platform's environment variable settings.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Performance Optimization

- Images stored as base64 in localStorage (limit: ~5-10 images)
- For more images, use Supabase Storage
- Lazy loading for images in grid view
- Memoized components to prevent unnecessary re-renders
- CSS animations use GPU acceleration

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Esc` | Close preview modal |
| `+` or `=` | Zoom in |
| `-` | Zoom out |
| Click & Drag | Pan zoomed image |

## Error Handling

The app gracefully handles errors with user-friendly messages:

- **API Key Missing**: Shows clear setup instructions
- **Rate Limiting**: Automatically retries with exponential backoff
- **Network Error**: Displays error and allows retry
- **AI Unavailable**: Falls back to metadata-based captions

## Troubleshooting

### Images not displaying
- Check that images are valid formats (JPG, PNG, GIF, WebP)
- Clear browser cache and localStorage
- Ensure sufficient disk space in browser storage

### AI analysis not working
- Verify Google Gemini API key is correctly set
- Check Supabase Edge Function is deployed
- Ensure API key has sufficient quota

### Background images not loading
- Check internet connection
- Verify Unsplash API is accessible
- Background will gracefully degrade to gradient

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check the [documentation](https://github.com/alanemohan/image-muse/wiki)
- Review existing discussions

## Credits

- Built with [React](https://react.dev)
- UI Components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- AI powered by [Google Gemini](https://ai.google.dev)
- Backgrounds from [Unsplash API](https://unsplash.com/api)
- Backend by [Supabase](https://supabase.com)

---

**Made with ❤️ for image enthusiasts and developers**

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
