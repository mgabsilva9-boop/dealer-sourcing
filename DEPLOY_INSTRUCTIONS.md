# 🚀 INSTRUÇÕES DE DEPLOY - Dealer Sourcing Bot

**Status:** ✅ Código pronto em GitHub
**GitHub:** https://github.com/mgabsilva9-boop/dealer-sourcing
**Data:** 2026-03-28

---

## ✅ JÁ CONCLUÍDO

```
✅ Código: Backend + Frontend + Tests
✅ Database: Railway PostgreSQL (rodando)
✅ Git: Repositório criado no GitHub
✅ CI/CD: GitHub Actions configurado
✅ Docker: Dockerfile + .dockerignore pronto
✅ Render: render.yaml pronto
✅ Vercel: vercel.json pronto
```

---

## 📋 PRÓXIMAS AÇÕES (3 passos simples)

### PASSO 1: Deploy Backend em Render (5 min)

1. **Abra:** https://render.com
2. **Sign up** com GitHub
3. **Click "New +"** → **"Web Service"**
4. **Selecione** seu repositório `dealer-sourcing`
5. **Configurar:**
   - **Name:** `dealer-sourcing-backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
6. **Variáveis de Ambiente:**
   ```
   DATABASE_URL=postgresql://postgres:SMssTMbTqjwNTXKMnnKTeRFGvBViAOJp@gondola.proxy.rlwy.net:48093/railway
   JWT_SECRET=seu-secret-mega-seguro-aqui
   NODE_ENV=production
   PORT=3000
   FRONTEND_URL=https://dealer-sourcing-frontend.vercel.app
   ```
7. **Click "Create Web Service"**

Render vai fazer deploy automático. Quando terminar, você terá:
```
https://dealer-sourcing-backend.onrender.com/health
```

---

### PASSO 2: Deploy Frontend em Vercel (5 min)

1. **Abra:** https://vercel.com
2. **Click "Add New..."** → **"Project"**
3. **Selecione** seu repositório `dealer-sourcing`
4. **Framework:** Vite
5. **Build Command:** `npm run build`
6. **Output Directory:** `dist`
7. **Variável de Ambiente:**
   ```
   VITE_API_URL=https://dealer-sourcing-backend.onrender.com
   ```
8. **Click "Deploy"**

Vercel vai fazer deploy. Você terá:
```
https://dealer-sourcing-frontend.vercel.app
```

---

### PASSO 3: Configurar Deploy Hook do Render (1 min)

Para que Render faça deploy automático quando você faz push:

1. **No Render**, vá para seu Web Service
2. Abra **"Settings"**
3. Procure **"Deploy Hook"**
4. **Copie a URL**
5. **No GitHub:**
   - Abra seu repositório
   - **Settings** → **Webhooks**
   - **Add webhook**
   - **Payload URL:** Cole a URL do Render
   - **Events:** Selecione "Pushes"
   - **Save**

Pronto! Agora cada `git push` faz deploy automático.

---

## 🧪 TESTAR TUDO (5 min)

### Backend
```bash
curl https://dealer-sourcing-backend.onrender.com/health
```
Esperado: `{"status":"ok","timestamp":"...","uptime":...}`

### Login
```bash
curl -X POST https://dealer-sourcing-backend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","password":"senha123"}'
```
Esperado: JWT token

### Frontend
Abra: https://dealer-sourcing-frontend.vercel.app
- Email: `seu@email.com`
- Senha: `senha123`

Esperado: Dashboard com 3 abas (Search, Interested, History)

---

## 🔄 CI/CD Automático

### GitHub Actions

GitHub Actions já está configurado (`.github/workflows/deploy.yml`).

Toda vez que você faz push em `main`:
1. ✅ Testes rodam
2. ✅ Build é validado
3. ✅ Webhook dispara Render
4. ✅ Backend faz deploy automático

---

## 📊 URLs Finais

```
Backend (Render):
https://dealer-sourcing-backend.onrender.com

Frontend (Vercel):
https://dealer-sourcing-frontend.vercel.app

GitHub:
https://github.com/mgabsilva9-boop/dealer-sourcing
```

---

## 🚨 Se algo não funcionar

| Erro | Solução |
|------|---------|
| Render deploy falha | Cheque DATABASE_URL e JWT_SECRET |
| Frontend não conecta backend | Cheque VITE_API_URL no Vercel |
| GitHub Actions não roda | Cheque `.github/workflows/deploy.yml` |
| Login não funciona | Confirme que usuário existe no banco (seed.js rodou) |

---

## ✨ Pronto para Produção!

Sua aplicação está:
- ✅ Em produção (Render + Vercel)
- ✅ Com CI/CD automático
- ✅ Com database em produção
- ✅ Com health checks
- ✅ Com autenticação JWT

---

**Tempo total de setup:** ~20 minutos
**Status:** 🟢 Pronto para usar

Faça os 3 passos acima e você tem tudo rodando em produção!
