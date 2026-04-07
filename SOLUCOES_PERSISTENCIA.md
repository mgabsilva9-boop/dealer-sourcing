# SOLUÇÕES: Problemas de Persistência de Dados — Projeto Garagem

**Data:** 2026-04-07  
**Status:** Propostas de Correção (pronto para implementação)

---

## SOLUÇÃO #1: Garantir dealership_id no JWT (CRÍTICO)

### Problema
Usuários podem ter `dealership_id = NULL` no banco, causando token inválido.

### Solução A: Validação no Middleware

**Arquivo:** `/src/middleware/auth.js` (após linha 46)

**ANTES:**
```javascript
req.user = {
  ...decoded,
  id: userId,
};
```

**DEPOIS:**
```javascript
// Validar dealership_id obrigatório
if (!decoded.dealership_id) {
  console.warn('[AUTH] Token missing dealership_id:', { userId, email: decoded.email });
  return res.status(401).json({ error: 'Token inválido: dealership_id ausente' });
}

req.user = {
  ...decoded,
  id: userId,
  dealership_id: decoded.dealership_id,
};
```

### Solução B: Garantir dealership_id na Criação do JWT

**Arquivo:** `/src/routes/auth.js` (linha 119-120)

**ANTES:**
```javascript
console.log('[LOGIN] User found:', { id: user.id, email: user.email, dealership_id: user.dealership_id });
```

**DEPOIS:**
```javascript
// VALIDAÇÃO CRÍTICA: dealership_id deve existir
if (!user.dealership_id) {
  console.error('[LOGIN] ERRO CRÍTICO: User sem dealership_id:', { id: user.id, email: user.email });
  return res.status(500).json({ 
    error: 'Erro interno: usuário sem loja configurada. Contate administrador.' 
  });
}

console.log('[LOGIN] User found:', { id: user.id, email: user.email, dealership_id: user.dealership_id });
```

### Impacto
- Rejeita tokens inválidos imediatamente
- Força erro 401 em vez de erro silencioso 400
- Frontend pode diferenciar ("re-login") vs ("dados corruptos")

---

## SOLUÇÃO #2: Melhorar Tratamento de Erro no Frontend (CRÍTICO)

### Problema
Frontend cria veículos fake localmente se API falha, sem avisar usuário.

### Solução: Diferenciar Tratamento de Erro

**Arquivo:** `/src/frontend/App.jsx` (linhas 237-283)

**ANTES:**
```javascript
var submit = async function() {
  if (!validate()) { setError("Por favor, corrija os erros acima"); return; }
  setLoading(true);
  setError("");
  try {
    var costs = { ... };
    var vehicleData = { ... };
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
      onAdd(localVehicle);
    }
  } catch (err) {
    setError(err instanceof APIError ? err.message : "Erro ao adicionar veiculo");
  } finally {
    setLoading(false);
  }
};
```

**DEPOIS:**
```javascript
var submit = async function() {
  if (!validate()) { setError("Por favor, corrija os erros acima"); return; }
  setLoading(true);
  setError("");
  
  try {
    var costs = { ... };
    var vehicleData = { ... };
    
    // Sempre tentar API primeiro
    try {
      var result = await inventoryAPI.create(vehicleData);
      
      // Validar resposta
      if (!result || !result.vehicle) {
        throw new Error('Resposta inválida do servidor: ' + JSON.stringify(result));
      }
      
      // SUCESSO: dados persistidos no banco
      onAdd(result.vehicle);
      setError(""); // Limpar erros anteriores
      localStorage.removeItem("vehicleFormDraft"); // Limpar rascunho
      
    } catch (apiErr) {
      // ERRO: NÃO criar localmente
      console.error('[VehicleForm] API Error:', apiErr);
      
      // Diferenciar tipos de erro
      if (apiErr instanceof APIError) {
        if (apiErr.status === 400) {
          // Validação no servidor
          setError('Dados inválidos: ' + apiErr.message);
        } else if (apiErr.status === 401) {
          // Problema de autenticação
          setError('Sessão expirada. Por favor, faça login novamente.');
          localStorage.clear();
          window.location.href = '/';
        } else if (apiErr.status === 500) {
          // Erro interno do servidor
          setError('Erro no servidor. Tente novamente em alguns minutos.');
        } else {
          setError('Erro: ' + apiErr.message);
        }
      } else {
        // Erro de rede ou timeout
        setError('Erro de conexão. Verifique sua internet e tente novamente.');
      }
      
      // IMPORTANTE: NÃO adicionar veículo localmente
      // Dados devem ser persistidos no banco ou falha total
    }
    
  } catch (err) {
    console.error('[VehicleForm] Unexpected error:', err);
    setError('Erro inesperado: ' + (err.message || 'desconhecido'));
  } finally {
    setLoading(false);
  }
};
```

