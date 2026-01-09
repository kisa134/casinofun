import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import './SlotMachine.css';

const SYMBOLS = ['🍒', '🍋', '💎', '🔥', '💰', '⭐', '🎰'];

const SYMBOL_VALUES = {
  '🍒': 2,
  '🍋': 2,
  '💎': 5,
  '🔥': 10,
  '💰': 20,
  '⭐': 50,  // SCATTER - Free Spins
  '🎰': 100  // JACKPOT!
};

const BET_AMOUNTS = [1, 5, 10, 50, 100];

function SlotMachine({ roomId, onBet }) {
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState(['🍒', '🍒', '🍒']);
  const [win, setWin] = useState(0);
  const [showBigWin, setShowBigWin] = useState(false);
  const [totalWagered, setTotalWagered] = useState(0);
  const [history, setHistory] = useState([]);
  const [freeSpins, setFreeSpins] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  // Sound effects (будем использовать Web Audio API)
  const playSound = (type) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
      case 'spin':
        oscillator.frequency.value = 200;
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case 'win':
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.2;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case 'bigwin':
        // Multiple tones for big win
        [600, 800, 1000].forEach((freq, i) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.value = freq;
          gain.gain.value = 0.1;
          osc.start(audioContext.currentTime + i * 0.1);
          osc.stop(audioContext.currentTime + i * 0.1 + 0.3);
        });
        break;
    }
  };

  const getRandomSymbol = () => {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  };

  const calculateWin = (result) => {
    // Check for three of a kind
    if (result[0] === result[1] && result[1] === result[2]) {
      const symbol = result[0];
      const baseWin = SYMBOL_VALUES[symbol] || 1;
      return bet * baseWin * multiplier;
    }
    
    // Check for two of a kind
    if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
      const symbol = result[0] === result[1] ? result[0] : (result[1] === result[2] ? result[1] : result[0]);
      const baseWin = SYMBOL_VALUES[symbol] || 1;
      return bet * (baseWin / 2) * multiplier;
    }
    
    return 0;
  };

  const checkFreeSpins = (result) => {
    // Count scatter symbols (⭐)
    const scatterCount = result.filter(s => s === '⭐').length;
    if (scatterCount >= 2) {
      return scatterCount * 5; // 2 scatters = 10 free spins, 3 = 15
    }
    return 0;
  };

  const spin = async () => {
    if (spinning) return;
    if (balance < bet && freeSpins === 0) return;
    
    setSpinning(true);
    setWin(0);
    playSound('spin');
    
    // Deduct bet if not free spin
    if (freeSpins === 0) {
      setBalance(balance - bet);
      setTotalWagered(totalWagered + bet);
    } else {
      setFreeSpins(freeSpins - 1);
    }
    
    // Animate reels spinning
    let spinCount = 0;
    const spinInterval = setInterval(() => {
      setReels([getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]);
      spinCount++;
    }, 100);
    
    // Stop after 2 seconds
    setTimeout(() => {
      clearInterval(spinInterval);
      
      // Final result
      const finalReels = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
      setReels(finalReels);
      
      // Calculate winnings
      const winAmount = calculateWin(finalReels);
      const newFreeSpins = checkFreeSpins(finalReels);
      
      if (newFreeSpins > 0) {
        setFreeSpins(freeSpins + newFreeSpins);
        playSound('win');
      }
      
      if (winAmount > 0) {
        setWin(winAmount);
        setBalance(balance + winAmount);
        
        // Big win animation for 10x or more
        if (winAmount >= bet * 10) {
          setShowBigWin(true);
          playSound('bigwin');
          setTimeout(() => setShowBigWin(false), 3000);
        } else {
          playSound('win');
        }
        
        // Add to history
        setHistory([{ reels: finalReels, win: winAmount, bet }, ...history.slice(0, 9)]);
      } else {
        setHistory([{ reels: finalReels, win: 0, bet }, ...history.slice(0, 9)]);
      }
      
      setSpinning(false);
    }, 2000);
  };

  const maxBet = () => {
    setBet(Math.min(balance, 100));
  };

  const getWinMultiplier = () => {
    if (win === 0) return '';
    const mult = win / bet;
    if (mult >= 100) return '💎 JACKPOT! 💎';
    if (mult >= 50) return '🔥 MEGA WIN! 🔥';
    if (mult >= 10) return '⭐ BIG WIN! ⭐';
    return '💰 WIN! 💰';
  };

  return (
    <div className="slot-machine-container">
      {showBigWin && <Confetti numberOfPieces={500} recycle={false} />}
      
      <div className="slot-machine">
        {/* Header */}
        <div className="slot-header">
          <h1>🎰 MEGA SLOTS 💎</h1>
          <div className="stats">
            <div className="stat">
              <span className="label">Balance</span>
              <span className="value">${balance.toFixed(2)}</span>
            </div>
            <div className="stat">
              <span className="label">Total Wagered</span>
              <span className="value">${totalWagered.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Slot Display */}
        <div className="slot-display">
          <div className="reels-container">
            {reels.map((symbol, index) => (
              <motion.div
                key={index}
                className={`reel ${spinning ? 'spinning' : ''}`}
                animate={spinning ? {
                  y: [0, -20, 0],
                  transition: { repeat: Infinity, duration: 0.1 }
                } : {}}
              >
                {symbol}
              </motion.div>
            ))}
          </div>
          
          {/* Win Display */}
          <AnimatePresence>
            {win > 0 && (
              <motion.div
                className="win-display"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <div className="win-text">{getWinMultiplier()}</div>
                <div className="win-amount">${win.toFixed(2)}</div>
                <div className="win-multiplier">{(win / bet).toFixed(2)}x</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Game Info */}
        <div className="game-info">
          <div className="info-row">
            <span>Free Spins: <strong>{freeSpins}</strong></span>
            <span>Multiplier: <strong>{multiplier}x</strong></span>
            <span>Bet: <strong>${bet}</strong></span>
          </div>
        </div>

        {/* Bet Controls */}
        <div className="bet-controls">
          <div className="bet-buttons">
            {BET_AMOUNTS.map(amount => (
              <button
                key={amount}
                className={`bet-btn ${bet === amount ? 'active' : ''}`}
                onClick={() => setBet(amount)}
                disabled={spinning || balance < amount}
              >
                ${amount}
              </button>
            ))}
            <button
              className="bet-btn max"
              onClick={maxBet}
              disabled={spinning}
            >
              MAX
            </button>
          </div>

          <motion.button
            className="spin-button"
            onClick={spin}
            disabled={spinning || (balance < bet && freeSpins === 0)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {spinning ? '🎰 SPINNING... 🎰' : 
             freeSpins > 0 ? '🎰 FREE SPIN! 🎰' : 
             '🎰 SPIN 🎰'}
          </motion.button>
        </div>

        {/* History */}
        <div className="spin-history">
          <h3>Last Spins</h3>
          <div className="history-items">
            {history.map((item, index) => (
              <div key={index} className={`history-item ${item.win > 0 ? 'win' : 'loss'}`}>
                <div className="history-reels">
                  {item.reels.map((symbol, i) => (
                    <span key={i}>{symbol}</span>
                  ))}
                </div>
                <div className="history-result">
                  {item.win > 0 ? (
                    <span className="win-text">+${item.win.toFixed(2)}</span>
                  ) : (
                    <span className="loss-text">-${item.bet.toFixed(2)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Paytable */}
        <div className="paytable">
          <h3>💰 Paytable</h3>
          <div className="paytable-items">
            {Object.entries(SYMBOL_VALUES).map(([symbol, value]) => (
              <div key={symbol} className="paytable-item">
                <span className="symbol">{symbol} {symbol} {symbol}</span>
                <span className="payout">{value}x</span>
              </div>
            ))}
          </div>
          <div className="paytable-note">
            ⭐ 2+ Scatters = Free Spins!
          </div>
        </div>
      </div>

      {/* Big Win Overlay */}
      <AnimatePresence>
        {showBigWin && (
          <motion.div
            className="big-win-overlay"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <motion.div
              className="big-win-content"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 1
              }}
            >
              <h1 className="big-win-title">💎 BIG WIN! 💎</h1>
              <div className="big-win-amount">${win.toFixed(2)}</div>
              <div className="big-win-multiplier">{(win / bet).toFixed(2)}x</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SlotMachine;
