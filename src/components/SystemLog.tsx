import { useState, useMemo } from "react";
import { useSystemLog, LogEntry } from "@/context/SystemLogContext";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Minus, Maximize2 } from "lucide-react";

const typeColorMap: Record<LogEntry["type"], string> = {
  error: "text-red-400 shadow-[0_0_5px_rgba(248,113,113,0.5)]",
  success: "text-green-400",
  warning: "text-yellow-400",
  system: "text-purple-400",
  info: "text-cyan-300",
};

export const SystemLog = () => {
  const { logs } = useSystemLog();
  const [minimized, setMinimized] = useState(false);

  const renderedLogs = useMemo(
    () =>
      logs.map((log) => (
        <motion.div
          key={log.id}
          initial={{ opacity: 0, x: -20, height: 0 }}
          animate={{ opacity: 1, x: 0, height: "auto" }}
          exit={{ opacity: 0, x: 20, height: 0 }}
          transition={{ duration: 0.3 }}
          className="text-[10px] mb-1 leading-tight flex gap-2"
        >
          <span className="text-slate-500 shrink-0">
            {log.timestamp.toLocaleTimeString([], {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
          <span className={`truncate ${typeColorMap[log.type]}`}>
            {log.message}
          </span>
        </motion.div>
      )),
    [logs]
  );

  return (
    <div
      className={`fixed bottom-4 left-4 z-40 font-mono transition-all duration-300 ${
        minimized ? "w-auto" : "w-80"
      } pointer-events-auto hidden md:block`}
    >
      <div className="relative overflow-hidden rounded-lg bg-black/60 backdrop-blur-sm border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
        {/* Header */}
        <div
          role="button"
          tabIndex={0}
          aria-expanded={!minimized}
          className="flex items-center justify-between px-3 py-1.5 bg-cyan-900/20 border-b border-cyan-500/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          onClick={() => setMinimized((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setMinimized((v) => !v);
            }
          }}
        >
          <div className="flex items-center gap-2">
            <Activity
              size={12}
              className="text-cyan-400 animate-pulse"
              aria-hidden="true"
            />
            {!minimized && (
              <span className="text-[10px] uppercase tracking-widest text-cyan-400">
                System Activity
              </span>
            )}
          </div>

          <span className="text-cyan-400" aria-hidden="true">
            {minimized ? <Maximize2 size={10} /> : <Minus size={10} />}
          </span>
        </div>

        {/* Logs */}
        {!minimized && (
          <div
            role="log"
            aria-live="polite"
            className="h-32 overflow-hidden relative p-2 flex flex-col-reverse mask-image-b"
          >
            <AnimatePresence initial={false} mode="popLayout">
              {renderedLogs}
            </AnimatePresence>

            {/* Scanlines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[5] bg-[length:100%_2px,3px_100%] pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  );
};
