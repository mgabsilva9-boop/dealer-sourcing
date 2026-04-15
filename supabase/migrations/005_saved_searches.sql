-- Fase 2: Saved Searches + Search Results
-- Tables para watchlist com alertas automáticos

-- Criar tabela saved_searches
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  alert_whatsapp BOOLEAN DEFAULT FALSE,
  alert_email BOOLEAN DEFAULT FALSE,
  whatsapp_number VARCHAR(20),
  email_address VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela search_results (histórico de resultados)
CREATE TABLE IF NOT EXISTS search_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
  vehicle_data JSONB NOT NULL,
  source VARCHAR(50),
  external_id VARCHAR(200),
  price DECIMAL(15,2),
  found_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  alerted_at TIMESTAMP,
  is_new BOOLEAN DEFAULT TRUE,
  price_changed BOOLEAN DEFAULT FALSE,
  previous_price DECIMAL(15,2)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_saved_searches_dealership
  ON saved_searches(dealership_id, is_active);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user
  ON saved_searches(user_id);

CREATE INDEX IF NOT EXISTS idx_search_results_search
  ON search_results(search_id);

CREATE INDEX IF NOT EXISTS idx_search_results_external
  ON search_results(external_id, search_id);

CREATE INDEX IF NOT EXISTS idx_search_results_source
  ON search_results(source, found_at DESC);

-- Row Level Security (RLS)
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Usuário só vê suas próprias buscas salvas
CREATE POLICY "Users see own saved_searches"
  ON saved_searches FOR SELECT
  USING (auth.uid() = user_id AND dealership_id = (SELECT dealership_id FROM user_profiles WHERE user_id = auth.uid()));

-- RLS Policy: Usuário só pode criar em sua dealership
CREATE POLICY "Users create saved_searches for own dealership"
  ON saved_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id AND dealership_id = (SELECT dealership_id FROM user_profiles WHERE user_id = auth.uid()));

-- RLS Policy: Usuário só pode editar suas próprias buscas
CREATE POLICY "Users update own saved_searches"
  ON saved_searches FOR UPDATE
  USING (auth.uid() = user_id AND dealership_id = (SELECT dealership_id FROM user_profiles WHERE user_id = auth.uid()));

-- RLS Policy: Usuário só pode deletar suas próprias buscas
CREATE POLICY "Users delete own saved_searches"
  ON saved_searches FOR DELETE
  USING (auth.uid() = user_id AND dealership_id = (SELECT dealership_id FROM user_profiles WHERE user_id = auth.uid()));

-- RLS Policy: Resultados de busca acessíveis através da busca salva
CREATE POLICY "Users see search_results via saved_searches"
  ON search_results FOR SELECT
  USING (search_id IN (SELECT id FROM saved_searches WHERE auth.uid() = user_id));

-- RLS Policy: Inserir resultados (usado por sistema/N8N)
CREATE POLICY "Insert search_results via saved_searches"
  ON search_results FOR INSERT
  WITH CHECK (search_id IN (SELECT id FROM saved_searches WHERE auth.uid() = user_id));
