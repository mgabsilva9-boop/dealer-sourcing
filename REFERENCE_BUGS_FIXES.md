# REFERÊNCIA TÉCNICA: BUGS + FIXES (Quick Reference)

**Data:** 2026-04-07  
**Propósito:** Quick reference para implementar os 4 fixes críticos

---

## BUG #1: Gastos Não Salvam (expenses.js)

### Localização
`/src/routes/expenses.js` linhas 33-65, 106-136, 138-159

### Código Problemático
```javascript
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { category, description, amount, status, date } = req.body;

    if (!category || !amount) {
      return res.status(400).json({ error: 'Categoria e valor são obrigatórios' });
    }

    const result = await query(
      `INSERT INTO expenses
       (user_id, dealership_id, category, description, amount, status, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.id,
        req.user.dealership_id,  // ❌ PODE SER UNDEFINED
        category,
        description || '',
        amount,  // ❌ PODE SER STRING
        status || 'pending',
        date || new Date().toISOString().split('T')[0],  // ❌ PODE SER VAZIO
      ],
    );

    res.status(201).json({
      message: 'Despesa criada com sucesso',
      expense: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao criar despesa:', error);
    res.status(500).json({ error: 'Erro ao criar despesa' });  // ❌ GENÉRICO
  }
});
```

### Solução Recomendada
```javascript
router.post('/create', authMiddleware, async (req, res) => {
  try {
    // ✅ 1. VALIDAR TOKEN
    if (!req.user || !req.user.dealership_id) {
      return res.status(400).json({ 
        error: 'dealership_id ausente no token',
        code: 'MISSING_DEALERSHIP_ID'
      });
    }

    const { category, description, amount, status, date } = req.body;

    // ✅ 2. VALIDAR CATEGORIA
    if (!category || category.trim() === '') {
      return res.status(400).json({ 
        error: 'Categoria é obrigatória',
        code: 'MISSING_CATEGORY'
      });
    }

    // ✅ 3. VALIDAR AMOUNT
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return res.status(400).json({ 
        error: 'Valor deve ser um número >= 0',
        code: 'INVALID_AMOUNT',
        received: { type: typeof amount, value: amount }
      });
    }

    // ✅ 4. VALIDAR DATE FORMAT
    const dateStr = date || new Date().toISOString().split('T')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return res.status(400).json({ 
        error: 'Data deve ser YYYY-MM-DD',
        code: 'INVALID_DATE_FORMAT',
        received: dateStr
      });
    }

    // ✅ 5. SANITIZAR STRINGS
    const catSanitized = category.trim().substring(0, 100);
    const descSanitized = (description || '').trim().substring(0, 500);

    const result = await query(
      `INSERT INTO expenses
       (user_id, dealership_id, category, description, amount, status, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.id,
        req.user.dealership_id,
        catSanitized,
        descSanitized,
        numAmount,
        status || 'pending',
        dateStr,
      ],
    );

    res.status(201).json({
      message: 'Despesa criada com sucesso',
      expense: result.rows[0],
    });
  } catch (error) {
    // ✅ 6. ERRO DETALHADO (não genérico)
    console.error('[expenses.create] Database error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });

    // Diferenciar tipos de erro
    if (error.code === '23505') { // Unique constraint
      return res.status(409).json({ 
        error: 'Registro duplicado',
        code: 'DUPLICATE_ENTRY'
      });
    }
    if (error.code === '23503') { // Foreign key
      return res.status(400).json({ 
        error: 'Referência inválida (user_id ou dealership_id)',
        code: 'INVALID_REFERENCE'
      });
    }

    res.status(500).json({ 
      error: 'Erro ao criar despesa',
      code: 'INTERNAL_SERVER_ERROR',
      requestId: req.id || 'unknown' // Se tiver request ID tracking
    });
  }
});
```

### Teste de Validação
```javascript
// ✅ TESTE 1: Criar despesa válida
POST /expenses/create
{
  "category": "Aluguel",
  "description": "Aluguel do galpão",
  "amount": 3500,
  "date": "2026-04-07",
  "status": "pending"
}
// Esperado: 201 com expense retornado

// ✅ TESTE 2: Amount inválido
POST /expenses/create
{
  "category": "Aluguel",
  "description": "Teste",
  "amount": "abc",  // ❌ String inválida
  "date": "2026-04-07"
}
// Esperado: 400 com "Valor deve ser um número >= 0"

// ✅ TESTE 3: Sem dealership_id no token
// (simular token quebrado)
// Esperado: 400 com "dealership_id ausente no token"

// ✅ TESTE 4: Editar despesa (PUT)
PUT /expenses/123
{
  "amount": 4000
}
// Esperado: 200 com despesa atualizada

// ✅ TESTE 5: Deletar despesa (DELETE)
DELETE /expenses/123
// Esperado: 200 com "Despesa deletada com sucesso"
```

---

## BUG #2: Dashboard Não Atualiza (DashboardFinancial.jsx)

### Localização
`/src/frontend/pages/DashboardFinancial.jsx` linhas 13-59

### Código Problemático
```javascript
function DashboardFinancial({ dealership_id, vehicles }) {
  const [financial, setFinancial] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const summary = await financialAPI.summary(dealership_id);
        setFinancial(summary);
      } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error);
      }
    };
    loadData();
  }, []);  // ❌ DEPENDÊNCIA VAZIA = EXECUTA APENAS NO MOUNT

  return (
    <div>
      <h2>Dashboard Financeiro</h2>
      {financial && (
        <div>
          <p>Custos Gerais: {fmtFull(financial.totalCosts)}</p>
          <p>Receita: {fmtFull(financial.totalRevenue)}</p>
          <p>Lucro Líquido: {fmtFull(financial.netProfit)}</p>
        </div>
      )}
    </div>
  );
}
```

### Solução Recomendada (Opção 1: Polling Simples)
```javascript
function DashboardFinancial({ dealership_id, vehicles }) {
  const [financial, setFinancial] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const summary = await financialAPI.summary(dealership_id);
        setFinancial(summary);
      } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error);
      }
    };

    // ✅ EXECUTAR AGORA
    loadData();

    // ✅ EXECUTAR A CADA 30 SEGUNDOS
    const interval = setInterval(loadData, 30000);

    // ✅ CLEANUP: REMOVER INTERVALO AO DESMONTAR
    return () => clearInterval(interval);
  }, [dealership_id]); // Adicionar dealership_id como dependência

  return (
    <div>
      <h2>Dashboard Financeiro</h2>
      {financial && (
        <div>
          <p>Custos Gerais: {fmtFull(financial.totalCosts)}</p>
          <p>Receita: {fmtFull(financial.totalRevenue)}</p>
          <p>Lucro Líquido: {fmtFull(financial.netProfit)}</p>
          <small style={{ color: '#999', fontSize: '11px' }}>
            Última atualização: {new Date().toLocaleTimeString('pt-BR')}
          </small>
        </div>
      )}
    </div>
  );
}
```

### Solução Recomendada (Opção 2: Event-Driven)
```javascript
// Em App.jsx, ao criar novo veículo:
try {
  const result = await inventoryAPI.create(vehicleData);
  // ✅ DISPARAR EVENTO para atualizar dashboard
  window.dispatchEvent(new CustomEvent('vehicleAdded', {
    detail: { vehicle: result.vehicle }
  }));
} catch (error) {
  console.error('Erro:', error);
}

// Em DashboardFinancial.jsx:
function DashboardFinancial({ dealership_id, vehicles }) {
  const [financial, setFinancial] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const summary = await financialAPI.summary(dealership_id);
      setFinancial(summary);
    };

    loadData(); // Primeira execução

    // ✅ LISTENER: Atualizar quando evento é disparado
    const handleVehicleAdded = () => {
      console.log('[Dashboard] Veículo adicionado, atualizando...');
      loadData();
    };

    window.addEventListener('vehicleAdded', handleVehicleAdded);

    // Cleanup
    return () => {
      window.removeEventListener('vehicleAdded', handleVehicleAdded);
    };
  }, [dealership_id]);

  // ... resto do componente
}
```

### Teste de Validação
```javascript
// ✅ TESTE 1: Dashboard atualiza sem F5
// 1. Abrir Dashboard em aba A
// 2. Em aba B, acessar Estoque
// 3. Criar novo carro com salePrice = R$ 100.000
// 4. Voltar para aba A (Dashboard)
// 5. Sem pressionar F5, aguardar <30s
// ESPERADO: Total Custos e P&L atualizam automaticamente

// ✅ TESTE 2: Polling funciona a cada 30s
// 1. Abrir Dashboard
// 2. Anotar hora inicial
// 3. Adicionar carro em outro tab
// 4. Cronometrar quando atualiza no Dashboard
// ESPERADO: Atualiza em <30s
```

---

## BUG #3: Carro Vendido Desaparece (inventory.js)

### Localização
`/src/routes/inventory.js` linhas 502-530 (UPDATE), linhas 240-261 (SELECT)

### Código Problemático
```javascript
// UPDATE: Marca como vendido
const result = await query(`
  UPDATE inventory
  SET status = $9,
      sold_price = CASE
        WHEN $15 IS NOT NULL THEN $15
        WHEN $9 = 'sold' AND sold_price IS NULL THEN sale_price
        ELSE sold_price
      END,
      sold_date = CASE
        WHEN $9 = 'sold' AND sold_date IS NULL THEN CURRENT_DATE  // ❌ DATE, não TIMESTAMP
        ELSE sold_date
      END,
      ...
  WHERE id = $13 AND dealership_id = $14
  RETURNING *
`, [/* params */]);

// SELECT: Lista veículos (SEM ÍNDICE)
const result = await query(`
  SELECT
    i.*,
    EXTRACT(DAY FROM (NOW() - i.created_at)) AS days_in_stock,
    ...
  FROM inventory i
  LEFT JOIN vehicle_costs vc ON vc.inventory_id = i.id
  WHERE i.dealership_id = $1  // ❌ SEM ÍNDICE COMPOSTO
  GROUP BY i.id
  ORDER BY i.created_at DESC
`, [dealershipId]);
```

### Solução Recomendada
```sql
-- PASSO 1: Adicionar índice composto
CREATE INDEX IF NOT EXISTS idx_inventory_dealership_status 
ON inventory(dealership_id, status);

-- PASSO 2: Adicionar índice para melhorar query de listagem
CREATE INDEX IF NOT EXISTS idx_inventory_dealership_created
ON inventory(dealership_id, created_at DESC);

-- PASSO 3: Fixar sold_date para TIMESTAMPTZ
ALTER TABLE inventory 
ALTER COLUMN sold_date TYPE TIMESTAMPTZ USING 
  sold_date AT TIME ZONE 'America/Sao_Paulo';

-- PASSO 4: Adicionar DEFAULT para soldDate
ALTER TABLE inventory 
ALTER COLUMN sold_date SET DEFAULT NULL;
```

### Código JavaScript Corrigido
```javascript
// UPDATE: Marca como vendido
const result = await query(`
  UPDATE inventory
  SET status = $9,
      sold_price = CASE
        WHEN $15 IS NOT NULL THEN $15
        WHEN $9 = 'sold' AND sold_price IS NULL THEN sale_price
        ELSE sold_price
      END,
      sold_date = CASE
        WHEN $9 = 'sold' AND sold_date IS NULL THEN NOW()  // ✅ NOW() retorna TIMESTAMPTZ
        WHEN $9 = 'sold' AND sold_date IS NOT NULL THEN sold_date  // ✅ Manter data anterior
        ELSE sold_date
      END,
      ...
  WHERE id = $13 AND dealership_id = $14
  RETURNING *
`, [/* params */]);

// SELECT: Com filtro por status (mais eficiente com índice)
const result = await query(`
  SELECT
    i.*,
    EXTRACT(DAY FROM (NOW() - i.created_at)) AS days_in_stock,
    ...
  FROM inventory i
  LEFT JOIN vehicle_costs vc ON vc.inventory_id = i.id
  WHERE i.dealership_id = $1
    AND i.status != 'sold'  // ✅ FILTRAR AQUI, não no cliente
  GROUP BY i.id
  ORDER BY i.created_at DESC
`, [dealershipId]);
```

### Teste de Validação
```javascript
// ✅ TESTE 1: Marcar como vendido persiste
// 1. Estoque: Selecionar carro
// 2. Dropdown status > "Vendido"
// 3. Status muda visualmente
// 4. Pressionar F5
// ESPERADO: Carro continua marcado como "Vendido"

// ✅ TESTE 2: Índice melhora performance
// 1. Adicionar índice via SQL
// 2. Executar query de listagem (GET /inventory/list)
// 3. Medir tempo (deve ser <100ms)
// ESPERADO: Query rápida e consistente

// ✅ TESTE 3: Repetir marcar como vendido
// 1. Marcar vendido 5x em veículos diferentes
// 2. F5 após cada um
// ESPERADO: Todos permanecem "vendido" (sem desaparecer)
```

---

## BUG #4: Edições Dão Erro (inventory.js)

### Localização
`/src/routes/inventory.js` linhas 502-580

### Código Problemático
```javascript
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { make, model, year, purchasePrice, salePrice, ..., soldPrice } = req.body;

    const result = await query(
      `UPDATE inventory
       SET make = COALESCE($1, make),
           model = COALESCE($2, model),
           year = COALESCE($3, year),  // ❌ Pode ser string
           purchasePrice = COALESCE($4, purchasePrice),  // ❌ Pode ser string
           salePrice = COALESCE($5, salePrice),  // ❌ Pode ser string
           ...
       WHERE id = $13 AND dealership_id = $14
       RETURNING *`,
      [make, model, year, purchasePrice, salePrice, ..., id, req.user.dealership_id, soldPrice || null],
    );

    res.json({
      message: 'Veículo atualizado com sucesso',
      vehicle: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao atualizar veículo:', error);
    res.status(500).json({ error: 'Erro ao atualizar veículo' });  // ❌ GENÉRICO
  }
});
```

### Solução Recomendada
```javascript
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    // ✅ 1. VALIDAR AUTENTICAÇÃO
    if (!req.user || !req.user.dealership_id) {
      return res.status(400).json({ 
        error: 'dealership_id ausente'
      });
    }

    const { id } = req.params;
    const { make, model, year, purchasePrice, salePrice, mileage, soldPrice } = req.body;

    // ✅ 2. VALIDAR TIPOS
    const yearInt = parseInt(year, 10);
    if (isNaN(yearInt) || yearInt < 1900 || yearInt > new Date().getFullYear() + 1) {
      return res.status(400).json({
        error: 'year inválido (deve ser 1900-2100)',
        received: year
      });
    }

    const purchasePriceFloat = parseFloat(purchasePrice);
    if (isNaN(purchasePriceFloat) || purchasePriceFloat < 0) {
      return res.status(400).json({
        error: 'purchasePrice inválido (deve ser >= 0)',
        received: purchasePrice
      });
    }

    const salePriceFloat = parseFloat(salePrice);
    if (isNaN(salePriceFloat) || salePriceFloat < 0) {
      return res.status(400).json({
        error: 'salePrice inválido (deve ser >= 0)',
        received: salePrice
      });
    }

    const mileageInt = parseInt(mileage, 10);
    if (isNaN(mileageInt) || mileageInt < 0) {
      return res.status(400).json({
        error: 'mileage inválido (deve ser >= 0)',
        received: mileage
      });
    }

    // ✅ 3. VALIDAR BUSINESS LOGIC
    if (purchasePriceFloat > salePriceFloat) {
      return res.status(400).json({
        error: 'purchasePrice não pode ser maior que salePrice',
        reason: 'would-result-in-negative-margin',
        received: { purchasePrice: purchasePriceFloat, salePrice: salePriceFloat }
      });
    }

    // ✅ 4. SANITIZAR STRINGS
    const makeSanitized = (make || '').trim().substring(0, 50);
    const modelSanitized = (model || '').trim().substring(0, 50);

    if (!makeSanitized) {
      return res.status(400).json({
        error: 'make é obrigatório'
      });
    }
    if (!modelSanitized) {
      return res.status(400).json({
        error: 'model é obrigatório'
      });
    }

    // ✅ 5. UPDATE
    const result = await query(
      `UPDATE inventory
       SET make = $1,
           model = $2,
           year = $3,
           purchasePrice = $4,
           salePrice = $5,
           mileage = $6,
           soldPrice = $7,
           updated_at = NOW()
       WHERE id = $8 AND dealership_id = $9
       RETURNING *`,
      [
        makeSanitized,
        modelSanitized,
        yearInt,
        purchasePriceFloat,
        salePriceFloat,
        mileageInt,
        soldPrice || null,
        id,
        req.user.dealership_id
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    res.json({
      message: 'Veículo atualizado com sucesso',
      vehicle: result.rows[0],
    });

  } catch (error) {
    // ✅ 6. ERROR HANDLING DETALHADO
    console.error('[inventory.update] Database error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });

    if (error.code === '23505') { // Unique constraint
      return res.status(409).json({
        error: 'Registro duplicado'
      });
    }
    if (error.code === '23503') { // Foreign key
      return res.status(400).json({
        error: 'Referência inválida'
      });
    }

    res.status(500).json({
      error: 'Erro ao atualizar veículo',
      code: error.code
    });
  }
});
```

### Teste de Validação
```javascript
// ✅ TESTE 1: Editar preço válido
PUT /inventory/123
{
  "make": "BMW",
  "model": "M3",
  "year": 2021,
  "purchasePrice": 325000,
  "salePrice": 420000,
  "mileage": 37000
}
// ESPERADO: 200 com veículo atualizado

// ✅ TESTE 2: Year inválido
PUT /inventory/123
{ "year": "abc" }
// ESPERADO: 400 "year inválido"

// ✅ TESTE 3: purchasePrice > salePrice
PUT /inventory/123
{
  "purchasePrice": 450000,
  "salePrice": 420000
}
// ESPERADO: 400 "purchasePrice não pode ser maior que salePrice"

// ✅ TESTE 4: Persistência
// 1. Editar preço para R$ 440.000
// 2. F5
// ESPERADO: Preço permanece R$ 440.000
```

---

## CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Fix Bug #1 (expenses.js) — Validações + error handling
- [ ] Fix Bug #2 (DashboardFinancial.jsx) — Polling automático
- [ ] Fix Bug #3 (inventory.js) — Índice + sold_date TIMESTAMPTZ
- [ ] Fix Bug #4 (inventory.js) — Validações tipos + business logic
- [ ] Testes manuais todos 4 bugs
- [ ] Validar logs (sem erros em console)
- [ ] Deploy staging
- [ ] Deploy produção
- [ ] Monitoramento ativo (Sentry, etc)

---

## ÍNDICES SQL A ADICIONAR

```sql
-- Melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_inventory_dealership ON inventory(dealership_id);
CREATE INDEX IF NOT EXISTS idx_inventory_dealership_status ON inventory(dealership_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_dealership ON expenses(dealership_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_crm_dealership ON crm_contacts(dealership_id);
CREATE INDEX IF NOT EXISTS idx_ipva_dealership ON ipva_records(dealership_id);

-- Validar índices criados
SELECT schemaname, tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

---

## REFERÊNCIAS RÁPIDAS

**Arquivo de Errors HTTP:**
- 400: Bad Request (validação falhou)
- 401: Unauthorized (autenticação falhou)
- 403: Forbidden (autorização falhou)
- 404: Not Found (recurso não existe)
- 409: Conflict (duplicado, constraint violation)
- 500: Internal Server Error (bug no servidor)

**PostgreSQL Error Codes:**
- 23505: unique_violation (constraint única violada)
- 23503: foreign_key_violation (FK violada)
- 42P01: undefined_table (tabela não existe)
- 22P02: invalid_text_representation (tipo incompatível)

**JavaScript Type Validation:**
```javascript
const num = parseFloat(value);
if (isNaN(num)) { /* erro */ }

const int = parseInt(value, 10);
if (isNaN(int)) { /* erro */ }

const regex = /^\d{4}-\d{2}-\d{2}$/;
if (!regex.test(dateString)) { /* erro */ }
```
