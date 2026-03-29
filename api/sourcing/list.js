/**
 * GET /api/sourcing/list
 * List vehicles with pagination
 */

import { generateRealisticVehicles } from '../../src/utils/scrapers.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  if (limit < 1 || limit > 100) {
    return res.status(400).json({ error: 'limit must be between 1 and 100' });
  }

  try {
    const vehicles = await generateRealisticVehicles('');
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
    console.error('Error listing vehicles:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
