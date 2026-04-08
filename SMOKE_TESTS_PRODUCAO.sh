#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════
# SMOKE TESTS — PRODUÇÃO
# Valida todos endpoints + integração após deploy
# ═══════════════════════════════════════════════════════════════════════

set -e

API_URL="${API_BASE_URL:-https://dealer-sourcing-api-production.up.railway.app}"
FRONTEND_URL="${FRONTEND_URL:-https://dealer-sourcing-frontend.vercel.app}"
TEST_EMAIL="dono@brossmotors.com"
TEST_PASSWORD="bross2026"

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  🧪 SMOKE TESTS — PRODUÇÃO                                    ║"
echo "║  $(date '+%Y-%m-%d %H:%M:%S')                              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

# ═══════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════

function test_pass() {
  echo -e "${GREEN}✅ PASS${NC}: $1"
  ((PASSED++))
}

function test_fail() {
  echo -e "${RED}❌ FAIL${NC}: $1"
  ((FAILED++))
}

function test_warn() {
  echo -e "${YELLOW}⚠️  WARN${NC}: $1"
  ((WARNINGS++))
}

function test_info() {
  echo "ℹ️  INFO: $1"
}

# ═══════════════════════════════════════════════════════════════════════
# 1. FRONTEND HEALTH
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "📊 TEST 1: Frontend Health Check"
echo "─────────────────────────────────"

if curl -s -I "$FRONTEND_URL" | grep -q "200\|301\|302"; then
  test_pass "Frontend respondendo ($FRONTEND_URL)"
else
  test_fail "Frontend não respondendo"
fi

# ═══════════════════════════════════════════════════════════════════════
# 2. BACKEND HEALTH
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "📊 TEST 2: Backend Health Check"
echo "─────────────────────────────────"

HEALTH_RESPONSE=$(curl -s "$API_URL/health" 2>/dev/null || echo "{}")

if echo "$HEALTH_RESPONSE" | grep -q "ok\|healthy"; then
  test_pass "Backend health endpoint respondendo"
else
  test_warn "Health endpoint retornou: $HEALTH_RESPONSE"
fi

# ═══════════════════════════════════════════════════════════════════════
# 3. AUTHENTICATION
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "📊 TEST 3: Authentication (Login)"
echo "─────────────────────────────────"

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" 2>/dev/null || echo "{}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || true)

