import { apiFetch } from "./apiClient";
import { AIAnalysisResult, GalleryImage, ImageMetadata } from "@/types/gallery";

const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const API_BASE_URL = typeof RAW_API_BASE === "string"
  ? RAW_API_BASE.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "")
  : "http://localhost:4000";

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
  analysis?: AIAnalysisResult | null;
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
  analysis?: AIAnalysisResult | null;
};

export type ImageUpdatePayload = Partial<ImagePayload>;

const normalizeUrl = (url: string): string => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return url;
};

export const mapServerImage = (image: ServerImage): GalleryImage => ({
  id: image.id,
  source: { type: "remote", file: null },
  file: null,
  url: normalizeUrl(image.url),
  name: image.name,
  title: image.title,
  description: image.description,
  caption: image.caption,
  metadata: image.metadata || {},
  createdAt: new Date(image.created_at),
  tags: image.tags || [],
  analysis: image.analysis ?? undefined,
  isAnalyzing: false,
});

export const listImages = async (): Promise<GalleryImage[]> => {
  const data = await apiFetch<{ images: ServerImage[] }>("/images");
  return data.images.map((img) => mapServerImage(img));
};

export const createImage = async (payload: ImagePayload): Promise<GalleryImage> => {
  const data = await apiFetch<{ image: ServerImage }>("/images", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapServerImage(data.image);
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
  return mapServerImage(data.image);
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
