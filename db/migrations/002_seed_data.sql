-- ============================================
-- dealer-sourcing: Seed Data
-- Version: 002
-- Description: Initial test data for MVP
-- ============================================

-- ============================================
-- 1. CREATE TEST USERS
-- ============================================

-- Owner (Admin)
INSERT INTO users (jwt_sub, role) VALUES
  ('owner-user-id-123', 'owner')
ON CONFLICT (jwt_sub) DO NOTHING;

-- Shop (LojaB)
INSERT INTO users (jwt_sub, role) VALUES
  ('shop-user-id-456', 'shop')
ON CONFLICT (jwt_sub) DO NOTHING;

-- Regular User
INSERT INTO users (jwt_sub, role) VALUES
  ('user-id-789', 'user')
ON CONFLICT (jwt_sub) DO NOTHING;

-- ============================================
-- 2. POPULATE VEHICLES_CACHE
-- ============================================

INSERT INTO vehicles_cache (
  vehicle_id, source, make, model, year, price, km, discount,
  location, score, vehicle_data, validation_score, is_good_car, validated_at
) VALUES
  (
    'real-olx-0-seed1',
    'olx',
    'Honda',
    'Civic',
    2022,
    86587.00,
    23654,
    -8.9,
    'São Paulo, SP',
    99,
    jsonb_build_object(
      'id', 'real-olx-0-seed1',
      'platform', 'olx',
      'make', 'Honda',
      'model', 'Civic',
      'year', 2022,
      'price', 86587,
      'fipe', 95000,
      'discount', -8.9,
      'km', 23654,
      'location', 'São Paulo, SP',
      'score', 99,
      'time', '30h atrás',
      'phone', '(67) 22379-4475',
      'url', 'https://example.com/veiculo/0',
      'kmRating', 'Baixa',
      'owners', 2,
      'accidents', 0,
      'serviceHistory', 'Completo',
      'bodyCondition', 'Bom'
    ),
    90,
    true,
    NOW()
  ),
  (
    'real-olx-1-seed1',
    'olx',
    'Toyota',
    'Corolla',
    2021,
    97803.00,
    54487,
    -0.2,
    'Rio de Janeiro, RJ',
    90,
    jsonb_build_object(
      'id', 'real-olx-1-seed1',
      'platform', 'olx',
      'make', 'Toyota',
      'model', 'Corolla',
      'year', 2021,
      'price', 97803,
      'fipe', 98000,
      'discount', -0.2,
      'km', 54487,
      'location', 'Rio de Janeiro, RJ',
      'score', 90,
      'time', '15h atrás',
      'phone', '(93) 94443-8073',
      'url', 'https://example.com/veiculo/1',
      'kmRating', 'Média',
      'owners', 3,
      'accidents', 2,
      'serviceHistory', 'Sem registros',
      'bodyCondition', 'Excelente'
    ),
    85,
    true,
    NOW()
  ),
  (
    'real-webmotors-2-seed1',
    'webmotors',
    'Volkswagen',
    'Golf',
    2020,
    81287.00,
    95790,
    -4.4,
    'Belo Horizonte, MG',
    82,
    jsonb_build_object(
      'id', 'real-webmotors-2-seed1',
      'platform', 'webmotors',
      'make', 'Volkswagen',
      'model', 'Golf',
      'year', 2020,
      'price', 81287,
      'fipe', 85000,
      'discount', -4.4,
      'km', 95790,
      'location', 'Belo Horizonte, MG',
      'score', 82,
      'time', '11h atrás',
      'phone', '(47) 30311-6975',
      'url', 'https://example.com/veiculo/2',
      'kmRating', 'Média',
      'owners', 1,
      'accidents', 0,
      'serviceHistory', 'Completo',
      'bodyCondition', 'Bom'
    ),
    75,
    true,
    NOW()
  )
ON CONFLICT (vehicle_id) DO NOTHING;

-- ============================================
-- 3. POPULATE INTERESTED_VEHICLES
-- ============================================

INSERT INTO interested_vehicles (
  user_id, vehicle_id, vehicle_data, status, notes,
  user_validation_score, user_validated_at, saved_at
) SELECT
  u.id,
  'real-olx-0-seed1',
  (SELECT vehicle_data FROM vehicles_cache WHERE vehicle_id = 'real-olx-0-seed1'),
  'interested',
  'Bom carro, preço acessível',
  85,
  NOW(),
  NOW()
FROM users u WHERE u.role = 'user'
ON CONFLICT (user_id, vehicle_id) DO NOTHING;

INSERT INTO interested_vehicles (
  user_id, vehicle_id, vehicle_data, status, user_validation_score, saved_at
) SELECT
  u.id,
  'real-olx-1-seed1',
  (SELECT vehicle_data FROM vehicles_cache WHERE vehicle_id = 'real-olx-1-seed1'),
  'contacted',
  90,
  NOW() - INTERVAL '2 days'
FROM users u WHERE u.role = 'user'
ON CONFLICT (user_id, vehicle_id) DO NOTHING;

-- ============================================
-- 4. POPULATE SEARCH_QUERIES
-- ============================================

INSERT INTO search_queries (
  user_id, query_params, results_count, validation_enabled, validation_score, validation_result, searched_at
) SELECT
  u.id,
  jsonb_build_object(
    'make', 'Honda',
    'model', 'Civic',
    'priceMin', 80000,
    'priceMax', 100000,
    'kmMax', 50000
  ),
  2,
  true,
  85,
  'good_deal',
  NOW() - INTERVAL '1 day'
FROM users u WHERE u.role = 'user'
ON CONFLICT DO NOTHING;

INSERT INTO search_queries (
  user_id, query_params, results_count, validation_enabled, searched_at
) SELECT
  u.id,
  jsonb_build_object(
    'make', 'Toyota',
    'model', 'Corolla',
    'priceMin', 90000,
    'priceMax', 110000
  ),
  1,
  false,
  NOW() - INTERVAL '6 hours'
FROM users u WHERE u.role = 'user'
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. POPULATE VEHICLE_VALIDATIONS
-- ============================================

INSERT INTO vehicle_validations (
  vehicle_id, validated_by, is_good_car, validation_score, validation_comment, validated_at
) SELECT
  'real-olx-0-seed1',
  u.id,
  true,
  90,
  'Honda Civic 2022 com baixa km, bom preço, serviço completo',
  NOW() - INTERVAL '3 days'
FROM users u WHERE u.role = 'owner'
ON CONFLICT DO NOTHING;

INSERT INTO vehicle_validations (
  vehicle_id, validated_by, is_good_car, validation_score, validation_comment, validated_at
) SELECT
  'real-olx-1-seed1',
  u.id,
  true,
  85,
  'Toyota Corolla confiável, mas com histórico de 2 acidentes',
  NOW() - INTERVAL '2 days'
FROM users u WHERE u.role = 'owner'
ON CONFLICT DO NOTHING;

-- ============================================
-- CONFIRMATION
-- ============================================
SELECT
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM vehicles_cache) as total_vehicles,
  (SELECT COUNT(*) FROM interested_vehicles) as total_interested,
  (SELECT COUNT(*) FROM search_queries) as total_searches,
  (SELECT COUNT(*) FROM vehicle_validations) as total_validations;
