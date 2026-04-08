# 🔍 MONITORING SETUP — Production

**Objetivo:** Garantir visibilidade total do sistema em produção  
**Responsável:** DevOps Agent  
**Atualizado:** 8 Abril 2026

---

## 1. Error Tracking (Sentry)

### O que é
Sentry captura exceções JavaScript e erros de servidor em produção, com full stack trace e contexto.

### Status Atual
- [ ] Sentry DSN configurado em `.env.production`?
- [ ] Sentry inicializado em `src/server.js` (backend)?
- [ ] Sentry inicializado em `src/frontend/App.jsx` ou `src/frontend/main.jsx` (frontend)?

### Como Verificar
```javascript
// Backend (src/server.js)
import * as Sentry from "@sentry/node";
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Frontend (src/frontend/main.jsx)
import * as Sentry from "@sentry/react";
Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

### Acessar Sentry
- URL: https://sentry.io/organizations/[org-name]/issues/
- Procurar por eventos dos últimos 30 minutos
- Alertar se há spike de erros

### Alertas Configurados
- [ ] Erro crítico → Notificar DevOps
- [ ] Spike de erros (>10 em 5 min) → Notificar DevOps
- [ ] Database connection error → Notificar DevOps

---

## 2. Structured Logging (Winston)

### O que é
Winston fornece logs estruturados em JSON para rastreamento de eventos e debugging.

### Status Atual
- [ ] Winston inicializado em `src/lib/logger.js`?
- [ ] Middleware de logging em `src/server.js`?
- [ ] Logs estruturados em JSON (não texto)?

### Exemplo de Logger
```javascript
// src/lib/logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    // Opcional: Cloud logging (Vercel, Railway provides stdout capture)
  ],
});

