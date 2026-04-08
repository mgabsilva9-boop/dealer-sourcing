# 🔄 ROLLBACK PLAN — Emergency Recovery

**Objetivo:** Restaurar sistema em funcionamento em caso de deploy quebrado  
**Tempo SLA:** <15 minutos  
**Responsável:** DevOps Agent  
**Teste:** Antes de cada deploy

---

## Princípios

1. **Velocidade > Perfeição:** Restore service first, debug later
2. **Documentação:** Cada rollback é logged em DEPLOYMENT_LOG.md
3. **Aviso:** Cliente notificado imediatamente
4. **Root Cause:** Investigar DEPOIS, não durante rollback

---

## Cenários & Triggers

### 🔴 TRIGGER IMMEDIATE ROLLBACK

| Cenário | Trigger | Ação |
|---------|---------|------|
| API /health retorna 500 | 100% de erro | Rollback imediato |
| Login falha para TODOS | >95% taxa de erro | Rollback imediato |
| Database não conecta | Erro de conexão crítico | Rollback imediato |
| Frontend tela branca | Erro em toda página | Rollback imediato |
| Memory leak | Node memory cresce >500MB/min | Rollback imediato |

### 🟠 TRIGGER CONDITIONAL ROLLBACK

| Cenário | Threshold | Ação |
|---------|-----------|------|
| Smoke tests falham | >3 testes falhando | Rollback |
| Sentry spike | >50 erros/min novos | Aguardar investigação 5min |
| Performance degrada | Response time >5s | Investigar 10min, depois rollback |
| Database slow | Queries >2s | Investigar 10min, depois rollback |

---

## Quick Rollback Procedure

### 1️⃣ Declarar Emergência

```bash
# Notificar equipe (Slack, se existir)
# "🚨 PRODUCTION ISSUE — Iniciando rollback"

# Nota rápida do commit ruim
git log --oneline -1
# Resultado: "abc1234 fix: algo que quebrou"
```

### 2️⃣ Identificar Commit Anterior

```bash
# Ver últimos 3 commits
git log --oneline -3

# Esperado:
# abc1234 fix: algo que quebrou ← ESTE QUEBROU
# def5678 fix: coisa anterior ← VOLTAR AQUI
# ghi9012 feat: feature anterior
```

### 3️⃣ Executar Revert

```bash
# Opção A: Revert (preferido — mantém histórico)
git revert abc1234 --no-edit
git push origin main

# Ou Opção B: Reset (mais agressivo — reincreve história)
# ⚠️  Usar APENAS em emergência total
# git reset --hard def5678
# git push --force-with-lease origin main
```

### 4️⃣ Aguardar Redeploy

**Vercel (Frontend)**
- Auto-deploy em ~1-2 min
- Verificar: vercel.com → Deployments → Status

**Railway (Backend)**
- Auto-deploy em ~2-5 min
- Verificar: railway.app → Deployments → Status

**Total: 5-10 minutos**

### 5️⃣ Validar Redeploy

```bash
# Executar smoke tests após deploy estar UP
sleep 300  # Aguardar 5 min

bash SMOKE_TESTS_PRODUCAO.sh

# Esperado: ✅ Todos passando
```

### 6️⃣ Comunicar Status

```
Mensagem ao cliente:
"✅ Problema identificado e resolvido
Deploy anterior teve issue, revertemos para versão estável
Aguardando validação final... [5 min]
Será comunicado quando 100% OK"
```

---

## Rollback Step-by-Step (Executar)

### Setup: Terminal 1 (Main Terminal)

```bash
cd /c/Users/renat/ThreeOn/clients/dealer-sourcing

# Verificar status git
git status
git log --oneline -5
```

### Step 1: Identify Bad Commit

```bash
# Veja qual commit quebrou (último)
git log --oneline -1
# Anotação: abc1234 fix: ... (THIS IS BAD)

# Próximo será o que reverter:
COMMIT_TO_REVERT="abc1234"
echo "Vou fazer revert do commit: $COMMIT_TO_REVERT"
```

### Step 2: Create Revert Commit

```bash
# Fazer revert (mantém histórico, mais seguro)
git revert $COMMIT_TO_REVERT --no-edit

# Resultado: novo commit com "Revert abc1234"
git log --oneline -1
```

### Step 3: Push to Main

```bash
# Push ativa auto-deploy
git push origin main

# Resultado esperado:
# [main abc1235] Revert abc1234
# git push origin main
```

### Step 4: Monitor Deploy Status

```bash
# Terminal 2: Monitor Vercel
echo "🔍 Monitorando Vercel..."
while true; do
  curl -s https://dealer-sourcing-frontend.vercel.app | head -c 100
  echo " [$(date)]"
  sleep 5
done

# Terminal 3: Monitor Railway
echo "🔍 Monitorando Railway API..."
while true; do
  curl -s https://dealer-sourcing-api-production.up.railway.app/health
  echo " [$(date)]"
  sleep 5
done
```

