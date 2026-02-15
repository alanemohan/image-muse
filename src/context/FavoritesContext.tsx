import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { GalleryImage } from "@/types/gallery";
import {
  listFavorites as listRemoteFavorites,
  addFavorite as addRemoteFavorite,
  removeFavorite as removeRemoteFavorite,
} from "@/services/favoritesService";
import { useAuth } from "@/context/AuthContext";

interface FavoritesContextType {
  favorites: GalleryImage[];
  addFavorite: (image: GalleryImage) => void;
  removeFavorite: (imageId: string) => void;
  isFavorite: (imageId: string) => boolean;
  toggleFavorite: (image: GalleryImage) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

const STORAGE_KEY = "favorites";

/* ----------------------------- */
/* Helpers                       */
/* ----------------------------- */

const safeLoadFavorites = (): GalleryImage[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

export const FavoritesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();
  const isServerMode = Boolean(user);
  const [favorites, setFavorites] = useState<GalleryImage[]>([]);

  /* ----------------------------- */
  /* Load on mount                 */
  /* ----------------------------- */

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (isServerMode) {
        try {
          const remote = await listRemoteFavorites();
          if (active) setFavorites(remote);
          return;
        } catch {
          if (active) setFavorites([]);
          return;
        }
      }

      if (active) setFavorites(safeLoadFavorites());
    };

    void load();

    return () => {
      active = false;
    };
  }, [isServerMode]);

  /* ----------------------------- */
  /* Persist changes               */
  /* ----------------------------- */

  useEffect(() => {
    if (isServerMode) return;
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites, isServerMode]);

  /* ----------------------------- */
  /* Actions                       */
  /* ----------------------------- */

  const addFavorite = useCallback((image: GalleryImage) => {
    setFavorites((prev) =>
      prev.some((img) => img.id === image.id)
        ? prev
        : [...prev, image]
    );

    if (isServerMode) {
      void addRemoteFavorite(image.id).catch(() => undefined);
    }
  }, [isServerMode]);

  const removeFavorite = useCallback((imageId: string) => {
    setFavorites((prev) => prev.filter((img) => img.id !== imageId));

    if (isServerMode) {
      void removeRemoteFavorite(imageId).catch(() => undefined);
    }
  }, [isServerMode]);

  const isFavorite = useCallback(
    (imageId: string) => favorites.some((img) => img.id === imageId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (image: GalleryImage) => {
      setFavorites((prev) =>
        prev.some((img) => img.id === image.id)
          ? prev.filter((img) => img.id !== image.id)
          : [...prev, image]
      );
    },
    []
  );

  /* ----------------------------- */
  /* Context value                 */
  /* ----------------------------- */

  const value = useMemo(
    () => ({
      favorites,
      addFavorite,
      removeFavorite,
      isFavorite,
      toggleFavorite,
    }),
    [favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error(
      "useFavorites must be used within a FavoritesProvider"
    );
  }
  return context;
};
