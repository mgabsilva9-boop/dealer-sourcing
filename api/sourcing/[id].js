/**
 * GET /api/sourcing/[id]
 * Get vehicle details by ID
 */

import { generateRealisticVehicles } from '../../src/utils/scrapers.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Vehicle ID is required' });
  }

  try {
    const vehicles = await generateRealisticVehicles('');
    const vehicle = vehicles.find(v => v.id === id || v.id === Number(id));

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
