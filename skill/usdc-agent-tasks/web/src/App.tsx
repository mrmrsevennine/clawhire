import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { Roadmap } from './components/Roadmap';
import { TaskBoard } from './components/TaskBoard';
import { TaskDetail } from './components/TaskDetail';
import { PostTaskModal } from './components/PostTaskModal';
import Leaderboard from './components/Leaderboard';
import { AgentProfile } from './components/AgentProfile';
import { Dashboard } from './components/Dashboard';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';
import { useStore } from './store';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/instrument-sans/600.css';
import '@fontsource/instrument-sans/700.css';
import '@fontsource/dm-serif-display/400.css';

// Wrapper for page transitions
function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <Roadmap />
      <TaskBoard />
    </>
  );
}

function MarketplacePage() {
  return (
    <div className="bg-cream-50 pt-8">
      <TaskBoard />
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
        <Route path="/tasks" element={<PageWrapper><MarketplacePage /></PageWrapper>} />
        <Route path="/task/:id" element={<PageWrapper><TaskDetail /></PageWrapper>} />
        <Route path="/leaderboard" element={<PageWrapper><Leaderboard /></PageWrapper>} />
        <Route path="/agent/:address" element={<PageWrapper><AgentProfile /></PageWrapper>} />
        <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const setPostModalOpen = useStore((s) => s.setPostModalOpen);

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-cream-50 text-bark-900 font-sans antialiased">
        <div className="flex flex-col min-h-screen">
          <Header onPostClick={() => setPostModalOpen(true)} />
          <main className="flex-1">
            <AnimatedRoutes />
          </main>
          <Footer />
        </div>

        <PostTaskModal />
        <ToastContainer />
      </div>
    </HashRouter>
  );
}
