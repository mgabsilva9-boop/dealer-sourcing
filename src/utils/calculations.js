/**
 * Utilitários de cálculos financeiros
 */

/**
 * Calcula total de custos de um veículo
 */
export const calculateTotalCosts = (costs = {}) => {
  return Object.values(costs).reduce((sum, cost) => sum + (Number(cost) || 0), 0);
};

/**
 * Calcula lucro de venda
 */
export const calculateProfit = (salePrice, costs) => {
  const totalCosts = calculateTotalCosts(costs);
  return salePrice - totalCosts;
};

/**
 * Calcula margem de lucro em %
 */
export const calculateMargin = (salePrice, costs) => {
  const profit = calculateProfit(salePrice, costs);
  if (salePrice <= 0) return 0;
  return ((profit / salePrice) * 100).toFixed(1);
};

/**
 * Calcula desconto vs FIPE
 */
export const calculateDiscount = (price, fipePrice) => {
  if (fipePrice <= 0) return 0;
  const discount = ((price - fipePrice) / fipePrice) * 100;
  return discount.toFixed(1);
};

/**
 * Calcula dias em estoque
 */
export const calculateDaysInStock = (purchaseDate) => {
  if (!purchaseDate) return 0;
  const purchase = new Date(purchaseDate);
  const today = new Date();
  const diffTime = today - purchase;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

/**
 * Calcula receita total (veículos vendidos)
 */
export const calculateTotalRevenue = (vehicles = []) => {
  return vehicles
    .filter(v => v.status === 'sold')
    .reduce((sum, v) => sum + (Number(v.soldPrice || v.salePrice || 0) || 0), 0);
};

/**
 * Calcula custos totais (todos veículos)
 */
export const calculateTotalCostsAll = (vehicles = []) => {
  return vehicles.reduce((sum, v) => sum + calculateTotalCosts(v.costs || {}), 0);
};

/**
 * Calcula lucro bruto
 */
export const calculateGrossProfit = (vehicles = []) => {
  const revenue = calculateTotalRevenue(vehicles);
  const costs = calculateTotalCostsAll(vehicles);
  return revenue - costs;
};

/**
 * Calcula score de qualidade do negócio (sourcing)
 * Baseado em: desconto, km, histórico, condição, donos anteriores, acidentes
 */
export const calculateSourcingScore = (vehicle) => {
  let score = 100;

  // Penalidade por preço acima de FIPE
  if (vehicle.discount > 0) {
    score -= vehicle.discount * 2; // penaliza caro
  }

  // Bônus por preço abaixo de FIPE
  if (vehicle.discount < 0 && vehicle.discount > -20) {
    score += Math.abs(vehicle.discount) * 0.5; // bônus desconto
  } else if (vehicle.discount <= -20) {
    score += 10; // máximo bônus para desconto muito bom
  }

  // Penalidade por km
  if (vehicle.km > 100000) score -= 20;
  else if (vehicle.km > 50000) score -= 10;
  else if (vehicle.km > 20000) score -= 5;

  // Penalidade por histórico de serviço
  if (vehicle.serviceHistory === 'Sem registros') score -= 15;
  else if (vehicle.serviceHistory === 'Parcial') score -= 5;

  // Penalidade por múltiplos donos
  if (vehicle.owners > 2) score -= 10;

  // Penalidade por acidentes
  if (vehicle.accidents > 0) score -= Math.min(15, vehicle.accidents * 5);

  // Penalidade por condição do corpo
  if (vehicle.bodyCondition === 'Regular') score -= 10;

  return Math.max(1, Math.min(100, Math.round(score)));
};

/**
 * Formata número como moeda BR
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

/**
 * Formata número como moeda abreviada (ex: 50K, 1.2M)
 */
export const formatCurrencyShort = (value) => {
  if (!value) return '—';
  const num = Number(value) || 0;
  if (num >= 1000000) return `R$ ${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `R$ ${(num / 1000).toFixed(0)}K`;
  return `R$ ${num}`;
};
