/**
 * Rotas de Histórico
 * GET /history - Histórico de buscas do usuário
 * GET /history/:searchId - Detalhes de uma busca específica
 */

import express from 'express';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ===== HISTÓRICO DE BUSCAS =====

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT
        s.id,
        s.query,
        s.results_count,
        s.created_at,
        COUNT(DISTINCT iv.id) as interested_count
      FROM searches s
      LEFT JOIN found_vehicles fv ON s.id = fv.search_id
      LEFT JOIN interested_vehicles iv ON fv.id = iv.vehicle_id
      WHERE s.user_id = $1
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT 50`,
      [req.user.id],
    );

    res.json({
      total: result.rows.length,
      searches: result.rows.map(row => ({
        id: row.id,
        query: row.query,
        resultsCount: row.results_count,
        interestedCount: row.interested_count || 0,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// ===== DETALHES DE UMA BUSCA =====

router.get('/:searchId', authMiddleware, async (req, res) => {
  try {
    const { searchId } = req.params;

    // Buscar informações da busca
    const searchResult = await query(
      'SELECT * FROM searches WHERE id = $1 AND user_id = $2',
      [searchId, req.user.id],
    );

    if (searchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Busca não encontrada' });
    }

    const search = searchResult.rows[0];

    // Buscar veículos desta busca
    const vehiclesResult = await query(
      `SELECT
        fv.*,
        iv.id as interested_id,
        iv.customer_name,
        iv.customer_phone,
        iv.status as interest_status
      FROM found_vehicles fv
      LEFT JOIN interested_vehicles iv ON fv.id = iv.vehicle_id
      WHERE fv.search_id = $1
      ORDER BY fv.score DESC`,
      [searchId],
    );

    res.json({
      search: {
        id: search.id,
        query: search.query,
        resultsCount: search.results_count,
        createdAt: search.created_at,
      },
      vehicles: vehiclesResult.rows.map(row => ({
        id: row.id,
        platform: row.platform,
        make: row.make,
        model: row.model,
        year: row.year,
        price: row.price,
        km: row.km,
        photoUrl: row.photo_url,
        link: row.link,
        score: row.score,
        interested: row.interested_id ? {
          id: row.interested_id,
          customerName: row.customer_name,
          customerPhone: row.customer_phone,
          status: row.interest_status,
        } : null,
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes' });
  }
});

// ===== ESTATÍSTICAS =====

router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    const statsResult = await query(
      `SELECT
        COUNT(DISTINCT s.id) as total_searches,
        SUM(s.results_count) as total_vehicles_found,
        COUNT(DISTINCT iv.id) as total_interested,
        MAX(s.created_at) as last_search
      FROM searches s
      LEFT JOIN found_vehicles fv ON s.id = fv.search_id
      LEFT JOIN interested_vehicles iv ON fv.id = iv.vehicle_id
      WHERE s.user_id = $1`,
      [req.user.id],
    );

    const stats = statsResult.rows[0];

    res.json({
      totalSearches: parseInt(stats.total_searches) || 0,
      totalVehiclesFound: parseInt(stats.total_vehicles_found) || 0,
      totalInterested: parseInt(stats.total_interested) || 0,
      lastSearch: stats.last_search || null,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;
