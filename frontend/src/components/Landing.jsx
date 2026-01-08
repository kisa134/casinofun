import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomsAPI, eventsAPI } from '../api';
import './Landing.css';

const THEMES = [
  { value: 'prison', label: '🔒 Prison', icon: '⛓️' },
  { value: 'cartel', label: '💰 Cartel', icon: '💵' },
  { value: 'virus', label: '🦠 Virus', icon: '☣️' },
  { value: 'degen_pit', label: '🎲 Degen Pit', icon: '🎰' },
  { value: 'cyber_club', label: '🌐 Cyber Club', icon: '💻' }
];

const LIFETIMES = [
  { value: 43200, label: '12 часов' },
  { value: 86400, label: '24 часа' },
  { value: 129600, label: '36 часов' },
  { value: 172800, label: '48 часов' }
];

function Landing() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    theme: 'degen_pit',
    house_edge_bps: 200,
    lifetime_seconds: 86400
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Обновление каждые 10 сек
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [roomsRes, eventsRes] = await Promise.all([
        roomsAPI.getAll({ limit: 20 }),
        eventsAPI.getAll(30)
      ]);
      setRooms(roomsRes.data);
      setEvents(eventsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setCreating(true);
    try {
      // Get ref code from URL if exists
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
      
      const dataToSend = {
        ...formData,
        ref_code: refCode
      };
      
      const response = await roomsAPI.create(dataToSend);
      const room = response.data;
      
      // Save owner_id to localStorage for host dashboard
      if (room.owner && room.owner.id) {
        localStorage.setItem('user_id', room.owner.id);
      }
      
      navigate(`/room/${room.public_code}`);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Ошибка при создании комнаты');
    } finally {
      setCreating(false);
    }
  };

  const formatTimeRemaining = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}ч ${minutes}м`;
  };

  const getStageBadge = (stage) => {
    const badges = {
      new: <span className="badge badge-new">🆕 NEW</span>,
      peak: <span className="badge badge-peak">🔥 PEAK</span>,
      fading: <span className="badge badge-fading">⏳ FADING</span>,
      expired: <span className="badge badge-expired">💀 EXPIRED</span>
    };
    return badges[stage] || null;
  };

  const getThemeIcon = (theme) => {
    const themeObj = THEMES.find(t => t.value === theme);
    return themeObj ? themeObj.icon : '🎲';
  };

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Создай своё крипто‑казино<br />за 60 секунд
            </h1>
            <p className="hero-subtitle">
              Это денежная игра для дегенов. Ты можешь поднять — и так же быстро всё слить.
            </p>
            <div className="hero-buttons">
              <button className="btn btn-primary" onClick={() => document.getElementById('create-form').scrollIntoView({ behavior: 'smooth' })}>
                🎰 Создать комнату
              </button>
              <button className="btn btn-secondary" onClick={() => document.getElementById('rooms-feed').scrollIntoView({ behavior: 'smooth' })}>
                👀 Смотреть комнаты
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Events Ticker */}
      <div className="events-ticker">
        <div className="events-ticker-content">
          {events.map((event) => (
            <span key={event.id} className="event-item">
              {event.message} •
            </span>
          ))}
        </div>
      </div>

      {/* Create Room Form */}
      <section className="section" id="create-form">
        <div className="container">
          <h2 className="section-title text-center mb-4">Запусти свою комнату</h2>
          
          <div className="create-room-card card">
            <form onSubmit={handleSubmit} className="create-form">
              <div className="form-group">
                <label>Название комнаты</label>
                <input
                  type="text"
                  placeholder="Prison Yard, Cartel Pit, Moon Mission..."
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Тема</label>
                <div className="theme-selector">
                  {THEMES.map(theme => (
                    <button
                      key={theme.value}
                      type="button"
                      className={`theme-option ${formData.theme === theme.value ? 'active' : ''}`}
                      onClick={() => setFormData({...formData, theme: theme.value})}
                    >
                      <span className="theme-icon">{theme.icon}</span>
                      <span className="theme-label">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>House Edge: {formData.house_edge_bps / 100}%</label>
                <input
                  type="range"
                  min="100"
                  max="500"
                  step="50"
                  value={formData.house_edge_bps}
                  onChange={(e) => setFormData({...formData, house_edge_bps: parseInt(e.target.value)})}
                  className="range-slider"
                />
                <div className="flex justify-between text-muted" style={{fontSize: '0.85rem'}}>
                  <span>Меньше edge → больше игроков</span>
                  <span>Больше edge → больше профита</span>
                </div>
              </div>

              <div className="form-group">
                <label>Время рейва</label>
                <div className="lifetime-selector">
                  {LIFETIMES.map(lt => (
                    <button
                      key={lt.value}
                      type="button"
                      className={`lifetime-option ${formData.lifetime_seconds === lt.value ? 'active' : ''}`}
                      onClick={() => setFormData({...formData, lifetime_seconds: lt.value})}
                    >
                      {lt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={creating} style={{width: '100%', padding: '16px'}}>
                {creating ? '⏳ Создаём...' : '🚀 Создать комнату'}
              </button>

              <p className="disclaimer text-muted text-center mt-2" style={{fontSize: '0.85rem'}}>
                Создавая комнату, ты принимаешь риск гемблинга. Это не инвестиционный продукт.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Rooms Feed */}
      <section className="section" id="rooms-feed">
        <div className="container">
          <h2 className="section-title mb-4">Активные комнаты</h2>
          
          {loading ? (
            <div className="text-center" style={{padding: '60px 0'}}>
              <div className="spinner" style={{margin: '0 auto'}}></div>
            </div>
          ) : (
            <div className="rooms-grid">
              {rooms.length === 0 ? (
                <div className="text-center text-muted" style={{padding: '60px 0', gridColumn: '1 / -1'}}>
                  Пока нет активных комнат. Будь первым!
                </div>
              ) : (
                rooms.map(room => (
                  <div key={room.id} className="room-card card">
                    <div className="room-header">
                      <div className="flex items-center gap-2">
                        <span className="room-icon">{getThemeIcon(room.theme)}</span>
                        <h3 style={{fontSize: '1.2rem', margin: 0}}>{room.name}</h3>
                      </div>
                      {getStageBadge(room.stage)}
                    </div>

                    <div className="room-stats">
                      <div className="stat">
                        <span className="stat-label">House Edge</span>
                        <span className="stat-value">{room.house_edge_percent}%</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Банкролл</span>
                        <span className="stat-value">${room.bankroll_demo}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Ставок</span>
                        <span className="stat-value">{room.total_bets}</span>
                      </div>
                    </div>

                    {room.status === 'active' && (
                      <div className="room-timer">
                        <span>⏱️ {formatTimeRemaining(room.time_remaining)}</span>
                      </div>
                    )}

                    <div className="room-actions">
                      <button 
                        className="btn btn-primary"
                        onClick={() => navigate(`/room/${room.public_code}`)}
                        style={{flex: 1}}
                      >
                        🎲 Играть
                      </button>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/room/${room.public_code}`);
                          alert('Ссылка скопирована!');
                        }}
                      >
                        🔗
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="disclaimer-section">
        <div className="container">
          <div className="disclaimer-box glass" style={{padding: '30px', borderRadius: '12px', textAlign: 'center'}}>
            <h3 style={{color: 'var(--neon-orange)', marginBottom: '1rem'}}>⚠️ Важный дисклеймер</h3>
            <p className="text-secondary">
              Это гемблинг, не инвестиции. Ты можешь потерять всё. Играй ответственно. 18+
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;