### Impacto
- ✅ Usuário vê mensagem de erro clara
- ✅ Dados só adicionados se API confirma persistência
- ✅ Rede/timeout diferenciado de erro de servidor
- ✅ Sessão expirada redireciona automaticamente

---

## SOLUÇÃO #3: Garantir Migration de Dealerships (SEVERO)

### Problema
Se migration 002 não foi rodada, tabela `dealerships` não existe.

### Solução: Rodas Manualmente ou Verificação

**Opção A: Rodar Migration (Recomendado)**

```bash
# Conectar ao banco Supabase
psql postgresql://user:pass@...

# Rodar migration 002 manualmente
\i /db/migrations/002_add_dealership_isolation.sql

# Verificar sucesso
SELECT * FROM dealerships;
SELECT COUNT(*) FROM users WHERE dealership_id IS NOT NULL;
```

**Opção B: Criar Função de Inicialização Robusta**

**Arquivo:** `/src/routes/auth.js` (nova função antes de `initDefaultUsers`)

```javascript
async function ensureDealershipTableAndData() {
  try {
    // 1. Criar tabela dealerships se não existir
    await query(`
      CREATE TABLE IF NOT EXISTS dealerships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        cnpj TEXT UNIQUE,
        city TEXT,
        state TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    console.log('✅ Tabela dealerships verificada/criada');
    
    // 2. Criar índices
    await query(`
      CREATE INDEX IF NOT EXISTS idx_dealerships_cnpj ON dealerships(cnpj);
      CREATE INDEX IF NOT EXISTS idx_dealerships_state_active ON dealerships(state, is_active);
    `);
    
    // 3. Seed dealerships padrão
    const dealerships = [
      { id: '11111111-1111-1111-1111-111111111111', name: 'BrossMotors', city: 'Ribeirão Preto', state: 'SP' },
      { id: '22222222-2222-2222-2222-222222222222', name: 'Loja A - Premium Motors', city: 'Ribeirão Preto', state: 'SP' },
      { id: '33333333-3333-3333-3333-333333333333', name: 'Loja B - Luxury Auto', city: 'Santa Catarina', state: 'SC' }
    ];
    
    for (const d of dealerships) {
      await query(`
        INSERT INTO dealerships (id, name, city, state, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (id) DO NOTHING;
      `, [d.id, d.name, d.city, d.state]);
    }
    
    console.log('✅ Dealerships padrão verificadas/criadas');
    
  } catch (err) {
    console.error('❌ Erro ao garantir dealerships:', err.message);
    throw err; // Falhar startup se não conseguir criar
  }
}

