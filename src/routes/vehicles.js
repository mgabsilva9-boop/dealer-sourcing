/**
 * Rotas de Veículos de Interesse
 * POST /vehicles/interested - Salvar veículo de interesse
 * GET /vehicles/interested - Listar veículos salvos
 * DELETE /vehicles/interested/:id - Remover de interesse
 */

import express from 'express';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ===== SALVAR VEÍCULO DE INTERESSE =====

router.post('/interested', authMiddleware, async (req, res) => {
  try {
    const { vehicleId, customerName, customerPhone, customerEmail, notes } = req.body;

    if (!vehicleId) {
      return res.status(400).json({ error: 'Vehicle ID é obrigatório' });
    }

    // Salvar interesse
    const result = await query(
      `INSERT INTO interested_vehicles
       (user_id, vehicle_id, customer_name, customer_phone, customer_email, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'interested')
       RETURNING *`,
      [req.user.id, vehicleId, customerName || '', customerPhone || '', customerEmail || '', notes || ''],
    );

    res.status(201).json({
      message: 'Veículo salvo com sucesso',
      interested: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao salvar interesse:', error);
    res.status(500).json({ error: 'Erro ao salvar veículo' });
  }
});

// ===== LISTAR VEÍCULOS DE INTERESSE =====

router.get('/interested', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;

    let sql = `
      SELECT
        iv.*,
        fv.platform,
        fv.make,
        fv.model,
        fv.year,
        fv.price,
        fv.km,
        fv.photo_url,
        fv.link
      FROM interested_vehicles iv
      LEFT JOIN found_vehicles fv ON iv.vehicle_id = fv.id
      WHERE iv.user_id = $1
    `;

    const params = [req.user.id];

    if (status) {
      sql += ' AND iv.status = $2';
      params.push(status);
    }

    sql += ' ORDER BY iv.saved_at DESC';

    const result = await query(sql, params);

    res.json({
      total: result.rows.length,
      vehicles: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar interessados:', error);
    res.status(500).json({ error: 'Erro ao listar veículos' });
  }
});

// ===== ATUALIZAR STATUS DE INTERESSE =====

router.put('/interested/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }

    const result = await query(
      `UPDATE interested_vehicles
       SET status = $1, notes = COALESCE($2, notes)
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [status, notes, id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    res.json({
      message: 'Status atualizado',
      interested: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar veículo' });
  }
});

// ===== DELETAR VEÍCULO DE INTERESSE =====

router.delete('/interested/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM interested_vehicles WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    res.json({
      message: 'Veículo removido com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar interesse:', error);
    res.status(500).json({ error: 'Erro ao remover veículo' });
  }
});

// ===== BUSCAR VEÍCULO ESPECÍFICO =====

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM found_vehicles WHERE id = $1',
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar veículo:', error);
    res.status(500).json({ error: 'Erro ao buscar veículo' });
  }
});

export default router;
