import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaderboardAPI, statsAPI } from '../api';
import './Leaderboard.css';

const THEME_ICONS = {
  prison: '⛓️',
  cartel: '💵',
  virus: '☣️',
  degen_pit: '🎰',
  cyber_club: '💻'
};

const MEDAL_ICONS = {
  1: '🥇',
  2: '🥈',
  3: '🥉'
};

function Leaderboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('hosts');
  const [hostsData, setHostsData] = useState([]);
  const [roomsData, setRoomsData] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // Обновление каждые 15 сек
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [hostsRes, roomsRes, statsRes] = await Promise.all([
        leaderboardAPI.getHosts(15),
        leaderboardAPI.getRooms(15),
        statsAPI.getGlobal()
      ]);

      setHostsData(hostsRes.data);
      setRoomsData(roomsRes.data);
      setGlobalStats(statsRes.data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    return MEDAL_ICONS[index + 1] || `#${index + 1}`;
  };

  return (
    <div className="leaderboard">
      <div className="container">
        {/* Header */}
        <div className="leaderboard-header">
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            ← Назад
          </button>
          <h1 className="leaderboard-title">
            🏆 Лидерборд
          </h1>
        </div>

        {/* Global Stats */}
        {globalStats && (
          <div className="global-stats">
            <div className="stat-card">
              <div className="stat-icon">🏠</div>
              <div className="stat-info">
                <div className="stat-value">{globalStats.total_rooms}</div>
                <div className="stat-label">Всего комнат</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔥</div>
              <div className="stat-info">
                <div className="stat-value">{globalStats.active_rooms}</div>
                <div className="stat-label">Активных</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎲</div>
              <div className="stat-info">
                <div className="stat-value">{globalStats.total_bets}</div>
                <div className="stat-label">Всего ставок</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <div className="stat-value">${globalStats.total_volume.toFixed(0)}</div>
                <div className="stat-label">Общий оборот</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <div className="stat-value">{globalStats.total_users}</div>
                <div className="stat-label">Пользователей</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="leaderboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'hosts' ? 'active' : ''}`}
            onClick={() => setActiveTab('hosts')}
          >
            <span className="tab-icon">👑</span>
            Топ Хостов
          </button>
          <button
            className={`tab-btn ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            <span className="tab-icon">🏠</span>
            Топ Комнат
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="text-secondary mt-3">Загрузка рейтинга...</p>
          </div>
        ) : (
          <>
            {/* Hosts Leaderboard */}
            {activeTab === 'hosts' && (
              <div className="leaderboard-content">
                <div className="leaderboard-info card">
                  <h3>👑 Топ хостов по демо-прибыли</h3>
                  <p className="text-secondary">
                    Хосты, которые создали самые прибыльные комнаты и накопили максимальный демо-профит
                  </p>
                </div>

                <div className="leaderboard-list">
                  {hostsData.length === 0 ? (
                    <div className="empty-state card">
                      <div style={{fontSize: '4rem', marginBottom: '1rem'}}>👻</div>
                      <h3>Пока нет данных</h3>
                      <p className="text-secondary">Будь первым в рейтинге!</p>
                    </div>
                  ) : (
                    hostsData.map((host, index) => (
                      <div key={host.user.id} className={`leaderboard-item card ${index < 3 ? 'top-three' : ''}`}>
                        <div className="rank-badge">
                          {getRankIcon(index)}
                        </div>
                        <div className="item-content">
                          <div className="item-header">
                            <h3>{host.user.username || `Host #${host.user.id}`}</h3>
                            {host.user.is_bot && (
                              <span className="badge" style={{background: 'rgba(255,255,255,0.1)'}}>
                                🤖 BOT
                              </span>
                            )}
                          </div>
                          <div className="item-stats">
                            <div className="item-stat">
                              <span className="item-stat-label">Демо прибыль</span>
                              <span className="item-stat-value profit" style={{
                                color: host.profit >= 0 ? 'var(--success)' : 'var(--danger)'
                              }}>
                                {host.profit >= 0 ? '+' : ''}{host.profit.toFixed(2)}
                              </span>
                            </div>
                            <div className="item-stat">
                              <span className="item-stat-label">Рефералов</span>
                              <span className="item-stat-value">{host.user.ref_count}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Rooms Leaderboard */}
            {activeTab === 'rooms' && (
              <div className="leaderboard-content">
                <div className="leaderboard-info card">
                  <h3>🏠 Топ комнат по обороту</h3>
                  <p className="text-secondary">
                    Комнаты с максимальным объемом ставок и активностью игроков
                  </p>
                </div>

                <div className="leaderboard-list">
                  {roomsData.length === 0 ? (
                    <div className="empty-state card">
                      <div style={{fontSize: '4rem', marginBottom: '1rem'}}>👻</div>
                      <h3>Пока нет данных</h3>
                      <p className="text-secondary">Создай первую комнату!</p>
                    </div>
                  ) : (
                    roomsData.map((room, index) => (
                      <div key={room.id} className={`leaderboard-item card ${index < 3 ? 'top-three' : ''}`}>
                        <div className="rank-badge">
                          {getRankIcon(index)}
                        </div>
                        <div className="item-content">
                          <div className="item-header">
                            <div className="room-title">
                              <span className="room-theme-icon">{THEME_ICONS[room.theme] || '🎲'}</span>
                              <h3>{room.name}</h3>
                            </div>
                            <div className="room-badges">
                              {room.status === 'active' ? (
                                <span className="badge badge-new">🟢 Активна</span>
                              ) : (
                                <span className="badge badge-expired">⚫ Завершена</span>
                              )}
                              {room.is_bot_owned && (
                                <span className="badge" style={{background: 'rgba(255,255,255,0.1)'}}>
                                  🤖 BOT
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="item-stats">
                            <div className="item-stat">
                              <span className="item-stat-label">Оборот</span>
                              <span className="item-stat-value volume">${room.total_volume.toFixed(2)}</span>
                            </div>
                            <div className="item-stat">
                              <span className="item-stat-label">Ставок</span>
                              <span className="item-stat-value">{room.total_bets}</span>
                            </div>
                            <div className="item-stat">
                              <span className="item-stat-label">Игроков</span>
                              <span className="item-stat-value">{room.unique_players}</span>
                            </div>
                            <div className="item-stat">
                              <span className="item-stat-label">House Edge</span>
                              <span className="item-stat-value">{room.house_edge_percent}%</span>
                            </div>
                          </div>
                          {room.owner && (
                            <div className="room-owner">
                              <span className="text-muted">Хост:</span>
                              <span>{room.owner.username || `Host #${room.owner.id}`}</span>
                            </div>
                          )}
                          <button 
                            className="btn btn-primary"
                            onClick={() => navigate(`/room/${room.public_code}`)}
                            style={{marginTop: '1rem', width: '100%'}}
                          >
                            Открыть комнату
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
