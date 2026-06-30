import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Outlet, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import { FuturisticBackground } from "@/components/ui/FuturisticBackground";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { SettingsProvider } from "@/context/SettingsContext";

const Index = lazy(() => import("@/pages/Index"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Settings = lazy(() => import("@/pages/Settings"));
const About = lazy(() => import("@/pages/About"));
const Explore = lazy(() => import("@/pages/Explore"));
const AIHub = lazy(() => import("@/pages/AIHub"));
const Pulse = lazy(() => import("@/pages/Pulse"));
const SignIn = lazy(() => import("@/pages/SignIn"));
const SignUp = lazy(() => import("@/pages/SignUp"));
const Profile = lazy(() => import("@/pages/Profile"));
const Favorites = lazy(() => import("@/pages/Favorites"));
const Admin = lazy(() => import("@/pages/Admin"));
const Errors = lazy(() => import("@/pages/Errors"));
const ImageDetailPage = lazy(() => import("@/pages/ImageDetail").then((module) => ({ default: module.ImageDetailPage })));

// ✅ React Query client (singleton)
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

const LoginRequired = () => (
  <div className="min-h-[70vh] flex items-center justify-center px-4">
    <div className="w-full max-w-lg rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-8 text-center backdrop-blur">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10">
        <Lock className="h-6 w-6 text-cyan-300" />
      </div>
      <h1 className="text-2xl font-semibold text-slate-100">
        Login Required
      </h1>
      <p className="mt-2 text-slate-400">
        Please login to view this content.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild className="bg-cyan-500 hover:bg-cyan-600 text-white">
          <Link to="/signin">Sign In</Link>
        </Button>
        <Button asChild variant="outline" className="border-slate-600 text-slate-200">
          <Link to="/signup">Create Account</Link>
        </Button>
      </div>
    </div>
  </div>
);

const RouteFallback = () => (
  <div className="min-h-[70vh] flex items-center justify-center text-slate-400">
    Loading page...
  </div>
);

const RequireAuth = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-400">
        Checking session...
      </div>
    );
  }

  if (!user) {
    return <LoginRequired />;
  }

  return <Outlet />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <FavoritesProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />

              <BrowserRouter>
                <div className="relative min-h-screen text-slate-100 font-sans selection:bg-cyan-500/30">
                  <FuturisticBackground />
                  <Navbar />

                  <Suspense fallback={<RouteFallback />}>
                    <Routes>
                      <Route path="/signin" element={<SignIn />} />
                      <Route path="/signup" element={<SignUp />} />

                      <Route element={<RequireAuth />}>
                        <Route path="/" element={<Index />} />
                        <Route path="/explore" element={<Explore />} />
                        <Route path="/ai-hub" element={<AIHub />} />
                        <Route path="/pulse" element={<Pulse />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/favorites" element={<Favorites />} />
                        <Route path="/image/:id" element={<ImageDetailPage />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/errors" element={<Errors />} />
                        <Route path="*" element={<NotFound />} />
                      </Route>
                    </Routes>
                  </Suspense>
                </div>
              </BrowserRouter>
            </TooltipProvider>
          </FavoritesProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
