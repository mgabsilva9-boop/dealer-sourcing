/**
 * Rotas de Sourcing (Busca Inteligente)
 * Phase 4: Backend Implementation with Database Persistence
 * Agents: @dev (Dex - The Builder)
 */

import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { scrapeMultiplePlatforms, searchWithFilters, generateRealisticVehicles } from '../utils/scrapers.js';

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

export default router;
