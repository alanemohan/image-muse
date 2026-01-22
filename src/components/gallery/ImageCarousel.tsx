import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, GripHorizontal } from 'lucide-react';
import { GalleryImage } from '@/types/gallery';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageCarouselProps {
  images: GalleryImage[];
  onReorder?: (images: GalleryImage[]) => void;
  onSelect?: (image: GalleryImage) => void;
}

export const ImageCarousel = ({
  images,
  onReorder,
  onSelect
}: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlay || images.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlay, images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    onReorder?.(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Upload images to see the carousel
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div className="space-y-6 mb-12">
      {/* Main Carousel */}
      <div className="relative group">
        {/* Image Display */}
        <div className="relative w-full rounded-2xl overflow-hidden glass-card-strong" style={{ paddingBottom: '56.25%' }}>
          <img
            src={currentImage.url}
            alt={currentImage.title}
            className="absolute top-0 left-0 w-full h-full object-cover"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Image Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background to-transparent text-white">
            <h3 className="text-2xl font-bold text-gradient mb-2">
              {currentImage.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentIndex + 1} / {images.length}
            </p>
          </div>

          {/* Navigation Buttons */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity glass-button rounded-full"
            onClick={goToPrevious}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity glass-button rounded-full"
            onClick={goToNext}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          {/* Auto-play Toggle */}
          <Button
            size="sm"
            variant={isAutoPlay ? 'default' : 'outline'}
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setIsAutoPlay(!isAutoPlay)}
          >
            {isAutoPlay ? '⏸' : '▶'}
          </Button>
        </div>
      </div>

      {/* Thumbnails with Drag & Drop */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">
          Reorder Images (Drag to move)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragLeave={() => setDragOverIndex(null)}
              className={cn(
                'relative group cursor-move transition-all',
                draggedIndex === index && 'opacity-50 scale-95',
                dragOverIndex === index && 'scale-105 ring-2 ring-primary',
                currentIndex === index && 'ring-2 ring-primary'
              )}
            >
              {/* Thumbnail */}
              <button
                onClick={() => {
                  goToSlide(index);
                  onSelect?.(image);
                }}
                className="relative w-full aspect-square rounded-lg overflow-hidden glass-card hover-scale"
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />

                {/* Active Indicator */}
                {currentIndex === index && (
                  <div className="absolute inset-0 border-2 border-primary rounded-lg" />
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <GripHorizontal className="w-4 h-4 text-white" />
                </div>
              </button>

              {/* Index Badge */}
              <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-primary/80 text-white text-xs font-bold flex items-center justify-center">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Carousel Info */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-foreground">{currentImage.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {currentImage.description?.substring(0, 100)}...
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gradient">
              {currentIndex + 1}/{images.length}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="confidence-bar">
          <div
            className="confidence-fill transition-all duration-300"
            // eslint-disable-next-line react/forbid-component-props
            style={{
              width: `${((currentIndex + 1) / images.length) * 100}%`
            }}
          />
        </div>

        {/* Tags */}
        {currentImage.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {currentImage.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary border border-primary/30"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
