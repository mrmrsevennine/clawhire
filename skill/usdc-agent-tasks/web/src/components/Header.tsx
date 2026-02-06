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
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300 group-hover:scale-105">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-heading text-lg tracking-tight">
            <span className="font-bold text-slate-900">CLAW</span>
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
            className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
          >
            Post Task
          </button>
          
          <WalletButton />
        </nav>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
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
                className="mt-2 w-full px-5 py-3 text-sm font-semibold rounded-xl text-white text-center"
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
              >
                Post Task
              </button>
              <div className="mt-2">
                <WalletButton />
              </div>
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
          ? 'text-indigo-600 bg-indigo-50'
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      {children}
      {active && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-500 rounded-full"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </Link>
  );
}

function MobileNavLink({ to, active, onClick, children }: { to: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
        active ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      {children}
    </Link>
  );
}

export default Header;
