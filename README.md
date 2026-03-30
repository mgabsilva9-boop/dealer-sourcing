# 🚗 Dealer Sourcing MVP

Plataforma completa para gerenciamento de concessionária com 5 módulos: inventário, financeiro, CRM, despesas e busca inteligente de veículos.

**Status:** ✅ Phase 2a Complete (Sourcing) | Phase 2b Ready (Deploy)

---

## 🎯 Features

- ✅ **Estoque** - Gerenciar veículos: add, edit, delete, margin calculations
- ✅ **Financeiro** - Revenue tracking, profit analysis, month comparisons
- ✅ **CRM** - 15+ customer fields, complete customer lifecycle
- ✅ **Gastos Gerais** - Expense tracking by category, status management
- ✅ **Busca Inteligente** - Vehicle search with smart scoring (WebMotors, OLX, Marketplace, etc)
- ✅ **Dashboard** - Real-time overview stats
- ✅ **Autenticação** - JWT tokens, user-scoped data

---

---

## 🚀 Production URLs

- **Frontend:** https://dealer-sourcing.vercel.app
- **Backend:** https://dealer-sourcing-api.railway.app (migrated from Render to Railway)

**Test Account:**
- Email: `penteadojv1314@gmail.com`
- Password: `Fontes13`

---

## ⚡ Quick Start (Local)

```bash
# Backend (port 3000)
npm run dev:server

# Frontend (port 5173) — new terminal
npm run dev

# Visit: http://localhost:5173
```

---

## 🏗️ Stack Técnico

```
Backend:    Node.js 22 + Express.js
Database:   PostgreSQL (Railway)
Cache:      Redis (Railway optional)
Auth:       JWT + bcryptjs
Frontend:   React 18 + Vite + TailwindCSS
Deploy:     Railway (backend) + Vercel (frontend)
CI/CD:      GitHub Actions → lint → build → deploy
Testing:    Vitest + Supertest
```

---

## 📋 Local Setup

### Clone & Install

```bash
git clone https://github.com/mgabsilva9-boop/dealer-sourcing.git
cd dealer-sourcing
npm install
```

### Environment Variables

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL (Render provides free PostgreSQL)
```

### Start Servers

```bash
# Terminal 1: Backend (port 3000)
npm run dev:server

# Terminal 2: Frontend (port 5173)
npm run dev
```

Visit: http://localhost:5173 → Login with test account above

---

## 🧪 Testando Endpoints

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "senha123"
  }'

# Resposta:
# { "token": "eyJ...", "user": { "id": 1, "email": "...", "name": "..." } }
```

### Buscar Carros
```bash
curl -X POST http://localhost:3000/search/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "queryText": "BMW 3 series até 150K"
  }'

# Vai demorar 30-60 segundos enquanto busca
# Resposta:
# { "searchId": 1, "query": "BMW 3 series até 150K", "totalResults": 5, "vehicles": [...] }
```

### Listar Histórico
```bash
curl -X GET http://localhost:3000/history \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Resposta:
# { "total": 5, "searches": [{ "id": 1, "query": "BMW...", "resultsCount": 5, ... }] }
```

### Salvar Veículo de Interesse
```bash
curl -X POST http://localhost:3000/vehicles/interested \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "vehicleId": 1,
    "customerName": "João Silva",
    "customerPhone": "11 99999-9999",
    "customerEmail": "joao@email.com",
    "notes": "Cliente quer financiar"
  }'
```

---

## 📱 Frontend (React Refactored)

O arquivo `src/frontend/App.jsx` contém o React refactored.

### Como usar:

1. **Copiar para seu projeto React:**
   ```bash
   cp src/frontend/App.jsx seu-projeto-react/src/
   ```

2. **Instalar dependência:**
   ```bash
   npm install axios
   ```

3. **Criar arquivo `.env`:**
   ```
   VITE_API_URL=http://localhost:3000
   ```

4. **Rodar:**
   ```bash
   npm run dev
   ```

---

## 🚀 Deployment (Auto)

```bash
git push origin main
  ↓
GitHub Actions:
  - npm run lint
  - npm run build
  - Deploy to Render (webhook)
  ↓
Live at:
  - Backend: https://dealer-sourcing-api.onrender.com
  - Frontend: https://dealer-sourcing.vercel.app
```

**First Deploy Steps:**
1. Backend created at Render? Add `RENDER_DEPLOY_HOOK` to GitHub Secrets
2. Frontend connected at Vercel? Add `VERCEL_TOKEN` + `VERCEL_PROJECT_ID` to GitHub Secrets
3. Next `git push` auto-deploys both

See `DEPLOYMENT_SETUP.md` for detailed manual setup

---

## 📊 API Endpoints

### **Auth**
- `POST /auth/login` - Login (email + password)
- `POST /auth/register` - Register new user

