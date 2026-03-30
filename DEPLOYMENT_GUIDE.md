# 🚀 Deployment Guide - STORY-602 Production

**Objetivo:** Entregar app ao cliente HOJE com Supabase Production

**Tempo estimado:** 45 minutos

---

## ✅ STEP 1: Criar Supabase Production (10 min)

### 1.1 Acessar Supabase

1. Acesse https://app.supabase.com
2. Faça login (ou crie conta se necessário)
3. Clique em "New Project"

### 1.2 Configurar Projeto

- **Name:** `dealer-sourcing-prod`
- **Database Password:** [gere uma senha forte - SALVE EM LUGAR SEGURO]
- **Region:** `South America (São Paulo)`
- **Free Plan:** Tá ok pra MVP

**Clique "Create new project" e aguarde 1-2 minutos**

### 1.3 Obter Credenciais

Depois que o projeto criar:
1. Vá para **Settings → Database**
2. Copie a **Connection String** (padrão PostgreSQL)
3. Formato deve ser: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

**⚠️ IMPORTANTE:** Guarde essa URL em lugar seguro.

---

## ✅ STEP 2: Executar Migrations (10 min)

### 2.1 Conectar ao Banco Supabase

Via **psql** (shell) ou **pgAdmin**, execute:

```bash
# Conectar ao banco
psql postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Ou se tiver Docker rodando:
docker exec -i dealer_sourcing_db psql -U postgres -d dealer_sourcing -c "
  SELECT 'Connected to Supabase' AS status;
"
```

### 2.2 Aplicar Migrations

```bash
# Migration 001 (schema inicial)
psql postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres < db/migrations/001_initial_schema.sql

# Migration 002 (dealership RLS)
psql postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres < db/migrations/002_add_dealership_isolation.sql

# Seed data (test users + vehicles)
psql postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres < db/seeds/STORY-602-test-data.sql
```

**Esperado:** 0 erros, tabelas criadas ✅

---

## ✅ STEP 3: Configurar Ambiente Production (5 min)

### 3.1 Atualizar .env.production

Edite `C:\Users\renat\ThreeOn\dealer-sourcing\.env.production`:

```bash
# Supabase Connection
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# JWT Secret (já configurado, deixe como está)
VITE_JWT_SECRET=8e5234717fe08f1c3541ca845945218c31bc5297f6c583debc0208b0d68f4659

# Production API (será atualizado após deploy Render)
VITE_API_URL=https://dealer-sourcing-api.onrender.com

# Node Environment
NODE_ENV=production
PORT=3000
```

**IMPORTANTE:** Substitua `[PASSWORD]` e `[HOST]` pelos valores reais do Supabase.

---

## ✅ STEP 4: Deploy no Render (15 min)

### 4.1 Conectar Render ao GitHub

1. Acesse https://render.com
2. Faça login / crie conta
3. Clique "New +" → "Web Service"
4. Selecione seu repositório GitHub (dealer-sourcing)
5. Clique "Connect"

### 4.2 Configurar Serviço

- **Name:** `dealer-sourcing-api`
- **Environment:** `Node`
- **Build Command:** `npm install --production`
- **Start Command:** `node src/server.js`
- **Plan:** `Free` (por enquanto)

### 4.3 Adicionar Variáveis de Ambiente

Clique "Environment":

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
JWT_SECRET=8e5234717fe08f1c3541ca845945218c31bc5297f6c583debc0208b0d68f4659
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://dealer-sourcing.vercel.app (ou seu domínio)
```

### 4.4 Deploy

Clique "Create Web Service" e aguarde 3-5 minutos.

**Quando pronto, você terá uma URL como:** `https://dealer-sourcing-api.onrender.com`

---

## ✅ STEP 5: Deploy Frontend Vercel (5 min)

### 5.1 Atualizar vercel.json

```json
{
  "version": 2,
  "name": "dealer-sourcing",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "https://dealer-sourcing-api.onrender.com",
    "NODE_ENV": "production"
  }
}
```

### 5.2 Deploy

```bash
# No diretório do projeto:
vercel --prod

# Ou use GitHub integration (automático)
```

**Você receberá uma URL como:** `https://dealer-sourcing.vercel.app`

---

## ✅ STEP 6: Testar Credenciais (5 min)

### 6.1 Login do Gerente Loja A

```
Email: gerente_a@loja-a.com
Senha: [gere uma senha no Supabase Auth ou use os users do seed]
```

**Esperado:**
- ✅ Login funciona
- ✅ Vê dados de Loja A apenas
- ✅ Não consegue ver dados de Loja B (RLS bloqueado)

### 6.2 Login do Gerente Loja B

```
Email: gerente_b@loja-b.com
Senha: [mesmo processo]
```

**Esperado:**
- ✅ Login funciona
- ✅ Vê dados de Loja B apenas
- ✅ Não consegue ver dados de Loja A (RLS bloqueado)

### 6.3 Verificar CRUD

- [ ] Listar veículos (deve ser isolado por loja)
- [ ] Criar transação (deve ser isolada por loja)
- [ ] Buscar queda de preço (FIPE + sourcing)

---

## 📋 Checklist Final

- [ ] Supabase projeto criado
- [ ] Migrations 001 + 002 executadas SEM ERROS
- [ ] Seed data inserido (4 veículos, 2 lojas, 3 usuários)
- [ ] .env.production atualizado com DATABASE_URL
- [ ] Render deploy completo (URL funciona)
- [ ] Vercel deploy completo (URL funciona)
- [ ] Login Loja A funciona + RLS OK
- [ ] Login Loja B funciona + RLS OK
- [ ] API responde com /health

---

## 🎯 Credenciais para Cliente

**App URL:** `https://dealer-sourcing.vercel.app`

**Gerente Loja A:**
```
Email: gerente_a@loja-a.com
Senha: [salvar senha segura]
Acesso: Estoque + Financeiro + IPVA (apenas Loja A)
```

**Gerente Loja B:**
```
Email: gerente_b@loja-b.com
Senha: [salvar senha segura]
Acesso: Estoque + Financeiro + IPVA (apenas Loja B)
```

**Admin (vocês):**
```
Email: admin@garagem.com
Senha: [salvar senha segura]
Acesso: Dashboard + Relatórios + Todas as lojas
```

---

## 🔧 Troubleshooting

### Erro: "Database connection refused"
**Causa:** DATABASE_URL inválida
**Solução:** Copiar URL exata do Supabase Settings → Database

### Erro: "Health check failed"
**Causa:** Port 3000 não está respondendo
**Solução:** Checar logs no Render: Dashboard → Logs

### RLS não está funcionando
**Causa:** JWT não contém dealership_id
**Solução:** Verificar que seed criou usuários com dealership_id correto

### CORS error no frontend
**Causa:** FRONTEND_URL não cadastrado no .env.production
**Solução:** Atualizar CORS whitelist em server.js

---

## ⏱️ Timeline

| Fase | Tempo | Status |
|------|-------|--------|
| Supabase setup | 10 min | ⏳ |
| Migrations | 10 min | ⏳ |
| .env config | 5 min | ⏳ |
| Render deploy | 15 min | ⏳ |
| Vercel deploy | 5 min | ⏳ |
| Testes | 5 min | ⏳ |
| **TOTAL** | **~50 min** | ⏳ |

---

**Próximo:** Avise quando terminar cada passo. Se quebrar em algo, chame @dex.

-- Dex, instruções prontas 🚀
