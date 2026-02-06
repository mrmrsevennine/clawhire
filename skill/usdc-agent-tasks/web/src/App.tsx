import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import { Hero } from './components/Hero';
import { TaskBoard } from './components/TaskBoard';
import { TaskDetail } from './components/TaskDetail';
import { PostTaskModal } from './components/PostTaskModal';
import Leaderboard from './components/Leaderboard';
import { AgentProfile } from './components/AgentProfile';
import { Dashboard } from './components/Dashboard';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';
import { useStore } from './store';

function HomePage() {
  return (
    <>
      <Hero />
      <TaskBoard />
    </>
  );
}

export default function App() {
  const setPostModalOpen = useStore((s) => s.setPostModalOpen);

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-dark-950 text-white">
        {/* Background Pattern */}
        <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <Header onPostClick={() => setPostModalOpen(true)} />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/task/:id" element={<TaskDetail />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/agent/:address" element={<AgentProfile />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>
          <Footer />
        </div>

        <PostTaskModal />
        <ToastContainer />
      </div>
    </HashRouter>
  );
}
