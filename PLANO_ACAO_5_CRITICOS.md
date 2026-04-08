# 🎯 PLANO DE AÇÃO — 5 Bugs Críticos + Login Delay

**Data:** 8 Abril 2026  
**Status:** Testado em produção ✅ | Defeitos encontrados: 5 críticos + 1 bug de login  
**Protocolo:** PROTOCOLO_DESENVOLVIMENTO.md (4 fases obrigatórias)  
**Execução:** Agentes (Dev, QA, DevOps em paralelo)  
**Timeline:** ~18h de trabalho estruturado (2-3 dias)

---

## 📋 RESUMO DOS 5 CRÍTICOS

| # | Problema | Root Cause | Solução | Tempo |
|---|----------|-----------|---------|-------|
| **1** | IPVA tela branca | Console error ou query falhando | Debugar + fix | 2h |
| **2** | Performance devagar | N+1 queries ou state não otimizado | Profile + otimizar | 4h |
| **3** | Kanban status falha | Event handler quebrado ou sem endpoint | Fix onClick handler | 3h |
| **4** | Multi-tenant misturado | RLS não aplicado em todas abas | Auditar + adicionar WHERE | 4h |
| **5** | Clientes não editáveis | Sem endpoints PATCH/PUT | CRUD completo | 5h |
| **BONUS** | Login delay/buga | Async race condition na sessão | Fix useEffect dependencies | 2h |

**TOTAL: ~20h**

---

## 🔍 INVESTIGAÇÃO DETALHADA

### CRÍTICO #1: IPVA Tela Branca

**Descrição do Problema:**
```
Usuário clica em aba "IPVA"
→ Tela fica branca (sem erro visível)
→ Nada renderiza
```

**Possíveis Causas (em ordem de probabilidade):**

a) **Console Error** (90% chance)
   - JavaScript exception em componente IPVA
   - Solução: F12 DevTools → Console → ver erro

b) **Query Falhando** (5% chance)
   - GET /ipva/list retorna erro 500
   - Solução: Network tab → ver response

c) **Dados Malformados** (5% chance)
   - API retorna JSON inválido
   - Solução: Parse error

**Plano de Investigação (Dev Agent):**
1. Abrir frontend em produção
2. F12 → Console
3. Clicar em IPVA
4. Ver erro exato
5. Rastrear em código:
   - `src/frontend/components/` → procurar IPVA component
   - `src/frontend/App.jsx` → procurar useEffect que carrega IPVA
   - `src/routes/ipva.js` → verificar query

**Solução Esperada:**
- Fix console error (ex: undefined variable)
- Ou fix query (ex: coluna não existe)
- Ou fix data parsing (ex: JSON mal formado)

**Teste (QA):**
- Clicar IPVA em produção
- Deve carregar 6 registros visíveis
- Sem console errors
- Performance <2s

---

### CRÍTICO #2: Performance Devagar

**Descrição do Problema:**
```
Sistema está "lento demais"
- Clicar em coisa demora
- Salvar demora
- Entrar demora
- Sair demora
- Tudo demora
```

**Possíveis Causas:**

a) **N+1 Queries** (60% chance)
   - Frontend faz 1 request → API faz 10 queries
   - Cada query aguarda a anterior
   - Solução: Otimizar backend queries (indexes, joins)

b) **State Não Otimizado** (20% chance)
   - React re-renderiza tudo a cada mudança
   - Solução: useMemo, useCallback, React.memo

c) **Bundle Size Grande** (10% chance)
   - JavaScript muito grande (257KB gzip)
   - Solução: Code splitting, lazy loading

d) **Database Lenta** (10% chance)
   - Supabase em hora de pico
   - Solução: Query optimization, índices

**Plano de Investigação (Dev Agent):**
1. Usar DevTools → Network tab
2. Clicar em ação (ex: carregar estoque)
3. Medir:
   - Tempo da request (esperado: <300ms)
   - Número de requests (esperado: 1-2)
