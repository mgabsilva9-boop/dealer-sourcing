# Railway Deployment Guide

## Pré-requisitos
- ✅ Railway account: mgabsilva9@gmail.com
- ✅ JWT_SECRET: 8e5234717fe08f1c3541ca845945218c31bc5297f6c583debc0208b0d68f4659
- ✅ DATABASE_URL: [INSERIR DO NEON]
- ✅ railway.json criado
- ✅ .railway.env criado

## Deploy Steps

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
# Abre browser para autenticar
```

### 3. Create Railway Project
```bash
cd C:\Users\renat\ThreeOn\dealer-sourcing
railway init
# Nome do projeto: dealer-sourcing-api
# Selecione: Node.js
```

### 4. Add PostgreSQL Database
```bash
railway add
# Selecione: PostgreSQL
```

### 5. Set Environment Variables
```bash
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set JWT_SECRET=8e5234717fe08f1c3541ca845945218c31bc5297f6c583debc0208b0d68f4659
railway variables set JWT_EXPIRE=7d
railway variables set FRONTEND_URL=https://dealer-sourcing.vercel.app
railway variables set ALLOWED_ORIGINS=https://dealer-sourcing.vercel.app
```

### 6. Link Neon Database
```bash
# No Railway dashboard:
# - Vá a "Variables"
# - Clique "New Variable"
# - Name: DATABASE_URL
# - Value: [COPIAR DO NEON CONSOLE]
```

### 7. Deploy
```bash
railway up
# Isso faz push e deploy automaticamente
```

### 8. Get Service URL
```bash
railway open
# Pega a URL do serviço (ex: https://dealer-sourcing-api-prod.railway.app)
```

### 9. Update Vercel
```bash
# Edite vercel.json:
# Mude: "VITE_API_URL": "https://[NOVA_RAILWAY_URL]"

git add vercel.json
git commit -m "chore: update api url to railway"
git push
```

## Troubleshooting

**Erro: "Cannot find module"**
→ `npm install` e tentar de novo

**Erro: "Database connection refused"**
→ Verificar DATABASE_URL no Neon console

**Erro: "Port already in use"**
→ Railway gerencia porta automaticamente

## URLs Finais
- Frontend: https://dealer-sourcing.vercel.app
- Backend: https://dealer-sourcing-api-prod.railway.app
- Health: https://dealer-sourcing-api-prod.railway.app/health
