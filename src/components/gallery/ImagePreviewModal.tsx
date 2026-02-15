import { useState, useCallback, useEffect, useRef } from "react";
import { X, ZoomIn, ZoomOut, Download } from "lucide-react";
import { GalleryImage } from "@/types/gallery";
import { Button } from "@/components/ui/button";
import { ScanEffect } from "@/components/ui/ScanEffect";

interface ImagePreviewModalProps {
  image: GalleryImage | null;
  onClose: () => void;
  onDownload?: (image: GalleryImage) => void;
}

export const ImagePreviewModal = ({
  image,
  onClose,
  onDownload,
}: ImagePreviewModalProps) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  /* ---------------- Reset on image change ---------------- */
  useEffect(() => {
    if (!image) return;
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [image?.id]);

  /* ---------------- Zoom controls ---------------- */
  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.2, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.2, 1));
  }, []);

  /* ---------------- Drag logic ---------------- */
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const stopDragging = () => setIsDragging(false);

  /* ---------------- Wheel zoom ---------------- */
  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setZoom((z) =>
      Math.min(3, Math.max(1, z + (e.deltaY > 0 ? -0.1 : 0.1))),
    );
  };

  /* ---------------- Keyboard shortcuts ---------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, zoomIn, zoomOut]);

  /* ---------------- Image transform ---------------- */
  const imgStyle = {
    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
    transition: isDragging ? "none" : "transform 150ms ease-out",
  };

  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full max-w-6xl max-h-[90vh] rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* IMAGE */}
        <div
          className={`relative w-full h-full flex items-center justify-center bg-muted ${
            zoom > 1 ? "cursor-grab active:cursor-grabbing" : ""
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          onWheel={handleWheel}
        >
          <ScanEffect active color="cyan" className="pointer-events-none z-20" />

          <img
            src={image.url}
            alt={image.title || image.name}
            className="max-w-full max-h-full object-contain"
            style={imgStyle}
            draggable={false}
          />
        </div>

        {/* HEADER */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-background/80 to-transparent backdrop-blur-sm flex justify-between z-10">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold truncate">
              {image.title || image.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              {image.metadata?.fileSize}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="p-2 rounded-lg hover:bg-muted/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FOOTER */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/80 to-transparent backdrop-blur-sm flex justify-between z-10">
          <span className="text-xs text-muted-foreground">
            Zoom: {Math.round(zoom * 100)}%
          </span>

          <div className="flex gap-2">
            <Button
              size="icon"
              variant="secondary"
              onClick={zoomOut}
              disabled={zoom <= 1}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              onClick={zoomIn}
              disabled={zoom >= 3}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            {onDownload && (
              <Button
                size="icon"
                variant="secondary"
                onClick={() => onDownload(image)}
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* INFO PANEL */}
        <aside className="absolute left-0 top-20 bottom-0 w-80 p-4 bg-background/60 backdrop-blur-sm border-r border-border/50 overflow-y-auto">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="text-xs uppercase text-muted-foreground mb-1">
                Description
              </h3>
              <p>{image.description}</p>
            </section>

            {image.caption && (
              <section>
                <h3 className="text-xs uppercase text-muted-foreground mb-1">
                  Caption
                </h3>
                <p className="italic">“{image.caption}”</p>
              </section>
            )}

            {image.tags.length > 0 && (
              <section>
                <h3 className="text-xs uppercase text-muted-foreground mb-1">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {image.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
