/**
 * Rotas de Busca/Scraping
 * POST /search/query - Buscar carros em múltiplas plataformas
 */

import express from 'express';
import { searchAllPlatforms } from '../utils/scraper.js';
import { query as dbQuery } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ===== BUSCAR CARROS =====

router.post('/query', authMiddleware, async (req, res) => {
  try {
    const { queryText } = req.body;

    if (!queryText || queryText.trim().length === 0) {
      return res.status(400).json({ error: 'Busca vazia' });
    }

    console.log(`\n📍 Nova busca do usuário ${req.user.id}: "${queryText}"`);

    // Salvar busca no banco
    const searchResult = await dbQuery(
      'INSERT INTO searches (user_id, query) VALUES ($1, $2) RETURNING id',
      [req.user.id, queryText]
    );

    const searchId = searchResult.rows[0].id;

    // Fazer busca em plataformas (async)
    console.log('⏳ Buscando em WebMotors, OLX...');

    const vehicles = await searchAllPlatforms(queryText);

    // Salvar veículos encontrados no banco
    for (const vehicle of vehicles) {
      try {
        await dbQuery(
          `INSERT INTO found_vehicles
           (search_id, platform, make, model, price, km, photo_url, link, score)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (link) DO NOTHING`,
          [
            searchId,
            vehicle.platform,
            extractMake(vehicle.title),
            extractModel(vehicle.title),
            vehicle.price || 0,
            vehicle.km || 0,
            vehicle.image || '',
            vehicle.link,
            vehicle.score || 50
          ]
        );
      } catch (err) {
        console.error('Erro ao salvar veículo:', err);
      }
    }

    // Atualizar contagem de resultados
    await dbQuery(
      'UPDATE searches SET results_count = $1 WHERE id = $2',
      [vehicles.length, searchId]
    );

    console.log(`✅ Busca concluída: ${vehicles.length} veículos encontrados\n`);

    res.json({
      searchId,
      query: queryText,
      totalResults: vehicles.length,
      vehicles: vehicles.map(v => ({
        id: null, // ID do banco será preenchido depois
        platform: v.platform,
        title: v.title,
        price: v.price,
        km: v.km,
        image: v.image,
        link: v.link,
        score: v.score
      }))
    });
  } catch (error) {
    console.error('❌ Erro ao fazer busca:', error);
    res.status(500).json({ error: 'Erro ao buscar veículos' });
  }
});

// ===== BUSCAR HISTÓRICO DE RESULTADOS =====

router.get('/results/:searchId', authMiddleware, async (req, res) => {
  try {
    const { searchId } = req.params;

    // Buscar veículos da busca
    const result = await dbQuery(
      `SELECT * FROM found_vehicles
       WHERE search_id = $1
       ORDER BY score DESC`,
      [searchId]
    );

    res.json({
      vehicles: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar resultados:', error);
    res.status(500).json({ error: 'Erro ao buscar resultados' });
  }
});

// ===== HELPER FUNCTIONS =====

function extractMake(title) {
  // Primeira palavra é geralmente a marca
  const match = title.match(/^(\w+)/);
  return match ? match[1] : '';
}

function extractModel(title) {
  // Resto da string é modelo
  const firstWord = title.match(/^(\w+)\s+(.+)/);
  return firstWord ? firstWord[2] : title;
}

export default router;
