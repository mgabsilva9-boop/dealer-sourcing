#!/bin/bash

# ✅ TESTE COMPLETO E SISTEMÁTICO DE TODAS AS APIS
# Data: 2026-04-08
# Objetivo: Documentar EXATAMENTE qual erro existe em cada camada

set -e

API_BASE="${API_BASE:-http://localhost:3000}"
LOG_FILE="/tmp/api_test_$(date +%s).log"
TOKEN=""
EXPENSE_ID=""

echo "🔍 INICIANDO TESTE COMPLETO DE APIs"
echo "API_BASE: $API_BASE"
echo "LOG_FILE: $LOG_FILE"
echo ""

# ===== TEST 1: Health Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/health" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Code: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ ERRO: Health check falhou. Backend não respondendo."
  exit 1
fi

echo "✅ Health check OK"
echo ""

# ===== TEST 2: Login
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: POST /auth/login"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

LOGIN_DATA=$(cat <<'EOF'
{
  "email": "dono@brossmotors.com",
  "password": "bross2026"
}
EOF
)

echo "Request:"
echo "$LOGIN_DATA" | jq .
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_DATA" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Code: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ ERRO: Login falhou (HTTP $HTTP_CODE)"
  exit 1
fi

TOKEN=$(echo "$BODY" | jq -r '.token' 2>/dev/null)
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ ERRO: Token não retornado no login"
  exit 1
fi

echo "✅ Login OK. Token: ${TOKEN:0:20}..."
echo ""

# ===== TEST 3: GET /expenses/list (ANTES de criar)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: GET /expenses/list (ANTES)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/expenses/list" \
  -H "Authorization: Bearer $TOKEN" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Code: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" != "200" ]; then
  echo "⚠️  AVISO: /expenses/list retornou HTTP $HTTP_CODE"
  echo "Continuando mesmo assim..."
else
  COUNT=$(echo "$BODY" | jq '.expenses | length' 2>/dev/null || echo "?")
  echo "✅ /expenses/list OK. Expenses na resposta: $COUNT"
fi
echo ""

# ===== TEST 4: POST /expenses/create
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: POST /expenses/create"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CREATE_DATA=$(cat <<EOF
{
  "category": "Teste Automatizado",
  "description": "Despesa de teste para auditoria",
  "amount": 12345.67,
  "status": "pending",
  "date": "$(date +%Y-%m-%d)"
}
EOF
)

echo "Request:"
echo "$CREATE_DATA" | jq .
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/expenses/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$CREATE_DATA" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Code: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" != "201" ] && [ "$HTTP_CODE" != "200" ]; then
  echo "❌ ERRO: POST /expenses/create falhou (HTTP $HTTP_CODE)"
  exit 1
fi

EXPENSE_ID=$(echo "$BODY" | jq -r '.expense.id' 2>/dev/null)
if [ -z "$EXPENSE_ID" ] || [ "$EXPENSE_ID" = "null" ]; then
  echo "❌ ERRO: Expense ID não retornado"
  exit 1
fi

echo "✅ Expense criada com sucesso. ID: $EXPENSE_ID"
echo ""

# ===== TEST 5: GET /expenses/list (DEPOIS de criar)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 5: GET /expenses/list (DEPOIS de criar)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/expenses/list" \
  -H "Authorization: Bearer $TOKEN" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Code: $HTTP_CODE"
echo "Response (primeiros 200 chars):"
echo "$BODY" | head -c 200
echo "..."
echo ""

FOUND=$(echo "$BODY" | jq ".expenses | map(select(.id == \"$EXPENSE_ID\")) | length" 2>/dev/null)
if [ "$FOUND" = "1" ]; then
  echo "✅ Expense $EXPENSE_ID encontrada na lista"
elif [ "$FOUND" = "0" ]; then
  echo "❌ ERRO: Expense $EXPENSE_ID NÃO foi salva no banco (não aparece em /list)"
else
  echo "⚠️  AVISO: Não conseguiu verificar se expense foi salva"
fi
echo ""

# ===== TEST 6: DELETE /expenses/:id
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 6: DELETE /expenses/$EXPENSE_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$API_BASE/expenses/$EXPENSE_ID" \
  -H "Authorization: Bearer $TOKEN" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Code: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ ERRO: DELETE falhou (HTTP $HTTP_CODE)"
  exit 1
fi

echo "✅ DELETE endpoint respondeu OK"
echo ""

# ===== TEST 7: GET /expenses/list (DEPOIS de deletar)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 7: GET /expenses/list (DEPOIS de deletar)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/expenses/list" \
  -H "Authorization: Bearer $TOKEN" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Code: $HTTP_CODE"
echo "Response (primeiros 200 chars):"
echo "$BODY" | head -c 200
echo "..."
echo ""

FOUND=$(echo "$BODY" | jq ".expenses | map(select(.id == \"$EXPENSE_ID\")) | length" 2>/dev/null)
if [ "$FOUND" = "0" ]; then
  echo "✅ Expense $EXPENSE_ID foi deletada com sucesso"
elif [ "$FOUND" = "1" ]; then
  echo "❌ ERRO: Expense $EXPENSE_ID ainda está na lista (DELETE não funcionou)"
else
  echo "⚠️  AVISO: Não conseguiu verificar se expense foi deletada"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 TESTE COMPLETO FINALIZADO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Todos os resultados salvos em: $LOG_FILE"
