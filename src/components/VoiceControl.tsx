import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSystemLog } from "@/context/SystemLogContext";

type SpeechRecognitionType =
  | typeof window.SpeechRecognition
  | typeof window.webkitSpeechRecognition;

export const VoiceControl = () => {
  const navigate = useNavigate();
  const { addLog } = useSystemLog();

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const listeningRef = useRef(false);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);

  /* ----------------------------- */
  /* Command handler               */
  /* ----------------------------- */

  const handleCommand = useCallback(
    (cmd: string) => {
      if (cmd.includes("home") || cmd.includes("gallery")) {
        navigate("/");
        toast.success("Navigating to Gallery");
        addLog("Voice: Navigate → Home", "success");
      } else if (cmd.includes("settings") || cmd.includes("config")) {
        navigate("/settings");
        toast.success("Navigating to Settings");
        addLog("Voice: Navigate → Settings", "success");
      } else if (cmd.includes("about") || cmd.includes("info")) {
        navigate("/about");
        toast.success("Navigating to About");
        addLog("Voice: Navigate → About", "success");
      } else if (cmd.includes("scroll down")) {
        window.scrollBy({ top: 500, behavior: "smooth" });
        addLog("Voice: Scroll Down", "success");
      } else if (cmd.includes("scroll up")) {
        window.scrollBy({ top: -500, behavior: "smooth" });
        addLog("Voice: Scroll Up", "success");
      } else {
        toast("Command not recognized");
        addLog(`Voice: Unrecognized → "${cmd}"`, "warning");
      }
    },
    [navigate, addLog]
  );

  /* ----------------------------- */
  /* Setup SpeechRecognition       */
  /* ----------------------------- */

  useEffect(() => {
    const SpeechRecognition: SpeechRecognitionType | undefined =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      listeningRef.current = true;
      setIsListening(true);
      addLog("Voice Interface: Listening", "system");
    };

    recognition.onend = () => {
      listeningRef.current = false;
      setIsListening(false);
      addLog("Voice Interface: Standby", "system");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const cmd = event.results[0][0].transcript.toLowerCase().trim();
      setTranscript(cmd);
      addLog(`Voice Command: "${cmd}"`, "info");
      handleCommand(cmd);
    };

    recognition.onerror = (e) => {
      addLog(`Voice Error: ${e.error}`, "error");
    };

    /* Keyboard shortcut: Ctrl+B */
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "b") {
        toggleListening();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      recognition.abort();
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onresult = null;
      recognition.onerror = null;
    };
  }, [handleCommand, addLog]);

  /* ----------------------------- */
  /* Toggle logic                  */
  /* ----------------------------- */

  const toggleListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (listeningRef.current) recognition.stop();
    else recognition.start();
  }, []);

  if (!supported) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <motion.button
        aria-label="Toggle voice control"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleListening}
        className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all ${
          isListening
            ? "bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_20px_rgba(248,113,113,0.3)]"
            : "bg-slate-800/50 text-slate-400 border border-white/10 hover:bg-slate-700/50"
        }`}
      >
        {isListening ? (
          <>
            <Mic size={20} />
            <span className="absolute inset-0 rounded-full border border-red-500 opacity-20 animate-ping" />
          </>
        ) : (
          <MicOff size={20} />
        )}
      </motion.button>

      <AnimatePresence>
        {isListening && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute left-14 bottom-2 bg-black/60 backdrop-blur px-3 py-1 rounded-lg text-xs text-white border border-white/10"
          >
            "{transcript}"
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
