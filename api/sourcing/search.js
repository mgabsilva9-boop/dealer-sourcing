/**
 * GET /api/sourcing/search
 * Search vehicles with filters from Neon PostgreSQL
 */

import { query } from '../lib/db.js';

const validateNumber = (value, min = 0, max = Infinity) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (isNaN(num)) throw new Error('Invalid number');
  if (num < min || num > max) throw new Error(`Value out of range`);
  return num;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const make = req.query.make || null;
    const model = req.query.model || null;
    const priceMin = validateNumber(req.query.priceMin, 0, 1000000);
    const priceMax = validateNumber(req.query.priceMax, 0, 1000000);
    const kmMax = validateNumber(req.query.kmMax, 0, 999999);
    const limit = validateNumber(req.query.limit || 20, 1, 100);
    const offset = validateNumber(req.query.offset || 0, 0, Infinity);

    if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
      return res.status(400).json({ error: 'priceMin cannot be greater than priceMax' });
    }

    // Build dynamic WHERE clause
    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    if (make) {
      whereConditions.push(`vehicle_data->>'make' = $${paramCount++}`);
      params.push(make);
    }

    if (model) {
      whereConditions.push(`vehicle_data->>'model' = $${paramCount++}`);
      params.push(model);
    }

    if (priceMin !== null) {
      whereConditions.push(`(vehicle_data->>'price')::NUMERIC >= $${paramCount++}`);
      params.push(priceMin);
    }

    if (priceMax !== null) {
      whereConditions.push(`(vehicle_data->>'price')::NUMERIC <= $${paramCount++}`);
      params.push(priceMax);
    }

    if (kmMax !== null) {
      whereConditions.push(`(vehicle_data->>'km')::INTEGER <= $${paramCount++}`);
      params.push(kmMax);
    }

    // Add limit/offset
    const limitParam = paramCount++;
    const offsetParam = paramCount++;
    params.push(limit);
    params.push(offset);

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Fetch results
    const results = await query(
      `SELECT id, vehicle_id, vehicle_data, notes, status, saved_at
       FROM interested_vehicles
       ${whereClause}
       ORDER BY saved_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      params
    );

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM interested_vehicles ${whereClause}`;
    const countParams = params.slice(0, params.length - 2); // Exclude limit/offset
    const countResult = await query(countQuery, countParams);

    res.json({
      total: parseInt(countResult[0].total),
      limit,
      offset,
      filters: { make, model, priceMin, priceMax, kmMax },
      results,
    });
  } catch (error) {
    console.error('[GET /api/sourcing/search]', error.message);
    res.status(400).json({ error: error.message || 'Invalid search parameters' });
  }
}
