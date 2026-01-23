import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useSystemLog } from '@/context/SystemLogContext';

export const VoiceControl = () => {
  const navigate = useNavigate();
  const { addLog } = useSystemLog();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSupported(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Listening for commands...");
      addLog("Voice Interface: Active - Listening...", "system");
    };

    recognition.onend = () => {
      setIsListening(false);
      addLog("Voice Interface: Standby", "system");
    };

    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase().trim();
      setTranscript(command);
      console.log('Voice Command:', command);
      addLog(`Voice Command Received: "${command}"`, "info");

      handleCommand(command);
    };

    const handleCommand = (cmd: string) => {
      if (cmd.includes('home') || cmd.includes('gallery')) {
        navigate('/');
        toast.success("Navigating to Gallery");
        addLog("Executing Protocol: Navigate to Home", "success");
      } else if (cmd.includes('settings') || cmd.includes('config')) {
        navigate('/settings');
        toast.success("Navigating to Settings");
        addLog("Executing Protocol: Navigate to Settings", "success");
      } else if (cmd.includes('about') || cmd.includes('info')) {
        navigate('/about');
        toast.success("Navigating to About");
        addLog("Executing Protocol: Navigate to About", "success");
      } else if (cmd.includes('scroll down')) {
        window.scrollBy({ top: 500, behavior: 'smooth' });
        addLog("Executing Protocol: Vertical Scroll +", "success");
      } else if (cmd.includes('scroll up')) {
        window.scrollBy({ top: -500, behavior: 'smooth' });
        addLog("Executing Protocol: Vertical Scroll -", "success");
      } else {
        toast("Command not recognized: " + cmd);
        addLog(`Command Unrecognized: "${cmd}"`, "warning");
      }
    };

    // Global toggle via key 'V'
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b') { // Ctrl+B to toggle
        if (isListening) recognition.stop();
        else recognition.start();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Expose toggle to component
    (window as any).toggleVoice = () => {
        if (isListening) recognition.stop();
        else recognition.start();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      recognition.abort();
    };
  }, [navigate]);

  if (!supported) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => (window as any).toggleVoice()}
        className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
          isListening 
            ? 'bg-red-500/20 text-red-400 shadow-[0_0_20px_rgba(248,113,113,0.3)] border border-red-500/50' 
            : 'bg-slate-800/50 text-slate-400 border border-white/10 hover:bg-slate-700/50'
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
                className="absolute left-14 bottom-2 whitespace-nowrap bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs text-white border border-white/10"
            >
                "{transcript}"
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
