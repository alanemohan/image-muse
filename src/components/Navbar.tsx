import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Home, Settings, Info, Zap, User, LogIn, Heart, ShieldAlert, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Gallery', path: '/', icon: Home },
    { name: 'About', path: '/about', icon: Info },
  ];

  if (user) {
    navItems.push({ name: 'Favorites', path: '/favorites', icon: Heart });
    navItems.push({ name: 'Profile', path: '/profile', icon: User });
    navItems.push({ name: 'Logs', path: '/errors', icon: Terminal });
    navItems.push({ name: 'Settings', path: '/settings', icon: Settings });
    if (user.is_admin) {
      navItems.push({ name: 'Admin', path: '/admin', icon: ShieldAlert });
    }
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-4 left-0 right-0 z-40 mx-auto max-w-7xl transition-all duration-300 px-4 sm:px-6 lg:px-8`}
    >
      <div 
        className={`rounded-2xl border border-white/10 transition-all duration-300 backdrop-blur-md ${
          scrolled || isOpen 
            ? 'bg-black/80 shadow-[0_0_20px_rgba(0,0,0,0.5)]' 
            : 'bg-white/5 shadow-lg'
        }`}
      >
        <div className="flex justify-between items-center h-16 px-4">
          {/* Logo */}
          <Link
            to="/"
            className="group flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
          >
            <div className="relative w-8 h-8">
               <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity" />
               <div className="relative w-full h-full bg-black rounded-lg flex items-center justify-center border border-white/20">
                 <Zap className="w-4 h-4 text-cyan-400" />
               </div>
            </div>
            <span className="font-orbitron tracking-wide">Image Muse</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map(({ name, path, icon: Icon }) => (
              <Link key={path} to={path}>
                <div className="relative group">
                    {isActive(path) && (
                        <motion.div
                            layoutId="navbar-indicator"
                            className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl blur-sm"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <Button
                    variant="ghost"
                    className={`relative flex items-center gap-2 transition-all rounded-xl hover:bg-white/10 ${
                        isActive(path)
                        ? 'text-cyan-400'
                        : 'text-slate-300 hover:text-white'
                    }`}
                    >
                    <Icon size={18} />
                    {name}
                    </Button>
                </div>
              </Link>
            ))}

            {!user && (
                <Link to="/signin">
                    <Button className="ml-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-xl">
                        <LogIn size={18} className="mr-2" />
                        Sign In
                    </Button>
                </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-300"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
            {isOpen && (
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden"
            >
                <div className="p-4 space-y-2 border-t border-white/10">
                {navItems.map(({ name, path, icon: Icon }) => (
                    <Link
                    key={path}
                    to={path}
                    onClick={() => setIsOpen(false)}
                    >
                    <Button
                        variant="ghost"
                        className={`w-full justify-start flex items-center gap-2 mb-2 rounded-xl h-12 ${
                        isActive(path)
                            ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Icon size={18} />
                        {name}
                    </Button>
                    </Link>
                ))}
                {!user && (
                    <Link to="/signin" onClick={() => setIsOpen(false)}>
                         <Button className="w-full justify-start flex items-center gap-2 mb-2 rounded-xl h-12 bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                            <LogIn size={18} />
                            Sign In
                        </Button>
                    </Link>
                )}
                </div>
            </motion.div>
            )}
        </AnimatePresence>
      </div>
    </motion.nav>
    <div className="h-24" /> {/* Spacer for fixed navbar */}
    </>
  );
};
