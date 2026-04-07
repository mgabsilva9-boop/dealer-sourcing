# DIAGNÓSTICO: Problemas de Persistência de Dados — Projeto Garagem

**Data:** 2026-04-07  
**Sistema:** Dealer Sourcing Backend API + Frontend React  
**Status:** Funcionando em Produção (Vercel + Railway)

---

## 1. PROBLEMA IDENTIFICADO

**Novos veículos e fotos NÃO estão sendo salvos** quando adicionados via formulário do frontend, apesar do sistema responder com status 200.

### Sintomas

- Usuário preenche formulário "Adicionar ao Estoque"
- Clica "Adicionar"
- Frontend mostra sucesso
- Página recarrega
- Novo veículo NÃO aparece na lista

---

## 2. ROOT CAUSE ANALYSIS

### PROBLEMA RAIZ #1: INCONSISTÊNCIA NA ESTRUTURA DO JWT (CRÍTICO)

**Arquivo:** `/src/middleware/auth.js` (linhas 9-57)

O middleware de autenticação extrai e passa `dealership_id` do JWT, mas há falhas:

**CENÁRIO A - Token gerado corretamente:**
```javascript
// /src/routes/auth.js, linha 123-131
const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    dealership_id: user.dealership_id,  // ✅ ESTÁ AQUI
  },
  jwtSecret,
  { expiresIn: '7d' },
);
```

**CENÁRIO B - dealership_id pode estar NULL/undefined se:**
1. Tabela `users` não foi migrada corretamente
2. Coluna `dealership_id` do usuário é NULL no banco
3. JWT foi gerado antes da migration (token antigo)
4. Tabela `dealerships` não existe (migration 002 não rodou)

**IMPACTO:**
```javascript
// /src/routes/inventory.js, linhas 235-238
const dealershipId = req.user.dealership_id;
if (!dealershipId) {
  return res.status(400).json({ error: 'dealership_id ausente no token' });
}
```

Se `req.user.dealership_id` estiver `undefined`:
→ INSERT falha silenciosamente COM HTTP 400  
→ Frontend não trata este erro claramente

---

### PROBLEMA RAIZ #2: TRATAMENTO DE ERROS NO FRONTEND (CRÍTICO)

**Arquivo:** `/src/frontend/App.jsx`, linhas 264-277

```javascript
try {
  var result = await inventoryAPI.create(vehicleData);
  if (result && result.vehicle) {
    onAdd(result.vehicle);
  }
} catch (apiErr) {
  // Se API falhar, criar localmente com ID gerado
  var localVehicle = Object.assign({
    id: Date.now(),
    daysInStock: 0,
    imageUrl: null
  }, vehicleData);
  onAdd(localVehicle);  // ← NÃO AVISA O USUÁRIO DO ERRO!
}
```

**FALHA DE DESIGN:**

1. Bloco `catch` não diferencia entre tipos de erro
2. Se API retorna 400/500 → executa `catch`
3. Se rede offline → executa `catch`
4. Veículo é adicionado **APENAS ao estado local**, NÃO ao banco
5. Aparece na tela (React state) mas desaparece ao recarregar (não persistido)
6. **Usuário acha que foi salvo, mas não foi**

**PROBLEMA ADICIONAL:** O erro não é exibido
```javascript
} catch (apiErr) {
  var localVehicle = ...
  onAdd(localVehicle);  // ← Sem setError(), sem aviso ao usuário
}
```

---

### PROBLEMA RAIZ #3: FALTA DE INICIALIZAÇÃO DE DEALERSHIPS (SEVERO)

**Arquivo:** `/src/routes/auth.js`, linhas 57-68

