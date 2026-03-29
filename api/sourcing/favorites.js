/**
 * GET /api/sourcing/favorites
 * Get user's favorites (will use Neon DB in production)
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const status = req.query.status || null;

  // Mock response for MVP
  // In production, this would query Neon PostgreSQL with RLS
  const mockFavorites = {
    total: 0,
    limit,
    offset,
    status_filter: status,
    results: [], // Empty for MVP - will connect to DB later
  };

  res.json(mockFavorites);
}
