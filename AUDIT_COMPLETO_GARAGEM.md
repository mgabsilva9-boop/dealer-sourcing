# AUDITORIA COMPLETA: PROJETO GARAGEM (Dealer Sourcing)

**Data:** 2026-04-07  
**Projeto:** Dealer Sourcing MVP  
**Ambiente:** Production (Vercel + Railway + Supabase)  
**Stack:** React/Vite + Express/Node.js + PostgreSQL  
**Status:** MVP NÃO PRONTO PARA PRODUÇÃO

---

## PARTE 1: MAPEAMENTO FUNCIONAL

### FRONTEND (React/Vite)

**Localização:** `/src/frontend/`

**Componentes e Páginas:**
- `App.jsx` (mega-componente: 2500+ linhas) — Toda a UI concentrada aqui
  - Tab 1: Dashboard (KPIs)
  - Tab 2: Estoque (CRUD veículos)
  - Tab 3: Financeiro (P&L)
  - Tab 4: IPVA
  - Tab 5: Gastos
  - Tab 6: CRM
  - Tab 7: Busca IA
  - Tab 8: WhatsApp AI
- `DashboardFinancial.jsx` — Cálculos financeiros
- `VehicleForm` — Formulário de novo veículo
- `SourcingList.jsx` — Lista de leads IA
- `api.js` — Cliente HTTP

### BACKEND (Express/Node.js)

**Localização:** `/src/routes/`

**Endpoints (12 arquivos, ~60 rotas):**
- `auth.js` — Login, register, token (JWT)
- `inventory.js` — CRUD veículos + status pipeline (6 endpoints)
- `financial.js` — P&L, cálculos (4 endpoints)
- `expenses.js` — CRUD despesas (5 endpoints)
- `ipva.js` — Cálculo IPVA (4 endpoints)
- `crm.js` — CRUD clientes (4 endpoints)
- `sourcing.js` — Leads IA mockados (2 endpoints)
- `vehicles.js` — Legado, duplicado com inventory.js
- `search.js` — Busca global
- `metrics.js` — KPIs
- `cache.js` — Redis (não implementado)
- `history.js` — Auditoria/histórico

**Middleware:**
- `auth.js` — JWT validation + dealership_id extraction
- `errorHandler.js` — Error handler global

### DATABASE (PostgreSQL via Supabase)

**Tabelas principais:**
1. `users` — Autenticação + roles
2. `dealerships` — Master de lojas
3. `inventory` — Veículos (26296 bytes, linhas complexas)
4. `vehicle_costs` — Custos por veículo (detalhado)
5. `expenses` — Despesas gerais
6. `crm_contacts` — Clientes
7. `ipva_records` — IPVA com vencimentos
8. `financial_summary` — P&L precalculado
9. `audit_log` — Histórico de alterações

---

## PARTE 2: 4 PROBLEMAS CRÍTICOS CONFIRMADOS

### PROBLEMA CRÍTICO #1: Dashboard Financeiro Não Atualiza em Tempo Real

**Arquivo:** `/src/frontend/pages/DashboardFinancial.jsx` (linhas 13-59)

**Root Cause:**
```jsx
useEffect(() => {
  loadData();
}, []);  // ❌ Dependência vazia = executa APENAS no mount
```

**Impacto:**
- Usuário adiciona novo carro com preço R$100K
- Dashboard mostra "Custos Gerais" = R$0 (não muda)
- P&L não atualiza
- Só atualiza após F5 (refresh manual)
- Usuário toma decisões com dados até 5 min atrasados

**Severidade:** CRÍTICO (bloqueia módulo Financeiro)

---

### PROBLEMA CRÍTICO #2: Criar/Deletar/Editar Gastos Dá Erro

**Arquivos Afetados:**
- Backend: `/src/routes/expenses.js` (linhas 33-65, 106-136, 138-159)
- Frontend: `/src/frontend/App.jsx` (linhas 1490, 1507)

**Root Causes:**

1. **Falta validação explícita de dealership_id:**
```javascript
// Backend - linha 48
INSERT INTO expenses ... VALUES (..., req.user.dealership_id, ...)
// ❌ Se req.user.dealership_id é undefined, query falha silenciosamente
```

2. **Erro genérico 500 sem detalhes:**
```javascript
catch (error) {
  console.error('Erro ao criar despesa:', error);
  res.status(500).json({ error: 'Erro ao criar despesa' }); // ❌ Genérico
}
```