4. Ver se há requests duplicadas ou paralelas inúteis
5. Ver database logs em Supabase

**Solução Esperada:**
- Remover duplicadas/inúteis
- Adicionar índices no banco
- Usar SELECT * mais específico (não trazer colunas inúteis)
- Otimizar React (useMemo para listas grandes)

**Teste (QA):**
- Benchmark antes/depois
- Esperado: <1s para carregar estoque (antes: muito mais)
- <2s para criar veículo
- <1s para mudar status

---

### CRÍTICO #3: Kanban Status Não Funciona

**Descrição do Problema:**
```
Usuário arrasta veículo no Kanban (coluna "Disponível" → "Vendido")
→ Nada acontece
→ Veículo volta para posição original
→ Status não muda

MAS: Se clicar no veículo → modal → mudar status → funciona OK
```

**Diagnóstico:**
- Status via clique em veículo: ✅ FUNCIONA (modal com PUT endpoint)
- Status via Kanban drag-drop: ❌ NÃO FUNCIONA (precisa de handler diferente)

**Possíveis Causas:**

a) **onClick Handler Ausente** (80% chance)
   - Kanban tem drag event listeners
   - Mas não faz PUT request ao soltar
   - Solução: Adicionar onDrop handler

b) **Endpoint Diferente** (10% chance)
   - Modal usa PUT /inventory/:id (funciona)
   - Kanban tenta POST /inventory/:id/status (não existe)
   - Solução: Usar mesmo endpoint

c) **State Não Sincroniza** (10% chance)
   - Kanban local state diferente de App.jsx state
   - Solução: State management unificado

**Plano de Investigação (Dev Agent):**
1. Procurar Kanban component: `src/frontend/components/*kanban*`
2. Procurar por `onDrop`, `onDragEnd`, `onDragOver`
3. Ver se existe handler que faz PUT request
4. Se não existir → criar
5. Testar: arrastar + soltar → verificar Network tab se PUT foi feito

**Solução Esperada:**
```javascript
// Quando solta no Kanban:
async function handleStatusChange(vehicleId, newStatus) {
  // Chama MESMO endpoint que modal usa:
  const response = await fetch(`/inventory/${vehicleId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: newStatus })
  });
  // Atualiza state App.jsx
  setVehicles(...);
}
```

**Teste (QA):**
- Kanban: arrastar de "Disponível" para "Vendido"
- Deve fazer PUT request (Network tab)
- Deve retornar 200
- Veículo deve mudar de cor/coluna
- Financeiro deve atualizar (se vendido → aparece em faturamento)

---

### CRÍTICO #4: Multi-tenant Não Separa Dados

**Descrição do Problema:**
```
Cliente quer dividir por: Todas / Loja A / Loja B
BrossMotors / BMotors

Atualmente:
✅ Estoque filtra por loja (funciona)
❌ Gastos não filtra (vê tudo)
❌ Clientes não filtra (vê tudo)
❌ Faturamento não filtra (vê tudo)
❌ IPVA não filtra (vê tudo)
❌ Financeiro não filtra (vê tudo)

