import { useRef, useEffect, useState } from 'react';
import { useSystemLog, LogEntry } from '@/context/SystemLogContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Minus, Maximize2 } from 'lucide-react';

export const SystemLog = () => {
  const { logs } = useSystemLog();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [minimized, setMinimized] = useState(false);

  return (
    <div className={`fixed bottom-4 left-4 z-40 font-mono transition-all duration-300 ${minimized ? 'w-auto' : 'w-80'} pointer-events-auto hidden md:block`}>
      {/* Holographic Base */}
      <div className="relative overflow-hidden rounded-lg bg-black/60 backdrop-blur-sm border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
        {/* Header */}
        <div 
            className="flex items-center justify-between px-3 py-1.5 bg-cyan-900/20 border-b border-cyan-500/20 cursor-pointer"
            onClick={() => setMinimized(!minimized)}
        >
            <div className="flex items-center gap-2">
                <Activity size={12} className="text-cyan-400 animate-pulse" />
                {!minimized && <span className="text-[10px] uppercase tracking-widest text-cyan-400">System Activity</span>}
            </div>
            <button className="text-cyan-400 hover:text-cyan-300">
                {minimized ? <Maximize2 size={10} /> : <Minus size={10} />}
            </button>
        </div>

        {/* Logs Stream */}
        {!minimized && (
        <div 
            className="h-32 overflow-hidden relative p-2 flex flex-col-reverse mask-image-b"
            ref={scrollRef}
        >
            <AnimatePresence initial={false} mode="popLayout">
                {logs.map((log: LogEntry) => (
                    <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-[10px] mb-1 leading-tight flex gap-2"
                    >
                        <span className="text-slate-500 shrink-0">
                            {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                        </span>
                        <span className={`
                            truncate
                            ${log.type === 'error' ? 'text-red-400 shadow-[0_0_5px_rgba(248,113,113,0.5)]' : ''}
                            ${log.type === 'success' ? 'text-green-400' : ''}
                            ${log.type === 'warning' ? 'text-yellow-400' : ''}
                            ${log.type === 'system' ? 'text-purple-400' : ''}
                            ${log.type === 'info' ? 'text-cyan-300' : ''}
                        `}>
                            {log.message}
                        </span>
                    </motion.div>
                ))}
            </AnimatePresence>
            
            {/* Scanlines Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[5] bg-[length:100%_2px,3px_100%] pointer-events-none" />
        </div>
        )}
      </div>
    </div>
  );
};
