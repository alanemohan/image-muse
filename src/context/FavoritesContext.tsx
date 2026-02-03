import { createContext, useContext, useEffect, useState } from 'react';
import { GalleryImage } from '@/types/gallery';
import { useAuth } from '@/context/AuthContext';
import { addFavorite as addFavoriteRemote, listFavorites, removeFavorite as removeFavoriteRemote } from '@/services/favoritesService';

interface FavoritesContextType {
  favorites: GalleryImage[];
  addFavorite: (image: GalleryImage) => void | Promise<void>;
  removeFavorite: (imageId: string) => void | Promise<void>;
  isFavorite: (imageId: string) => boolean;
  toggleFavorite: (image: GalleryImage) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const isServerMode = Boolean(user);
  const [favorites, setFavorites] = useState<GalleryImage[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (isServerMode) {
        try {
          const items = await listFavorites();
          if (active) setFavorites(items);
        } catch (error) {
          console.error("Failed to load favorites:", error);
          if (active) setFavorites([]);
        }
      } else {
        const saved = localStorage.getItem('favorites');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setFavorites(parsed.map((img: any) => ({
              ...img,
              createdAt: new Date(img.createdAt),
              file: null,
              isPersisted: false,
            })));
          } catch (error) {
            console.error("Failed to parse favorites:", error);
            setFavorites([]);
          }
        } else {
          setFavorites([]);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [isServerMode]);

  useEffect(() => {
    if (!isServerMode) {
      localStorage.setItem('favorites', JSON.stringify(favorites));
    }
  }, [favorites, isServerMode]);

  const addFavorite = async (image: GalleryImage) => {
    setFavorites(prev => {
      if (prev.some(img => img.id === image.id)) return prev;
      return [...prev, image];
    });
    if (isServerMode) {
      try {
        await addFavoriteRemote(image.id);
      } catch (error) {
        console.error("Failed to add favorite:", error);
      }
    }
  };

  const removeFavorite = async (imageId: string) => {
    setFavorites(prev => prev.filter(img => img.id !== imageId));
    if (isServerMode) {
      try {
        await removeFavoriteRemote(imageId);
      } catch (error) {
        console.error("Failed to remove favorite:", error);
      }
    }
  };

  const isFavorite = (imageId: string) => {
    return favorites.some(img => img.id === imageId);
  };

  const toggleFavorite = (image: GalleryImage) => {
    if (isFavorite(image.id)) {
      removeFavorite(image.id);
    } else {
      addFavorite(image);
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