export default logger;
```

### Uso
```javascript
logger.info('User logged in', { userId: 123, email: 'user@example.com' });
logger.error('Database error', { error: err.message, query: sql });
logger.warn('High memory usage', { memory: process.memoryUsage() });
```

### Acessar Logs
- **Vercel Logs:** vercel.com → Project → Deployments → [Latest] → Logs
- **Railway Logs:** railway.app → Project → Service → Logs
- **Local:** `npm run dev:server` mostra logs no console

### Log Levels
- `error` (0): Problemas críticos → Alertar
- `warn` (1): Problemas potenciais → Monitorar
- `info` (2): Eventos importantes → Log
- `debug` (3): Debugging detalhado → Desenvolvimento

---

## 3. Health Check Endpoints

### O que é
Endpoints que retornam status do sistema para monitoring automático.

### Implementação
```javascript
// src/routes/health.js
router.get('/health', async (req, res) => {
  try {
    // Verificar database
    await query('SELECT 1');

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});
```

### URLs
- Backend: `https://dealer-sourcing-api-production.up.railway.app/health`
- Frontend: `https://dealer-sourcing-frontend.vercel.app/` (deve retornar HTML 200)

### Validação
```bash
# Testar health endpoint
curl https://dealer-sourcing-api-production.up.railway.app/health

# Esperado:
# {"status":"healthy","timestamp":"2026-04-08T...", "uptime":12345}
```

---

## 4. Uptime Monitoring

### Opção 1: UptimeRobot (Gratuito)
1. Criar conta em uptimerobot.com
2. Adicionar monitor HTTP GET para `/health`
3. Configurar alertas por email

### Opção 2: Vercel Built-in
- Vercel monitora automaticamente
- vercel.com → Project → Analytics → Uptime

### Opção 3: Railway Built-in
- Railway mostra status do serviço
- railway.app → Project → Monitoring

### Checklist de Configuração
- [ ] Health endpoint respondendo 200?
- [ ] UptimeRobot (ou similar) configurado?
- [ ] Alertas por email/Slack configurados?

---

## 5. Performance Monitoring

### Core Web Vitals (Vercel)
- **LCP (Largest Contentful Paint):** <2.5s (✅ Bom)
- **FID (First Input Delay):** <100ms (✅ Bom)
- **CLS (Cumulative Layout Shift):** <0.1 (✅ Bom)

Acessar em: vercel.com → Project → Analytics → Web Vitals

### Database Performance (Supabase)
- Acessar: supabase.com → Project → SQL → Query Performance
- Procurar por queries lentas (>500ms)

### API Performance (Railway + Logs)
```javascript
// Middleware para medir tempo de requisição
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('API request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
    });
  });
  next();
});
```

---

## 6. Database Monitoring (Supabase)

### Conexões Ativas
- Supabase Dashboard → SQL Editor → Ver conexões ativas
- Alertar se > 20 conexões (máximo usual)

### Query Performance
- Supabase → Database → Query Performance
- Top 10 queries lentas
- Procurar por N+1 queries

### Storage
- Supabase → Database → Database Size
- Alertar se > 90% da quota

### Backup Status
- Supabase → Backups → Verificar último backup automático
- Esperado: diário, completo

---

## 7. Security Monitoring

### JWT Token Validation
- [ ] Tokens expiram após 7 dias?
- [ ] Refresh tokens configurados?

### Rate Limiting
- [ ] Express rate-limit ativo?
- [ ] Limite: 100 requests/15 min por IP?

### CORS
- [ ] Apenas FRONTEND_URL permitida?
- [ ] Credenciais incluídas (credentials: 'include')?

---

## 8. Alerting Strategy

### Severidade & Ação

| Severidade | Condição | Ação |
|-----------|----------|------|
| 🔴 CRÍTICO | API /health retorna erro | Rollback imediato |
| 🔴 CRÍTICO | Spike de erros 500+ por min | Investigar logs |
| 🟠 ALTO | Database desconectado | Verificar Supabase |
| 🟠 ALTO | Login falha (>50% de taxa) | Verificar auth |
| 🟡 MÉDIO | Response time >3s | Profile performance |
| 🟢 BAIXO | Warning logs | Revisar após 24h |

### Canais de Notificação
1. **Email:** DevOps agent + CTO
2. **Slack:** #production-alerts (se existir)
3. **SMS:** Crítico apenas (se configurado)

---

## 9. Runbook — Se Algo Quebrar

### Cenário 1: API retornando 500
```bash
# 1. Verificar Railway logs
# railway.app → Project → Service → Logs
# Procurar por "error" dos últimos 5 min

# 2. Verificar database
# Supabase → SQL Editor → SELECT 1
# Se falhar: DATABASE_URL pode estar quebrada

# 3. Se grave: Rollback
git revert [LAST_DEPLOY_COMMIT]
git push origin main
# Aguardar 5 min para Railway redeploy

# 4. Validar com smoke tests
bash SMOKE_TESTS_PRODUCAO.sh
```

### Cenário 2: Frontend não carrega
```bash
# 1. Verificar Vercel logs
# vercel.com → Project → Latest Deployment → Logs

# 2. Verificar build erros
# npm run build localmente

# 3. Se grave: Rollback
git revert [LAST_DEPLOY_COMMIT]
git push origin main
# Vercel irá redeploy automaticamente
```

### Cenário 3: Database lenta
```bash
# 1. Verificar queries ativas
# Supabase → Database → Query Performance

# 2. Se alguma query > 5s:
#    a. Otimizar índice
#    b. Refatorar query

# 3. Reiniciar pool de conexões (se necessário)
# Supabase → Database → Connection Pooler → Restart
```

### Cenário 4: Memory leak
```bash
# 1. Verificar Node memory em Railway logs
# Se cresce continuamente: há vazamento

# 2. Procurar por:
#    - Listeners não removidos
#    - Timers não limpos
#    - Cache sem limite

# 3. Fix e deploy
# Ou rollback se urgente
```

---

## 10. Daily/Weekly Checklist

### Daily (09:00 AM)
- [ ] Sentry: Algum erro crítico?
- [ ] Uptime: 99.9%+?
- [ ] Database size: Normal?

### Weekly (Segunda 09:00 AM)
- [ ] Revisar performance trends
- [ ] Revisar slow queries (Supabase)
- [ ] Revisar error trends (Sentry)
- [ ] Verificar backup status

### Monthly (1º dia do mês)
- [ ] Audit de logs (últimos 30 dias)
- [ ] Revisão de custos (Vercel, Railway, Supabase)
- [ ] Planejar otimizações
- [ ] Atualizar runbook se necessário

---

## Recursos & Links

- **Sentry:** https://sentry.io
- **UptimeRobot:** https://uptimerobot.com
- **Vercel Logs:** https://vercel.com/dashboard
- **Railway Logs:** https://railway.app/dashboard
- **Supabase Monitoring:** https://app.supabase.com
- **Runbook Template:** Veja seção 9 acima

---

## Setup Checklist (Fazer Agora)

- [ ] Sentry DSN configurado em .env.production
- [ ] Sentry.init() em backend e frontend
- [ ] Winston logger implementado
- [ ] Health check endpoint criado
- [ ] UptimeRobot configurado
- [ ] Alertas configurados (email/Slack)
- [ ] Runbook documentado
- [ ] Team treinado

**Tempo estimado:** 2-3 horas para setup completo

