import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../api';
import './HostDashboard.css';

const THEME_ICONS = {
  prison: '⛓️',
  cartel: '💵',
  virus: '☣️',
  degen_pit: '🎰',
  cyber_club: '💻'
};

function HostDashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Получаем user_id из localStorage или URL параметра
  const userId = localStorage.getItem('user_id') || new URLSearchParams(window.location.search).get('id');

  useEffect(() => {
    if (!userId) {
      setError('User ID not found');
      setLoading(false);
      return;
    }

    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      const response = await userAPI.getProfile(userId);
      setUserData(response.data);
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Скопировано!');
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'только что';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}м назад`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}ч назад`;
    return `${Math.floor(seconds / 86400)}д назад`;
  };

  if (loading) {
    return (
      <div className="host-dashboard">
        <div className="container" style={{paddingTop: '100px', textAlign: 'center'}}>
          <div className="spinner" style={{margin: '0 auto'}}></div>
          <p className="text-secondary mt-3">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="host-dashboard">
        <div className="container" style={{paddingTop: '100px', textAlign: 'center'}}>
          <h2 style={{color: 'var(--danger)'}}>❌ Ошибка</h2>
          <p className="text-secondary">{error || 'Не удалось загрузить данные'}</p>
          <button className="btn btn-primary mt-3" onClick={() => navigate('/')}>
            На главную
          </button>
        </div>
      </div>
    );
  }

  const { user, rooms, stats } = userData;
  const refLink = `${window.location.origin}/?ref=${user.ref_code}`;

  return (
    <div className="host-dashboard">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            ← Назад
          </button>
          <h1 className="dashboard-title">
            🎰 Host Dashboard
          </h1>
        </div>

        {/* User Info Card */}
        <div className="card user-info-card">
          <div className="user-info-header">
            <div>
              <h2>{user.username || 'Anonymous Host'}</h2>
              <p className="text-secondary">Хост с {new Date(user.created_at).toLocaleDateString('ru-RU')}</p>
            </div>
            <div className="user-ref-code">
              <span className="text-muted">Реферальный код</span>
              <div className="ref-code-display">
                <code>{user.ref_code}</code>
                <button 
                  className="btn btn-secondary"
                  onClick={() => copyToClipboard(refLink)}
                  style={{padding: '8px 16px', fontSize: '0.9rem'}}
                >
                  📋 Копировать ссылку
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-icon">🏠</div>
              <div className="stat-content">
                <div className="stat-value">{stats.total_rooms}</div>
                <div className="stat-label">Всего комнат</div>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-value">${stats.total_profit.toFixed(2)}</div>
                <div className="stat-label">Демо прибыль</div>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">${stats.total_volume.toFixed(2)}</div>
                <div className="stat-label">Общий оборот</div>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-icon">🔥</div>
              <div className="stat-content">
                <div className="stat-value">{stats.active_rooms}</div>
                <div className="stat-label">Активные комнаты</div>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Program */}
        <div className="card referral-card">
          <h3 className="mb-3">🎁 Реферальная программа</h3>
          <p className="text-secondary mb-3">
            Приводи других хостов, которые будут создавать комнаты и привлекать игроков. 
            В будущем ты получишь % от комиссии платформы с их оборота!
          </p>
          
          <div className="referral-stats">
            <div className="referral-stat">
              <span className="referral-stat-value">{user.ref_count}</span>
              <span className="referral-stat-label">Приглашённых пользователей</span>
            </div>
          </div>

          <div className="ref-link-box">
            <input 
              type="text" 
              value={refLink} 
              readOnly 
              onClick={(e) => e.target.select()}
            />
            <button 
              className="btn btn-primary"
              onClick={() => copyToClipboard(refLink)}
            >
              📋 Копировать
            </button>
          </div>
        </div>

        {/* Rooms List */}
        <div className="rooms-section">
          <div className="section-header">
            <h2>Твои комнаты</h2>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/')}
            >
              + Создать новую комнату
            </button>
          </div>

          {rooms.length === 0 ? (
            <div className="empty-state card">
              <div style={{fontSize: '4rem', marginBottom: '1rem'}}>🎰</div>
              <h3>У тебя пока нет комнат</h3>
              <p className="text-secondary mb-3">Создай свою первую комнату и начни зарабатывать!</p>
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                Создать комнату
              </button>
            </div>
          ) : (
            <div className="rooms-list">
              {rooms.map(room => (
                <div key={room.id} className="room-item card">
                  <div className="room-item-header">
                    <div className="room-item-title">
                      <span className="room-icon">{THEME_ICONS[room.theme] || '🎲'}</span>
                      <div>
                        <h3>{room.name}</h3>
                        <span className="text-muted">{formatTimeAgo(room.created_at)}</span>
                      </div>
                    </div>
                    <div>
                      {room.status === 'active' ? (
                        <span className="badge badge-new">🟢 Активна</span>
                      ) : (
                        <span className="badge badge-expired">⚫ Завершена</span>
                      )}
                    </div>
                  </div>

                  <div className="room-item-stats">
                    <div className="room-stat">
                      <span className="room-stat-label">House Edge</span>
                      <span className="room-stat-value">{room.house_edge_percent}%</span>
                    </div>
                    <div className="room-stat">
                      <span className="room-stat-label">Банкролл</span>
                      <span className="room-stat-value">${room.bankroll_demo}</span>
                    </div>
                    <div className="room-stat">
                      <span className="room-stat-label">Оборот</span>
                      <span className="room-stat-value">${room.total_volume}</span>
                    </div>
                    <div className="room-stat">
                      <span className="room-stat-label">Профит</span>
                      <span className="room-stat-value" style={{
                        color: room.demo_profit >= 0 ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {room.demo_profit >= 0 ? '+' : ''}{room.demo_profit.toFixed(2)}
                      </span>
                    </div>
                    <div className="room-stat">
                      <span className="room-stat-label">Ставок</span>
                      <span className="room-stat-value">{room.total_bets}</span>
                    </div>
                    <div className="room-stat">
                      <span className="room-stat-label">Игроков</span>
                      <span className="room-stat-value">{room.unique_players}</span>
                    </div>
                  </div>

                  <div className="room-item-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => navigate(`/room/${room.public_code}`)}
                      style={{flex: 1}}
                    >
                      Открыть комнату
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => copyToClipboard(`${window.location.origin}/room/${room.public_code}`)}
                    >
                      🔗 Ссылка
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HostDashboard;
