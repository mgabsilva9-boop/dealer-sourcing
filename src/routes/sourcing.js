/**
 * Rotas de Sourcing (Busca Inteligente)
 * Phase 4: Backend Implementation with Database Persistence
 * Agents: @dev (Dex - The Builder)
 */

import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { scrapeMultiplePlatforms, searchWithFilters, generateRealisticVehicles } from '../utils/scrapers.js';
import {
  extractFiltersFromText,
  summarizeResults,
  generateWhatsAppMessage,
  generateCheckInMessage,
} from '../utils/gemini-ai.js';

const router = express.Router();

// Cache em memória para evitar scraping a cada request
let vehicleCache = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * UTILITY: Validar parâmetros de entrada
 */
const validateNumber = (value, min = 0, max = Infinity, name = 'value') => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (isNaN(num)) throw new Error(`${name} deve ser um número válido`);
  if (num < min) throw new Error(`${name} não pode ser menor que ${min}`);
  if (num > max) throw new Error(`${name} não pode ser maior que ${max}`);
  return num;
};

const validateString = (value, maxLength = 255, name = 'value') => {
  if (!value) return null;
  if (typeof value !== 'string') throw new Error(`${name} deve ser string`);
  if (value.length > maxLength) throw new Error(`${name} não pode ter mais de ${maxLength} caracteres`);
  return value.trim();
};

/**
 * UTILITY: Obter veículos do cache ou scrape
 */
const getVehicles = async (query = '') => {
  const now = Date.now();

  if (vehicleCache.length > 0 && now - cacheTimestamp < CACHE_DURATION) {
    return vehicleCache;
  }

  try {
    vehicleCache = await scrapeMultiplePlatforms(query);
    cacheTimestamp = now;
    return vehicleCache;
  } catch (error) {
    console.error('Erro ao fazer scrape, usando fallback:', error.message);
    vehicleCache = generateRealisticVehicles(query);
    cacheTimestamp = now;
    return vehicleCache;
  }
};

/**
 * GET /sourcing/search
 * Buscar com filtros
 * STORY-401: Improved filtering with pagination
 */
router.get('/search', authMiddleware, async (req, res) => {
  try {
    // Validar inputs
    const make = validateString(req.query.make);
    const model = validateString(req.query.model);
    const priceMin = validateNumber(req.query.priceMin, 0, 1000000, 'priceMin');
    const priceMax = validateNumber(req.query.priceMax, 0, 1000000, 'priceMax');
    const kmMax = validateNumber(req.query.kmMax, 0, 999999, 'kmMax');
    const discountMin = validateNumber(req.query.discountMin, -100, 100, 'discountMin');
    const limit = validateNumber(req.query.limit || 20, 1, 100, 'limit');
    const offset = validateNumber(req.query.offset || 0, 0, Infinity, 'offset');

    // Cross-field validation
    if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
      return res.status(400).json({ error: 'priceMin não pode ser maior que priceMax' });
    }

    // Buscar
    let results = await searchWithFilters({
      make,
      model,
      priceMin,
      priceMax,
      kmMax,
      discountMin,
    });

    // Ordenar por score
    results.sort((a, b) => b.score - a.score);

    // Aplicar paginação
    const total = results.length;
    const paginated = results.slice(offset, offset + limit);

    res.json({
      total,
      limit,
      offset,
      results: paginated,
    });
  } catch (error) {
    console.error('Erro ao buscar sourcing:', error);
    res.status(400).json({ error: error.message || 'Erro ao buscar sourcing' });
  }
});

/**
 * GET /sourcing/list
 * Listar com paginação
 * STORY-405: Pagination support
 */
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const limit = validateNumber(req.query.limit || 20, 1, 100, 'limit');
    const offset = validateNumber(req.query.offset || 0, 0, Infinity, 'offset');

    const vehicles = await getVehicles();
    const sorted = vehicles.sort((a, b) => b.score - a.score);

    const total = sorted.length;
    const paginated = sorted.slice(offset, offset + limit);

    res.json({
      total,
      limit,
      offset,
      results: paginated,
    });
  } catch (error) {
    console.error('Erro ao listar sourcing:', error);
    res.status(400).json({ error: error.message || 'Erro ao listar sourcing' });
  }
});

/**
 * GET /sourcing/favorites
 * Listar favoritos do usuário (RLS)
 * STORY-402: Get user's favorites
 */
