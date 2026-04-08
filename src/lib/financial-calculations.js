/**
 * Financial Calculations & Helper Functions
 * P&L, margins, IPVA calculations
 */

/**
 * Calcula P&L de um veículo
 * @param {Object} vehicle - Dados do veículo
 * @returns {Object} P&L completo
 */
export function calculateVehicleProfit(vehicle) {
  const {
    purchase_price = 0,
    sale_price = 0,
    transport_cost = 0,
    reconditioning_cost = 0,
    documentation_cost = 0,
    ipva_due = 0,
  } = vehicle;

  // Total de custos
  const totalCost =
    purchase_price +
    transport_cost +
    reconditioning_cost +
    documentation_cost +
    ipva_due;

  // Margem bruta (pode ser negativa)
  const margin = sale_price - totalCost;

  // Percentual de margem (baseado em preço de compra)
  const marginPercentage = purchase_price > 0
    ? (margin / purchase_price) * 100
    : 0;

  return {
    purchase_price,
    sale_price,
    transport_cost,
    reconditioning_cost,
    documentation_cost,
    ipva_due,
    total_cost: totalCost,
    margin,
    margin_percentage: parseFloat(marginPercentage.toFixed(2)),
    is_profitable: margin > 0,
  };
}

/**
 * Calcula IPVA baseado em estado e valor
 * Alíquotas brasileiras (dados 2026)
 * @param {string} state - UF (SP, SC, etc)
 * @param {number} vehicleValue - Valor do veículo em centavos
 * @param {Date} referenceDate - Data de referência (para calcular due_date)
 * @returns {Object} { aliquota, ipva_due, due_date, status }
 */
export function calculateIPVA(state, vehicleValue, referenceDate = new Date()) {
  const aliquotas = {
    'SP': 4.0,   // São Paulo
    'SC': 2.0,   // Santa Catarina
    'RJ': 3.0,   // Rio de Janeiro
    'MG': 3.5,   // Minas Gerais
    'RS': 3.0,   // Rio Grande do Sul
    'PR': 3.5,   // Paraná
    'BA': 3.0,   // Bahia
    'PE': 3.5,   // Pernambuco
  };

  const aliquota = aliquotas[state] || 3.0; // Default 3% se estado não reconhecido
  const ipvaDue = Math.round(vehicleValue * (aliquota / 100));

  // IPVA é cobrado em janeiro (vencimento típico = 31 de março)
  const nextYear = referenceDate.getFullYear();
  const dueDate = new Date(nextYear, 2, 31); // 31 de março do ano corrente

  // Se já passou de março, próximo IPVA é ano que vem
  if (referenceDate > dueDate) {
    dueDate.setFullYear(nextYear + 1);
  }

  // Determinar status
  const daysUntilDue = Math.floor((dueDate - referenceDate) / (1000 * 60 * 60 * 24));
  let status = 'pending';
  if (daysUntilDue < 0 || daysUntilDue < 15) {
    status = 'urgent'; // Urgent covers both overdue and < 15 days
  }

  return {
    aliquota,
    ipva_due: ipvaDue,
    due_date: dueDate,
    status,
    days_until_due: daysUntilDue,
  };
}

/**
 * Calcula dias em estoque
 * @param {Date} createdAt - Data de criação do veículo
 * @param {Date} referenceDate - Data de referência (default: agora)
 * @returns {number} Dias em estoque
 */
export function calculateDaysInStock(createdAt, referenceDate = new Date()) {
  const created = new Date(createdAt);
  const diffMs = referenceDate - created;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Calcula metrics comparativas entre dealerships
 * @param {Array} dealerships - Array de dealerships com seus veículos
 * @returns {Object} Comparação estruturada
 */
export function calculateDealershipComparison(dealerships) {
  const comparison = {};

  dealerships.forEach((dealership) => {
    const vehicles = dealership.vehicles || [];

    // Contar veículos
    const vehicleCount = vehicles.length;

    // Total em custo (soma de purchase_price + custos)
    const totalCost = vehicles.reduce((sum, v) => {
      const cost =
        (v.purchase_price || 0) +
        (v.transport_cost || 0) +
        (v.reconditioning_cost || 0) +
        (v.documentation_cost || 0) +
        (v.ipva_due || 0);
      return sum + cost;
    }, 0);

    // Lucro realizado (apenas veículos vendidos)
    const soldVehicles = vehicles.filter((v) => v.status === 'sold');
    const realizedProfit = soldVehicles.reduce((sum, v) => {
      const profit = calculateVehicleProfit(v).margin;
      return sum + profit;
    }, 0);

    // Margem média
    const avgMargin =
      vehicleCount > 0
        ? soldVehicles.reduce((sum, v) => sum + calculateVehicleProfit(v).margin_percentage, 0) / vehicleCount
        : 0;

    // Dias em estoque
    const daysInStockArray = vehicles.map((v) => calculateDaysInStock(v.created_at));
    const avgDaysInStock = daysInStockArray.length > 0
      ? Math.round(daysInStockArray.reduce((a, b) => a + b, 0) / daysInStockArray.length)
      : 0;

    // Alertas de estoque (> 45 dias)
    const stockAlerts = vehicles.filter((v) => calculateDaysInStock(v.created_at) > 45).length;

    // Status IPVA
    const ipvaStatus = {
      paid: vehicles.filter((v) => v.ipva_status === 'paid').length,
      pending: vehicles.filter((v) => v.ipva_status === 'pending').length,
      urgent: vehicles.filter((v) => v.ipva_status === 'urgent').length,
    };

    comparison[dealership.id] = {
      dealership_id: dealership.id,
      dealership_name: dealership.name,
      vehicle_count: vehicleCount,
      total_cost: totalCost,
      realized_profit: realizedProfit,
      avg_margin: parseFloat(avgMargin.toFixed(2)),
      avg_days_in_stock: avgDaysInStock,
      stock_alerts: stockAlerts,
      ipva_status: ipvaStatus,
    };
  });

  return comparison;
}

/**
 * Agrupa transações financeiras por mês
 * @param {Array} transactions - Array de transações
 * @returns {Object} Transações agrupadas por mês
 */
export function groupTransactionsByMonth(transactions) {
  const grouped = {};

  transactions.forEach((tx) => {
    const date = new Date(tx.transaction_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!grouped[monthKey]) {
      grouped[monthKey] = {
        month: monthKey,
        transactions: [],
        totals: {},
      };
    }

    grouped[monthKey].transactions.push(tx);

    // Somar por tipo
    if (!grouped[monthKey].totals[tx.type]) {
      grouped[monthKey].totals[tx.type] = 0;
    }
    grouped[monthKey].totals[tx.type] += tx.amount;
  });

  return grouped;
}

/**
 * Formata valor monetário (centavos para reais)
 * @param {number} centavos - Valor em centavos
 * @returns {string} Formato R$ 1.234,56
 */
export function formatCurrency(centavos) {
  const reais = (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  return reais;
}

/**
 * Calcula idade de um veículo (ano para ano)
 * @param {number} year - Ano do veículo
 * @returns {number} Idade em anos
 */
export function calculateVehicleAge(year) {
  const currentYear = new Date().getFullYear();
  return currentYear - year;
}

export default {
  calculateVehicleProfit,
  calculateIPVA,
  calculateDaysInStock,
  calculateDealershipComparison,
  groupTransactionsByMonth,
  formatCurrency,
  calculateVehicleAge,
};
