import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomsAPI } from '../api';
import './Room.css';

function Room() {
  const { publicCode } = useParams();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState(null);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [betting, setBetting] = useState(false);
  const [lastBetResult, setLastBetResult] = useState(null);
  
  const [betAmount, setBetAmount] = useState(10);
  const [betChoice, setBetChoice] = useState('HEADS');

  useEffect(() => {
    loadRoom();
    loadBets();
    
    const interval = setInterval(() => {
      loadRoom();
      loadBets();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [publicCode]);

  const loadRoom = async () => {
    try {
      const response = await roomsAPI.getByCode(publicCode);
      setRoom(response.data);
    } catch (error) {
      console.error('Error loading room:', error);
      if (error.response?.status === 404) {
        alert('Комната не найдена');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadBets = async () => {
    try {
      const response = await roomsAPI.getBets(publicCode, 20);
      setBets(response.data);
    } catch (error) {
      console.error('Error loading bets:', error);
    }
  };

  const placeBet = async () => {
    if (!betAmount || betAmount <= 0) {
      alert('Введи сумму ставки');
      return;
    }

    if (betAmount > room.bankroll_demo * 0.05) {
      alert(`Максимальная ставка: ${(room.bankroll_demo * 0.05).toFixed(2)}`);
      return;
    }

    setBetting(true);
    setLastBetResult(null);

    try {
      const response = await roomsAPI.placeBet(publicCode, {
        amount: betAmount,
        choice: betChoice,
        user_id: null // Guest mode
      });

      const result = response.data;
      setLastBetResult(result.bet);
      setRoom(result.room);
      
      // Add new bet to the top of the list
      setBets([result.bet, ...bets]);

    } catch (error) {
      console.error('Error placing bet:', error);
      alert(error.response?.data?.error || 'Ошибка при размещении ставки');
    } finally {
      setBetting(false);
    }
  };

  const formatTimeRemaining = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getThemeGradient = (theme) => {
    const gradients = {
      prison: 'linear-gradient(135deg, #ff6b35, #ff9933)',
      cartel: 'linear-gradient(135deg, #00ff88, #00cc6a)',
      virus: 'linear-gradient(135deg, #b0ff00, #00ff88)',
      degen_pit: 'linear-gradient(135deg, #b830ff, #ff3366)',
      cyber_club: 'linear-gradient(135deg, #00d4ff, #0099ff)'
    };
    return gradients[theme] || gradients.degen_pit;
  };

  if (loading) {
    return (
      <div className="room-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!room) {
    return null;
  }

  const maxBet = (room.bankroll_demo * 0.05).toFixed(2);

  return (
    <div className="room">
      {/* Room Header */}
      <div className="room-header-section" style={{background: getThemeGradient(room.theme)}}>
        <div className="container">
          <div className="room-header-content">
            <div className="room-info">
              <h1 className="room-name">{room.name}</h1>
              <div className="room-meta">
                <span className="room-theme">{room.theme.replace('_', ' ').toUpperCase()}</span>
                <span>•</span>
                <span>{room.house_edge_percent}% House Edge</span>
              </div>
            </div>
            
            {room.status === 'active' ? (
              <div className="room-timer-big">
                <div className="timer-label">Музыка остановится через</div>
                <div className="timer-value">{formatTimeRemaining(room.time_remaining)}</div>
              </div>
            ) : (
              <div className="room-expired-badge">
                <span className="badge badge-expired">EXPIRED</span>
              </div>
            )}
          </div>

          <div className="room-stats-bar">
            <div className="stat">
              <span className="stat-label">Банкролл</span>
              <span className="stat-value">${room.bankroll_demo.toFixed(2)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Всего ставок</span>
              <span className="stat-value">{room.total_bets}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Оборот</span>
              <span className="stat-value">${room.total_volume.toFixed(2)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Игроков</span>
              <span className="stat-value">{room.unique_players}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="room-content">
          {/* Betting Panel */}
          <div className="betting-panel card">
            <h2 style={{marginBottom: '1.5rem'}}>🎲 Coinflip</h2>

            {/* Last Result */}
            {lastBetResult && (
              <div className={`bet-result ${lastBetResult.won ? 'win' : 'loss'}`}>
                <div className="result-icon">
                  {lastBetResult.won ? '🎉' : '💀'}
                </div>
                <div className="result-text">
                  {lastBetResult.won ? (
                    <>
                      <div className="result-title">Выиграл!</div>
                      <div className="result-amount">+${lastBetResult.payout.toFixed(2)}</div>
                    </>
                  ) : (
                    <>
                      <div className="result-title">Проиграл</div>
                      <div className="result-amount">-${lastBetResult.amount.toFixed(2)}</div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Bet Amount */}
            <div className="form-group">
              <label>Сумма ставки</label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                min="0.01"
                max={maxBet}
                step="0.01"
                disabled={betting || room.status !== 'active'}
              />
              <div className="quick-amounts">
                {[1, 5, 10, 25, 50, 100].map(amount => (
                  <button
                    key={amount}
                    className="quick-amount-btn"
                    onClick={() => setBetAmount(amount)}
                    disabled={betting || room.status !== 'active'}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              <div className="text-muted" style={{fontSize: '0.85rem', marginTop: '0.5rem'}}>
                Максимальная ставка: ${maxBet}
              </div>
            </div>

            {/* Choice */}
            <div className="form-group">
              <label>Выбери сторону</label>
              <div className="choice-buttons">
                <button
                  className={`choice-btn ${betChoice === 'HEADS' ? 'active heads' : ''}`}
                  onClick={() => setBetChoice('HEADS')}
                  disabled={betting || room.status !== 'active'}
                >
                  <div className="choice-icon">🪙</div>
                  <div className="choice-label">HEADS</div>
                </button>
                <button
                  className={`choice-btn ${betChoice === 'TAILS' ? 'active tails' : ''}`}
                  onClick={() => setBetChoice('TAILS')}
                  disabled={betting || room.status !== 'active'}
                >
                  <div className="choice-icon">🎰</div>
                  <div className="choice-label">TAILS</div>
                </button>
              </div>
            </div>

            {/* Bet Button */}
            <button
              className="btn btn-primary"
              onClick={placeBet}
              disabled={betting || room.status !== 'active'}
              style={{width: '100%', padding: '16px', fontSize: '1.2rem'}}
            >
              {betting ? '🎲 Подбрасываем...' : room.status !== 'active' ? '⏸️ Комната закрыта' : '🚀 Сделать ставку'}
            </button>

            <p className="text-muted text-center mt-2" style={{fontSize: '0.85rem'}}>
              Ты играешь в демо‑режиме. Представь, что это реальные деньги.
            </p>
          </div>

          {/* Bets History */}
          <div className="bets-history card">
            <h3 style={{marginBottom: '1rem'}}>История ставок</h3>
            
            {bets.length === 0 ? (
              <div className="text-center text-muted" style={{padding: '40px 0'}}>
                Пока никто не делал ставок
              </div>
            ) : (
              <div className="bets-list">
                {bets.map(bet => (
                  <div key={bet.id} className="bet-item">
                    <div className="bet-info">
                      <span className="bet-username">{bet.username || 'Guest'}</span>
                      <span className="bet-meta">
                        ${bet.amount.toFixed(2)} на {bet.choice}
                      </span>
                    </div>
                    <div className={`bet-outcome ${bet.won ? 'win' : 'loss'}`}>
                      {bet.won ? (
                        <>
                          <span className="outcome-icon">✅</span>
                          <span className="outcome-text">+${bet.payout.toFixed(2)}</span>
                        </>
                      ) : (
                        <>
                          <span className="outcome-icon">❌</span>
                          <span className="outcome-text">-${bet.amount.toFixed(2)}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="cta-section">
          <div className="cta-card card">
            <h3 style={{marginBottom: '1rem'}}>💡 Представь, что это твоя комната</h3>
            <p className="text-secondary" style={{marginBottom: '1.5rem'}}>
              Хост этой комнаты {room.demo_profit >= 0 ? 'заработал' : 'потерял'} <strong style={{color: room.demo_profit >= 0 ? 'var(--neon-green)' : 'var(--danger)'}}>${Math.abs(room.demo_profit).toFixed(2)}</strong> за всё время.
            </p>
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                🚀 Создать свою комнату
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Ссылка скопирована!');
                }}
              >
                🔗 Поделиться
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Room;
