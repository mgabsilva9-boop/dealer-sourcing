/**
 * Rotas de Despesas (Expenses)
 * CRUD completo para despesas gerais
 */

import express from 'express';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ===== EXPENSES / DESPESAS =====

// GET - Listar todas as despesas
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM expenses WHERE dealership_id = $1 ORDER BY date DESC',
      [req.user.dealership_id],
    );

    res.json({
      total: result.rows.length,
      expenses: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar despesas:', error);
    res.status(500).json({ error: 'Erro ao listar despesas' });
  }
});

// POST - Criar nova despesa
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { category, description, amount, status, date } = req.body;

    if (!category || !amount) {
      return res.status(400).json({ error: 'Categoria e valor são obrigatórios' });
    }

    const result = await query(
      `INSERT INTO expenses
       (user_id, dealership_id, category, description, amount, status, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.id,
        req.user.dealership_id,
        category,
        description || '',
        amount,
        status || 'pending',
        date || new Date().toISOString().split('T')[0],
      ],
    );

    res.status(201).json({
      message: 'Despesa criada com sucesso',
      expense: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao criar despesa:', error);
    res.status(500).json({ error: 'Erro ao criar despesa' });
  }
});

// GET - Resumo de despesas por categoria
router.get('/summary/by-category', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT category, SUM(amount) as total, COUNT(*) as count FROM expenses WHERE dealership_id = $1 GROUP BY category',
      [req.user.dealership_id],
    );

    res.json({
      summary: result.rows,
    });
  } catch (error) {
    console.error('Erro ao obter resumo:', error);
    res.status(500).json({ error: 'Erro ao obter resumo' });
  }
});

// GET - Buscar despesa específica
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM expenses WHERE id = $1 AND dealership_id = $2',
      [id, req.user.dealership_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar despesa:', error);
    res.status(500).json({ error: 'Erro ao buscar despesa' });
  }
});

// PUT - Atualizar despesa
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { category, description, amount, status, date } = req.body;

    const result = await query(
      `UPDATE expenses
       SET category = COALESCE($1, category),
           description = COALESCE($2, description),
           amount = COALESCE($3, amount),
           status = COALESCE($4, status),
           date = COALESCE($5, date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND dealership_id = $7
       RETURNING *`,
      [category, description, amount, status, date, id, req.user.dealership_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }

    res.json({
      message: 'Despesa atualizada com sucesso',
      expense: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao atualizar despesa:', error);
    res.status(500).json({ error: 'Erro ao atualizar despesa' });
  }
});

// DELETE - Deletar despesa
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM expenses WHERE id = $1 AND dealership_id = $2 RETURNING id',
      [id, req.user.dealership_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }

    res.json({
      message: 'Despesa deletada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar despesa:', error);
    res.status(500).json({ error: 'Erro ao deletar despesa' });
  }
});

export default router;