3. **Sem validação de tipo de dados:**
- `amount` pode vir como string, não number
- `date` pode vir vazio ou em formato inválido
- Sem parsing/validação PRÉ-insert

4. **Sem logging estruturado:**
- Impossível debugar em produção
- Erro de database não é reportado ao frontend

**Impacto:**
- Módulo Financeiro completamente não-funcional
- Usuário não consegue registrar despesas
- P&L incompleto e inconsistente
- Auditoria impossível

**Severidade:** CRÍTICO (bloqueia módulo inteiro)

---

### PROBLEMA ALTO #3: Carro Vendido/Reservado Desaparece Após F5

**Arquivo:** `/src/routes/inventory.js` (linhas 502-530, 240-261)

**Root Causes:**

1. **sold_date inicializa como DATE, não TIMESTAMP:**
```javascript
sold_date = CASE
  WHEN $9 = 'sold' AND sold_date IS NULL THEN CURRENT_DATE
  ELSE sold_date
END,
```
- `CURRENT_DATE` retorna apenas data (YYYY-MM-DD)
- Timezone issues ao comparar com timestamps

2. **Query de listagem sem WHERE status:**
```javascript
SELECT ... FROM inventory i
WHERE i.dealership_id = $1  // ❌ Sem filtro de status
GROUP BY i.id
ORDER BY i.created_at DESC
```
- Frontend filtra localmente (JavaScript), não no servidor
- Se dados estão inconsistentes no server, UI refletirá

3. **Sem índice composto (dealership_id, status):**
- Table scan em produção com muitos registros
- Possível timeout ou resultados inconsistentes

4. **Frontend filtra no cliente:**
```javascript
var activeV = allF.filter(v => v.status !== "sold");
var soldV = allF.filter(v => v.status === "sold");
```
- Se servidor retorna dados com status inconsistente, aparece/desaparece

**Impacto:**
- Vendedor A marca carro como vendido
- Vendedor B vê carro "disponível" após refresh → double-booking
- Operações de estoque confusas
- Perda de venda ou conflict de vendedores

**Severidade:** ALTO (double-booking)

---

### PROBLEMA ALTO #4: Edições Dão Erro (Carro/Cliente/Gasto)

**Arquivos Afetados:**
- Backend: `/src/routes/inventory.js` (linhas 502-580)
- Frontend: `/src/frontend/App.jsx` (linhas 681, 657-701)

**Root Causes:**

1. **Sem validação de tipo de dados PRÉ-envio:**
- `year` esperado INTEGER, mas pode vir como string
- `purchasePrice` esperado DECIMAL(15,2), pode ser string inválida
- `mileage` esperado INTEGER, pode ser "abc"

2. **Sem validação de business logic:**
- Permite `purchasePrice > salePrice` (loss-making)
- Sem validação de marca/modelo válidos
- Sem sanitização de strings (XSS risk)

3. **Backend rejeita com erro 500 genérico:**
```javascript
catch (error) {
  console.error('Erro ao atualizar veículo:', error);
  res.status(500).json({ error: 'Erro ao atualizar veículo' }); // ❌ Genérico
}
```

4. **Frontend não valida PRÉ-envio:**
```javascript
const res = await inventoryAPI.update(id, vehicleToSend);
// ❌ Nenhuma validação antes de enviar
```

**Impacto:**
- Usuário não consegue editar informações
- Sempre cria novo ao invés de editar → duplicação
- Dados desatualizados indefinidamente

**Severidade:** ALTO (duplicação de registros)

---

## PARTE 3: INCONSISTÊNCIAS DETECTADAS

### A. Endpoints Órfãos (Backend sem Frontend)

| Endpoint | Status | Observação |
|----------|--------|------------|
| `GET /financial/summary` | ✅ OK | Implementado e chamado |
| `GET /inventory/list` | ⚠️ Parcial | Sem polling automático |
| `POST /inventory/create` vs `POST /inventory/` | ❌ Duplicado | Frontend chama legacy |
| Endpoints de Relatório | ❌ Órfão | Implementados mas UI não existe |

### B. Funcionalidades Órfãs (Frontend sem Backend)

