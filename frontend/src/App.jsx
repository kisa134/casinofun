import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './components/Landing';
import Room from './components/Room';
import HostDashboard from './components/HostDashboard';
import Leaderboard from './components/Leaderboard';
import './App.css';

function App() {
  const userId = localStorage.getItem('user_id');
  
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="container">
            <div className="navbar-content">
              <a href="/" className="logo">
                🎰 Casino.fun
              </a>
              <div className="nav-links">
                <a href="/" className="nav-link">Главная</a>
                <a href="/leaderboard" className="nav-link">🏆 Рейтинг</a>
                {userId && (
                  <a href={`/host?id=${userId}`} className="nav-link" style={{color: 'var(--neon-green)'}}>
                    👤 Мои комнаты
                  </a>
                )}
                <a href="/#rooms-feed" className="nav-link">Комнаты</a>
              </div>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/room/:publicCode" element={<Room />} />
          <Route path="/host" element={<HostDashboard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>

        <footer className="footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-brand">
                <div className="logo">🎰 Casino.fun</div>
                <p className="text-muted">Гемблинг для дегенов. 18+</p>
              </div>
              <div className="footer-disclaimer">
                <p className="text-secondary" style={{fontSize: '0.85rem'}}>
                  Это азартная игра, не инвестиции. Ты можешь потерять всё. 
                  Играй ответственно. Сервис находится в демо-режиме.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
