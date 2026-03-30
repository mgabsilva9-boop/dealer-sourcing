# 🚀 TÉCNICA DE EXECUÇÃO - DEPLOYMENT DEALER SOURCING

**Status:** Versão 1.0
**Criado:** 2026-03-30
**Responsável:** ThreeOn Dev Team

---

## 📋 Problema

O projeto foi deployado **pulando etapas críticas**:
- ❌ Variáveis de ambiente não configuradas no Railway
- ❌ Database não criada no Neon
- ❌ Frontend apontava para URL errada da API
- ❌ Nenhuma validação antes de push

**Resultado:** Página em branco, erros 404, CONNECTION REFUSED.

---

## ✅ SOLUÇÃO: Workflow Estruturado de Deploy

### Fases de Execução

```
┌─────────────────────────────────────────────────────────┐
│ FASE 1: VALIDAÇÃO LOCAL (pré-commit)                    │
│ - Checklist de env vars                                 │
│ - Build test                                            │
│ - Database connection test                              │
└─────────────────────────────────────────────────────────┘
           ⬇️
┌─────────────────────────────────────────────────────────┐
│ FASE 2: GIT OPERATIONS                                  │
│ - Commit changes                                        │
│ - Push para GitHub                                      │
│ - Verificar CI/CD status                                │
└─────────────────────────────────────────────────────────┘
           ⬇️
┌─────────────────────────────────────────────────────────┐
│ FASE 3: DEPLOY VERCEL (Frontend)                        │
│ - Vercel reconhece push                                 │
│ - Build acontece automaticamente                        │
│ - Monitorar logs                                        │
└─────────────────────────────────────────────────────────┘
           ⬇️
┌─────────────────────────────────────────────────────────┐
│ FASE 4: DEPLOY RAILWAY (Backend + Database)             │
│ - Variáveis de ambiente já configuradas                 │
│ - Database migrations rodam                             │
│ - Health check                                          │
└─────────────────────────────────────────────────────────┘
           ⬇️
┌─────────────────────────────────────────────────────────┐
│ FASE 5: SMOKE TESTS (Validação Final)                   │
│ - Frontend carrega                                      │
│ - API responde                                          │
│ - Banco conecta                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 PASSO-A-PASSO COMPLETO

### **ETAPA 1: PRÉ-DEPLOY LOCAL (OBRIGATÓRIO)**

Antes de qualquer commit/push, execute:

```bash
# 1. Validate everything
bash DEPLOYMENT_VALIDATION.sh production

# 2. Output esperado:
# ✅ ALL CHECKS PASSED - READY FOR DEPLOYMENT
```

**Se falhar, FIX DOS PROBLEMAS:**

| Erro | Solução |
|------|---------|
| `DATABASE_URL not found in .env.production` | Editar `.env.production` com URL do Neon |
| `Build failed` | Rodar `npm install --legacy-peer-deps` e tentar novamente |
| `Database connection failed` | Verificar DATABASE_URL e conectividade |
| `Uncommitted changes` | Fazer `git add .` e `git commit -m "..."` |

---

### **ETAPA 2: CONFIGURAÇÃO DO RAILWAY (Uma única vez)**

Acessar **Railway Dashboard** → Seu Projeto:

#### A. Configurar Variáveis de Ambiente

Ir em **Variables** e adicionar (ou verificar se existem):

```
NODE_ENV=production
PORT=8080
JWT_SECRET=8e5234717fe08f1c3541ca845945218c31bc5297f6c583debc0208b0d68f4659
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]:5432/dealer_sourcing
FRONTEND_URL=https://dealer-sourcing-frontend.vercel.app
CORS_ORIGIN=https://dealer-sourcing-frontend.vercel.app
```

**Onde encontrar DATABASE_URL:**
1. Ir em **Plugins** → **Neon PostgreSQL**
2. Copiar **Connection String** (não a pooler!)
3. Colar em `DATABASE_URL`

#### B. Criar Database (se não existir)

No Neon Dashboard:
1. Ir em **SQL Editor**
2. Rodar:
```sql
CREATE DATABASE IF NOT EXISTS dealer_sourcing;
\c dealer_sourcing
-- Tables serão criadas automaticamente pelo app
```

#### C. Redeployer Railway

Botão **Redeploy** no Railway Dashboard.

---

### **ETAPA 3: COMMIT E PUSH (com validação)**

```bash
# 1. Stage changes
git add -A

# 2. Commit com mensagem clara (Conventional Commits)
git commit -m "fix: configurar Railway env vars e URLs corretas

- Atualizar VITE_API_URL para Railway backend
- Configurar CORS para Vercel frontend
- Adicionar logs de debug de DATABASE_URL
"