RISCO DE SEGURANÇA: Gerente Loja A vê dados Loja B
```

**Diagnóstico:**
- RLS existe em Supabase (row-level security)
- Mas NÃO está aplicado em todas as abas
- Queries precisam de `WHERE dealership_id = $1`

**Possíveis Causas:**

a) **Queries Sem WHERE Dealership** (100% chance)
   - `SELECT * FROM expenses` (retorna tudo)
   - Deveria ser: `SELECT * FROM expenses WHERE dealership_id = $1`
   - Mesma coisa em: customers, ipva, financial_transactions, etc

b) **Frontend Não Filtra** (20% chance extra)
   - API retorna tudo, frontend não filtra
   - Solução: Backend OBRIGATÓRIO aplicar WHERE

**Plano de Investigação (CTO Agent — Segurança):**
1. Procurar todas queries em `src/routes/`:
   - `expenses.js` → SELECT * FROM expenses
   - `customers.js` → SELECT * FROM customers
   - `ipva.js` → SELECT * FROM ipva
   - `financial.js` → SELECT * FROM financial_*
   - `auth.js` → verificar dealership_id no JWT

2. Para cada arquivo, verificar:
   - Tem WHERE dealership_id = $1?
   - Tem dealershipFilter buildado?
   - dealershipFilter está sendo APLICADO na query?

3. Verificar JWT:
   - Token inclui dealership_id?
   - req.user.dealership_id está sendo passado?

**Solução Esperada:**
```javascript
// ANTES (errado):
router.get('/expenses', authMiddleware, async (req, res) => {
  const result = await query('SELECT * FROM expenses');
  // ❌ Retorna TUDO
});

// DEPOIS (certo):
router.get('/expenses', authMiddleware, async (req, res) => {
  const dealership_id = req.user.dealership_id;
  const result = await query(
    'SELECT * FROM expenses WHERE dealership_id = $1',
    [dealership_id]
  );
  // ✅ Retorna só desta loja
});
```

**Teste (QA — Segurança):**
1. Login com Loja A
2. Criar gastos em Loja A
3. Logout
4. Login com Loja B
5. Verificar: NÃO vê gastos de Loja A ✅
6. Repetir para: Clientes, IPVA, Faturamento, Financeiro

---

### CRÍTICO #5: Clientes Não Editáveis

**Descrição do Problema:**
```
Usuário quer editar cliente existente:
- Trocar telefone
- Trocar email
- Trocar preferência de contato
- Trocar notas

MAS: Sistema não permite (sem botão Editar ou PATCH endpoint)
```

**Diagnóstico:**
- Clientes só têm CREATE (POST)
- Faltam: READ (GET), UPDATE (PATCH), DELETE (DELETE)

**Possíveis Causas:**

a) **Falta PATCH Endpoint** (100% chance)
   - Não existe: `PATCH /customers/:id`
   - Solução: Implementar

b) **Frontend Sem Modal de Edição** (100% chance)
   - Não existe componente para editar
   - Solução: Reutilizar modal de criar

**Plano de Implementação (Dev Agent):**

**Passo 1: Backend — Adicionar PATCH /customers/:id**
```javascript
router.patch('/customers/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, notes, contact_pref } = req.body;
  const dealership_id = req.user.dealership_id;

  // Validar
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: 'email_invalid' });
  }

  // Update
  const result = await query(
    `UPDATE customers 
     SET name = COALESCE($2, name),
         phone = COALESCE($3, phone),
         email = COALESCE($4, email),
         notes = COALESCE($5, notes),
         contact_pref = COALESCE($6, contact_pref),
         updated_at = NOW()
     WHERE id = $1 AND dealership_id = $7
     RETURNING *`,
    [id, name, phone, email, notes, contact_pref, dealership_id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'customer_not_found' });
  }

  res.json(result.rows[0]);
});
```

**Passo 2: Backend — Adicionar GET /customers/:id**
```javascript
router.get('/customers/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const dealership_id = req.user.dealership_id;

  const result = await query(
    'SELECT * FROM customers WHERE id = $1 AND dealership_id = $2',
    [id, dealership_id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'customer_not_found' });
  }

  res.json(result.rows[0]);
});
```

**Passo 3: Frontend — Adicionar Modal Editar**
- Reutilizar componente de criar
- Adicionar botão "Editar" em cada customer card
- Prefill dados existentes
- Fazer PATCH ao salvar

**Teste (QA):**
1. Criar cliente "João Silva"
2. Clicar "Editar"
3. Trocar telefone → "123456789"
4. Salvar
5. Verificar: telefone foi atualizado ✅
6. Reload página → dados persistem ✅

---

### BONUS: Login Delay/Buga

**Descrição do Problema:**
```
Login às vezes fica bugado
- Entra, sai, atualiza F5
- Estado fica inconsistente
- Às vezes pede login de novo mesmo logado
- Às vezes não pede login mesmo deslogado
```

**Diagnóstico:**
- Race condition em useEffect de sessão
- Multiple useEffects disparando ao mesmo tempo
- localStorage vs state dessincronizados

**Possível Causa:**

a) **useEffect Race Condition** (80% chance)
   - useEffect que restaura sessão dispara múltiplas vezes
   - useEffect que checa token válido dispara múltiplas vezes
   - Ambos atualizam state simultaneamente
   - Resultado: estado inconsistente

**Solução:**
```javascript
// ANTES (problema):
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    setUser({ token }); // ← Dispara re-render
    fetchUser(token).then(setUser); // ← Dispara de novo
  }
}, []) // ← Pode disparar múltiplas vezes em Strict Mode

