/**
 * GET /api/sourcing/search
 * Search vehicles with filters
 */

import { searchWithFilters } from '../../src/utils/scrapers.js';

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
    const discountMin = validateNumber(req.query.discountMin, -100, 100);
    const limit = validateNumber(req.query.limit || 20, 1, 100);
    const offset = validateNumber(req.query.offset || 0, 0, Infinity);

    if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
      return res.status(400).json({ error: 'priceMin cannot be greater than priceMax' });
    }

    const results = await searchWithFilters({
      make,
      model,
      priceMin,
      priceMax,
      kmMax,
      discountMin,
    });

    results.sort((a, b) => b.score - a.score);
    const total = results.length;
    const paginated = results.slice(offset, offset + limit);

    res.json({
      total,
      limit,
      offset,
      results: paginated,
    });
  } catch (error) {
    console.error('Error searching vehicles:', error);
    res.status(400).json({ error: error.message || 'Invalid search parameters' });
  }
}
