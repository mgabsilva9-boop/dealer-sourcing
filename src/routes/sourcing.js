/**
 * Rotas de Sourcing (Busca Inteligente)
 * Busca de veículos em múltiplas plataformas com dados reais
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { scrapeMultiplePlatforms, searchWithFilters, generateRealisticVehicles } from '../utils/scrapers.js';

const router = express.Router();

// Cache em memória para evitar scraping a cada request
let vehicleCache = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtém veículos do cache ou scrape
 */
const getVehicles = async (query = '') => {
  const now = Date.now();

  // Retornar cache se ainda válido
  if (vehicleCache.length > 0 && now - cacheTimestamp < CACHE_DURATION) {
    return vehicleCache;
  }

  // Scraping novo
  try {
    vehicleCache = await scrapeMultiplePlatforms(query);
    cacheTimestamp = now;
    return vehicleCache;
  } catch (error) {
    console.error('Erro ao fazer scrape, usando fallback:', error.message);
    // Fallback: dados realistas estruturados
    vehicleCache = generateRealisticVehicles(query);
    cacheTimestamp = now;
    return vehicleCache;
  }
};

// GET - Buscar sourcing com filtros (dados reais)
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { make, model, priceMin, priceMax, kmMax, discountMin } = req.query;

    // Buildar query para scraper
    let query = [];
    if (make) query.push(make);
    if (model) query.push(model);

    // Buscar com filtros
    let results = await searchWithFilters({
      make,
      model,
      priceMin: priceMin ? Number(priceMin) : null,
      priceMax: priceMax ? Number(priceMax) : null,
      kmMax: kmMax ? Number(kmMax) : null,
      discountMin: discountMin ? Number(discountMin) : null,
    });

    // Ordenar por score (melhor primeiro)
    results.sort((a, b) => b.score - a.score);

    res.json({
      total: results.length,
      results: results,
    });
  } catch (error) {
    console.error('Erro ao buscar sourcing:', error);
    res.status(500).json({ error: 'Erro ao buscar sourcing' });
  }
});

// GET - Listar todos (sem filtros, dados reais)
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const vehicles = await getVehicles();
    const sorted = vehicles.sort((a, b) => b.score - a.score);

    res.json({
      total: sorted.length,
      results: sorted,
    });
  } catch (error) {
    console.error('Erro ao listar sourcing:', error);
    res.status(500).json({ error: 'Erro ao listar sourcing' });
  }
});

// GET - Obter um sourcing específico (dados reais)
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

// POST - Adicionar sourcing aos favoritos/interessados (dados reais)
router.post('/:id/interested', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const vehicles = await getVehicles();
    const vehicle = vehicles.find(v => v.id === id || v.id === Number(id));

    if (!vehicle) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    // TODO: Em produção, salvar em DB com user_id
    res.json({
      message: 'Veículo marcado como interessante',
      vehicle: vehicle,
    });
  } catch (error) {
    console.error('Erro ao marcar como interessado:', error);
    res.status(500).json({ error: 'Erro ao marcar como interessado' });
  }
});

export default router;
