/**
 * POST /api/sourcing/[id]/interested
 * Mark vehicle as interested (database persistence via Neon)
 */

import { query } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { notes } = req.body || {};
  const userId = req.user?.id || '550e8400-e29b-41d4-a716-446655440000';

  if (!id) {
    return res.status(400).json({ error: 'Vehicle ID is required' });
  }

  try {
    const result = await query(
      `INSERT INTO interested_vehicles (user_id, vehicle_id, notes)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, vehicle_id) DO UPDATE SET
         notes = EXCLUDED.notes,
         updated_at = NOW()
       RETURNING id, user_id, vehicle_id, notes, saved_at`,
      [userId, id, notes || '']
    );

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('[POST /api/sourcing/[id]/interested]', error.message);
    res.status(500).json({ error: 'Failed to mark vehicle as interested' });
  }
}
