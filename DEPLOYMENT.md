# 🚀 Casino.fun - Deployment Guide

## Быстрый старт (для локальной разработки)

### Вариант 1: Автоматический запуск (рекомендуется)

```bash
./start.sh
```

Этот скрипт запустит:
- Backend (Flask) на `http://localhost:5000`
- Bot Engine (генератор активности)
- Frontend (React) на `http://localhost:5173`

### Вариант 2: Ручной запуск

#### Шаг 1: Backend
```bash
cd backend
pip install -r requirements.txt --break-system-packages
python3 init_test_data.py  # Инициализация тестовых данных
python3 app.py
```

#### Шаг 2: Bot Engine (в отдельном терминале)
```bash
cd backend
python3 bot_engine.py
```

#### Шаг 3: Frontend (в отдельном терминале)
```bash
cd frontend
npm install
npm run dev
```

## 📦 Production Deployment

### Backend (Flask)

#### Использование Gunicorn (рекомендуется)

1. Установка:
```bash
pip install gunicorn
```

2. Запуск:
```bash
cd backend
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

#### Docker (альтернатива)

Создайте `Dockerfile` в `backend/`:
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

Запуск:
```bash
docker build -t casino-backend .
docker run -p 5000:5000 casino-backend
```

### Frontend (React)

#### Build для production

```bash
cd frontend
npm run build
```

Это создаст оптимизированную версию в папке `dist/`.

#### Деплой на Vercel

1. Установка Vercel CLI:
```bash
npm i -g vercel
```

2. Деплой:
```bash
cd frontend
vercel
```

#### Деплой на Netlify

1. Установка Netlify CLI:
```bash
npm i -g netlify-cli
```

2. Деплой:
```bash
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

#### Nginx (для статики)

Конфигурация nginx:
```nginx
server {
    listen 80;
    server_name casino.fun;
    
    location / {
        root /var/www/casino-frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Bot Engine

Для production рекомендуется запускать как systemd service:

Создайте `/etc/systemd/system/casino-bot.service`:
```ini
[Unit]
Description=Casino.fun Bot Engine
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/casinofun/backend
ExecStart=/usr/bin/python3 bot_engine.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Запуск:
```bash
sudo systemctl enable casino-bot
sudo systemctl start casino-bot
```

## 🔧 Настройка Environment Variables

Создайте `.env` файл в `backend/`:

```env
# Flask
SECRET_KEY=your-secret-key-change-this
FLASK_ENV=production

# Database
DATABASE_URL=sqlite:///casino.db
# или для PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost/casino

# CORS
CORS_ORIGINS=https://casino.fun,https://www.casino.fun

# Bot Engine
BOT_ENABLED=true
BOT_INTERVAL=30
BOT_TARGET_ROOMS=10
```

Обновите `app.py`:
```python
import os
from dotenv import load_dotenv

load_dotenv()

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///casino.db')

CORS(app, origins=os.getenv('CORS_ORIGINS', '*').split(','))
```

## 🗄️ Миграция на PostgreSQL

1. Установка:
```bash
pip install psycopg2-binary
```

2. Обновите DATABASE_URL в `.env`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/casino_db
```

3. Создайте БД:
```bash
createdb casino_db
```

4. Инициализация:
```python
python3 init_test_data.py
```

## 📊 Мониторинг

### Backend health check

```bash
curl http://localhost:5000/api/health
```

### Логирование

Добавьте в `app.py`:
```python
import logging
from logging.handlers import RotatingFileHandler

if not app.debug:
    handler = RotatingFileHandler('casino.log', maxBytes=10000, backupCount=3)
    handler.setLevel(logging.INFO)
    app.logger.addHandler(handler)
```

## 🔒 Безопасность

### Для production обязательно:

1. Измените SECRET_KEY на уникальный
2. Используйте HTTPS (Let's Encrypt)
3. Настройте CORS правильно (не используйте `*`)
4. Ограничьте rate limiting
5. Добавьте валидацию входных данных
6. Используйте prepared statements (SQLAlchemy делает это)
7. Добавьте CSRF protection

### Rate Limiting

Установка Flask-Limiter:
```bash
pip install Flask-Limiter
```

В `app.py`:
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/api/rooms', methods=['POST'])
@limiter.limit("10 per hour")
def create_room():
    # ...
```

## 🎯 Performance Optimization

### Backend

1. Включите кэширование:
```bash
pip install Flask-Caching
```

```python
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'simple'})

@app.route('/api/rooms')
@cache.cached(timeout=5)
def get_rooms():
    # ...
```

2. Database connection pooling (для PostgreSQL):
```python
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 10,
    'pool_recycle': 3600,
}
```

### Frontend

1. Code splitting (React Router уже поддерживает)
2. Image optimization
3. CDN для статики
4. Service Worker для PWA

## 📱 Mobile App (опционально)

Используйте React Native или создайте PWA:

Добавьте `manifest.json` и service worker для PWA.

## 🔄 CI/CD

### GitHub Actions пример

Создайте `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy Backend
        run: |
          # ваши команды деплоя
          
      - name: Deploy Frontend
        run: |
          cd frontend
          npm install
          npm run build
          # деплой на Vercel/Netlify
```

## 🆘 Troubleshooting

### Backend не запускается
- Проверьте, что установлены все зависимости
- Проверьте порт 5000 (может быть занят)
- Посмотрите логи: `python3 app.py 2>&1 | tee app.log`

### Frontend не подключается к API
- Проверьте CORS настройки
- Убедитесь, что backend запущен
- Проверьте proxy в `vite.config.js`

### База данных не создаётся
- Проверьте права на запись
- Попробуйте удалить `casino.db` и запустить заново

## 📞 Support

Если возникли проблемы, проверьте:
1. Версии Python (3.12+) и Node (18+)
2. Установлены ли все зависимости
3. Доступны ли порты 5000 и 5173
4. Логи ошибок в консоли

---

**Happy Gaming! 🎰**
