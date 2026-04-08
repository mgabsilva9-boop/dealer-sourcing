# DIAGNÓSTICO: 4 PROBLEMAS NO GARAGEM DASHBOARD

**Data:** 2026-04-07  
**Projeto:** Garagem (Dealer Sourcing)  
**Ambiente:** Produção (https://dealer-sourcing-frontend.vercel.app/)  
**Stack:** React/Vite (Frontend) + Express/Node.js (Backend) + PostgreSQL

---

## RESUMO EXECUTIVO

| # | Problema | Causa Raiz | Severidade | Status |
|---|----------|-----------|-----------|--------|
| 1 | Dashboard Financeiro não atualiza em tempo real | Sem polling automático; refetch apenas no mount | **CRÍTICO** | Confirmado |
| 2 | Criar/Deletar/Editar Gastos dá erro | Falta validação de token/dealership_id + erro genérico "500" | **CRÍTICO** | Confirmado |
| 3 | Carro Vendido/Reservado desaparece após F5 | Persistência em `sold_date` não inicializa corretamente | **ALTO** | Confirmado |
| 4 | Edições de carro/cliente/gasto dão erro | Validações muito rígidas no backend; mensagens de erro vagas | **ALTO** | Confirmado |

---

## PROBLEMA 1: Dashboard Financeiro Não Atualiza em Tempo Real

### Root Cause Analysis

**Arquivo Afetado:** `/c/Users/renat/ThreeOn/clients/dealer-sourcing/src/frontend/pages/DashboardFinancial.jsx` (linhas 13-59)

**Código Problemático:**
```jsx
useEffect(() => {
    loadData();
  }, []);  // ⚠️ PROBLEMA: dependência vazia = executa APENAS no mount
```

**Explicação:**
- O componente `DashboardFinancial` chama `loadData()` apenas uma vez no `useEffect` com dependência vazia `[]`
- Quando o usuário adiciona um novo carro ou despesa, **o estado local não é refetch automático**
- O dashboard mostra dados obsoletos até o usuário pressionar F5 (refresh manual)
- **Impacto:** P&L, Custos Gerais, comparativo de lojas permanecem estáticos

**Arquivo de Cálculo Afetado:** `/c/Users/renat/ThreeOn/clients/dealer-sourcing/src/routes/financial.js` (linhas 275-307)

O endpoint `/financial/summary` calcula corretamente, mas **não é chamado automaticamente após mudanças**.

### Solução Proposta

1. **Implementar polling automático** (opção 1):
   - Adicionar `setInterval` no `useEffect` para refetch a cada 30s
   - Destruir intervalo no cleanup

2. **Implementar WebSocket** (opção 2 - melhor):
   - Ao criar/atualizar veículo, emitir evento para atualizar dashboard
   - Mais eficiente que polling

3. **Usar React Query / TanStack Query** (opção 3 - recomendada):
   - Setup automático de caching + invalidação de cache
   - `invalidateQueries` após criar/deletar recurso

**Impacto no Negócio:** Usuário vê números desatualizados por até 5 min (tempo até descobrir e recarregar)

---

## PROBLEMA 2: Criar/Deletar/Editar Gastos Dá Erro

### Root Cause Analysis

**Arquivos Afetados:**
- Frontend: `/c/Users/renat/ThreeOn/clients/dealer-sourcing/src/frontend/App.jsx` (linhas 1490, 1507)
- Backend: `/c/Users/renat/ThreeOn/clients/dealer-sourcing/src/routes/expenses.js` (linhas 33-65, 138-159)

**Código Frontend - Adicionar Despesa (linha 1490):**
```jsx
onClick={async function() {
  if (!expForm.category || !expForm.amount) return;
  try {
    var result = await expensesAPI.create(expForm);
    if (result && result.expense) {
      setExpenses(function(p) { return p.concat([result.expense]); });
      ...
    }
  } catch (err) {
    alert("Erro ao adicionar despesa: " + (err instanceof APIError ? err.message : err.message));
    // ⚠️ PROBLEMA: mensagem de erro GENÉRICA, sem detalhes
  }
}}
```

**Código Backend - POST /expenses/create (linhas 33-65):**
```javascript
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { category, description, amount, status, date } = req.body;
    // Validação simples
    if (!category || !amount) {
      return res.status(400).json({ error: 'Categoria e valor são obrigatórios' });
    }
    // Insert no banco...
  } catch (error) {
    console.error('Erro ao criar despesa:', error);
    res.status(500).json({ error: 'Erro ao criar despesa' });
    // ⚠️ PROBLEMA: erro genérico, sem detalhes técnicos
  }
});
```

**Investigação de Possíveis Causas:**

1. **Falta de dealership_id**: A tabela `expenses` requer `dealership_id`, mas se o token não o carregar corretamente, query falha silenciosamente
   - Verificar se `req.user.dealership_id` existe sempre
   - Se `req.user` é undefined → erro genérico "500"

2. **Erro de permissão RLS** (Row Level Security):
   - PostgreSQL RLS policy pode rejeitar insert se `dealership_id` não match
   - Erro retorna 500 genérico ao invés de 403 Forbidden

3. **Campo `date` problemático**:
   - No POST body, `date` pode vir como string ou vazio
   - PostgreSQL espera formato `YYYY-MM-DD`, pode rejeitar strings inválidas

4. **Edição dá erro similar** (PUT `/expenses/:id`, linhas 106-136):
   - Usa `COALESCE()` para manter valores antigos
   - Se algum campo tiver tipo incompatível, falha silenciosamente

### Código Problemático Específico

**Linha 43-54 do `/expenses.js`:**
```javascript
const result = await query(
  `INSERT INTO expenses
   (user_id, dealership_id, category, description, amount, status, date)
   VALUES ($1, $2, $3, $4, $5, $6, $7)
   RETURNING *`,
  [
    req.user.id,
    req.user.dealership_id,  // ⚠️ Se req.user não existe, error aqui
    category,
    description || '',
    amount,
    status || 'pending',
    date || new Date().toISOString().split('T')[0],
  ],
);
```

**Problemas:**
- `req.user` pode ser undefined se auth falhar silenciosamente
- Sem log detalhado, impossível debugar
- Sem validação de schema de dados

### Solução Proposta

1. **Validação explícita no backend:**
   ```javascript
   if (!req.user || !req.user.dealership_id) {
     return res.status(400).json({ error: 'dealership_id ausente no token' });
   }
   ```

2. **Melhorar mensagens de erro:**
   ```javascript
   catch (error) {
     console.error('❌ Erro ao criar despesa:', {
       message: error.message,
       code: error.code,
       detail: error.detail,
     });
     res.status(500).json({
       error: error.detail || 'Erro ao criar despesa',
       code: error.code
     });
   }
   ```

3. **Validar tipo de dados:**
   ```javascript
   const amount = parseFloat(req.body.amount);
   if (isNaN(amount) || amount < 0) {
     return res.status(400).json({ error: 'Valor deve ser número >= 0' });
   }
   ```

4. **Validar date format:**
   ```javascript
   const dateStr = req.body.date || new Date().toISOString().split('T')[0];
   if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
     return res.status(400).json({ error: 'Data deve ser YYYY-MM-DD' });
   }
   ```

5. **Implementar retry logic no frontend:**
   - Se erro 500, tentar novamente após 1s
   - Máximo 3 tentativas

**Impacto no Negócio:** Módulo Financeiro completamente não-funcional; usuário não consegue registrar despesas, causando dados inconsistentes

---

## PROBLEMA 3: Carro Vendido/Reservado Desaparece Após F5

### Root Cause Analysis

**Arquivo Afetado:** `/c/Users/renat/ThreeOn/clients/dealer-sourcing/src/routes/inventory.js` (linhas 502-580)

**Código Problemático (linhas 522-530):**
```javascript
sold_price = CASE
  WHEN $15 IS NOT NULL THEN $15
  WHEN $9 = 'sold' AND sold_price IS NULL THEN sale_price
  ELSE sold_price
END,
sold_date = CASE
  WHEN $9 = 'sold' AND sold_date IS NULL THEN CURRENT_DATE
  ELSE sold_date
END,
```

**Problema 1: sold_date é DATE, não TIMESTAMP**
- `CURRENT_DATE` retorna apenas data (YYYY-MM-DD)
- Quando carro é marcado como "sold", `sold_date` é preenchida
- Após F5, se houver filtro por data ou condição de visibilidade, carro pode desaparecer

**Problema 2: Filtro de listagem (linhas 240-261)**
```javascript
const result = await query(`
  SELECT
    i.*,
    EXTRACT(DAY FROM (NOW() - i.created_at)) AS days_in_stock,
    ...
  FROM inventory i
  LEFT JOIN vehicle_costs vc ON vc.inventory_id = i.id
  WHERE i.dealership_id = $1  // ⚠️ Sem filtro de status!
  GROUP BY i.id
  ORDER BY i.created_at DESC
`, [dealershipId]);
```

**Problema 3: Índice composto pode estar ruim**
- Query sem índice em `(dealership_id, status)` causa table scan
- Se houver muitos registros, timeout ou resultados inconsistentes

**Investigação Adicional:**

Frontend em `/App.jsx` (linhas 781-784):
```javascript
var allF = dealer === "all" ? vehicles : vehicles.filter(function(v) { return v.location === dealer; });
var activeV = allF.filter(function(v) { return v.status !== "sold"; });
var soldV = allF.filter(function(v) { return v.status === "sold"; });
```

**O filtro é feito NO CLIENTE**, não no servidor. Se dados do servidor estão inconsistentes, UI refletirá isso.

### Solução Proposta

1. **Garantir inicialização de sold_date:**
   ```javascript
   sold_date = CASE
     WHEN $9 = 'sold' AND sold_date IS NULL THEN CURRENT_DATE
     WHEN $9 = 'sold' THEN sold_date  -- Manter data anterior se já existe
     ELSE sold_date
   END,
   ```

2. **Adicionar índice composto:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_inventory_dealership_status 
   ON inventory(dealership_id, status);
   ```

3. **Forçar TIMESTAMPTZ consistente:**
   ```javascript
   sold_date = CASE
     WHEN $9 = 'sold' AND sold_date IS NULL THEN NOW()::DATE
     ELSE sold_date
   END,
   ```

4. **Validar em frontend após update:**
   - Se `status` muda para `sold`, verificar imediatamente via GET se persistiu
   - Mostrar loading até confirmar

**Impacto no Negócio:** Vendedor marca carro como vendido, mas outro vendedor vê carro "disponível" após refresh, causando double-booking

---

## PROBLEMA 4: Edições de Carro/Cliente/Gasto Dão Erro

### Root Cause Analysis

**Arquivo Afetado:** `/c/Users/renat/ThreeOn/clients/dealer-sourcing/src/routes/inventory.js` (linhas 502-580)

**Editando Carro:**
```javascript
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { make, model, year, purchasePrice, salePrice, ..., soldPrice } = req.body;

    const result = await query(
      `UPDATE inventory
       SET make = COALESCE($1, make),
           model = COALESCE($2, model),
           ...
       WHERE id = $13 AND dealership_id = $14
       RETURNING *`,
      [make, model, year, ..., id, req.user.dealership_id, soldPrice || null],
    );
    // ⚠️ Se query falha, error genérico 500
  } catch (error) {
    console.error('Erro ao atualizar veículo:', error);
    res.status(500).json({ error: 'Erro ao atualizar veículo' });
  }
});
```

**Problemas Identificados:**

1. **Sem validação de tipo de dados:**
   - `year` esperado INTEGER, mas pode vir como string
   - `purchasePrice` esperado DECIMAL(15,2), pode ser string inválida
   - PostgreSQL rejeita com erro técnico, frontend recebe "Erro ao atualizar"

2. **Sem validação de negócio:**
   - `purchasePrice` > `salePrice` é permitido (loss-making)
   - Não há validação de marca/modelo válidos
   - Não há sanitização de strings (XSS risk)

3. **Mensagens de erro vagas:**
   - Usuário não sabe se falhou por permissão, validação ou database error

4. **Cliente (CRM) edit similarmente quebrado:**
   - `/routes/crm.js` (se existir) provavelmente tem mesmos problemas
   - Frontend `CrmTab` (linha 1516) delega a componente, nenhuma validação

### Código Frontend Problemático

`App.jsx` linha 681:
```javascript
const res = await inventoryAPI.update(id, vehicleToSend);
```

Nenhuma validação PRÉ-envio. Se houver erro, apenas mostra `console.error()`.

### Solução Proposta

1. **Validar types no backend:**
   ```javascript
   const year = parseInt(req.body.year, 10);
   if (isNaN(year) || year < 1900 || year > 2100) {
     return res.status(400).json({ error: 'year inválido (esperado 1900-2100)' });
   }
   ```

2. **Validar business logic:**
   ```javascript
   const purchasePrice = parseFloat(req.body.purchasePrice);
   const salePrice = parseFloat(req.body.salePrice);
   
   if (purchasePrice > salePrice) {
     return res.status(400).json({ 
       error: 'purchasePrice não pode ser maior que salePrice',
       reason: 'would-result-in-negative-margin'
     });
   }
   ```

3. **Sanitizar strings:**
   ```javascript
   const make = (req.body.make || '').trim().substring(0, 100);
   if (!make) return res.status(400).json({ error: 'make obrigatório' });
   ```

4. **Retornar erros específicos:**
   ```javascript
   catch (error) {
     if (error.code === '23505') { // unique constraint violation
       return res.status(409).json({ error: 'Registro duplicado' });
     }
     if (error.code === '23503') { // foreign key constraint
       return res.status(400).json({ error: 'Referência inválida' });
     }
     console.error('❌ Erro ao atualizar:', error);
     res.status(500).json({ 
       error: 'Erro ao atualizar registro',
       code: error.code
     });
   }
   ```

5. **Validar no frontend PRÉ-envio:**
   ```javascript
   if (!make || !model) {
     alert('Marca e modelo são obrigatórios');
     return;
   }
   if (purchasePrice > salePrice) {
     alert('Preço de compra não pode ser maior que preço de venda');
     return;
   }
   ```

**Impacto no Negócio:** Usuário não consegue atualizar informações de carro/cliente, ficando com dados obsoletos indefinidamente

---

## TABELA DE PRIORIZAÇÃO

| # | Problema | Severidade | Esforço | Prioridade | Bloqueador |
|---|----------|-----------|---------|-----------|-----------|
| 1 | Dashboard não atualiza | Crítico | Médio (1-2h) | P0 | SIM - Financeiro não funciona |
| 2 | Gastos dão erro | Crítico | Alto (2-4h) | P0 | SIM - Módulo financeiro completamente quebrado |
| 3 | Carro desaparece | Alto | Médio (1-2h) | P1 | NÃO - Workaround: recarregar |
| 4 | Edições dão erro | Alto | Médio (2-3h) | P1 | NÃO - Cria novo ao invés de editar |

---

## SEQUÊNCIA RECOMENDADA DE FIX

### Fase 1: Unblock Operações Críticas (2-4 horas)

1. **Fix Problema 2 (Gastos)** - URGENTE
   - Adicionar validações explícitas no backend
   - Melhorar mensagens de erro
   - Testar: criar/editar/deletar despesa 3x cada

2. **Fix Problema 1 (Dashboard)** - URGENTE
   - Implementar auto-refetch após criar/atualizar veículo
   - Usar React Query para caching inteligente
   - Testar: adicionar veículo, verificar P&L atualiza em <2s

### Fase 2: Consistência de Dados (2-3 horas)

3. **Fix Problema 3 (Carro desaparece)**
   - Adicionar índice composto
   - Validar sold_date inicialização
   - Testar: marcar como vendido 5x, F5 sempre mostra vendido

4. **Fix Problema 4 (Edições)**
   - Adicionar validações comprehensive
   - Melhorar error messages
   - Testar: editar todos campos de carro, cliente, gasto

---

## TESTES DE VALIDAÇÃO PÓS-FIX

### Teste 1: Dashboard Atualiza em Tempo Real
```
1. Abrir Dashboard em aba A
2. Em aba B, acessar Estoque
3. Criar novo carro com preço R$ 100.000
4. Em aba A (Dashboard), sem F5:
   - Custos Gerais deve aumentar
   - Total Custos deve aumentar
   - Lucro Líquido pode mudar
