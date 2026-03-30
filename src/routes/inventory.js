/**
 * Rotas de Estoque (Inventory)
 * CRUD completo para veículos da concessionária
 */

import express from 'express';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ===== CRIAR TABELAS SE NÃO EXISTIREM =====
async function initTables() {
  try {
    // Tabela de veículos do estoque
    await query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        dealership_id UUID NOT NULL REFERENCES dealerships(id),
        make VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INTEGER,
        purchase_price DECIMAL(15, 2),
        sale_price DECIMAL(15, 2),
        fipe_price DECIMAL(15, 2),
        mileage INTEGER,
        location VARCHAR(50),
        status VARCHAR(50) DEFAULT 'available',
        motor VARCHAR(200),
        potencia VARCHAR(100),
        features TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de custos/despesas por veículo
    await query(`
      CREATE TABLE IF NOT EXISTS vehicle_costs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(15, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de clientes/CRM
    await query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        dealership_id UUID NOT NULL REFERENCES dealerships(id),
        name VARCHAR(200) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(100),
        cpf VARCHAR(20),
        vehicle_bought VARCHAR(200),
        purchase_date DATE,
        purchase_value DECIMAL(15, 2),
        notes TEXT,
        style VARCHAR(50),
        region VARCHAR(100),
        collector BOOLEAN DEFAULT FALSE,
        birthday DATE,
        profession VARCHAR(100),
        referral VARCHAR(100),
        contact_pref VARCHAR(50) DEFAULT 'WhatsApp',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de despesas gerais
    await query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        dealership_id UUID NOT NULL REFERENCES dealerships(id),
        category VARCHAR(100) NOT NULL,
        description VARCHAR(255),
        amount DECIMAL(15, 2),
        status VARCHAR(50) DEFAULT 'pending',
        date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Tabelas de inventory verificadas/criadas');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error.message);
    console.error('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    console.error('Full error:', error);
  }
}

// Inicializar tabelas na ativação
initTables();

// ===== VEHICLES / INVENTORY =====

// GET - Listar todos os veículos
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM inventory WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id],
    );

    res.json({
      total: result.rows.length,
      vehicles: result.rows,
    });
  } catch (error) {
    console.error('Erro ao listar veículos:', error);
    res.status(500).json({ error: 'Erro ao listar veículos' });
  }
});

// POST - Criar novo veículo
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { make, model, year, purchasePrice, salePrice, fipePrice, mileage, location, status, motor, potencia, features, costs } = req.body;

    if (!make || !model) {
      return res.status(400).json({ error: 'Marca e modelo são obrigatórios' });
    }

    // Inserir veículo
    const vehicleResult = await query(
      `INSERT INTO inventory
       (user_id, dealership_id, make, model, year, purchase_price, sale_price, fipe_price, mileage, location, status, motor, potencia, features)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [req.user.id, req.user.dealership_id, make, model, year || null, purchasePrice || 0, salePrice || 0, fipePrice || 0, mileage || 0, location || 'Loja A', status || 'available', motor || '', potencia || '', features || ''],
    );

    const vehicleId = vehicleResult.rows[0].id;

    // Inserir custos se fornecidos
    if (costs && typeof costs === 'object') {
      for (const [category, amount] of Object.entries(costs)) {
        if (amount > 0) {
          await query(
            'INSERT INTO vehicle_costs (inventory_id, category, amount) VALUES ($1, $2, $3)',
            [vehicleId, category, amount],
          );
        }
      }
    }

    res.status(201).json({
      message: 'Veículo criado com sucesso',
      vehicle: vehicleResult.rows[0],
    });
  } catch (error) {
    console.error('Erro ao criar veículo:', error);
    res.status(500).json({ error: 'Erro ao criar veículo' });
  }
});

// GET - Buscar veículo específico
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const vehicleResult = await query(
      'SELECT * FROM inventory WHERE id = $1 AND user_id = $2',
      [id, req.user.id],
    );

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    const costsResult = await query(
      'SELECT category, amount FROM vehicle_costs WHERE inventory_id = $1',
      [id],
    );

    const costs = {};
    costsResult.rows.forEach((row) => {
      costs[row.category] = row.amount;
    });

    res.json({
      ...vehicleResult.rows[0],
      costs,
    });
  } catch (error) {
    console.error('Erro ao buscar veículo:', error);
    res.status(500).json({ error: 'Erro ao buscar veículo' });
  }
});

// PUT - Atualizar veículo
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { make, model, year, purchasePrice, salePrice, fipePrice, mileage, location, status, motor, potencia, features, costs } = req.body;

    const result = await query(
      `UPDATE inventory
       SET make = COALESCE($1, make),
           model = COALESCE($2, model),
           year = COALESCE($3, year),
           purchase_price = COALESCE($4, purchase_price),
           sale_price = COALESCE($5, sale_price),
           fipe_price = COALESCE($6, fipe_price),
           mileage = COALESCE($7, mileage),
           location = COALESCE($8, location),
           status = COALESCE($9, status),
           motor = COALESCE($10, motor),
           potencia = COALESCE($11, potencia),
           features = COALESCE($12, features),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $13 AND user_id = $14
       RETURNING *`,
      [make, model, year, purchasePrice, salePrice, fipePrice, mileage, location, status, motor, potencia, features, id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    // Atualizar custos se fornecidos
    if (costs && typeof costs === 'object') {
      // Deletar custos antigos
      await query('DELETE FROM vehicle_costs WHERE inventory_id = $1', [id]);

      // Inserir novos custos
      for (const [category, amount] of Object.entries(costs)) {
        if (amount > 0) {
          await query(
            'INSERT INTO vehicle_costs (inventory_id, category, amount) VALUES ($1, $2, $3)',
            [id, category, amount],
          );
        }
      }
    }

    res.json({
      message: 'Veículo atualizado com sucesso',
      vehicle: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao atualizar veículo:', error);
    res.status(500).json({ error: 'Erro ao atualizar veículo' });
  }
});

// DELETE - Deletar veículo
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM inventory WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    res.json({
      message: 'Veículo deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar veículo:', error);
    res.status(500).json({ error: 'Erro ao deletar veículo' });
  }
});

export default router;