```javascript
// 3. Criar dealership BrossMotors se não existir
const dealershipId = '11111111-1111-1111-1111-111111111111';
await query(`
  INSERT INTO dealerships (id, name, created_at, updated_at)
  VALUES ($1, 'BrossMotors', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (id) DO NOTHING;
`, [dealershipId]);
```

**PROBLEMA:**
- Tabela `dealerships` **NÃO é criada** por este arquivo
- Ela é definida apenas em `/db/migrations/002_add_dealership_isolation.sql`
- Se o banco é fresh/reset e a migration 002 **não foi rodada**:
  - Query `INSERT INTO dealerships` falha (FK violation ou table not found)
  - Users não recebem `dealership_id`
  - `req.user.dealership_id` é NULL
  - POST /inventory retorna 400

**VERIFICAÇÃO NECESSÁRIA:**
Confirmar se migration 002 foi rodada no banco de produção.

---

### PROBLEMA RAIZ #4: DOIS ENDPOINTS INCONSISTENTES (MÉDIO)

**Frontend:** `/src/frontend/api.js`, linhas 116-119
```javascript
async create(vehicleData) {
  return fetchAPI('/inventory/create', {  // ← LEGACY endpoint
    method: 'POST',
    body: JSON.stringify(vehicleData),
  });
}
```

**Backend tem DOIS endpoints:**
- `POST /inventory/` (linhas 299-322) → retorna veículo direto
- `POST /inventory/create` (linhas 325-379) → retorna `{ message, vehicle }`

Frontend chama o **LEGACY endpoint** (`/inventory/create`).

**Inconsistência:**
```javascript
if (result && result.vehicle) {  // ← Procura result.vehicle
  onAdd(result.vehicle);
}
```

Se resposta é `{ message, vehicle }`, funciona. Mas isso gera fragilidade.

---

### PROBLEMA RAIZ #5: FALTA DE LOGS ESTRUTURADOS (MÉDIO)

**Arquivo:** `/src/routes/inventory.js`, linhas 299-322

```javascript
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { make, model, year, ... } = req.body;
    if (!make || !model) {
      return res.status(400).json({ error: 'Marca e modelo são obrigatórios' });
    }
    // ← SEM LOG AQUI
    const vehicleResult = await query(`INSERT INTO inventory ...`);
    const vehicle = normalizeVehicle(vehicleResult.rows[0]);
    res.status(201).json(vehicle);  // ← SEM LOG DE SUCESSO
  } catch (error) {
    console.error('Erro ao criar veículo:', error);  // ← APENAS no erro
    res.status(500).json({ error: 'Erro ao criar veículo' });
  }
});
```

Impossível diagnosticar problemas em produção sem acessar logs do Railway.

---

## 3. RESUMO DOS PROBLEMAS

| Severidade | Problema | Localização |
|------------|----------|-------------|
| **CRÍTICO** | `dealership_id` NULL/undefined no JWT | `auth.js:127`, `inventory.js:235` |
| **CRÍTICO** | Frontend não valida erro 400 de dealership ausente | `App.jsx:264-277` |
| **CRÍTICO** | Veículos criados apenas em localStorage, não em banco | `App.jsx:271-276` |
| **SEVERO** | Tabela dealerships pode não existir se migration não rodou | `auth.js:57-68`, `002_*.sql` |
| **MÉDIO** | Dois endpoints POST /inventory vs /inventory/create | `api.js:116`, `inventory.js:299` |
| **MÉDIO** | Falta logs estruturados para diagnosticar em produção | `inventory.js:299-322` |
| **MÉDIO** | RLS policies podem estar bloqueando inserts | `002_add_dealership.sql` |
| **BAIXO** | Timeout possível se banco Supabase está lento | `database.js:19` |

---

## 4. FLUXO DE FALHA (CENÁRIO MAIS PROVÁVEL)

### 1. Login (✅ Funciona)
```
Usuário faz login
→ POST /auth/login
→ Token gerado com dealership_id ✅
```

### 2. Formulário (✅ Frontend valida)
```
Preenche make, model, year, etc
→ Validação local ✅
→ Monta objeto vehicleData ✅
```

### 3. Envio para API (❌ FALHA)
```
POST /inventory/create
→ Middleware valida JWT ✅
→ req.user.dealership_id = NULL ← FALHA AQUI
→ Retorna HTTP 400: "dealership_id ausente no token"
```

### 4. Frontend recebe erro (❌ NÃO TRATA)
```
catch (apiErr) executa
→ NÃO mostra erro ao usuário
→ Cria veículo LOCAL com Date.now() ID
→ onAdd(localVehicle)
```

### 5. Veículo aparece na tela (✅ Aparente sucesso)
```
Estado React atualizado
→ Lista mostra novo veículo
→ Usuário acha que foi salvo ✅
```

### 6. Recarrega página (❌ POOF)
```
F5 ou refresh
→ Busca veículos do banco (GET /inventory/list)
→ Veículo NÃO está lá (nunca foi salvo)
→ Lista volta sem o novo veículo
```

---

## 5. POR QUE ISSO PASSA DESPERCEBIDO

- ✅ **Frontend mostra sucesso** (porque está em estado React)
- ✅ **API retorna rapidamente** (não trava)
- ❌ **Banco não persiste** (porque dealership_id é NULL)
- ❌ **Erro não é mostrado** ao usuário (fallback silencioso)
- ❌ **Dados desaparecem** ao recarregar (não persistidos)

Essa é uma **falha insidiosa** de persistência silenciosa.

---

## 6. VERIFICAÇÃO RECOMENDADA

Execute via psql/pgAdmin para diagnosticar:

### 1. Verificar tabela dealerships
```sql
SELECT * FROM dealerships;
-- Se vazio ou erro "table does not exist" → migration 002 não rodou
```

### 2. Verificar users com dealership_id
```sql
SELECT id, email, dealership_id FROM users LIMIT 5;
-- Se dealership_id é NULL → backfill falhou ou users criados antes da migration
```

### 3. Verificar RLS policies
```sql
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE tablename = 'inventory';
-- Se vazio → RLS não está ativado (outro problema)
```

### 4. Testar INSERT direto
```sql
INSERT INTO inventory (user_id, dealership_id, make, model, status)
VALUES ('{user-id}', '{dealership-id}', 'TestMake', 'TestModel', 'available');
-- Se erro de constraint → dealership_id é required mas NULL em user
```

### 5. Verificar logs do Railway
```
Dashboard → dealer-sourcing-api-production → Logs
Procurar por: "dealership_id ausente no token"
```

---

## 7. LINHAS ESPECÍFICAS DO CÓDIGO PROBLEMÁTICO

### /src/routes/inventory.js

| Linha | Código | Problema |
|-------|--------|----------|
| 235 | `const dealershipId = req.user.dealership_id;` | Pode ser undefined |
| 236-238 | `if (!dealershipId) { return 400 }` | Frontend não trata 400 |
| 310 | `(user_id, dealership_id, make, ...)` | INSERT requer dealership_id |

### /src/frontend/App.jsx

| Linha | Código | Problema |
|-------|--------|----------|
| 265 | `await inventoryAPI.create(vehicleData)` | Sem validação de erro |
| 269-276 | `catch (apiErr) { onAdd(localVehicle) }` | Fallback silencioso |

### /src/middleware/auth.js

| Linha | Código | Problema |
|-------|--------|----------|
| 25-26 | `let userId = decoded.id \|\| ...` | dealership_id não validado |
| 46 | `req.user = { ...decoded, id: userId }` | Poderia validar dealership_id |

### /src/routes/auth.js

| Linha | Código | Problema |
|-------|--------|----------|
| 127 | `dealership_id: user.dealership_id` | Se NULL → token ruim |
| 57-68 | `INSERT INTO dealerships` | Assume tabela existe |

---

## 8. IMPACTO ESTIMADO

- **Dados perdidos:** Todos os veículos criados via frontend (exceto default seed)
- **Dados perdidos:** Todas as fotos fazendo upload
- **Usuários afetados:** Qualquer um que tente adicionar novos veículos
- **Produção:** Sistema em estado inconsistente (frontend mostra dados que não existem no banco)

---

## 9. PLANO DE AÇÃO RECOMENDADO

### Fase 1: Diagnóstico (30 min)
1. Verificar se migration 002 foi rodada
2. Consultar tabela users → dealership_id preenchido?
3. Verificar logs Railway nos últimos 3 dias
4. Testar INSERT direto com user real

### Fase 2: Correções Críticas (1-2 horas)
1. **Garantir migration 002 rodou** (rodar manualmente se necessário)
2. **Backfill dealership_id** para users NULL
3. **Melhorar frontend error handling** (mostrar erro ao usuário)
4. **Validar dealership_id no JWT** (middleware.js)

### Fase 3: Melhorias (2-3 horas)
1. Consolidar endpoints (remover POST /inventory/create LEGACY)
2. Adicionar logs estruturados (winston/bunyan)
3. Melhorar validação de entrada
4. Adicionar testes unitários para fluxo de criação

### Fase 4: Recuperação de Dados (depende)
1. Auditar quantos veículos perderam
2. Decidir se recupera ou recria dados
3. Notificar cliente se necessário

---

## 10. PRÓXIMAS AÇÕES

**EM ORDEM DE PRIORIDADE:**

1. ✅ Rodar verificações SQL acima
2. ✅ Confirmar se migration 002 foi executada
3. ✅ Testar token JWT para conter dealership_id válido
4. 🔧 Melhorar tratamento de erros no frontend
5. 🔧 Adicionar validação de dealership_id no middleware
6. 🔧 Consolidar endpoints de criação de veículos
7. 📝 Adicionar logs estruturados
8. ✅ Rodar novo deploy após correções
9. 🧪 Testar ponta-a-ponta com novo veículo
10. 📞 Notificar cliente do status

---

**Relatório gerado:** 2026-04-07  
**Status:** Diagnóstico Completo / Aguardando Ação
