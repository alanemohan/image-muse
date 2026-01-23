import { useState, useMemo, useCallback } from 'react';
import { useGallery } from '@/hooks/useGallery';
import { GalleryHeader } from './GalleryHeader';
import { ImageUploader } from './ImageUploader';
import { ImageCard } from './ImageCard';
import { GallerySearch, FilterOptions } from './GallerySearch';
import { ImagePreviewModal } from './ImagePreviewModal';
import { ImageCarousel } from './ImageCarousel';
import { Images } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { GalleryImage } from '@/types/gallery';

export const ImageGallery = () => {
  const { 
    images, 
    isLoading, 
    addImages, 
    updateTitle,
    updateDescription,
    updateCaption, 
    regenerateCaptionForImage,
    deleteImage, 
    clearGallery 
  } = useGallery();

  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    sortBy: 'newest',
    tags: [],
    aspectRatio: 'all'
  });
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());

  // Filter and sort images
  const filteredImages = useMemo(() => {
    let result = [...images];

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(img =>
        img.title.toLowerCase().includes(query) ||
        img.description.toLowerCase().includes(query) ||
        img.caption.toLowerCase().includes(query) ||
        img.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Aspect ratio filter
    if (filters.aspectRatio !== 'all') {
      result = result.filter(img => {
        if (!img.metadata.width || !img.metadata.height) return false;
        const ratio = img.metadata.width / img.metadata.height;
        switch (filters.aspectRatio) {
          case 'landscape':
            return ratio > 1.5;
          case 'portrait':
            return ratio < 0.7;
          case 'square':
            return ratio >= 0.7 && ratio <= 1.5;
          default:
            return true;
        }
      });
    }

    // Sorting
    switch (filters.sortBy) {
      case 'oldest':
        result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'size':
        result.sort((a, b) => {
          const sizeA = a.metadata.width || 0 * (a.metadata.height || 0);
          const sizeB = b.metadata.width || 0 * (b.metadata.height || 0);
          return sizeB - sizeA;
        });
        break;
      case 'newest':
      default:
        result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return result;
  }, [images, filters]);

  const handleSearch = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
  }, []);

  const toggleImageSelection = useCallback((id: string) => {
    setSelectedImageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedImageIds(new Set(filteredImages.map(img => img.id)));
  }, [filteredImages]);

  const clearSelection = useCallback(() => {
    setSelectedImageIds(new Set());
  }, []);

  const deleteSelected = useCallback(() => {
    selectedImageIds.forEach(id => deleteImage(id));
    clearSelection();
  }, [selectedImageIds, deleteImage, clearSelection]);

  const handleReorderImages = useCallback((reorderedImages: GalleryImage[]) => {
    // Update the gallery with reordered images
    // Since we don't have direct setImages, we'll use the delete/add pattern
    reorderedImages.forEach((img, newIndex) => {
      // In a real app, this would sync with database
      // For now, the carousel handles the reordering in its own state
    });
  }, []);

  return (
    <div className="min-h-screen relative">
      <div className="container max-w-7xl mx-auto px-4 pb-12 relative z-20">
        <GalleryHeader imageCount={images.length} onClearAll={clearGallery} />
        
        {/* Upload Section */}
        <div className="mb-12">
          <ImageUploader onUpload={addImages} isLoading={isLoading} />
        </div>

        {/* Image Carousel */}
        {images.length > 0 && (
          <ImageCarousel
            images={images}
            onReorder={handleReorderImages}
            onSelect={setSelectedImage}
          />
        )}

        {/* Search and Filters */}
        {images.length > 0 && (
          <GallerySearch
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            totalImages={images.length}
            filteredCount={filteredImages.length}
          />
        )}

        {/* Bulk Actions Bar */}
        {selectedImageIds.size > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between animate-in fade-in-50 duration-200">
            <p className="text-sm font-medium text-primary">
              {selectedImageIds.size} image{selectedImageIds.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm rounded-md hover:bg-primary/20 transition-colors"
              >
                Deselect
              </button>
              <button
                onClick={deleteSelected}
                className="px-3 py-1 text-sm rounded-md bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Gallery Grid */}
        {filteredImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className={`relative transition-all duration-200 ${
                  selectedImageIds.has(image.id) ? 'ring-2 ring-primary rounded-2xl' : ''
                }`}
              >
                {/* Selection Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedImageIds.has(image.id)}
                  onChange={() => toggleImageSelection(image.id)}
                  className="absolute top-4 left-4 z-10 w-5 h-5 rounded cursor-pointer"
                  aria-label={`Select ${image.title}`}
                />
                
                <ImageCard
                  image={image}
                  onUpdateTitle={(title) => updateTitle(image.id, title)}
                  onUpdateDescription={(description) => updateDescription(image.id, description)}
                  onUpdateCaption={(caption) => updateCaption(image.id, caption)}
                  onRegenerateCaption={() => regenerateCaptionForImage(image.id)}
                  onDelete={() => deleteImage(image.id)}
                  onPreview={() => setSelectedImage(image)}
                />
              </div>
            ))}
          </div>
        ) : images.length > 0 ? (
          <div className="text-center py-20">
            <Images className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No images match your filters
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter options
            </p>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Images className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No images yet
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Upload images to automatically generate AI-powered titles, descriptions, and captions
            </p>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />

      <Toaster />
    </div>
  );
};
