#!/bin/bash

# Script de Testes de Segurança — Garagem MVP
# Executar após login válido para ter um token

API_URL="http://localhost:3000"
# Para produção, substituir por URL do Railway:
# API_URL="https://dealer-sourcing-api.railway.app"

echo "=== TESTES DE SEGURANÇA ==="
echo ""

# ============================================
# 1. GET /metrics SEM TOKEN → 401
# ============================================
echo "1. Teste: GET /metrics SEM token"
echo "   Esperado: 401 Unauthorized"
echo "   Comando:"
echo "   curl -X GET $API_URL/metrics"
echo ""
curl -v -X GET $API_URL/metrics 2>&1 | grep -E "HTTP/|Unauthorized"
echo ""
echo "---"
echo ""

# ============================================
# 2. GET /metrics COM TOKEN → 200
# ============================================
echo "2. Teste: GET /metrics COM token válido"
echo "   Esperado: 200 OK + JSON de métricas"
echo "   Comando (substitua TOKEN):"
echo "   curl -X GET $API_URL/metrics -H 'Authorization: Bearer TOKEN'"
echo ""
echo "   (Executar manualmente após extrair token de localStorage)"
echo ""
echo "---"
echo ""

# ============================================
# 3. DELETE /api/cache/flush SEM TOKEN → 401
# ============================================
echo "3. Teste: DELETE /api/cache/flush SEM token"
echo "   Esperado: 401 Unauthorized"
echo "   Comando:"
echo "   curl -X DELETE $API_URL/api/cache/flush"
echo ""
curl -v -X DELETE $API_URL/api/cache/flush 2>&1 | grep -E "HTTP/|Unauthorized"
echo ""
echo "---"
echo ""

# ============================================
# 4. DELETE /api/cache/flush COM TOKEN → 200
# ============================================
echo "4. Teste: DELETE /api/cache/flush COM token válido"
echo "   Esperado: 200 OK"
echo "   Comando (substitua TOKEN):"
echo "   curl -X DELETE $API_URL/api/cache/flush -H 'Authorization: Bearer TOKEN'"
echo ""
echo "   (Executar manualmente após extrair token de localStorage)"
echo ""
echo "---"
echo ""

# ============================================
# 5. POST /auth/seed-default-users SEM SECRET → 403
# ============================================
echo "5. Teste: POST /auth/seed-default-users SEM secret"
echo "   Esperado: 403 Forbidden"
echo "   Comando:"
echo "   curl -X POST $API_URL/auth/seed-default-users \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{}'"
echo ""
curl -v -X POST $API_URL/auth/seed-default-users \
  -H 'Content-Type: application/json' \
  -d '{}' 2>&1 | grep -E "HTTP/|Forbidden|Unauthorized|Acesso"
echo ""
echo "---"
echo ""

# ============================================
# 6. POST /auth/seed-default-users COM SECRET → 200
# ============================================
echo "6. Teste: POST /auth/seed-default-users COM secret válido"
echo "   Esperado: 200 OK"
echo "   Comando (substitua ADMIN_SECRET):"
echo "   curl -X POST $API_URL/auth/seed-default-users \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'X-Admin-Secret: ADMIN_SECRET' \\"
echo "     -d '{}'"
echo ""
echo "   (Executar manualmente após definir ADMIN_SECRET no Railway)"
echo ""
echo "---"
echo ""

# ============================================
# 7. ISOLAMENTO dealership_id
# ============================================
echo "7. Teste: Isolamento dealership_id"
echo "   Pré-requisito:"
echo "   - Login como usuário da Loja A"
echo "   - Copiar ID de um veículo da Loja A"
echo "   - Extrair token do localStorage"
echo "   - Logout"
echo "   - Login como usuário da Loja B"
echo "   - Extrair token do localStorage"
echo ""
echo "   Comando (com token da Loja B, tentar acessar veículo da Loja A):"
echo "   curl -X GET $API_URL/inventory/{VEHICLE_ID_LOJA_A} \\"
echo "     -H 'Authorization: Bearer TOKEN_LOJA_B'"
echo ""
echo "   Esperado: 403 Forbidden ou 404 Not Found (RLS em ação)"
echo ""
echo "---"
echo ""

# ============================================
# 8. VERIFICAR RLS ATIVO
# ============================================
echo "8. Teste: Verificar RLS em tabelas"
echo "   Login no Supabase dashboard:"
echo "   - SQL Editor"
echo "   - Executar: SELECT * FROM pg_tables WHERE tablename IN ('inventory', 'customers', 'expenses');"
echo "   - Verificar coluna 'rowsecurity' = true"
echo ""
echo "---"
echo ""

echo "=== FIM DOS TESTES ==="
echo ""
echo "Notas:"
echo "- Substituir TOKEN pelo valor real do localStorage (DevTools → Application → localStorage → token)"
echo "- Substituir ADMIN_SECRET pelo valor configurado em Railway"
echo "- URLs locais: http://localhost:3000"
echo "- URLs produção: https://dealer-sourcing-api.railway.app (ajustar conforme necessário)"
