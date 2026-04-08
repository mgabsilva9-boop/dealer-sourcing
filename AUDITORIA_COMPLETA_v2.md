# 🔍 AUDITORIA COMPLETA — Sistema Garagem v1.5

**Data:** 2026-04-08
**Status:** EM PROGRESSO
**Objetivo:** Rastrear TODOS os problemas em cada camada: Frontend → Backend → Banco

---

## 📋 PROBLEMA #1: Estoque Tela Branca

### 1.1 Frontend — Rendering
- [ ] Verificar se `tab === "inventory"` renderiza div corretamente
- [ ] Verificar se `listaContent` e `kanbanContent` existem e são válidos
- [ ] Verificar se há erro de `useMemo` call
- [ ] F12 Console: Há algum erro JavaScript?
- [ ] F12 Console: Logs de useEffect carregamento?

**ACHADO:** React Error #310 FIXADO (hooks fora de conditional blocks)

### 1.2 Backend — API /inventory/list
- [ ] POST request chega ao backend?
- [ ] RLS funciona? (user.dealership_id correto?)
- [ ] Query retorna dados? (SELECT * FROM inventory)
- [ ] Status code é 200?

**CHECKLIST:**
```javascript
GET /inventory/list
Authorization: Bearer ${token}

Expected Response:
{
  "vehicles": [...],
  "total": N
}

Possíveis erros:
- 401: Token inválido/expirado
- 403: RLS rejeita
- 500: Error na query
```

### 1.3 Banco — Tabela inventory
- [ ] Tabela existe?
- [ ] RLS policy existe?
- [ ] dealership_id está filtrado?
- [ ] Há dados para este dealership_id?

---

## 📋 PROBLEMA #2a: Delete Gastos Não Funciona

### 2a.1 Frontend — Click Handler
**Arquivo:** App.jsx linha 1667

```javascript
<button onClick={async function() { 
  if (confirm("Deletar esta despesa?")) { 
    try { 
      await expensesAPI.delete(e.id);                    // ← API call
      setExpenses(p => p.filter(x => x.id !== e.id));  // ← Update state
    } catch (err) { 
      alert("Erro ao deletar: " + err.message); 
    } 
  } 
}}
```

**CHECKLIST:**
- [ ] `e.id` é válido (number ou string?)
- [ ] `expensesAPI.delete()` faz request correto?
- [ ] Request chega ao backend?
- [ ] Response status é 200?
- [ ] Estado é atualizado após delete?

### 2a.2 API Frontend
**Arquivo:** api.js linhas 225-229

```javascript
async delete(id) {
  return fetchAPI(`/expenses/${id}`, {
    method: 'DELETE',
  });
}
```

**CHECKLIST:**
- [ ] URL correta: `/expenses/{id}`?
- [ ] Method é DELETE?
- [ ] Token é enviado no header?
- [ ] Resposta é parseada como JSON?

### 2a.3 Backend — DELETE /expenses/:id
**Arquivo:** routes/expenses.js linhas 184-205

```javascript
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  
  const result = await query(
    'DELETE FROM expenses WHERE id = $1 AND dealership_id = $2 RETURNING id',
    [id, req.user.dealership_id],
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Despesa não encontrada' });
  }
  
  res.json({ message: 'Despesa deletada com sucesso' });
});
```

**CHECKLIST:**
- [ ] authMiddleware passa? (req.user existe?)
- [ ] req.user.dealership_id é válido?
- [ ] Query DELETE executa?
- [ ] RETURNING id retorna ID deletado?
- [ ] Status 404 ou 200?

### 2a.4 Banco — DELETE Query
- [ ] Tabela expenses existe?
- [ ] Coluna `id` é PRIMARY KEY?
- [ ] Coluna `dealership_id` existe?
- [ ] RLS não bloqueia DELETE?

**QUERY TESTE:**
```sql
DELETE FROM expenses 
WHERE id = 999 AND dealership_id = 'abc123' 
RETURNING id;
```

---

## 📋 PROBLEMA #2b: Save Gastos Não Persiste

### 2b.1 Frontend — Adicionar Despesa
**Arquivo:** App.jsx linha 1650

