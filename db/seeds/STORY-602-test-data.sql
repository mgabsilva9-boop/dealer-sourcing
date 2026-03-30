-- ============================================
-- STORY-602: Test Data Seed
-- Real data from BMW M2 (Loja A + Loja B)
-- ============================================

-- Garantir que migrations foram executadas antes
-- psql dealer_sourcing < migrations/001_initial_schema.sql
-- psql dealer_sourcing < migrations/002_add_dealership_isolation.sql
-- psql dealer_sourcing < seeds/STORY-602-test-data.sql

BEGIN;

-- ============================================
-- 1. DEALERSHIPS (atualizar dados de teste)
-- ============================================

-- Limpar seeds anteriores (opcional)
-- TRUNCATE dealerships CASCADE;

-- Verificar dealerships já existentes (do migration seed)
SELECT * FROM dealerships;

-- Se não houver, inserir:
INSERT INTO dealerships (id, name, cnpj, city, state, phone, email, is_active)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Loja A - Premium Motors', '12.345.678/0001-99', 'Ribeirão Preto', 'SP', '16 3111-1111', 'gerente@loja-a.com', true),
  ('b0000000-0000-0000-0000-000000000001', 'Loja B - Luxury Auto', '98.765.432/0001-11', 'Palhoça', 'SC', '47 3111-2222', 'gerente@loja-b.com', true)
ON CONFLICT (cnpj) DO NOTHING;

-- ============================================
-- 2. USERS (Gerentes de cada loja)
-- ============================================

-- Usuário A (Loja A)
INSERT INTO users (id, jwt_sub, role, dealership_id, created_at)
VALUES (
  'user00000000-0000-0000-0000-000000000001',
  'gerente_a@loja-a.com',
  'shop',
  'a0000000-0000-0000-0000-000000000001',
  NOW()
)
ON CONFLICT (jwt_sub) DO NOTHING;

-- Usuário B (Loja B)
INSERT INTO users (id, jwt_sub, role, dealership_id, created_at)
VALUES (
  'user00000000-0000-0000-0000-000000000002',
  'gerente_b@loja-b.com',
  'shop',
  'b0000000-0000-0000-0000-000000000001',
  NOW()
)
ON CONFLICT (jwt_sub) DO NOTHING;

-- Owner (admin, pode ver ambas)
INSERT INTO users (id, jwt_sub, role, dealership_id, created_at)
VALUES (
  'user00000000-0000-0000-0000-000000000003',
  'admin@empresa.com',
  'owner',
  'a0000000-0000-0000-0000-000000000001',
  NOW()
)
ON CONFLICT (jwt_sub) DO NOTHING;

-- ============================================
-- 3. VEHICLES_CACHE (Cache de buscas compartilhado)
-- ============================================

-- BMW M2 para Loja A (custo: R$ 300.676)
INSERT INTO vehicles_cache (
  id, vehicle_id, source, make, model, year, price, km, discount, score,
  vehicle_data, validation_score, is_good_car, validation_comment,
  cached_at, expires_at, dealership_id, created_at
)
VALUES (
  'veh00000000-0000-0000-0000-000000000001',
  'webmotors_bmw_m2_001',
  'webmotors',
  'BMW',
  'M2',
  2018,
  320000.00,
  42000,
  0,
  92,
  '{
    "platform": "webmotors",
    "url": "https://www.webmotors.com.br/...",
    "phone": "16 98765-4321",
    "seller_name": "João Silva",
    "features": ["Couro", "Rodão", "Som Premium"],
    "cost_breakdown": {
      "purchase": 300000,
      "tires": 150,
      "fuel": 416,
      "vulcanization": 50,
      "localiza": 60
    },
    "total_cost": 300676
  }',
  95,
  true,
  'Veículo em excelente estado. Manutenção em dia.',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '30 days',
  'a0000000-0000-0000-0000-000000000001',
  NOW()
)
ON CONFLICT (vehicle_id) DO NOTHING;

