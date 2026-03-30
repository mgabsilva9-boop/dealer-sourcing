# ⚡ DEPLOY AGORA (5 PASSOS)

## 1️⃣ Supabase Production (5 min)

**Vá para:** https://app.supabase.com

```
New Project:
- Name: dealer-sourcing-prod
- Password: [gere força]
- Region: South America (São Paulo)
- Plan: Free
```

Quando terminar, copie a **Connection String** de Settings → Database.

---

## 2️⃣ Setup Database (10 min)

```bash
# Configure DATABASE_URL com a string do Supabase
export DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Execute o script de setup
bash QUICK_DEPLOY.sh

# Ou manual:
psql "$DATABASE_URL" < db/migrations/001_initial_schema.sql
psql "$DATABASE_URL" < db/migrations/002_add_dealership_isolation.sql
psql "$DATABASE_URL" < db/seeds/STORY-602-test-data.sql
```

**Resultado esperado:** ✅ Sem erros

---

## 3️⃣ Atualizar .env.production (2 min)

Edite `.env.production`:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
VITE_API_URL=https://dealer-sourcing-api.onrender.com
NODE_ENV=production
```

---

## 4️⃣ Deploy Render (15 min)

**Vá para:** https://render.com

```
New Web Service:
- Connect GitHub repo (dealer-sourcing)
- Runtime: Node
- Build: npm install --production
- Start: node src/server.js
- Environment:
  DATABASE_URL=postgresql://... [copie de .env.production]
  JWT_SECRET=8e5234717fe08f1c3541ca845945218c31bc5297f6c583debc0208b0d68f4659
  NODE_ENV=production
```

Aguarde 3-5 min. Você terá:
```
https://dealer-sourcing-api.onrender.com
```

---

## 5️⃣ Deploy Vercel (5 min)

**Terminal:**
```bash
vercel --prod
```

Você terá:
```
https://dealer-sourcing.vercel.app
```

---

## ✅ TESTES RÁPIDOS

```bash
# Testar health da API
curl https://dealer-sourcing-api.onrender.com/health

# Esperado:
# {"status":"ok","timestamp":"...","uptime":...}
```

Acesse https://dealer-sourcing.vercel.app no browser.

---

## 🎯 CREDENCIAIS PARA CLIENTE

| Usuário | Email | Acesso |
|---------|-------|--------|
| Gerente Loja A | gerente_a@loja-a.com | Loja A (RLS isolado) |
| Gerente Loja B | gerente_b@loja-b.com | Loja B (RLS isolado) |

**Senhas:** Configure no Supabase Auth ou use o seed data.

---

## ⏱️ Tempo Total: ~40 minutos

**Se travar em alguma coisa, avise qual passo. @dex resolve rápido.**

-- Dex 🚀
