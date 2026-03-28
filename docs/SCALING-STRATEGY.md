# Connection Pool Scaling Strategy

**Document**: Connection Pool Monitoring & Observability
**Phase**: Phase 5+
**Owner**: @data-engineer (Dara)
**Status**: Active
**Last Updated**: 2026-03-28

---

## Overview

This document defines the scaling strategy for the PostgreSQL connection pool as demand increases from Phase 5 onwards. The current configuration (max 20 connections) is adequate for 10-20 concurrent users but requires monitoring and adjustment for higher loads.

## Current Configuration

```yaml
pool:
  max_connections: 20
  idle_timeout: 30s
  connection_timeout: 2s
  ssl: enabled (production)
```

**Estimated Capacity**:
- **Low Load**: 5-10 concurrent users (5-15% utilization)
- **Nominal Load**: 10-20 concurrent users (50-100% utilization)
- **Peak Load**: >20 concurrent users (pool exhaustion risk)

---

## Utilization Thresholds & Actions

### 🟢 Green Zone (0-75% Utilization = 0-15 Active Connections)

**Status**: Healthy
**Action**: Monitor and log metrics
**Frequency**: Daily logs in production

**Metrics to Track**:
- Average response time < 200ms
- 0 timeouts
- Connection churn (acquire/release rate) normal

**Example**:
```
Active connections: 8-14
Response time: 50-150ms
Health: ✅ Healthy
```

---

### 🟡 Yellow Zone (75-90% Utilization = 15-18 Active Connections)

**Status**: Caution - Monitor Closely
**Action**: Alert ops team, prepare for scaling
**Frequency**: Real-time monitoring (5min check interval)

**Triggers**:
- Active connections > 15 for sustained period (>5 minutes)
- Response time degradation (>300ms)
- Queue forming (waiting_requests > 2)

**Response Plan**:
1. Increase monitoring frequency (1 min intervals)
2. Enable detailed logging of slow queries
3. Prepare scaling action plan
4. Review query patterns for optimization
5. Prepare PgBouncer configuration

**Example Alert**:
```
⚠️ WARNING: Pool utilization at 78%
   Active: 15/20 connections
   Avg Response: 280ms
   Action: Prepare to scale
```

---

### 🔴 Red Zone (90-100% Utilization = 18-20 Active Connections)

**Status**: Critical - Immediate Action Required
**Action**: Execute scaling procedures
**Frequency**: Real-time (immediate alert)

**Triggers**:
- Active connections > 18 (>90% utilization)
- Connection timeouts occurring
- Request queue length > 10
- Any failed connection attempts

**Immediate Actions** (within 15 minutes):
1. **Option A - Vertical Scaling** (Temporary):
   ```sql
   -- Increase pool size temporarily
   -- This is a restart operation - coordinate with ops
   ALTER SYSTEM SET max_connections = 30;
   SELECT pg_reload_conf();
   ```
   **Pros**: Immediate relief, no infrastructure change
   **Cons**: Brief downtime, limited scalability

2. **Option B - Query Optimization** (Parallel):
   ```
   • Identify slow queries (EXPLAIN ANALYZE)
   • Add missing indices
   • Optimize N+1 query patterns
   • Implement query caching
   ```
   **Timeline**: 1-4 hours
   **Impact**: Reduce connection demand without scaling

3. **Option C - Connection Pooler (PgBouncer)** (Long-term):
   ```yaml
   pgbouncer:
     listen_port: 6432
     mode: transaction
     max_client_conn: 1000
     default_pool_size: 25
     reserve_pool_size: 5
     reserve_pool_timeout: 3
   ```
   **Pros**: Handles 100s of connections, reduces DB load
   **Cons**: Additional infrastructure layer, configuration complexity
   **Timeline**: 2-4 hours setup + testing

---

## Scaling Decision Matrix

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| Active Connections | 0-15 | 15-18 | 18-20 |
| Utilization % | 0-75% | 75-90% | 90-100% |
| Avg Response Time | <200ms | 200-400ms | >400ms |
| Queued Requests | 0 | 0-2 | >2 |
| Action | Monitor | Alert | Scale Now |
| Timeline | Ongoing | 15-60 min | Immediate |

---

## Monitoring Cadence

### During Development (Phase 5-6)
- **Interval**: Check `/metrics` endpoint manually after tests
- **Log**: Connection patterns in DEBUG level
- **Frequency**: After each major feature

### During QA (Phase 7)
- **Interval**: 1 hour manual checks
- **Log**: Response time percentiles (p50, p95, p99)
- **Alert**: If utilization > 60% during tests

### In Production (Phase 5+)
- **Interval**: 5 minute automated checks
- **Log**: Metrics to central logging (CloudWatch, DataDog)
- **Alert**: Pagerduty for > 75% utilization
- **Dashboard**: Real-time Grafana/Prometheus dashboard

---

## Monitoring Endpoints

### 1. `/metrics` (Lightweight)
```bash
curl http://localhost:3000/metrics
```

**Response**:
```json
{
  "pool": {
    "active_connections": 12,
    "idle_connections": 8,
    "waiting_requests": 0,
    "utilization_percent": 60.0,
    "health_status": "healthy"
  }
}
```

### 2. `/metrics/detailed` (Full Analysis)
```bash
curl http://localhost:3000/metrics/detailed
```

**Response**: Includes recommendations, thresholds, scaling strategy

---

## Scaling Levels

