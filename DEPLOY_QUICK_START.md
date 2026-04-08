# 🚀 DEPLOY QUICK START GUIDE

**Quando:** Após Dev + QA terminarem (PLANO_ACAO_5_CRITICOS concluído)  
**Tempo:** ~20 minutos total  
**Responsável:** DevOps Agent

---

## ⏱️ Timeline Rápida

```
T+00:00 — Verificar PRE_DEPLOY_CHECKLIST
T+05:00 — Se PASS: git push origin main
T+05:00 — Deploy automático inicia (Vercel + Railway)
T+07:00 — Vercel UP
T+10:00 — Railway UP
T+10:00 — Executar smoke tests
T+15:00 — Se PASS: Notificar cliente ✅
T+20:00 — Monitor logs por 1h
```

---

## 🎯 Os 5 Passos (Executar em Sequência)

### PASSO 1: PRE-DEPLOY VALIDATION (5 min)

```bash
cd /c/Users/renat/ThreeOn/clients/dealer-sourcing

# A. Git Status
git status
# Esperado: On branch main, nothing to commit

git log --oneline -1
# Esperado: último commit é do Dev (fix/feat)

# B. Build Test
npm run build
# Esperado: 0 errors (pode ter warnings)

# C. Verificar Checklist
echo "Abra PRE_DEPLOY_CHECKLIST.md e marque tudo"
# Se FALHAR algo crítico: STOP, não deploy

# D. QA Status
echo "QA passou todos 16 testes? (SIM/NÃO)"
# Se NÃO: STOP, aguarde QA
```

### PASSO 2: DEPLOY (1 min)

```bash
# Quando tudo acima ✅ passar:

git push origin main

# Resultado esperado:
# To github.com:mgabsilva9-boop/dealer-sourcing.git
# main -> main
# 
# GitHub Actions inicia automaticamente
```

### PASSO 3: MONITOR DEPLOY (5 min)

```bash
# Terminal 1: Monitor Vercel
echo "Monitorando Vercel (Frontend)..."
watch -n 5 'curl -s https://dealer-sourcing-frontend.vercel.app | head -c 100'

# Terminal 2: Monitor Railway
echo "Monitorando Railway (Backend)..."
watch -n 5 'curl -s https://dealer-sourcing-api-production.up.railway.app/health'

# Esperado:
# Frontend: HTML (ou status 200)
# Backend: {"status":"healthy",...}
```

### PASSO 4: RUN SMOKE TESTS (3 min)

```bash
# Após ambos UP (5 min depois do push)
sleep 300

bash SMOKE_TESTS_PRODUCAO.sh

# Resultado esperado:
# ✅ PASS: 16 testes
# ❌ FAIL: 0 testes
```

### PASSO 5: DOCUMENT & NOTIFY (3 min)

```bash
# A. Documentar deploy
cat >> DEPLOYMENT_LOG.md << 'EOF'

## Deploy #1 — 2026-04-08 14:30:00

**Versão:** $(git rev-parse --short HEAD)
**Status:** ✅ Sucesso
**Timeline:** 9 minutos
**Smoke Tests:** 16/16 PASS

### Issues
Nenhum

### Notes
Deploy inicial de PLANO_ACAO_5_CRITICOS
EOF

# B. Notificar cliente (Slack/WhatsApp)
echo "✅ Deploy bem-sucedido!"
echo "Todas validações passaram"
echo "Sistema 100% funcional em produção"
```

---

## 🚨 Se Algo Der Errado

### CENÁRIO: Smoke Test Falha

```bash
# 1. Ver qual teste falhou
bash SMOKE_TESTS_PRODUCAO.sh 2>&1 | grep "FAIL"

# 2. Verificar logs
# Vercel: https://vercel.com/dashboard
# Railway: https://railway.app/dashboard

# 3. Se grave: Rollback
bash ROLLBACK_PLAN.md  # Ler procedure
git revert [LAST_COMMIT] --no-edit
git push origin main
```

### CENÁRIO: Deploy Não Sai

