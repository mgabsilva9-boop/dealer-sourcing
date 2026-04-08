# 🛡️ PROTOCOLO DE DESENVOLVIMENTO — Dealer Sourcing

**Objetivo:** Garantir que cada implementação é feita corretamente da primeira vez, sem quebrar outras coisas.

**Versão:** 1.0  
**Data:** 8 de Abril de 2026

---

## 📋 Princípio Central

> **"Nenhuma mudança vai para produção sem passar por este checklist. Sem exceção."**

Toda feature, bugfix, refactor deve passar por 4 fases em ordem:

1. **PLANEJAMENTO** (@dev ou @architect)
2. **DESENVOLVIMENTO** (@dev com validação contínua)
3. **TESTES** (@qa e @dev em paralelo)
4. **DEPLOYMENT** (@devops com monitoramento)

---

## 🔴 FASE 1: PLANEJAMENTO (2-4h antes de começar a desenvolver)

### Checklist de Planejamento

- [ ] **Entender o escopo completo**
  - O que exatamente vai mudar?
  - Quais arquivos serão tocados?
  - Quais tabelas do banco serão afetadas?

- [ ] **Mapear impactos em cascata**
  - Se mudar tabela X, quais queries usam X?
  - Se mudar endpoint Y, qual frontend chama Y?
  - Se remover função Z, quem a chama?

- [ ] **Criar diagrama de mudanças**
  ```
  Frontend mudança → Precisa de API endpoint novo?
  API endpoint novo → Precisa de banco novo?
  Banco novo → Precisa de migration?
  Migration → Como rollback se quebrar?
  ```

