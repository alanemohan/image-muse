import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Share2, Download, Info, Zap, Layers, Activity, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScanEffect } from '@/components/ui/ScanEffect';
import { Badge } from '@/components/ui/badge';

import { analyzeImage, urlToBase64 } from '@/services/imageAnalysis';
import { useAuth } from '@/context/AuthContext';
import { listImages } from '@/services/imageService';
import { AIAnalysisResult, GalleryImage } from '@/types/gallery';

type StoredImageShape = Partial<GalleryImage> & {
  id?: string;
  createdAt?: string | Date;
};

const matchesImageId = (value: unknown, imageId: string): value is StoredImageShape => {
  if (typeof value !== "object" || value === null) return false;
  return (value as { id?: unknown }).id === imageId;
};

export const ImageDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'metadata' | 'analysis'>('metadata');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanning, setScanning] = useState(true);
  
  // Real Data State
  const image = location.state?.image as GalleryImage | undefined;
  const [resolvedImage, setResolvedImage] = useState<GalleryImage | null>(image || null);
  const [analysisData, setAnalysisData] = useState<AIAnalysisResult | null>(null);

  useEffect(() => {
    let active = true;
    const loadImage = async () => {
      if (resolvedImage || !id) return;

      if (user) {
        try {
          const serverImages = await listImages();
          const found = serverImages.find((img) => img.id === id);
          if (active) setResolvedImage(found || null);
        } catch (error) {
          console.error("Failed to load image:", error);
        }
      } else {
        const stored = localStorage.getItem('gallery-images-v2');
        if (stored) {
          try {
            const parsed: unknown = JSON.parse(stored);
            const found = Array.isArray(parsed)
              ? parsed.find((entry) => matchesImageId(entry, id))
              : undefined;

            if (active && found) {
              const createdAt =
                found.createdAt instanceof Date
                  ? found.createdAt
                  : new Date(found.createdAt ?? new Date().toISOString());

              setResolvedImage({
                ...(found as GalleryImage),
                createdAt,
                file: null,
                isAnalyzing: false,
              });
            }
          } catch (error) {
            console.error("Failed to parse stored gallery:", error);
          }
        }
      }
    };

    void loadImage();
    return () => {
      active = false;
    };
  }, [id, resolvedImage, user]);

  useEffect(() => {
    if (!resolvedImage) return;

    const performAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            // Check if we have a valid URL before analyzing
            if (resolvedImage.url) {
                const base64 = await urlToBase64(resolvedImage.url);
                const result = await analyzeImage(base64);
                setAnalysisData(result);
            }
        } catch (error) {
            console.error("Gemini analysis failed", error);
        } finally {
            setIsAnalyzing(false);
            setScanning(false);
        }
    };

    performAnalysis();
  }, [resolvedImage]);

  if (!resolvedImage) {
      return (
          <div className="min-h-screen flex items-center justify-center text-slate-400">
              <div className="text-center">
                  <p className="mb-4">Image data unavailable.</p>
                  <Button onClick={() => navigate('/')}>Return to Gallery</Button>
              </div>
          </div>
      );
  }

  // Merge Metadata: Use Analysis data if available, else fallback to existing
  const displayMetadata = analysisData?.metadata || resolvedImage.metadata || {};
  const displayAnalysis = analysisData?.analysis || {};
  const displayTags = analysisData?.tags || resolvedImage.tags || [];
  const displayTitle = analysisData?.title || resolvedImage.title || "Untitled";
  const displayDesc = analysisData?.description || resolvedImage.description || "No description available.";

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 flex justify-between items-center"
        >
            <Button 
                variant="ghost" 
                className="text-slate-400 hover:text-white"
                onClick={() => navigate(-1)}
            >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gallery
            </Button>
            <div className="flex gap-2">
                 <Button variant="outline" size="icon" className="rounded-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                    <Share2 className="h-4 w-4" />
                 </Button>
                 <Button variant="outline" size="icon" className="rounded-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                    <Download className="h-4 w-4" />
                 </Button>
            </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Image View */}
            <div className="lg:col-span-2 space-y-6">
                <GlassCard className="relative aspect-[16/9] w-full flex items-center justify-center p-0 border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.15)] group overflow-hidden">
                    <ScanEffect active={scanning || isAnalyzing} color="cyan" />
                    
                    <img 
                        src={resolvedImage.url} 
                        alt={displayTitle} 
                        className="w-full h-full object-contain bg-black/40"
                    />
                    
                    {/* Holographic Overlays */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <div className="bg-black/60 backdrop-blur border border-cyan-500/30 px-3 py-1 rounded text-xs text-cyan-400 font-mono flex items-center gap-2">
                             {isAnalyzing && <Loader2 className="animate-spin h-3 w-3" />}
                             {isAnalyzing ? 'ANALYZING...' : 'REL 2.0 • RAW'}
                        </div>
                    </div>
                </GlassCard>

                {/* Quick Info Bar */}
                <GlassCard className="flex justify-between items-center p-4 border-white/5">
                     <div className="flex gap-4">
                         <div className="text-center">
                             <div className="text-xs text-slate-500 uppercase">ISO</div>
                             <div className="text-lg font-bold text-cyan-400">{displayMetadata.iso || '-'}</div>
                         </div>
                         <div className="w-px bg-white/10" />
                         <div className="text-center">
                             <div className="text-xs text-slate-500 uppercase">Aperture</div>
                             <div className="text-lg font-bold text-purple-400">{displayMetadata.fNumber || '-'}</div>
                         </div>
                         <div className="w-px bg-white/10" />
                         <div className="text-center">
                             <div className="text-xs text-slate-500 uppercase">Shutter</div>
                             <div className="text-lg font-bold text-pink-400">{displayMetadata.shutterSpeed || displayMetadata.exposureTime || '-'}</div>
                         </div>
                     </div>
                     <div className="text-right">
                         <div className="text-xs text-slate-500 uppercase">Captured</div>
                         <div className="text-sm font-medium text-slate-300">{displayMetadata.dateTime || 'Unknown'}</div>
                     </div>
                </GlassCard>
            </div>

            {/* Sidebar Data Panel */}
            <div className="space-y-4">
                <GlassCard className="h-full p-6 border-l-4 border-l-cyan-500">
                    <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        {displayTitle}
                    </h2>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        {displayDesc}
                    </p>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 p-1 bg-black/40 rounded-lg">
                        <button 
                            onClick={() => setActiveTab('metadata')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-sm transition-all ${activeTab === 'metadata' ? 'bg-cyan-500/20 text-cyan-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Info size={14} /> Metadata
                        </button>
                        <button 
                            onClick={() => setActiveTab('analysis')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-sm transition-all ${activeTab === 'analysis' ? 'bg-purple-500/20 text-purple-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Zap size={14} /> AI Analysis
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === 'metadata' ? (
                            <motion.div 
                                key="meta"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <div className="space-y-3">
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-slate-500 text-sm">Camera Model</span>
                                        <span className="text-slate-200 text-sm font-mono">{displayMetadata.camera || displayMetadata.model || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-slate-500 text-sm">Lens</span>
                                        <span className="text-slate-200 text-sm font-mono">{displayMetadata.lens || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-slate-500 text-sm">Resolution</span>
                                        <span className="text-slate-200 text-sm font-mono">{displayMetadata.dimensions || '-'}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="analysis"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                {isAnalyzing ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-cyan-400/50">
                                        <Loader2 className="mb-2 h-8 w-8 animate-spin" />
                                        <span className="text-xs">Processing Neural Data...</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="p-4 bg-purple-900/10 rounded-lg border border-purple-500/20">
                                            <div className="flex items-center gap-2 mb-2 text-purple-400 text-sm font-bold">
                                                <Layers size={14} /> Composition
                                            </div>
                                            <p className="text-slate-300 text-sm">{displayAnalysis.composition || 'Not detected'}</p>
                                        </div>
                                        <div className="p-4 bg-pink-900/10 rounded-lg border border-pink-500/20">
                                            <div className="flex items-center gap-2 mb-2 text-pink-400 text-sm font-bold">
                                                <Activity size={14} /> Sentiment
                                            </div>
                                            <p className="text-slate-300 text-sm">{displayAnalysis.sentiment || 'Not detected'}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-xs text-slate-500 uppercase mb-2">Detected Concepts</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {displayTags.map((tag: string) => (
                                                    <Badge key={tag} variant="secondary" className="bg-white/5 hover:bg-white/10 text-slate-300 border-white/10">
                                                        #{tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </GlassCard>
            </div>
        </div>
    </div>
  );
};
