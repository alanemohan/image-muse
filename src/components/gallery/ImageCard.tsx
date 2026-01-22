import { useState } from 'react';
import { Trash2, Expand, X, Sparkles } from 'lucide-react';
import { GalleryImage } from '@/types/gallery';
import { MetadataDisplay } from './MetadataDisplay';
import { EditableField } from './EditableField';
import { WatermarkDownload } from './WatermarkDownload';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ImageCardProps {
  image: GalleryImage;
  onUpdateTitle: (title: string) => void;
  onUpdateDescription: (description: string) => void;
  onUpdateCaption: (caption: string) => void;
  onRegenerateCaption: () => void;
  onDelete: () => void;
  onPreview?: () => void;
}

export const ImageCard = ({ 
  image, 
  onUpdateTitle,
  onUpdateDescription,
  onUpdateCaption, 
  onRegenerateCaption,
  onDelete,
  onPreview
}: ImageCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <>
      <div className={cn(
        "group relative bg-card rounded-2xl overflow-hidden animate-fade-in",
        "border border-border/50 shadow-sm-custom hover:shadow-md-custom",
        "transition-all duration-300 hover:scale-[1.01]"
      )}>
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer bg-[length:200%_100%]" />
          )}
          <img
            src={image.url}
            alt={image.title || image.name}
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* AI Analyzing Indicator */}
          {image.isAnalyzing && (
            <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Analyzing...
            </div>
          )}
          
          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center gap-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="gradient-glass border border-border/50 text-foreground h-8"
                  onClick={() => {
                    setIsExpanded(true);
                    onPreview?.();
                  }}
                >
                  <Expand className="w-3.5 h-3.5 mr-1.5" />
                  View
                </Button>
                <WatermarkDownload image={image} />
              </div>
              <Button
                size="icon"
                variant="destructive"
                className="w-8 h-8"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <EditableField
            value={image.title}
            onSave={onUpdateTitle}
            label="Title"
          />

          {/* Tags */}
          {image.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {image.tags.slice(0, 5).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary"
                  className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-0"
                >
                  {tag}
                </Badge>
              ))}
              {image.tags.length > 5 && (
                <Badge 
                  variant="outline"
                  className="text-xs px-2 py-0.5"
                >
                  +{image.tags.length - 5} more
                </Badge>
              )}
            </div>
          )}

          {/* Description */}
          <div className="border-t border-border/50 pt-3">
            <EditableField
              value={image.description}
              onSave={onUpdateDescription}
              label="Description"
              multiline
            />
          </div>

          {/* Caption */}
          <div className="border-t border-border/50 pt-3">
            <EditableField
              value={image.caption}
              onSave={onUpdateCaption}
              label="Caption"
              multiline
              onRegenerate={onRegenerateCaption}
              isRegenerating={image.isAnalyzing}
            />
          </div>

          {/* Metadata */}
          <div className="border-t border-border/50 pt-3">
            <MetadataDisplay metadata={image.metadata} />
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md animate-fade-in"
          onClick={() => setIsExpanded(false)}
        >
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-muted/50 hover:bg-muted z-10"
            onClick={() => setIsExpanded(false)}
          >
            <X className="w-5 h-5" />
          </Button>
          <img
            src={image.url}
            alt={image.title || image.name}
            className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg shadow-lg-custom animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-2xl text-center px-4">
            <h3 className="text-xl font-bold text-foreground mb-2">{image.title}</h3>
            <p className="text-base text-foreground/90 mb-1">{image.caption}</p>
            <p className="text-sm text-muted-foreground">{image.name}</p>
          </div>
        </div>
      )}
    </>
  );
};
