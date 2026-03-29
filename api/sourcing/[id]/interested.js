/**
 * POST /api/sourcing/[id]/interested
 * Mark vehicle as interested (database persistence via Neon)
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { notes } = req.body || {};

  if (!id) {
    return res.status(400).json({ error: 'Vehicle ID is required' });
  }

  // Mock response for MVP - real implementation would use Neon DB
  // Environment: DATABASE_URL will be set in Vercel
  const mockResponse = {
    message: 'Vehicle marked as interested',
    id: Math.floor(Math.random() * 1000),
    vehicle_id: id,
    status: 'interested',
    notes: notes || '',
    saved_at: new Date().toISOString(),
  };

  res.status(201).json(mockResponse);
}
