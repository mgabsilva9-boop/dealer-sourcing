# STORY-602: Legacy Table RLS Configuration

**Status:** Phase 1 Complete (Migration Created)
**Agente:** @data-engineer (Dara)
**Data:** 2026-03-29
**Ticket:** STORY-602

---

## Resumo Executivo

Migramos o sistema de isolamento de dados de **user-based isolation** (inadequado) para **dealership-based isolation** (multi-tenant):

- ✅ Criada tabela `dealerships` com seed de 2 lojas de teste
- ✅ Adicionada coluna `dealership_id` a todas as 5 tabelas existentes
- ✅ Criadas foreign keys e índices para performance
- ✅ Reconstruídas RLS policies para isolamento por dealership
- ✅ Criado script de validação e teste

**Impacto:**
- Antes: Usuário de uma loja poderia ver dados de outra loja (violação de segurança)
- Depois: RLS garante que dados são isolados por dealership automaticamente em queries

---

## Arquivos Criados / Modificados

### Novos Arquivos

| Arquivo | Propósito |
|---------|-----------|
| `db/migrations/002_add_dealership_isolation.sql` | **Migration principal** - adiciona dealership_id e reconstrói RLS |
| `db/tests/validate_dealership_rls.sql` | Script de validação com testes automatizados |
| `db/STORY-602-MIGRATION-GUIDE.md` | Este documento |

### Nenhum arquivo modificado
(As mudanças são adicionadas via migration idempotente)

---

## O Que Mudou no Schema

### Tabela Nova: `dealerships`

```sql
CREATE TABLE dealerships (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Seed Data (de teste):**
- Loja A: "Loja A - Premium Motors" (SP)
- Loja B: "Loja B - Luxury Auto" (SC)

### Coluna Adicionada: `dealership_id` UUID

Adicionada a **todas as 5 tabelas**:
- `users` → Identifica qual dealership o usuário pertence
- `interested_vehicles` → Isolamento de lista de interesse por dealership
- `search_queries` → Isolamento de histórico de busca por dealership
- `vehicle_validations` → Isolamento de validações por dealership
- `vehicles_cache` → Rastreamento de quem criou o cache (auditoria)

**Backfill Strategy:**
- Todos os dados existentes foram atribuídos à Loja A (padrão)
- Em produção, será realocado corretamente via admin UI

### RLS Policies - Antes vs Depois

**ANTES (Inseguro):**
```sql
-- Qualquer um via auth.uid() consegue ver dados de qualquer user
CREATE POLICY "interested_vehicles_user_isolation" ON interested_vehicles
  FOR SELECT USING (auth.uid() = user_id OR role = 'owner');
```

**DEPOIS (Seguro - Dealership-based):**
```sql
-- Usuário só vê dados da SUA dealership, não de outras
CREATE POLICY "interested_vehicles_dealership_isolation" ON interested_vehicles
  FOR SELECT USING (
    dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid() LIMIT 1)
  );
```

### Índices Adicionados

Performance: índices compostos com `dealership_id` como coluna líder:

```sql
CREATE INDEX idx_users_dealership_role ON users(dealership_id, role);
CREATE INDEX idx_interested_vehicles_dealership_status ON interested_vehicles(dealership_id, status);
CREATE INDEX idx_search_queries_dealership_user ON search_queries(dealership_id, user_id);
CREATE INDEX idx_vehicle_validations_dealership_validated_by ON vehicle_validations(dealership_id, validated_by);
```

---

## Como Executar

### 1. Local Development (WSL/macOS/Linux)

```bash
# Criar banco de dados local (se não existir)
createdb dealer_sourcing

# Executar migration 001 (se ainda não feito)
psql dealer_sourcing < db/migrations/001_initial_schema.sql

# Executar migration 002 (dealership isolation)
psql dealer_sourcing < db/migrations/002_add_dealership_isolation.sql

# Validar com testes automatizados
psql dealer_sourcing < db/tests/validate_dealership_rls.sql
```

**Saída esperada:**
```
✓ Dealership A: <uuid>
✓ Dealership B: <uuid>
✓ User A: <uuid>
✓ User B: <uuid>
...
TEST 3.1: ... ✓ PASS: User A sees correct data
TEST 3.2: ... ✓ PASS: User B sees correct data
TEST 3.3: ... ✓ PASS: No data leaked
TEST 3.4: ... ✓ PASS: Searches correctly isolated
```

### 2. Production (Railway Supabase)

```bash
# Opção A: Via Supabase Dashboard
# 1. Abrir https://supabase.com → Seu projeto
# 2. SQL Editor → Nova query
# 3. Copiar/colar conteúdo de migrations/002_add_dealership_isolation.sql
# 4. Executar

