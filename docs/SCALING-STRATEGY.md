# Scaling Strategy: Connection Pool Monitoring

**Document**: STORY-502 Phase 5+
**Version**: 1.0.0
**Last Updated**: 2026-03-28

## Overview

This document defines the scaling strategy for PostgreSQL connection pool management in dealer-sourcing. As traffic grows from MVP (10-20 concurrent users) to production (100+ users), the current pool configuration (max 20 connections) must be monitored and adjusted.

## Current Configuration

```yaml
pool:
  max_connections: 20
  idle_timeout_ms: 30000
  connection_timeout_ms: 2000
  current_target: 10-20 concurrent users
```

## Monitoring Metrics

### Primary Metrics

- **Active Connections**: Current connections in use
- **Idle Connections**: Connections in pool but not in use
- **Connection Utilization**: (Active / Max) × 100%
- **Query Count**: Total queries executed
- **Query Error Rate**: (Errors / Total) × 100%
- **Slow Queries**: Queries taking >1000ms
- **Average Query Time**: Mean query execution time

### Health Status Levels

| Status | Condition | Action |
|--------|-----------|--------|
| **Healthy** | <75% utilization, <5% error rate | Monitor |
| **Warning** | 75-90% utilization OR 5-15% error rate | Plan scaling |
| **Critical** | >90% utilization OR >15% error rate | Scale immediately |

## Scaling Thresholds

### Threshold 1: Connection Pool Size

| Level | Active Connections | Error Rate | Action |
|-------|-------------------|-----------|--------|
| **Green** | 0-15 | <3% | Monitor (enough capacity) |
| **Yellow** | 15-18 | 3-8% | Prepare to scale |
| **Red** | 18-20 | >8% | Scale immediately |

**Action**: Increase `max` from 20 to 50

### Threshold 2: Query Performance

| Metric | Threshold | Status | Action |
|--------|-----------|--------|--------|
| Avg Query Time | <200ms | Healthy | Continue |
| Avg Query Time | 200-500ms | Warning | Optimize queries |
| Avg Query Time | >500ms | Critical | Add indexes / optimize |
| Slow Query Rate | <5% | Healthy | Monitor |
| Slow Query Rate | 5-15% | Warning | Investigate bottleneck |
| Slow Query Rate | >15% | Critical | Emergency optimization |

### Threshold 3: Concurrent Users

Based on empirical measurements:

- **Current**: 20 pool size → ~10-20 concurrent users
- **Scale-up 1**: 50 pool size → ~40-60 concurrent users
- **Scale-up 2**: 100 pool size + read replicas → 100+ concurrent users

**Scaling Formula**: `max_pool ≈ concurrent_users × 1.5`

## Scaling Procedure

### Pre-Scaling Checklist

- [ ] Monitor `/api/metrics` for 24 hours
- [ ] Confirm sustained high utilization (not spike)
- [ ] Review slow query logs
- [ ] Verify database CPU/memory not saturated
- [ ] Ensure backup exists (Neon automatic)

### Step 1: Increase Pool Size (Quick Win)

```javascript
// src/config/database.js or api/lib/db.js
const pool = new Pool({
  max: 50,  // Increased from 20
  idleTimeoutMillis: 30000,
});
```

**Impact**: Supports 40-60 concurrent users
**Risk**: Low (configuration change only)
**Time to Deploy**: <1 hour

### Step 2: Optimize Queries (Medium Term)

1. Review slow query log at `/api/metrics`
2. Identify queries with >1000ms execution time
3. Add indexes on frequently filtered columns
4. Update RLS policies for performance

```sql
-- Example: Add index on user_id for faster RLS filtering
CREATE INDEX CONCURRENTLY idx_interested_vehicles_user_id 
ON interested_vehicles(user_id);
```

### Step 3: Connection Pooler (Long Term)

If pool size reaches 100+ and still bottlenecked, consider:

**Option A: PgBouncer** (open source)
```yaml
pgbouncer:
  pool_size: 25
  reserve_pool_size: 5
  mode: transaction  # Share connections between clients
```

**Option B: Neon Built-in Pooler**
- Neon offers 0.5 CPU pooler included
- Automatically manages 500+ connections
- No additional setup needed

### Step 4: Read Replicas (Scaling Tier)

For 100+ concurrent users with heavy reads:

```sql
-- Create read replica (Neon)
CREATE PUBLICATION read_replica FOR TABLE vehicles, interested_vehicles;
-- Replicate to second Postgres instance
```

Route queries:
- **Writes**: Primary database
- **Reads**: Replica database (read-only)

## Monitoring Cadence

| Phase | Interval | Owner | Action |
|-------|----------|-------|--------|
| **MVP** (10-20 users) | Weekly | Dev | Check /api/metrics |
| **Beta** (20-50 users) | Daily | Ops | Alert on Yellow status |
| **Production** (50+ users) | Every 4 hours | Ops | Auto-scale or escalate |

## Monitoring Dashboard

Access metrics at: `GET /api/metrics`

```bash
curl https://dealer-sourcing.vercel.app/api/metrics
```

**Response Format**:
```json
{
  "timestamp": "2026-03-28T10:30:00Z",
  "connection": {
    "active_connections": 12,
    "peak_connections": 18,
    "connection_attempts": 1500,
    "failed_connections": 2,
    "health_status": "healthy"
  },
  "queries": {
    "total_queries": 50000,
    "total_errors": 15,
    "error_rate_percent": 0.03,
    "slow_queries": 120,
    "slow_query_rate_percent": 0.24,
    "average_query_time_ms": 145.50,
    "last_query_time_ms": 234
  },
  "uptime_ms": 86400000,
  "alerts": {
    "high_error_rate": false,
    "slow_queries_detected": false,
    "requires_investigation": false
  }
}
```

## Escalation Path

1. **Metrics show Yellow status**
   - Alert ops team
   - Plan scaling for next sprint
   - Optimize queries in parallel

2. **Metrics show Red status**
   - Immediate scaling: increase `max` from 20→50
   - Deploy within 1 hour
   - Monitor for 24 hours

3. **Multiple Red alerts across 3+ hours**
   - Consider read replicas
   - Emergency meeting with architect
   - Plan for connection pooler

## Performance Targets

| SLA | Target | Consequence |
|-----|--------|-------------|
| **P99 Response Time** | <1000ms | Acceptable latency for users |
| **Error Rate** | <1% | >1% indicates systemic issue |
| **Uptime** | 99.5% | <99.5% triggers incident |

## Estimated Costs

| Scale Tier | Pool Size | Users | Monthly Cost |
|----------|-----------|-------|-------------|
| MVP | 20 | 20 | Neon Free ($0) |
| Beta | 50 | 50 | Neon Growth ($30-50) |
| Production | 100+ | 100+ | Neon Pro ($300+) + PgBouncer if needed |

## Future Improvements

1. **Automatic Scaling**: Use Render/Vercel auto-scaling
2. **Caching Layer**: Add Redis for frequently accessed data
3. **Query Optimization**: Batch requests, denormalize read tables
4. **Circuit Breaker**: Graceful degradation under load

## References

- Monitoring: `/api/metrics` endpoint
- Load Test: `test/load/connection-pool.test.js`
- Database Config: `api/lib/db.js` + `src/config/database.js`
- Neon Docs: https://neon.tech/docs/reference/neon-cli

---

**Owner**: @data-engineer (Dara)
**Last Reviewed**: 2026-03-28
