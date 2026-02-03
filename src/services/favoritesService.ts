import { apiFetch } from "./apiClient";
import { GalleryImage } from "@/types/gallery";
import { mapServerImage, ServerImage } from "./imageService";

export const listFavorites = async (): Promise<GalleryImage[]> => {
  const data = await apiFetch<{ images: ServerImage[] }>("/favorites");
  return data.images.map(mapServerImage);
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
