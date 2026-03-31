# Story: ENTREGA-1.4 — Validação de Segurança (API)

**ID:** ENTREGA-1.4
**Epic:** epic-entrega-cliente.md
**Owner:** @qa (Quinn)
**Prazo:** 1 dia
**Status:** Blocked by ENTREGA-1.1 / ENTREGA-1.2 / ENTREGA-1.3
**Prioridade:** CRÍTICA

---

## Resumo

Validar que endpoints sensíveis retornam 401/403 sem autenticação, e que isolamento multi-tenant (dealership_id) funciona.

**Resultado Esperado:** ✅ /metrics → 401, /cache → 401, /seed → 403, isolamento OK

---

## Acceptance Criteria

- [ ] AC1: GET /metrics sem token → 401 Unauthorized
- [ ] AC2: GET /metrics com token → 200 OK + JSON
- [ ] AC3: DELETE /cache/flush sem token → 401 Unauthorized
- [ ] AC4: DELETE /cache/flush com token → 200 OK
- [ ] AC5: POST /seed-default-users sem secret → 403 Forbidden
- [ ] AC6: POST /seed-default-users com secret → 200 OK
- [ ] AC7: Isolamento dealership_id → Loja A não consegue acessar dados de Loja B via API

---

## Instruções de Teste

### Pré-requisito
- Backend rodando: http://localhost:3000 (ou Railway)
- Terminal com curl disponível
- Dois usuários criados de lojas diferentes

### Setup: Extrair Token

**Passo 1: Login e extrair token**
1. Abrir `http://localhost:5173` (ou URL frontend)
2. Login como qualquer usuário
3. DevTools (F12) → Application → localStorage
4. Copiar value de key "token"
5. Colar em arquivo temporário: `TOKEN_LOJA_A="eyJhbGci..."`

### Teste 1: GET /metrics sem token (AC1)
```bash
curl -v http://localhost:3000/metrics
```

**Esperado:**
- HTTP Status: **401 Unauthorized**
- Response: `{"error": "..."}` ou similar
- **Não deve** retornar métricas de pool

**Resultado:** ✅ AC1 PASS / ❌ AC1 FAIL

**Se falha (retorna 200 ao invés de 401):**
- Escalar para @dev: "/metrics não está protegido"

### Teste 2: GET /metrics com token (AC2)
```bash
TOKEN="eyJhbGci..."
curl -v -H "Authorization: Bearer $TOKEN" http://localhost:3000/metrics
```

**Esperado:**
- HTTP Status: **200 OK**
- Response: JSON com métricas (ex: `{"max": 10, "current": 5, ...}`)

**Resultado:** ✅ AC2 PASS

### Teste 3: DELETE /cache/flush sem token (AC3)
```bash
curl -v -X DELETE http://localhost:3000/api/cache/flush
```

**Esperado:**
- HTTP Status: **401 Unauthorized**

**Resultado:** ✅ AC3 PASS / ❌ AC3 FAIL

### Teste 4: DELETE /cache/flush com token (AC4)
```bash
TOKEN="eyJhbGci..."
curl -v -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/cache/flush
```

**Esperado:**
- HTTP Status: **200 OK**
- Response: `{"message": "Cache flushed"}` ou similar

**Resultado:** ✅ AC4 PASS

### Teste 5: POST /seed-default-users sem secret (AC5)
```bash
curl -v -X POST \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:3000/auth/seed-default-users
```

**Esperado:**
- HTTP Status: **403 Forbidden**
- Response: `{"error": "Acesso negado"}` ou similar

**Resultado:** ✅ AC5 PASS / ⚠️ AC5 PARTIAL (retorna 401 ao invés de 403)

**Nota:** 403 vs 401 é semântica, ambos aceitáveis

### Teste 6: POST /seed-default-users com secret (AC6)
```bash
ADMIN_SECRET="seu-secret-aqui"
curl -v -X POST \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: $ADMIN_SECRET" \
  -d '{}' \
  http://localhost:3000/auth/seed-default-users
```

**Esperado:**
- HTTP Status: **200 OK**
- Response: `{"message": "..."}` ou `{"created": [...]}`

**Se falha (403):**
- ADMIN_SECRET incorreto
- Verificar valor em Railway environment variables
- Ou em `.env.local` se testando localmente

**Resultado:** ✅ AC6 PASS

**Nota:** AC6 pode ser SKIP se ADMIN_SECRET não está configurado (não bloqueador para go-live)