```javascript
<button onClick={async function() { 
  if (!expForm.category || !expForm.amount) return;
  if (expForm.category === "__custom__" && !expForm.customCategory) return;
  
  try { 
    var finalForm = Object.assign({}, expForm);
    if (expForm.category === "__custom__") { 
      finalForm.category = expForm.customCategory;
      delete finalForm.customCategory;
    }
    
    var result = await expensesAPI.create(finalForm);  // ← API call
    
    if (result && result.expense) { 
      setExpenses(p => p.concat([result.expense]));    // ← Add to state
      setExpForm({ ... reset ... });
      setAddingExp(false);
    } 
  } catch (err) { 
    alert("Erro ao adicionar despesa: " + err.message);
  }
}}
```

**CHECKLIST:**
- [ ] `expForm` tem todos dados: category, amount, date, status?
- [ ] `expensesAPI.create()` faz POST?
- [ ] Response tem `result.expense`?
- [ ] Estado é atualizado com novo expense?

### 2b.2 Carregamento Inicial de Expenses
**Arquivo:** App.jsx linhas 614 e 648-651

```javascript
const expensesData = await expensesAPI.list().catch(() => ({}));

if (expensesData && expensesData.expenses && expensesData.expenses.length > 0) {
  setExpenses(expensesData.expenses);
} else {
  setExpenses(INIT_EXPENSES);  // ← PROBLEMA! Se API falhar, usa dados hardcoded
}
```

⚠️ **CRÍTICO:** Se `expensesAPI.list()` falhar, volta para INIT_EXPENSES (dados hardcoded) em vez do servidor!

**PROBLEMA IDENTIFICADO:**
1. User faz login
2. `expensesAPI.list()` FALHA (erro 500, RLS issue, etc)
3. Frontend usa INIT_EXPENSES como fallback
4. User adiciona gasto → salva no estado local apenas
5. User faz F5
6. `expensesAPI.list()` continua falhando
7. Volta a INIT_EXPENSES → gasto perdido!

### 2b.3 Backend — POST /expenses/create
**Arquivo:** routes/expenses.js linhas 32-111

**CHECKLIST:**
- [ ] Validações passam? (category, amount, date format)
- [ ] dealership_id está no token?
- [ ] INSERT executa?
- [ ] RETURNING * retorna o novo expense?
- [ ] Status 201 retorna?

### 2b.4 Backend — GET /expenses/list
**Arquivo:** routes/expenses.js linhas 15-30

```javascript
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM expenses WHERE dealership_id = $1 ORDER BY date DESC',
      [req.user.dealership_id],
    );

    res.json({
      total: result.rows.length,
      expenses: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar despesas:', error);
    res.status(500).json({ error: 'Erro ao listar despesas' });
  }
});
```

**CHECKLIST:**
- [ ] authMiddleware passa?
- [ ] req.user.dealership_id é válido?
- [ ] Query executa sem erro?
- [ ] Retorna `{ expenses: [...] }`?
- [ ] Status 200?

---

## 📋 PROBLEMA #3: Clientes Não Editáveis

### 3.1 Frontend — CRM Tab
**Arquivo:** App.jsx linha 1676

```javascript
{tab === "crm" && <CrmTab customers={customers} setCustomers={setCustomers} />}
```

Preciso ver CrmTab component!

### 3.2 Campos Faltando
Problema reportado:
- vehicleBought: não retorna
- purchaseDate: não retorna  
- purchaseValue: não retorna

**CHECKLIST:**
- [ ] Tabela customers tem essas colunas?
- [ ] Backend retorna esses campos?
- [ ] Frontend renderiza esses campos?
- [ ] Há endpoint PATCH /crm/:id?

---

## 🔧 TESTES PROPOSTOS

### TEST #1: Verificar se APIs retornam dados

```bash
# 1. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dono@brossmotors.com","password":"bross2026"}'

# Response: {"token":"...","user":{...}}

# 2. Listar expenses
curl http://localhost:3000/expenses/list \
  -H "Authorization: Bearer $TOKEN"

# Response: {"total":N,"expenses":[...]}
```

### TEST #2: Criar + Deletar + Recarregar

1. Adicionar despesa via UI
2. Verificar se aparece no estado
3. Deletar despesa via UI
4. Verificar se desaparece do estado
5. **F5 (reload)**
6. Verificar se despesa sumiu também do servidor

---

## ✅ CONCLUSÕES

( Será preenchido conforme investigação progride )

