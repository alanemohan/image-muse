import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useFavorites } from "@/context/FavoritesContext";
import { ImageCard } from "@/components/gallery/ImageCard";
import { useSettings } from "@/context/SettingsContext";

const Favorites = () => {
  const { favorites, removeFavorite } = useFavorites();
  const { settings } = useSettings();

  const handleNoOp = () => {};

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-red-500/20 rounded-xl">
                <Heart className="w-8 h-8 text-red-500 fill-current" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
              Your Favorites
            </h1>
        </div>

        {favorites.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="col-span-full bg-white/5 border border-white/10 rounded-xl p-8 text-center backdrop-blur-sm">
                    <p className="text-slate-400">You haven't added any favorites yet.</p>
                    <p className="text-sm text-slate-500 mt-2">Explore the gallery and heart images to save them here!</p>
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((image) => (
                    <div key={image.id}>
                        <ImageCard 
                            image={image}
                            onUpdateTitle={handleNoOp}
                            onUpdateDescription={handleNoOp}
                            onUpdateCaption={handleNoOp}
                            onRegenerateCaption={handleNoOp}
                            onDelete={() => removeFavorite(image.id)}
                            showMetadata={settings.showMetadata}
                        />
                    </div>
                ))}
            </div>
        )}
      </motion.div>
    </div>
  );
};

export default Favorites;