-- GOL 1.0 para Loja A (custo: R$ 54.202)
INSERT INTO vehicles_cache (
  id, vehicle_id, source, make, model, year, price, km, discount, score,
  vehicle_data, validation_score, is_good_car, validation_comment,
  cached_at, expires_at, dealership_id, created_at
)
VALUES (
  'veh00000000-0000-0000-0000-000000000003',
  'marketplace_gol_1_0_001',
  'marketplace',
  'VW',
  'Gol 1.0',
  2022,
  60000.00,
  56000,
  0,
  78,
  '{
    "platform": "facebook_marketplace",
    "url": "https://www.facebook.com/...",
    "phone": "16 99999-7777",
    "seller_name": "Carlos Oliveira",
    "features": ["Manual", "Básico", "Ar condicionado"],
    "cost_breakdown": {
      "purchase": 53000,
      "bodywork": 200,
      "registry": 67,
      "documentation": 400,
      "fuel": 235,
      "commission": 300
    },
    "total_cost": 54202
  }',
  78,
  true,
  'Carro econômico, bom para iniciantes.',
  NOW() - INTERVAL '3 days',
  NOW() + INTERVAL '30 days',
  'a0000000-0000-0000-0000-000000000001',
  NOW()
)
ON CONFLICT (vehicle_id) DO NOTHING;

-- RAM 1500 CLASSIC para Loja B (custo: R$ 261.020)
INSERT INTO vehicles_cache (
  id, vehicle_id, source, make, model, year, price, km, discount, score,
  vehicle_data, validation_score, is_good_car, validation_comment,
  cached_at, expires_at, dealership_id, created_at
)
VALUES (
  'veh00000000-0000-0000-0000-000000000002',
  'olx_ram_1500_classic_001',
  'olx',
  'RAM',
  '1500 CLASSIC',
  2023,
  280000.00,
  42000,
  8,
  88,
  '{
    "platform": "olx",
    "url": "https://www.olx.com.br/...",
    "phone": "47 99999-8888",
    "seller_name": "Pedro Costa",
    "features": ["Diesel", "4x4", "Tração", "Ar condicionado"],
    "cost_breakdown": {
      "purchase": 260000,
      "fuel": 220,
      "wash": 800
    },
    "total_cost": 261020
  }',
  88,
  true,
  'Excelente estado. Recém chegada.',
  NOW() - INTERVAL '2 days',
  NOW() + INTERVAL '30 days',
  'b0000000-0000-0000-0000-000000000001',
  NOW()
)
ON CONFLICT (vehicle_id) DO NOTHING;

-- RAM 2500 LARAMIE para Loja B (custo: R$ 294.518, venda: R$ 330.000)
INSERT INTO vehicles_cache (
  id, vehicle_id, source, make, model, year, price, km, discount, score,
  vehicle_data, validation_score, is_good_car, validation_comment,
  cached_at, expires_at, dealership_id, created_at
)
VALUES (
  'veh00000000-0000-0000-0000-000000000004',
  'webmotors_ram_2500_laramie_001',
  'webmotors',
  'RAM',
  '2500 LARAMIE',
  2020,
  330000.00,
  52000,
  0,
  91,
  '{
    "platform": "webmotors",
    "url": "https://www.webmotors.com.br/...",
    "phone": "47 98765-4321",
    "seller_name": "Roberto Mendes",
    "features": ["Diesel", "4x4", "Automática", "Couro", "Teto solar"],
    "cost_breakdown": {
      "purchase": 290000,
      "trip": 418,
      "fuel_trip": 607,
      "tolls": 800,
      "inspection": 80,
      "meals": 113,
      "fuel_local": 200,
      "wash": 1000,
      "insurance": 600,
      "transfer": 700
    },
    "total_cost": 294518,
    "selling_price": 330000,
    "profit": 35482
  }',
  91,
  true,
  'Premium truck. Excelente para trabalho ou uso pessoal.',
  NOW() - INTERVAL '5 days',
  NOW() + INTERVAL '30 days',
  'b0000000-0000-0000-0000-000000000001',
  NOW()
)
ON CONFLICT (vehicle_id) DO NOTHING;

-- ============================================
-- 4. INTERESTED_VEHICLES (Salvos pelos usuários)
-- ============================================

-- Usuário A interessado no BMW M2
INSERT INTO interested_vehicles (
  id, user_id, vehicle_id, vehicle_data, status, status_updated_at, notes,
  user_validation_score, user_validation_comment, user_validated_at,
  contacted_at, purchased_at, saved_at, dealership_id
)
VALUES (
  'int00000000-0000-0000-0000-000000000001',
  'user00000000-0000-0000-0000-000000000001',
  'webmotors_bmw_m2_001',
  '{
    "make": "BMW",
    "model": "M2",
    "year": 2018,
    "km": 42000,
    "price": 320000,
    "cost_breakdown": {
      "purchase": 300000,
      "tires": 150,
      "fuel": 416,
      "vulcanization": 50,
      "localiza": 60
    },
    "total_cost": 300676
  }',
  'interested',
  NOW(),
  'Veículo em excelente estado. Cliente interessado em financiamento.',
  92,
  'Aprovado para contato',
  NOW(),
  NOW() - INTERVAL '1 hour',
  NULL,
  NOW() - INTERVAL '1 day',
  'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (user_id, vehicle_id) DO NOTHING;