// Executar ANTES de initDefaultUsers
ensureDealershipTableAndData().catch(err => {
  console.error('❌ STARTUP BLOQUEADO: Não conseguiu criar dealerships', err.message);
  process.exit(1);
});
```

### Impacto
- Tabela `dealerships` é criada se não existir
- Seed padrão é garantido
- Startup falha explicitamente se problema ocorre (melhor que falha silenciosa)

---

## SOLUÇÃO #4: Consolidar Endpoints de Criação (MÉDIO)

### Problema
Dois endpoints diferentes (`POST /inventory/` vs `POST /inventory/create`) causam confusão.

### Solução: Remover LEGACY, Manter REST

**Arquivo:** `/src/frontend/api.js` (linha 116)

**ANTES:**
```javascript
async create(vehicleData) {
  return fetchAPI('/inventory/create', {  // ← LEGACY
    method: 'POST',
    body: JSON.stringify(vehicleData),
  });
}
```

**DEPOIS:**
```javascript
async create(vehicleData) {
  return fetchAPI('/inventory', {  // ← REST (moderno)
    method: 'POST',
    body: JSON.stringify(vehicleData),
  });
}
```

**Arquivo:** `/src/routes/inventory.js`

**ANTES:**
```javascript
// POST / e POST /create ambos existem
router.post('/', authMiddleware, async (req, res) => { ... });
router.post('/create', authMiddleware, async (req, res) => { ... });
```

**DEPOIS:**
```javascript
// Manter apenas POST / (REST pattern)
router.post('/', authMiddleware, async (req, res) => { ... });

// Remover router.post('/create', ...)
// Manter apenas para backward compatibility com aviso:
router.post('/create', authMiddleware, async (req, res) => {
  console.warn('[DEPRECATED] POST /inventory/create - use POST /inventory instead');
  // Redirecionar para novo endpoint (pode mover lógica)
});
```

### Impacto
- ✅ Padrão REST consistente
- ✅ Uma fonte de verdade para criação
- ✅ Fácil manutenção e debug

---

## SOLUÇÃO #5: Adicionar Logs Estruturados (MÉDIO)

### Problema
Impossível diagnosticar problemas em produção sem acessar logs do Railway manualmente.

### Solução: Adicionar Logging Estruturado

**Arquivo:** `/src/routes/inventory.js` (linhas 299-322)

**ANTES:**
```javascript
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { make, model, year, ... } = req.body;
    if (!make || !model) {
      return res.status(400).json({ error: 'Marca e modelo são obrigatórios' });
    }
    // ← Sem log
    const vehicleResult = await query(`INSERT INTO inventory ...`);
    res.status(201).json(vehicle);  // ← Sem log de sucesso
  } catch (error) {
    console.error('Erro ao criar veículo:', error);
    res.status(500).json({ error: 'Erro ao criar veículo' });
  }
});
```

**DEPOIS:**
```javascript
router.post('/', authMiddleware, async (req, res) => {
  const requestId = require('crypto').randomBytes(8).toString('hex');
  const logPrefix = `[POST /inventory] [${requestId}]`;
  
  try {
    const { make, model, year, purchasePrice, ... } = req.body;
    const userId = req.user.id;
    const dealershipId = req.user.dealership_id;
    
    // Log entrada
    console.log(`${logPrefix} Iniciando criação:`, {
      userId,
      dealershipId,
      make,
      model,
      year,
    });
    
    // Validar
    if (!make || !model) {
      console.warn(`${logPrefix} Validação falhou: make ou model vazios`);
      return res.status(400).json({ error: 'Marca e modelo são obrigatórios' });
    }
    
    // Validar dealership_id
    if (!dealershipId) {
      console.error(`${logPrefix} ERRO CRÍTICO: dealership_id ausente no token`);
      return res.status(400).json({ error: 'dealership_id ausente no token' });
    }
    
    // Inserir
    const vehicleResult = await query(
      `INSERT INTO inventory (user_id, dealership_id, make, ...)
       VALUES ($1, $2, $3, ...)
       RETURNING *`,
      [userId, dealershipId, make, ...]
    );
    
    const vehicle = normalizeVehicle(vehicleResult.rows[0]);
    
    // Log sucesso
    console.log(`${logPrefix} ✅ Veículo criado com sucesso:`, {
      vehicleId: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
    });
    
    res.status(201).json(vehicle);
    
  } catch (error) {
    console.error(`${logPrefix} ❌ Erro ao criar veículo:`, {
      error: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack.split('\n').slice(0, 3), // Apenas primeiras linhas
    });
    
    res.status(500).json({ error: 'Erro ao criar veículo' });
  }
});
```

### Impacto
- ✅ Request ID para rastrear fluxo completo
- ✅ Logs estruturados (JSON) em produção
- ✅ Identifica exatamente onde falha
- ✅ Timestamps automáticos

---

## SOLUÇÃO #6: Validar RLS Policies (MÉDIO)

### Problema
RLS pode estar bloqueando INSERTs se policies não estão corretas.

### Solução: Verificar e Corrigir RLS

**Verificação:**
```sql
-- Ver status RLS em inventory
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'inventory';

