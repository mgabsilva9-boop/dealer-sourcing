/**
 * GET /api/sourcing/[id]
 * Get vehicle details by ID with user interest status from Neon DB
 */

import { generateRealisticVehicles } from '../../src/utils/scrapers.js';
import { query } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const userId = req.user?.id || '550e8400-e29b-41d4-a716-446655440000';

  if (!id) {
    return res.status(400).json({ error: 'Vehicle ID is required' });
  }

  try {
    const vehicles = await generateRealisticVehicles('');
    const vehicle = vehicles.find(v => v.id === id || v.id === Number(id));

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check if user has marked this vehicle as interested
    try {
      const interest = await query(
        'SELECT id, status, notes FROM interested_vehicles WHERE user_id = $1 AND vehicle_id = $2',
        [userId, String(id)]
      );

      vehicle.user_interest = interest.length > 0 ? {
        is_interested: true,
        status: interest[0].status,
        notes: interest[0].notes,
        id: interest[0].id,
      } : { is_interested: false };
    } catch (dbError) {
      console.error('[GET /api/sourcing/[id]] DB interest check failed:', dbError.message);
      vehicle.user_interest = { is_interested: false };
    }

    res.json(vehicle);
  } catch (error) {
    console.error('[GET /api/sourcing/[id]]', error.message);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
