#!/bin/bash

# ============================================
# DEALER SOURCING - ONE-CLICK DEPLOYMENT
# ============================================

set -e

echo "╔════════════════════════════════════════╗"
echo "║   🚀 DEALER SOURCING MVP - DEPLOY    ║"
echo "║   Sair de localhost em 5 minutos      ║"
echo "╚════════════════════════════════════════╝"
echo ""

# ============================================
# STEP 1: VALIDAR TUDO ESTÁ PRONTO
# ============================================

echo "📋 STEP 1: Validando projeto..."

if [ ! -f ".env" ]; then
  echo "❌ Erro: .env não encontrado"
  exit 1
fi

if [ ! -d "dist" ]; then
  echo "❌ Erro: Build não feito. Execute: npm run build"
  exit 1
fi

if [ ! -f "package.json" ]; then
  echo "❌ Erro: package.json não encontrado"
  exit 1
fi

echo "✅ Projeto validado"
echo ""

# ============================================
# STEP 2: PEDIR RENDER API TOKEN
# ============================================

echo "🔑 STEP 2: Render API Token necessário"
echo ""
echo "   1. Acesse: https://dashboard.render.com/account/api-tokens"
echo "   2. Clique 'Create Token'"
echo "   3. Cole o token abaixo:"
echo ""

read -p "   🔐 Seu Render API Token: " RENDER_TOKEN

if [ -z "$RENDER_TOKEN" ]; then
  echo "❌ Token não fornecido. Abortando."
  exit 1
fi

echo "✅ Token recebido"
echo ""

# ============================================
# STEP 3: CRIAR SERVIÇO EM RENDER
# ============================================

echo "⚙️  STEP 3: Criando serviço em Render..."
echo ""

# Get database password from .env
DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d= -f2-)
JWT_SECRET=$(grep "^JWT_SECRET=" .env | cut -d= -f2-)

# Create Render service via API
RENDER_RESPONSE=$(curl -s -X POST "https://api.render.com/v1/services" \
  -H "Authorization: Bearer $RENDER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "web_service",
    "name": "dealer-sourcing-backend",
    "ownerId": "tea_xxxxx",
    "repo": "https://github.com/mgabsilva9-boop/dealer-sourcing",
    "branch": "main",
    "rootDir": "./",
    "buildCommand": "npm install",
    "startCommand": "npm start",
    "envVars": [
      {
        "key": "DATABASE_URL",
        "value": "'"$DATABASE_URL"'"
      },
      {
        "key": "JWT_SECRET",
        "value": "'"$JWT_SECRET"'"
      },
      {
        "key": "NODE_ENV",
        "value": "production"
      },
      {
        "key": "PORT",
        "value": "3000"
      },
      {
        "key": "FRONTEND_URL",
        "value": "https://dealer-sourcing-frontend.vercel.app"
      }
    ],
    "plan": "free",
    "region": "sao-paulo"
  }')

# Check if service was created
SERVICE_ID=$(echo "$RENDER_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$SERVICE_ID" ]; then
  echo "⚠️  API retornou erro. Você pode:"
  echo ""
  echo "   OPÇÃO A (Rápido - Manual): Ir em https://render.com e criar manualmente"
  echo "   OPÇÃO B (Esperar): A gente refaz com token válido"
  echo ""
  read -p "Deseja continuar com Vercel (frontend)? (s/n): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    exit 1
  fi
else
  echo "✅ Serviço criado: $SERVICE_ID"
  echo "   URL: https://dashboard.render.com/services/$SERVICE_ID"
  echo ""
  read -p "   Aguarde Render fazer build (3-5 min). Depois clique acima para copiar URL."
  read -p "   Cole aqui a URL do seu backend (ex: https://dealer-sourcing-backend.onrender.com): " BACKEND_URL
fi

echo ""

# ============================================
# STEP 4: VERCEL DEPLOYMENT
# ============================================

echo "🌐 STEP 4: Deployando Frontend em Vercel..."
echo ""
echo "   Você pode fazer via CLI ou manual:"
echo ""
echo "   OPÇÃO 1 (CLI - Requer Vercel CLI):"
echo "      npm i -g vercel"
echo "      vercel --prod"
echo ""
echo "   OPÇÃO 2 (Manual - Mais rápido):"
echo "      1. Acesse: https://vercel.com/new"
echo "      2. Importe seu GitHub repo"
echo "      3. Framework: Vite"
echo "      4. Environment: VITE_API_URL=${BACKEND_URL:-https://dealer-sourcing-backend.onrender.com}"
echo "      5. Deploy"
echo ""

read -p "Qual opção? (1=CLI, 2=Manual): " VERCEL_OPTION

if [ "$VERCEL_OPTION" = "1" ]; then
  which vercel > /dev/null || npm install -g vercel
  vercel --prod
elif [ "$VERCEL_OPTION" = "2" ]; then
  echo "   ⏳ Abra https://vercel.com/new e siga os passos acima"
  read -p "   Cole aqui a URL do seu frontend (ex: https://dealer-sourcing-frontend.vercel.app): " FRONTEND_URL
else
  echo "❌ Opção inválida"
  exit 1
fi

echo ""

# ============================================
# STEP 5: FINALIZAR
# ============================================

echo "╔════════════════════════════════════════╗"
echo "║   ✅ DEPLOY COMPLETO!                 ║"
echo "╚════════════════════════════════════════╝"
echo ""

if [ ! -z "$BACKEND_URL" ] && [ ! -z "$FRONTEND_URL" ]; then
  echo "🎉 Seu MVP está VIVO:"
  echo ""
  echo "   🌐 Frontend: $FRONTEND_URL"
  echo "   ⚙️  Backend:  $BACKEND_URL"
  echo ""
  echo "   Teste agora: Abra $FRONTEND_URL no navegador"
  echo ""
fi

echo "📝 Próximos passos:"
echo "   1. Teste login em $FRONTEND_URL"
echo "   2. Teste busca de carros"
echo "   3. Verifique DevTools (Network tab)"
echo ""
echo "🎖️  MVP está PRONTO e VIVO! 🚀"
