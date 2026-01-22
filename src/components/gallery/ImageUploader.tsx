import { useCallback, useState } from 'react';
import { Upload, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onUpload: (files: FileList | File[]) => void;
  isLoading?: boolean;
}

export const ImageUploader = ({ onUpload, isLoading }: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onUpload(files);
    }
  }, [onUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(files);
    }
    e.target.value = '';
  }, [onUpload]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300",
        "min-h-[200px] flex flex-col items-center justify-center gap-4 p-8",
        isDragging 
          ? "border-primary bg-primary/5 scale-[1.02]" 
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
        isLoading && "pointer-events-none opacity-50"
      )}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
        title="Upload image files"
        aria-label="Upload image files"
      />
      
      <div className={cn(
        "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
        "gradient-primary shadow-md-custom",
        isDragging && "scale-110 shadow-glow"
      )}>
        {isDragging ? (
          <ImagePlus className="w-8 h-8 text-primary-foreground" />
        ) : (
          <Upload className="w-8 h-8 text-primary-foreground" />
        )}
      </div>

      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-foreground">
          {isDragging ? "Drop images here" : "Upload your images"}
        </p>
        <p className="text-sm text-muted-foreground">
          Drag and drop or click to browse
        </p>
        <p className="text-xs text-muted-foreground/70">
          Supports JPG, PNG, GIF, WebP
        </p>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-2xl backdrop-blur-sm">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};
