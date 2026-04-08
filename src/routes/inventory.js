/**
 * Rotas de Estoque (Inventory)
 * CRUD completo para veículos da concessionária
 */

import express from 'express';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ===== HELPER: Normalizar vehicle (snake_case → camelCase) =====
function normalizeVehicle(row) {
  const costs = typeof row.costs_json === 'string'
    ? JSON.parse(row.costs_json)
    : (row.costs_json || {});

  return {
    id: row.id,
    make: row.make,
    model: row.model,
    year: row.year,
    purchasePrice: parseFloat(row.purchase_price) || 0,
    salePrice: parseFloat(row.sale_price) || 0,
    fipePrice: parseFloat(row.fipe_price) || 0,
    mileage: row.mileage || 0,
    location: row.location,
    status: row.status || 'available',
    motor: row.motor || '',
    potencia: row.potencia || '',
    features: row.features || '',
    imageUrl: row.image_url || null,
    daysInStock: Math.round(parseFloat(row.days_in_stock) || 0),
    costs,
    soldPrice: parseFloat(row.sold_price) || null,
    soldDate: row.sold_date ? String(row.sold_date).slice(0, 10) : null,
    statusChangedAt: row.status_changed_at || null,
    statusChangedBy: row.status_changed_by || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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
        image_url TEXT,
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

    // Migration 1.3: Add sold_price e sold_date columns
    await query(`
      ALTER TABLE inventory
        ADD COLUMN IF NOT EXISTS sold_price DECIMAL(15, 2),
        ADD COLUMN IF NOT EXISTS sold_date  DATE;
    `);

    // BUG FIX #8: Add status_changed_at and status_changed_by columns
    // Frontend expects statusChangedAt and statusChangedBy to track status changes
    await query(`
      ALTER TABLE inventory
        ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS status_changed_by UUID;
    `);

    // Backfill de veículos já marcados como vendidos
    const backfillResult = await query(`
      UPDATE inventory
      SET sold_price = sale_price, sold_date = updated_at::date
      WHERE status = 'sold' AND sold_price IS NULL
      RETURNING id;
    `);
    if (backfillResult.rows.length > 0) {
      console.log(`  ℹ️ Backfilled ${backfillResult.rows.length} vehicles with sold_price/sold_date`);
    }

    console.log('✅ Tabelas de inventory verificadas/criadas');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error.message);
    console.error('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    console.error('Full error:', error);
  }
}

