import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateAIResponse } from '@/services/aiService';

export const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: 'Greetings! I am the Image Muse AI. How can I assist you with your gallery today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);


// ... inside component ...
  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
        // Get response from real API
        const response = await generateAIResponse(userMessage, messages.map(m => ({ role: m.role, parts: m.content })));
        
        setMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch (err: any) {
        console.error(err);
        const errorMsg = err.message === "API Key missing" 
            ? "I need a Gemini API Key to function. Please add it in Settings." 
            : "I'm having trouble connecting to the neural network.";
        
        setMessages(prev => [...prev, { role: 'ai', content: errorMsg }]);
    } finally {
        setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 md:w-96 rounded-2xl border border-cyan-500/30 bg-black/80 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.15)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bot className="w-5 h-5 text-cyan-400" />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                </div>
                <span className="font-bold text-white tracking-wide text-sm">AI ASSISTANT</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10" onClick={() => setIsOpen(false)}>
                <X size={16} />
              </Button>
            </div>

            {/* Chat Area */}
            <ScrollArea className="h-80 p-4">
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: msg.role === 'ai' ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'ai'
                          ? 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm'
                          : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-3 border-t border-white/10 bg-white/5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-black/50 border border-white/20 rounded-xl px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <Button type="submit" size="icon" className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <Send size={16} />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 ${
          isOpen 
            ? 'bg-red-500/20 text-red-400 shadow-[0_0_20px_rgba(248,113,113,0.3)] border border-red-500/50' 
            : 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-cyan-500/50'
        }`}
      >
        <span className="absolute inset-0 rounded-full border border-current opacity-20 animate-ping" />
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </motion.button>
    </div>
  );
};