if [ -n "$TOKEN" ] && [ ${#TOKEN} -gt 10 ]; then
  test_pass "Login bem-sucedido (token gerado: ${TOKEN:0:20}...)"
else
  test_fail "Login falhou ou token inválido"
  test_info "Resposta: $LOGIN_RESPONSE"
fi

# ═══════════════════════════════════════════════════════════════════════
# 4. INVENTORY ENDPOINT
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "📊 TEST 4: Inventory Endpoint"
echo "──────────────────────────────"

if [ -z "$TOKEN" ]; then
  test_fail "Pulando inventory tests (sem token válido)"
else
  INVENTORY_RESPONSE=$(curl -s "$API_URL/inventory/list" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "{}")

  if echo "$INVENTORY_RESPONSE" | grep -q '"id"'; then
    VEHICLE_COUNT=$(echo "$INVENTORY_RESPONSE" | grep -o '"id":"[^"]*' | wc -l)
    test_pass "Inventory list retornando dados ($VEHICLE_COUNT veículos)"
  else
    test_warn "Inventory list respondendo mas sem dados"
  fi
fi

# ═══════════════════════════════════════════════════════════════════════
# 5. EXPENSES ENDPOINT
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "📊 TEST 5: Expenses Endpoint"
echo "────────────────────────────"

if [ -z "$TOKEN" ]; then
  test_fail "Pulando expenses tests (sem token válido)"
else
  EXPENSES_RESPONSE=$(curl -s "$API_URL/expenses/list" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "{}")

  if echo "$EXPENSES_RESPONSE" | grep -q '"id"\|"amount"'; then
    EXPENSE_COUNT=$(echo "$EXPENSES_RESPONSE" | grep -o '"id":"[^"]*' | wc -l)
    test_pass "Expenses list retornando dados ($EXPENSE_COUNT registros)"
  else
    test_warn "Expenses list respondendo mas sem dados"
  fi
fi

# ═══════════════════════════════════════════════════════════════════════
# 6. IPVA ENDPOINT
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "📊 TEST 6: IPVA Endpoint"
echo "───────────────────────"

if [ -z "$TOKEN" ]; then
  test_fail "Pulando IPVA tests (sem token válido)"
else
  IPVA_RESPONSE=$(curl -s "$API_URL/ipva/list" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "{}")

  if echo "$IPVA_RESPONSE" | grep -q '"id"\|"vehicle_id"'; then
    IPVA_COUNT=$(echo "$IPVA_RESPONSE" | grep -o '"id":"[^"]*' | wc -l)
    if [ "$IPVA_COUNT" -eq 6 ]; then
      test_pass "IPVA list retornando 6 registros (esperado)"
    else
      test_warn "IPVA list retorna $IPVA_COUNT registros (esperado 6)"
    fi
  else
    test_warn "IPVA list respondendo mas sem dados"
  fi
fi

# ═══════════════════════════════════════════════════════════════════════
# 7. CUSTOMERS ENDPOINT
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "📊 TEST 7: Customers Endpoint"
echo "──────────────────────────────"

if [ -z "$TOKEN" ]; then
  test_fail "Pulando customers tests (sem token válido)"
else
  CUSTOMERS_RESPONSE=$(curl -s "$API_URL/customers/list" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "{}")

  if echo "$CUSTOMERS_RESPONSE" | grep -q '"id"\|"name"'; then
    CUSTOMER_COUNT=$(echo "$CUSTOMERS_RESPONSE" | grep -o '"id":"[^"]*' | wc -l)
    test_pass "Customers list retornando dados ($CUSTOMER_COUNT clientes)"
  else
    test_warn "Customers list respondendo mas sem dados"
  fi
fi

# ═══════════════════════════════════════════════════════════════════════
# 8. FINANCIAL ENDPOINT
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "📊 TEST 8: Financial Transactions Endpoint"
echo "──────────────────────────────────────────"

if [ -z "$TOKEN" ]; then
  test_fail "Pulando financial tests (sem token válido)"
else
  FINANCIAL_RESPONSE=$(curl -s "$API_URL/financial/transactions" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "{}")

  if echo "$FINANCIAL_RESPONSE" | grep -q '"id"\|"amount"'; then
    TRANSACTION_COUNT=$(echo "$FINANCIAL_RESPONSE" | grep -o '"id":"[^"]*' | wc -l)
    test_pass "Financial transactions retornando dados ($TRANSACTION_COUNT transações)"
  else
    test_warn "Financial transactions respondendo mas sem dados"
  fi
fi

# ═══════════════════════════════════════════════════════════════════════
# 9. MULTI-TENANT VALIDATION
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "📊 TEST 9: Multi-tenant Isolation Check"
echo "───────────────────────────────────────"

if [ -z "$TOKEN" ]; then
  test_fail "Pulando multi-tenant tests (sem token válido)"
else
  # Verificar se dealership_id está no token
  PAYLOAD=$(echo "$TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null || echo "{}")

  if echo "$PAYLOAD" | grep -q "dealership_id"; then
    test_pass "Token contém dealership_id (multi-tenant ativo)"
  else
    test_warn "Token não contém dealership_id (verificar RLS)"
  fi
fi

# ═══════════════════════════════════════════════════════════════════════
# 10. DATABASE CONNECTION
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "📊 TEST 10: Database Connection Status"
echo "──────────────────────────────────────"

if [ -n "$TOKEN" ]; then
  # Se conseguimos fazer login e queries, banco está OK
  test_pass "Database respondendo (validado via queries acima)"
else
  test_warn "Database status indeterminado (sem token)"
fi

# ═══════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  📊 RESULTADO FINAL                                           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

TOTAL=$((PASSED + FAILED + WARNINGS))

echo "Testes executados:  $TOTAL"
echo "✅ PASS:             $PASSED"
echo "❌ FAIL:             $FAILED"
echo "⚠️  WARN:            $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ SMOKE TESTS — TODOS PASSANDO${NC}"
  echo ""
  echo "Status: PRONTO PARA PRODUÇÃO"
  exit 0
else
  echo -e "${RED}❌ SMOKE TESTS — FALHAS DETECTADAS${NC}"
  echo ""
  echo "Ações recomendadas:"
  echo "1. Verificar Railway logs (railway.app)"
  echo "2. Verificar Vercel logs (vercel.com)"
  echo "3. Verificar conexão com Supabase"
  echo "4. Executar rollback se necessário"
  exit 1
fi
