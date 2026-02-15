import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateAIResponse } from "@/services/aiService";

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
};

export const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "ai",
      content:
        "Greetings! I am the Image Muse AI. How can I assist you with your gallery today?",
    },
  ]);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  /* ------------------------- Auto-scroll to bottom ------------------------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* ------------------------------ Send message ----------------------------- */
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    // Update UI immediately
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Build conversation safely (NO stale state)
      const conversation = [...messages, userMessage].map((m) => ({
        role: m.role,
        parts: m.content,
      }));

      const response = await generateAIResponse(trimmed, conversation);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          content: response,
        },
      ]);
    } catch (err: unknown) {
      console.error(err);

      const message =
        err instanceof Error && err.message === "API Key missing"
          ? "I need a Gemini API Key to function. Please add it in Settings."
          : "I'm having trouble connecting to the neural network.";

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          content: message,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 md:w-96 overflow-hidden rounded-2xl border border-cyan-500/30 bg-black/80 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.15)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-4">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-cyan-400" />
                <span className="text-sm font-bold tracking-wide text-white">
                  AI ASSISTANT
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <X size={16} />
              </Button>
            </div>

            {/* Chat */}
            <ScrollArea className="h-80 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: msg.role === "ai" ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${
                      msg.role === "ai" ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === "ai"
                          ? "rounded-tl-sm border border-white/10 bg-white/5 text-slate-200"
                          : "rounded-tr-sm bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex gap-1 rounded-2xl rounded-tl-sm border border-white/10 bg-white/5 px-4 py-3">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400" />
                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-white/10 bg-white/5 p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isTyping}
                  placeholder="Ask me anything..."
                  className="flex-1 rounded-xl border border-white/20 bg-black/50 px-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none disabled:opacity-50"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isTyping}
                  className="rounded-xl bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:bg-cyan-600 disabled:opacity-50"
                >
                  <Send size={16} />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen((v) => !v)}
        className={`relative flex h-14 w-14 items-center justify-center rounded-full border transition-all ${
          isOpen
            ? "border-red-500/50 bg-red-500/20 text-red-400"
            : "border-cyan-500/50 bg-cyan-500/20 text-cyan-400"
        }`}
      >
        <span className="absolute inset-0 animate-ping rounded-full border border-current opacity-20" />
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </motion.button>
    </div>
  );
};
