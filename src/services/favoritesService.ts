import { apiFetch } from "./apiClient";
import { GalleryImage } from "@/types/gallery";
import { mapServerImage, ServerImage } from "./imageService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export const listFavorites = async (): Promise<GalleryImage[]> => {
  const data = await apiFetch<{ images: ServerImage[] }>("/favorites");

  const uploadPaths = data.images
    .map((img) => img.url)
    .filter((url) => url.startsWith("/uploads/"));

  let signedUrls: Record<string, string> = {};
  if (uploadPaths.length > 0) {
    try {
      const signed = await apiFetch<{ urls: Record<string, string> }>("/uploads/sign-urls", {
        method: "POST",
        body: JSON.stringify({ paths: uploadPaths }),
      });
      for (const [key, signedPath] of Object.entries(signed.urls)) {
        signedUrls[key] = `${API_BASE_URL}${signedPath}`;
      }
    } catch { /* fallback to unsigned */ }
  }

  return data.images.map((img) => mapServerImage(img, signedUrls));
};

export const addFavorite = async (imageId: string) => {
  await apiFetch<null>(`/favorites/${imageId}`, {
    method: "POST",
  });
};

export const removeFavorite = async (imageId: string) => {
  await apiFetch<null>(`/favorites/${imageId}`, {
    method: "DELETE",
  });
};