| Feature | Frontend | Backend | % Pronto | Impacto |
|---------|----------|---------|----------|---------|
| WhatsApp AI | ✅ Demo | ❌ Mockado | 5% | MÉDIO |
| Busca IA | ✅ UI mockada | ⚠️ Sem scraper real | 20% | MÉDIO |
| Editar Despesa | ✅ UI existe | ✅ Endpoint existe | 50% | ALTO |
| RLS Multi-tenant | ✅ Visual | ⚠️ Parcialmente | 70% | BAIXO |

### C. Validações Faltando

**Backend (Express):**
```javascript
❌ Sem validação explícita de dealership_id
❌ Sem validação de tipo de dados (parseInt, parseFloat, etc)
❌ Sem validação de date format (YYYY-MM-DD)
❌ Sem sanitização de strings
❌ Mensagens de erro genéricas (não há code específico)
❌ Sem logging estruturado (não há request ID)
```

**Frontend (React):**
```javascript
❌ Validação limitada PRÉ-envio
❌ Sem diferenciação de error types (400 vs 500 vs network)
❌ Try-catch silencioso em alguns formulários
❌ Sem retry logic
```

**Database (PostgreSQL):**
```javascript
❌ Falta índice composto: CREATE INDEX (dealership_id, status)
❌ RLS policies podem estar incompletas
❌ Sem logging de auditoria ativo em todas tabelas
```

### D. Persistência Inconsistente

| Campo | Problema | Impacto | Severidade |
|-------|----------|---------|-----------|
| `inventory.sold_date` | DATE vs TIMESTAMP | Timezone issues | ALTO |
| `expenses.amount` | String não convertida | Cálculos errados | MÉDIO |
| `expenses.date` | Pode ser NULL | INSERT falha | MÉDIO |
| `dealership_id` (todas tabelas) | NULL se JWT ruim | Inserts falham silenciosamente | CRÍTICO |

### E. Error Handling Inadequado

**Padrão em TODOS os endpoints:**
```javascript
catch (error) {
  console.error('Erro genérico:', error);
  res.status(500).json({ error: 'Erro ao fazer algo' });
  // ❌ Retorna status 500 MESMO para erro 400 (validação)
  // ❌ Frontend recebe mensagem genérica sem detalhes
  // ❌ Impossível debugar em produção (sem request ID)
}
```

**Frontend não diferencia tipos de erro:**
```javascript
try {
  await API.create(data);
} catch (err) {
  alert('Erro: ' + err.message); // ❌ Mesmo tratamento para tudo
  // Não diferencia entre:
  //   - 400: Validação falhou
  //   - 401: Autenticação expirou
  //   - 500: Erro no servidor
  //   - Network timeout
}
```

### F. Race Conditions

**Cenário 1: Dois vendedores marcam carro como "vendido" simultaneamente**
```
Vendedor A: PUT /inventory/123 { status: 'sold' }
Vendedor B: PUT /inventory/123 { status: 'sold' }
//
// Sem lock pessimista, última escrita vence
// Ambos acham que marcaram com sucesso
// Double-booking possível
```

**Cenário 2: Dashboard e formulário atualizam estado simultaneamente**
```
User abre Dashboard (estado React local)
User adiciona novo carro em Estoque
Dashboard não vê novo carro (state desincronizado)
// Sem React Query com server-side state, UI fica inconsistente
```

---

## PARTE 4: SEGURANÇA

### CRÍTICO: Sanitização XSS

**Problema:**
```javascript
// /src/routes/inventory.js — strings não sanitizadas
const make = req.body.make; // ❌ Direto para database
const model = req.body.model; // ❌ Sem sanitização
```

**Impacto:** SQL injection possível se validação falhar

### CRÍTICO: Sem Validação CSRF

**Problema:** Nenhum middleware CSRF nos endpoints

### ALTO: Sem Rate Limiting

**Problema:** Sem proteção contra brute force

```javascript
❌ POST /auth/login — bruteforce de senha possível
❌ POST /inventory — spam de inserção possível
```

### ALTO: Validação de CNPJ/CPF

**Arquivo:** `/src/frontend/App.jsx` (CRM)

```javascript
// ❌ Sem validação de CNPJ/CPF
{ id: 1, name: "José", phone: "(16) 99234-5678", email: "jose@email.com", ... }
```

---

## PARTE 5: FUNCIONALIDADES INCOMPLETAS (% de implementação)