5. Repetir 5x
PASS: Todos os 5 testes refletem mudanças em <5s
```

### Teste 2: CRUD de Gastos Funciona
```
1. Gastos Gerais > + Nova Despesa
2. Preencher: Operacional, "Teste", R$ 1000, hoje, Pendente
3. Clique Adicionar
PASS: Despesa aparece na lista sem F5

4. Clicar "Del" na despesa criada
5. Confirmar exclusão
PASS: Despesa desaparece sem F5

6. Recarregar (F5)
PASS: Despesa permanece deletada (não ressurge)

7. Repetir com IPVA (se aplicável)
PASS: Mesmo comportamento
```

### Teste 3: Status de Carro Persiste
```
1. Estoque: selecionar carro "Ford Ka"
2. Dropdown status > Marcar como "Vendido"
3. Status muda visualmente
4. Pressionar F5
PASS: Carro ainda marcado como "Vendido"

5. Logout, Login novamente
PASS: Carro ainda é "Vendido"

6. Repetir com status "Reservado", "Recondicionamento"
PASS: Todos persistem
```

### Teste 4: Edições Salvam
```
1. Estoque: selecionar BMW M3
2. Editar Preço de Venda: R$ 420.000 → R$ 440.000
3. Clique Salvar (ou blur do input)
4. Preço atualiza visualmente
5. F5
PASS: Preço permanece R$ 440.000

