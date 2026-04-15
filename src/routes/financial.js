/**
 * Financial Module Routes
 * P&L, comparatives, reports
 */

import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  calculateVehicleProfit,
  calculateDealershipComparison,
  groupTransactionsByMonth,
  formatCurrency,
} from '../lib/financial-calculations.js';

const router = express.Router();

// Middleware: autenticação em todas as rotas
router.use(authMiddleware);

// ============================================
// GET /financial/vehicle/:id — P&L Individual
// ============================================

router.get('/vehicle/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dealershipId = req.user.dealership_id;

    const vehicleQuery = `
      SELECT
        inv.id, inv.make, inv.model, inv.year,
        inv.purchase_price, inv.sale_price,
        inv.status, inv.created_at,
        COALESCE(SUM(vc.amount), 0) as total_costs
      FROM inventory inv
      LEFT JOIN vehicle_costs vc ON vc.inventory_id = inv.id
      WHERE inv.id = $1 AND inv.dealership_id = $2
      GROUP BY inv.id
    `;

    const vehicleResult = await pool.query(vehicleQuery, [id, dealershipId]);

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    const vehicle = vehicleResult.rows[0];

    // Buscar IPVA se existir
    const ipvaQuery = `
      SELECT ipva_due, status as ipva_status
      FROM ipva_tracking
      WHERE vehicle_id = $1 AND dealership_id = $2
      ORDER BY created_at DESC LIMIT 1
    `;

    const ipvaResult = await pool.query(ipvaQuery, [id, dealershipId]);
    const ipvaDue = ipvaResult.rows[0]?.ipva_due || 0;

    // Calcular P&L
    const profitData = calculateVehicleProfit({
      ...vehicle,
      transport_cost: 0,
      reconditioning_cost: 0,
      documentation_cost: 0,
      ipva_due: ipvaDue,
    });

    res.json({
      vehicle_id: id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      status: vehicle.status,
      created_at: vehicle.created_at,
      ...profitData,
      margin_formatted: formatCurrency(profitData.margin),
      total_cost_formatted: formatCurrency(profitData.total_cost),
    });
  } catch (error) {
    console.error('❌ Erro ao buscar P&L:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET /financial/comparison — BrossMotors vs B
// ============================================

router.get('/comparison', async (req, res) => {
  try {
    const dealershipId = req.user.dealership_id;
    const userRole = req.user.role;

    // Determinar quais dealerships buscar
    let dealershipFilter = 'dealership_id = $1';
    let params = [dealershipId];

    if (userRole === 'owner' || userRole === 'admin') {
      // Admin vê todas as dealerships
      dealershipFilter = '1=1';
      params = [];
    }

    // Buscar todas as dealerships (com RLS filter)
    const dealershipsQuery = `
      SELECT
        d.id, d.name,
        COUNT(inv.id) as vehicle_count,
        SUM(COALESCE(inv.purchase_price, 0)) +
        COALESCE(SUM(vc.amount), 0) as total_cost
      FROM dealerships d
      LEFT JOIN inventory inv ON d.id = inv.dealership_id
      LEFT JOIN vehicle_costs vc ON vc.inventory_id = inv.id
      WHERE ${dealershipFilter}
      GROUP BY d.id, d.name
      ORDER BY d.name
    `;

    const dealershipsResult = await pool.query(dealershipsQuery, params);
    const dealerships = dealershipsResult.rows;

    // Buscar todas as vendas e calcular lucro realizado (com RLS filter)
    const salesQuery = `
      SELECT
        inv.dealership_id,
        SUM((COALESCE(inv.sold_price, inv.sale_price, 0)) -
            (COALESCE(inv.purchase_price, 0) +
            COALESCE(vc_costs.total_costs, 0) +
            COALESCE(i.ipva_due, 0))) as realized_profit
      FROM inventory inv
      LEFT JOIN (
        SELECT inventory_id, SUM(amount) as total_costs
        FROM vehicle_costs
        GROUP BY inventory_id
      ) vc_costs ON vc_costs.inventory_id = inv.id
      LEFT JOIN ipva_tracking i ON inv.id = i.vehicle_id AND i.dealership_id = inv.dealership_id
      WHERE inv.status = 'sold' AND ${dealershipFilter}
      GROUP BY inv.dealership_id
    `;

    const salesResult = await pool.query(salesQuery, params);
    const profitMap = {};
    salesResult.rows.forEach((row) => {
      profitMap[row.dealership_id] = row.realized_profit || 0;
    });

    // Construir resposta
    const comparison = dealerships.map((d) => ({
      dealership_id: d.id,
      dealership_name: d.name,
      vehicle_count: parseInt(d.vehicle_count) || 0,
      total_cost: parseInt(d.total_cost) || 0,
      realized_profit: profitMap[d.id] || 0,
      avg_margin: d.vehicle_count > 0
        ? parseFloat(((profitMap[d.id] || 0) / parseInt(d.vehicle_count)).toFixed(2))
        : 0,
    }));

    res.json({ dealerships: comparison });
  } catch (error) {
    console.error('❌ Erro ao buscar comparação:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET /financial/report/monthly/:year/:month
// ============================================

router.get('/report/monthly/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const dealershipId = req.user.dealership_id;

    // FIX VAL-002: Validar year e month
    const yearInt = parseInt(year, 10);
    const monthInt = parseInt(month, 10);

    if (isNaN(yearInt) || isNaN(monthInt)) {
      return res.status(400).json({
        error: 'year and month must be numbers',
        example: '/financial/report/monthly/2026/03'
      });
    }

    if (monthInt < 1 || monthInt > 12) {
      return res.status(400).json({
        error: 'month must be between 1 and 12',
        received: monthInt
      });
    }

    if (yearInt < 2020 || yearInt > 2099) {
      return res.status(400).json({
        error: 'year must be between 2020 and 2099',
        received: yearInt
      });
    }

    const monthStr = String(monthInt).padStart(2, '0');
    const startDate = `${yearInt}-${monthStr}-01`;

    // BUG FIX #9: Calculate the last day of the month correctly
    // Instead of hardcoding day=31 (fails for April, June, Sept, Nov, and Feb),
    // we calculate it by finding the last day using date arithmetic
    const lastDayOfMonth = new Date(yearInt, monthInt, 0).getDate(); // day 0 of next month = last day of current month
    const endDateDay = String(lastDayOfMonth).padStart(2, '0');
    const endDate = `${yearInt}-${monthStr}-${endDateDay}`;

    // Veículos vendidos neste mês (com custos agregados)
    const soldQuery = `
      SELECT
        inv.id, inv.make, inv.model, inv.year,
        inv.purchase_price, inv.sale_price, inv.sold_price,
        inv.created_at,
        COALESCE(SUM(vc.amount), 0) as total_costs
      FROM inventory inv
      LEFT JOIN vehicle_costs vc ON vc.inventory_id = inv.id
      WHERE inv.dealership_id = $1
        AND inv.status = 'sold'
        AND inv.sold_date >= $2::date
        AND inv.sold_date <= $3::date
      GROUP BY inv.id
    `;

    const soldResult = await pool.query(soldQuery, [dealershipId, startDate, endDate]);

    // Despesas gerenciais neste mês (se tabela expenses existe)
    const expensesQuery = `
      SELECT
        category,
        COUNT(*) as count,
        SUM(amount) as total
      FROM expenses
      WHERE dealership_id = $1
        AND date >= $2::date
        AND date <= $3::date
      GROUP BY category
    `;

    let expensesResult = null;
    try {
      expensesResult = await pool.query(expensesQuery, [dealershipId, startDate, endDate]);
    } catch (err) {
      // Tabela expenses pode não existir, continuar sem ela
      console.log('[DEBUG] Expenses table not available or no data');
    }

    // Calcular P&L dos vendidos
    const totalRevenue = soldResult.rows.reduce((sum, v) => sum + (v.sold_price || v.sale_price || 0), 0);
    const totalCost = soldResult.rows.reduce(
      (sum, v) =>
        sum +
        ((v.purchase_price || 0) + (v.total_costs || 0)),
      0
    );
    const netProfit = totalRevenue - totalCost;

    // Agrupar despesas por categoria
    const expensesByCategory = {};
    if (expensesResult && expensesResult.rows) {
      expensesResult.rows.forEach((row) => {
        expensesByCategory[row.category] = {
          count: parseInt(row.count) || 0,
          total: parseInt(row.total) || 0,
        };
      });
    }

    const report = {
      period: `${year}-${monthStr}`,
      vehicles_sold: soldResult.rows.length,
      summary: {
        total_revenue: totalRevenue,
        total_cost: totalCost,
        net_profit: netProfit,
        margin_percentage: totalCost > 0 ? ((netProfit / totalCost) * 100).toFixed(2) : 0,
      },
      expenses_by_category: expensesByCategory,
      vehicles: soldResult.rows.map((v) => ({
        ...v,
        profit: calculateVehicleProfit(v).margin,
      })),
    };

    res.json(report);
  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET /financial/summary — Resumo Geral
// ============================================

router.get('/summary', async (req, res) => {
  try {
    const dealershipId = req.user.dealership_id;
    console.log('[DEBUG] /financial/summary called with dealershipId:', dealershipId);

    const summaryQuery = `
      SELECT
        COUNT(inv.id) as total_vehicles,
        SUM(CASE WHEN inv.status = 'sold' THEN 1 ELSE 0 END) as vehicles_sold,
        SUM(CASE WHEN inv.status = 'available' THEN 1 ELSE 0 END) as vehicles_available,
        SUM(CASE WHEN inv.status = 'maintenance' THEN 1 ELSE 0 END) as vehicles_maintenance,
        SUM(COALESCE(inv.purchase_price, 0)) as total_investment,
        SUM((COALESCE(inv.sold_price, inv.sale_price, 0)) - (
          COALESCE(inv.purchase_price, 0) +
          COALESCE(vc_totals.cost_sum, 0)
        )) as total_profit
      FROM inventory inv
      LEFT JOIN (
        SELECT inventory_id, SUM(amount) AS cost_sum
        FROM vehicle_costs GROUP BY inventory_id
      ) vc_totals ON vc_totals.inventory_id = inv.id
      WHERE inv.dealership_id = $1
    `;

    const result = await pool.query(summaryQuery, [dealershipId]);
    const summary = result.rows[0];

    res.json(summary);
  } catch (error) {
    console.error('❌ Erro ao buscar resumo:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
