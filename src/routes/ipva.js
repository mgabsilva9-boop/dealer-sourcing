/**
 * IPVA Tracking Routes
 * Registro e acompanhamento de IPVA por veículo
 */

import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { calculateIPVA } from '../lib/financial-calculations.js';

const router = express.Router();

// Middleware: autenticação em todas as rotas
router.use(authMiddleware);

// ============================================
// HELPER: Inicializar tabela IPVA
// ============================================
async function initIpvaTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ipva_tracking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
        dealership_id UUID NOT NULL REFERENCES dealerships(id),
        plate TEXT DEFAULT '',
        state TEXT NOT NULL DEFAULT 'SP',
        vehicle_value DECIMAL(15,2) DEFAULT 0,
        aliquota NUMERIC(5,2) NOT NULL DEFAULT 4.0,
        ipva_due DECIMAL(15,2) NOT NULL DEFAULT 0,
        due_date DATE NOT NULL,
        paid_at TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'urgent', 'paid')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela ipva_tracking verificada/criada');
  } catch (error) {
    console.error('⚠️ Erro ao criar tabela IPVA:', error.message);
  }
}

// Inicializar tabela na ativação
initIpvaTable().catch(err => {
  console.error('⚠️ Erro ao inicializar IPVA (servidor continua):', err.message);
});

// ============================================
// POST /ipva/vehicle/:id — Criar IPVA
// ============================================

router.post('/vehicle/:id', async (req, res) => {
  try {
    const { id: vehicleId } = req.params;
    const { state, year } = req.body;
    const dealershipId = req.user.dealership_id;

    // Validar entrada
    if (!state) {
      return res.status(400).json({ error: 'state é obrigatório' });
    }

    // ✅ CORRIGIDO: Buscar veículo automaticamente usando vehicleId
    const vehicleCheck = await pool.query(
      'SELECT id, purchase_price, make, model FROM inventory WHERE id = $1 AND dealership_id = $2',
      [vehicleId, dealershipId]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    // ✅ CORRIGIDO: Usar purchase_price como vehicle_value
    const vehicle = vehicleCheck.rows[0];
    const vehicle_value = vehicle.purchase_price || 0;

    if (vehicle_value <= 0) {
      return res.status(400).json({ error: 'Veículo sem preço de compra definido' });
    }

    // FIX SEC-001: Verificar se já existe IPVA para este veículo este ano
    const existingIPVA = await pool.query(
      'SELECT id FROM ipva_tracking WHERE vehicle_id = $1 AND EXTRACT(YEAR FROM due_date) = $2',
      [vehicleId, new Date().getFullYear()]
    );

    if (existingIPVA.rows.length > 0) {
      return res.status(409).json({
        error: 'IPVA already exists for this vehicle this year',
        existing_ipva_id: existingIPVA.rows[0].id
      });
    }

    // Calcular IPVA
    const { aliquota, ipva_due, due_date, status } = calculateIPVA(state, vehicle_value);

    // ✅ CORRIGIDO: Inserir sem plate (será preenchido do veículo)
    const query = `
      INSERT INTO ipva_tracking (vehicle_id, dealership_id, state, vehicle_value, aliquota, ipva_due, due_date, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(query, [
      vehicleId,
      dealershipId,
      state,
      vehicle_value,
      aliquota,
      ipva_due,
      due_date,
      status,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao criar IPVA:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PUT /ipva/:id/mark-paid — Marcar como Pago
// ============================================

router.put('/:id/mark-paid', async (req, res) => {
  try {
    const { id } = req.params;
    const dealershipId = req.user.dealership_id;

    const query = `
      UPDATE ipva_tracking
      SET paid_at = NOW(), status = 'paid'
      WHERE id = $1 AND dealership_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [id, dealershipId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'IPVA não encontrado' });
    }

    res.json({ message: 'IPVA marcado como pago', ipva: result.rows[0] });
  } catch (error) {
    console.error('❌ Erro ao marcar IPVA como pago:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET /ipva/summary — Resumo de IPVA
// ============================================

router.get('/summary', async (req, res) => {
  try {
    const dealershipId = req.user.dealership_id;

    const query = `
      SELECT
        status,
        COUNT(*) as count,
        SUM(ipva_due) as total_due,
        MIN(due_date) as nearest_due_date
      FROM ipva_tracking
      WHERE dealership_id = $1
      GROUP BY status
    `;

    const result = await pool.query(query, [dealershipId]);

    // Agrupar por status com formato simples para frontend
    const summary = {
      paid: 0,
      pending: 0,
      urgent: 0,
      paid_amount: 0,
      pending_amount: 0,
      urgent_amount: 0,
    };

    result.rows.forEach((row) => {
      const count = parseInt(row.count) || 0;
      const total = parseInt(row.total_due) || 0;

      if (row.status === 'paid') {
        summary.paid = count;
        summary.paid_amount = total;
      } else if (row.status === 'pending') {
        summary.pending = count;
        summary.pending_amount = total;
      } else if (row.status === 'urgent') {
        summary.urgent = count;
        summary.urgent_amount = total;
      }
    });

    res.json(summary);
  } catch (error) {
    console.error('❌ Erro ao buscar resumo de IPVA:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET /ipva/list — Listar todos os IPVAs
// ============================================

router.get('/list', async (req, res) => {
  try {
    const dealershipId = req.user.dealership_id;
    const { status } = req.query; // Filtro opcional por status

    let query = `
      SELECT
        i.*,
        inv.make, inv.model, inv.year
      FROM ipva_tracking i
      LEFT JOIN inventory inv ON i.vehicle_id = inv.id
      WHERE i.dealership_id = $1
    `;

    const params = [dealershipId];

    if (status) {
      query += ` AND i.status = $2`;
      params.push(status);
    }

    query += ' ORDER BY i.due_date ASC';

    const result = await pool.query(query, params);

    // Retornar array direto para compatibilidade com frontend
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao listar IPVA:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET /ipva/urgent — IPVAs com vencimento urgente
// ============================================

router.get('/urgent', async (req, res) => {
  try {
    const dealershipId = req.user.dealership_id;

    const query = `
      SELECT
        i.*,
        inv.make, inv.model, inv.year,
        (i.due_date - CURRENT_DATE) as days_until_due
      FROM ipva_tracking i
      LEFT JOIN inventory inv ON i.vehicle_id = inv.id
      WHERE i.dealership_id = $1
        AND i.status IN ('urgent', 'overdue')
      ORDER BY i.due_date ASC
    `;

    const result = await pool.query(query, [dealershipId]);

    res.json({
      urgent_count: result.rows.length,
      urgent_ipva: result.rows,
    });
  } catch (error) {
    console.error('❌ Erro ao buscar IPVAs urgentes:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DELETE /ipva/:id — Deletar IPVA
// ============================================

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dealershipId = req.user.dealership_id;

    const query = `
      DELETE FROM ipva_tracking
      WHERE id = $1 AND dealership_id = $2
      RETURNING id
    `;

    const result = await pool.query(query, [id, dealershipId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'IPVA não encontrado' });
    }

    res.json({ message: 'IPVA deletado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar IPVA:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