-- Usuário A interessado no GOL
INSERT INTO interested_vehicles (
  id, user_id, vehicle_id, vehicle_data, status, status_updated_at, notes,
  user_validation_score, user_validation_comment, user_validated_at,
  contacted_at, purchased_at, saved_at, dealership_id
)
VALUES (
  'int00000000-0000-0000-0000-000000000003',
  'user00000000-0000-0000-0000-000000000001',
  'marketplace_gol_1_0_001',
  '{
    "make": "VW",
    "model": "Gol 1.0",
    "year": 2022,
    "km": 56000,
    "price": 60000,
    "cost_breakdown": {
      "purchase": 53000,
      "bodywork": 200,
      "registry": 67,
      "documentation": 400,
      "fuel": 235,
      "commission": 300
    },
    "total_cost": 54202
  }',
  'interested',
  NOW(),
  'Carro econômico para vender rápido.',
  78,
  'Bom para iniciantes',
  NOW(),
  NULL,
  NULL,
  NOW() - INTERVAL '2 days',
  'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (user_id, vehicle_id) DO NOTHING;

-- Usuário B interessado na RAM 1500 CLASSIC
INSERT INTO interested_vehicles (
  id, user_id, vehicle_id, vehicle_data, status, status_updated_at, notes,
  user_validation_score, user_validation_comment, user_validated_at,
  contacted_at, purchased_at, saved_at, dealership_id
)
VALUES (
  'int00000000-0000-0000-0000-000000000002',
  'user00000000-0000-0000-0000-000000000002',
  'olx_ram_1500_classic_001',
  '{
    "make": "RAM",
    "model": "1500 CLASSIC",
    "year": 2023,
    "km": 42000,
    "price": 280000,
    "cost_breakdown": {
      "purchase": 260000,
      "fuel": 220,
      "wash": 800
    },
    "total_cost": 261020
  }',
  'interested',
  NOW(),
  'Contato com cliente pendente.',
  88,
  'Bom custo-benefício',
  NOW(),
  NULL,
  NULL,
  NOW() - INTERVAL '3 days',
  'b0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (user_id, vehicle_id) DO NOTHING;

-- Usuário B interessado na RAM 2500 LARAMIE
INSERT INTO interested_vehicles (
  id, user_id, vehicle_id, vehicle_data, status, status_updated_at, notes,
  user_validation_score, user_validation_comment, user_validated_at,
  contacted_at, purchased_at, saved_at, dealership_id
)
VALUES (
  'int00000000-0000-0000-0000-000000000004',
  'user00000000-0000-0000-0000-000000000002',
  'webmotors_ram_2500_laramie_001',
  '{
    "make": "RAM",
    "model": "2500 LARAMIE",
    "year": 2020,
    "km": 52000,
    "price": 330000,
    "cost_breakdown": {
      "purchase": 290000,
      "trip": 418,
      "fuel_trip": 607,
      "tolls": 800,
      "inspection": 80,
      "meals": 113,
      "fuel_local": 200,
      "wash": 1000,
      "insurance": 600,
      "transfer": 700
    },
    "total_cost": 294518,
    "selling_price": 330000,
    "profit": 35482
  }',
  'contacted',
  NOW(),
  'Cliente visitou a loja. Esperando retorno.',
  91,
  'Veículo premium. Pronta para vender.',
  NOW(),
  NOW() - INTERVAL '4 hours',
  NULL,
  NOW() - INTERVAL '5 days',
  'b0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (user_id, vehicle_id) DO NOTHING;

-- ============================================
-- 5. SEARCH_QUERIES (Histórico de buscas)
-- ============================================

-- Busca do Usuário A por BMW M2
INSERT INTO search_queries (
  id, user_id, query_params, results_count, validation_enabled,
  validation_score, validation_result, searched_at, dealership_id
)
VALUES (
  'search000000-0000-0000-0000-000000000001',
  'user00000000-0000-0000-0000-000000000001',
  '{
    "make": "BMW",
    "model": "M2",
    "priceMin": 250000,
    "priceMax": 350000,
    "kmMax": 60000,
    "discountMin": 0
  }',
  3,
  true,
  92,
  'high_quality',
  NOW() - INTERVAL '2 days',
  'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

