# 🚀 MVP DEPLOYMENT CHECKLIST - Dealer Sourcing Bot

**Status:** ✅ Código pronto para produção
**Data:** 2026-03-28
**Deadline:** 2026-03-31 (3 dias)

---

## 📋 CHECKLIST COMPLETO

### ✅ FASE 1: CODE PREPARATION (CONCLUÍDA)

- [x] Fixes de produção aplicados (SSL, NODE_ENV, Vite)
- [x] package.json atualizado com Vite + React
- [x] vite.config.js criado
- [x] index.html + src/main.jsx criados
- [x] vercel.json configurado
- [x] Dockerfile health check corrigido
- [x] npm install executado
- [x] Git push para GitHub `main`

**Status:** ✅ COMPLETO

---

### ⏳ FASE 2: BACKEND DEPLOYMENT (RENDER)

**Tempo estimado:** 10 minutos + 3-5 min de build

#### AÇÕES:
1. [ ] Abrir [Render.com](https://render.com)
2. [ ] Clicar **New** → **Web Service**
3. [ ] Conectar GitHub repo `mgabsilva9-boop/dealer-sourcing`
4. [ ] Preencher:
   - Name: `dealer-sourcing-backend`
   - Environment: `Node`
   - Build: `npm install`
   - Start: `npm start`
   - Region: São Paulo (ou próximo)
5. [ ] Adicionar Environment Variables:
   ```
   DATABASE_URL=postgresql://postgres:SMssTMbTqjwNTXKMnnKTeRFGvBViAOJp@gondola.proxy.rlwy.net:48093/railway
   JWT_SECRET=seu-secret-aqui
   NODE_ENV=production
   FRONTEND_URL=https://dealer-sourcing-frontend.vercel.app
   ```
6. [ ] Clicar **Create Web Service**
7. [ ] Aguardar **Deploy successful** (3-5 min)
8. [ ] **COPIAR URL:** `https://dealer-sourcing-backend.onrender.com`

#### TESTE:
```bash
curl https://dealer-sourcing-backend.onrender.com/health
# Esperado: {"status":"ok",...}
```

**Status:** ⏳ PENDENTE

---

### ⏳ FASE 3: FRONTEND DEPLOYMENT (VERCEL)

**Tempo estimado:** 10 minutos + 2-3 min de build

#### AÇÕES:
1. [ ] Abrir [Vercel.com](https://vercel.com)
2. [ ] Clicar **Add New** → **Project**
3. [ ] **Import Git Repository**
   - Selecionar: `mgabsilva9-boop/dealer-sourcing`
4. [ ] Preencher:
   - Project Name: `dealer-sourcing-frontend`
   - Framework: **Vite**
5. [ ] Adicionar Environment Variable:
   ```
   VITE_API_URL=https://dealer-sourcing-backend.onrender.com
   ```
   (Use a URL exata do Render do passo anterior)
6. [ ] Clicar **Deploy**
7. [ ] Aguardar **Congratulations! Your project has been deployed**
8. [ ] **COPIAR URL:** `https://dealer-sourcing-frontend.vercel.app`

#### TESTE:
```bash
curl -I https://dealer-sourcing-frontend.vercel.app
# Esperado: 200 OK
```

**Status:** ⏳ PENDENTE

---

### ⏳ FASE 4: ATUALIZAR FRONTEND_URL NO RENDER

**Tempo estimado:** 2 minutos

#### AÇÕES:
1. [ ] Voltar ao [Render Dashboard](https://dashboard.render.com)
2. [ ] Selecionar `dealer-sourcing-backend`
3. [ ] Ir em **Environment**
4. [ ] Editar `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://dealer-sourcing-frontend.vercel.app
   ```
5. [ ] Salvar (Render faz auto-deploy)
6. [ ] Aguardar **Deploy successful**

**Status:** ⏳ PENDENTE

---

### ⏳ FASE 5: CONFIGURAR GITHUB WEBHOOK (Auto-Deploy)

**Tempo estimado:** 5 minutos

#### AÇÕES:
1. [ ] Abrir [Render Dashboard](https://dashboard.render.com)
2. [ ] Selecionar `dealer-sourcing-backend`
3. [ ] Ir em **Settings** → **Deploy Hook**
4. [ ] Clicar **Create Deploy Hook**
5. [ ] Selecionar **main branch**
6. [ ] **COPIAR URL COMPLETA**
7. [ ] Abrir seu repo no GitHub
8. [ ] Ir em **Settings** → **Secrets and variables** → **Actions**
9. [ ] Clicar **New repository secret**
10. [ ] **Name:** `RENDER_DEPLOY_HOOK_ID`
11. [ ] **Value:** Cole apenas a parte final da URL
    ```
    srv_xxxxxxxxxxxx?key=yyyyyyyyy
    ```
12. [ ] **Add secret**

#### TESTE:
```bash
git add .
git commit -m "test: GitHub webhook integration"
git push origin main
```
Verifique se Render faz deploy automático em 30 segundos.

**Status:** ⏳ PENDENTE

---

### ✅ FASE 6: TESTES FINAIS (E2E)

**Tempo estimado:** 5 minutos

#### TESTES:
1. [ ] Acesso básico:
   ```bash
   curl https://dealer-sourcing-backend.onrender.com/health
   curl -I https://dealer-sourcing-frontend.vercel.app
   ```

2. [ ] Abrir navegador: `https://dealer-sourcing-frontend.vercel.app`

3. [ ] **TESTE DE LOGIN:**
   - [ ] Clicar em **Registrar**
   - [ ] Preencher email: `test@example.com`
   - [ ] Preencher senha: `Test123!@#`
   - [ ] Clique **Registrar**
   - [ ] Esperado: Redirect para Dashboard

4. [ ] **TESTE DE SEARCH:**
   - [ ] Dashboard deve carregar
   - [ ] Preencher **Marca:** "Toyota"
   - [ ] Preencher **Modelo:** "Corolla"
   - [ ] Clique **Buscar**
   - [ ] Esperado: Lista de veículos aparece

5. [ ] **TESTE DE BACKEND:**
   - [ ] Abrir DevTools (F12)
   - [ ] Ir na aba **Network**
   - [ ] Fazer uma busca
   - [ ] Verificar se requisição vai para `dealer-sourcing-backend.onrender.com`
   - [ ] Verificar se resposta contém dados

**Status:** ⏳ PENDENTE

---

### ✅ FASE 7: DOCUMENTA FINAL

- [ ] Atualizar README com URLs:
  ```
  Backend: https://dealer-sourcing-backend.onrender.com
  Frontend: https://dealer-sourcing-frontend.vercel.app
  ```

- [ ] Documentar credenciais de acesso:
  - [ ] Email padrão (se houver)
  - [ ] Link de reset de senha

**Status:** ⏳ PENDENTE

---

## 🎯 RESUMO FINAL

| Fase | Status | Tempo | URL |
|------|--------|-------|-----|
| **1. Code** | ✅ DONE | 30 min | - |
| **2. Render** | ⏳ TODO | 10 min | `https://dealer-sourcing-backend.onrender.com` |
| **3. Vercel** | ⏳ TODO | 10 min | `https://dealer-sourcing-frontend.vercel.app` |
| **4. Update** | ⏳ TODO | 2 min | - |
| **5. Webhook** | ⏳ TODO | 5 min | Auto-deploy on git push |
| **6. E2E Tests** | ⏳ TODO | 5 min | Live tests |
| **7. Docs** | ⏳ TODO | 5 min | - |

**TEMPO TOTAL: ~70 minutos (até funcionar completamente)**

---

## 🚀 COMO PROSSEGUIR

### Opção A: Fazer manualmente (recomendado para primeira vez)
Siga os passos em `RENDER_DEPLOY_INSTRUCTIONS.md` e `VERCEL_DEPLOY_INSTRUCTIONS.md`

### Opção B: Usar CLI do Render (avançado)
```bash
# Se souber o ID de acesso, pode usar Render CLI
npm install -g @render-deploy/cli
render deploy --service-id=xxx
```

---

## ⚠️ TROUBLESHOOTING RÁPIDO

| Problema | Solução |
|----------|---------|
| Render build falha | Verifique env vars em Render → Environment |
| Frontend não conecta ao backend | Verifique `VITE_API_URL` em Vercel |
| CORS error no console | Verifique `FRONTEND_URL` no Render |
| Database connection error | Verifique `DATABASE_URL` está correto |
| Deploy Hook não funciona | Verifique GitHub Secret `RENDER_DEPLOY_HOOK_ID` |

---

## 📞 PRÓXIMAS AÇÕES

1. **Faça os passos 2-5 acima**
2. **Execute testes (fase 6)**
3. **Quando tudo passar:**
   - MVP está VIVO e USÁVEL
   - Clientes podem acessar: `https://dealer-sourcing-frontend.vercel.app`
   - Auto-deploy funciona: cada `git push` → deploy automático

---

**Avise aqui quando começar o Render Deploy! ✅**