- [ ] **Listar TODOS os arquivos que vão tocar**
  - Frontend: App.jsx, components/*, lib/*
  - Backend: routes/*, lib/*, db/migrations/*
  - Config: .env, vercel.json, railway.json

- [ ] **Planejar rollback**
  - Se quebrar, como volta?
  - Precisa de soft-delete ou data backup?

- [ ] **Escrever acceptance criteria**
  - O que precisa estar funcionando ao final?
  - Quais testes precisam passar?

---

## 🟢 FASE 2: DESENVOLVIMENTO (Com validação contínua)

### 2.1: Setup (5 min)

- [ ] Criar branch: `git checkout -b feature/nome-descritivo`
- [ ] Pull latest main: `git pull origin main`
- [ ] Entender estado atual: `git log --oneline -5`

### 2.2: Implementação (Regra: NUNCA fazer tudo de uma vez)

**Regra de Ouro:** Fazer mudanças em PEQUENOS passos. Cada passo é um commit.

#### Passo 1: Backend - Migration (se necessário)
- [ ] Criar arquivo: `src/db/migrations/YYYYMMDD_descricao.sql`
- [ ] Escrever ALTER TABLE com `IF NOT EXISTS`
- [ ] TESTAR localmente: `psql conexao < arquivo.sql`
- [ ] Adicionar também em `initTables()` de respaldo
- [ ] Commit: `git add . && git commit -m "db: add migration para X"`

#### Passo 2: Backend - API endpoint
- [ ] Implementar rota em `src/routes/*.js`
- [ ] Adicionar validações (frontend + backend)
- [ ] Adicionar error handling
- [ ] Adicionar logging estruturado
- [ ] Commit: `git commit -m "feat: add POST /endpoint"`

#### Passo 3: Backend - Testes locais
- [ ] `npm run build` — 0 errors?
- [ ] `curl localhost:3000/endpoint` — 200 OK?
- [ ] Testar com dados inválidos — 400 retorna?
- [ ] Testar sem auth — 401 retorna?

#### Passo 4: Frontend - Conectar endpoint
- [ ] Criar função em `src/api.js` para chamar endpoint novo
- [ ] Conectar ao componente que precisa
- [ ] Testar loading/error states
- [ ] Commit: `git commit -m "feat: connect frontend to new endpoint"`

#### Passo 5: Frontend - Testes locais
- [ ] `npm run build` — 0 errors?
- [ ] Abrir `localhost:5173` — carrega?
- [ ] Testar fluxo completo (login → usar feature → verificar)
- [ ] Abrir DevTools (F12) — algum error na console?

### 2.3: Validação Contínua (A cada commit)

```bash
# Após CADA commit, rodar:
npm run build           # Verifica sintaxe
npm run lint            # (se tiver)
curl test-api           # Testa endpoint
```

---

## 🔵 FASE 3: TESTES (@qa Agent)

### 3.1: Testes Manuais (30 min)

**Teste TUDO que pode quebrar:**

- [ ] Feature nova funciona? (happy path)
- [ ] Feature nova valida inputs? (sad path)
- [ ] Features ANTIGAS ainda funcionam? (regression)
  - [ ] Login funciona?
  - [ ] Estoque carrega?
  - [ ] Dashboard atualiza?
  - [ ] IPVA funciona?
- [ ] Performance não piorou? (<300ms por request)
- [ ] Responsivo continua? (mobile + desktop)

### 3.2: Testes End-to-End

Seguir template em `ENTREGA_FINAL_CLIENTE.md` — 15 fluxos completos

- [ ] Fluxo 1-5: Core features
- [ ] Fluxo 6-10: Integrações
- [ ] Fluxo 11-15: Edge cases
- [ ] Resultado: 95%+ tests PASS

### 3.3: Testes de Segurança

- [ ] RLS ainda funciona? (usuário A não vê dados de B)
- [ ] Token expiração funciona?
- [ ] Rate limiting ainda ativo?
- [ ] Inputs sanitizados?

### 3.4: Relatório QA

```markdown
## QA Report — [Feature Name]

**Testes Manuais:** 23/23 PASS ✅
**Regression:** 15/15 PASS ✅
**Security:** 4/4 PASS ✅
**Performance:** <300ms avg ✅

**Issues Found:** 0

**Approval:** ✅ PRONTO PARA DEPLOY
```

---

## 🟡 FASE 4: DEPLOYMENT (@devops Agent)

### 4.1: Pre-Deploy Checklist

- [ ] Todos os commits no main?
- [ ] Todos os testes passando?
- [ ] QA aprovou?
- [ ] Migrations prontas?
- [ ] Rollback plan documentado?

### 4.2: Deploy Steps

```bash
# 1. Final verification
git status                    # working tree clean?
npm run build                 # 0 errors?
bash test_production.sh       # 12/12 pass?

# 2. Push to main
git push origin main          # Triggers CI/CD

# 3. Monitor deployment
# Vercel: watch build logs at vercel.com
# Railway: watch logs at railway.com

# 4. Smoke tests em produção (5 min após deploy)
curl https://dealer-sourcing-api-production.up.railway.app/health
curl https://dealer-sourcing-frontend.vercel.app
```

### 4.3: Post-Deploy Monitoring (30 min)

- [ ] Frontend carrega? (200 OK)
- [ ] Backend responde? (health check)
- [ ] Logs sem erros críticos?
- [ ] Database queries normais?
- [ ] No spike em memory/CPU?

---

## 🚨 EMERGENCY PROTOCOL (Se quebrou em produção)

### 1. ASSESS (2 min)
- [ ] Qual feature está quebrada?
- [ ] Quantos usuários afetados?
- [ ] É revertível?

### 2. DECIDE
- [ ] Opção A: Revert último commit (`git revert HEAD`)
- [ ] Opção B: Hotfix rápido (se souber exatamente o problema)
- [ ] Opção C: Take offline até consertar

### 3. EXECUTE
```bash
git revert HEAD              # Volta último commit
npm run build                # Valida
git push origin main         # Redeploy
```

### 4. POST-MORTEM (Após 24h)
- [ ] O que quebrou?
- [ ] Por que o teste não pegou?
- [ ] Como evitar no futuro?

---

## 📊 TEMPLATE: TICKET DE DESENVOLVIMENTO

```markdown
# [FEATURE/BUG] - Título Descritivo

## Escopo
- [ ] O que muda
- [ ] Arquivos afetados
- [ ] Impactos em cascata

## Planejamento
- [ ] Diagrama de mudanças
- [ ] Rollback plan
- [ ] Acceptance criteria

## Desenvolvimento
- [ ] Backend migration
- [ ] Backend endpoint
- [ ] Frontend conexão
- [ ] Logs estruturados

## Testes
- [ ] Testes manuais (checklist)
- [ ] Regression (15 fluxos)
- [ ] Security (4 checks)
- [ ] Performance (<300ms)

## Deployment
- [ ] Pre-deploy checklist
- [ ] Deploy logs
- [ ] Smoke tests produção
- [ ] Post-deploy monitoring

## Sign-off
- [ ] @dev: Implementação ✅
- [ ] @qa: Testes ✅
- [ ] @devops: Deploy ✅
```

---

## 🎯 TAMANHO DE MUDANÇA vs TEMPO

| Tipo | Exemplo | Tempo | Fases |
|------|---------|-------|-------|
| Micro | Typo, cor | 15 min | Dev + Deploy |
| Pequena | Add field, novo endpoint | 2-4h | Planejamento + Dev + Testes + Deploy |
| Média | Refactor, feature | 8-16h | Tudo + Post-mortem |
| Grande | Nova tabela, arquitetura | 40+ h | Tudo + extra review |

---

## 🚫 PROIBIÇÕES

1. **NUNCA** fazer mudanças em múltiplas camadas sem testar entre elas
2. **NUNCA** commitar migrations sem executá-las localmente
3. **NUNCA** fazer queries sem validar coluna existe
4. **NUNCA** deploy sem passar por QA
5. **NUNCA** mudar em produção sem rollback plan
6. **NUNCA** assumir que "vai funcionar" — TESTE
7. **NUNCA** quebrar coisa nova para consertar coisa velha

---

## ✅ EXEMPLOS DE EXECUÇÃO CORRETA

### Exemplo 1: Add novo endpoint
```
1. Plan (30 min)
   - Diagrama: Frontend → API → DB
   - Rollback: Remove endpoint, reverte migration
   
2. Dev (2h)
   - Migration criada + testada
   - Endpoint implementado + testado
   - Frontend conectado + testado
   - 3 commits
   
3. QA (1h)
   - Feature nova funciona
   - Features velhas não quebraram
   - Tests PASS
   
4. Deploy (15 min)
   - Push, Vercel/Railway redeploy
   - Smoke tests
   - Done
   
TOTAL: 3.5h
```

### Exemplo 2: Bug fix urgente
```
1. Plan (5 min)
   - Problema: soft-delete query falha
   - Solução: Adicionar ALTER TABLE em initTables()
   - Rollback: Remover WHERE deleted_at
   
2. Dev (15 min)
   - Fix implementado
   - Testado localmente
   - 1 commit
   
3. QA (10 min)
   - Verifica problema resolvido
   - Verifica não quebrou nada
   
4. Deploy (5 min)
   - Push, wait for redeploy
   
TOTAL: 35 min
```

---

## 📈 MÉTRICAS DE QUALIDADE

Rastrear por sprint:

```
Bugs encontrados em QA: [alvo: >80% dos bugs]
Bugs encontrados em produção: [alvo: 0]
Testes PASS rate: [alvo: >95%]
Deployment success rate: [alvo: 100%]
Rollback necessários: [alvo: 0]
```

---

## 🎓 TREINAMENTO OBRIGATÓRIO

Todo desenvolvedor DEVE:
- [ ] Ler este protocolo
- [ ] Fazer 1 feature seguindo 100% das fases
- [ ] Ter review de @devops antes de primeiro deploy
- [ ] Fazer post-mortem de 1 incident (real ou simulado)

---

**Assinado por:** @dev @qa @devops  
**Última revisão:** 2026-04-08  
**Versão:** 1.0 (Viverá e evoluirá com o projeto)

---

## 🔄 Atualizações Futuras

Este protocolo será revisado:
- Após cada incident em produção
- Mensalmente com team
- Sempre que uma fase falhar repetidamente
