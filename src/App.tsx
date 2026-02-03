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
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import Admin from "./pages/Admin";
import Errors from "./pages/Errors";
import { Navbar } from "@/components/Navbar";
import { FuturisticBackground } from "@/components/ui/FuturisticBackground";
import { ImageDetailPage } from "@/pages/ImageDetail";
import { AuthProvider } from "@/context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { SettingsProvider } from "@/context/SettingsContext";

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
    // ... useEffect ...

  return (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <FavoritesProvider>
                <SettingsProvider>
                    <TooltipProvider>
                        <Toaster />
                        <Sonner />
                        
                        <div className="relative min-h-screen text-slate-100 font-sans selection:bg-cyan-500/30">
                        <FuturisticBackground />
                        
                        <BrowserRouter>
                            <Navbar />
                            <Routes>
                              <Route path="/" element={<Index />} />
                              <Route path="/signin" element={<SignIn />} />
                              <Route path="/signup" element={<SignUp />} />
                              <Route path="/profile" element={<Profile />} />
                              <Route path="/favorites" element={<Favorites />} />
                              <Route path="/image/:id" element={<ImageDetailPage />} />
                              <Route path="/settings" element={<Settings />} />
                              <Route path="/errors" element={<Errors />} />
                              <Route path="/admin" element={<Admin />} />
                              <Route path="/about" element={<About />} />
                              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                        </BrowserRouter>
                        </div>
                    </TooltipProvider>
                </SettingsProvider>
            </FavoritesProvider>
        </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
