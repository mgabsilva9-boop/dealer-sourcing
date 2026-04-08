# ✅ PRÉ-DEPLOY CHECKLIST

**Data:** 8 Abril 2026  
**DevOps Agent:** Preparação para deploy em produção  
**Objetivo:** Validar que deploy é seguro, confiável e rastreável

---

## FASE 1: Git Status & Commits

### Git Repository Status
- [ ] `git status` mostra repositório limpo?
  ```bash
  git status
  # Esperado: "On branch main" + "nothing to commit, working tree clean"
  ```

- [ ] Nenhum arquivo não-commitado importante?
  ```bash
  git status | grep -E "(modified|deleted|new file)"
  # Esperado: vazio (exceto .env.local e node_modules)
  ```

- [ ] Branch é main?
  ```bash
  git branch --show-current
  # Esperado: main
  ```

- [ ] Commits recentes fazem sentido?
  ```bash
  git log --oneline -10
  # Verificar que commits são relacionados ao PLANO_ACAO_5_CRITICOS
  ```

---

## FASE 2: Build Validation

### Build Local
- [ ] Build compila sem erros?
  ```bash
  npm run build
  # Esperado: 0 errors (pode ter warnings de deprecação)
  ```

- [ ] Build time razoável (<2 min)?
  ```bash
  time npm run build
  # Esperado: real ~1m30s
  ```

- [ ] Arquivo dist/ gerado?
  ```bash
  ls -lh dist/
  # Esperado: dist/ existe com arquivos .js, .html, .css
  ```

- [ ] Bundle size aceitável?
  ```bash
  du -sh dist/
  # Esperado: <50MB (Vercel limite é 100MB)
  ```

### Lint & Type Check
- [ ] Lint passa sem erros críticos?
  ```bash
  npm run lint 2>&1 | grep -i error
  # Esperado: vazio ou só warnings
  ```

- [ ] TypeScript sem problemas graves?
  ```bash
  npx tsc --noEmit 2>&1 | head -20
  # Esperado: vazio ou warnings leves
  ```

---

## FASE 3: Code Quality

### Console Logs
- [ ] Nenhum `console.log()` deixado acidentalmente?
  ```bash
  git diff origin/main..HEAD | grep -E "console\.(log|error|warn|debug)" | grep "^+"
  # Esperado: vazio
  ```

- [ ] Nenhum `debugger;` no código?
  ```bash
  git diff origin/main..HEAD | grep "^+.*debugger"
  # Esperado: vazio
  ```

### Credentials & Secrets
- [ ] Nenhuma chave API hardcoded?
  ```bash
  git diff origin/main..HEAD | grep -iE "(password|secret|key|token|api_key)" | grep -v ".env"
  # Esperado: vazio
  ```

- [ ] Nenhum arquivo `.env` commitado?
  ```bash
  git status | grep ".env"
  # Esperado: vazio
  ```

- [ ] `.gitignore` contém `.env*`?
  ```bash
  cat .gitignore | grep "\.env"
  # Esperado: presente
  ```

---

## FASE 4: Environment Variables

### Vercel Environment Variables
- [ ] `VITE_API_URL` está configurada?
  - Valor esperado: `https://dealer-sourcing-api-production.up.railway.app`
  - **Local:** `.env.production` (não será commitado)
  - **Vercel:** Configurado em Project Settings → Environment Variables

- [ ] `VITE_API_TIMEOUT` está configurada?
  - Valor esperado: `10000` (ms)

- [ ] `VITE_LOG_LEVEL` está configurada?
  - Valor esperado: `error` (em produção)

### Railway Environment Variables
- [ ] `DATABASE_URL` é Supabase Pooler?
  - Valor esperado: `postgresql://postgres...:6543/postgres`
  - Contém credenciais secretas em Railway, não em git

- [ ] `JWT_SECRET` está armazenado em Railway?
  - ✅ Armazenado em `.env.production` local (não será enviado)
  - ✅ Armazenado em Railway secrets (não visível em logs)

- [ ] `NODE_ENV` = `production`?

- [ ] `FRONTEND_URL` = `https://dealer-sourcing-frontend.vercel.app`?

- [ ] `CORS_ORIGIN` = `https://dealer-sourcing-frontend.vercel.app`?

### Validação de Segurança
```bash
# Verificar que .env.production está em .gitignore
grep -q "\.env\.production" .gitignore && echo "✅ OK" || echo "❌ FALTA"

# Verificar que nenhum .env foi commitado
git ls-files | grep "\.env" && echo "❌ ERRO: .env no git!" || echo "✅ OK"
```

---

## FASE 5: Tests & Validation

### Smoke Tests Local
- [ ] Testes locais passam?
  ```bash
  npm run test:production 2>&1
  # Esperado: "passed" messages
  ```

- [ ] Frontend inicializa sem erros?
  ```bash
  npm run dev &
  # Abrir http://localhost:5173
  # F12 Console: sem erros críticos
  # Clicar em abas: IPVA, Estoque, Financeiro, Clientes → sem white screens
  ```

- [ ] Login funciona localmente?
  - Email: `dono@brossmotors.com`
  - Password: `bross2026`
  - Esperado: Redireciona para dashboard

### Regression Tests (QA Pass?)
- [ ] QA Agent validou todos 16 testes de FASE 4?
  - Verificar: `PHASE_4_QA_EXECUTIVE_SUMMARY.txt`
  - Esperado: "16/16 TESTS PASS ✅"

- [ ] Nenhum bug crítico aberto?
  - Verificar backlog de issues
  - Esperado: 0 bugs críticos

