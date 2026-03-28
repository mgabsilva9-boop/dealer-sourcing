# Dealer-Sourcing MVP - Arquitetura

**Data:** 2026-03-28
**Status:** Phase 1 Completo, Phase 2 (Arquitetura) Em Progresso
**Revisor:** @architect (Aria)

---

## 📊 Estado Atual da Arquitetura

### Componentes Implementados

#### **1. Sourcing Layer** (`src/utils/scrapers.js`)

**Scoring Algorithm:**
```javascript
calculateScore(discount, km, year) {
  score = 100
  - (discount > 0 ? discount * 2 : 0)      // Preço alto penaliza
  + (discount < -20 ? abs(discount) * 0.5 : 0)  // Preço baixo recompensa
  - (km > 100k ? 20 : km > 50k ? 10 : km > 20k ? 5 : 0)  // KM penaliza
  - (age > 5 ? 10 : 0)                     // Idade penaliza
  return Math.max(1, Math.min(100, score))
}
```

**Características:**
- ✅ Determinístico (não depende de estado externo)
- ✅ Rápido (O(1), sem DB queries)
- ✅ Pragmático para MVP
- ⚠️ Não considera: histórico de acidentes, registros de serviço, condição da carroceria
- ⚠️ Sem ajuste de pesos (km e preço têm pesos fixos)

**Caching Strategy:**
- In-memory com TTL 5 minutos
- `vehicleCache[]` + `cacheTimestamp`
- Fallback: gera dados realistas se cache expirou

```javascript
if (now - cacheTimestamp < 5min) {
  return vehicleCache  // rápido
} else {
  vehicleCache = scrapeMultiplePlatforms()  // refresh
  return vehicleCache
}
```

**Problemas:**
- Single instance = funciona
- Múltiplas instâncias = cache divergente (cada uma tem seu array)
- Redeploy = perde cache (em memória)
- Solução Phase 3: PostgreSQL + Redis

**Data Source (Realistic Mock):**
```javascript
makeModelCombos = [
  { make: 'Honda', model: 'Civic', year: 2022, km: 15000, fipePrice: 95000 },
  // ... 9 mais
]

// Variações para realismo:
- discount: -10% a +10% do FIPE
- km: base + 0 a 50.000 aleatório
- location: São Paulo, Rio, Belo Horizonte, Curitiba (round-robin)
- owners: 1 a 3
- accidents: 0 ou 1-2
- serviceHistory: Completo, Parcial, Sem registros
- bodyCondition: Excelente, Bom, Regular
```

---

#### **2. API Routes** (`src/routes/sourcing.js`)

```
GET /sourcing/search?make=Honda&model=Civic&priceMin=80000&priceMax=100000&kmMax=50000&discountMin=-5
  └─ Filtra + Ordena por score DESC

GET /sourcing/list
  └─ Retorna todos (cache)

GET /sourcing/:id
  └─ Veículo específico por ID

POST /sourcing/:id/interested
  └─ Marcar como interessante (TODO: persistir em DB)
```

**Implementação:**
- ✅ RESTful design
- ✅ Auth middleware (JWT)
- ✅ Sorting por score (melhor primeiro)
- ⚠️ `/interested` apenas retorna 200 (não persiste)
- ⚠️ Sem paginação (retorna tudo)
- ⚠️ Sem rate limiting
- ⚠️ Sem validação de tipos de input

---

### Fluxo de Dados

```
USER REQUEST
    ↓
GET /sourcing/search?make=Honda
    ↓
authMiddleware (valida JWT)
    ↓
searchWithFilters({make, model, priceMin, ...})
    ↓
┌─ scrapeMultiplePlatforms()
│    ├─ Check cache (TTL 5min)
│    │    ├─ Fresh? Return cached
│    │    └─ Stale? Refresh
│    └─ generateRealisticVehicles() com variações
│
└─ Aplicar filtros em memória
    ├─ priceMin/Max
    ├─ kmMax
    └─ discountMin
    ↓
Sort por score DESC
    ↓
Return JSON [vehicles...]
    ↓
CLIENT (React)
```