-- Busca do Usuário A por GOL
INSERT INTO search_queries (
  id, user_id, query_params, results_count, validation_enabled,
  validation_score, validation_result, searched_at, dealership_id
)
VALUES (
  'search000000-0000-0000-0000-000000000003',
  'user00000000-0000-0000-0000-000000000001',
  '{
    "make": "VW",
    "model": "Gol",
    "priceMin": 40000,
    "priceMax": 70000,
    "kmMax": 80000,
    "discountMin": 0
  }',
  8,
  true,
  78,
  'good_quality',
  NOW() - INTERVAL '3 days',
  'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

-- Busca do Usuário B por RAM (múltiplos modelos)
INSERT INTO search_queries (
  id, user_id, query_params, results_count, validation_enabled,
  validation_score, validation_result, searched_at, dealership_id
)
VALUES (
  'search000000-0000-0000-0000-000000000002',
  'user00000000-0000-0000-0000-000000000002',
  '{
    "make": "RAM",
    "priceMin": 200000,
    "priceMax": 350000,
    "kmMax": 60000,
    "discountMin": 0
  }',
  12,
  true,
  87,
  'high_quality',
  NOW() - INTERVAL '1 day',
  'b0000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. VEHICLE_VALIDATIONS (Admin validations)
-- ============================================

-- Admin validou BMW M2
INSERT INTO vehicle_validations (
  id, vehicle_id, validated_by, is_good_car, validation_score,
  validation_comment, validated_at, dealership_id
)
VALUES (
  'val00000000-0000-0000-0000-000000000001',
  'webmotors_bmw_m2_001',
  'user00000000-0000-0000-0000-000000000003',
  true,
  95,
  'Veículo aprovado. Histórico limpo, manutenção em dia.',
  NOW() - INTERVAL '12 hours',
  'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

-- Admin validou GOL
INSERT INTO vehicle_validations (
  id, vehicle_id, validated_by, is_good_car, validation_score,
  validation_comment, validated_at, dealership_id
)
VALUES (
  'val00000000-0000-0000-0000-000000000003',
  'marketplace_gol_1_0_001',
  'user00000000-0000-0000-0000-000000000003',
  true,
  78,
  'Carro econômico, revisar retrovisor traseiro.',
  NOW() - INTERVAL '4 days',
  'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

-- Admin validou RAM 1500 CLASSIC
INSERT INTO vehicle_validations (
  id, vehicle_id, validated_by, is_good_car, validation_score,
  validation_comment, validated_at, dealership_id
)
VALUES (
  'val00000000-0000-0000-0000-000000000002',
  'olx_ram_1500_classic_001',
  'user00000000-0000-0000-0000-000000000003',
  true,
  88,
  'Excelente estado. Recomendado para venda rápida.',
  NOW() - INTERVAL '3 days',
  'b0000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

-- Admin validou RAM 2500 LARAMIE
INSERT INTO vehicle_validations (
  id, vehicle_id, validated_by, is_good_car, validation_score,
  validation_comment, validated_at, dealership_id
)
VALUES (
  'val00000000-0000-0000-0000-000000000004',
  'webmotors_ram_2500_laramie_001',
  'user00000000-0000-0000-0000-000000000003',
  true,
  91,
  'Veículo premium. Top da linha. Pronta para vender com lucro.',
  NOW() - INTERVAL '6 days',
  'b0000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verificar dados inseridos
SELECT 'DEALERSHIPS' as table_name, COUNT(*) as record_count FROM dealerships
UNION ALL
SELECT 'USERS', COUNT(*) FROM users
UNION ALL
SELECT 'VEHICLES_CACHE', COUNT(*) FROM vehicles_cache
UNION ALL
SELECT 'INTERESTED_VEHICLES', COUNT(*) FROM interested_vehicles
UNION ALL
SELECT 'SEARCH_QUERIES', COUNT(*) FROM search_queries
UNION ALL
SELECT 'VEHICLE_VALIDATIONS', COUNT(*) FROM vehicle_validations;

-- Mostrar dados por dealership (VERIFICAR ISOLAMENTO)
RAISE NOTICE '';
RAISE NOTICE '=== DATA BY DEALERSHIP ===';
RAISE NOTICE 'Dealership A interested_vehicles:';
SELECT COUNT(*) FROM interested_vehicles WHERE dealership_id = 'a0000000-0000-0000-0000-000000000001';

RAISE NOTICE 'Dealership B interested_vehicles:';
SELECT COUNT(*) FROM interested_vehicles WHERE dealership_id = 'b0000000-0000-0000-0000-000000000001';

RAISE NOTICE '';
RAISE NOTICE '✓ Test data inserted successfully!';
RAISE NOTICE '';
RAISE NOTICE 'Next: Run validate_dealership_rls.sql to test RLS isolation';

COMMIT;
