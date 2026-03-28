# Deploy Backend em Render - Step by Step

## Status Atual
✅ Código pushed para GitHub `main`
✅ GitHub Actions vai rodar (lint + tests)
⏳ Aguardando deployment manual em Render

---

## PASSO 1: Criar serviço em Render

1. Acesse [Render.com](https://render.com) e faça login
2. Clique em **New +** → **Web Service**
3. **Connect a repository:**
   - Clique em **GitHub** (ou conectar GitHub se necessário)
   - Selecione: `mgabsilva9-boop/dealer-sourcing`
   - Clique em **Connect**

---

## PASSO 2: Configurar Web Service

4. **Name:** `dealer-sourcing-backend`
5. **Environment:** `Node`
6. **Build Command:**
   ```
   npm install
   ```
7. **Start Command:**
   ```
   npm start
   ```
8. **Instance Type:** Free (ou Starter se performance for problema)
9. **Region:** Pick closest to your users (ex: São Paulo - `sao-paulo`)

---

## PASSO 3: Adicionar Environment Variables

10. Clique em **Environment** (ou scroll down)
11. **Add from .env file** - opção preferida, ou adicione manualmente:

```
DATABASE_URL=postgresql://postgres:SMssTMbTqjwNTXKMnnKTeRFGvBViAOJp@gondola.proxy.rlwy.net:48093/railway
JWT_SECRET=seu-secret-mega-super-aleatorio-e-seguro-aqui
JWT_EXPIRE=7d
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://dealer-sourcing-frontend.vercel.app
LOG_LEVEL=info
```

⚠️ **IMPORTANTE:** Vai gerar uma URL tipo `dealer-sourcing-backend.onrender.com` - **COPIE ESTA URL**

---

## PASSO 4: Deploy

12. Clique em **Create Web Service**
13. Render vai começar a fazer build
14. Aguarde **Deploy successful** (normalmente 3-5 minutos)

---

## PASSO 5: Verificar se funciona

```bash
# Testar health endpoint
curl https://dealer-sourcing-backend.onrender.com/health

# Deve retornar:
# {"status":"ok","timestamp":"2026-03-28T..."}
```

---

## ⚠️ Se falhar:

1. Vá em **Logs** (tab ao lado de "Events")
2. Procure por erros (normalmente DATABASE_URL incorreta ou NODE_ENV)
3. Clique em **Manual Deploy** para tentar de novo

---

## Próximo Passo:

Assim que o Render disser **Deploy successful**:
1. Copie a URL: `https://dealer-sourcing-backend.onrender.com`
2. Vá para `VERCEL_DEPLOY_INSTRUCTIONS.md` para fazer o frontend

---

**Quando terminar, avise aqui o status ✅ ou ❌**
