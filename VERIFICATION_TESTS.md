# TESTES DE VERIFICAÇÃO - FASE 1

**Objetivo:** Validar que os 4 bugs críticos foram corrigidos em produção.

---

## SETUP

```bash
# 1. Obter um token válido (usar frontend login)
TOKEN="seu_token_jwt_aqui"
API_URL="https://dealer-sourcing-api-production.up.railway.app"

# 2. Verificar conexão
curl -s $API_URL/health
# Esperado: {"status":"ok", ...}
```

---

## TEST 1: EXPENSES SALVAM (BUG #1)

### Cenário
POST `/expenses/create` deve retornar 201 com expense object válido.

### Command
```bash
curl -X POST $API_URL/expenses/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Aluguel",
    "description": "Teste BUG FIX #1 - Expenses Persist",
    "amount": 3500,
    "date": "2026-04-07",
    "status": "pending"
  }' | jq .
```

### Esperado
```json
{
  "message": "Despesa criada com sucesso",
  "expense": {
    "id": "uuid",
    "dealership_id": "uuid",
    "category": "Aluguel",
    "amount": 3500,
    ...
  }
}
```

### Status Code
- ✅ **201 Created** - Despesa salva com sucesso
- ❌ **409 Conflict** - Se for duplicada (mesmo category + date + amount)
- ❌ **400 Bad Request** - Se dados inválidos
- ❌ **500 Server Error** - Não deve acontecer (seria bug ainda)

### Validação
```bash
# Listar despesas para confirmar
curl -s -X GET $API_URL/expenses/list \
  -H "Authorization: Bearer $TOKEN" | jq '.expenses | length'
# Esperado: incrementou em 1
```

---

## TEST 2: FINANCIAL TAB SINCRONIZA (BUG #2)

### Cenário
Marcar veículo como 'sold' deve atualizar Financial tab instantaneamente (sem F5).

### Steps
1. **Abrir frontend** → https://dealer-sourcing.vercel.app
2. **Ir para aba Estoque**
3. **Selecionar 1º veículo**
4. **Mudar status para 'sold'** (dropdown)
5. **Ir para aba Financeiro**
6. **Verificar números atualizados**

### Esperado
- **Antes:** Números velhos (mostrava estado anterior)
- **Depois:** Números novos (Receita +, Lucro +)
- **Sem F5:** Atualização automática

### Validação Técnica
```javascript
// No console do browser:
// Verificar que plData foi recalculado

// Antes de marcar como sold:
console.log('plData.grossRevenue:', plData?.grossRevenue)  // ex: 1.000.000

// Depois de marcar como sold:
console.log('plData.grossRevenue:', plData?.grossRevenue)  // ex: 1.500.000 (aumentou)
```

### SQL Check (se tiver acesso DB)
```sql
-- Verificar que vehicle foi marcado como sold
SELECT id, status, sold_date, sold_price FROM inventory 
WHERE status = 'sold' 
ORDER BY sold_date DESC LIMIT 1;
-- Esperado: sold_date = CURRENT_TIMESTAMP (não NULL, não DATE)
```

---

## TEST 3: SOLD VEHICLES PERSISTEM (BUG #3)

### Cenário
Marcar veículo como 'sold' deve persistir após refresh da página.

### Command
```bash
# 1. GET primeiro veículo
VEHICLE_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  $API_URL/inventory/list | jq -r '.vehicles[0].id')

echo "Testing vehicle: $VEHICLE_ID"

# 2. Marcar como sold
curl -X PUT $API_URL/inventory/$VEHICLE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "sold"}' | jq '.vehicle.status, .vehicle.sold_date'

# 3. Verificar imediatamente
curl -s -H "Authorization: Bearer $TOKEN" \
  $API_URL/inventory/$VEHICLE_ID | jq '.status, .sold_date'
# Esperado: status="sold", sold_date="2026-04-08T00:30:00.000Z" (TIMESTAMPTZ)
```

### Esperado
```json
{
  "status": "sold",
  "sold_date": "2026-04-08T00:30:00.000Z",  // ← TIMESTAMPTZ, não DATE
  "sold_price": 315000,
  ...
}
```

### F5 Test
1. **Marcar veículo como sold** no frontend
2. **Fazer F5 (refresh página)**
3. **Verificar que ainda está 'sold'**
4. **Não deve reaparecer como 'available'**

---

## TEST 4: EDIT VALIDATIONS RETORNAM 400 (BUG #4)

### Test 4a: Year Inválido

```bash
curl -X PUT $API_URL/inventory/$VEHICLE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year": 1800}' | jq '.error'

# Esperado: "Ano deve estar entre 1900 e 2027"
```

**Status Code:**
- ✅ **400 Bad Request** - Validação falhou (correto)
- ❌ **500 Server Error** - Bug ainda existe

### Test 4b: purchasePrice > salePrice

```bash
curl -X PUT $API_URL/inventory/$VEHICLE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "purchasePrice": 500000,
    "salePrice": 100000
  }' | jq '.error'

# Esperado: "Preço de compra não pode ser maior que preço de venda"
```

**Status Code:**
- ✅ **400 Bad Request** - Validação falhou (correto)
- ❌ **500 Server Error** - Bug ainda existe

### Test 4c: Invalid Amount (não-numérico)

```bash
curl -X PUT $API_URL/inventory/$VEHICLE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"purchasePrice": "abc"}' | jq '.error'

# Esperado: "Preço de compra deve ser um número >= 0"
```

---

## SUMMARY CHECKLIST

Rodar após cada test:

```bash
# Test 1: Expenses
[ ] POST /expenses/create → 201 ✓
[ ] Error handling improved (409 para duplicatas)

# Test 2: Financial
[ ] Marcar como sold → números atualizam imediatamente
[ ] Sem F5 necessário
[ ] useMemo está ativo no console

# Test 3: Sold Persistence
[ ] Marcar como sold → sold_date é TIMESTAMPTZ (não DATE)
[ ] F5 → ainda está sold
[ ] Índice compound não causa issues

# Test 4: Validations
[ ] 4a: Year 1800 → 400 "Ano deve estar..."
[ ] 4b: compra > venda → 400 "Preço de compra não pode..."
[ ] 4c: NaN values → 400 com mensagem específica
```

---

## PRODUCTION VALIDATION

### Database Check
```sql
-- 1. Verificar sold_date type
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name='inventory' AND column_name='sold_date';
-- Esperado: timestamp without time zone (ou timestamptz)

-- 2. Verificar índice
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE indexname='idx_inventory_dealership_status';
-- Esperado: Deve existir

-- 3. Contar vehicles com status=sold
SELECT COUNT(*) FROM inventory WHERE status='sold';

-- 4. Validar sold_date não-NULL para sold vehicles
SELECT COUNT(*) FROM inventory 
WHERE status='sold' AND sold_date IS NULL;
-- Esperado: 0 (nenhum com NULL)
```

### Application Logs
```bash
# Railway logs
# Check para:
# ✓ "Validações OK, atualizando no banco"
# ✓ "Despesa criada com sucesso"
# ✓ Nenhum "500 Internal Server Error" para validações
```

---

## Timeline

- **Commit:** f6ba28b (2026-04-07)
- **Push:** ✅ main
- **Railway Deploy:** ~2-5 minutos
- **Tests:** Rodar após deploy
- **Expected:** All tests PASS em 30 minutos

---

**Test Plan v1.0 - FASE 1 Verification**
