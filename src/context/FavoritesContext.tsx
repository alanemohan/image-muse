import { createContext, useContext, useState, useEffect } from 'react';
import { GalleryImage } from '@/types/gallery';

interface FavoritesContextType {
  favorites: GalleryImage[];
  addFavorite: (image: GalleryImage) => void;
  removeFavorite: (imageId: string) => void;
  isFavorite: (imageId: string) => boolean;
  toggleFavorite: (image: GalleryImage) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
  const [favorites, setFavorites] = useState<GalleryImage[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (image: GalleryImage) => {
    setFavorites(prev => {
      if (prev.some(img => img.id === image.id)) return prev;
      return [...prev, image];
    });
  };

  const removeFavorite = (imageId: string) => {
    setFavorites(prev => prev.filter(img => img.id !== imageId));
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