router.get('/favorites', authMiddleware, async (req, res) => {
  try {
    const limit = validateNumber(req.query.limit || 20, 1, 100, 'limit');
    const offset = validateNumber(req.query.offset || 0, 0, Infinity, 'offset');
    const statusFilter = validateString(req.query.status);

    // Extrair user_id dos claims JWT (authMiddleware já validou o token)
    const userId = req.user.sub || req.user.user_id || req.user.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID não encontrado nos claims JWT' });
    }

    // Construir query com filtros opcionais
    let query = `
      SELECT id, user_id, vehicle_id, vehicle_data, status, notes,
             user_validation_score, saved_at, updated_at
      FROM interested_vehicles
      WHERE user_id = $1
    `;
    const params = [userId];

    if (statusFilter && ['interested', 'contacted', 'purchased', 'rejected'].includes(statusFilter)) {
      query += ` AND status = $${params.length + 1}`;
      params.push(statusFilter);
    }

    // Ordenar por data
    query += ` ORDER BY saved_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Contar total
    let countQuery = 'SELECT COUNT(*) FROM interested_vehicles WHERE user_id = $1';
    const countParams = [userId];

    if (statusFilter && ['interested', 'contacted', 'purchased', 'rejected'].includes(statusFilter)) {
      countQuery += ' AND status = $2';
      countParams.push(statusFilter);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    res.json({
      total,
      limit,
      offset,
      status_filter: statusFilter,
      results: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar favoritos:', error);
    res.status(500).json({ error: error.message || 'Erro ao listar favoritos' });
  }
});

/**
 * GET /sourcing/:id
 * Obter veículo específico
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const vehicles = await getVehicles();
    const vehicle = vehicles.find(v => v.id === id || v.id === Number(id));

    if (!vehicle) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Erro ao buscar sourcing:', error);
    res.status(500).json({ error: 'Erro ao buscar sourcing' });
  }
});

/**
 * POST /sourcing/:id/interested
 * Marcar veículo como interessado (PERSISTE em DB)
 * STORY-401: Database persistence
 */
router.post('/:id/interested', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id: vehicleId } = req.params;
    const { notes } = req.body;

    // Validar inputs
    if (vehicleId === null || vehicleId === undefined) {
      return res.status(400).json({ error: 'vehicle_id é obrigatório' });
    }
    const notesValidated = validateString(notes, 1000);

    // Obter veículo do cache
    const vehicles = await getVehicles();
    const vehicle = vehicles.find(v => v.id === vehicleId || v.id === Number(vehicleId));

    if (!vehicle) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    // Extrair user_id dos claims JWT (authMiddleware já validou o token)
    const userId = req.user.sub || req.user.user_id || req.user.id;

    if (!userId) {
      return res.status(401).json({ error: 'User ID não encontrado nos claims JWT' });
    }

    // Iniciar transação
    await client.query('BEGIN');

    // Inserir em interested_vehicles
    const result = await client.query(
      `INSERT INTO interested_vehicles (user_id, vehicle_id, vehicle_data, notes, saved_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, vehicle_id) DO UPDATE SET
         updated_at = NOW(),
         notes = EXCLUDED.notes
       RETURNING id, user_id, vehicle_id, status, saved_at`,
      [userId, vehicleId, JSON.stringify(vehicle), notesValidated],
    );

    // Registrar na search_queries (analytics)
    await client.query(
      `INSERT INTO search_queries (user_id, query_params, results_count, searched_at)
       VALUES ($1, $2, $3, NOW())`,
      [userId, JSON.stringify({ action: 'mark_interested', vehicle_id: vehicleId }), 1],
    );

    await client.query('COMMIT');

    const saved = result.rows[0];
    res.status(201).json({
      message: 'Veículo marcado como interessante',
      id: saved.id,
      vehicle_id: saved.vehicle_id,
      status: saved.status,
      saved_at: saved.saved_at,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao marcar como interessado:', error);

    if (error.code === '23505') {
      return res.status(409).json({ error: 'Veículo já está marcado como interessante' });
    }

    res.status(500).json({ error: error.message || 'Erro ao marcar como interessado' });
  } finally {
    client.release();
  }
});

// ============================================
// SAVED SEARCHES (Watchlist)
// ============================================

/**
 * UTILITY: Normalizar saved_search para camelCase
 */
const normalizeSavedSearch = (row) => {
  return {
    id: row.id,
    name: row.name,
    criteria: row.criteria,
    isActive: row.is_active,
    alertWhatsapp: row.alert_whatsapp,
    alertEmail: row.alert_email,
    whatsappNumber: row.whatsapp_number,
    emailAddress: row.email_address,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pendingAlerts: parseInt(row.pending_alerts) || 0,
  };
};

/**
 * POST /sourcing/saved-searches
 * Criar nova busca salva
 */
router.post('/saved-searches', authMiddleware, async (req, res) => {
  try {
    const { name, criteria, alertWhatsapp, alertEmail, whatsappNumber, emailAddress } = req.body;
    const user_id = req.user.id;
    const dealership_id = req.user.dealership_id;

    // Validações
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Nome da busca é obrigatório' });
    }

    if (!criteria || typeof criteria !== 'object') {
      return res.status(400).json({ error: 'Critérios devem ser um objeto válido' });
    }

    if (alertWhatsapp && !whatsappNumber) {
      return res.status(400).json({ error: 'Número WhatsApp é obrigatório quando alerta está ativo' });
    }

    if (alertEmail && !emailAddress) {
      return res.status(400).json({ error: 'Email é obrigatório quando alerta de email está ativo' });
    }

    const query = `
      INSERT INTO saved_searches (user_id, dealership_id, name, criteria, alert_whatsapp, alert_email, whatsapp_number, email_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const result = await pool.query(query, [
      user_id,
      dealership_id,
      name.trim(),
      JSON.stringify(criteria),
      alertWhatsapp || false,
      alertEmail || false,
      whatsappNumber || null,
      emailAddress || null,
    ]);

    const savedSearch = normalizeSavedSearch(result.rows[0]);
    res.status(201).json(savedSearch);
  } catch (error) {
    console.error('❌ Erro ao criar busca salva:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /sourcing/saved-searches
 * Listar buscas salvas do usuário (com contagem de alertas pendentes)
 */
router.get('/saved-searches', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    const dealership_id = req.user.dealership_id;

    const query = `
      SELECT
        ss.*,
        COUNT(CASE WHEN sr.is_new = true AND sr.alerted_at IS NULL THEN 1 END) as pending_alerts
      FROM saved_searches ss
      LEFT JOIN search_results sr ON sr.search_id = ss.id
      WHERE ss.user_id = $1 AND ss.dealership_id = $2
      GROUP BY ss.id
      ORDER BY ss.created_at DESC;
    `;

    const result = await pool.query(query, [user_id, dealership_id]);
    const searches = result.rows.map(normalizeSavedSearch);

    res.json({ searches });
  } catch (error) {
    console.error('❌ Erro ao listar buscas salvas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /sourcing/saved-searches/:id
 * Editar busca salva (nome, critérios, alertas)
 */
router.put('/saved-searches/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, criteria, isActive, alertWhatsapp, alertEmail, whatsappNumber, emailAddress } = req.body;
    const user_id = req.user.id;
    const dealership_id = req.user.dealership_id;

    // Verificar se existe e pertence ao usuário
    const checkQuery = `SELECT id FROM saved_searches WHERE id = $1 AND user_id = $2 AND dealership_id = $3;`;
    const checkResult = await pool.query(checkQuery, [id, user_id, dealership_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Busca salva não encontrada' });
    }

    // Montar UPDATE dinâmico (só atualizar campos fornecidos)
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (criteria !== undefined) {
      updates.push(`criteria = $${paramCount++}`);
      values.push(JSON.stringify(criteria));
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }

    if (alertWhatsapp !== undefined) {
      updates.push(`alert_whatsapp = $${paramCount++}`);
      values.push(alertWhatsapp);
    }

    if (alertEmail !== undefined) {
      updates.push(`alert_email = $${paramCount++}`);
      values.push(alertEmail);
    }

    if (whatsappNumber !== undefined) {
      updates.push(`whatsapp_number = $${paramCount++}`);
      values.push(whatsappNumber || null);
    }

    if (emailAddress !== undefined) {
      updates.push(`email_address = $${paramCount++}`);
      values.push(emailAddress || null);
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date().toISOString());
    values.push(id);
    values.push(user_id);
    values.push(dealership_id);

    const updateQuery = `
      UPDATE saved_searches
      SET ${updates.join(', ')}
      WHERE id = $${paramCount++} AND user_id = $${paramCount++} AND dealership_id = $${paramCount++}
      RETURNING *;
    `;

    const result = await pool.query(updateQuery, values);
    const savedSearch = normalizeSavedSearch(result.rows[0]);

    res.json(savedSearch);
  } catch (error) {
    console.error('❌ Erro ao atualizar busca salva:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /sourcing/saved-searches/:id
 * Deletar busca salva
 */
router.delete('/saved-searches/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const dealership_id = req.user.dealership_id;

    const query = `
      DELETE FROM saved_searches
      WHERE id = $1 AND user_id = $2 AND dealership_id = $3
      RETURNING id;
    `;

    const result = await pool.query(query, [id, user_id, dealership_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Busca salva não encontrada' });
    }

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('❌ Erro ao deletar busca salva:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /sourcing/saved-searches/:id/run
 * Executar busca salva: scrape + comparar histórico + retornar novos e mudanças
 */
router.post('/saved-searches/:id/run', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const dealership_id = req.user.dealership_id;

    // 1. Buscar saved_search
    const searchQuery = `
      SELECT * FROM saved_searches
      WHERE id = $1 AND user_id = $2 AND dealership_id = $3;
    `;

    const searchResult = await pool.query(searchQuery, [id, user_id, dealership_id]);
    if (searchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Busca salva não encontrada' });
    }

    const savedSearch = searchResult.rows[0];
    const criteria = savedSearch.criteria;

    // 2. Scrape usando critérios da busca
    const scrapedVehicles = await searchWithFilters(criteria);

    // 3. Processar cada resultado: detectar novos e mudanças de preço
    const newVehicles = [];
    const priceChangedVehicles = [];
    const existingVehicles = [];

    for (const vehicle of scrapedVehicles) {
      const external_id = `${vehicle.platform}_${vehicle.id}`;
      const price = vehicle.price;

      // Buscar em search_results
      const existQuery = `
        SELECT * FROM search_results
        WHERE search_id = $1 AND external_id = $2
        ORDER BY found_at DESC
        LIMIT 1;
      `;

      const existResult = await pool.query(existQuery, [id, external_id]);

      if (existResult.rows.length === 0) {
        // Novo veículo
        newVehicles.push(vehicle);

        // Inserir em search_results
        const insertQuery = `
          INSERT INTO search_results (search_id, vehicle_data, source, external_id, price, is_new, price_changed)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *;
        `;

        await pool.query(insertQuery, [
          id,
          JSON.stringify(vehicle),
          vehicle.platform,
          external_id,
          price,
          true,
          false,
        ]);
      } else {
        const existing = existResult.rows[0];
        existingVehicles.push(vehicle);

        // Verificar mudança de preço
        if (existing.price && price && Math.abs(existing.price - price) > 100) {
          priceChangedVehicles.push({
            ...vehicle,
            previousPrice: existing.price,
          });

          // Atualizar em search_results
          const updateQuery = `
            UPDATE search_results
            SET price_changed = true, previous_price = $1, price = $2
            WHERE id = $3
            RETURNING *;
          `;

          await pool.query(updateQuery, [existing.price, price, existing.id]);
        }
      }
    }

    // 4. Retornar resultado
    res.json({
      searchId: id,
      totalResults: scrapedVehicles.length,
      new: newVehicles.length,
      priceChanged: priceChangedVehicles.length,
      results: {
        new: newVehicles,
        priceChanged: priceChangedVehicles,
        existing: existingVehicles,
      },
    });
  } catch (error) {
    console.error('❌ Erro ao executar busca salva:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /sourcing/saved-searches/:id/results
 * Listar histórico de resultados de uma busca salva
 */
router.get('/saved-searches/:id/results', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const dealership_id = req.user.dealership_id;

    // Verificar que busca salva pertence ao usuário
    const searchQuery = `
      SELECT id FROM saved_searches
      WHERE id = $1 AND user_id = $2 AND dealership_id = $3;
    `;

    const searchResult = await pool.query(searchQuery, [id, user_id, dealership_id]);
    if (searchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Busca salva não encontrada' });
    }

    // Buscar resultados
    const resultsQuery = `
      SELECT * FROM search_results
      WHERE search_id = $1
      ORDER BY found_at DESC;
    `;

    const resultsResult = await pool.query(resultsQuery, [id]);

    const results = resultsResult.rows.map(row => ({
      id: row.id,
      vehicleData: row.vehicle_data,
      source: row.source,
      externalId: row.external_id,
      price: row.price,
      foundAt: row.found_at,
      alertedAt: row.alerted_at,
      isNew: row.is_new,
      priceChanged: row.price_changed,
      previousPrice: row.previous_price,
    }));

    res.json({ searchId: id, results });
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// AI SEARCH (Gemini)
// ============================================

/**
 * POST /sourcing/ai-search
 * Busca inteligente: descrição em linguagem natural → filtros → scrape → resumo
 */
router.post('/ai-search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query é obrigatória' });
    }

    // CRITICAL: Verificar se GEMINI_API_KEY está configurada
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Busca IA indisponível. Configure GEMINI_API_KEY.',
        code: 'GEMINI_API_KEY_NOT_SET'
      });
    }

    // 1. Gemini extrai filtros do texto natural
    const filters = await extractFiltersFromText(query);

    // 2. Busca com filtros extraídos
    const vehicles = await searchWithFilters(filters);

    // 3. Gemini gera resumo
    const summary = await summarizeResults(vehicles, query);

    res.json({
      query,
      filters,
      vehicles,
      summary,
      totalFound: vehicles.length,
    });
  } catch (error) {
    console.error('❌ Erro em AI search:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RUN AND NOTIFY (Busca + Alerta WhatsApp)
// ============================================

/**
 * POST /sourcing/saved-searches/:id/run-and-notify
 * Executa busca, identifica SÓ novos, gera msg WhatsApp
 * Usado por N8N para CRON + alertas automáticos
 */
router.post('/saved-searches/:id/run-and-notify', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const dealership_id = req.user.dealership_id;

    // 1. Buscar saved_search
    const searchQuery = `
      SELECT * FROM saved_searches
      WHERE id = $1 AND user_id = $2 AND dealership_id = $3;
    `;

    const searchResult = await pool.query(searchQuery, [id, user_id, dealership_id]);
    if (searchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Busca salva não encontrada' });
    }

    const savedSearch = searchResult.rows[0];
    const criteria = savedSearch.criteria;

    // 2. Scrape usando critérios
    const scrapedVehicles = await searchWithFilters(criteria);

    // 3. Processar SÓ novos (is_new=true E alerted_at=NULL)
    const newVehicles = [];

    for (const vehicle of scrapedVehicles) {
      const external_id = `${vehicle.platform}_${vehicle.id}`;
      const price = vehicle.price;

      const existQuery = `
        SELECT * FROM search_results
        WHERE search_id = $1 AND external_id = $2
        ORDER BY found_at DESC
        LIMIT 1;
      `;

      const existResult = await pool.query(existQuery, [id, external_id]);

      if (existResult.rows.length === 0) {
        // Novo veículo
        newVehicles.push(vehicle);

        const insertQuery = `
          INSERT INTO search_results (search_id, vehicle_data, source, external_id, price, is_new, price_changed)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *;
        `;

        await pool.query(insertQuery, [
          id,
          JSON.stringify(vehicle),
          vehicle.platform,
          external_id,
          price,
          true,
          false,
        ]);
      }
    }

    // 4. Gemini gera msg WhatsApp (só se houver novos)
    let whatsappMessage = null;
    if (newVehicles.length > 0) {
      whatsappMessage = await generateWhatsAppMessage(savedSearch.name, newVehicles, scrapedVehicles);

      // Marcar como "alertado" (alerted_at = now)
      for (const newVeh of newVehicles) {
        const external_id = `${newVeh.platform}_${newVeh.id}`;
        const updateQuery = `
          UPDATE search_results
          SET alerted_at = CURRENT_TIMESTAMP
          WHERE search_id = $1 AND external_id = $2;
        `;
        await pool.query(updateQuery, [id, external_id]);
      }
    }

    res.json({
      searchId: id,
      searchName: savedSearch.name,
      totalResults: scrapedVehicles.length,
      newCount: newVehicles.length,
      newVehicles,
      whatsappMessage,
      hasNewVehicles: newVehicles.length > 0,
    });
  } catch (error) {
    console.error('❌ Erro em run-and-notify:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CRON ACTIVE (Sem Auth - Para N8N)
// ============================================

/**
 * GET /sourcing/saved-searches/cron/active
 * Lista buscas salvas ATIVAS com alertWhatsapp
 * SEM AUTENTICAÇÃO (N8N chama isso via CRON)
 * Rate limit: máx 1 req/min por origem (opcional)
 */
router.get('/cron/active', async (req, res) => {
  try {
    // SECURITY: Se quiser adicionar rate limit, fazer aqui
    // Por enquanto, endpoint público mas com query restritiva

    const query = `
      SELECT id, user_id, dealership_id, name, criteria, alert_whatsapp, whatsapp_number, alert_email, email_address
      FROM saved_searches
      WHERE is_active = true AND alert_whatsapp = true
      ORDER BY updated_at DESC;
    `;

    const result = await pool.query(query);
    const searches = result.rows.map(normalizeSavedSearch);

    res.json({ searches, count: searches.length });
  } catch (error) {
    console.error('❌ Erro ao buscar buscas ativas:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
