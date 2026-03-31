/**
 * Rotas de Autenticação
 * POST /auth/login - Fazer login
 * POST /auth/logout - Fazer logout
 * GET /auth/me - Dados do usuário atual
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ===== INICIALIZAR USUÁRIOS PADRÃO =====
async function initDefaultUsers() {
  try {
    // 1. Garantir que a tabela users tem as colunas corretas
    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    `);
    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
    `);
    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(200);
    `);
    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS dealership_id UUID;
    `);

    // 2. Criar unique constraint em email (idempotent)
    await query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'users_email_unique'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
        END IF;
      END $$;
    `);

    // 3. Criar dealership BrossMotors se não existir
    const dealershipId = '11111111-1111-1111-1111-111111111111';
    await query(`
      INSERT INTO dealerships (id, name, created_at, updated_at)
      VALUES ($1, 'BrossMotors', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO NOTHING;
    `, [dealershipId]);

    // 4. Criar os 3 usuários padrão
    const defaultUsers = [
      { email: 'admin@threeon.com', password: 'threeon2026', name: 'ThreeON Admin' },
      { email: 'dono@brossmotors.com', password: 'bross2026', name: 'BrossMotors Dono' },
      { email: 'lojab@brossmotors.com', password: 'lojab2026', name: 'Loja B Gerente' },
    ];

    for (const u of defaultUsers) {
      const hash = await bcrypt.hash(u.password, 10);
      await query(`
        INSERT INTO users (email, password, name, dealership_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT ON CONSTRAINT users_email_unique DO NOTHING;
      `, [u.email, hash, u.name, dealershipId]);
    }

    console.log('✅ Usuários padrão verificados/criados');
  } catch (err) {
    console.error('Erro ao inicializar usuários:', err.message);
  }
}

// Executar na ativação do módulo (não bloqueia startup se banco não estiver disponível)
initDefaultUsers().catch(err => {
  console.error('⚠️ Erro ao inicializar usuários padrão (servidor continua em MVP mode):', err.message);
});

// ===== LOGIN =====
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const user = result.rows[0];

    // Validar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Gerar JWT com dealership_id (crítico para RLS)
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        dealership_id: user.dealership_id, // CRÍTICO para RLS
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        dealership_id: user.dealership_id,
      },
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== CRIAR NOVO USUÁRIO (cadastro) =====
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validar input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // IMPORTANTE: Novo usuário precisa de dealership_id
    // Por padrão, atribuir à primeira dealership (Loja A)
    const dealershipResult = await query(
      'SELECT id FROM dealerships ORDER BY created_at LIMIT 1'
    );
    const dealership_id = dealershipResult.rows[0]?.id;

    if (!dealership_id) {
      return res.status(500).json({
        error: 'Nenhuma loja configurada no sistema'
      });
    }

    // Inserir usuário com dealership_id
    const result = await query(
      'INSERT INTO users (email, password, name, dealership_id) VALUES ($1, $2, $3, $4) RETURNING id, email, name, dealership_id',
      [email, hashedPassword, name, dealership_id],
    );

    const user = result.rows[0];

    // Gerar JWT com dealership_id (crítico para RLS)
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        dealership_id: user.dealership_id, // CRÍTICO para RLS
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.status(201).json({
      token,
      user,
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);

    // Tratamento de erro de email duplicado
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email já registrado' });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== DADOS DO USUÁRIO ATUAL =====
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT id, name, email, dealership_id FROM users WHERE id = $1', [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== LOGOUT (opcional, client-side é suficiente) =====
router.post('/logout', authMiddleware, (req, res) => {
  // Em produção, você poderia adicionar token a uma blacklist
  res.json({ message: 'Logout realizado com sucesso' });
});

// ===== SEED DEFAULT USERS (Development/Emergency) =====
router.post('/seed-default-users', async (req, res) => {
  try {
    // 1. Garantir que a tabela users tem as colunas corretas
    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    `);
    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
    `);
    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(200);
    `);
    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS dealership_id UUID;
    `);

    // 2. Criar unique constraint em email (idempotent)
    await query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'users_email_unique'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
        END IF;
      END $$;
    `);

    // 3. Criar dealership BrossMotors se não existir
    const dealershipId = '11111111-1111-1111-1111-111111111111';
    await query(`
      INSERT INTO dealerships (id, name, created_at, updated_at)
      VALUES ($1, 'BrossMotors', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO NOTHING;
    `, [dealershipId]);

    // 4. Criar os 3 usuários padrão
    const defaultUsers = [
      { email: 'admin@threeon.com', password: 'threeon2026', name: 'ThreeON Admin' },
      { email: 'dono@brossmotors.com', password: 'bross2026', name: 'BrossMotors Dono' },
      { email: 'lojab@brossmotors.com', password: 'lojab2026', name: 'Loja B Gerente' },
    ];

    const created = [];
    for (const u of defaultUsers) {
      const hash = await bcrypt.hash(u.password, 10);
      const result = await query(`
        INSERT INTO users (email, password, name, dealership_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT ON CONSTRAINT users_email_unique DO NOTHING
        RETURNING id, email, name;
      `, [u.email, hash, u.name, dealershipId]);

      if (result.rows.length > 0) {
        created.push(result.rows[0]);
      }
    }

    res.json({
      message: 'Usuários padrão criados/verificados com sucesso',
      created,
    });
  } catch (error) {
    console.error('Erro ao seed usuários:', error);
    res.status(500).json({ error: 'Erro ao criar usuários: ' + error.message });
  }
});

export default router;
