import { useState, useCallback, useEffect } from 'react';
import { GalleryImage, ImageMetadata } from '@/types/gallery';
import { useImageMetadata } from './useImageMetadata';
import { analyzeImage, fileToBase64, urlToBase64, regenerateCaption, APIError } from '@/services/imageAnalysis';
import { toast } from '@/hooks/use-toast';

const STORAGE_KEY = 'gallery-images-v2';

// Generate fallback caption based on metadata
const generateFallbackCaption = (filename: string, metadata: ImageMetadata): string => {
  const parts: string[] = [];
  
  if (metadata.make && metadata.model) {
    parts.push(`Shot with ${metadata.make} ${metadata.model}`);
  }
  
  if (metadata.focalLength && metadata.fNumber) {
    parts.push(`at ${metadata.focalLength} ${metadata.fNumber}`);
  }
  
  if (metadata.dateTime) {
    parts.push(`on ${metadata.dateTime}`);
  }

  if (parts.length === 0) {
    const cleanName = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    return `Beautiful capture: ${cleanName}`;
  }

  return parts.join(' ');
};

// Generate fallback description based on image characteristics
const generateFallbackDescription = (metadata: ImageMetadata, filename: string): string => {
  const parts: string[] = [];
  
  if (metadata.width && metadata.height) {
    const ratio = metadata.width / metadata.height;
    if (ratio > 1.5) parts.push('A stunning landscape photograph');
    else if (ratio < 0.7) parts.push('A beautiful portrait image');
    else parts.push('An interesting square composition');
  } else {
    parts.push('An interesting photograph');
  }

  if (metadata.iso && metadata.iso > 1600) {
    parts.push('captured in low light conditions');
  }

  if (metadata.focalLength) {
    const focal = parseInt(metadata.focalLength);
    if (focal <= 35) parts.push('with a wide-angle perspective');
    else if (focal >= 85) parts.push('with a telephoto lens');
  }

  const description = parts.join(' ');
  return description || `A photograph from ${filename}. Edit this description to add more details.`;
};

// Generate tags from metadata
const generateTags = (metadata: ImageMetadata): string[] => {
  const tags: string[] = [];
  
  if (metadata.width && metadata.height) {
    const ratio = metadata.width / metadata.height;
    if (ratio > 1.5) tags.push('Landscape');
    else if (ratio < 0.7) tags.push('Portrait');
    else tags.push('Square');
  }

  if (metadata.make) tags.push(metadata.make);
  if (metadata.iso && metadata.iso > 1600) tags.push('Low Light');
  if (metadata.focalLength) {
    const focal = parseInt(metadata.focalLength);
    if (focal <= 35) tags.push('Wide Angle');
    else if (focal >= 85) tags.push('Telephoto');
  }
  if (metadata.gpsLatitude) tags.push('Geotagged');
  
  return tags;
};

