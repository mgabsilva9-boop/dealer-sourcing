# 📚 DevOps Index — Guia de Navegação

**Última atualização:** 8 Abril 2026  
**Status:** ✅ Infraestrutura de deploy 100% pronta  
**Responsável:** DevOps Agent

---

## 🎯 Se você quer...

### ...fazer deploy agora
👉 Vá para: **DEPLOY_QUICK_START.md**
- 5 passos simples
- Timeline: 20 minutos
- Inclui troubleshooting

### ...verificar se pode fazer deploy
👉 Vá para: **PRE_DEPLOY_CHECKLIST.md**
- 50 itens de validação
- Decision gate: 40+/50 = APPROVE
- Executar antes de git push

### ...validar após deploy
👉 Vá para: **POST_DEPLOY_VALIDATION.sh**
- Script automático
- Executa smoke tests
- Gera relatório

### ...entender a arquitetura de deploy
👉 Vá para: **CICD_PIPELINE_VERIFICATION.md**
- GitHub Actions → Vercel + Railway
- Configuração checada
- Issues críticos identificados

### ...se algo quebrar em produção
👉 Vá para: **ROLLBACK_PLAN.md**
- Procedure 5 passos
- Triggers automáticos
- Runbook para emergências

### ...monitorar produção
👉 Vá para: **MONITORING_SETUP.md**
- Sentry setup
- Winston logs
- Health checks
- Alertas

### ...executar testes automáticos
👉 Vá para: **SMOKE_TESTS_PRODUCAO.sh**
```bash
bash SMOKE_TESTS_PRODUCAO.sh
```

### ...rastrear um deploy
👉 Vá para: **DEPLOYMENT_LOG.md**
- Template para cada deploy
- Auditoria completa
- Preenchido a cada release

---

## 📋 Checklist Rápido

**Antes de deploy:**
1. [ ] Ler PRE_DEPLOY_CHECKLIST.md
2. [ ] Validar 40+/50 itens
3. [ ] Verificar que QA passou 16/16 testes

**Durante deploy:**
1. [ ] `git push origin main`
2. [ ] Aguardar 5 minutos
3. [ ] `bash SMOKE_TESTS_PRODUCAO.sh`

**Após deploy:**
1. [ ] Executar POST_DEPLOY_VALIDATION.sh
2. [ ] Documentar em DEPLOYMENT_LOG.md
3. [ ] Monitor logs por 1h

---

## 📁 Arquivo por Arquivo

### Documentação Crítica

#### 1. DEPLOY_QUICK_START.md (COMECE AQUI)
- Timeline: 20 min
- 5 passos do deploy
- Troubleshooting rápido
- **Quando usar:** Pronto para fazer deploy

#### 2. PRE_DEPLOY_CHECKLIST.md (OBRIGATÓRIO)
- 50 itens de validação
- Decision gate
- Git status, build, code quality, env vars, tests
- **Quando usar:** Antes de git push

#### 3. POST_DEPLOY_VALIDATION.sh (PÓS-DEPLOY)
- Script automático
- Aguarda deploy completar
- Executa smoke tests
- Gera relatório
- **Quando usar:** Após git push (esperar 5 min)

### Documentação Técnica

#### 4. CICD_PIPELINE_VERIFICATION.md
- GitHub Actions workflow
- Vercel config
- Railway setup
- Environment variables
- **Quando usar:** Entender como deploy funciona

#### 5. MONITORING_SETUP.md
- Sentry (error tracking)
- Winston (logging)
- Health checks
- Uptime monitoring
- Alertas + runbook
- **Quando usar:** Configurar monitoring

#### 6. ROLLBACK_PLAN.md
- Procedure 5 passos
- Triggers automáticos
- Root cause analysis
- Testing strategy
- **Quando usar:** Algo quebrou em produção

### Tracking & Logs

#### 7. DEPLOYMENT_LOG.md
- Template para cada deploy
- Rastreamento completo
- Auditoria
- **Quando usar:** Depois de cada deploy bem-sucedido

#### 8. DEVOPS_READINESS_SUMMARY.md
- Status geral da infraestrutura
- Fases completadas
- Críticos identificados
- Próximos passos
- **Quando usar:** Visão geral do projeto

### Scripts Executáveis

#### 9. SMOKE_TESTS_PRODUCAO.sh
```bash
bash SMOKE_TESTS_PRODUCAO.sh
```
- 10 testes automáticos
- Valida health, auth, endpoints
- Gera relatório
- **Quando usar:** Pós-deploy ou validação rápida

---

## 🔄 Workflow Completo de Deploy