### Teste 7: Isolamento dealership_id (AC7) ⭐ CRÍTICO

**7A: Preparar dados**

1. Login como Loja A (ex: dono@lojaA.com)
2. DevTools → Network → criar um veículo (se não existir)
3. Copiar ID do veículo: `VEHICLE_ID_LOJA_A = "1"` (exemplo)
4. Copiar token: `TOKEN_LOJA_A = "eyJ..."`
5. Logout

6. Login como Loja B (ex: manager@lojaB.com)
7. DevTools → Network → GET /inventory
8. Copiar seu próprio vehicle ID: `VEHICLE_ID_LOJA_B = "6"` (exemplo)
9. Copiar token: `TOKEN_LOJA_B = "eyJ..."`

**7B: Testar acesso cruzado**

Tentar GET como Loja B, acessando veículo de Loja A:
```bash
TOKEN_LOJA_B="eyJ..."
VEHICLE_ID_LOJA_A="1"

curl -v -H "Authorization: Bearer $TOKEN_LOJA_B" \
  http://localhost:3000/inventory/$VEHICLE_ID_LOJA_A
```

**Esperado:**
- HTTP Status: **403 Forbidden** (RLS bloqueou)
- OU **404 Not Found** (veículo não retornado)
- **NÃO deve** retornar dados do veículo de Loja A

**Resultado:** ✅ AC7 PASS / ❌ AC7 FAIL (retorna 200 + dados)

**Se AC7 falha (consegue acessar dados de outra loja):**
- Multi-tenant QUEBRADA
- Escalar para @dev URGENTE: "RLS não está funcionando"

**7C: Testar acesso próprio (validação positiva)**

Tentar GET como Loja B, acessando seu próprio veículo:
```bash
TOKEN_LOJA_B="eyJ..."
VEHICLE_ID_LOJA_B="6"

curl -H "Authorization: Bearer $TOKEN_LOJA_B" \
  http://localhost:3000/inventory/$VEHICLE_ID_LOJA_B
```

**Esperado:**
- HTTP Status: **200 OK**
- Response: JSON do veículo (deve ter `dealership_id` = Loja B)

**Resultado:** ✅ (confirmação de que query funciona)

---

## Documentação de Resultados

### Arquivo: `docs/qa/tests/ENTREGA-1.4-results.md`

```markdown
# Resultados: ENTREGA-1.4 — Validação de Segurança

**Data:** [data]
**Testador:** [nome]
**Ambiente:** [local / production]
**Status Geral:** ✅ PASSOU / ⚠️ PARCIAL / ❌ FALHOU

## Testes

| AC | Teste | Resultado | HTTP Status |
|----|-------|-----------|-------------|
| AC1 | /metrics sem token | ✅ | 401 |
| AC2 | /metrics com token | ✅ | 200 |
| AC3 | /cache sem token | ✅ | 401 |
| AC4 | /cache com token | ✅ | 200 |
| AC5 | /seed sem secret | ✅ | 403 |
| AC6 | /seed com secret | ⚠️ SKIP | (secret não configurado) |
| AC7 | Isolamento | ✅ | 403/404 |

## Security Summary

✅ Todos endpoints protegidos
✅ RLS funciona (isolamento OK)
✅ Sistema pronto para go-live

## Issues Críticos

- [ ] Nenhum
- [ ] [Se houver]

## Próximas Ações

- [ ] Avisar @devops que pode fazer deploy
- [ ] Iniciar ENTREGA-1.5
```

---

## Dev Notes

### Verificar RLS em Supabase

Se AC7 falhar, validar diretamente no Supabase dashboard:

1. Supabase.com → SQL Editor
2. Executar:
```sql
SELECT tablename FROM pg_tables
WHERE tablename IN ('inventory', 'customers', 'expenses')
AND rowsecurity = true;
```

**Esperado:** 3 linhas (todas com RLS)

Se alguma retorna `false` → RLS não ativado, escalar para @dev

---

### Testar Localmente vs Produção

**Localmente:**
- API: `http://localhost:3000`
- Token: localStorage do browser local

**Produção:**
- API: `https://dealer-sourcing-api.railway.app` (ou conforme configurado)
- Token: extrair do navegador em prod (acessar Vercel URL)

Execute testes em **AMBOS** antes de go-live

---

**Bloqueador:** ENTREGA-1.1/1.2/1.3 devem passar
**Desbloqueador para:** ENTREGA-1.5 (Deploy)
**Crítico:** AC7 isolamento DEVE passar
