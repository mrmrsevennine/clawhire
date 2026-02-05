import { Link, useLocation } from 'react-router-dom';
import WalletButton from './WalletButton';

interface Props {
  onPostClick: () => void;
}

export default function Header({ onPostClick }: Props) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-dark-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-dark-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-usdc-500 to-blue-500 flex items-center justify-center font-black text-lg text-dark-950 shadow-lg shadow-usdc-500/20 group-hover:shadow-usdc-500/40 transition-shadow">
            🦀
          </div>
          <span className="font-mono font-bold text-lg hidden sm:block">
            <span className="text-dark-100">CLAW</span>
            <span className="text-usdc-400">MKT</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <NavLink to="/" active={isActive('/')}>
            <span className="hidden sm:inline">Task </span>Board
          </NavLink>
          <NavLink to="/leaderboard" active={isActive('/leaderboard')}>
            <span className="hidden sm:inline">Leader</span>board
          </NavLink>
          <button
            onClick={onPostClick}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-usdc-500 hover:bg-usdc-400 text-dark-950 transition-all hover:shadow-lg hover:shadow-usdc-500/25"
          >
            + Post Task
          </button>
          <WalletButton />
        </nav>
      </div>
    </header>
  );
}

function NavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-dark-800 text-dark-100'
          : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800/50'
      }`}
    >
      {children}
    </Link>
  );
}