```
1. LEITURA
   ├─ Ler DEPLOY_QUICK_START.md
   └─ Ler PRE_DEPLOY_CHECKLIST.md

2. VALIDAÇÃO PRÉ-DEPLOY (5 min)
   ├─ npm run build (sem erros?)
   ├─ npm run lint (sem erros?)
   ├─ git status (limpo?)
   ├─ Verificar se QA passou 16/16
   └─ Completar 40+/50 items do checklist

3. DEPLOY (1 min)
   └─ git push origin main

4. MONITOR (5 min)
   ├─ Aguardar Vercel deploy
   ├─ Aguardar Railway deploy
   └─ Verificar: ambos UP?

5. VALIDAÇÃO PÓS-DEPLOY (3 min)
   ├─ bash SMOKE_TESTS_PRODUCAO.sh
   ├─ Se PASS: Sucesso!
   └─ Se FAIL: Ver ROLLBACK_PLAN.md

6. DOCUMENTAÇÃO (2 min)
   ├─ Preencher DEPLOYMENT_LOG.md
   ├─ Notificar cliente
   └─ Monitor logs por 1h

TOTAL: ~20 minutos
```

---

## 🚨 Emergency Procedures

### Se smoke tests falharem
1. Ler: ROLLBACK_PLAN.md
2. Executar: Procedure 5 passos
3. Validar: smoke tests novamente

### Se produção cair
1. Ler: ROLLBACK_PLAN.md → Scenario triggers
2. Identificar: qual commit é ruim?
3. Executar: git revert [COMMIT]
4. Push: git push origin main
5. Aguardar: 5 min para redeploy
6. Validar: smoke tests

### Se database cair
1. Verificar: Supabase status
2. Se ainda fora: Contatar Supabase support
3. Se pode restore: Manual restore
4. Se crítico: Rollback imediato

---

## 📊 Key Files Summary

| Arquivo | Tipo | Tamanho | Propósito |
|---------|------|---------|-----------|
| DEPLOY_QUICK_START.md | Docs | 4KB | Guia 20 min |
| PRE_DEPLOY_CHECKLIST.md | Docs | 12KB | 50 validações |
| CICD_PIPELINE_VERIFICATION.md | Docs | 6KB | Arquitetura |
| MONITORING_SETUP.md | Docs | 10KB | Sentry + Logs |
| ROLLBACK_PLAN.md | Docs | 8KB | Emergency |
| DEPLOYMENT_LOG.md | Docs | 2KB | Template |
| DEVOPS_READINESS_SUMMARY.md | Docs | 8KB | Status geral |
| SMOKE_TESTS_PRODUCAO.sh | Script | 6KB | 10 testes |
| POST_DEPLOY_VALIDATION.sh | Script | 4KB | Validação |

---

## ✅ Checklist de Leitura

Antes de fazer deploy, você deve ter lido:

- [ ] DEPLOY_QUICK_START.md (guia rápido)
- [ ] PRE_DEPLOY_CHECKLIST.md (validações)
- [ ] ROLLBACK_PLAN.md (se der ruim)

Antes de fazer deploy avançado, você deve ter lido:

- [ ] CICD_PIPELINE_VERIFICATION.md (entender arquitetura)
- [ ] MONITORING_SETUP.md (monitorar produção)
- [ ] DEPLOYMENT_LOG.md (rastrear deploys)

---

## 🎓 Learning Path

### Iniciante (primeira vez fazendo deploy)
1. DEPLOY_QUICK_START.md
2. PRE_DEPLOY_CHECKLIST.md
3. Fazer deploy
4. Ler ROLLBACK_PLAN.md (para estar preparado)

### Intermediário (múltiplos deploys)
1. CICD_PIPELINE_VERIFICATION.md
2. MONITORING_SETUP.md
3. DEPLOYMENT_LOG.md
4. Dominar workflow completo

### Avançado (escalação e otimização)
1. Estudar: GitHub Actions, Vercel, Railway docs
2. Otimizar: Build time, deploy time
3. Implementar: Sentry, Winston, UptimeRobot
4. Criar: Custom monitoring dashboards

---

## 📞 Quick Reference

### Command para Deploy
```bash
# Pré-deploy
npm run build
npm run lint

# Deploy
git push origin main

# Pós-deploy
sleep 300
bash SMOKE_TESTS_PRODUCAO.sh
```

### Command para Rollback (Emergência)
```bash
# Identificar commit ruim
git log --oneline -3

# Revert
git revert [BAD_COMMIT] --no-edit
git push origin main

# Validar
sleep 300
bash SMOKE_TESTS_PRODUCAO.sh
```

### URLs Importantes
- GitHub: https://github.com/mgabsilva9-boop/dealer-sourcing
- Vercel: https://vercel.com/dashboard
- Railway: https://railway.app/dashboard
- Supabase: https://app.supabase.com

---

## 🆘 Help

### Não sei por onde começar
→ Ler: DEPLOY_QUICK_START.md

### Não tenho certeza se posso fazer deploy
→ Executar: PRE_DEPLOY_CHECKLIST.md

### Algo quebrou em produção
→ Ler: ROLLBACK_PLAN.md

### Quero entender o sistema
→ Ler: CICD_PIPELINE_VERIFICATION.md

### Quero monitorar produção
→ Ler: MONITORING_SETUP.md

---

**Versão:** 1.0  
**Data:** 2026-04-08  
**Status:** ✅ Pronto

