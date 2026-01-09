from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, User, Room, Bet, Event
import random
from datetime import datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///casino.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'

# CORS для production и development
CORS(app, origins=[
    'https://kisa134.github.io',  # GitHub Pages
    'http://localhost:5173',      # Local development
    'http://localhost:5000'       # Local backend
])
db.init_app(app)

# Game constants
MAX_BET_PERCENT = 0.05  # Max bet is 5% of bankroll
PLATFORM_FEE_BPS = 100  # 1% platform fee

def flip_coin():
    """Simulate coin flip"""
    return random.choice(['HEADS', 'TAILS'])

def calculate_payout(amount, house_edge_bps, won):
    """Calculate payout with house edge"""
    if not won:
        return 0.0
    
    # Ideal payout is 2x
    ideal_payout = amount * 2
    
    # Apply house edge
    house_edge_multiplier = 1 - (house_edge_bps / 10000)
    actual_payout = ideal_payout * house_edge_multiplier
    
    return actual_payout

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'timestamp': datetime.utcnow().isoformat()})

@app.route('/api/rooms', methods=['GET'])
def get_rooms():
    """Get list of rooms with optional filters"""
    stage_filter = request.args.get('stage')
    theme_filter = request.args.get('theme')
    limit = request.args.get('limit', 50, type=int)
    
    query = Room.query.filter_by(status='active')
    
    if theme_filter:
        query = query.filter_by(theme=theme_filter)
    
    rooms = query.order_by(Room.created_at.desc()).limit(limit).all()
    
    # Filter by stage if needed (done in Python since it's a property)
    if stage_filter:
        rooms = [r for r in rooms if r.stage == stage_filter]
    
    # Check and update expired rooms
    for room in rooms:
        if room.is_expired and room.status == 'active':
            room.status = 'expired'
            db.session.commit()
    
    return jsonify([room.to_dict() for room in rooms])

@app.route('/api/rooms/<public_code>', methods=['GET'])
def get_room(public_code):
    """Get specific room by public code"""
    room = Room.query.filter_by(public_code=public_code).first()
    
    if not room:
        return jsonify({'error': 'Room not found'}), 404
    
    # Check if expired
    if room.is_expired and room.status == 'active':
        room.status = 'expired'
        db.session.commit()
    
    return jsonify(room.to_dict(include_owner=True))

@app.route('/api/rooms', methods=['POST'])
def create_room():
    """Create a new room"""
    data = request.json
    
    # Validate required fields
    if not data.get('name'):
        return jsonify({'error': 'Room name is required'}), 400
    
    # Get or create user
    owner_id = data.get('owner_id')
    ref_code = data.get('ref_code')
    
    if not owner_id:
        # Create anonymous user
        user = User(username=None)
        
        # Handle referral
        if ref_code:
            referrer = User.query.filter_by(ref_code=ref_code).first()
            if referrer:
                user.referred_by_user_id = referrer.id
                referrer.ref_count += 1
        
        db.session.add(user)
        db.session.flush()
        owner_id = user.id
    
    # Create room
    room = Room(
        name=data['name'],
        theme=data.get('theme', 'degen_pit'),
        house_edge_bps=data.get('house_edge_bps', 200),
        lifetime_seconds=data.get('lifetime_seconds', 86400),
        owner_id=owner_id
    )
    
    db.session.add(room)
    
    # Create event
    event = Event(
        event_type='room_created',
        room_id=room.id,
        user_id=owner_id,
        message=f'New room "{room.name}" created with {room.house_edge_bps/100}% edge'
    )
    db.session.add(event)
    
    db.session.commit()
    
    return jsonify(room.to_dict(include_owner=True)), 201

