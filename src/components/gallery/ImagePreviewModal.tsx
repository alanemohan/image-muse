import { useState, useCallback, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { GalleryImage } from '@/types/gallery';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImagePreviewModalProps {
  image: GalleryImage | null;
  onClose: () => void;
  onDownload?: (image: GalleryImage) => void;
}

export const ImagePreviewModal = ({
  image,
  onClose,
  onDownload
}: ImagePreviewModalProps) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!image) return null;

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.2, 1));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Transform style
  const imgStyle = {
    transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
    transition: isDragging ? 'none' : 'transform 150ms ease-out'
  };

  // Keyboard event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleZoomIn, handleZoomOut]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      {/* Modal Content */}
      <div
        className="relative w-full h-full max-w-6xl max-h-[90vh] rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Container */}
        <div
          className="relative w-full h-full bg-muted flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={image.url}
            alt={image.title}
            className="max-w-full max-h-full object-contain transition-transform duration-150"
            // eslint-disable-next-line react/forbid-component-props
            style={imgStyle}
          />

          {/* Loading Skeleton Fallback */}
          {!image.url && (
            <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer bg-[length:200%_100%]" />
          )}
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-background/80 to-transparent backdrop-blur-sm flex items-center justify-between z-10">
          <div className="flex-1 min-w-0">
            <h2 id="preview-modal-title" className="text-lg font-semibold text-foreground truncate">
              {image.title || image.name}
            </h2>
            <p className="text-xs text-muted-foreground">{image.metadata.fileSize}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            title="Close preview"
            aria-label="Close image preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Footer Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/80 to-transparent backdrop-blur-sm flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              Zoom: {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="secondary"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="rounded-lg"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="rounded-lg"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            {onDownload && (
              <Button
                size="icon"
                variant="secondary"
                onClick={() => onDownload(image)}
                className="rounded-lg"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Info Panel */}
        <div className="absolute left-0 top-20 bottom-0 w-80 max-h-[calc(100%-80px)] p-4 bg-background/50 backdrop-blur-sm border-r border-border/50 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Description
              </h3>
              <p className="text-sm text-foreground leading-relaxed">
                {image.description}
              </p>
            </div>

            {image.caption && (
              <div>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                  Caption
                </h3>
                <p className="text-sm text-foreground italic">
                  "{image.caption}"
                </p>
              </div>
            )}

            {image.tags.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {image.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {image.metadata && (
              <div>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                  Metadata
                </h3>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {image.metadata.width && image.metadata.height && (
                    <p>📐 {image.metadata.width} × {image.metadata.height}px</p>
                  )}
                  {image.metadata.fileSize && (
                    <p>💾 {image.metadata.fileSize}</p>
                  )}
                  {image.metadata.dateTime && (
                    <p>📅 {image.metadata.dateTime}</p>
                  )}
                  {image.metadata.iso && (
                    <p>📸 ISO {image.metadata.iso}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
