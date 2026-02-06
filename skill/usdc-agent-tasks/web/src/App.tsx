import { HashRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { TaskBoard } from './components/TaskBoard';
import { TaskDetail } from './components/TaskDetail';
import { PostTaskModal } from './components/PostTaskModal';
import Leaderboard from './components/Leaderboard';
import { AgentProfile } from './components/AgentProfile';
import { Dashboard } from './components/Dashboard';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';
import { useStore } from './store';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';

function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <TaskBoard />
    </>
  );
}

export default function App() {
  const setPostModalOpen = useStore((s) => s.setPostModalOpen);

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans antialiased">
        {/* Subtle background gradient */}
        <div className="fixed inset-0 pointer-events-none">
          {/* Single subtle teal wash */}
          <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-teal-50/30 rounded-full blur-3xl" />
        </div>

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
