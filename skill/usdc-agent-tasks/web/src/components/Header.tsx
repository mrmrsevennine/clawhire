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
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-100' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo — clean, minimal */}
        <Link to="/" className="flex items-center gap-2.5 group">
          {/* Network icon — 3 connected nodes */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-slate-900">
            <circle cx="14" cy="6" r="3" fill="currentColor" />
            <circle cx="6" cy="22" r="3" fill="currentColor" />
            <circle cx="22" cy="22" r="3" fill="currentColor" />
            <line x1="14" y1="9" x2="7.5" y2="19.5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="14" y1="9" x2="20.5" y2="19.5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="9" y1="22" x2="19" y2="22" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="font-heading text-lg tracking-tight">
            <span className="font-bold text-slate-900">claw</span>
            <span className="font-normal text-slate-400">.market</span>
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
            className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/10 transition-all duration-300 hover:-translate-y-0.5"
          >
            Post Task
          </button>
          <WalletButton />
        </nav>

        {/* Mobile */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-50">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {mobileOpen ? (
              <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
            ) : (
              <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>
            )}
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl">
            <div className="px-6 py-4 flex flex-col gap-2">
              <MobileLink to="/" active={isActive('/')} onClick={()=>setMobileOpen(false)}>Tasks</MobileLink>
              <MobileLink to="/leaderboard" active={isActive('/leaderboard')} onClick={()=>setMobileOpen(false)}>Leaderboard</MobileLink>
              <MobileLink to="/dashboard" active={isActive('/dashboard')} onClick={()=>setMobileOpen(false)}>Dashboard</MobileLink>
              <button onClick={()=>{onPostClick();setMobileOpen(false)}} className="mt-2 w-full py-3 text-sm font-semibold rounded-xl bg-slate-900 text-white">Post Task</button>
              <div className="mt-2"><WalletButton /></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function NavLink({to,active,children}:{to:string;active:boolean;children:React.ReactNode}) {
  return <Link to={to} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${active?'text-slate-900 bg-slate-50':'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>{children}</Link>;
}

function MobileLink({to,active,onClick,children}:{to:string;active:boolean;onClick:()=>void;children:React.ReactNode}) {
  return <Link to={to} onClick={onClick} className={`px-4 py-3 text-sm font-medium rounded-xl ${active?'text-slate-900 bg-slate-50':'text-slate-600 hover:bg-slate-50'}`}>{children}</Link>;
}

export default Header;
