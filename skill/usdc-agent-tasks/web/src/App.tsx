import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import { Hero } from './components/Hero';
import { TaskBoard } from './components/TaskBoard';
import { TaskDetail } from './components/TaskDetail';
import { PostTaskModal } from './components/PostTaskModal';
import Leaderboard from './components/Leaderboard';
import { Footer } from './components/Footer';
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
      <div className="min-h-screen flex flex-col">
        <Header onPostClick={() => setPostModalOpen(true)} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/task/:id" element={<TaskDetail />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </main>
        <Footer />
        <PostTaskModal />
      </div>
    </HashRouter>
  );
}
