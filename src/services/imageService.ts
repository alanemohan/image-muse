import { apiFetch, getAuthToken } from "./apiClient";
import { GalleryImage, ImageMetadata } from "@/types/gallery";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export type ServerImage = {
  id: string;
  name: string;
  title: string;
  description: string;
  caption: string;
  url: string;
  file_path?: string | null;
  metadata?: ImageMetadata;
  tags?: string[];
  created_at: string;
  updated_at?: string;
};

export type ImagePayload = {
  name: string;
  url: string;
  file_path?: string | null;
  title?: string;
  description?: string;
  caption?: string;
  metadata?: ImageMetadata;
  tags?: string[];
};

export type ImageUpdatePayload = Partial<ImagePayload>;

// Cache for signed URLs (expire after 50 min to refresh before 1h expiry)
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();
const SIGNED_URL_TTL = 50 * 60 * 1000; // 50 minutes

const getSignedUrls = async (paths: string[]): Promise<Record<string, string>> => {
  const uncached: string[] = [];
  const result: Record<string, string> = {};

  for (const p of paths) {
    const cached = signedUrlCache.get(p);
    if (cached && cached.expiresAt > Date.now()) {
      result[p] = `${API_BASE_URL}${cached.url}`;
    } else {
      uncached.push(p);
    }
  }

  if (uncached.length > 0) {
    try {
      const data = await apiFetch<{ urls: Record<string, string> }>("/uploads/sign-urls", {
        method: "POST",
        body: JSON.stringify({ paths: uncached }),
      });
      for (const [key, signedPath] of Object.entries(data.urls)) {
        signedUrlCache.set(key, { url: signedPath, expiresAt: Date.now() + SIGNED_URL_TTL });
        result[key] = `${API_BASE_URL}${signedPath}`;
      }
    } catch (err) {
      console.error("Failed to sign URLs:", err);
      // Fallback: return base URLs without signing
      for (const p of uncached) {
        result[p] = `${API_BASE_URL}${p}`;
      }
    }
  }

  return result;
};

const normalizeUrl = (url: string, signedUrls?: Record<string, string>) => {
  if (url.startsWith("/uploads/") && signedUrls?.[url]) {
    return signedUrls[url];
  }
  if (url.startsWith("/uploads/")) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
};

export const mapServerImage = (image: ServerImage, signedUrls?: Record<string, string>): GalleryImage => ({
  id: image.id,
  file: null,
  url: normalizeUrl(image.url, signedUrls),
  name: image.name,
  title: image.title,
  description: image.description,
  caption: image.caption,
  metadata: image.metadata || {},
  createdAt: new Date(image.created_at),
  tags: image.tags || [],
  isAnalyzing: false,
  isPersisted: true,
});

export const listImages = async (): Promise<GalleryImage[]> => {
  const data = await apiFetch<{ images: ServerImage[] }>("/images");

  // Collect all upload paths that need signing
  const uploadPaths = data.images
    .map((img) => img.url)
    .filter((url) => url.startsWith("/uploads/"));

  const signedUrls = uploadPaths.length > 0 ? await getSignedUrls(uploadPaths) : {};

  return data.images.map((img) => mapServerImage(img, signedUrls));
};

export const createImage = async (payload: ImagePayload): Promise<GalleryImage> => {
  const data = await apiFetch<{ image: ServerImage }>("/images", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const signedUrls = data.image.url.startsWith("/uploads/")
    ? await getSignedUrls([data.image.url])
    : {};

  return mapServerImage(data.image, signedUrls);
};

export const uploadImage = async (file: File): Promise<{ url: string; file_path?: string }> => {
  const form = new FormData();
  form.append("image", file);
  const data = await apiFetch<{ url: string; file_path?: string }>("/uploads", {
    method: "POST",
    body: form,
  });
  return data;
};

export const updateImage = async (
  id: string,
  payload: ImageUpdatePayload
): Promise<GalleryImage> => {
  const data = await apiFetch<{ image: ServerImage }>(`/images/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  const signedUrls = data.image.url.startsWith("/uploads/")
    ? await getSignedUrls([data.image.url])
    : {};

  return mapServerImage(data.image, signedUrls);
};

export const deleteImage = async (id: string) => {
  await apiFetch<null>(`/images/${id}`, {
    method: "DELETE",
  });
};

export const bulkDeleteImages = async (payload: { ids?: string[]; all?: boolean }) => {
  await apiFetch<null>("/images/bulk-delete", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
