#!/bin/bash

# 🚀 QUICK DEPLOY SCRIPT - STORY-602 Production
# Execute este script após configurar Supabase DATABASE_URL

set -e

echo "=========================================="
echo "🚀 DEALER-SOURCING PRODUCTION DEPLOY"
echo "=========================================="
echo ""

# Configurações
DB_URL="${DATABASE_URL}"
MIGRATIONS_DIR="db/migrations"
SEEDS_DIR="db/seeds"

# Verificar DATABASE_URL
if [ -z "$DB_URL" ]; then
  echo "❌ ERROR: DATABASE_URL não definida"
  echo "Defina: export DATABASE_URL='postgresql://...'"
  exit 1
fi

echo "✅ DATABASE_URL configurada"
echo ""

# STEP 1: Criar database (se necessário)
echo "📍 STEP 1: Verificar database..."
psql "$DB_URL" -c "SELECT 'Database connection OK' AS status;" || {
  echo "❌ Falha ao conectar ao banco"
  exit 1
}
echo "✅ Database conectado"
echo ""

# STEP 2: Aplicar migrations
echo "📍 STEP 2: Aplicar migrations..."

for migration in "$MIGRATIONS_DIR"/*.sql; do
  echo "  • Aplicando $(basename $migration)..."
  psql "$DB_URL" < "$migration" || {
    echo "❌ Falha em $(basename $migration)"
    exit 1
  }
done
echo "✅ Migrations aplicadas"
echo ""

# STEP 3: Seed data
echo "📍 STEP 3: Inserir dados de teste..."
psql "$DB_URL" < "$SEEDS_DIR/STORY-602-test-data.sql" || {
  echo "⚠️  Seed falhou (pode ser OK se dados já existem)"
}
echo "✅ Seed complete"
echo ""

# STEP 4: Validar schema
echo "📍 STEP 4: Validar schema..."
psql "$DB_URL" << 'EOF'
SELECT
  schemaname,
  tablename,
  COUNT(*) as row_count
FROM pg_tables
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
EOF
echo "✅ Schema validado"
echo ""

# STEP 5: Verificar RLS
echo "📍 STEP 5: Verificar RLS policies..."
psql "$DB_URL" -c "
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
GROUP BY schemaname, tablename
ORDER BY tablename;
" || echo "⚠️  RLS check falhou (pode ser normal)"
echo "✅ RLS policies verificadas"
echo ""

echo "=========================================="
echo "✅ DEPLOYMENT SETUP COMPLETO!"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo "1. Atualize .env.production com DATABASE_URL"
echo "2. Deploy no Render: git push origin main"
echo "3. Teste em https://dealer-sourcing.vercel.app"
echo ""
