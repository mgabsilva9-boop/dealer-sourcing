# 🗄️ TASK: Database Schema Setup - Neon PostgreSQL

**Task ID:** #2
**Status:** IN_PROGRESS
**Responsável:** @data-engineer / @devops
**Criado:** 2026-03-30
**Deadline:** ASAP (bloqueador de deploy)

---

## 🎯 Objetivo

Criar completo schema PostgreSQL no Neon (Railway production) com todas as tabelas, índices e dados de teste iniciais.

**Estado Atual:**
- ✅ DATABASE_URL setada no Railway
- ✅ JWT_SECRET configurado
- ✅ Variáveis de ambiente OK
- ❌ **SCHEMA NÃO EXISTE** (tabelas vazias)
- ❌ Frontend carrega com página em branco

---

## ✅ Critérios de Aceitação

- [ ] DEPLOY_SIMPLE.sql executado sem erros no Neon
- [ ] Todas as 6 tabelas criadas:
  - `dealerships`
  - `users`
  - `vehicles_cache`
  - `interested_vehicles`
  - `search_queries`
  - `vehicle_validations`
- [ ] Dados de teste inseridos (2 dealerships, 2 users test, 4 vehicles)
- [ ] Índices criados corretamente
- [ ] Backend fez redeploy após schema criado
- [ ] Logs mostram: "✅ Banco de dados conectado"
- [ ] Frontend carrega sem erros: https://dealer-sourcing-frontend.vercel.app
- [ ] Nenhum erro "relation ... does not exist"

---

## 📋 PASSO-A-PASSO DE EXECUÇÃO

### Passo 1: Preparar SQL Script

**SQL Script Location:** `/db/migrations/DEPLOY_SIMPLE.sql`

**Conteúdo:** Cria schema completo com 6 tabelas e dados de teste

Arquivo já existe no repositório. Não modificar.

---

### Passo 2: Executar Schema no Neon

**Opção A: Via Railway AI (Recomendado)**

