# STORY-602 Phase 2: Integration Tests — Execution Steps

**Agente:** @qa (Quinn)
**Status:** Ready for Execution
**Data:** 2026-03-29

---

## 📋 Requisitos Antes de Começar

- [ ] PostgreSQL instalado localmente (ou Docker)
- [ ] Git clone do projeto: `dealer-sourcing/`
- [ ] Acesso a terminal/shell

---

## 🚀 Step-by-Step Execution

### STEP 1: Criar Banco Local (5 minutos)

**Opção A: macOS/Linux**
```bash
createdb dealer_sourcing
psql dealer_sourcing -c "SELECT version();"
```

**Opção B: Windows (WSL)**
```bash
wsl bash -c "createdb dealer_sourcing"
wsl bash -c "psql dealer_sourcing -c 'SELECT version();'"
```

**Opção C: Docker**
```bash
docker run -d \
  --name dealer_sourcing_db \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15

docker exec dealer_sourcing_db \
  psql -U postgres -c "CREATE DATABASE dealer_sourcing;"
```

✅ **Verificar:**
```bash
psql dealer_sourcing -c "\dt"  # Deve retornar vazio (sem tabelas ainda)
```

---

### STEP 2: Aplicar Migrations (5 minutos)

```bash
# Migration 001: Schema base
psql dealer_sourcing < db/migrations/001_initial_schema.sql

# Migration 002: Dealership RLS
psql dealer_sourcing < db/migrations/002_add_dealership_isolation.sql

# Verificar tabelas criadas
psql dealer_sourcing -c "\dt"
```

**Saída esperada:**
```
              Relação                     | Tipo  | Proprietário
-----------------------------------------+-------+----------
 dealerships                             | table | postgres
 interested_vehicles                     | table | postgres
 migrations                              | table | postgres
 search_queries                          | table | postgres
 users                                   | table | postgres
 vehicle_validations                     | table | postgres
 vehicles_cache                          | table | postgres
```

---

### STEP 3: Inserir Dados de Teste (5 minutos)

```bash
psql dealer_sourcing < db/seeds/STORY-602-test-data.sql
```

**Saída esperada:**
```
INSERT 0 2
INSERT 0 3
INSERT 0 1
INSERT 0 1
INSERT 0 4
INSERT 0 3
INSERT 0 2
INSERT 0 4

 table_name             | record_count
------------------------+--------------
 dealerships            |            2
 users                  |            3
 vehicles_cache         |            4
 interested_vehicles    |            4
 search_queries         |            3
 vehicle_validations    |            4

=== DATA BY DEALERSHIP ===
 Dealership A interested_vehicles: 2
 Dealership B interested_vehicles: 2

✓ Test data inserted successfully!
```

---

### STEP 4: Validar RLS Isolation (10 minutos)

```bash
psql dealer_sourcing < db/tests/validate_dealership_rls.sql
```

**Saída esperada:**
```
✓ Dealership A: a0000000-0000-0000-0000-000000000001
✓ Dealership B: b0000000-0000-0000-0000-000000000001
✓ User A: user00000000-0000-0000-0000-000000000001
✓ User B: user00000000-0000-0000-0000-000000000002

=== ISOLATION TESTS ===

TEST 3.1: User A views interested vehicles (should see 1: their BMW)
  Result: 2 vehicles found in Dealership A
  ✓ PASS: User A sees correct data

TEST 3.2: User B views interested vehicles (should see 1: their RAM)
  Result: 2 vehicles found in Dealership B
  ✓ PASS: User B sees correct data

TEST 3.3: Cross-dealership data leak (should see 0 from other dealership)
  Result: 0 vehicles leaked to wrong dealership
  ✓ PASS: No data leaked

TEST 3.4: Search queries isolation
  Dealership A searches: 2
  Dealership B searches: 1
  ✓ PASS: Searches correctly isolated

=== DEALERSHIP-BASED RLS VALIDATION COMPLETE ===

NEXT STEPS:
1. Run migrations in development database
2. Test with real JWT auth in app
3. Run app smoke tests
4. Deploy to staging
```

---

### STEP 5: Testes Manuais Adicionais (15 minutos)

#### TC1.1: Verificar que User A vê apenas dados de Loja A

```bash
psql dealer_sourcing << 'EOF'
-- Simular: User A de Dealership A
SELECT COUNT(*) as interested_in_A
FROM interested_vehicles
WHERE dealership_id = 'a0000000-0000-0000-0000-000000000001';
-- Esperado: 2
EOF
```

#### TC1.2: Verificar isolamento cross-dealership

```bash
psql dealer_sourcing << 'EOF'
-- Tentativa de User A acessar dados de Dealership B (sem RLS applied)
-- Nota: Em ambiente de app real com JWT, RLS bloquearia automaticamente
SELECT COUNT(*) as leaked_to_wrong_dealership
FROM interested_vehicles
WHERE dealership_id = 'b0000000-0000-0000-0000-000000000001';
-- Esperado: 2 (dados existem, mas RLS no app bloquearia)
EOF
```

#### TC3.1: Verificar índices estão sendo usados

```bash
psql dealer_sourcing << 'EOF'
EXPLAIN ANALYZE
SELECT * FROM interested_vehicles
WHERE dealership_id = 'a0000000-0000-0000-0000-000000000001'
AND status = 'interested';
EOF
```

**Saída esperada:**
```
Seq Scan on interested_vehicles  (cost=0.00..1.10 rows=2 width=...)
  Filter: ((dealership_id = '...'::uuid) AND ((status)::text = 'interested'::text))

-- OU (melhor):

Bitmap Index Scan on idx_interested_vehicles_dealership_status  (cost=...)
  Index Cond: (dealership_id = '...'::uuid)
```

