import { Images, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GalleryHeaderProps {
  imageCount: number;
  onClearAll: () => void;
}

export const GalleryHeader = ({ imageCount, onClearAll }: GalleryHeaderProps) => {
  return (
    <header className="relative py-12 px-4 text-center overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px]" />
      </div>

      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
          <Images className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>
      
      <h1 className="text-4xl md:text-5xl font-bold mb-3">
        <span className="text-gradient">Image Gallery</span>
      </h1>
      
      <p className="text-muted-foreground text-lg max-w-md mx-auto mb-6">
        Upload, analyze, and caption your images with intelligent metadata extraction
      </p>

      {imageCount > 0 && (
        <div className="flex items-center justify-center gap-4">
          <span className="text-sm text-muted-foreground">
            {imageCount} {imageCount === 1 ? 'image' : 'images'} in gallery
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onClearAll}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Clear All
          </Button>
        </div>
      )}
    </header>
  );
};
