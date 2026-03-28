/**
 * Constantes globais da aplicação
 */

export const API_ENDPOINTS = {
  AUTH: '/auth',
  INVENTORY: '/inventory',
  CRM: '/crm',
  EXPENSES: '/expenses',
  SOURCING: '/sourcing',
  HEALTH: '/health',
};

export const VEHICLE_STATUS = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  SOLD: 'sold',
  MAINTENANCE: 'maintenance',
  DOCUMENTATION: 'documentation',
  TRANSIT: 'transit',
};

export const EXPENSE_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  URGENT: 'urgent',
  OVERDUE: 'overdue',
};

export const EXPENSE_CATEGORIES = [
  'Operacional',
  'Financiamento',
  'IPVA',
  'Aluguel',
  'Seguro',
  'Combustivel',
  'Manutencao',
  'Marketing',
  'Outros',
];

export const SOURCING_PLATFORMS = [
  'WebMotors',
  'OLX',
  'Marketplace',
  'Mercado Livre',
];

export const KM_RATING = {
  MUITO_BAIXA: 'Muito baixa',
  BAIXA: 'Baixa',
  MEDIA: 'Media',
  ALTA: 'Alta',
};

export const SCORE_RANGES = {
  EXCELLENT: 90,
  GOOD: 75,
  RISK: 0,
};

export const API_MESSAGES = {
  SUCCESS: 'Operação realizada com sucesso',
  ERROR: 'Erro ao processar solicitação',
  UNAUTHORIZED: 'Não autorizado',
  NOT_FOUND: 'Recurso não encontrado',
  INVALID_INPUT: 'Dados inválidos',
};
