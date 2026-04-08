# 🤖 ORQUESTRAÇÃO NOTURNA — Agentes Trabalham Autonomamente

**Data:** 8 Abril 2026  
**Turno:** Noturno (20:00-08:00 = 12h contínuas)  
**Status:** 4 Agentes acionados para trabalho autônomo  
**Objetivo:** Finalizar 5 bugs críticos + validação + deploy

---

## 📋 FLUXO AUTOMÁTICO

### FASE 1: Dev Agent (14-16h de trabalho)

**Status:** 🔵 Investigando BUG #2 agora

**O que fazer:**
```
1. BUG #2: Performance (2h)
   - Profile APIs com DevTools
   - Identificar N+1 queries
   - Otimizar backend/frontend
   - Commit: "fix: BUG #2 — performance optimization"
   
2. BUG #3: Kanban Drag-Drop (3h)
   - Encontrar onClick handler ausente
   - Implementar PUT request ao soltar
   - Testar drag-drop
   - Commit: "fix: BUG #3 — kanban drag-drop funcional"
   
3. BUG #4: Multi-tenant RLS (4h)
   - Auditar todas queries
   - Adicionar WHERE dealership_id em:
     - expenses.js
     - customers.js
     - ipva.js
     - financial.js
   - Commit: "fix: BUG #4 — RLS em todas abas"
   
4. BUG #5: Clientes CRUD (5h)
   - Implementar GET /customers/:id
   - Implementar PATCH /customers/:id
   - Implementar DELETE /customers/:id
   - Frontend: modal de edição
   - Commit: "fix: BUG #5 — CRUD completo clientes"
   
5. BONUS: Login Race Condition (2h)
   - Fix useEffect cleanup
   - Testar 10 ciclos login/logout
   - Commit: "fix: BONUS — login race condition"

TOTAL: ~16h contínuas
AVISA QUANDO: Cada bug está fixado (commit log)
```

**Checklist por bug:**
- [ ] Investigação completa
- [ ] Implementação realizada
- [ ] npm run build = 0 errors
- [ ] Teste local funciona
- [ ] Commit com mensagem clara
- [ ] Push para main

---

### FASE 2: QA Agent (Acionado Assim Que Dev Termina Cada Bug)

**Trigger:** Quando ver commit de Dev em `git log`

**O que fazer:**
```
Para CADA bug fixado:
1. Ler novo commit em git log
2. Executar correspondente em TEST_CASES.md:
   - BUG #1 Tests (IPVA) → 3 testes
   - BUG #2 Tests (Performance) → 4 testes + benchmarks
   - BUG #3 Tests (Kanban) → 4 testes
   - BUG #4 Tests (Multi-tenant) → 5 testes
   - BUG #5 Tests (Clientes) → 7 testes
   - BONUS Tests (Login) → 4 testes

3. Documentar resultado em QA_VALIDATION_REPORT.md
4. Se FAIL: reportar exatamente qual teste falhou
5. Se PASS: avisa DevOps "Pronto para deploy"

TOTAL: ~3-4h (enquanto Dev termina)
AVISA QUANDO: Todos 5 bugs validados
```

**Checklist QA:**
- [ ] BUG #1: 3/3 testes PASS
- [ ] BUG #2: 4/4 testes PASS + benchmark
- [ ] BUG #3: 4/4 testes PASS
- [ ] BUG #4: 5/5 testes PASS
- [ ] BUG #5: 7/7 testes PASS
- [ ] BONUS: 4/4 testes PASS
- [ ] Regression: 10/10 testes PASS
- [ ] Final: QA_VALIDATION_REPORT.md preenchido

---

### FASE 3: DevOps Agent (Acionado Assim Que QA Passa)

**Trigger:** Quando QA avisa "Todos testes PASS"

**O que fazer:**
```
1. Verificar git status (working tree clean)
2. Executar PRE_DEPLOY_CHECKLIST.md
   - Git: tudo commitado?
   - Build: 0 errors?
   - Env vars: tudo setado?
   - Resultado: 40+/50 itens PASS?
   
3. Se PASS: git push origin main
   - Vercel auto-deploy (~5 min)
   - Railway auto-deploy (~5 min)
   
4. Aguardar 5 minutos
   
5. Executar SMOKE_TESTS_PRODUCAO.sh
   - 10 testes automáticos
   - Resultado: 10/10 PASS?
   
6. Se PASS: Sucesso! 🎉
   - Documentar em DEPLOYMENT_LOG.md
   - Avisa: "Pronto para cliente"
   
7. Se FAIL: Executar ROLLBACK_PLAN.md
   - git revert HEAD
   - Push
   - Investigar por quê quebrou

TOTAL: ~30-45 min
AVISA QUANDO: Deploy feito com sucesso
```

**Checklist DevOps:**
- [ ] PRE_DEPLOY_CHECKLIST: 40+/50 PASS
- [ ] git push origin main
- [ ] Aguardar 5 min (auto-deploy)
- [ ] SMOKE_TESTS_PRODUCAO.sh: 10/10 PASS
- [ ] DEPLOYMENT_LOG.md preenchido
- [ ] Cliente notificado

---

## 📊 DEPENDÊNCIAS ENTRE AGENTES

