/**
 * DEALER SOURCING BOT - Backend API
 * Server principal do aplicativo
 */

import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/database.js';

// Importar rotas
import authRoutes from './routes/auth.js';
import searchRoutes from './routes/search.js';
import vehiclesRoutes from './routes/vehicles.js';
import historyRoutes from './routes/history.js';
import inventoryRoutes from './routes/inventory.js';
import crmRoutes from './routes/crm.js';
import expensesRoutes from './routes/expenses.js';
import sourcingRoutes from './routes/sourcing.js';
import metricsRoutes from './routes/metrics.js';
import cacheRoutes from './routes/cache.js';

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ],
  credentials: true,
}));

// Logger simples
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
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

app.use('/auth', authRoutes);
app.use('/search', searchRoutes);
app.use('/vehicles', vehiclesRoutes);
app.use('/history', historyRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/crm', crmRoutes);
app.use('/expenses', expensesRoutes);
app.use('/sourcing', sourcingRoutes);

// ===== ERROR HANDLING =====

app.use((err, req, res, _next) => {
  console.error('❌ Erro:', err);

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
