import { useState, useMemo, useCallback } from "react";
import { useGallery } from "@/hooks/useGallery";
import { GalleryHeader } from "./GalleryHeader";
import { ImageUploader } from "./ImageUploader";
import { ImageCard } from "./ImageCard";
import { GallerySearch, FilterOptions } from "./GallerySearch";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { ImageCarousel } from "./ImageCarousel";
import { Images } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { GalleryImage } from "@/types/gallery";

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
    clearGallery,
  } = useGallery();

  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(
    () => new Set(),
  );

  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: "",
    sortBy: "newest",
    tags: [],
    aspectRatio: "all",
  });

  /* ---------------- Filtering & Sorting ---------------- */

  const filteredImages = useMemo(() => {
    let result = [...images];

    // Search
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter((img) =>
        [
          img.title,
          img.description,
          img.caption,
          ...img.tags,
        ].some((v) => v?.toLowerCase().includes(q)),
      );
    }

    // Aspect Ratio
    if (filters.aspectRatio !== "all") {
      result = result.filter((img) => {
        const { width, height } = img.metadata;
        if (!width || !height) return false;
        const ratio = width / height;

        if (filters.aspectRatio === "landscape") return ratio > 1.5;
        if (filters.aspectRatio === "portrait") return ratio < 0.7;
        if (filters.aspectRatio === "square")
          return ratio >= 0.7 && ratio <= 1.5;

        return true;
      });
    }

    // Sorting
    switch (filters.sortBy) {
      case "oldest":
        result.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        );
        break;
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "size":
        result.sort((a, b) => {
          const sizeA =
            (a.metadata.width ?? 0) * (a.metadata.height ?? 0);
          const sizeB =
            (b.metadata.width ?? 0) * (b.metadata.height ?? 0);
          return sizeB - sizeA;
        });
        break;
      case "newest":
      default:
        result.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
    }

    return result;
  }, [images, filters]);

  /* ---------------- Handlers ---------------- */

  const handleSearch = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedImageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedImageIds(new Set());
  }, []);

  const deleteSelected = useCallback(() => {
    [...selectedImageIds].forEach(deleteImage);
    clearSelection();
  }, [selectedImageIds, deleteImage, clearSelection]);

  /* ---------------- Render ---------------- */

  return (
    <div className="min-h-screen relative">
      <div className="container max-w-7xl mx-auto px-4 pb-12 relative z-20">
        <GalleryHeader imageCount={images.length} onClearAll={clearGallery} />

        {/* Upload */}
        <div className="mb-12">
          <ImageUploader onUpload={addImages} isLoading={isLoading} />
        </div>

        {/* Carousel */}
        {images.length > 0 && (
          <ImageCarousel
            images={images}
            onSelect={setSelectedImage}
            onReorder={() => {}}
          />
        )}

        {/* Search */}
        {images.length > 0 && (
          <GallerySearch
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            totalImages={images.length}
            filteredCount={filteredImages.length}
          />
        )}

        {/* Bulk Actions */}
        {selectedImageIds.size > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20 flex justify-between animate-in fade-in-50">
            <p className="text-sm font-medium text-primary">
              {selectedImageIds.size} selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm rounded-md hover:bg-primary/20"
              >
                Deselect
              </button>
              <button
                onClick={deleteSelected}
                className="px-3 py-1 text-sm rounded-md bg-destructive/20 text-destructive hover:bg-destructive/30"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Grid */}
        {filteredImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className={`relative ${
                  selectedImageIds.has(image.id)
                    ? "ring-2 ring-primary rounded-2xl"
                    : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedImageIds.has(image.id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleSelection(image.id)}
                  className="absolute top-4 left-4 z-10 w-5 h-5"
                />

                <ImageCard
                  image={image}
                  onUpdateTitle={(v) => updateTitle(image.id, v)}
                  onUpdateDescription={(v) =>
                    updateDescription(image.id, v)
                  }
                  onUpdateCaption={(v) => updateCaption(image.id, v)}
                  onRegenerateCaption={() =>
                    regenerateCaptionForImage(image.id)
                  }
                  onDelete={() => deleteImage(image.id)}
                  onPreview={() => setSelectedImage(image)}
                />
              </div>
            ))}
          </div>
        ) : images.length > 0 ? (
          <EmptyState
            title="No images match your filters"
            subtitle="Try adjusting search or filters"
          />
        ) : (
          <EmptyState
            title="No images yet"
            subtitle="Upload images to generate AI-powered metadata"
          />
        )}
      </div>

      {/* Preview */}
      <ImagePreviewModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />

      <Toaster />
    </div>
  );
};

/* ---------------- Empty State ---------------- */

const EmptyState = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <div className="text-center py-20">
    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
      <Images className="w-10 h-10 text-muted-foreground" />
    </div>
    <h3 className="text-xl font-semibold">{title}</h3>
    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
      {subtitle}
    </p>
  </div>
);
