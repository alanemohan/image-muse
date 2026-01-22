import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import About from "./pages/About";
import { Navbar } from "@/components/Navbar";
import { initializeBackground } from "@/services/backgroundService";

// ✅ Better React Query defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => {
  useEffect(() => {
    // Initialize background on app load
    initializeBackground().catch((error) => {
      console.error("Failed to initialize background:", error);

      // Fallback to gradient
      document.documentElement.style.setProperty(
        "--background-image",
        "linear-gradient(135deg, #0f0f1e 0%, #1a0033 50%, #2d0052 100%)"
      );
    });

    // Log only in development
    if (import.meta.env.DEV) {
      console.log(
        "App initialized - dark mode enabled, background service started"
      );
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
