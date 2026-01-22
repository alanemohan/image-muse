import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Home, Settings, Info } from 'lucide-react';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Gallery', path: '/', icon: Home },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'About', path: '/about', icon: Info },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-lg border-b border-slate-700/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            Image Muse
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ name, path, icon: Icon }) => (
              <Link key={path} to={path}>
                <Button
                  variant={isActive(path) ? 'default' : 'ghost'}
                  className={`flex items-center gap-2 transition-all ${
                    isActive(path)
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {name}
                </Button>
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-300"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navItems.map(({ name, path, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setIsOpen(false)}
              >
                <Button
                  variant={isActive(path) ? 'default' : 'ghost'}
                  className={`w-full justify-start flex items-center gap-2 ${
                    isActive(path)
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {name}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};