// DEPOIS (certo):
useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) return;

  let isMounted = true; // Cleanup race condition
  
  fetchUser(token).then(user => {
    if (isMounted) setUser(user);
  });

  return () => { isMounted = false; };
}, [])
```

**Teste (QA):**
1. Login
2. F5 (refresh)
3. Deve manter logged in
4. Clicar "Sair"
5. Deve ir para login
6. Recarregar
7. Deve estar em login (token removido)
8. Repetir 10x → sem bugs

---

## 📅 CRONOGRAMA PROPOSTO

### FASE 1: Investigação (4h — Dev Agent)
```
2h: Debugar IPVA (console error)
2h: Profile performance (Network tab, DevTools)
```

### FASE 2: Desenvolvimento (14h — Dev Agent)
```
2h:  Fix IPVA
3h:  Fix Kanban (adicionar onClick handler)
2h:  Fix Login delay (useEffect cleanup)
4h:  Multi-tenant audit + fixes (RLS em todas abas)
5h:  Clientes CRUD (GET, PATCH, DELETE endpoints + modal)
```

### FASE 3: Testes (3h — QA Agent)
```
1h: Smoke tests (todos endpoints)
1h: Functional tests (cliente real no browser)
1h: Regression (não quebramos nada)
```

### FASE 4: Deploy + Validation (1h — DevOps)
```
Commit + push
Auto-deploy Vercel/Railway
Smoke tests produção
```

**TOTAL: 18h** (2-3 dias com agentes em paralelo)

---

## 🎯 Execução com Agentes

### SQUAD SETUP

**Dev Agent:**
- Investigar + Implementar (FASES 1 e 2)
- Arquivos a focar:
  - `src/frontend/App.jsx` (performance, login delay)
  - `src/frontend/components/*` (IPVA component, Kanban)
  - `src/routes/*.js` (multi-tenant fixes, CRUD endpoints)

**QA Agent:**
- Testar após cada fix (FASE 3)
- Functional tests em produção
- Regression tests

**DevOps Agent:**
- Deploy e monitoring (FASE 4)
- Smoke tests pós-deploy

---

## 📌 CHECKLIST PRÉ-EXECUÇÃO

- [ ] Esse plano faz sentido para você?
- [ ] Quer que eu comece com agentes agora?
- [ ] Qual agente começa primeiro? (sugestão: Dev investigation)
- [ ] Você quer acompanhar em tempo real ou só o resultado final?

---

## 🎓 Standard para Próximos Projetos

Isso que estamos fazendo AGORA deveria ser padrão:

1. Smoke tests (backend APIs)
2. Functional tests (frontend real)
3. Plano estruturado (root cause analysis)
4. Agentes executando em paralelo
5. QA + DevOps validando

Nenhum projeto sai sem passar por isso.

---

**Próximo Passo:** Quer que eu lance os agentes AGORA?