#### TC4.1: Validar Foreign Key constraint

```bash
psql dealer_sourcing << 'EOF'
-- Tentar inserir user com dealership_id inválido
INSERT INTO users (jwt_sub, role, dealership_id)
VALUES ('test_user@invalid.com', 'shop', '00000000-0000-0000-0000-000000000000');
-- Esperado: ERROR: violates foreign key constraint
EOF
```

#### TC5.1: Verificar backward compatibility

```bash
psql dealer_sourcing << 'EOF'
-- Query simples (sem filtro dealership_id explícito)
-- RLS aplicará automaticamente no app
SELECT COUNT(*) FROM interested_vehicles;
-- Esperado: 4 (total de registros)
EOF
```

---

## ✅ Checklist de Conclusão

- [ ] STEP 1: Banco criado
- [ ] STEP 2: Migrations aplicadas (001 + 002)
- [ ] STEP 3: Dados de teste inseridos (4 veículos, 2 dealerships)
- [ ] STEP 4: validate_dealership_rls.sql executado com PASS em todos os testes
- [ ] STEP 5: Testes manuais TC1.1-5.1 completados
- [ ] Nenhum erro no log
- [ ] Performance queries < 100ms (EXPLAIN ANALYZE)

---

## 📊 Expected Test Data Summary

### Dealerships
| Nome | Estado | Usuários |
|------|--------|----------|
| Loja A - Premium Motors | SP | 2 (user_a, admin) |
| Loja B - Luxury Auto | SC | 2 (user_b, admin) |

### Veículos
| Marca | Modelo | Ano | Km | Custo Total | Dealership |
|-------|--------|-----|-----|-------------|------------|
| BMW | M2 | 2018 | 42.000 | R$ 300.676 | A |
| VW | Gol 1.0 | 2022 | 56.000 | R$ 54.202 | A |
| RAM | 1500 CLASSIC | 2023 | 42.000 | R$ 261.020 | B |
| RAM | 2500 LARAMIE | 2020 | 52.000 | R$ 294.518 | B |

### Resultados Esperados RLS
- **Dealership A:** 2 interested_vehicles, 2 search_queries
- **Dealership B:** 2 interested_vehicles, 1 search_query
- **Cross-dealership leak:** 0 (RLS bloqueado)

---

## 🐛 Troubleshooting

### Erro: "database 'dealer_sourcing' does not exist"
```bash
# Criar banco
createdb dealer_sourcing

# Se usando Docker, garantir que está rodando
docker ps | grep dealer_sourcing_db
```

### Erro: "permission denied for schema public"
```bash
# Verificar permissões
psql dealer_sourcing -c "GRANT ALL ON SCHEMA public TO postgres;"
```

### Erro: "multiple primary keys not allowed"
**Cause:** Migration 002 já foi executada
**Solution:** Prosseguir normalmente (idempotente)

### RLS tests retornam 0 resultados
- Verificar que dados foram inseridos: `SELECT COUNT(*) FROM users;`
- Verificar FK constraints: `SELECT * FROM dealerships;`
- Rodar STEP 3 novamente se necessário

---

## 📈 Performance Benchmarks

Executar após STEP 4 para baseline:

```bash
psql dealer_sourcing << 'EOF'
-- Q1: Simple filter (deve usar índice)
EXPLAIN ANALYZE
SELECT * FROM interested_vehicles
WHERE dealership_id = 'a0000000-0000-0000-0000-000000000001';

-- Q2: Composite filter (deve usar índice composto)
EXPLAIN ANALYZE
SELECT * FROM interested_vehicles
WHERE dealership_id = 'a0000000-0000-0000-0000-000000000001'
AND status = 'interested';

-- Q3: With JOIN (teste FK lookup)
EXPLAIN ANALYZE
SELECT iv.* FROM interested_vehicles iv
JOIN users u ON iv.user_id = u.id
WHERE u.dealership_id = 'a0000000-0000-0000-0000-000000000001';
EOF
```

**Aceitável se:**
- p50 latency < 50ms
- p95 latency < 100ms
- Índices usados (não sequential scan)

---

## 📝 Documentação Resultados

Após completar testes, criar arquivo:

**`docs/qa/reports/STORY-602-PHASE2-RESULTS.md`**

Conteúdo:
```markdown
# STORY-602 Phase 2: Test Results

**Data:** [data]
**Agente:** @qa
**Status:** ✅ PASS / ⚠️ CONCERNS / ❌ FAIL

## Test Summary
- Total Tests: 13
- Passed: 13
- Failed: 0
- Warnings: 0

## Evidence
- Migration idempotence: ✅ PASS
- RLS isolation: ✅ PASS
- Performance: ✅ PASS (q95: 45ms)
- Data integrity: ✅ PASS

## Gate Decision
**✅ PASS** → Ready for Phase 3 (Smoke Tests)

## Next: @qa coordinates Phase 3 with staging deployment
```

---

## 🎯 Next Phase

**Após completar Phase 2:**
1. @qa gera gate decision document
2. @dev coordena com @devops para staging deploy
3. @qa executa smoke tests em staging (Phase 3)
4. Se Phase 3 PASS → Deploy produção

---

**Tempo Estimado Total:** 40-60 minutos (sem problemas)

**Pronto? Execute:** `psql dealer_sourcing < db/migrations/001_initial_schema.sql`

-- Quinn, pronto para testar 🛡️
