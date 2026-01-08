# 🚀 Casino.fun - Deployment Instructions

## Архитектура деплоя

```
GitHub Repository
├── Frontend → GitHub Pages (автоматически)
└── Backend → Render.com (бесплатно)
```

---

## 📦 Деплой Backend на Render.com

### Шаг 1: Подготовка файлов

Создай файл `render.yaml` в корне проекта (уже создан):

```yaml
services:
  - type: web
    name: casinofun-api
    runtime: python
    buildCommand: "pip install -r backend/requirements.txt"
    startCommand: "cd backend && gunicorn app:app"
    envVars:
      - key: PYTHON_VERSION
        value: 3.12.0
      - key: PORT
        value: 5000
```

### Шаг 2: Регистрация на Render.com

1. Перейди на https://render.com
2. Зарегистрируйся через GitHub
3. Разреши доступ к репозиторию `casinofun`

### Шаг 3: Создание Web Service

1. Нажми "New" → "Web Service"
2. Выбери репозиторий `kisa134/casinofun`
3. Настройки:
   - **Name:** casinofun-api
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `cd backend && gunicorn app:app`
   - **Plan:** Free

4. Environment Variables:
   ```
   PYTHON_VERSION=3.12.0
   PORT=5000
   SECRET_KEY=your-secret-key-change-this
   ```

5. Нажми "Create Web Service"

### Шаг 4: Дождись деплоя

- Render автоматически задеплоит backend
- URL будет примерно: `https://casinofun-api.onrender.com`
- Запомни этот URL!

---

## 🌐 Деплой Frontend на GitHub Pages

### Шаг 1: Обновление API URL

Обнови `frontend/src/api.js`:

```javascript
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://casinofun-api.onrender.com/api'  // ⬅️ твой Render URL
  : '/api';
```

### Шаг 2: Обновление vite.config.js

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/casinofun/',  // ⬅️ важно для GitHub Pages
  // ... rest
})
```

### Шаг 3: Включение GitHub Pages

1. Зайди в настройки репозитория на GitHub
2. Settings → Pages
3. Source: "GitHub Actions"
4. Сохрани

### Шаг 4: Push и деплой

```bash
git add .
git commit -m "Configure for production deployment"
git push origin main
```

GitHub Actions автоматически:
- Соберёт фронтенд
- Задеплоит на GitHub Pages
- URL: `https://kisa134.github.io/casinofun/`

---

## 🔧 Настройка CORS на Backend

Обнови `backend/app.py`:

```python
from flask_cors import CORS

# После создания app:
CORS(app, origins=[
    'https://kisa134.github.io',
    'http://localhost:5173'
])
```

---

## 🤖 Деплой Bot Engine

### Вариант 1: На том же Render (Background Worker)

1. В Render создай "Background Worker"
2. Настройки:
   - **Name:** casinofun-bots
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `cd backend && python bot_engine.py`

### Вариант 2: Локально (для начала)

Просто запусти локально:
```bash
./start_bots.sh
```

---

## ✅ Проверка деплоя

### Backend Health Check:
```bash
curl https://casinofun-api.onrender.com/api/health
```

Должно вернуть:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### Frontend:
Открой: https://kisa134.github.io/casinofun/

Должна открыться главная страница.

---

## 🎯 Quick Start Guide (После деплоя)

### 1. Push на GitHub:
```bash
cd /home/claude/casinofun
git add .
git commit -m "Production ready"
git push origin main
```

### 2. Настрой Render.com:
- Создай Web Service из репозитория
- Скопируй URL бэкенда

### 3. Обнови frontend/src/api.js:
- Вставь URL бэкенда
- Закоммить и запушить

### 4. Включи GitHub Pages:
- Settings → Pages → GitHub Actions

### 5. Готово! 🎉
- Frontend: https://kisa134.github.io/casinofun/
- Backend: https://casinofun-api.onrender.com

---

## 🐛 Troubleshooting

### Frontend не работает:
- Проверь CORS на бэкенде
- Проверь API URL в api.js
- Посмотри Console в браузере

### Backend падает:
- Проверь логи в Render Dashboard
- Убедись что requirements.txt корректен
- Проверь environment variables

### База данных теряется:
- На Free плане Render файловая система ephemeral
- Решение: используй Render PostgreSQL (платно)
- Или: используй Supabase (бесплатно до лимита)

---

## 💰 Стоимость

### Бесплатный вариант:
- GitHub Pages: бесплатно
- Render.com Free: бесплатно
- **Total: $0/месяц** ✅

Ограничения:
- Backend засыпает через 15 минут неактивности
- 750 часов/месяц runtime
- 100GB bandwidth

### Платный вариант ($7-25/месяц):
- Render Starter: $7/месяц (всегда активен)
- PostgreSQL: $7/месяц (персистентная БД)
- Custom domain: бесплатно

---

## 🔄 CI/CD Pipeline

После настройки:

```
Push to GitHub
    ↓
GitHub Actions
    ↓
    ├─→ Build Frontend → GitHub Pages
    └─→ Render auto-deploy Backend
    ↓
Live in 2-3 minutes! 🚀
```

---

## 📝 Environment Variables (Production)

### Backend (Render):
```env
PYTHON_VERSION=3.12.0
PORT=5000
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://... (если используешь PostgreSQL)
CORS_ORIGINS=https://kisa134.github.io
```

### Frontend (в коде):
```javascript
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://casinofun-api.onrender.com/api'
  : '/api';
```

---

## 🎉 Success!

После выполнения всех шагов у тебя будет:

✅ Backend API live на Render.com
✅ Frontend live на GitHub Pages
✅ Автоматический CI/CD
✅ Бесплатный хостинг
✅ HTTPS из коробки

**Время деплоя: ~10-15 минут** ⏱️

---

## 🚀 Next Steps

1. **Custom Domain** (опционально):
   - Купи домен на Namecheap ($10/год)
   - Настрой DNS на GitHub Pages
   - Добавь домен в Render

2. **Database Upgrade**:
   - Migrate на PostgreSQL
   - Используй Supabase или Render PostgreSQL

3. **Monitoring**:
   - Настрой Sentry для ошибок
   - Добавь Google Analytics

4. **Performance**:
   - Включи CDN через Cloudflare
   - Оптимизируй assets

---

**Happy Deploying! 🎰**
