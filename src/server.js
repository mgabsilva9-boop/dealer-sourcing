/**
 * DEALER SOURCING BOT - Backend API
 * Server principal do aplicativo
 */

import './config/env.js';

import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { pool } from './config/database.js';
import logger from './lib/logger.js';

// Importar rotas
import authRoutes, { tokenBlacklist } from './routes/auth.js';
import searchRoutes from './routes/search.js';
import vehiclesRoutes from './routes/vehicles.js';
import historyRoutes from './routes/history.js';
import inventoryRoutes from './routes/inventory.js';
import crmRoutes from './routes/crm.js';
import expensesRoutes from './routes/expenses.js';
import sourcingRoutes from './routes/sourcing.js';
import metricsRoutes from './routes/metrics.js';
import cacheRoutes from './routes/cache.js';
import financialRoutes from './routes/financial.js';
import ipvaRoutes from './routes/ipva.js';
import { setTokenBlacklist } from './middleware/auth.js';

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// Injetar token blacklist no middleware (CRÍTICO #3)
setTokenBlacklist(tokenBlacklist);

// ===== MIDDLEWARE =====

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS — em dev aceita qualquer localhost, em prod apenas origens específicas
const isDev = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: function(origin, callback) {
    // Permitir requisições sem origin (curl, Postman, etc)
    if (!origin) {
      return callback(null, true);
    }

    // Em desenvolvimento: aceitar qualquer localhost e 127.0.0.1 em qualquer porta
    if (isDev && origin.match(/^https?:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
    if (isDev && origin.match(/^https?:\/\/127\.0\.0\.1:\d+$/)) {
      return callback(null, true);
    }

    // Em produção: aceitar apenas origens específicas
    if (origin === 'https://dealer-sourcing-frontend.vercel.app') {
      return callback(null, true);
    }
    if (origin.match(/^https:\/\/dealer-sourcing-frontend-[\w-]+\.vercel\.app$/)) {
      return callback(null, true);
    }

    // Rejeitar tudo mais
    console.warn(`⚠️ CORS bloqueado para origin: ${origin}`);
    return callback(new Error(`CORS não permitido para: ${origin}`), false);
  },
  credentials: true,
}));

// Rate limiting (CRÍTICO #4)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por janela
  message: 'Muitas requisições deste IP, tente novamente depois',
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: isDev ? 9999 : 5, // 9999 em dev (sem limite prático), 5 em produção
  message: 'Muitas tentativas de login, tente novamente em 1 hora',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Não contar requisições bem-sucedidas
});

// Aplicar rate limiting geral
app.use(generalLimiter);

// Logger middleware (CRÍTICO #7)
app.use((req, res, next) => {
  logger.info('Request', {
    method: req.method,
    path: req.path,
    userId: req.user?.id || 'anonymous',
    dealershipId: req.user?.dealership_id || 'none',
  });

  // Capture response time
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Response', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || 'anonymous',
    });
  });

  next();
});

// ===== HEALTH CHECK =====

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ===== METRICS (STORY-502) =====

app.use('/metrics', metricsRoutes);

// ===== CACHE (STORY-601) =====

app.use('/api/cache', cacheRoutes);

// ===== ROTAS =====

// Aplicar rate limiting específico para login
app.use('/auth/login', loginLimiter);
app.use('/auth', authRoutes);
app.use('/search', searchRoutes);
app.use('/vehicles', vehiclesRoutes);
app.use('/history', historyRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/crm', crmRoutes);
app.use('/expenses', expensesRoutes);
app.use('/sourcing', sourcingRoutes);
app.use('/financial', financialRoutes);
app.use('/ipva', ipvaRoutes);

// ===== ERROR HANDLING =====

app.use((err, req, res, _next) => {
  logger.error('Unhandled Error', {
    message: err.message,
    stack: err.stack,
    status: err.status || 500,
    userId: req.user?.id || 'anonymous',
    path: req.path,
    method: req.method,
  });

  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    status: err.status || 500,
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ===== INICIALIZAR SERVIDOR =====

async function startServer() {
  try {
    // Log configurações de inicialização
    console.log('🔧 Configurações:');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   PORT:', PORT);
    console.log('   DATABASE_URL: ' + (process.env.DATABASE_URL ? '(SET)' : '(NOT SET)'));
    if (process.env.DATABASE_URL) {
      const dbUrl = process.env.DATABASE_URL;
      const masked = dbUrl.split('@')[0] + '@[REDACTED]';
      console.log('   DATABASE_URL (masked):', masked);
    }

    // Testar conexão com banco (não bloqueia se falhar - MVP mode)
    try {
      const result = await pool.query('SELECT NOW()');
      console.log('✅ Banco de dados conectado:', result.rows[0]);
    } catch (dbError) {
      console.warn('⚠️ Banco não conectado - usando dados mockados (MVP mode)');
      console.warn('   Erro:', dbError.message);
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║  🚗 DEALER SOURCING BOT - BACKEND      ║
║  🚀 Server rodando em porta ${PORT}        ║
║  📡 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'} ║
║  ✅ Status: Online                     ║
║  🔄 Version: 3B-Hotfix (2026-03-31)   ║
╚════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('❌ Erro crítico ao inicializar servidor:', err);
    process.exit(1);
  }
}

// Iniciar servidor
startServer();

export { app, startServer };
export default app;
// FORCED REBUILD - JWT_SECRET and DATABASE_URL synchronized
// Thu Apr 03 22:38:00 UTC 2026 - @devops manual redeploy trigger
// Build hash: auth-middleware-fix-v2
