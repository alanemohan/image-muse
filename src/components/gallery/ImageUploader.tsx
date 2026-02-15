import { useCallback, useState } from "react";
import { Upload, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onUpload: (files: FileList | File[]) => void;
  isLoading?: boolean;
}

export const ImageUploader = ({
  onUpload,
  isLoading = false,
}: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const extractImages = (files: FileList | File[]) =>
    Array.from(files).filter((file) => file.type.startsWith("image/"));

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const images = extractImages(e.dataTransfer.files);
      if (images.length > 0) {
        onUpload(images);
      }
    },
    [onUpload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const images = extractImages(files);
      if (images.length > 0) {
        onUpload(images);
      }

      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [onUpload],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload images"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.currentTarget.querySelector<HTMLInputElement>("input")?.click();
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative group cursor-pointer rounded-2xl border-2 border-dashed",
        "min-h-[200px] flex flex-col items-center justify-center gap-4 p-8",
        "transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
        isLoading && "pointer-events-none opacity-50",
      )}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        disabled={isLoading}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />

      {/* Icon */}
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl",
          "gradient-primary transition-all duration-300 shadow-md-custom",
          isDragging && "scale-110 shadow-glow",
        )}
      >
        {isDragging ? (
          <ImagePlus className="h-8 w-8 text-primary-foreground" />
        ) : (
          <Upload className="h-8 w-8 text-primary-foreground" />
        )}
      </div>

      {/* Text */}
      <div className="space-y-2 text-center">
        <p className="text-lg font-semibold text-foreground">
          {isDragging ? "Drop images here" : "Upload your images"}
        </p>
        <p className="text-sm text-muted-foreground">
          Drag & drop or click to browse
        </p>
        <p className="text-xs text-muted-foreground/70">
          JPG, PNG, GIF, WebP supported
        </p>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/60 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
};