```
Dev Agent (16h)
│
├─ Termina BUG #1
│  └─ QA testa BUG #1 (paralelo)
│     └─ Doc resultado
│
├─ Termina BUG #2
│  └─ QA testa BUG #2
│     └─ Doc resultado
│
├─ Termina BUG #3
│  └─ QA testa BUG #3
│     └─ Doc resultado
│
├─ Termina BUG #4
│  └─ QA testa BUG #4
│     └─ Doc resultado
│
├─ Termina BUG #5 + BONUS
│  └─ QA testa #5 + BONUS + Regression
│     └─ QA avisa "TODOS PASS"
│
└─ Fim Dev Agent (16h total)
   
   QA Agent (4h paralelo)
   │
   ├─ Testa cada bug conforme vem
   ├─ Regression final
   ├─ Avisa DevOps "Pronto"
   │
   └─ Fim QA Agent
      
      DevOps Agent (30 min)
      │
      ├─ PRE_DEPLOY_CHECKLIST
      ├─ git push
      ├─ Aguarda deploy auto
      ├─ SMOKE_TESTS
      ├─ Sucesso! Deploy completo
      │
      └─ Fim DevOps Agent
         
         CLIENTE (Valida)
         └─ Login → Testa tudo → "Aprovado!"
```

---

## ⏱️ TIMELINE ESTIMADA

```
21:00  → Agentes acionados (agora)
21:00-23:00  → Dev: BUG #2 (2h)
23:00-02:00  → Dev: BUG #3 (3h)
02:00-06:00  → Dev: BUG #4 (4h)
06:00-11:00  → Dev: BUG #5 + BONUS (5h)

Paralelo (QA testando conforme Dev termina):
21:30  → QA: Testa BUG #1 (30 min)
23:15  → QA: Testa BUG #2 (45 min)
02:15  → QA: Testa BUG #3 (45 min)
06:15  → QA: Testa BUG #4 (1h)
11:15  → QA: Testa BUG #5 + BONUS + Regression (1h)

Deploy (assim que QA passa):
12:15  → DevOps: PRE_DEPLOY_CHECKLIST (15 min)
12:30  → DevOps: git push (1 min)
12:30-12:40  → Vercel deploy auto (5 min)
12:35-12:45  → Railway deploy auto (5 min)
12:45  → DevOps: SMOKE_TESTS (15 min)
13:00  → ✅ DEPLOY COMPLETO

13:00  → CLIENTE PODE VALIDAR
```

**Total:** ~16h (21:00 até ~13:00 do dia seguinte) ✅

---

## 🎯 O QUE VOCÊ PRECISA FAZER

### Agora (Antes de Dormir)
- [ ] Confirmar autorização ✅ (já fez)
- [ ] Verificar que agentes estão acionados
- [ ] Ler este documento
- [ ] Dormir 😴

### Amanhã Manhã (Ao Acordar)
- [ ] Verificar `git log --oneline -10` (ver commits)
- [ ] Verificar `DEPLOYMENT_LOG.md` (ver status)
- [ ] Se Deploy COMPLETO:
  - [ ] Notificar cliente: "Pronto para testar"
  - [ ] Enviar credentials: dono@brossmotors.com / bross2026
  - [ ] Enviar link: https://dealer-sourcing-frontend.vercel.app
- [ ] Se Deploy FAIL:
  - [ ] Ler `ROLLBACK_PLAN.md`
  - [ ] Entender por quê quebrou
  - [ ] Avisar Dev Agent

### Se Cliente Encontra Problema
- [ ] Documentar exatamente o problema
- [ ] Avisar Dev Agent
- [ ] Dev Agent faz hotfix
- [ ] QA valida
- [ ] DevOps redeploy

---

## 📌 ARQUIVOS CRÍTICOS

**Monitorar durante a noite:**
```
git log --oneline -10          # Ver commits de Dev
cat DEPLOYMENT_LOG.md          # Ver status DevOps
cat QA_VALIDATION_REPORT.md    # Ver status QA
```

**Se algo falhar:**
```
ROLLBACK_PLAN.md               # Procedimento emergência
PLANO_ACAO_5_CRITICOS.md       # Referência dos bugs
```

**Cliente recebe:**
```
ENTREGA_FINAL_CLIENTE.md       # Documento final
Credenciais + Link + Instruções
```

---

## ✅ CHECKLIST FINAL

**PRÉ-NOITE:**
- [ ] Dev Agent: Acionado ✅
- [ ] QA Agent: Pronto ✅
- [ ] DevOps Agent: Pronto ✅
- [ ] UI/Design Agent: Completo ✅
- [ ] Plano de orquestração: Este documento ✅
- [ ] Autorização: Concedida ✅

**DURANTE NOITE:**
- [ ] Dev implementa 5 bugs
- [ ] QA valida cada um
- [ ] DevOps faz deploy

**AMANHÃ MANHÃ:**
- [ ] Verificar git log
- [ ] Verificar deploy status
- [ ] Notificar cliente
- [ ] Cliente valida

---

## 🎉 META FINAL

```
Antes:   ❌ 5 bugs críticos (cliente frustrado)
         ❌ Imagens feias (visual ruim)
         ❌ Sistema lento (UX horrível)

Depois:  ✅ 5 bugs fixados
         ✅ Imagens profissionais
         ✅ Sistema otimizado
         ✅ Cliente feliz
         ✅ Pronto para Fase 2
```

---

**Status:** 🟢 **TUDO PRONTO PARA TRABALHO AUTÔNOMO NOTURNO**

Agentes vão trabalhar durante a noite, você acorda e sistema está pronto para cliente! 🚀