@app.route('/api/rooms/<public_code>/bet', methods=['POST'])
def place_bet(public_code):
    """Place a bet in a room"""
    room = Room.query.filter_by(public_code=public_code).first()
    
    if not room:
        return jsonify({'error': 'Room not found'}), 404
    
    # Check if room is active
    if room.is_expired and room.status == 'active':
        room.status = 'expired'
        db.session.commit()
        return jsonify({'error': 'Room has expired'}), 400
    
    if room.status != 'active':
        return jsonify({'error': 'Room is not active'}), 400
    
    data = request.json
    
    # Validate bet data
    amount = data.get('amount', 0)
    choice = data.get('choice', '').upper()
    user_id = data.get('user_id')
    
    if amount <= 0:
        return jsonify({'error': 'Bet amount must be positive'}), 400
    
    if choice not in ['HEADS', 'TAILS']:
        return jsonify({'error': 'Choice must be HEADS or TAILS'}), 400
    
    # Check max bet
    max_bet = room.bankroll_demo * MAX_BET_PERCENT
    if amount > max_bet:
        return jsonify({'error': f'Maximum bet is {max_bet:.2f} (5% of bankroll)'}), 400
    
    # Flip the coin
    result = flip_coin()
    won = (result == choice)
    
    # Calculate payout
    bankroll_before = room.bankroll_demo
    payout = calculate_payout(amount, room.house_edge_bps, won)
    
    # Update bankroll
    if won:
        room.bankroll_demo -= payout
        room.bankroll_demo += amount  # Get back original bet
    else:
        room.bankroll_demo += amount
    
    bankroll_after = room.bankroll_demo
    
    # Create bet record
    bet = Bet(
        room_id=room.id,
        user_id=user_id,
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
    
    # Track unique players
    if user_id:
        existing_bet = Bet.query.filter_by(room_id=room.id, user_id=user_id).first()
        if not existing_bet:
            room.unique_players += 1
    
    # Create event for big wins/losses
    if won and amount >= 50:
        username = User.query.get(user_id).username if user_id else 'Guest'
        multiplier = payout / amount
        event = Event(
            event_type='big_win',
            room_id=room.id,
            user_id=user_id,
            bet_id=bet.id,
            message=f'{username or "Guest"} won {multiplier:.2f}x in {room.name}'
        )
        db.session.add(event)
    
    db.session.commit()
    
    return jsonify({
        'bet': bet.to_dict(),
        'room': room.to_dict()
    })

@app.route('/api/rooms/<public_code>/bets', methods=['GET'])
def get_room_bets(public_code):
    """Get recent bets for a room"""
    room = Room.query.filter_by(public_code=public_code).first()
    
    if not room:
        return jsonify({'error': 'Room not found'}), 404
    
    limit = request.args.get('limit', 20, type=int)
    bets = Bet.query.filter_by(room_id=room.id).order_by(Bet.created_at.desc()).limit(limit).all()
    
    return jsonify([bet.to_dict() for bet in bets])

@app.route('/api/events', methods=['GET'])
def get_events():
    """Get global events feed"""
    limit = request.args.get('limit', 50, type=int)
    events = Event.query.order_by(Event.created_at.desc()).limit(limit).all()
    
    return jsonify([event.to_dict() for event in events])

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get user profile"""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get user's rooms
    rooms = Room.query.filter_by(owner_id=user_id).order_by(Room.created_at.desc()).all()
    
    # Calculate stats
    total_volume = sum(r.total_volume for r in rooms)
    total_profit = sum(r.demo_profit for r in rooms)
    
    return jsonify({
        'user': user.to_dict(),
        'rooms': [r.to_dict() for r in rooms],
        'stats': {
            'total_rooms': len(rooms),
            'total_volume': round(total_volume, 2),
            'total_profit': round(total_profit, 2),
            'active_rooms': len([r for r in rooms if r.status == 'active'])
        }
    })

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    """Get leaderboard data"""
    leaderboard_type = request.args.get('type', 'hosts_profit')
    limit = request.args.get('limit', 10, type=int)
    
    if leaderboard_type == 'hosts_profit':
        # Top hosts by demo profit
        rooms = Room.query.all()
        host_profits = {}
        
        for room in rooms:
            owner_id = room.owner_id
            if owner_id not in host_profits:
                host_profits[owner_id] = 0
            host_profits[owner_id] += room.demo_profit
        
        # Sort and get top
        sorted_hosts = sorted(host_profits.items(), key=lambda x: x[1], reverse=True)[:limit]
        
        result = []
        for user_id, profit in sorted_hosts:
            user = User.query.get(user_id)
            if user:
                result.append({
                    'user': user.to_dict(),
                    'profit': round(profit, 2)
                })
        
        return jsonify(result)
    
    elif leaderboard_type == 'rooms_volume':
        # Top rooms by volume
        rooms = Room.query.order_by(Room.total_volume.desc()).limit(limit).all()
        return jsonify([r.to_dict(include_owner=True) for r in rooms])
    
    else:
        return jsonify({'error': 'Invalid leaderboard type'}), 400

@app.route('/api/stats', methods=['GET'])
def get_global_stats():
    """Get global platform statistics"""
    total_rooms = Room.query.count()
    active_rooms = Room.query.filter_by(status='active').count()
    total_bets = Bet.query.count()
    total_volume = db.session.query(db.func.sum(Room.total_volume)).scalar() or 0
    total_users = User.query.count()
    
    return jsonify({
        'total_rooms': total_rooms,
        'active_rooms': active_rooms,
        'total_bets': total_bets,
        'total_volume': round(total_volume, 2),
        'total_users': total_users
    })

# Initialize database (only create tables if they don't exist)
import os
with app.app_context():
    # Check if database file exists, if not - create tables
    db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
    if not os.path.exists(db_path):
        db.create_all()
        print("Database initialized!")
    else:
        # Just ensure connection works
        db.engine.connect()
        print("Database connected!")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