---

## 🎯 Decisões Arquiteturais

| Decisão | Por Quê | Trade-off | Quando Muda |
|---------|---------|-----------|------------|
| **Mock Data** | MVP rápido, sem dependências (OLX API) | Não é dado REAL | Phase 3: integrar scrapers reais |
| **In-Memory Cache** | Simplicidade, zero overhead | Single instance, perde dados em redeploy | Phase 3: Redis ou PG |
| **Score Algorithm** | Rápido, determinístico, fácil de entender | Não pondera features complexas | Quando temos mais dados históricos |
| **Filtros em Memória** | Rápido para MVP (10 itens) | Não escala (100k+ itens) | Phase 3: filtros SQL no banco |
| **No Pagination** | MVP simples | Não funciona com muitos dados | Phase 3: implementar offset/limit |
| **POST /interested (TODO)** | Implementação posterior | Quebra contrato (não persiste) | Phase 3 imediatamente |

---

## 🔴 Gaps Identificados

### **CRITICAL (antes de usar em produção)**

**1. Pagination**
```javascript
// Agora: GET /list retorna TODOS
// Problema: 100+ veículos → lento, quebra frontend

// Solução:
GET /list?page=1&limit=20
GET /list?offset=0&limit=20
```

**2. Input Validation**
```javascript
// Agora: priceMin = "abc" passa
// Problema: TypeError quando tenta comparar

// Solução:
searchWithFilters({
  priceMin: Number(req.query.priceMin),  // valida tipo
  kmMax: Number(req.query.kmMax) || Infinity,
  // ... validar se são números válidos
})
```

**3. Error Handling**
```javascript
// Agora: erro no scrape → retorna vazio
// Problema: usuário não sabe se é erro ou sem resultados

// Solução:
try {
  results = await scrapeMultiplePlatforms()
} catch (err) {
  return res.status(500).json({
    error: 'Scrape failed',
    message: err.message
  })
}
```

---

### **HIGH (Phase 3 - Quando integra DB)**

**1. Persistence**
- `/interested` precisa salvar em DB
- Atualmente: apenas retorna 200 sem fazer nada
- Solução: INSERT INTO interested_vehicles

**2. User Context**
- Routes não sabem qual usuário fez request
- Atualmente: authMiddleware valida JWT mas não popula `req.user`
- Solução: Extrair `user_id` do JWT e pasar para routes

**3. Real Data Integration**
- Scrapers estão com mock data
- Atualmente: `generateRealisticVehicles()` não faz scrape real
- Solução: Implementar Puppeteer para OLX/WebMotors

---

### **MEDIUM (Phase 4 e além)**

**1. Full-Text Search**
- Atualmente: filtro por string exata
- `"Honda Civic 2020"` deve encontrar "Honda", "Civic", "2020"
- Solução: PostgreSQL `tsvector` ou Elasticsearch

**2. Geolocation**
- Locations hardcoded: SP, RJ, BH, Curitiba
- Usuário quer: filtrar por estado/cidade
- Solução: JOIN com location table, índice espacial

**3. Sorting Options**
- Atualmente: apenas por score
- Usuário quer: price ASC/DESC, km ASC/DESC
- Solução: `?sort=price:asc` parameter

**4. Rate Limiting**
- Sem proteção contra brute force
- Solução: `express-rate-limit` middleware

**5. Monitoring**
- Sem métrica de quais features são usadas
- Solução: Log queries em `search_queries` table

---

## 📐 Technology Stack

