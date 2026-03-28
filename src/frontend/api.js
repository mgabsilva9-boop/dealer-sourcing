/**
 * API Client - Dealer Sourcing MVP
 * Todas as chamadas HTTP para o backend
 */

const API_BASE = process.env.VITE_API_URL || 'http://localhost:3000';

class APIError extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// ─── HELPER: Requisição genérica
async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new APIError(response.status, data.error || 'API Error', data);
  }

  return data;
}

// ─── AUTH API
export const authAPI = {
  async login(email, password) {
    const result = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.token) {
      localStorage.setItem('token', result.token);
    }
    return result;
  },

  async register(email, password, name) {
    const result = await fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    if (result.token) {
      localStorage.setItem('token', result.token);
    }
    return result;
  },

  logout() {
    localStorage.removeItem('token');
  },
};

// ─── VEHICLES API
export const vehiclesAPI = {
  async search(brand, model) {
    return fetchAPI('/vehicles/search', {
      method: 'POST',
      body: JSON.stringify({ brand, model }),
    });
  },

  async interested(vehicleId, platform) {
    return fetchAPI('/vehicles/interested', {
      method: 'POST',
      body: JSON.stringify({ vehicleId, platform }),
    });
  },

  async list() {
    return fetchAPI('/vehicles/list');
  },

  async create(vehicleData) {
    return fetchAPI('/vehicles/create', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });
  },

  async update(id, vehicleData) {
    return fetchAPI(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicleData),
    });
  },

  async delete(id) {
    return fetchAPI(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  },
};

// ─── SEARCH API (sourcing)
export const searchAPI = {
  async query(brand, model) {
    return fetchAPI('/search/query', {
      method: 'POST',
      body: JSON.stringify({ brand, model }),
    });
  },
};

// ─── HISTORY API
export const historyAPI = {
  async get() {
    return fetchAPI('/history');
  },

  async search(brand, model) {
    return fetchAPI('/history/search', {
      method: 'POST',
      body: JSON.stringify({ brand, model }),
    });
  },
};

// ─── HEALTH CHECK
export const healthAPI = {
  async check() {
    try {
      const result = await fetch(`${API_BASE}/health`);
      return result.ok;
    } catch {
      return false;
    }
  },
};

export { APIError, API_BASE };