Abra Railway Dashboard (https://railway.app/dashboard) e vá para seu projeto.

Procure por **Neon PostgreSQL** plugin.

Clique em **SQL Editor**.

Cole o seguinte SQL:

```sql
-- ============================================
-- DEALER SOURCING DATABASE SCHEMA
-- ============================================

-- 1. DEALERSHIPS
CREATE TABLE IF NOT EXISTS dealerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO dealerships (id, name, city, state) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Loja A - Premium Motors', 'São Paulo', 'SP'),
  ('b0000000-0000-0000-0000-000000000001', 'Loja B - Luxury Auto', 'Blumenau', 'SC')
ON CONFLICT DO NOTHING;

-- 2. USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jwt_sub TEXT UNIQUE,
  email TEXT,
  password TEXT,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('owner', 'shop', 'admin', 'user')),
  dealership_id UUID REFERENCES dealerships(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VEHICLES_CACHE
CREATE TABLE IF NOT EXISTS vehicles_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id TEXT UNIQUE NOT NULL,
  source TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  price NUMERIC(12,2),
  km INTEGER,
  score INTEGER,
  vehicle_data JSONB,
  dealership_id UUID REFERENCES dealerships(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_cache_dealership_id ON vehicles_cache(dealership_id);

-- 4. INTERESTED_VEHICLES
CREATE TABLE IF NOT EXISTS interested_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id TEXT,
  vehicle_data JSONB,
  status TEXT DEFAULT 'interested',
  dealership_id UUID REFERENCES dealerships(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, vehicle_id)
);

CREATE INDEX IF NOT EXISTS idx_interested_vehicles_dealership_id ON interested_vehicles(dealership_id);
CREATE INDEX IF NOT EXISTS idx_interested_vehicles_user_id ON interested_vehicles(user_id);

-- 5. SEARCH_QUERIES
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  query_params JSONB,
  results_count INTEGER,
  dealership_id UUID REFERENCES dealerships(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_queries_dealership_id ON search_queries(dealership_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON search_queries(user_id);

-- 6. VEHICLE_VALIDATIONS
CREATE TABLE IF NOT EXISTS vehicle_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id TEXT,
  validated_by UUID REFERENCES users(id),
  is_good_car BOOLEAN,
  validation_score INTEGER,
  validation_comment TEXT,
  dealership_id UUID REFERENCES dealerships(id),
  validated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_validations_dealership_id ON vehicle_validations(dealership_id);

-- Insert test data
INSERT INTO users (id, name, email, password, role, dealership_id, jwt_sub) VALUES
  ('user-a-000000-0000-0000-0000-000000000001', 'Gerente Loja A', 'gerente_a@loja-a.com', '$2b$10$test', 'admin', 'a0000000-0000-0000-0000-000000000001', 'gerente_a@loja-a.com'),
  ('user-b-000000-0000-0000-0000-000000000002', 'Gerente Loja B', 'gerente_b@loja-b.com', '$2b$10$test', 'admin', 'b0000000-0000-0000-0000-000000000001', 'gerente_b@loja-b.com')
ON CONFLICT DO NOTHING;

INSERT INTO vehicles_cache (vehicle_id, source, make, model, year, price, km, score, vehicle_data, dealership_id) VALUES
  ('bmw-m2-001', 'webmotors', 'BMW', 'M2', 2018, 300676.00, 42000, 85, '{"platform":"webmotors"}', 'a0000000-0000-0000-0000-000000000001'),
  ('vw-gol-001', 'olx', 'VW', 'Gol 1.0', 2022, 54202.00, 56000, 78, '{"platform":"olx"}', 'a0000000-0000-0000-0000-000000000001'),
  ('ram-1500-001', 'mercadolivre', 'RAM', '1500 CLASSIC', 2023, 261020.00, 42000, 92, '{"platform":"ml"}', 'b0000000-0000-0000-0000-000000000001'),
  ('ram-2500-001', 'facebook', 'RAM', '2500 LARAMIE', 2020, 294518.00, 52000, 88, '{"platform":"fb"}', 'b0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

SELECT 'SCHEMA CREATED SUCCESSFULLY' as status;
```

**Clique em "Execute" (ou botão similar)**

**Esperado:**
```
SCHEMA CREATED SUCCESSFULLY
```

---

### Passo 3: Validar Schema Criado

No mesmo Neon SQL Editor, rode:

```sql
-- Verificar se tabelas existem
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Esperado:**
```
dealerships
interested_vehicles
search_queries
users
vehicle_validations
vehicles_cache
```

---

### Passo 4: Redeploy Backend Railway

No Railway Dashboard:

1. Clique em seu projeto (dealer-sourcing)
2. Vá em **Deployments** tab
3. Clique **Redeploy** (botão verde)
4. Espere ~2 minutos pelo deploy completar

**Esperado nos logs:**
```
🔧 Configurações:
   NODE_ENV: production
   PORT: 8080
   DATABASE_URL: (SET)

✅ Nova conexão com banco (active: 1)
✅ Banco de dados conectado: { now: 2026-03-30T02:43:56.717Z }
╔════════════════════════════════════════╗
║  🚗 DEALER SOURCING BOT - BACKEND      ║
║  🚀 Server rodando em porta 8080        ║
║  📡 Frontend URL: ...                   ║
║  ✅ Status: Online                     ║
╚════════════════════════════════════════╝
```

**❌ NÃO ESPERADO:**
```
Erro ao criar tabelas: relation "users" does not exist
```

---

### Passo 5: Testar Frontend

Abre: https://dealer-sourcing-frontend.vercel.app

**Esperado:**
- Página carrega (não em branco)
- Vê login screen ou dashboard
- Nenhum erro no console (F12 → Console)

---

### Passo 6: Validação Final

Rode este check:

```bash
# Test Backend API
curl -s https://dealer-sourcing-api-production.up.railway.app/health | jq .

# Expected:
# {
#   "status": "online",
#   "database": "connected"
# }
```

---

## 🚨 Troubleshooting

### Erro: "Syntax error in SQL"

**Causa:** SQL mal formatado

**Fix:** Copia exatamente do bloco acima, sem modificações

---

### Erro: "Permission denied"

**Causa:** USER do Neon não tem permissão

**Fix:** Neon deve ter user `neondb_owner` (padrão). Verificar DATABASE_URL

---

### Erro: "Relation already exists"

**Causa:** Schema já foi criado antes

**Fix:** Script usa `CREATE TABLE IF NOT EXISTS`, então é seguro rodar novamente

---

### Frontend ainda em branco

**Causa:** Backend pode ter cassado de cache antigo

**Fix:**
1. Limpar localStorage do browser: F12 → Application → Clear
2. Hard refresh: Ctrl+Shift+R (Windows)
3. Ou fazer Redeploy do Vercel

---

## ✅ Checklist de Conclusão

- [ ] SQL script executado no Neon sem erros
- [ ] 6 tabelas criadas (verificado via SQL query)
- [ ] Dados de teste inseridos (2 dealerships, 2 users, 4 vehicles)
- [ ] Backend fez redeploy
- [ ] Logs mostram "✅ Banco de dados conectado"
- [ ] Frontend carrega: https://dealer-sourcing-frontend.vercel.app
- [ ] Nenhum erro nos logs do Railway
- [ ] Nenhum erro no console do frontend (F12)
- [ ] API responde: /health endpoint

---

## 📞 Escalação

**Se SQL falhar:** Contate @data-engineer
**Se Redeploy falhar:** Contate @devops
**Se Frontend falhar:** Contate @dev

---

**Status:** PRONTO PARA EXECUÇÃO ✅
**Próximo:** Mark task as completed após sucesso