# Opção B: Via CLI
supabase migration push  # Se usando Supabase CLI
```

### 3. Validar no App

1. **Login com 2 usuários diferentes (dealerships diferentes)**
2. **Verificar isolamento:**
   - User A salva um veículo → User B não consegue ver
   - User A faz busca → User B não consegue ver histórico
   - Cross-dealership queries retornam 0 registros ✓

---

## Impacto no Código do App

### Mudanças Necessárias no Frontend/Backend

**Se usando Supabase.js:**
```typescript
// Antes
const { data } = await supabase
  .from('interested_vehicles')
  .select('*')
  .eq('user_id', userId);  // ❌ Não considerava dealership

// Depois
// Não precisa mudar! RLS funciona automaticamente:
const { data } = await supabase
  .from('interested_vehicles')
  .select('*');  // ✓ RLS retorna apenas dados da dealership do user
```

**Por quê?** RLS é aplicada automaticamente pelo Supabase quando:
1. O JWT do usuário está autenticado
2. A função `auth.uid()` retorna o user_id
3. A policy verifica `dealership_id` via subquery

**Nenhuma mudança necessária no código!** RLS é transparente.

---

## Validação de Segurança

### Teste de Vazamento de Dados

```sql
-- Simular User A tentando ver dados de User B
SELECT * FROM interested_vehicles
WHERE dealership_id != (SELECT dealership_id FROM users WHERE id = auth.uid() LIMIT 1);
-- Resultado esperado: 0 registros (RLS bloqueia)
```

### Teste de Autorização

```sql
-- User sem dealership_id válida
INSERT INTO users (jwt_sub, role, dealership_id) VALUES ('invalid@test.com', 'shop', 'non-existent-uuid');
-- Resultado esperado: Erro de FK constraint (segurança de banco)
```

---

## Próximos Passos (STORY-602 Phase 2-4)

### Phase 2: Testes de Integração (QA)
- [ ] Executar `validate_dealership_rls.sql` em staging
- [ ] Verificar RLS com real JWT auth
- [ ] Teste de multi-tenant isolation com 2+ usuários simultâneos

### Phase 3: Smoke Tests
- [ ] Rodar suite de testes do backend (Jest/Supertest)
- [ ] Verificar que queries respeitam RLS
- [ ] CodeRabbit self-healing check

### Phase 4: Deploy & Monitoring
- [ ] Deploy migration para produção (Railway)
- [ ] Validar performance (índices funcionando?)
- [ ] Criar alertas para violações de RLS (audit log)

---

## Troubleshooting

### Erro: "dealership_id" column already exists
**Causa:** Migration 002 já foi executada
**Solução:** Prosseguir normalmente (IF NOT EXISTS garante idempotência)

### Erro: "users don't have dealership_id assigned"
**Causa:** Dados antigos sem dealership_id
**Solução:** Executar backfill manual:
```sql
UPDATE users
SET dealership_id = (SELECT id FROM dealerships WHERE name LIKE 'Loja A%' LIMIT 1)
WHERE dealership_id IS NULL;
```

### RLS queries retornam 0 resultados
**Causa:** Possível
1. Usuário não tem dealership_id atribuído
2. JWT não contém user_id válido
3. Policy tiene bug (revisar lógica)

**Debug:**
```sql
-- Verificar dealership do usuário logado
SELECT dealership_id FROM users WHERE id = auth.uid();

-- Verificar policy em detalhe
SELECT tablename, policyname, using_expression
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'interested_vehicles';
```

---

## Documentação de Referência

- **CLAUDE.md:** Instruções de segurança multi-tenant
- **docs/database/:** Documentação de schema (será atualizada)
- **Supabase Docs:** [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## Checklist de Conclusão (STORY-602)

- [x] Phase 1 - Create Migration
  - [x] `dealerships` table created
  - [x] `dealership_id` added to all 5 tables
  - [x] Foreign keys + indexes created
  - [x] RLS policies rebuilt
  - [x] Validation script created

- [ ] Phase 2 - Integration Tests (QA responsibility)
- [ ] Phase 3 - Smoke Tests (QA responsibility)
- [ ] Phase 4 - Deploy & Monitor (DevOps responsibility)

---

**Próximo Agente:** @qa (Quinn) para Phase 2 - Integration Testing

-- Dara, arquitetando dados ✓