| Layer | Tech | Notes |
|-------|------|-------|
| **API** | Express.js 4.18 | Simples, pragmático, production-ready |
| **Auth** | JWT (jsonwebtoken 9.0) | Implementado, funciona |
| **Scoring** | Pure JS | Fast, sem dependências |
| **Cache** | In-Memory Map | MVP only |
| **Data** | Mock JSON arrays | Realista, nenhuma API externa |
| **Frontend** | React 18 + Vite | Já existe |
| **Deployment** | Render (backend) + Vercel (frontend) | Free tier |
| **Database** | Será PostgreSQL | Phase 3 |

---

## 🏗️ Próxima Fase - Schema Design (Phase 3)

Quando integrar banco de dados, será necessário:

### **Tabelas Essenciais**

```sql
-- Salvar veículos de interesse
CREATE TABLE interested_vehicles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  vehicle_id VARCHAR(255) NOT NULL,
  vehicle_data JSONB,           -- snapshot do veículo no momento
  saved_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'interested'  -- interested, contacted, purchased
);

-- Cache de veículos scraped
CREATE TABLE vehicles_cache (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50),           -- 'olx', 'webmotors', 'mock'
  vehicle_data JSONB,           -- complete vehicle object
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,         -- para saber quando refresh
  INDEX (source, cached_at DESC)
);

-- Analytics
CREATE TABLE search_queries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  query_params JSONB,           -- {make, model, priceMin, ...}
  results_count INTEGER,
  searched_at TIMESTAMP DEFAULT NOW(),
  INDEX (user_id, searched_at DESC)
);
```

### **Índices Críticos**

```sql
-- Queries rápidas por usuário
CREATE INDEX idx_interested_user_id ON interested_vehicles(user_id);

-- Freshness check
CREATE INDEX idx_cache_freshness ON vehicles_cache(source, cached_at DESC);

-- Analytics
CREATE INDEX idx_search_user_time ON search_queries(user_id, searched_at DESC);
```

### **Modificações no Código**

```javascript
// Phase 3: POST /interested começa a persistir
POST /sourcing/:id/interested {
  const { userId } = req.user;  // de JWT
  const vehicle = await getVehicle(id);

  await db.query(
    'INSERT INTO interested_vehicles (user_id, vehicle_id, vehicle_data) VALUES ($1, $2, $3)',
    [userId, id, vehicle]
  );

  return res.json({ message: 'Salvo com sucesso' });
}

// Phase 3: GET /sourcing/favorites lista favoritos
GET /sourcing/favorites {
  const vehicles = await db.query(
    'SELECT vehicle_data FROM interested_vehicles WHERE user_id = $1',
    [req.user.id]
  );
  return res.json(vehicles);
}
```

---

## 🎓 Recomendações

### **Imediato (antes de mais usuários)**

1. **Adicionar paginação** → `?page=1&limit=20`
2. **Validar inputs** → tipos, ranges, formatos
3. **Melhorar error handling** → mensagens claras
4. **Documentar API** → OpenAPI/Swagger

### **Phase 3 (quando integra DB)**

1. **Persistência** → interested_vehicles table
2. **Real data** → Puppeteer para OLX/WebMotors (ou usar API se existir)
3. **Filtros SQL** → não em memória
4. **Paginação SQL** → OFFSET/LIMIT
5. **User context** → extrair de JWT

### **Phase 4+ (escala)**

1. **Full-text search** → PostgreSQL tsvector
2. **Caching distribuído** → Redis (não in-memory)
3. **Monitoring** → prometheus + grafana
4. **Rate limiting** → express-rate-limit
5. **Async jobs** → Bull/RabbitMQ para scraping

---

## 📝 Resumo Executivo

**Dealer-Sourcing MVP** tem arquitetura **pragmática e escalável**:

- ✅ API simples, RESTful, com auth
- ✅ Scoring rápido e determinístico
- ✅ Mock data realista, sem dependências
- ⚠️ Sem persistence (TODO)
- ⚠️ Sem paginação (quebra em 100+ itens)
- ⚠️ Sem validação robusta

**Pronto para Phase 3 (DB real) quando @db-sage entrar.**

---

*Arquitetura revisada por Aria (@architect) em 2026-03-28*