| Módulo | % Pronto | Bloqueadores | Estimativa de Fix |
|--------|----------|--------------|------------------|
| **Estoque** | 70% | Status não persiste, edições dão erro | 2-3h |
| **Financeiro** | 50% | Dashboard não atualiza, cálculos OK | 2-4h |
| **Gastos** | 30% | Create funciona com bugs, edit/delete quebrados | 3-5h |
| **IPVA** | 80% | Form já corrigido, cálculos OK | 0h (feito) |
| **CRM** | 50% | Sem integração WhatsApp real | 4-6h |
| **Busca IA** | 20% | Sem scraper real, sem FIPE | 6-8h |
| **WhatsApp AI** | 5% | Apenas UI demo, sem backend IA | 8-12h |
| **Relatórios** | 0% | UI não existe | 3-4h |

---

## PARTE 6: TESTES EXECUTADOS

### TESTE 1: Adicionar Carro + Persistência
**Resultado:** ✅ PASSA (após fix em App.jsx)
- Carro persiste ao F5
- dealership_id agora validado

### TESTE 2: Criar Despesa + Editar + Deletar
**Resultado:** ❌ FALHA
- ✅ Create funciona (mas sem validação)
- ❌ Edit dá erro 500 genérico
- ❌ Delete dá erro 500 genérico

### TESTE 3: Marcar Carro como Vendido + Persistência
**Resultado:** ⚠️ PARCIAL
- Status muda visualmente
- Pode desaparecer ao F5 em alguns casos
- Sem índice composto, inconsistência possível

### TESTE 4: Dashboard P&L Atualiza Automaticamente
**Resultado:** ❌ FALHA
- Requer F5 manual para atualizar
- Sem polling automático

### TESTE 5: Filtros por Status (Vendido/Disponível)
**Resultado:** ⚠️ PARCIAL
- Funciona localmente (JavaScript)
- Dados podem vir inconsistentes do servidor

---

## RESUMO DE IMPACTO

| Severidade | Problema | Módulo | Impacto Negócio | Bloqueador |
|------------|----------|--------|-----------------|-----------|
| CRÍTICO | Dashboard não atualiza | Financeiro | Decisões com dados antigos | SIM |
| CRÍTICO | Gastos dão erro | Financeiro | P&L quebrado, auditoria falha | SIM |
| CRÍTICO | dealership_id undefined | Todos | Inserts falham silenciosamente | SIM |
| ALTO | Carro desaparece ao F5 | Estoque | Double-booking de venda | Workaround: reload |
| ALTO | Edições dão erro | Todos | Duplicação de registros | Workaround: criar novo |
| ALTO | Sem validação PRÉ-envio | Todos | XSS risk | Parcial |
| MÉDIO | Sem logging estruturado | Infra | Impossível debugar produção | — |
| MÉDIO | Sem índices compostos | Database | Performance ruim | — |
| MÉDIO | Funcionalidades 50% prontas | CRM, Sourcing | Expectativas não atendidas | — |

---

## CONCLUSÃO

**MVP NÃO ESTÁ PRONTO PARA PRODUÇÃO**

### Evidências:
- ✅ 4 bugs críticos confirmados
- ✅ 5+ funcionalidades 50% implementadas
- ✅ Validações e error handling inadequados
- ✅ Sem observabilidade/logging estruturado
- ✅ Sem índices de performance
- ✅ Sem testes automatizados

### Estimativas para Correção:

**FASE 1 (Unblock Crítico):** 4-6 horas
- Fix dealership_id validation
- Fix dashboard auto-refetch
- Melhorar error messages

**FASE 2 (Consistência):** 3-5 horas
- Adicionar índice composto
- Validar sold_date persistência
- Implementar validações PRÉ-envio

**FASE 3 (Observabilidade):** 2-3 horas
- Logging estruturado
- Request ID tracking
- Sentry setup

**FASE 4 (Segurança):** 2-3 horas
- Sanitização de strings
- Rate limiting
- CSRF protection

**TOTAL:** 12-16 horas para MVP minimamente funcional

---

## PRÓXIMOS PASSOS RECOMENDADOS

1. **Comunicar ao cliente:** 4 bugs críticos identificados
2. **Executar Phase 1 & 2 fixes** em paralelo (sprint de 1 dia)
3. **Testar cada fix** com checklist específica
4. **Deploy em staging** antes de produção
5. **Implementar observabilidade** (Phase 3) em paralelo
6. **Review de segurança** (Phase 4) antes de go-live

**Data Recomendada para Go-Live:** Após todas as 4 fases (estimado 2-3 dias de trabalho)
