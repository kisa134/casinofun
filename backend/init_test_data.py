"""
Скрипт для генерации начальных тестовых данных
"""
from app import app
from models import db, User, Room, Event
import random

ROOM_NAMES = [
    "Prison Yard #42", "Cartel Pit Supreme", "Virus Lab Zero",
    "Degen Moon Mission", "Cyber Club Matrix", "El Jefe's Palace",
    "Lockdown Arena", "Outbreak Zone", "YOLO Factory",
    "Neon Nights Casino"
]

THEMES = ['prison', 'cartel', 'virus', 'degen_pit', 'cyber_club']

def init_test_data():
    with app.app_context():
        # Удаляем старые данные
        print("Clearing old data...")
        db.drop_all()
        db.create_all()
        
        print("Creating test users...")
        # Создаём несколько пользователей
        users = []
        for i in range(5):
            user = User(
                username=f"Player{i+1}",
                is_bot=False
            )
            db.session.add(user)
            users.append(user)
        
        db.session.commit()
        
        print("Creating test rooms...")
        # Создаём несколько комнат
        for i in range(len(ROOM_NAMES)):
            room = Room(
                name=ROOM_NAMES[i],
                theme=random.choice(THEMES),
                house_edge_bps=random.choice([150, 200, 250, 300]),
                lifetime_seconds=random.choice([43200, 86400, 172800]),
                owner_id=users[i % len(users)].id,
                bankroll_demo=random.uniform(800, 1200)
            )
            db.session.add(room)
            
            # Создаём событие
            event = Event(
                event_type='room_created',
                room_id=room.id,
                user_id=room.owner_id,
                message=f'🎰 New room "{room.name}" just opened!'
            )
            db.session.add(event)
        
        db.session.commit()
        
        print(f"✅ Created {len(users)} users and {len(ROOM_NAMES)} rooms")
        print("\nTest data initialized! You can now:")
        print("1. Run bot_engine.py to add more activity")
        print("2. Open frontend and start playing")

if __name__ == '__main__':
    init_test_data()
