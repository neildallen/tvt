import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/layout/Header';
import HomePage from './pages/HomePage';
import CreateBattlePage from './pages/CreateBattlePage';
import BattleDetailsPage from './pages/BattleDetailsPage';
import PlaybookPage from './pages/PlaybookPage';
import LeaderboardPage from './pages/LeaderboardPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreateBattlePage />} />
            <Route path="/battle/:id" element={<BattleDetailsPage />} />
            <Route path="/playbook" element={<PlaybookPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Routes>
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid #475569',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App; 