# 🚀 Casino.fun - Quick Start

## ⚡ Запуск за 3 команды

### Локальный запуск (для разработки):

```bash
# 1. Перейди в директорию проекта
cd casinofun

# 2. Запусти все (backend + frontend + bots)
./start.sh

# 3. Открой в браузере
# Frontend: http://localhost:5173
# API: http://localhost:5000/api
```

Готово! Проект запущен локально. 🎉

---

## 🌐 Деплой в Production (GitHub Pages + Render)

### Шаг 1: Push на GitHub

```bash
cd casinofun
git push origin main
```

### Шаг 2: Deploy Backend (Render.com)

1. Зайди на https://render.com
2. Зарегистрируйся через GitHub
3. New → Web Service
4. Выбери репозиторий `kisa134/casinofun`
5. Render автоматически найдет `render.yaml`
6. Нажми "Apply" и дождись деплоя
7. **Скопируй URL** (например: `https://casinofun-api.onrender.com`)

### Шаг 3: Обнови Frontend API URL

```bash
# Открой frontend/src/api.js
# Найди строку:
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://casinofun-api.onrender.com/api'  // ⬅️ ВСТАВЬ СВОЙ URL СЮДА
  : '/api';
```

### Шаг 4: Push изменений

```bash
git add frontend/src/api.js
git commit -m "Update production API URL"
git push origin main
```

### Шаг 5: Включи GitHub Pages

1. Зайди в Settings репозитория на GitHub
2. Pages → Source: "GitHub Actions"
3. Сохрани

GitHub Actions автоматически задеплоит frontend!

### Шаг 6: Готово! 🎉

Твой проект live:
- **Frontend:** https://kisa134.github.io/casinofun/
- **Backend:** https://casinofun-api.onrender.com

---

## 🎯 Что делать дальше?

### Для тестирования:
```bash
# Проверь backend
curl https://casinofun-api.onrender.com/api/health

# Открой frontend
open https://kisa134.github.io/casinofun/
```

### Для разработки:
```bash
# Запусти локально
./start.sh

# Проверь health
./health_check.sh
```

### Для документации:
- 📖 [README.md](README.md) - Основная документация
- 🚀 [DEPLOY_INSTRUCTIONS.md](DEPLOY_INSTRUCTIONS.md) - Подробный деплой
- 📋 [FEATURES.md](FEATURES.md) - Полное описание функций
- 📊 [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - Презентация проекта

---

## 🐛 Проблемы?

### Backend не запускается локально:
```bash
cd backend
pip install -r requirements.txt --break-system-packages
python app.py
```

### Frontend не собирается:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Git проблемы:
```bash
git config --global user.email "your@email.com"
git config --global user.name "Your Name"
```

---

## 💡 Pro Tips

### 1. Мониторинг деплоя:
- GitHub Actions: https://github.com/kisa134/casinofun/actions
- Render Dashboard: https://dashboard.render.com

### 2. Быстрые команды:
```bash
./health_check.sh     # Проверка системы
./start.sh            # Запуск всего
./start_bots.sh       # Только боты
```

### 3. Логи:
```bash
# Backend логи (локально)
cd backend && python app.py

# Render логи
# Смотри в Render Dashboard → Logs
```

---

## ⏱️ Таймлайн

**Локальный запуск:** 30 секунд
**Первый деплой:** 10-15 минут
**Последующие деплои:** 2-3 минуты (автоматически)

---

## 🎉 Success Checklist

- [ ] Проект запущен локально
- [ ] Backend задеплоен на Render
- [ ] Frontend задеплоен на GitHub Pages
- [ ] API URL обновлен
- [ ] Всё работает!

---

**Enjoy! 🎰**

Если возникли вопросы - смотри [DEPLOY_INSTRUCTIONS.md](DEPLOY_INSTRUCTIONS.md)
