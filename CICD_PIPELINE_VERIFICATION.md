# CI/CD Pipeline Verification Report

**Data:** 8 Abril 2026  
**Status:** ✅ CRÍTICO - Configuração parcialmente incorreta  
**Urgência:** ALTA - Deploy automático apontando para Render, não Railway  

---

## FASE 1: GitHub Actions

### Status
- ✅ Workflow file exists: `.github/workflows/deploy.yml`
- ✅ Triggers on push to main
- ✅ Lint + Build steps configurados
- ⚠️ **CRÍTICO:** Deploy hookado para **Render** (não Railway)

### Workflow Atual
```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node (v22)
      - name: Install dependencies
      - name: Lint
      - name: Build
      - name: Deploy Backend to Render  ← ❌ ERRADO
        run: curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

### Issues Encontradas

| Issue | Severidade | Impacto | Solução |
|-------|-----------|--------|---------|
| Deploy usa Render Hook | CRÍTICO | Auto-deploy vai para Render, não Railway | Atualizar workflow para Railway |
| Falta deploy Vercel explícito | MÉDIO | Vercel via GitHub (automático) | OK por ora |
| Sem smoke tests no CI | MÉDIO | Sem validação pós-build | Adicionar test step |
| Sem tagging de versão | BAIXO | Sem versionamento automático | Opcional para MVP |

---

## FASE 2: Vercel (Frontend)

### Status
- ✅ vercel.json configurado corretamente
- ✅ VITE_API_URL apontando para Railway prod: `https://dealer-sourcing-api-production.up.railway.app`
- ✅ Build command: `npm run build`
- ✅ Output directory: `dist`
- ✅ Routes configuradas para SPA (fallback index.html)
- ✅ Auto-deploy ON para branch main (padrão Vercel)

### Configuração Verificada
```json
{
  "name": "dealer-sourcing-fullstack",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "build": {
    "env": {
      "VITE_API_URL": "https://dealer-sourcing-api-production.up.railway.app"
    }
  }
}
```

### Próximos Passos
- [ ] Verificar em Vercel dashboard se projeto está linkado
- [ ] Confirmar últimos deploys (sucesso/falha)
- [ ] Validar env vars em Vercel (VITE_API_URL, VITE_API_TIMEOUT, VITE_LOG_LEVEL)

---

## FASE 3: Railway (Backend)

### Status
- ⚠️ **Configuração não encontrada** em `railway.json`
- ⚠️ **Deploy workflow desatualizado** (aponta para Render)
- ⚠️ **Sem confirmação** de auto-deploy em Railway

### O que Precisa Ser Verificado (Manual)
1. **Railway dashboard** (railway.app):
   - [ ] Projeto "dealer-sourcing-api" existe?
   - [ ] GitHub integration está ativa?
   - [ ] Auto-deploy ON para branch main?
   - [ ] Service config (build command, start command)?
   - [ ] Environment variables setadas?

2. **Environment Variables em Railway**:
   - [ ] DATABASE_URL = PostgreSQL Supabase (production)
   - [ ] JWT_SECRET = seguro e armazenado em Railway
   - [ ] NODE_ENV = production
   - [ ] FRONTEND_URL = https://dealer-sourcing-frontend.vercel.app
   - [ ] CORS_ORIGIN = https://dealer-sourcing-frontend.vercel.app
   - [ ] PORT = (Railway atribui automaticamente)

3. **Database Connection**:
   ```
   DATABASE_URL = postgresql://postgres.bxnennpxirlwfukyjsqk:BarufiPenteado0987!@aws-1-sa-east-1.pooler.supabase.com:6543/postgres
   ```
   - Via Pooler (pooler.supabase.com:6543) — correto para Railway

---

## FASE 4: Environment Variables Status

### .env.production (Local)
```
✅ VITE_API_URL = https://dealer-sourcing-api-production.up.railway.app
✅ VITE_API_TIMEOUT = 10000
✅ VITE_LOG_LEVEL = error
✅ DATABASE_URL = Supabase Pooler (correto)
✅ JWT_SECRET = presente (armazenado em .env.production, NÃO no código)
✅ NODE_ENV = production
✅ FRONTEND_URL = https://dealer-sourcing-frontend.vercel.app
✅ CORS_ORIGIN = https://dealer-sourcing-frontend.vercel.app
```

### Validação de Segurança
- ⚠️ JWT_SECRET em .env.production (arquivo local)
  - **Ação:** Garantir que `.env.production` NÃO está no git
  - **Verificação:** `git check-ignore .env.production` (deve estar em .gitignore)

---

## CRÍTICO: Renderização vs Railway

### Problema Identificado
O workflow deploy.yml ainda usa **Render Hook**:
```bash
curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

Mas a arquitetura atual é:
- **Frontend:** Vercel (auto-deploy OK)
- **Backend:** Railway (auto-deploy NÃO CONFIGURADO)

### Solução
Atualizar `.github/workflows/deploy.yml`:
```yaml
# ANTES (errado):
- name: Deploy Backend to Render
  run: curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}

# DEPOIS (correto):
# Railway pode usar GitHub integration diretamente
# Ou adicionar webhook se necessário
# Por enquanto, remover este step e confirmar auto-deploy via GitHub integration
```

**Recomendação:** Railway deve ter GitHub integration ativa para auto-deploy automático (não precisa de webhook explícito).

---

## Checklist de Validação (Manual em Vercel + Railway)

### Vercel Dashboard (vercel.com)
- [ ] Projeto "dealer-sourcing-frontend" está conectado?
- [ ] Git repo branch: main
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Environment variables visíveis e corretas?
- [ ] Últimos 3 deploys: status (sucesso/falha)?
- [ ] Production domain: `dealer-sourcing-frontend.vercel.app`?

### Railway Dashboard (railway.app)
- [ ] Projeto backend existe?
- [ ] GitHub repo linkado?
- [ ] Auto-deploy ON (verde)?
- [ ] Service build command correto?
- [ ] Service start command correto?
- [ ] Env vars: DATABASE_URL, JWT_SECRET, NODE_ENV, etc.?
- [ ] Últimos deploys: status?
- [ ] Health check: GET /health retorna 200?

---

## Próximos Passos para DevOps

1. **IMEDIATO:**
   - [ ] Verificar Vercel dashboard (confirmar deploy automático)
   - [ ] Verificar Railway dashboard (confirmar auto-deploy + env vars)
   - [ ] Atualizar `.github/workflows/deploy.yml` se necessário

2. **ANTES DO DEPLOY:**
   - [ ] Executar PRE_DEPLOY_CHECKLIST.md
   - [ ] Verificar PRE_DEPLOY checklist passa 100%

3. **APÓS PUSH PARA MAIN:**
   - [ ] Aguardar Vercel deploy (~2 min)
   - [ ] Aguardar Railway deploy (~3 min)
   - [ ] Executar SMOKE_TESTS_PRODUCAO.sh

4. **ONGOING:**
   - [ ] Monitor Vercel logs (vercel.com/dashboard)
   - [ ] Monitor Railway logs (railway.app/dashboard)
   - [ ] Monitor Sentry (error tracking)

---

## Recursos
- GitHub Actions: `.github/workflows/deploy.yml`
- Vercel Config: `vercel.json`
- Environment: `.env.production`, `.env.example`
- Build: `package.json` scripts (build, lint, dev, test:production)

