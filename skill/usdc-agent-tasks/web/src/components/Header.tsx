import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import WalletButton from './WalletButton';

interface Props {
  onPostClick: () => void;
}

export function Header({ onPostClick }: Props) {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-100'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo — Bauhaus-clean geometric mark */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9">
            {/* Geometric logo: overlapping circle + square */}
            <div className="absolute inset-0 w-7 h-7 rounded-full bg-pastel-blue opacity-80 top-0 left-0" />
            <div className="absolute w-5 h-5 rounded-sm bg-slate-900 bottom-0 right-0" />
          </div>
          <span className="font-heading text-lg tracking-tight">
            <span className="font-bold text-slate-900">claw</span>
            <span className="font-medium text-slate-400 ml-0.5">marketplace</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" active={isActive('/')}>Tasks</NavLink>
          <NavLink to="/leaderboard" active={isActive('/leaderboard')}>Leaderboard</NavLink>
          <NavLink to="/dashboard" active={isActive('/dashboard')}>Dashboard</NavLink>
          
          <div className="w-px h-6 bg-slate-200 mx-3" />
          
          <button
            onClick={onPostClick}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-slate-900 text-white transition-all duration-300 hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/10 hover:-translate-y-0.5 active:translate-y-0"
          >
            Post Task
          </button>
          
          <WalletButton />
        </nav>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {mobileOpen ? (
              <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
            ) : (
              <><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl"
          >
            <div className="px-6 py-4 flex flex-col gap-2">
              <MobileNavLink to="/" active={isActive('/')} onClick={() => setMobileOpen(false)}>Tasks</MobileNavLink>
              <MobileNavLink to="/leaderboard" active={isActive('/leaderboard')} onClick={() => setMobileOpen(false)}>Leaderboard</MobileNavLink>
              <MobileNavLink to="/dashboard" active={isActive('/dashboard')} onClick={() => setMobileOpen(false)}>Dashboard</MobileNavLink>
              <button
                onClick={() => { onPostClick(); setMobileOpen(false); }}
                className="mt-2 w-full px-5 py-3 text-sm font-semibold rounded-xl bg-slate-900 text-white text-center"
              >
                Post Task
              </button>
              <div className="mt-2"><WalletButton /></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function NavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
        active
          ? 'text-slate-900 bg-slate-50'
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ to, active, onClick, children }: { to: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link to={to} onClick={onClick} className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${active ? 'text-slate-900 bg-slate-50' : 'text-slate-600 hover:bg-slate-50'}`}>
      {children}
    </Link>
  );
}

export default Header;