// ===== SEED DE VEÍCULOS PADRÃO =====
async function initDefaultVehicles() {
  try {
    // Pegar user ID e dealership ID
    const userResult = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      ['dono@brossmotors.com']
    );
    const dealershipResult = await query(
      'SELECT id FROM dealerships WHERE name = $1 LIMIT 1',
      ['BrossMotors']
    );

    if (!userResult.rows[0] || !dealershipResult.rows[0]) {
      console.log('⏭️ Usuário ou dealership não encontrado, pulando seed de veículos');
      return;
    }

    const userId = userResult.rows[0].id;
    const dealershipId = dealershipResult.rows[0].id;

    // Veículos padrão
    const defaultVehicles = [
      { make: "Ford", model: "Ka", year: 2020, purchasePrice: 52948, salePrice: 68000, fipePrice: 62000, mileage: 72000, location: "Loja A", motor: "1.0L 3-cil", potencia: "75 cv", features: "Ar condicionado, vidros elétricos", costs: { "Compra do veiculo": 52948, "Funilaria": 600, "Mercado": 270, "Documentacao": 764, "Combustivel": 47, "Comissao": 400 } },
      { make: "VW", model: "Gol 1.0", year: 2022, purchasePrice: 53000, salePrice: 71000, fipePrice: 68000, mileage: 56000, location: "Loja A", motor: "1.0L 3-cil", potencia: "82 cv", features: "Direção hidráulica, airbag", costs: { "Compra do veiculo": 53000, "Funilaria": 200, "Cartorio": 67, "Documentacao": 400, "Combustivel": 235, "Comissao": 300 } },
      { make: "Ram", model: "1500 Classic", year: 2023, purchasePrice: 260000, salePrice: 315000, fipePrice: 310000, mileage: 42000, location: "Loja A", motor: "5.7L V8", potencia: "395 cv", features: "Cabine dupla, 4x4, ar digital", costs: { "Compra do veiculo": 260000, "Combustivel": 220, "Lavagem": 800 } },
      { make: "BMW", model: "M3", year: 2021, purchasePrice: 325000, salePrice: 420000, fipePrice: 400000, mileage: 37000, location: "Loja A", motor: "3.0L Twin-turbo", potencia: "503 cv", features: "Teto panorâmico, bose sound, interior premium", costs: { "Compra do veiculo": 325000, "Viagem": 3229, "Peca": 2500, "Vistoria": 80, "Lavagem": 1000, "Martelinho": 100, "Combustivel": 200, "Pecas ambar": 1840, "Webmotors": 220 } },
      { make: "Ram", model: "2500 Laramie", year: 2021, purchasePrice: 290000, salePrice: 375000, fipePrice: 360000, mileage: 52000, location: "Loja A", motor: "6.7L Diesel", potencia: "385 cv", features: "Cabine dupla, 4x4, suspensão a ar", costs: { "Compra do veiculo": 290000, "Viagem": 418, "Combustivel": 807, "Veloci": 800, "Vistoria": 80, "Comida": 113, "Lavagem": 1000, "Cautelar": 600 } }
    ];

    for (const v of defaultVehicles) {
      // Verificar se veículo já existe
      const existsResult = await query(
        'SELECT id FROM inventory WHERE user_id = $1 AND make = $2 AND model = $3 AND year = $4',
        [userId, v.make, v.model, v.year]
      );

      if (existsResult.rows.length > 0) {
        continue; // Pular se já existe
      }

      // Inserir veículo
      const vehicleResult = await query(
        `INSERT INTO inventory
         (user_id, dealership_id, make, model, year, purchase_price, sale_price, fipe_price, mileage, location, status, motor, potencia, features)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING id`,
        [userId, dealershipId, v.make, v.model, v.year, v.purchasePrice, v.salePrice, v.fipePrice, v.mileage, v.location, 'available', v.motor, v.potencia, v.features]
      );

      const vehicleId = vehicleResult.rows[0].id;

      // Inserir custos
      if (v.costs && typeof v.costs === 'object') {
        for (const [category, amount] of Object.entries(v.costs)) {
          if (amount > 0) {
            await query(
              'INSERT INTO vehicle_costs (inventory_id, category, amount) VALUES ($1, $2, $3)',
              [vehicleId, category, amount]
            );
          }
        }
      }
    }

    console.log('✅ Veículos padrão verificados/criados');
  } catch (error) {
    console.error('Erro ao seed veículos:', error.message);
  }
}

// Inicializar tabelas na ativação
// Inicializar tabelas e dados (não bloqueia startup)
initTables().catch(err => {
  console.error('⚠️ Erro ao inicializar tabelas (servidor continua em MVP mode):', err.message);
});

initDefaultVehicles().catch(err => {
  console.error('⚠️ Erro ao seed veículos (servidor continua em MVP mode):', err.message);
});

// ===== VEHICLES / INVENTORY =====

// GET - Listar todos os veículos com custos agregados (por dealership)
// GET / - Listar todos os veículos (REST)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const dealershipId = req.user.dealership_id;
    if (!dealershipId) {
      return res.status(400).json({ error: 'dealership_id ausente no token' });
    }

    const result = await query(`
      SELECT
        i.*,
        EXTRACT(DAY FROM (NOW() - i.created_at)) AS days_in_stock,
        COALESCE(
          json_object_agg(vc.category, vc.amount) FILTER (WHERE vc.category IS NOT NULL),
          '{}'::json
        ) AS costs_json
      FROM inventory i
      LEFT JOIN vehicle_costs vc ON vc.inventory_id = i.id
      WHERE i.dealership_id = $1 AND i.deleted_at IS NULL
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `, [dealershipId]);

    const vehicles = result.rows.map(normalizeVehicle);
    res.json(vehicles);
  } catch (error) {
    console.error('Erro ao listar veículos:', error);
    res.status(500).json({ error: 'Erro ao listar veículos' });
  }
});

