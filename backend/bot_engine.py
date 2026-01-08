import random
import time
from datetime import datetime, timedelta
from models import db, User, Room, Bet, Event
from app import app, flip_coin, calculate_payout

# Bot names and themes
BOT_NAMES = [
    'CryptoWhale', 'DegenKing', 'MoonBoy', 'DiamondHands', 'PaperHands',
    'DegentGod', 'SolanaSurfer', 'EthMaxi', 'BTCHodler', 'AltcoinHunter',
    'YoloTrader', 'RugPuller', 'PumpChaser', 'DipBuyer', 'FomoMaster',
    'ChartWizard', 'TechAnalyst', 'WhaleWatcher', 'SerialAper', 'NFTFloor'
]

ROOM_THEMES = ['prison', 'cartel', 'virus', 'degen_pit', 'cyber_club']

ROOM_NAME_TEMPLATES = {
    'prison': ['Prison Yard', 'Cell Block', 'Lockdown', 'Solitary', 'Yard Time'],
    'cartel': ['Cartel Pit', 'Money Laundry', 'El Jefe', 'Sicario Den', 'Narco Palace'],
    'virus': ['Virus Lab', 'Patient Zero', 'Outbreak', 'Mutation', 'Contagion'],
    'degen_pit': ['Degen Pit', 'Ape Den', 'YOLO Zone', 'Moon Mission', 'FOMO Factory'],
    'cyber_club': ['Cyber Club', 'Neon Nights', 'Digital Den', 'Matrix', 'Virtual Vice']
}

class BotEngine:
    def __init__(self):
        self.target_active_rooms = 10
        self.target_bets_per_hour = 100
        
    def create_bot_user(self):
        """Create a bot user"""
        name = random.choice(BOT_NAMES) + str(random.randint(100, 999))
        user = User(
            username=name,
            is_bot=True
        )
        db.session.add(user)
        db.session.commit()
        return user
    
    def create_bot_room(self):
        """Create a bot-owned room"""
        theme = random.choice(ROOM_THEMES)
        name_base = random.choice(ROOM_NAME_TEMPLATES[theme])
        name = f"{name_base} #{random.randint(1, 99)}"
        
        # Get or create bot owner
        bot_users = User.query.filter_by(is_bot=True).all()
        if not bot_users or random.random() < 0.3:
            owner = self.create_bot_user()
        else:
            owner = random.choice(bot_users)
        
        # Random parameters
        house_edge = random.choice([100, 150, 200, 250, 300, 400, 500])
        lifetime = random.choice([43200, 86400, 129600, 172800])  # 12h, 24h, 36h, 48h
        
        room = Room(
            name=name,
            theme=theme,
            house_edge_bps=house_edge,
            lifetime_seconds=lifetime,
            owner_id=owner.id,
            is_bot_owned=True
        )
        
        db.session.add(room)
        
        # Create event
        event = Event(
            event_type='room_created',
            room_id=room.id,
            user_id=owner.id,
            message=f'Bot room "{room.name}" opened with {room.house_edge_bps/100}% edge'
        )
        db.session.add(event)
        
        db.session.commit()
        print(f"Created bot room: {room.name} ({room.public_code})")
        return room
    
    def place_bot_bet(self, room):
        """Place a bot bet in a room"""
        # Get or create bot player
        bot_users = User.query.filter_by(is_bot=True).all()
        if not bot_users:
            player = self.create_bot_user()
        else:
            player = random.choice(bot_users)
        
        # Determine bet style
        style = random.choices(
            ['conservative', 'moderate', 'aggressive', 'whale'],
            weights=[40, 35, 20, 5]
        )[0]
        
        max_bet = room.bankroll_demo * 0.05
        
        if style == 'conservative':
            amount = random.uniform(1, min(10, max_bet))
        elif style == 'moderate':
            amount = random.uniform(10, min(50, max_bet))
        elif style == 'aggressive':
            amount = random.uniform(50, min(200, max_bet))
        else:  # whale
            amount = random.uniform(200, max_bet)
        
        amount = round(amount, 2)
        choice = random.choice(['HEADS', 'TAILS'])
        
        # Simulate bet
        result = flip_coin()
        won = (result == choice)
        
        bankroll_before = room.bankroll_demo
        payout = calculate_payout(amount, room.house_edge_bps, won)
        
        if won:
            room.bankroll_demo -= payout
            room.bankroll_demo += amount
        else:
            room.bankroll_demo += amount
        
        bankroll_after = room.bankroll_demo
        
        # Create bet record
        bet = Bet(
            room_id=room.id,
            user_id=player.id,
            amount=amount,
            choice=choice,
            result=result,
            won=won,
            payout=payout if won else 0,
            bankroll_before=bankroll_before,
            bankroll_after=bankroll_after
        )
        
        db.session.add(bet)
        
        # Update room stats
        room.total_bets += 1
        room.total_volume += amount
        
        # Check if new player
        existing = Bet.query.filter_by(room_id=room.id, user_id=player.id).first()
        if not existing or existing.id == bet.id:
            room.unique_players += 1
        
        # Create event for big wins
        if won and amount >= 50:
            multiplier = payout / amount
            event = Event(
                event_type='big_win',
                room_id=room.id,
                user_id=player.id,
                bet_id=bet.id,
                message=f'{player.username} won {multiplier:.2f}x in {room.name}!'
            )
            db.session.add(event)
        
        db.session.commit()
        
        return bet
    
    def maintain_rooms(self):
        """Maintain target number of active rooms"""
        active_rooms = Room.query.filter_by(status='active').all()
        
        # Expire old rooms
        for room in active_rooms:
            if room.is_expired:
                room.status = 'expired'
                print(f"Expired room: {room.name}")
        
        db.session.commit()
        
        # Count active rooms again
        active_count = Room.query.filter_by(status='active').count()
        
        # Create new rooms if needed
        rooms_to_create = self.target_active_rooms - active_count
        if rooms_to_create > 0:
            print(f"Creating {rooms_to_create} new bot rooms...")
            for _ in range(rooms_to_create):
                self.create_bot_room()
    
    def generate_bets(self):
        """Generate bot bets across active rooms"""
        active_rooms = Room.query.filter_by(status='active').all()
        
        if not active_rooms:
            print("No active rooms, creating some...")
            self.maintain_rooms()
            return
        
        # Distribute bets across rooms
        num_bets = random.randint(5, 15)
        
        for _ in range(num_bets):
            room = random.choice(active_rooms)
            
            # Skip if room expired
            if room.is_expired:
                continue
            
            try:
                bet = self.place_bot_bet(room)
                result = "WON" if bet.won else "LOST"
                print(f"Bot bet: {bet.amount} on {bet.choice} -> {result} in {room.name}")
            except Exception as e:
                print(f"Error placing bot bet: {e}")
    
    def run_cycle(self):
        """Run one cycle of bot activity"""
        print("\n=== Bot Engine Cycle ===")
        self.maintain_rooms()
        self.generate_bets()
        print("========================\n")
    
    def run_forever(self, interval=30):
        """Run bot engine forever with specified interval"""
        print(f"Starting bot engine with {interval}s interval...")
        
        with app.app_context():
            while True:
                try:
                    self.run_cycle()
                    time.sleep(interval)
                except KeyboardInterrupt:
                    print("\nStopping bot engine...")
                    break
                except Exception as e:
                    print(f"Error in bot cycle: {e}")
                    time.sleep(interval)

if __name__ == '__main__':
    engine = BotEngine()
    engine.run_forever(interval=30)
