/**
 * Rotas de CRM (Gerenciamento de Clientes)
 * CRUD completo para clientes
 */

import express from 'express';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ===== NORMALIZATION FUNCTION =====
function normalizeCustomer(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || '',
    email: row.email || '',
    cpf: row.cpf || '',
    vehicleBought: row.vehicle_bought || '',
    purchaseDate: row.purchase_date || null,
    purchaseValue: parseFloat(row.purchase_value) || 0,
    notes: row.notes || '',
    style: row.style || '',
    region: row.region || '',
    collector: row.collector || false,
    birthday: row.birthday || null,
    profession: row.profession || '',
    referral: row.referral || '',
    contactPref: row.contact_pref || 'WhatsApp',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ===== CUSTOMERS / CRM =====

// GET - Listar todos os clientes
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM customers WHERE dealership_id = $1 ORDER BY created_at DESC',
      [req.user.dealership_id],
    );

    res.json({
      total: result.rows.length,
      customers: result.rows.map(normalizeCustomer),
    });
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ error: 'Erro ao listar clientes' });
  }
});

// POST - Criar novo cliente
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email, cpf, vehicleBought, purchaseDate, purchaseValue, notes, style, region, collector, birthday, profession, referral, contactPref } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const result = await query(
      `INSERT INTO customers
       (user_id, dealership_id, name, phone, email, cpf, vehicle_bought, purchase_date, purchase_value, notes, style, region, collector, birthday, profession, referral, contact_pref)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        req.user.id,
        req.user.dealership_id,
        name,
        phone || '',
        email || '',
        cpf || '',
        vehicleBought || '',
        purchaseDate || null,
        purchaseValue || 0,
        notes || '',
        style || '',
        region || '',
        collector || false,
        birthday || null,
        profession || '',
        referral || '',
        contactPref || 'WhatsApp',
      ],
    );

    res.status(201).json({
      message: 'Cliente criado com sucesso',
      customer: normalizeCustomer(result.rows[0]),
    });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

// GET - Buscar cliente específico
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM customers WHERE id = $1 AND dealership_id = $2',
      [id, req.user.dealership_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(normalizeCustomer(result.rows[0]));
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
});

// PUT - Atualizar cliente
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, cpf, vehicleBought, purchaseDate, purchaseValue, notes, style, region, collector, birthday, profession, referral, contactPref } = req.body;

    const result = await query(
      `UPDATE customers
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           cpf = COALESCE($4, cpf),
           vehicle_bought = COALESCE($5, vehicle_bought),
           purchase_date = COALESCE($6, purchase_date),
           purchase_value = COALESCE($7, purchase_value),
           notes = COALESCE($8, notes),
           style = COALESCE($9, style),
           region = COALESCE($10, region),
           collector = COALESCE($11, collector),
           birthday = COALESCE($12, birthday),
           profession = COALESCE($13, profession),
           referral = COALESCE($14, referral),
           contact_pref = COALESCE($15, contact_pref),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $16 AND dealership_id = $17
       RETURNING *`,
      [name, phone, email, cpf, vehicleBought, purchaseDate, purchaseValue, notes, style, region, collector, birthday, profession, referral, contactPref, id, req.user.dealership_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json({
      message: 'Cliente atualizado com sucesso',
      customer: normalizeCustomer(result.rows[0]),
    });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

// DELETE - Deletar cliente
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM customers WHERE id = $1 AND dealership_id = $2 RETURNING id',
      [id, req.user.dealership_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json({
      message: 'Cliente deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
});

export default router;