# 3. Push
git push origin main

# 4. Verificar CI/CD (GitHub Actions se houver)
git log --oneline -1
```

---

### **ETAPA 4: MONITORAR DEPLOYS**

#### Vercel (Frontend)
- URL: https://vercel.com/dashboard
- Esperar por: "Ready" status
- Acessar: https://dealer-sourcing-frontend.vercel.app

#### Railway (Backend)
- URL: https://railway.app/dashboard
- Ver **Deployments** tab
- Logs devem mostrar:
```
🔧 Configurações:
   NODE_ENV: production
   PORT: 8080
   DATABASE_URL: (SET)

✅ Banco de dados conectado
🚀 Server rodando em porta 8080
✅ Status: Online
```

---

### **ETAPA 5: SMOKE TESTS**

Após ambos estarem "Ready":

```bash
# 1. Frontend carrega?
curl -s https://dealer-sourcing-frontend.vercel.app | head -20

# 2. API responde?
curl -s https://dealer-sourcing-api-production.up.railway.app/health

# 3. Esperado:
# {"status": "online", ...}
```

Se tudo OK → ✅ **DEPLOYMENT COMPLETO**

---

## 🤖 TÉCNICA PARA AGENTES/SQUADS

### Quando Usar Esta Técnica

- ✅ Deploy em Vercel/Railway
- ✅ Mudanças em env vars
- ✅ Mudanças em schema do banco
- ✅ Qualquer push para `main` (produção)

### Checklist para Agentes

**Antes de iniciar qualquer deploy:**

- [ ] Rodei `bash DEPLOYMENT_VALIDATION.sh production` e passou?
- [ ] DATABASE_URL está correto no Railway?
- [ ] FRONTEND_URL aponta para Vercel?
- [ ] CORS_ORIGIN está correto?
- [ ] Fiz git commit com mensagem clara?
- [ ] Verifiquei que não há erros de linting?
- [ ] Testei build localmente? (`npm run build`)
- [ ] Revisei `.env.production` antes de commitar?

**Se uma validação falhar:**
- 🚫 PARE o deploy
- 📝 Documente o erro
- 🔧 Fix o problema
- ✅ Rode validação de novo
- 📢 Comunique ao time

---

## 🚨 ERROS COMUNS E FIXES

### Erro: "DATABASE_URL: NOT SET"

```bash
# Railway Dashboard → Variables
# Verificar se DATABASE_URL está lá
# Se vazio:
# 1. Ir em Neon PostgreSQL plugin
# 2. Copiar Connection String
# 3. Colar em DATABASE_URL
# 4. Redeploy
```

### Erro: "ECONNREFUSED ::1:5432"

```bash
# Backend tentando conectar em localhost
# Problema: DATABASE_URL não está setada no Railway
# Solução: Ver acima
```

### Erro: "Cannot GET /" no Vercel

```bash
# Frontend não carrega
# Causas possíveis:
# 1. VITE_API_URL ainda aponta para onrender.com
#    Fix: vercel.json env vars
# 2. Vercel build não completou
#    Fix: Esperar ou redeploy manualmente
```

### Erro: "CORS blocked"

```bash
# Frontend consegue carregar mas API falha
# Problema: CORS_ORIGIN no backend incorreto
# Solução:
# 1. Ir em Railway → Variables
# 2. Atualizar CORS_ORIGIN para seu Vercel domain
# 3. Redeploy Railway
```

---

## 📊 Matriz de Responsabilidades

| Fase | Responsável | Validações |
|------|-------------|-----------|
| 1. Validação Local | @dev | Build, env vars, git |
| 2. Git Operations | @devops | Commit message, push |
| 3. Vercel Deploy | Sistema | Build, health check |
| 4. Railway Deploy | Sistema | Env vars, database |
| 5. Smoke Tests | @qa | Frontend load, API ping |

---

## 🎓 Para Futuros Agentes

Se você for fazer deploy:

1. **Leia este documento inteiro** (não pule!)
2. **Execute `DEPLOYMENT_VALIDATION.sh`** (obrigatório!)
3. **Siga o passo-a-passo** na ordem exata
4. **Documente qualquer desvio** (por quê? o quê?)
5. **Comunicar ao time** antes de fazer push para `main`

---

## 📞 Contatos/Escalações

| Problema | Escalação |
|----------|-----------|
| Validação falha | @dev - verificar configurações locais |
| Railway não sobe | @devops - verificar logs, env vars |
| Vercel falha | @devops - verificar GitHub actions |
| Banco não conecta | @data-engineer - verificar Neon |

---

**Versão:** 1.0
**Última atualização:** 2026-03-30
**Status:** ✅ Production Ready
