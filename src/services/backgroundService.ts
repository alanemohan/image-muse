// Service to fetch random background images from Unsplash API
// Free tier: 50 requests/hour

const UNSPLASH_API_KEY = import.meta.env.VITE_UNSPLASH_API_KEY || '';
const UNSPLASH_BASE_URL = 'https://api.unsplash.com/photos/random';

interface UnsplashPhoto {
  id: string;
  urls: {
    regular: string;
    small: string;
    full: string;
  };
  user: {
    name: string;
    username: string;
  };
  links: {
    html: string;
  };
}

// Cache the current background to avoid excessive API calls
let cachedBackgroundUrl: string | null = null;
let cachedBackgroundTimestamp: number = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const fetchRandomBackground = async (): Promise<string | null> => {
  try {
    // Return cached background if still valid
    if (cachedBackgroundUrl && Date.now() - cachedBackgroundTimestamp < CACHE_DURATION) {
      return cachedBackgroundUrl;
    }

    const response = await fetch(
      `${UNSPLASH_BASE_URL}?client_id=${UNSPLASH_API_KEY}&query=landscape&orientation=landscape&collections=1065976`,
      {
        method: 'GET',
        headers: {
          'Accept-Version': 'v1'
        }
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch background image:', response.statusText);
      return null;
    }

    const photo: UnsplashPhoto = await response.json();
    
    // Cache the URL
    cachedBackgroundUrl = photo.urls.regular;
    cachedBackgroundTimestamp = Date.now();

    return photo.urls.regular;
  } catch (error) {
    console.error('Error fetching background image:', error);
    return null;
  }
};

// Set background image on document root
export const setBackgroundImage = async (imageUrl?: string): Promise<void> => {
  try {
    const url = imageUrl || await fetchRandomBackground();
    
    if (url) {
      const root = document.documentElement;
      root.style.setProperty('--background-image', `url('${url}')`);
      
      // Store in session storage for persistence across reloads
      sessionStorage.setItem('current-background-url', url);
    }
  } catch (error) {
    console.error('Error setting background image:', error);
  }
};

// Get the current background image URL
export const getBackgroundImage = (): string | null => {
  return sessionStorage.getItem('current-background-url');
};

// Initialize background on app load
export const initializeBackground = async (): Promise<void> => {
  const stored = getBackgroundImage();
  
  if (stored) {
    // Use stored background
    const root = document.documentElement;
    root.style.setProperty('--background-image', `url('${stored}')`);
  } else {
    // Fetch new background
    await setBackgroundImage();
  }
};

// Generate a beautiful gradient background fallback
export const setGradientBackground = (): void => {
  const root = document.documentElement;
  const gradient = 'linear-gradient(135deg, #0f0f1e 0%, #1a0033 50%, #2d0052 100%)';
  root.style.setProperty('--background-image', gradient);
};
