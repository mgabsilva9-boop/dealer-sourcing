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
      WHERE i.dealership_id = $1
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
      WHERE i.dealership_id = $1
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
router.post('/create', authMiddleware, async (req, res) => {
  console.warn('[DEPRECATED] POST /inventory/create - use POST /inventory instead');
  // Invocar handler do POST / manualmente
  const handlers = router.stack.find(x => x.route && x.route.path === '/' && x.route.methods.post);
  if (handlers) {
    handlers.handle(req, res);
  } else {
    res.status(501).json({ error: 'Endpoint não configurado corretamente' });
  }
});

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

    const vehicleResult = await query(
      'SELECT * FROM inventory WHERE id = $1 AND dealership_id = $2',
      [id, req.user.dealership_id],
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
    const { make, model, year, purchasePrice, salePrice, fipePrice, mileage, location, status, motor, potencia, features, costs, soldPrice } = req.body;

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
             WHEN $15 IS NOT NULL THEN $15
             WHEN $9 = 'sold' AND sold_price IS NULL THEN sale_price
             ELSE sold_price
           END,
           sold_date = CASE
             WHEN $9 = 'sold' AND sold_date IS NULL THEN CURRENT_DATE
             ELSE sold_date
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $13 AND dealership_id = $14
       RETURNING *`,
      [make, model, year, purchasePrice, salePrice, fipePrice, mileage, location, status, motor, potencia, features, id, req.user.dealership_id, soldPrice || null],
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

    res.json({
      message: 'Veículo atualizado com sucesso',
      vehicle: normalizeVehicle(fullResult.rows[0]),
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
      'DELETE FROM inventory WHERE id = $1 AND dealership_id = $2 RETURNING id',
      [id, req.user.dealership_id],
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
  try {
    const { id } = req.params;
    console.log('[DELETE /:id/image] Deletando imagem do veículo', id);

    // Validar se veículo pertence à loja (dealership)
    const vehicleResult = await query(
      'SELECT * FROM inventory WHERE id = $1 AND dealership_id = $2',
      [id, req.user.dealership_id],
    );

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    // Deletar imagem (set NULL)
    const result = await query(
      'UPDATE inventory SET image_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND dealership_id = $2 RETURNING *',
      [id, req.user.dealership_id],
    );

    res.json({
      message: 'Imagem deletada com sucesso',
      vehicle: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    res.status(500).json({ error: 'Erro ao deletar imagem' });
  }
});

export default router;
