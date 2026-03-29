/**
 * GET /api/sourcing/favorites
 * Get user's saved vehicles from Neon PostgreSQL
 */

import { query } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const status = req.query.status || 'interested';
  const userId = req.user?.id || '550e8400-e29b-41d4-a716-446655440000';

  try {
    // Fetch favorites with pagination
    const results = await query(
      `SELECT id, user_id, vehicle_id, vehicle_data, notes, status, saved_at, updated_at
       FROM interested_vehicles
       WHERE user_id = $1 AND status = $2
       ORDER BY saved_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, status, limit, offset]
    );

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM interested_vehicles WHERE user_id = $1 AND status = $2',
      [userId, status]
    );

    res.json({
      total: parseInt(countResult[0].total),
      limit,
      offset,
      status_filter: status,
      results,
    });
  } catch (error) {
    console.error('[GET /api/sourcing/favorites]', error.message);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
}
