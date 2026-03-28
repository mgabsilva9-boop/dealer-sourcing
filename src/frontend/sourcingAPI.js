/**
 * Sourcing API Client - Dealer Sourcing MVP
 * Maps to actual backend endpoints (Phase 4 Implementation)
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 5000;

// Test JWT Token (will be replaced with real authentication in Phase 5+)
const TEST_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJpYXQiOjE2Nzg3OTIwMDB9.test';

export class APIError extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// Generic fetch wrapper with timeout
async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('sourcingToken') || TEST_JWT;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new APIError(
        response.status,
        data?.error || `HTTP ${response.status}`,
        data,
      );
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

// Sourcing API endpoints
export const sourcingAPI = {
  /**
   * GET /sourcing/list
   * List all vehicles with pagination
   */
  async listVehicles(limit = 20, offset = 0) {
    return fetchAPI(`/sourcing/list?limit=${limit}&offset=${offset}`);
  },

  /**
   * GET /sourcing/search
   * Search vehicles with filters
   */
  async searchVehicles(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.make) params.append('make', filters.make);
    if (filters.model) params.append('model', filters.model);
    if (filters.priceMin) params.append('priceMin', filters.priceMin);
    if (filters.priceMax) params.append('priceMax', filters.priceMax);
    if (filters.kmMax) params.append('kmMax', filters.kmMax);
    if (filters.discountMin) params.append('discountMin', filters.discountMin);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const query = params.toString();
    return fetchAPI(`/sourcing/search${query ? '?' + query : ''}`);
  },

  /**
   * GET /sourcing/:id
   * Get vehicle details by ID
   */
  async getVehicle(id) {
    return fetchAPI(`/sourcing/${id}`);
  },

  /**
   * POST /sourcing/:id/interested
   * Mark vehicle as interested (database persistence)
   */
  async markInterested(vehicleId, notes = '') {
    return fetchAPI(`/sourcing/${vehicleId}/interested`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  /**
   * GET /sourcing/favorites
   * Get user favorites with RLS isolation
   */
  async getFavorites(status = null, limit = 20, offset = 0) {
    let endpoint = `/sourcing/favorites?limit=${limit}&offset=${offset}`;
    if (status) endpoint += `&status=${status}`;
    return fetchAPI(endpoint);
  },

  /**
   * GET /health
   * Check API health
   */
  async health() {
    return fetchAPI('/health');
  },
};

// Authentication helper
export const authAPI = {
  /**
   * Set authentication token (for future real JWT implementation)
   */
  setToken(token) {
    localStorage.setItem('sourcingToken', token);
  },

  /**
   * Get current token
   */
  getToken() {
    return localStorage.getItem('sourcingToken') || TEST_JWT;
  },

  /**
   * Clear authentication
   */
  logout() {
    localStorage.removeItem('sourcingToken');
  },

  /**
   * Use test token (MVP testing)
   */
  useTestToken() {
    localStorage.setItem('sourcingToken', TEST_JWT);
  },
};

export default {
  sourcingAPI,
  authAPI,
  APIError,
};
