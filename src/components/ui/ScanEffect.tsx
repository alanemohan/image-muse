import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ScanEffectProps {
  active?: boolean;
  className?: string;
  color?: string;
}

export const ScanEffect = ({ active = true, className, color = 'cyan' }: ScanEffectProps) => {
  if (!active) return null;

  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden rounded-lg z-20", className)}>
      {/* Scanning Line */}
      <motion.div
        animate={{
          top: ['0%', '100%', '0%'],
        }}
        transition={{
          duration: 3,
          ease: "linear",
          repeat: Infinity,
        }}
        className="absolute left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.8)] z-20"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      </motion.div>

      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 z-10 opacity-20" 
        style={{
          backgroundImage: `linear-gradient(to right, ${color === 'cyan' ? '#22d3ee' : '#ffffff'} 1px, transparent 1px),
                           linear-gradient(to bottom, ${color === 'cyan' ? '#22d3ee' : '#ffffff'} 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Frame Corners */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-cyan-500" />
      <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-cyan-500" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-cyan-500" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-cyan-500" />
      
      {/* Data effect */}
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: [0, 0.5, 0] }}
         transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2 }}
         className="absolute top-4 right-4 text-[10px] font-mono text-cyan-400/80 bg-black/50 px-1 rounded"
      >
        ANALYZING...
      </motion.div>
    </div>
  );
};