### **Inventory (Estoque)**
- `GET /inventory/list` - List all vehicles
- `POST /inventory/create` - Add vehicle
- `GET /inventory/:id` - Get vehicle detail
- `PUT /inventory/:id` - Update vehicle
- `DELETE /inventory/:id` - Delete vehicle

### **CRM (Clientes)**
- `GET /crm/list` - List customers
- `POST /crm/create` - Add customer
- `GET /crm/:id` - Get customer detail
- `PUT /crm/:id` - Update customer
- `DELETE /crm/:id` - Delete customer

### **Expenses (Gastos)**
- `GET /expenses/list` - List expenses
- `POST /expenses/create` - Add expense
- `GET /expenses/:id` - Get expense detail
- `PUT /expenses/:id` - Update expense
- `DELETE /expenses/:id` - Delete expense
- `GET /expenses/summary/by-category` - Totals by category

### **Sourcing (Busca Inteligente)**
- `GET /sourcing/list` - List all vehicles (sorted by score)
- `GET /sourcing/search?make=X&model=Y&priceMin=Z&priceMax=W&kmMax=V&discountMin=U` - Search with filters
- `GET /sourcing/:id` - Get vehicle detail
- `POST /sourcing/:id/interested` - Mark as interested

---

## 🐛 Troubleshooting

### Erro: "Cannot find module..."
```bash
# Instalar novamente
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Database connection failed"
```bash
# Verificar .env
cat .env | grep DATABASE_URL

# Testar conexão
psql DATABASE_URL
```

### Puppeteer lento/travando
```bash
# Aumentar timeout em src/utils/scraper.js
page.setDefaultTimeout(30000); // 30 segundos

# Ou usar browser pool (futuro)
```

---

## 🚀 Redis Cache Setup (Phase 6 - STORY-601)

The project now includes Redis caching layer for improved performance. Redis is **optional** — the application gracefully degrades if Redis is unavailable.

### Quick Start

#### Development (Local)

```bash
# Option 1: Using Docker
docker run -d -p 6379:6379 redis:latest

# Option 2: Using WSL (Ubuntu)
wsl bash -c "sudo apt-get install redis-server && redis-server --daemonize yes"

# Verify Redis is running
redis-cli ping
# Response: PONG
```

#### Environment Variables

**Local (.env.local):**
```bash
REDIS_URL=redis://localhost:6379
```

**Production (.env.production):**
```bash
# Railway provides Redis connection string automatically
REDIS_URL=redis://default:<password>@<hostname>:<port>
```

### Health Check Endpoint

```bash
# Check Redis status
curl http://localhost:3000/api/cache/health

# Response (if Redis is available):
# { "status": "healthy", "latency_ms": 2 }

# Response (if Redis is down):
# { "status": "disconnected", "latency_ms": -1 }
```

### Testing

```bash
# Run unit tests (no Redis required)
npm run test:redis:unit

# Run integration tests (requires Redis running)
npm run test:redis:integration

# Run all Redis tests
npm run test:redis
```

### Graceful Degradation

All cache operations have built-in fallbacks:

```javascript
import * as redis from './src/lib/redis.js';

// get() returns null if Redis unavailable
const value = await redis.get('key');

// set() returns false if Redis unavailable (but app continues)
const success = await redis.set('key', value, 300); // TTL: 300 seconds

// API continues to work even if Redis is down
// Performance degrades gracefully without errors
```

### Cache Endpoints

**GET /api/cache/health**
- Returns Redis health status and latency
- Used by deployment health checks
- Response: `{ status: 'healthy'|'unhealthy'|'disconnected', latency_ms: number }`

**DELETE /api/cache/flush**
- Clears all cache
- For testing/admin purposes only
- Requires authentication in production

### Implementation Details

- **Singleton Pattern**: Single Redis client instance per process
- **Connection Pooling**: 5-20 connections (configurable)
- **Exponential Backoff**: Automatic reconnection with delays up to 500ms
- **TTL Support**: All cache entries expire automatically (default: 5 minutes)
- **JSON Serialization**: Automatic object/array serialization via JSON.stringify

---

## 📋 Done & Next

**Completed:**
- ✅ Phase 1: Inventory, Financial, CRM modules
- ✅ Phase 2a: Sourcing (intelligent vehicle search)
- ✅ Phase 2b: Deployment infrastructure (Render + Vercel + GitHub Actions)
- ✅ Project structure (utils, middleware, models, constants)

**Optional Enhancements:**
- [ ] Real web scraping (replace mock data)
- [ ] Advanced filtering (saved searches)
- [ ] WhatsApp integration (vendor communication)
- [ ] Mobile app
- [ ] Analytics dashboard

---

## 📞 Suporte

Se tiver dúvidas, diga `*correct-course` para Orion analisar o problema.

---

**Desenvolvido com ❤️ usando AIOS Framework**
