#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════
# POST-DEPLOY VALIDATION SCRIPT
# Executar APÓS push para main (aguardar 5-10 min para deploys)
# ═══════════════════════════════════════════════════════════════════════

set -e

TIMESTAMP=$(date '+%Y-%m-%d_%H:%M:%S')
FRONTEND_URL="${FRONTEND_URL:-https://dealer-sourcing-frontend.vercel.app}"
API_URL="${API_BASE_URL:-https://dealer-sourcing-api-production.up.railway.app}"

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  📊 POST-DEPLOY VALIDATION                                    ║"
echo "║  $TIMESTAMP                                     ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════════════════════════
# FASE 1: Wait for Deployments
# ═══════════════════════════════════════════════════════════════════════

echo "⏳ Phase 1: Aguardando deploys finalizarem..."
echo "───────────────────────────────────────────────"

DEPLOY_WAIT=300  # 5 minutos
ELAPSED=0

while [ $ELAPSED -lt $DEPLOY_WAIT ]; do
  if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
    FRONTEND_UP=1
  fi

  if curl -s "$API_URL/health" > /dev/null 2>&1; then
    API_UP=1
  fi

  if [ "$FRONTEND_UP" == "1" ] && [ "$API_UP" == "1" ]; then
    echo "✅ Ambos os serviços estão UP"
    break
  fi

  echo "⏳ Aguardando... ($ELAPSED/$DEPLOY_WAIT segundos)"
  sleep 10
  ELAPSED=$((ELAPSED + 10))
done

if [ "$FRONTEND_UP" != "1" ]; then
  echo "⚠️  Frontend ainda não respondendo após deploy"
  echo "   URL: $FRONTEND_URL"
fi

if [ "$API_UP" != "1" ]; then
  echo "⚠️  API ainda não respondendo após deploy"
  echo "   URL: $API_URL"
fi

# ═══════════════════════════════════════════════════════════════════════
# FASE 2: Run Smoke Tests
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "🧪 Phase 2: Executando Smoke Tests..."
echo "────────────────────────────────────"

if [ -f "./SMOKE_TESTS_PRODUCAO.sh" ]; then
  bash SMOKE_TESTS_PRODUCAO.sh
  SMOKE_TEST_RESULT=$?
else
  echo "⚠️  SMOKE_TESTS_PRODUCAO.sh não encontrado"
  SMOKE_TEST_RESULT=1
fi

# ═══════════════════════════════════════════════════════════════════════
# FASE 3: Check Logs
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "📋 Phase 3: Verificar Logs em Produção"
echo "─────────────────────────────────────"

echo ""
echo "⚠️  AÇÃO MANUAL REQUERIDA:"
echo ""
echo "1️⃣  Vercel Logs:"
echo "   https://vercel.com/dashboard"
echo "   Projeto: dealer-sourcing-frontend"
echo "   Verificar última execução: sucesso ou erro?"
echo ""
echo "2️⃣  Railway Logs:"
echo "   https://railway.app/dashboard"
echo "   Projeto: backend"
echo "   Verificar último deploy: sucesso ou erro?"
echo "   Procurar por: 'error', 'failed', 'exception'"
echo ""
echo "3️⃣  Sentry Error Tracking:"
echo "   https://sentry.io/organizations/[org]/issues/"
echo "   Filtrar últimos 30 min"
echo "   Esperado: nenhum erro crítico novo"
echo ""

# ═══════════════════════════════════════════════════════════════════════
# FASE 4: Database Validation
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "💾 Phase 4: Database Validation"
echo "────────────────────────────────"

# Teste rápido de conectividade
if curl -s "$API_URL/health" | grep -q "ok"; then
  echo "✅ Database conectado (via health check)"
else
  echo "⚠️  Database status indeterminado"
fi

# ═══════════════════════════════════════════════════════════════════════
# FASE 5: Frontend Smoke Test
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "🖥️  Phase 5: Frontend Accessibility Check"
echo "──────────────────────────────────────────"

RESPONSE=$(curl -s -I "$FRONTEND_URL" 2>/dev/null || echo "ERROR")

if echo "$RESPONSE" | grep -q "200\|301\|302"; then
  echo "✅ Frontend retornando HTTP 200/301/302"

  # Check for basic HTML
  CONTENT=$(curl -s "$FRONTEND_URL" 2>/dev/null | head -c 500)
  if echo "$CONTENT" | grep -q "<html\|<body\|<div"; then
    echo "✅ HTML válido retornado"
  else
    echo "⚠️  Resposta pode não ser HTML válido"
  fi
else
  echo "❌ Frontend retornou erro HTTP"
fi

# ═══════════════════════════════════════════════════════════════════════
# PHASE 6: Performance Check
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "⚡ Phase 6: Performance Baseline"
echo "─────────────────────────────────"

echo "Frontend response time:"
START=$(date +%s%N)
curl -s -o /dev/null -w "%{time_total}s\n" "$FRONTEND_URL"
END=$(date +%s%N)

echo ""
echo "API response time:"
curl -s -o /dev/null -w "%{time_total}s\n" "$API_URL/health"

echo ""
echo "📝 Esperado: <3s ambos os serviços"

# ═══════════════════════════════════════════════════════════════════════
# PHASE 7: Summary Report
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  📊 VALIDATION SUMMARY                                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

if [ $SMOKE_TEST_RESULT -eq 0 ]; then
  echo "✅ SMOKE TESTS PASSARAM"
  echo ""
  echo "Status: ✅ DEPLOY BEM-SUCEDIDO"
  echo ""
  echo "Próximos passos:"
  echo "1. Monitorar Sentry por 1h para erros"
  echo "2. Verificar logs se houver problemas"
  echo "3. Notificar cliente de deploy bem-sucedido"
  echo ""
  exit 0
else
  echo "❌ SMOKE TESTS FALHARAM"
  echo ""
  echo "Status: ⚠️  DEPLOY POTENCIALMENTE PROBLEMÁTICO"
  echo ""
  echo "Ações recomendadas:"
  echo "1. Verificar logs no Vercel/Railway"
  echo "2. Procurar por erros críticos"
  echo "3. Se necessário, executar rollback:"
  echo ""
  echo "   git log --oneline -2"
  echo "   git revert [BAD_COMMIT]"
  echo "   git push origin main"
  echo "   Aguardar 5 min"
  echo "   bash SMOKE_TESTS_PRODUCAO.sh"
  echo ""
  exit 1
fi
