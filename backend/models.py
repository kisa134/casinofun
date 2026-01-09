from datetime import datetime, timedelta
from flask_sqlalchemy import SQLAlchemy
import secrets
import string

db = SQLAlchemy()

def generate_code(length=8):
    """Generate random alphanumeric code"""
    return ''.join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(length))

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=True)
    ref_code = db.Column(db.String(20), unique=True, default=generate_code)
    referred_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    ref_count = db.Column(db.Integer, default=0)
    is_bot = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    rooms = db.relationship('Room', backref='owner', lazy=True, foreign_keys='Room.owner_id')
    bets = db.relationship('Bet', backref='player', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'ref_code': self.ref_code,
            'ref_count': self.ref_count,
            'is_bot': self.is_bot,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Room(db.Model):
    __tablename__ = 'rooms'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    theme = db.Column(db.String(50), default='degen_pit')  # prison, cartel, virus, degen_pit, cyber_club
    game_type = db.Column(db.String(50), default='coinflip')
    house_edge_bps = db.Column(db.Integer, default=200)  # 2% = 200 basis points
    bankroll_demo = db.Column(db.Float, default=1000.0)
    bankroll_real = db.Column(db.Float, default=0.0)
    public_code = db.Column(db.String(20), unique=True, default=generate_code)
    lifetime_seconds = db.Column(db.Integer, default=86400)  # 24 hours
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_bot_owned = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default='active')  # active, expired, suspended
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    
    # Stats
    total_bets = db.Column(db.Integer, default=0)
    total_volume = db.Column(db.Float, default=0.0)
    unique_players = db.Column(db.Integer, default=0)
    
    # Relationships
    bets = db.relationship('Bet', backref='room', lazy=True)
    
    def __init__(self, **kwargs):
        super(Room, self).__init__(**kwargs)
        if not self.expires_at:
            self.expires_at = datetime.utcnow() + timedelta(seconds=self.lifetime_seconds)
    
    @property
    def time_remaining(self):
        """Get remaining time in seconds"""
        if self.status != 'active':
            return 0
        remaining = (self.expires_at - datetime.utcnow()).total_seconds()
        return max(0, int(remaining))
    
    @property
    def is_expired(self):
        """Check if room has expired"""
        return datetime.utcnow() > self.expires_at
    
    @property
    def stage(self):
        """Determine room stage: new, peak, fading"""
        if self.status != 'active':
            return 'expired'
        
        elapsed = (datetime.utcnow() - self.created_at).total_seconds()
        lifetime = self.lifetime_seconds
        progress = elapsed / lifetime
        
        if progress < 0.2:
            return 'new'
        elif progress < 0.7:
            return 'peak'
        else:
            return 'fading'
    
    @property
    def demo_profit(self):
        """Calculate demo profit for owner"""
        return self.bankroll_demo - 1000.0  # Initial bankroll was 1000
    
    def to_dict(self, include_owner=False):
        data = {
            'id': self.id,
            'name': self.name,
            'theme': self.theme,
            'game_type': self.game_type,
            'house_edge_bps': self.house_edge_bps,
            'house_edge_percent': self.house_edge_bps / 100,
            'bankroll_demo': round(self.bankroll_demo, 2),
            'public_code': self.public_code,
            'lifetime_seconds': self.lifetime_seconds,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'time_remaining': self.time_remaining,
            'stage': self.stage,
            'total_bets': self.total_bets,
            'total_volume': round(self.total_volume, 2),
            'unique_players': self.unique_players,
            'demo_profit': round(self.demo_profit, 2),
            'is_bot_owned': self.is_bot_owned
        }
        
        if include_owner:
            data['owner'] = self.owner.to_dict() if self.owner else None
            
        return data

class Bet(db.Model):
    __tablename__ = 'bets'
    
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Nullable for guests
    amount = db.Column(db.Float, nullable=False)
    choice = db.Column(db.String(10), nullable=False)  # HEADS or TAILS
    result = db.Column(db.String(10), nullable=False)  # HEADS or TAILS
    won = db.Column(db.Boolean, nullable=False)
    payout = db.Column(db.Float, default=0.0)
    bankroll_before = db.Column(db.Float, nullable=False)
    bankroll_after = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'room_id': self.room_id,
            'user_id': self.user_id,
            'username': self.player.username if self.player else 'Guest',
            'amount': round(self.amount, 2),
            'choice': self.choice,
            'result': self.result,
            'won': self.won,
            'payout': round(self.payout, 2),
            'bankroll_before': round(self.bankroll_before, 2),
            'bankroll_after': round(self.bankroll_after, 2),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Event(db.Model):
    """Global events feed"""
    __tablename__ = 'events'
    
    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(50), nullable=False)  # room_created, big_win, big_loss
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    bet_id = db.Column(db.Integer, db.ForeignKey('bets.id'), nullable=True)
    message = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'event_type': self.event_type,
            'message': self.message,
            'room_id': self.room_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