// GET /list - Listar todos os veículos (LEGACY)
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const dealershipId = req.user.dealership_id;
    if (!dealershipId) {
      return res.status(400).json({ error: 'dealership_id ausente no token' });
    }

    const result = await query(`
      SELECT
        i.*,
        EXTRACT(DAY FROM (NOW() - i.created_at)) AS days_in_stock,
        COALESCE(
          json_object_agg(vc.category, vc.amount) FILTER (WHERE vc.category IS NOT NULL),
          '{}'::json
        ) AS costs_json
      FROM inventory i
      LEFT JOIN vehicle_costs vc ON vc.inventory_id = i.id
      WHERE i.dealership_id = $1 AND i.deleted_at IS NULL
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `, [dealershipId]);

    const vehicles = result.rows.map(normalizeVehicle);

    res.json({
      total: vehicles.length,
      vehicles,
    });
  } catch (error) {
    console.error('Erro ao listar veículos:', error);
    res.status(500).json({ error: 'Erro ao listar veículos' });
  }
});

// POST / - Criar novo veículo (REST consolidado)
router.post('/', authMiddleware, async (req, res) => {
  const requestId = Math.random().toString(16).substring(2, 10);
  const logPrefix = `[POST /] [${requestId}]`;

  try {
    const { make, model, year, purchasePrice, salePrice, fipePrice, mileage, location, status, motor, potencia, features, costs } = req.body;
    const userId = req.user.id;
    const dealershipId = req.user.dealership_id;

    // Log entrada
    console.log(`${logPrefix} Iniciando criação de veículo:`, {
      userId,
      dealershipId,
      make,
      model,
      year,
    });

    // Validar entrada
    if (!make || !model) {
      console.warn(`${logPrefix} Validação falhou: make ou model vazios`);
      return res.status(400).json({ error: 'Marca e modelo são obrigatórios' });
    }

    // Validar dealership_id
    if (!dealershipId) {
      console.error(`${logPrefix} ERRO CRÍTICO: dealership_id ausente no token`);
      return res.status(400).json({ error: 'dealership_id ausente no token' });
    }

    // ✅ VALIDAR year (1900 até ano atual + 1)
    if (year !== undefined && year !== null) {
      const yearNum = parseInt(year, 10);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
        console.warn(`${logPrefix} Validação: year inválido - ${year}`);
        return res.status(400).json({ error: `Ano deve estar entre 1900 e ${new Date().getFullYear() + 1}` });
      }
    }

    // ✅ VALIDAR purchasePrice
    if (purchasePrice !== undefined && purchasePrice !== null) {
      const purchasePriceNum = parseFloat(purchasePrice);
      if (isNaN(purchasePriceNum) || purchasePriceNum < 0) {
        console.warn(`${logPrefix} Validação: purchasePrice inválido - ${purchasePrice}`);
        return res.status(400).json({ error: 'Preço de compra deve ser um número >= 0' });
      }
    }

    // ✅ VALIDAR salePrice
    if (salePrice !== undefined && salePrice !== null) {
      const salePriceNum = parseFloat(salePrice);
      if (isNaN(salePriceNum) || salePriceNum < 0) {
        console.warn(`${logPrefix} Validação: salePrice inválido - ${salePrice}`);
        return res.status(400).json({ error: 'Preço de venda deve ser um número >= 0' });
      }
    }

    // ✅ VALIDAR business logic: purchasePrice não deve ser > salePrice
    if (purchasePrice !== undefined && salePrice !== undefined && purchasePrice !== null && salePrice !== null) {
      if (parseFloat(purchasePrice) > parseFloat(salePrice)) {
        console.warn(`${logPrefix} Validação: purchasePrice (${purchasePrice}) > salePrice (${salePrice})`);
        return res.status(400).json({ error: 'Preço de compra não pode ser maior que preço de venda' });
      }
    }

    console.log(`${logPrefix} Validações OK, inserindo no banco`);

    // Inserir veículo
    console.log(`${logPrefix} Inserindo veículo no banco`);
    const vehicleResult = await query(
      `INSERT INTO inventory
       (user_id, dealership_id, make, model, year, purchase_price, sale_price, fipe_price, mileage, location, status, motor, potencia, features)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [userId, dealershipId, make, model, year || null, purchasePrice || 0, salePrice || 0, fipePrice || 0, mileage || 0, location || 'Loja A', status || 'available', motor || '', potencia || '', features || ''],
    );

    const vehicleId = vehicleResult.rows[0].id;

    // Inserir custos se fornecidos
    if (costs && typeof costs === 'object') {
      console.log(`${logPrefix} Inserindo custos do veículo`);
      for (const [category, amount] of Object.entries(costs)) {
        if (amount > 0) {
          await query(
            'INSERT INTO vehicle_costs (inventory_id, category, amount) VALUES ($1, $2, $3)',
            [vehicleId, category, amount],
          );
        }
      }
    }

    // Buscar veículo completo com custos agregados
    const fullResult = await query(`
      SELECT
        i.*,
        EXTRACT(DAY FROM (NOW() - i.created_at)) AS days_in_stock,
        COALESCE(
          json_object_agg(vc.category, vc.amount) FILTER (WHERE vc.category IS NOT NULL),
          '{}'::json
        ) AS costs_json
      FROM inventory i
      LEFT JOIN vehicle_costs vc ON vc.inventory_id = i.id
      WHERE i.id = $1
      GROUP BY i.id
    `, [vehicleId]);

    const vehicle = normalizeVehicle(fullResult.rows[0]);

    console.log(`${logPrefix} ✅ Veículo criado com sucesso:`, {
      vehicleId: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
    });

    res.status(201).json({
      message: 'Veículo criado com sucesso',
      vehicle: vehicle,
    });

  } catch (error) {
    console.error(`${logPrefix} ❌ Erro ao criar veículo:`, {
      error: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack.split('\n').slice(0, 3),
    });
    res.status(500).json({ error: 'Erro ao criar veículo' });
  }
});

// POST /create - DEPRECATED (mantido por compatibilidade, usa mesma lógica que POST /)
// GET /pl-summary - P&L consolidado calculado no banco (AC5)
router.get('/pl-summary', authMiddleware, async (req, res) => {
  try {
    const dealershipId = req.user.dealership_id;
    const { from, to } = req.query;

    const dateFilter = from && to ? 'AND i.sold_date BETWEEN $2 AND $3'
                     : from      ? 'AND i.sold_date >= $2'
                     : to        ? 'AND i.sold_date <= $2'
                     : '';
    const params = [dealershipId];
    if (from) params.push(from);
    if (to) params.push(to);

    const invResult = await query(`
      SELECT
        COUNT(*) FILTER (WHERE i.status = 'sold')                       AS total_sold,
        COUNT(*) FILTER (WHERE i.status != 'sold')                      AS total_active,
        COALESCE(SUM(COALESCE(i.sold_price, i.sale_price))
          FILTER (WHERE i.status = 'sold'), 0)                          AS gross_revenue,
        COALESCE(SUM(vc_totals.cost_sum)
          FILTER (WHERE i.status = 'sold'), 0)                          AS total_vehicle_costs,
        COALESCE(SUM(vc_totals.cost_sum)
          FILTER (WHERE i.status != 'sold'), 0)                         AS stock_value
      FROM inventory i
      LEFT JOIN (
        SELECT inventory_id, SUM(amount) AS cost_sum
        FROM vehicle_costs GROUP BY inventory_id
      ) vc_totals ON vc_totals.inventory_id = i.id
      WHERE i.dealership_id = $1 ${dateFilter}
    `, params);

    const expParams = [dealershipId];
    if (from) expParams.push(from);
    if (to) expParams.push(to);
    const expResult = await query(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM expenses WHERE dealership_id = $1
      ${from && to ? 'AND date BETWEEN $2 AND $3' : from ? 'AND date >= $2' : to ? 'AND date <= $2' : ''}
    `, expParams);

    const row = invResult.rows[0];
    const grossRevenue = parseFloat(row.gross_revenue) || 0;
    const totalVehicleCosts = parseFloat(row.total_vehicle_costs) || 0;
    const grossProfit = grossRevenue - totalVehicleCosts;
    const generalExpenses = parseFloat(expResult.rows[0].total) || 0;

    res.json({
      totalSold: parseInt(row.total_sold) || 0,
      totalActive: parseInt(row.total_active) || 0,
      grossRevenue,
      totalVehicleCosts,
      grossProfit,
      generalExpenses,
      netProfit: grossProfit - generalExpenses,
      stockValue: parseFloat(row.stock_value) || 0,
    });
  } catch (error) {
    console.error('Erro ao calcular P&L:', error);
    res.status(500).json({ error: 'Erro ao calcular P&L' });
  }
});