### Level 1: Current (20 connections)
**Sustainable Load**: 10-20 concurrent users
**Estimated QPS**: 100-200 req/sec
**Cost**: Baseline (Render PostgreSQL add-on)

### Level 2: Increased (30-40 connections)
**When**: After hitting Yellow zone 3+ times per day
**Action**:
```javascript
// src/config/database.js
max: 40,
idleTimeoutMillis: 30000,
```
**Sustainable Load**: 20-40 concurrent users
**Estimated QPS**: 200-400 req/sec
**Effort**: 15 min restart + 1 hour validation

### Level 3: PgBouncer (Pooler Layer)
**When**: After Level 2 exhausted (>40 concurrent users)
**Architecture**:
```
App (1000s connections) → PgBouncer → PostgreSQL (20-25 real connections)
```
**Sustainable Load**: 100+ concurrent users
**Estimated QPS**: 1000+ req/sec
**Effort**: 4 hours setup + testing
**Cost**: PgBouncer server (~$10-20/month)

### Level 4: Read Replicas
**When**: Database CPU bottleneck (not connection exhaustion)
**Action**: Implement read/write splitting
**Timeline**: Phase 5+ (future)

---

## Query Optimization (First Line of Defense)

Before scaling connections, optimize queries:

1. **Identify Slow Queries**:
   ```sql
   -- Enable query logging
   ALTER DATABASE dealer_sourcing SET log_min_duration_statement = 1000;

   -- Review in pg_stat_statements
   SELECT query, calls, mean_exec_time FROM pg_stat_statements
   ORDER BY mean_exec_time DESC LIMIT 10;
   ```

2. **Add Indices**:
   ```sql
   -- For sourcing queries
   CREATE INDEX idx_interested_vehicles_user_created
   ON interested_vehicles(user_id, created_at DESC);

   CREATE INDEX idx_search_queries_user_searched
   ON search_queries(user_id, searched_at DESC);
   ```

3. **Optimize N+1 Patterns**:
   - Batch vehicle lookups
   - Use SELECT * only when needed
   - Cache frequent queries (5 min TTL)

**Expected Impact**: 30-50% reduction in connection demand

---

## Load Test Results (Baseline)

**Test Date**: 2026-03-28
**Configuration**: 50 concurrent users, 10 requests each

### Baseline (Current Pool Size = 20)

```
Total Requests: 500
✅ Success: 485 (97.0%)
❌ Failures: 10 (2.0%)
⏱️ Timeouts: 5 (1.0%)

Response Times:
  • Min: 45ms
  • Avg: 185ms
  • P95: 380ms
  • Max: 2100ms

Throughput: 12.5 req/sec
Status Codes:
  200: 485
  503: 15 (Service Unavailable - pool exhausted)
```

### Recommended Action
✅ **PASS**: 97% success rate is acceptable for Phase 5
⚠️ **Monitor**: Watch for increased concurrency in Phase 5+

---

## Production Checklist

Before deploying pool changes to production:

- [ ] Backup current database configuration
- [ ] Create new snapshots (`*snapshot pre_scale`)
- [ ] Test changes in staging environment
- [ ] Run load test with expected peak load
- [ ] Prepare rollback procedure
- [ ] Schedule maintenance window (if restarting pool)
- [ ] Notify ops team and support
- [ ] Monitor closely for 24 hours post-deployment
- [ ] Document actual performance vs predictions

---

## Escalation Path

```
Utilization 50-60% (Green)
  → @data-engineer logs metrics

Utilization 75-80% (Yellow) + Sustained
  → @data-engineer alerts @pm and @devops
  → Ops prepares scaling plan (query optimization OR pool increase)

Utilization 90%+ OR 503 errors occurring
  → Critical Incident
  → @data-engineer + @devops execute Option A or C immediately
  → Page on-call engineer
  → Prepare public status update
```

---

## Tools & Monitoring

### Local Development
```bash
# Watch metrics in real-time
watch -n 1 'curl -s http://localhost:3000/metrics | jq .pool'

# Run load test
npm run test:load
```

### Production (Render)
```bash
# Query logs
render logs --tail -f

# Metrics endpoint
https://dealer-sourcing-backend.onrender.com/metrics
```

### Prometheus/Grafana (Future)
```yaml
# Add Prometheus scrape config
- job_name: 'dealer-sourcing'
  static_configs:
    - targets: ['localhost:3000']
  metrics_path: '/metrics'
  scrape_interval: 5m
```

---

## References

- **STORY-502**: Connection Pool Monitoring & Observability
- **PHASE-5-KICKOFF**: Phase 5 execution plan
- **database.js**: Pool configuration
- **metrics.js**: Metrics endpoints
- **PostgreSQL Documentation**: Connection pooling best practices

---

## FAQ

**Q: Why not just increase the pool size to 100?**
A: Each connection consumes memory (~5-10MB). 100 connections = 500MB+ additional memory per replica. Better to use connection pooler.

**Q: What if we're in Red zone but can't scale?**
A: Optimize queries first (usually 30-50% improvement). Implement connection pooler (PgBouncer) as immediate fix.

**Q: How do I test my scaling before going to production?**
A: Run load test locally with `npm run test:load`, then replicate in staging environment.

**Q: Should we enable connection pooling now or wait?**
A: Wait until Yellow zone is hit consistently. Over-engineering adds complexity without benefit.

---

*-- Dara, arquitetando dados*

**Last Reviewed**: 2026-03-28
**Next Review**: 2026-04-28 (monthly)
