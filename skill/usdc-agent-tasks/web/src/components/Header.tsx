import { Link } from 'react-router-dom';
import WalletButton from './WalletButton';

interface Props {
  onPostClick: () => void;
}

export default function Header({ onPostClick }: Props) {
  return (
    <header className="brutal-border border-t-0 border-l-0 border-r-0 bg-white sticky top-0 z-50 border-b-3">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="w-10 h-10 brutal-border brutal-shadow flex items-center justify-center font-black text-lg bg-brutal-yellow">
            ⚡
          </div>
          <span className="font-mono font-bold text-lg hidden sm:block text-brutal-black">
            AGENT<span className="text-brutal-pink">TASKS</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/"
            className="brutal-btn px-3 py-2 text-xs sm:text-sm bg-brutal-green no-underline text-brutal-black"
          >
            📋 Board
          </Link>
          <Link
            to="/leaderboard"
            className="brutal-btn px-3 py-2 text-xs sm:text-sm bg-brutal-purple no-underline text-brutal-black"
          >
            🏆 Leaders
          </Link>
          <button
            onClick={onPostClick}
            className="brutal-btn px-3 py-2 text-xs sm:text-sm bg-brutal-pink text-white"
          >
            + Post Task
          </button>
          <WalletButton />
        </nav>
      </div>
    </header>
  );
}
