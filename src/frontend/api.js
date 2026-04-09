/**
 * API Client - Dealer Sourcing MVP
 * Todas as chamadas HTTP para o backend
 */

// URL do backend — usa VITE_API_URL se disponível, senão localhost:3000
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

  // Auto-logout se receber 401 (token inválido ou expirado)
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/'; // Redireciona para login
    return; // Não continua a execução
  }

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

  async logout() {
    try {
      // Chamar endpoint /auth/logout para adicionar token à blacklist
      const response = await fetchAPI('/auth/logout', {
        method: 'POST'
      });
      console.log('[authAPI.logout] Backend logout successful:', response);
    } catch (error) {
      console.warn('[authAPI.logout] Backend logout failed:', error.message);
      // Não rethrow — logout local sempre funciona
    }
  },

  async me() {
    return fetchAPI('/auth/me');
  },

  async changePassword(currentPassword, newPassword) {
    return fetchAPI('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// ─── VEHICLES API (Sourcing - carros de interesse)
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

  async interestedList() {
    return fetchAPI('/vehicles/interested');
  },
};

// ─── INVENTORY API (Estoque da concessionária)
export const inventoryAPI = {
  async list() {
    return fetchAPI('/inventory/list');
  },

  async create(vehicleData) {
    return fetchAPI('/inventory', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });
  },

  async get(id) {
    return fetchAPI(`/inventory/${id}`);
  },

  async update(id, vehicleData) {
    return fetchAPI(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicleData),
    });
  },

  async delete(id) {
    return fetchAPI(`/inventory/${id}`, {
      method: 'DELETE',
    });
  },

  async uploadImage(id, imageBase64) {
    return fetchAPI(`/inventory/${id}/upload-image`, {
      method: 'POST',
      body: JSON.stringify({ imageBase64 }),
    });
  },

  async deleteImage(id) {
    return fetchAPI(`/inventory/${id}/image`, {
      method: 'DELETE',
    });
  },

  async plSummary(from, to) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const qs = params.toString();
    return fetchAPI(`/inventory/pl-summary${qs ? '?' + qs : ''}`);
  },
};

// ─── CRM API (Clientes)
export const crmAPI = {
  async list() {
    return fetchAPI('/crm/list');
  },

  async create(customerData) {
    return fetchAPI('/crm/create', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  },

  async get(id) {
    return fetchAPI(`/crm/${id}`);
  },

  async update(id, customerData) {
    return fetchAPI(`/crm/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  },

  async delete(id) {
    return fetchAPI(`/crm/${id}`, {
      method: 'DELETE',
    });
  },
};

// ─── EXPENSES API (Despesas)
export const expensesAPI = {
  async list() {
    return fetchAPI('/expenses/list');
  },

  async create(expenseData) {
    return fetchAPI('/expenses/create', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  },

  async get(id) {
    return fetchAPI(`/expenses/${id}`);
  },

  async update(id, expenseData) {
    return fetchAPI(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  },

  async delete(id) {
    return fetchAPI(`/expenses/${id}`, {
      method: 'DELETE',
    });
  },

  async summary() {
    return fetchAPI('/expenses/summary/by-category');
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

// ─── SOURCING API (busca inteligente)
export const sourcingAPI = {
  async list() {
    return fetchAPI('/sourcing/list');
  },

  async search(filters) {
    const params = new URLSearchParams();
    if (filters.make) params.append('make', filters.make);
    if (filters.model) params.append('model', filters.model);
    if (filters.priceMin) params.append('priceMin', filters.priceMin);
    if (filters.priceMax) params.append('priceMax', filters.priceMax);
    if (filters.kmMax) params.append('kmMax', filters.kmMax);
    if (filters.discountMin) params.append('discountMin', filters.discountMin);
    return fetchAPI(`/sourcing/search?${params.toString()}`);
  },

  async get(id) {
    return fetchAPI(`/sourcing/${id}`);
  },

  async markInterested(id) {
    return fetchAPI(`/sourcing/${id}/interested`, {
      method: 'POST',
      body: JSON.stringify({}),
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

// ─── IPVA API
export const ipvaAPI = {
  async list(status) {
    const qs = status ? `?status=${status}` : '';
    return fetchAPI(`/ipva/list${qs}`);
  },

  async summary() {
    return fetchAPI('/ipva/summary');
  },

  async urgent() {
    return fetchAPI('/ipva/urgent');
  },

  async create(vehicleId, data) {
    return fetchAPI(`/ipva/vehicle/${vehicleId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async markPaid(id) {
    return fetchAPI(`/ipva/${id}/mark-paid`, {
      method: 'PUT',
      body: JSON.stringify({}),
    });
  },

  async delete(id) {
    return fetchAPI(`/ipva/${id}`, { method: 'DELETE' });
  },
};

// ─── FINANCIAL API
export const financialAPI = {
  async summary() {
    return fetchAPI('/financial/summary');
  },

  async vehiclePL(id) {
    return fetchAPI(`/financial/vehicle/${id}`);
  },

  async monthly(year, month) {
    return fetchAPI(`/financial/report/monthly/${year}/${month}`);
  },

  async comparison() {
    return fetchAPI('/financial/comparison');
  },
};

export { APIError, API_BASE };