### Step 5: Run Smoke Tests

```bash
# Após ambos respondendo:
bash SMOKE_TESTS_PRODUCAO.sh

# Se PASS (0 FAILED):
# ✅ Rollback foi bem-sucedido

# Se FAIL (>0 FAILED):
# ❌ Rollback não resolveu — investigar mais
```

---

## Pós-Rollback: Root Cause Analysis

DEPOIS que tudo está estável:

### 1. Documentar

```markdown
## Rollback Report #1

**Data:** [Data]
**Commit Revertido:** abc1234 (fix: ...)
**Tempo de Rollback:** 8 minutos
**Root Cause:** Database connection timeout em staging

**Ações Futuras:**
1. Testar DATABASE_URL em staging antes de deploy
2. Adicionar smoke test de database connectivity
3. Aumentar timeout em Railway (30s → 60s)

**Lições Aprendidas:**
- Teste local passava mas staging falhava
- Faltava teste de pool de conexões
```

### 2. Fix & Redeploy

```bash
# Depois de 24-48h (não deploy quente após rollback)
# Corrigir root cause
# Testar extensivamente
# Deploy novamente

git log --oneline -1  # Ver commit que está em produção agora
```

### 3. Post-Mortem (Opcional)

Se foi grave:
- [ ] Reunião com time
- [ ] O que correu bem?
- [ ] O que correu mal?
- [ ] Como evitar próxima vez?

---

## Emergency Contact Tree

```
🚨 PRODUCTION DOWN

├─ DevOps Agent (Primary)
│  ├─ Executar rollback
│  └─ Notificar CTO
│
├─ CTO (if needed)
│  ├─ Validar rollback
│  └─ Notificar Cliente
│
└─ Cliente (Last)
   └─ "Temos uma issue, já estamos resolvendo"
```

---

## Rollback Checklist (Executar)

```
ANTES DO ROLLBACK
- [ ] Confirmei que é realmente uma emergência?
- [ ] Identifiquei corretamente qual commit é "bad"?
- [ ] Tenho backup do commit bad (para análise depois)?
- [ ] Git status está limpo (nada uncommitted)?

DURANTE O ROLLBACK
- [ ] Executei: git revert [COMMIT]
- [ ] Executei: git push origin main
- [ ] Estou monitorando Vercel + Railway deploy
- [ ] Não interrompi o push (aguardei finish)

PÓS ROLLBACK
- [ ] Aguardei 5 minutos para deploy completar
- [ ] Executei: bash SMOKE_TESTS_PRODUCAO.sh
- [ ] Todos os testes PASSARAM?
- [ ] Notifiquei cliente: "✅ Resolvido"

PÓS-MORTEM (próximas 24h)
- [ ] Documentei o que aconteceu
- [ ] Identifiquei root cause
- [ ] Criei issue/task para fix permanente
```

---

## Versioning Strategy (Para Facilitar Rollback)

Recomendação: Usar Git tags para releases

```bash
# Antes de cada deploy para production
git tag -a v1.2.3 -m "Release 1.2.3 — PLANO_ACAO_5_CRITICOS fixes"
git push origin v1.2.3

# Se precisar rollback:
git checkout v1.2.2
git push -f origin main  # ⚠️  Força push (use com cuidado)

# Depois fix corretamente e deploy novamente
```

---

## Testing Rollback (Antes de Usar)

### Teste Local (Semanal)
```bash
# Simular rollback
git log --oneline -3
# abc1234 last commit
# def5678 previous commit

# Fazer revert local (NÃO push)
git revert abc1234
git log --oneline -1  # Ver novo commit

# Desfazer teste
git reset --hard HEAD~1
git log --oneline -1  # Voltar ao abc1234
```

### Teste em Staging (Mensal)
1. Deploy quebrado em staging
2. Executar rollback procedure completa
3. Validar que smoke tests passam
4. Documentar tempo e problemas

---

## Automação Futura

```bash
# Criar script de rollback automático (opcional)
# ./scripts/rollback.sh

#!/bin/bash
LAST_GOOD_COMMIT=$1
git revert $(git rev-parse HEAD) --no-edit
git push origin main
echo "✅ Rollback iniciado. Aguarde 5 min para deploy."
bash SMOKE_TESTS_PRODUCAO.sh
```

---

## Key Takeaways

1. **Rollback é seu amigo** — use sem medo em emergência
2. **Velocidade > Perfeição** — restore service, debug depois
3. **Teste sua strategy** — simule rollback antes de precisar
4. **Documente tudo** — cada rollback aprende você algo novo
5. **Previna futuro** — use rollback para melhorar CI/CD

**Bem-vindo ao Club de DevOps — Onde Rollbacks são normais e esperados! 🚀**