```bash
# 1. Verificar GitHub Actions
# https://github.com/mgabsilva9-boop/dealer-sourcing/actions

# 2. Se workflow falhando:
# Ler error em Actions
# Fix localmente
# Novo commit + push

# 3. Se workflow OK mas Vercel/Railway não respondendo:
# Aguardar 10 min a mais
# Verificar status page: vercel-status.com
```

---

## ✅ Checklist Pre-Push

```
OBRIGATÓRIO (se algum falhar → STOP):

[ ] git status = limpo (nada uncommitted)
[ ] npm run build = sem erros
[ ] npm run lint = sem erros críticos
[ ] Nenhum console.log no código
[ ] Nenhuma credential hardcoded
[ ] QA passou todos 16 testes
[ ] PRE_DEPLOY_CHECKLIST: ✅ 40+/50 itens

SE TODOS ACIMA:
[ ] Pronto para git push origin main
```

---

## 📞 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| "Build failed" | `npm run build` localmente, fix errors |
| "Frontend 502" | Aguardar mais 5 min, Railway pode estar ainda subindo |
| "API /health erro" | Verificar Railway logs, DB_URL pode estar errada |
| "Smoke test falha" | Verificar qual endpoint — verificar logs correspondentes |
| "Git push recusado" | `git pull origin main` primeiro, depois push |

---

## 📊 Success Criteria

Deploy é considerado **SUCESSO** se:

✅ Vercel respondendo em 200 (2 min)  
✅ Railway respondendo em 200 (5 min)  
✅ Smoke tests todos PASSAM (0 FAILED)  
✅ Nenhum erro novo em Sentry  
✅ Performance normal (< 3s response time)  

Deploy é considerado **FALHA** se:

❌ Qualquer smoke test falha  
❌ API retorna 500+ errors  
❌ Frontend tela branca  
❌ Database desconectado  

---

## 📈 Performance Expectations

| Métrica | Esperado | Crítico |
|---------|----------|---------|
| Frontend load | <2s | >5s |
| API response | <300ms | >1s |
| Database query | <100ms | >500ms |
| Build time | <2min | >5min |
| Deploy time | <10min | >15min |

---

## 🔄 What Gets Deployed

✅ Todos os fixes do PLANO_ACAO_5_CRITICOS:
1. IPVA tela branca fix
2. Performance otimizado
3. Kanban status fix
4. Multi-tenant RLS aplicado
5. Clientes CRUD endpoints
6. Login delay fix

✅ Database migrations (se houver)

✅ Frontend + Backend code

---

## 🎓 Best Practices

1. **Sempre validar PRE_DEPLOY_CHECKLIST** antes de push
2. **Deploy às 14:00 UTC** (menos tráfego, mais suporte disponível)
3. **Nunca force-push** a menos que seja emergência
4. **Sempre rodar smoke tests** após deploy
5. **Monitor logs** por 1h após deploy
6. **Document tudo** em DEPLOYMENT_LOG.md

---

## ❓ FAQ

**P: Posso fazer deploy à noite?**  
R: Sim, mas tenha mais cuidado. Não há support se quebrar.

**P: E se smoke test falha?**  
R: Rollback imediato: `git revert [COMMIT] && git push origin main`

**P: Preciso testar em staging?**  
R: Não (staging = local dev). Vá direto para main.

**P: Quanto tempo leva?**  
R: 5-10 min para deploy estar UP, ~20 min total com validação.

**P: Pode quebrar production?**  
R: Sim, é por isso que temos smoke tests e rollback plan.

---

## 🎬 Start Here

```bash
# Quando Dev + QA completarem:

echo "🚀 Deploy iniciando..."

# 1. Validar
cat PRE_DEPLOY_CHECKLIST.md
# ... marcar checkboxes ...

# 2. Deploy
git push origin main

# 3. Monitor
sleep 300
bash SMOKE_TESTS_PRODUCAO.sh

# 4. Report
echo "✅ Deploy bem-sucedido!" || echo "❌ Deploy falhou"
```

---

**Boa sorte! Você consegue! 🚀**

