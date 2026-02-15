import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Home,
  Compass,
  Bot,
  Radio,
  Settings,
  Info,
  Zap,
  User,
  LogIn,
  Heart,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  /* -------------------------------- Scroll Detection -------------------------------- */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ---------------------- Close mobile menu on route change ---------------------- */
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  /* ----------------------------- ESC key support ----------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ----------------------------- Navigation items ----------------------------- */
  const navItems = useMemo(() => {
    const items = [
      { name: "Gallery", path: "/", icon: Home },
      { name: "Explore", path: "/explore", icon: Compass },
      { name: "Pulse", path: "/pulse", icon: Radio },
      { name: "AI Hub", path: "/ai-hub", icon: Bot },
      { name: "About", path: "/about", icon: Info },
    ];

    if (user) {
      items.push(
        { name: "Favorites", path: "/favorites", icon: Heart },
        { name: "Profile", path: "/profile", icon: User },
        { name: "Settings", path: "/settings", icon: Settings },
      );

      if (user.is_admin) {
        items.push(
          { name: "Admin", path: "/admin", icon: ShieldAlert },
          { name: "Logs", path: "/errors", icon: Terminal }
        );
      }
    }

    return items;
  }, [user]);

  /* ---------------------------- Active route matcher ---------------------------- */
  const isActive = (path: string) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-4 left-0 right-0 z-40 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div
          className={`rounded-2xl border border-white/10 backdrop-blur-md transition-all duration-300 ${
            scrolled || isOpen
              ? "bg-black/80 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
              : "bg-white/5 shadow-lg"
          }`}
        >
          {/* ========================== Top Bar ========================== */}
          <div className="flex h-16 items-center justify-between px-4">
            {/* Logo */}
            <Link
              to="/"
              className="group flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
            >
              <div className="relative h-8 w-8">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-400 to-purple-400 blur opacity-75 transition-opacity group-hover:opacity-100" />
                <div className="relative flex h-full w-full items-center justify-center rounded-lg border border-white/20 bg-black">
                  <Zap className="h-4 w-4 text-cyan-400" />
                </div>
              </div>
              <span className="font-orbitron tracking-wide">Image Muse</span>
            </Link>

            {/* ========================== Desktop Menu ========================== */}
            <div className="hidden items-center gap-2 md:flex">
              {navItems.map(({ name, path, icon: Icon }) => (
                <div key={path} className="relative">
                  {isActive(path) && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}

                  <Button asChild variant="ghost"
                    className={`relative flex items-center gap-2 rounded-xl ${
                      isActive(path)
                        ? "text-cyan-400"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <Link to={path}>
                      <Icon size={18} />
                      {name}
                    </Link>
                  </Button>
                </div>
              ))}

              {!user && (
                <Button
                  asChild
                  className="ml-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600"
                >
                  <Link to="/signin">
                    <LogIn size={18} className="mr-2" />
                    Sign In
                  </Link>
                </Button>
              )}
            </div>

            {/* ========================== Mobile Toggle ========================== */}
            <button
              onClick={() => setIsOpen((v) => !v)}
              className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 md:hidden"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* ========================== Mobile Menu ========================== */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden md:hidden"
              >
                <div className="space-y-2 border-t border-white/10 p-4">
                  {navItems.map(({ name, path, icon: Icon }) => (
                    <Button
                      key={path}
                      asChild
                      variant="ghost"
                      className={`h-12 w-full justify-start gap-2 rounded-xl ${
                        isActive(path)
                          ? "border border-cyan-500/30 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Link to={path}>
                        <Icon size={18} />
                        {name}
                      </Link>
                    </Button>
                  ))}

                  {!user && (
                    <Button
                      asChild
                      className="h-12 w-full justify-start gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
                    >
                      <Link to="/signin">
                        <LogIn size={18} />
                        Sign In
                      </Link>
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Spacer for fixed navbar */}
      <div className="h-24" />
    </>
  );
};