export const useGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { extractMetadata } = useImageMetadata();

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setImages(parsed.map((img: any) => ({
          ...img,
          createdAt: new Date(img.createdAt),
          file: null,
          isAnalyzing: false,
          // Use stored URL directly (it's already a full data URL)
          url: img.url
        })));
      } catch (e) {
        console.error('Failed to load gallery from storage:', e);
      }
    }
  }, []);

  // Save to localStorage when images change
  useEffect(() => {
    if (images.length > 0) {
      const toStore = images.map(img => ({
        id: img.id,
        name: img.name,
        title: img.title,
        description: img.description,
        caption: img.caption,
        metadata: img.metadata,
        createdAt: img.createdAt,
        tags: img.tags,
        // Store the full data URL directly
        url: img.url
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [images]);

  const addImages = useCallback(async (files: FileList | File[]) => {
    setIsLoading(true);
    
    const fileArray = Array.from(files);
    const newImages: GalleryImage[] = [];

    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) continue;

      const metadata = await extractMetadata(file);
      // Convert file to base64 for persistence
      // fileToBase64 already returns full data URL, no need to wrap it again
      const url = await fileToBase64(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      
      const imageData: GalleryImage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        url,
        name: file.name,
        title: cleanName,
        description: 'Analyzing image...',
        caption: generateFallbackCaption(file.name, metadata),
        metadata,
        createdAt: new Date(),
        tags: generateTags(metadata),
        isAnalyzing: true,
      };
      
      newImages.push(imageData);
    }

    setImages(prev => [...newImages, ...prev]);
    setIsLoading(false);

    // Analyze images with AI in background
    for (const img of newImages) {
      try {
        const base64 = await fileToBase64(img.file!);
        const analysis = await analyzeImage(base64);
        
        setImages(prev => prev.map(i => 
          i.id === img.id 
            ? { 
                ...i, 
                title: analysis.title || i.title,
                description: analysis.description || 'No description available',
                caption: analysis.caption || i.caption,
                tags: [...new Set([...i.tags, ...(analysis.tags || [])])],
                isAnalyzing: false 
              } 
            : i
        ));
        
        toast({
          title: "Image analyzed",
          description: `"${analysis.title}" has been processed with AI`,
        });
      } catch (error) {
        console.error('Failed to analyze image:', error);
        
        const errorMessage = error instanceof APIError ? error.message : 'Unknown error';
        const description = generateFallbackDescription(img.metadata, img.name);
        
        setImages(prev => prev.map(i => 
          i.id === img.id 
            ? { 
                ...i, 
                description,
                isAnalyzing: false 
              } 
            : i
        ));

        // Show different messages based on error type
        if (error instanceof APIError) {
          if (errorMessage.includes('GEMINI_API_KEY') || errorMessage.includes('API_KEY')) {
            toast({
              title: "AI service not configured",
              description: "AI analysis unavailable. Using default metadata-based captions.",
              variant: "destructive",
            });
          } else if (errorMessage.includes('credits') || errorMessage.includes('402')) {
            toast({
              title: "AI credits exhausted",
              description: "Please add credits to your AI service account.",
              variant: "destructive",
            });
          } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
            toast({
              title: "Rate limited",
              description: "Too many requests. Please wait a moment and try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Analysis failed",
              description: `${errorMessage}. Using default metadata-based values.`,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Analysis failed",
            description: "Could not analyze image. Using default metadata-based values.",
            variant: "destructive",
          });
        }
      }
    }
  }, [extractMetadata]);

  const updateTitle = useCallback((id: string, title: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, title } : img
    ));
  }, []);

  const updateDescription = useCallback((id: string, description: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, description } : img
    ));
  }, []);

  const updateCaption = useCallback((id: string, caption: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, caption } : img
    ));
  }, []);

  const regenerateCaptionForImage = useCallback(async (id: string) => {
    const image = images.find(i => i.id === id);
    if (!image) return;

    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, isAnalyzing: true } : img
    ));

    try {
      const base64 = image.file 
        ? await fileToBase64(image.file) 
        : await urlToBase64(image.url);
      const newCaption = await regenerateCaption(base64);
      
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, caption: newCaption, isAnalyzing: false } : img
      ));
      
      toast({
        title: "Caption regenerated",
        description: "A new AI caption has been generated",
      });
    } catch (error) {
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, isAnalyzing: false } : img
      ));
      const errorMessage = error instanceof APIError ? error.message : 'Unknown error';
      
      if (error instanceof APIError && (errorMessage.includes('GEMINI_API_KEY') || errorMessage.includes('API_KEY'))) {
        toast({
          title: "AI service not configured",
          description: "AI caption regeneration unavailable.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to regenerate",
          description: error instanceof Error ? error.message : "Could not regenerate caption",
          variant: "destructive",
        });
      }
    }
  }, [images]);

  const deleteImage = useCallback((id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img?.url && img.url.startsWith('blob:')) {
        URL.revokeObjectURL(img.url);
      }
      return prev.filter(i => i.id !== id);
    });
    toast({
      title: "Image deleted",
      description: "The image has been removed from the gallery",
    });
  }, []);

  const clearGallery = useCallback(() => {
    images.forEach(img => {
      if (img.url && img.url.startsWith('blob:')) {
        URL.revokeObjectURL(img.url);
      }
    });
    setImages([]);
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: "Gallery cleared",
      description: "All images have been removed",
    });
  }, [images]);

  return {
    images,
    isLoading,
    addImages,
    updateTitle,
    updateDescription,
    updateCaption,
    regenerateCaptionForImage,
    deleteImage,
    clearGallery,
  };
};