-- Ver todas as policies
SELECT schemaname, tablename, policyname, qual, with_check 
FROM pg_policies 
WHERE tablename = 'inventory';
```

**Se RLS estiver desativado, ativar:**
```sql
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
```

**Garantir policies corretas:**
```sql
-- Policy para SELECT (ler por dealership_id)
CREATE POLICY "inventory_select_own_dealership" ON inventory
  FOR SELECT
  USING (dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid()));

-- Policy para INSERT (criar na própria dealership)
CREATE POLICY "inventory_insert_own_dealership" ON inventory
  FOR INSERT
  WITH CHECK (dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid()));

-- Policy para UPDATE (editar da própria dealership)
CREATE POLICY "inventory_update_own_dealership" ON inventory
  FOR UPDATE
  USING (dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid()))
  WITH CHECK (dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid()));

-- Policy para DELETE (deletar da própria dealership)
CREATE POLICY "inventory_delete_own_dealership" ON inventory
  FOR DELETE
  USING (dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid()));
```

### Impacto
- ✅ RLS garante isolamento multi-tenant
- ✅ Usuário de Loja A não vê/edita veículos de Loja B
- ✅ Segurança em nível de banco de dados

---

## SOLUÇÃO #7: Adicionar Validação de Upload de Fotos (MÉDIO)

### Problema
Fotos podem falhar silenciosamente ou sem feedback.

### Solução: Melhorar Endpoint de Upload

**Arquivo:** `/src/routes/inventory.js` (linhas 582-623)

**ANTES:**
```javascript
router.post('/:id/upload-image', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { imageBase64, imageUrl } = req.body;

    const vehicleResult = await query(
      'SELECT * FROM inventory WHERE id = $1 AND dealership_id = $2',
      [id, req.user.dealership_id],
    );

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    let finalImageUrl = imageUrl;

    if (imageBase64) {
      finalImageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
    }

    if (!finalImageUrl) {
      return res.status(400).json({ error: 'imageBase64 ou imageUrl são obrigatórios' });
    }

    const result = await query(
      'UPDATE inventory SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND dealership_id = $3 RETURNING *',
      [finalImageUrl, id, req.user.dealership_id],
    );

    res.json({
      message: 'Imagem salva com sucesso',
      vehicle: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao salvar imagem:', error);
    res.status(500).json({ error: 'Erro ao salvar imagem' });
  }
});
```

**DEPOIS:**
```javascript
router.post('/:id/upload-image', authMiddleware, async (req, res) => {
  const requestId = require('crypto').randomBytes(8).toString('hex');
  const logPrefix = `[POST /:id/upload-image] [${requestId}]`;
  
  try {
    const { id } = req.params;
    const { imageBase64, imageUrl } = req.body;
    const userId = req.user.id;
    const dealershipId = req.user.dealership_id;

    console.log(`${logPrefix} Iniciando upload para veículo ${id}`);

    // Validar propriedade do veículo
    const vehicleResult = await query(
      'SELECT id, image_url FROM inventory WHERE id = $1 AND dealership_id = $2',
      [id, dealershipId],
    );

    if (vehicleResult.rows.length === 0) {
      console.warn(`${logPrefix} Veículo não encontrado ou não pertence ao user`, {
        vehicleId: id,
        dealershipId,
      });
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    // Validar entrada
    if (!imageBase64 && !imageUrl) {
      return res.status(400).json({ error: 'imageBase64 ou imageUrl são obrigatórios' });
    }

    // Limpar imagem antiga se existir
    const oldImage = vehicleResult.rows[0].image_url;

    // Preparar URL final
    let finalImageUrl = imageUrl;
    if (imageBase64) {
      // Validar base64
      if (!imageBase64.match(/^data:image\/(jpeg|png|gif|webp);base64,/)) {
        return res.status(400).json({ 
          error: 'Formato base64 inválido. Esperado: data:image/jpeg;base64,...' 
        });
      }
      finalImageUrl = imageBase64;
    }

    // Validar tamanho (base64 é ~1.3x do binário)
    if (finalImageUrl.length > 10 * 1024 * 1024) { // 10MB
      return res.status(413).json({ error: 'Imagem muito grande (máx 10MB)' });
    }

    // Atualizar
    console.log(`${logPrefix} Atualizando image_url do veículo`);
    const result = await query(
      'UPDATE inventory SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND dealership_id = $3 RETURNING *',
      [finalImageUrl, id, dealershipId],
    );

    console.log(`${logPrefix} ✅ Imagem salva com sucesso`);

    res.json({
      message: 'Imagem salva com sucesso',
      vehicle: result.rows[0],
    });

  } catch (error) {
    console.error(`${logPrefix} ❌ Erro ao salvar imagem:`, {
      error: error.message,
      code: error.code,
      stack: error.stack.split('\n').slice(0, 2),
    });
    res.status(500).json({ error: 'Erro ao salvar imagem' });
  }
});
```

### Impacto
- ✅ Valida formato base64
- ✅ Limita tamanho de upload
- ✅ Logs estruturados
- ✅ Melhor feedback de erro

---

## RESUMO DAS SOLUÇÕES

| ID | Severidade | Solução | Esforço | Impacto |
|----|-----------|---------|--------|--------|
| 1 | CRÍTICO | Validar dealership_id no JWT | 30 min | Alto |
| 2 | CRÍTICO | Melhorar erro handling no frontend | 45 min | Alto |
| 3 | SEVERO | Garantir migration dealerships | 15 min | Alto |
| 4 | MÉDIO | Consolidar endpoints | 20 min | Médio |
| 5 | MÉDIO | Adicionar logs estruturados | 45 min | Médio |
| 6 | MÉDIO | Validar RLS policies | 30 min | Médio |
| 7 | MÉDIO | Melhorar upload de fotos | 45 min | Médio |

**Tempo total recomendado:** 4-5 horas

**Prioridade:** CRÍTICO > SEVERO > MÉDIO > BAIXO

---

## IMPLEMENTAÇÃO RECOMENDADA

### Dia 1: Crítico + Severo (1.5-2 horas)
1. ✅ Solução #1 (Validar JWT)
2. ✅ Solução #3 (Garantir dealerships)
3. ✅ Solução #2 (Frontend error handling)
4. 🔧 Deploy em staging
5. 🧪 Testar ponta-a-ponta

### Dia 2: Médio (2-3 horas)
6. ✅ Solução #5 (Logs estruturados)
7. ✅ Solução #4 (Consolidar endpoints)
8. ✅ Solução #6 (RLS validation)
9. ✅ Solução #7 (Upload fotos)
10. 🔧 Deploy em produção
11. 📊 Monitorar logs

---

**Status:** Pronto para Implementação  
**Próximo passo:** Começar com Soluções #1, #3 e #2
