import { useRef, useCallback } from "react";
import { ImageGallery } from "@/components/gallery/ImageGallery";
import { motion } from "framer-motion";
import { Sparkles, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const galleryRef = useRef<HTMLDivElement | null>(null);

  const scrollToGallery = useCallback(() => {
    galleryRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex flex-col items-center justify-center text-center px-4 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium"
        >
          <Sparkles size={14} aria-hidden />
          <span>Next-Gen Analysis Engine</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent mb-6"
        >
          Visual Intelligence <br />
          <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Reimagined
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10"
        >
          Upload, organize, and inspect your images with our advanced AI-powered
          gallery. Experience the future of asset management.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button
            size="lg"
            onClick={scrollToGallery}
            aria-label="Scroll to image gallery"
            className="rounded-full bg-cyan-500 hover:bg-cyan-600 text-white px-8 h-12 text-lg shadow-lg transition-all"
          >
            Get Started
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={scrollToGallery}
            aria-label="Explore demo gallery"
            className="rounded-full border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 h-12 text-lg backdrop-blur-sm transition-all"
          >
            Explore Demo
          </Button>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500"
          aria-hidden
        >
          <ArrowDown size={24} />
        </motion.div>
      </section>

      {/* Gallery Section */}
      <motion.div
        ref={galleryRef}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-cyan-500/5 blur-3xl -z-10" />
          <ImageGallery />
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
