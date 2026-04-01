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
        id, make, model, year,
        purchase_price, sale_price,
        transport_cost, reconditioning_cost, documentation_cost,
        status, created_at
      FROM vehicles
      WHERE id = $1 AND dealership_id = $2
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
// GET /financial/comparison — Loja A vs B
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

    // Buscar todas as dealerships
    const dealershipsQuery = `
      SELECT
        d.id, d.name,
        COUNT(v.id) as vehicle_count,
        SUM(COALESCE(v.purchase_price, 0) +
            COALESCE(v.transport_cost, 0) +
            COALESCE(v.reconditioning_cost, 0) +
            COALESCE(v.documentation_cost, 0)) as total_cost
      FROM dealerships d
      LEFT JOIN vehicles v ON d.id = v.dealership_id
      GROUP BY d.id, d.name
      ORDER BY d.name
    `;

    const dealershipsResult = await pool.query(dealershipsQuery);
    const dealerships = dealershipsResult.rows;

    // Buscar todas as vendas e calcular lucro realizado
    const salesQuery = `
      SELECT
        v.dealership_id,
        SUM(v.sale_price - (COALESCE(v.purchase_price, 0) +
            COALESCE(v.transport_cost, 0) +
            COALESCE(v.reconditioning_cost, 0) +
            COALESCE(v.documentation_cost, 0) +
            COALESCE(i.ipva_due, 0))) as realized_profit
      FROM vehicles v
      LEFT JOIN ipva_tracking i ON v.id = i.vehicle_id AND i.dealership_id = v.dealership_id
      WHERE v.status = 'sold'
      GROUP BY v.dealership_id
    `;

    const salesResult = await pool.query(salesQuery);
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
        ? parseFloat(((profitMap[d.id] || 0) / parseInt(d.vehicle_count) / 10000).toFixed(2))
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
    const endDate = `${yearInt}-${monthStr}-31`;

    // Resumo de transações
    const transactionsQuery = `
      SELECT
        type,
        COUNT(*) as count,
        SUM(amount) as total
      FROM financial_transactions
      WHERE dealership_id = $1
        AND transaction_date >= $2::date
        AND transaction_date <= $3::date
      GROUP BY type
    `;

    const txResult = await pool.query(transactionsQuery, [dealershipId, startDate, endDate]);

    // Veículos vendidos neste mês
    const soldQuery = `
      SELECT
        id, make, model, year,
        purchase_price, sale_price,
        transport_cost, reconditioning_cost, documentation_cost,
        created_at
      FROM vehicles
      WHERE dealership_id = $1
        AND status = 'sold'
        AND created_at >= $2::date
        AND created_at <= $3::date
    `;

    const soldResult = await pool.query(soldQuery, [dealershipId, startDate, endDate]);

    // Calcular P&L dos vendidos
    const totalRevenue = soldResult.rows.reduce((sum, v) => sum + (v.sale_price || 0), 0);
    const totalCost = soldResult.rows.reduce(
      (sum, v) =>
        sum +
        ((v.purchase_price || 0) +
          (v.transport_cost || 0) +
          (v.reconditioning_cost || 0) +
          (v.documentation_cost || 0)),
      0
    );
    const netProfit = totalRevenue - totalCost;

    const report = {
      period: `${year}-${monthStr}`,
      vehicles_sold: soldResult.rows.length,
      summary: {
        total_revenue: totalRevenue,
        total_cost: totalCost,
        net_profit: netProfit,
        margin_percentage: totalCost > 0 ? ((netProfit / totalCost) * 100).toFixed(2) : 0,
      },
      transactions_by_type: txResult.rows,
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

    const summaryQuery = `
      SELECT
        COUNT(*) as total_vehicles,
        SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as vehicles_sold,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as vehicles_available,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as vehicles_maintenance,
        SUM(COALESCE(purchase_price, 0)) as total_investment,
        SUM(COALESCE(sale_price, 0) - (
          COALESCE(purchase_price, 0) +
          COALESCE(transport_cost, 0) +
          COALESCE(reconditioning_cost, 0) +
          COALESCE(documentation_cost, 0)
        )) as total_profit
      FROM vehicles
      WHERE dealership_id = $1
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
