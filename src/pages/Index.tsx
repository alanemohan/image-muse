import { ImageGallery } from '@/components/gallery/ImageGallery';
import { motion } from 'framer-motion';
import { Sparkles, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  
  const handleGetStarted = () => {
    // Scroll to upload or gallery
    const gallery = document.getElementById('gallery-section');
    gallery?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExploreDemo = () => {
    // Could trigger a specific demo mode, for now scroll
    const gallery = document.getElementById('gallery-section');
    gallery?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex flex-col items-center justify-center text-center px-4 pt-10">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium cursor-default"
        >
          <Sparkles size={14} />
          <span>Next-Gen Analysis Engine</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
        >
          Visual Intelligence <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Reimagined</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10"
        >
          Upload, organize, and inspect your images with our advanced AI-powered gallery. Experience the future of asset management.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="rounded-full bg-cyan-500 hover:bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] px-8 h-12 text-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all duration-300"
          >
            Get Started
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={handleExploreDemo}
            className="rounded-full border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 h-12 text-lg backdrop-blur-sm hover:border-white/40 transition-all duration-300"
          >
            Explore Demo
          </Button>
        </motion.div>

        <motion.div
           animate={{ y: [0, 10, 0] }}
           transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
           className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500"
        >
          <ArrowDown size={24} />
        </motion.div>
      </section>

      {/* Gallery Section */}
      <motion.div
        id="gallery-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4"
      >
        <div className="relative">
            {/* Gallery Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-cyan-500/5 blur-3xl -z-10" />
            
            <ImageGallery />
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
