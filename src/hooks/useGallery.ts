import { useState, useCallback, useEffect, useRef } from "react";
import { GalleryImage, ImageMetadata } from "@/types/gallery";
import { useImageMetadata } from "./useImageMetadata";
import {
  analyzeImage,
  fileToBase64,
  urlToBase64,
  regenerateCaption,
  APIError,
} from "@/services/imageAnalysis";
import {
  listImages,
  uploadImage,
  createImage,
  updateImage,
  deleteImage as deleteRemoteImage,
  bulkDeleteImages,
} from "@/services/imageService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

const STORAGE_KEY = "gallery-images-v2";

const createId = () => `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

const toDate = (value: Date | string) =>
  value instanceof Date ? value : new Date(value);

const generateFallbackCaption = (
  filename: string,
  metadata: ImageMetadata
): string => {
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

  if (!parts.length) {
    return `Beautiful capture: ${filename
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]/g, " ")}`;
  }

  return parts.join(" ");
};

const generateTags = (metadata: ImageMetadata): string[] => {
  const tags: string[] = [];

  if (metadata.width && metadata.height) {
    const ratio = metadata.width / metadata.height;
    if (ratio > 1.5) tags.push("Landscape");
    else if (ratio < 0.7) tags.push("Portrait");
    else tags.push("Square");
  }

  if (metadata.make) tags.push(metadata.make);
  if (metadata.iso && metadata.iso > 1600) tags.push("Low Light");
  if (metadata.gpsLatitude) tags.push("Geotagged");

  return tags;
};

type StoredGalleryImage = Partial<GalleryImage> & { createdAt?: string | Date };

const isStoredGalleryImage = (value: unknown): value is StoredGalleryImage =>
  typeof value === "object" && value !== null;

const normalizeStoredImages = (raw: unknown[]): GalleryImage[] =>
  raw
    .filter(isStoredGalleryImage)
    .map((img) => ({
      ...(img as GalleryImage),
      createdAt: toDate(img.createdAt ?? new Date().toISOString()),
      source: img.source ?? { type: "remote", file: null },
      file: null,
      isAnalyzing: false,
    }));

export const useGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { extractMetadata } = useImageMetadata();
  const { user } = useAuth();
  const isMounted = useRef(true);

  const isServerMode = Boolean(user);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);

      if (isServerMode) {
        try {
          const remoteImages = await listImages();
          if (active) setImages(remoteImages);
        } catch (error) {
          if (active) setImages([]);
          toast({
            title: "Failed to load gallery",
            description:
              error instanceof Error
                ? error.message
                : "Unable to fetch images from backend",
            variant: "destructive",
          });
        } finally {
          if (active) setIsLoading(false);
        }
        return;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        if (active) {
          setImages([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        const parsed = JSON.parse(stored);
        if (active) setImages(normalizeStoredImages(parsed));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        if (active) setImages([]);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [isServerMode]);

  useEffect(() => {
    if (isServerMode) return;

    if (!images.length) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const minimal = images.map(
      ({ id, name, title, description, caption, metadata, createdAt, tags, url }) => ({
        id,
        name,
        title,
        description,
        caption,
        metadata,
        createdAt,
        tags,
        url,
        source: { type: "remote", file: null as null },
      })
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
  }, [images, isServerMode]);

  const addImages = useCallback(
    async (files: FileList | File[]) => {
      setIsLoading(true);

      const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));

      for (const file of fileArray) {
        if (!isMounted.current) return;

        const metadata = await extractMetadata(file);
        const base64 = await fileToBase64(file);
        const now = new Date();

        const localDraft: GalleryImage = {
          id: createId(),
          source: { type: "local", file },
          file,
          url: base64,
          name: file.name,
          title: file.name.replace(/\.[^/.]+$/, ""),
          description: "Analyzing image...",
          caption: generateFallbackCaption(file.name, metadata),
          metadata,
          createdAt: now,
          tags: generateTags(metadata),
          isAnalyzing: true,
        };

        setImages((prev) => [localDraft, ...prev]);

        let activeId = localDraft.id;

        if (isServerMode) {
          try {
            const uploaded = await uploadImage(file);
            const persisted = await createImage({
              name: file.name,
              url: uploaded.url,
              file_path: uploaded.file_path,
              title: localDraft.title,
              description: localDraft.description,
              caption: localDraft.caption,
              metadata,
              tags: localDraft.tags,
            });

            activeId = persisted.id;

            setImages((prev) =>
              prev.map((img) =>
                img.id === localDraft.id
                  ? {
                      ...persisted,
                      file,
                      source: { type: "local", file },
                      isAnalyzing: true,
                    }
                  : img
              )
            );
          } catch (error) {
            setImages((prev) => prev.filter((img) => img.id !== localDraft.id));
            toast({
              title: "Upload failed",
              description:
                error instanceof Error ? error.message : "Image upload failed",
              variant: "destructive",
            });
            continue;
          }
        }

        try {
          const analysis = await analyzeImage(base64);

          setImages((prev) =>
            prev.map((img) =>
              img.id === activeId
                ? {
                    ...img,
                    title: analysis.title || img.title,
                    description: analysis.description || "No description available",
                    caption: analysis.caption || img.caption,
                    tags: Array.from(new Set([...img.tags, ...(analysis.tags || [])])),
                    isAnalyzing: false,
                  }
                : img
            )
          );

          if (isServerMode) {
            await updateImage(activeId, {
              title: analysis.title,
              description: analysis.description,
              caption: analysis.caption,
              tags: analysis.tags,
            });
          }

          toast({
            title: "Image analyzed",
            description: `"${analysis.title}" processed successfully`,
          });
        } catch (error) {
          setImages((prev) =>
            prev.map((img) =>
              img.id === activeId ? { ...img, isAnalyzing: false } : img
            )
          );

          toast({
            title: "Analysis failed",
            description:
              error instanceof APIError
                ? error.message
                : "Using metadata-based fallback",
            variant: "destructive",
          });
        }
      }

      if (isMounted.current) {
        setIsLoading(false);
      }
    },
    [extractMetadata, isServerMode]
  );

  const updateTitle = useCallback(
    async (id: string, title: string) => {
      setImages((prev) => prev.map((img) => (img.id === id ? { ...img, title } : img)));
      if (isServerMode) {
        try {
          await updateImage(id, { title });
        } catch (error) {
          console.error("Failed to sync title update:", error);
        }
      }
    },
    [isServerMode]
  );

  const updateDescription = useCallback(
    async (id: string, description: string) => {
      setImages((prev) =>
        prev.map((img) => (img.id === id ? { ...img, description } : img))
      );
      if (isServerMode) {
        try {
          await updateImage(id, { description });
        } catch (error) {
          console.error("Failed to sync description update:", error);
        }
      }
    },
    [isServerMode]
  );

  const updateCaption = useCallback(
    async (id: string, caption: string) => {
      setImages((prev) => prev.map((img) => (img.id === id ? { ...img, caption } : img)));
      if (isServerMode) {
        try {
          await updateImage(id, { caption });
        } catch (error) {
          console.error("Failed to sync caption update:", error);
        }
      }
    },
    [isServerMode]
  );

  const regenerateCaptionForImage = useCallback(
    async (id: string) => {
      const image = images.find((i) => i.id === id);
      if (!image) return;

      setImages((prev) =>
        prev.map((img) => (img.id === id ? { ...img, isAnalyzing: true } : img))
      );

      try {
        const base64 = image.file
          ? await fileToBase64(image.file)
          : await urlToBase64(image.url);

        const caption = await regenerateCaption(base64);

        setImages((prev) =>
          prev.map((img) =>
            img.id === id ? { ...img, caption, isAnalyzing: false } : img
          )
        );

        if (isServerMode) {
          await updateImage(id, { caption });
        }
      } catch {
        setImages((prev) =>
          prev.map((img) =>
            img.id === id ? { ...img, isAnalyzing: false } : img
          )
        );
      }
    },
    [images, isServerMode]
  );

  const deleteImage = useCallback(
    async (id: string) => {
      setImages((prev) => prev.filter((img) => img.id !== id));

      if (isServerMode) {
        try {
          await deleteRemoteImage(id);
        } catch (error) {
          toast({
            title: "Delete failed",
            description: error instanceof Error ? error.message : "Unable to delete image",
            variant: "destructive",
          });
        }
      }
    },
    [isServerMode]
  );

  const clearGallery = useCallback(async () => {
    setImages([]);

    if (isServerMode) {
      try {
        await bulkDeleteImages({ all: true });
      } catch (error) {
        console.error("Failed to clear remote gallery:", error);
      }
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
  }, [isServerMode]);

  return {
    images: images.map((img) => ({ ...img, createdAt: toDate(img.createdAt) })),
    isLoading,
    addImages,
    updateTitle,
    updateDescription,
    updateCaption,
    regenerateCaptionForImage,
    deleteImage,
    clearGallery,
  };
};
