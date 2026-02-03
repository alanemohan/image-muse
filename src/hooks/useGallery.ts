import { useState, useCallback, useEffect } from 'react';
import { GalleryImage, ImageMetadata } from '@/types/gallery';
import { useImageMetadata } from './useImageMetadata';
import { analyzeImage, fileToBase64, urlToBase64, regenerateCaption, APIError } from '@/services/imageAnalysis';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { bulkDeleteImages, createImage, deleteImage as deleteImageRemote, listImages, updateImage as updateImageRemote, uploadImage } from '@/services/imageService';

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
  const { user } = useAuth();
  const isServerMode = Boolean(user);
  const { settings } = useSettings();

  // Load from backend (signed-in) or localStorage (guest)
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (isServerMode) {
        setIsLoading(true);
        try {
          const serverImages = await listImages();
          if (active) setImages(serverImages);
        } catch (e) {
          console.error('Failed to load gallery from backend:', e);
        } finally {
          if (active) setIsLoading(false);
        }
        return;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (active) {
            setImages(parsed.map((img: any) => ({
              ...img,
              createdAt: new Date(img.createdAt),
              file: null,
              isAnalyzing: false,
              isPersisted: false,
              // Use stored URL directly (it's already a full data URL)
              url: img.url
            })));
          }
        } catch (e) {
          console.error('Failed to load gallery from storage:', e);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [isServerMode]);

  // Save to localStorage when images change (guest mode only)
  useEffect(() => {
    if (isServerMode) return;

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
  }, [images, isServerMode]);

  const addImages = useCallback(async (files: FileList | File[]) => {
    setIsLoading(true);
    
    const fileArray = Array.from(files);
    const newImages: GalleryImage[] = [];

    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) continue;

      const metadata = await extractMetadata(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const fallbackCaption = generateFallbackCaption(file.name, metadata);
      const initialTags = generateTags(metadata);
      let url = '';
      
      let imageData: GalleryImage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        url,
        name: file.name,
        title: cleanName,
        description: 'Analyzing image...',
        caption: fallbackCaption,
        metadata,
        createdAt: new Date(),
        tags: initialTags,
        isAnalyzing: true,
        isPersisted: !isServerMode,
      };

      if (isServerMode) {
        try {
          const uploadResult = await uploadImage(file);
          const uploadedUrl = uploadResult.url;

          const created = await createImage({
            name: file.name,
            url: uploadedUrl,
            file_path: uploadResult.file_path,
            title: cleanName,
            description: 'Analyzing image...',
            caption: fallbackCaption,
            metadata,
            tags: initialTags,
          });

          imageData = {
            ...created,
            file,
            metadata,
            tags: created.tags,
            isAnalyzing: true,
            isPersisted: true,
          };
        } catch (error) {
          console.error('Failed to persist image:', error);
          const fallbackUrl = await fileToBase64(file);
          imageData = {
            ...imageData,
            url: fallbackUrl,
            isPersisted: false,
          };
          toast({
            title: "Upload failed",
            description: "Could not save to backend. The image will stay local for this session.",
            variant: "destructive",
          });
        }
      } else {
        const fallbackUrl = await fileToBase64(file);
        imageData = {
          ...imageData,
          url: fallbackUrl,
        };
      }
      
      newImages.push(imageData);
    }

    setImages(prev => [...newImages, ...prev]);
    setIsLoading(false);

    // Analyze images with AI in background
    for (const img of newImages) {
      if (!settings.autoAnalyze) {
        const description = generateFallbackDescription(img.metadata, img.name);
        setImages(prev => prev.map(i =>
          i.id === img.id
            ? { ...i, description, isAnalyzing: false }
            : i
        ));

        if (isServerMode && img.isPersisted) {
          void updateImageRemote(img.id, { description }).catch(error => {
            console.error('Failed to update fallback description:', error);
          });
        }
        continue;
      }

      try {
        const base64 = await fileToBase64(img.file!);
        const analysis = await analyzeImage(base64);
        const mergedTags = [...new Set([...img.tags, ...(analysis.tags || [])])];
        const mergedMetadata = analysis.metadata
          ? { ...img.metadata, ...analysis.metadata }
          : img.metadata;
        const updatedTitle = analysis.title || img.title;
        const updatedDescription = analysis.description || 'No description available';
        const updatedCaption = analysis.caption || img.caption;
        
        setImages(prev => prev.map(i => 
          i.id === img.id 
            ? { 
                ...i, 
                title: updatedTitle,
                description: updatedDescription,
                caption: updatedCaption,
                metadata: mergedMetadata,
                tags: mergedTags,
                isAnalyzing: false 
              } 
            : i
        ));

        if (isServerMode && img.isPersisted) {
          try {
            await updateImageRemote(img.id, {
              title: updatedTitle,
              description: updatedDescription,
              caption: updatedCaption,
              metadata: mergedMetadata,
              tags: mergedTags,
            });
          } catch (error) {
            console.error('Failed to update image metadata:', error);
          }
        }
        
        toast({
          title: "Image analyzed",
          description: `"${analysis.title || img.title}" has been processed with AI`,
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

        if (isServerMode && img.isPersisted) {
          try {
            await updateImageRemote(img.id, {
              description,
            });
          } catch (updateError) {
            console.error('Failed to update fallback description:', updateError);
          }
        }

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
  }, [extractMetadata, isServerMode, settings.autoAnalyze]);

  const updateTitle = useCallback((id: string, title: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, title } : img
    ));

    const target = images.find(img => img.id === id);
    if (isServerMode && target?.isPersisted) {
      void updateImageRemote(id, { title }).catch(error => {
        console.error('Failed to update title:', error);
      });
    }
  }, [images, isServerMode]);

  const updateDescription = useCallback((id: string, description: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, description } : img
    ));

    const target = images.find(img => img.id === id);
    if (isServerMode && target?.isPersisted) {
      void updateImageRemote(id, { description }).catch(error => {
        console.error('Failed to update description:', error);
      });
    }
  }, [images, isServerMode]);

  const updateCaption = useCallback((id: string, caption: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, caption } : img
    ));

    const target = images.find(img => img.id === id);
    if (isServerMode && target?.isPersisted) {
      void updateImageRemote(id, { caption }).catch(error => {
        console.error('Failed to update caption:', error);
      });
    }
  }, [images, isServerMode]);

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

      if (isServerMode && image.isPersisted) {
        try {
          await updateImageRemote(id, { caption: newCaption });
        } catch (error) {
          console.error('Failed to persist regenerated caption:', error);
        }
      }
      
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
  }, [images, isServerMode]);

  const deleteImage = useCallback((id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img?.url && img.url.startsWith('blob:')) {
        URL.revokeObjectURL(img.url);
      }
      return prev.filter(i => i.id !== id);
    });

    const target = images.find(img => img.id === id);
    if (isServerMode && target?.isPersisted) {
      void deleteImageRemote(id).catch(error => {
        console.error('Failed to delete image:', error);
      });
    }

    toast({
      title: "Image deleted",
      description: "The image has been removed from the gallery",
    });
  }, [images, isServerMode]);

  const deleteImages = useCallback((ids: string[]) => {
    setImages(prev => {
      prev.forEach(img => {
        if (ids.includes(img.id) && img.url && img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
      return prev.filter(img => !ids.includes(img.id));
    });

    if (isServerMode) {
      void bulkDeleteImages({ ids }).catch(error => {
        console.error('Failed to bulk delete images:', error);
      });
    }

    toast({
      title: "Images deleted",
      description: `${ids.length} image${ids.length !== 1 ? 's' : ''} removed`,
    });
  }, [isServerMode]);

  const clearGallery = useCallback(() => {
    images.forEach(img => {
      if (img.url && img.url.startsWith('blob:')) {
        URL.revokeObjectURL(img.url);
      }
    });
    setImages([]);

    if (isServerMode) {
      void bulkDeleteImages({ all: true }).catch(error => {
        console.error('Failed to clear gallery:', error);
      });
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    toast({
      title: "Gallery cleared",
      description: "All images have been removed",
    });
  }, [images, isServerMode]);

  return {
    images,
    isLoading,
    addImages,
    updateTitle,
    updateDescription,
    updateCaption,
    regenerateCaptionForImage,
    deleteImage,
    deleteImages,
    clearGallery,
  };
};