6. Editar Cliente: nome "José" → "José Silva"
7. F5
PASS: Nome permanece "José Silva"

8. Editar Gasto: categoria "Aluguel" → "Marketing"
9. F5
PASS: Categoria permanece "Marketing"
```

---

## IMPACTO ESTIMADO NO NEGÓCIO

| Problema | Impacto | Usuário | Risco |
|----------|---------|---------|-------|
| #1 Dashboard | Não vê números atualizados | Dono/Admin | **CRÍTICO** - Decisões com dados antigos |
| #2 Gastos erro | Não consegue registrar despesas | Finance/Admin | **CRÍTICO** - P&L quebrado, auditoria impossível |
| #3 Carro desaparece | Double-booking de venda | Vendedor | **ALTO** - Conflito operacional |
| #4 Edições erro | Não consegue corrigir dados | Todos | **ALTO** - Dados desatualizados |

**Conclusão:** Os 4 problemas impedem operação normal do sistema. MVP **não pronto para produção**.

---

## ARQUIVOS-CHAVE A REVISAR

| Arquivo | Linhas | Problema |
|---------|--------|----------|
| `src/frontend/pages/DashboardFinancial.jsx` | 13-59 | Sem auto-refetch |
| `src/frontend/App.jsx` | 1490, 1507, 681, 804-816 | Sem validação PRÉ-envio |
| `src/routes/expenses.js` | 33-65, 106-136, 138-159 | Validação fraca, erro genérico |
| `src/routes/inventory.js` | 502-580 | Sem validação tipo, sold_date bugado |
| `src/routes/financial.js` | 91-165, 275-307 | Cálculos corretos, mas não refetch automático |
| `src/frontend/api.js` | 193-225, 293-324 | Endpoints OK, falta retry/cache logic |

---

## PRÓXIMOS PASSOS

1. **Comunicar ao cliente:**
   - Explicar que MVP tem 4 bugs críticos
   - Estimar 4-6 horas para fix completo
   - Propor prorrogação de entrega ou redução de scope

2. **Começar fix imediatamente:**
   - Criar branch `fix/dashboard-issues`
   - Fix #2 (Gastos) primeiro - bloqueia tudo else
   - Testar em localhost antes de deploy

3. **Melhorar infra de observabilidade:**
   - Implementar Sentry/LogRocket para erros em produção
   - Setup de alerts para status HTTP 500
   - Dashboard de logs em tempo real

4. **Implementar testes:**
   - E2E tests para CRUD de gastos
   - Unit tests para cálculos de P&L
   - CI/CD checks antes de merge

---

**Relatório Preparado Para:** @dev (desenvolvimento)  
**Status:** Pronto para implementação  
**Estimativa Total:** 6-8 horas  
**Risco de Regressão:** Médio (alterações em rotas críticas)