---

## FASE 6: Monitoring & Logging

### Error Tracking (Sentry)
- [ ] Sentry inicializado no código?
  ```bash
  grep -r "Sentry" src/ --include="*.js" --include="*.jsx"
  # Esperado: encontra Sentry.init() em server.js ou main.jsx
  ```

- [ ] Sentry DSN configurado?
  - Deve estar em Vercel/Railway env vars (não em git)

### Structured Logging
- [ ] Winston logger inicializado?
  ```bash
  grep -r "winston\|logger" src/ --include="*.js" | head -5
  # Esperado: encontra logger setup
  ```

- [ ] Logs são estruturados (JSON)?
  - Verificar em desenvolvimento: `npm run dev:server` → logs no console

### Health Check Endpoint
- [ ] GET `/health` endpoint existe e funciona?
  ```bash
  curl http://localhost:3000/health
  # Esperado: {"status":"ok"} ou similar
  ```

---

## FASE 7: Database & RLS

### Multi-tenant Validation
- [ ] Todas as queries têm `WHERE dealership_id = $1`?
  ```bash
  grep -r "SELECT \*" src/routes --include="*.js" | grep -v dealership_id
  # Esperado: vazio (nenhuma query sem filtro)
  ```

- [ ] RLS está ativo em Supabase?
  - Verificar em Supabase dashboard: Authentication → Row Level Security
  - Esperado: RLS ON para todas as tabelas

- [ ] JWT contém dealership_id?
  ```bash
  # Fazer login localmente
  # Ver token em DevTools → Application → localStorage
  # Decodificar (base64) a segunda parte do JWT
  # Deve conter: "dealership_id": "..."
  ```

---

## FASE 8: CI/CD Pipeline Status

### GitHub Actions
- [ ] Deploy workflow está correto?
  ```bash
  cat .github/workflows/deploy.yml | grep -i "render\|railway"
  # Verificar: pipeline aponta para Railway, não Render
  ```

- [ ] Últimas execuções do workflow?
  - GitHub.com → Actions → Verificar últimas 3 runs
  - Esperado: ✅ (verde) ou pelo menos ✅ build passou

### Vercel Integration
- [ ] Projeto linkado no Vercel?
  - Vercel.com → Project settings → Git → Repo
  - Esperado: `mgabsilva9-boop/dealer-sourcing`

- [ ] Auto-deploy ON para main?
  - Vercel → Project settings → Git
  - Esperado: "Deploy on push" = ON

### Railway Integration
- [ ] Projeto linkado no Railway?
  - Railway.app → Project → Settings → Repo
  - Esperado: `mgabsilva9-boop/dealer-sourcing`

- [ ] Auto-deploy ON para main?
  - Railway → Project → Service → Deployments
  - Esperado: Auto-deploy trigger ON

---

## FASE 9: Comunicação & Documentation

### Changelog
- [ ] Changelog atualizado?
  ```bash
  cat CHANGELOG.md | head -20
  # Esperado: Versão com data de hoje + mudanças
  ```

- [ ] Notas de release claras?
  - Descrever: PLANO_ACAO_5_CRITICOS fixes
  - Descrever: Breaking changes (se houver)
  - Descrever: Migration steps (se houver)

### Stakeholder Notification
- [ ] Cliente notificado de deploy próximo?
  - [ ] WhatsApp: "Deploy em produção em ~10 min"
  - [ ] Email: "Change log e validação"

- [ ] Timeline de downtime comunicado?
  - Vercel: ~1-2 min
  - Railway: ~2-5 min
  - Total esperado: <10 min

---

## FASE 10: Final Validation

### Pre-Deploy Checklist Summary
```
TOTAL ITENS: ___ / 50
CRÍTICOS (deve ter ✅): 30
RECOMENDADOS: 20

Status:
☐ Se < 25/50: NÃO FAZER DEPLOY
☐ Se 25-40/50: DEPLOY COM CAUTELA (monitor logs)
☐ Se 40-50/50: DEPLOY CONFIANTE (está tudo pronto)
```

### Decision Gate

**DEPLOY APROVADO SE:**
- [ ] Git status limpo ✅
- [ ] Build sem erros ✅
- [ ] Sem credentials hardcoded ✅
- [ ] QA passou todos testes ✅
- [ ] Smoke tests locais passam ✅
- [ ] RLS validado ✅
- [ ] Monitoring setup ✅
- [ ] Comunicação feita ✅

**BLOQUEIA DEPLOY SE:**
- ❌ Qualquer erro crítico não resolvido
- ❌ Build falha
- ❌ Credentials em código
- ❌ QA não validou
- ❌ RLS não está aplicado

---

## Assinatura de Deploy

```
Data: _______________
DevOps Agent: _______________
Status: ☐ APROVADO  ☐ BLOQUEADO

Observações:
_________________________________________________________________
_________________________________________________________________

Rollback Plan:
Se algo quebrar, executar:
  git revert [COMMIT_HASH]
  git push origin main
  Aguardar auto-deploy (5 min)
  Executar: bash SMOKE_TESTS_PRODUCAO.sh
```

---

## Próximos Passos

1. **Completar TODOS os checkboxes acima**
2. **Se 40+/50: Prosseguir com deploy**
3. **Push para main (auto-deploy Vercel + Railway)**
4. **Executar POST_DEPLOY_VALIDATION.sh**
5. **Documentar em DEPLOYMENT_LOG.md**
6. **Monitor Sentry + logs por 1h**

**Tempo estimado:** 30-60 min para validar tudo