// GET - Buscar veículo específico
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // BUG FIX #8: Include status_changed_at and status_changed_by with costs aggregation
    const vehicleResult = await query(
      `SELECT
        i.*,
        EXTRACT(DAY FROM (NOW() - i.created_at)) AS days_in_stock,
        COALESCE(
          json_object_agg(vc.category, vc.amount) FILTER (WHERE vc.category IS NOT NULL),
          '{}'::json
        ) AS costs_json
      FROM inventory i
      LEFT JOIN vehicle_costs vc ON vc.inventory_id = i.id
      WHERE i.id = $1 AND i.dealership_id = $2
      GROUP BY i.id`,
      [id, req.user.dealership_id],
    );

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    res.json(normalizeVehicle(vehicleResult.rows[0]));
  } catch (error) {
    console.error('Erro ao buscar veículo:', error);
    res.status(500).json({ error: 'Erro ao buscar veículo' });
  }
});

// PUT - Atualizar veículo
router.put('/:id', authMiddleware, async (req, res) => {
  const requestId = Math.random().toString(16).substring(2, 10);
  const logPrefix = `[PUT /:id] [${requestId}]`;

  try {
    const { id } = req.params;
    const { make, model, year, purchasePrice, salePrice, fipePrice, mileage, location, status, motor, potencia, features, costs, soldPrice } = req.body;
    const dealershipId = req.user.dealership_id;

    console.log(`${logPrefix} Iniciando atualização de veículo ${id}`);

    // ✅ VALIDAR tipos de dados
    if (year !== undefined && year !== null) {
      const yearNum = parseInt(year, 10);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
        console.warn(`${logPrefix} Validação: year inválido - ${year}`);
        return res.status(400).json({ error: `Ano deve estar entre 1900 e ${new Date().getFullYear() + 1}` });
      }
    }

    // ✅ VALIDAR purchasePrice e salePrice
    if (purchasePrice !== undefined && purchasePrice !== null) {
      const purchasePriceNum = parseFloat(purchasePrice);
      if (isNaN(purchasePriceNum) || purchasePriceNum < 0) {
        console.warn(`${logPrefix} Validação: purchasePrice inválido - ${purchasePrice}`);
        return res.status(400).json({ error: 'Preço de compra deve ser um número >= 0' });
      }
    }

    if (salePrice !== undefined && salePrice !== null) {
      const salePriceNum = parseFloat(salePrice);
      if (isNaN(salePriceNum) || salePriceNum < 0) {
        console.warn(`${logPrefix} Validação: salePrice inválido - ${salePrice}`);
        return res.status(400).json({ error: 'Preço de venda deve ser um número >= 0' });
      }
    }

    // ✅ VALIDAR business logic: purchasePrice não deve ser > salePrice
    if (purchasePrice !== undefined && salePrice !== undefined && purchasePrice !== null && salePrice !== null) {
      if (parseFloat(purchasePrice) > parseFloat(salePrice)) {
        console.warn(`${logPrefix} Validação: purchasePrice (${purchasePrice}) > salePrice (${salePrice})`);
        return res.status(400).json({ error: 'Preço de compra não pode ser maior que preço de venda' });
      }
    }

    console.log(`${logPrefix} Validações OK, atualizando no banco`);

    // ✅ BUG FIX: Garantir que soldPrice seja null e não undefined para PostgreSQL
    const soldPriceValue = soldPrice !== undefined ? soldPrice : null;

    // BUG FIX #8: Track status changes with timestamp and user ID
    // Check if status is being changed
    const oldStatusResult = await query(
      'SELECT status FROM inventory WHERE id = $1 AND dealership_id = $2',
      [id, req.user.dealership_id],
    );

    const oldStatus = oldStatusResult.rows.length > 0 ? oldStatusResult.rows[0].status : null;
    const statusChanged = status !== undefined && status !== null && status !== oldStatus;

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
           sold_price = CASE
             WHEN $15::numeric IS NOT NULL THEN $15::numeric
             WHEN $9 = 'sold' AND sold_price IS NULL THEN sale_price
             WHEN $9 != 'sold' AND sold_price IS NOT NULL THEN NULL
             ELSE sold_price
           END,
           sold_date = CASE
             WHEN $9 = 'sold' AND sold_date IS NULL THEN CURRENT_TIMESTAMP
             WHEN $9 != 'sold' AND sold_date IS NOT NULL THEN NULL
             ELSE sold_date
           END,
           status_changed_at = CASE
             WHEN $16::boolean THEN CURRENT_TIMESTAMP
             ELSE status_changed_at
           END,
           status_changed_by = CASE
             WHEN $16::boolean THEN $17::uuid
             ELSE status_changed_by
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $13 AND dealership_id = $14
       RETURNING *`,
      [make, model, year, purchasePrice, salePrice, fipePrice, mileage, location, status, motor, potencia, features, id, req.user.dealership_id, soldPriceValue, statusChanged, req.user.id],
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

    // Buscar veículo completo com custos agregados
    const fullResult = await query(`
      SELECT
        i.*,
        EXTRACT(DAY FROM (NOW() - i.created_at)) AS days_in_stock,
        COALESCE(
          json_object_agg(vc.category, vc.amount) FILTER (WHERE vc.category IS NOT NULL),
          '{}'::json
        ) AS costs_json
      FROM inventory i
      LEFT JOIN vehicle_costs vc ON vc.inventory_id = i.id
      WHERE i.id = $1
      GROUP BY i.id
    `, [id]);

    console.log(`${logPrefix} ✅ Veículo atualizado com sucesso`);

    res.json({
      message: 'Veículo atualizado com sucesso',
      vehicle: normalizeVehicle(fullResult.rows[0]),
    });
  } catch (error) {
    console.error(`${logPrefix} ❌ Erro ao atualizar veículo:`, {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });
    res.status(500).json({
      error: 'Erro ao atualizar veículo',
      code: error.code,
      detail: error.message,
    });
  }
});

// DELETE - Deletar veículo
router.delete('/:id', authMiddleware, async (req, res) => {
  const requestId = Math.random().toString(16).substring(2, 10);
  const logPrefix = `[DELETE /:id] [${requestId}]`;

  try {
    const { id } = req.params;
    const dealershipId = req.user.dealership_id;

    console.log(`${logPrefix} Iniciando deleção de veículo ${id}`);

    // ✅ VALIDAR dealership_id
    if (!dealershipId) {
      console.error(`${logPrefix} ERRO: dealership_id ausente no token`);
      return res.status(401).json({ error: 'dealership_id ausente no token' });
    }

    // CRÍTICO #8: Usar soft-delete ao invés de DELETE permanente
    const result = await query(
      'UPDATE inventory SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND dealership_id = $2 RETURNING id',
      [id, dealershipId],
    );

    if (result.rows.length === 0) {
      console.warn(`${logPrefix} Veículo não encontrado ou não pertence à dealership`);
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    console.log(`${logPrefix} ✅ Veículo marcado como deletado (soft-delete): ${id}`);

    res.json({
      message: 'Veículo deletado com sucesso',
    });
  } catch (error) {
    console.error(`${logPrefix} ❌ Erro ao deletar veículo:`, {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });
    res.status(500).json({
      error: 'Erro ao deletar veículo',
      code: error.code,
      detail: error.message,
    });
  }
});

// POST - Upload de imagem (base64 ou URL)
router.post('/:id/upload-image', authMiddleware, async (req, res) => {
  const requestId = Math.random().toString(16).substring(2, 10);
  const logPrefix = `[POST /:id/upload-image] [${requestId}]`;

  try {
    const { id } = req.params;
    const { imageBase64, imageUrl } = req.body;
    const dealershipId = req.user.dealership_id;

    console.log(`${logPrefix} Iniciando upload para veículo ${id}`);

    // Validar entrada
    if (!imageBase64 && !imageUrl) {
      console.warn(`${logPrefix} Validação falhou: imageBase64 e imageUrl vazios`);
      return res.status(400).json({ error: 'imageBase64 ou imageUrl são obrigatórios' });
    }

    // Validar se veículo pertence à loja (dealership)
    const vehicleResult = await query(
      'SELECT id, image_url FROM inventory WHERE id = $1 AND dealership_id = $2',
      [id, dealershipId],
    );

    if (vehicleResult.rows.length === 0) {
      console.warn(`${logPrefix} Veículo não encontrado ou não pertence ao user`, {
        vehicleId: id,
        dealershipId,
      });
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    // Preparar URL final
    let finalImageUrl = imageUrl;
    if (imageBase64) {
      // Validar formato base64
      if (!imageBase64.match(/^data:image\/(jpeg|png|gif|webp);base64,/) && !imageBase64.match(/^[A-Za-z0-9+/=]+$/)) {
        console.warn(`${logPrefix} Formato base64 inválido`);
        return res.status(400).json({
          error: 'Formato base64 inválido. Esperado: data:image/jpeg;base64,... ou base64 puro',
        });
      }
      finalImageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
    }

    // Validar tamanho (base64 é ~1.3x do binário)
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (finalImageUrl.length > maxSizeBytes) {
      console.warn(`${logPrefix} Imagem muito grande`, { sizeBytes: finalImageUrl.length, maxSizeBytes });
      return res.status(413).json({ error: 'Imagem muito grande (máx 10MB)' });
    }

    // Log imagem antiga se existir
    const oldImage = vehicleResult.rows[0].image_url;
    if (oldImage) {
      console.log(`${logPrefix} Substituindo imagem anterior`);
    }

    // Atualizar veículo com URL da imagem
    console.log(`${logPrefix} Atualizando image_url do veículo`);
    const result = await query(
      'UPDATE inventory SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND dealership_id = $3 RETURNING *',
      [finalImageUrl, id, dealershipId],
    );

    const vehicle = normalizeVehicle(result.rows[0]);

    console.log(`${logPrefix} ✅ Imagem salva com sucesso`, {
      vehicleId: vehicle.id,
      imageSizeKb: Math.round(finalImageUrl.length / 1024),
    });

    res.json({
      message: 'Imagem salva com sucesso',
      vehicle: vehicle,
    });

  } catch (error) {
    console.error(`${logPrefix} ❌ Erro ao salvar imagem:`, {
      error: error.message,
      code: error.code,
      stack: error.stack.split('\n').slice(0, 2),
    });
    res.status(500).json({ error: 'Erro ao salvar imagem' });
  }
});

// DELETE - Deletar imagem
router.delete('/:id/image', authMiddleware, async (req, res) => {
  const requestId = Math.random().toString(16).substring(2, 10);
  const logPrefix = `[DELETE /:id/image] [${requestId}]`;

  try {
    const { id } = req.params;
    const dealershipId = req.user.dealership_id;

    console.log(`${logPrefix} Deletando imagem do veículo ${id}`);

    // Validar se veículo pertence à loja (dealership)
    const vehicleResult = await query(
      'SELECT * FROM inventory WHERE id = $1 AND dealership_id = $2',
      [id, dealershipId],
    );

    if (vehicleResult.rows.length === 0) {
      console.warn(`${logPrefix} Veículo não encontrado ou não pertence à dealership`);
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    // Deletar imagem (set NULL)
    const result = await query(
      'UPDATE inventory SET image_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND dealership_id = $2 RETURNING *',
      [id, dealershipId],
    );

    console.log(`${logPrefix} ✅ Imagem deletada com sucesso`);

    res.json({
      message: 'Imagem deletada com sucesso',
      vehicle: result.rows[0],
    });
  } catch (error) {
    console.error(`${logPrefix} ❌ Erro ao deletar imagem:`, {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });
    res.status(500).json({
      error: 'Erro ao deletar imagem',
      code: error.code,
      detail: error.message,
    });
  }
});

// ============================================
// POST /inventory/:id/costs — Adicionar custo a um veículo
// ============================================
// CRÍTICO #6: Novos endpoints de custo (Phase 2)

router.post('/:id/costs', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { category, value } = req.body;
    const dealershipId = req.user.dealership_id;

    // Validações
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return res.status(400).json({ error: 'Category é obrigatória e não pode estar vazia' });
    }

    if (value === undefined || value === null || typeof value !== 'number' || value <= 0) {
      return res.status(400).json({ error: 'Value deve ser um número positivo' });
    }

    // Verificar se veículo existe e pertence à loja
    const vehicleCheck = await query(
      'SELECT id FROM inventory WHERE id = $1 AND dealership_id = $2',
      [id, dealershipId]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    // Inserir custo
    const result = await query(
      `INSERT INTO vehicle_costs (inventory_id, category, amount, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING id, inventory_id, category, amount, created_at`,
      [id, category.trim(), value]
    );

    const cost = result.rows[0];
    res.status(201).json({
      id: cost.id,
      inventory_id: cost.inventory_id,
      category: cost.category,
      value: parseFloat(cost.amount),
      created_at: cost.created_at,
    });
  } catch (error) {
    console.error('Erro ao adicionar custo:', error);
    res.status(500).json({ error: 'Erro ao adicionar custo', message: error.message });
  }
});

// ============================================
// PATCH /inventory/:id/costs/:costId — Editar custo de um veículo
// ============================================

router.patch('/:id/costs/:costId', authMiddleware, async (req, res) => {
  try {
    const { id, costId } = req.params;
    const { category, value } = req.body;
    const dealershipId = req.user.dealership_id;

    // Validar pelo menos um campo para atualizar
    if (!category && value === undefined) {
      return res.status(400).json({ error: 'Pelo menos category ou value deve ser fornecido' });
    }

    // Validar category se fornecido
    if (category !== undefined) {
      if (typeof category !== 'string' || category.trim().length === 0) {
        return res.status(400).json({ error: 'Category deve ser uma string não-vazia' });
      }
    }

    // Validar value se fornecido
    if (value !== undefined) {
      if (typeof value !== 'number' || value <= 0) {
        return res.status(400).json({ error: 'Value deve ser um número positivo' });
      }
    }

    // Verificar se veículo existe e pertence à loja
    const vehicleCheck = await query(
      'SELECT id FROM inventory WHERE id = $1 AND dealership_id = $2',
      [id, dealershipId]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    // Verificar se custo existe e pertence ao veículo
    const costCheck = await query(
      'SELECT id, inventory_id FROM vehicle_costs WHERE id = $1 AND inventory_id = $2',
      [costId, id]
    );

    if (costCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Custo não encontrado para este veículo' });
    }

    // Preparar UPDATE dinamicamente
    const updates = [];
    const params = [costId];
    let paramIndex = 2;

    if (category !== undefined) {
      updates.push(`category = $${paramIndex}`);
      params.push(category.trim());
      paramIndex++;
    }

    if (value !== undefined) {
      updates.push(`amount = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }

    const updateQuery = `
      UPDATE vehicle_costs
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING id, inventory_id, category, amount, created_at
    `;

    const result = await query(updateQuery, params);
    const cost = result.rows[0];

    res.json({
      id: cost.id,
      inventory_id: cost.inventory_id,
      category: cost.category,
      value: parseFloat(cost.amount),
      created_at: cost.created_at,
    });
  } catch (error) {
    console.error('Erro ao atualizar custo:', error);
    res.status(500).json({ error: 'Erro ao atualizar custo', message: error.message });
  }
});

export default router;
