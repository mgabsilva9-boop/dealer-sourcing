# Database Setup Instructions - Garagem

## Quick Start

### 1. Deploy Schema (One-time setup)
```bash
cd /c/Users/renat/ThreeOn/dealer-sourcing
node deploy-schema-final.js
```

This creates:
- 6 tables (dealerships, users, vehicles_cache, interested_vehicles, search_queries, vehicle_validations)
- 2 dealerships (Loja A + Loja B)
- 3 test users with password: `senha123`
- 4 test vehicles

### 2. Validate Deployment
```bash
node test-final-validation.js
```

Should output: `🎉 ALL VALIDATION TESTS PASSED!`

### 3. Test Connection
```bash
node test-db-connection.js
```

Should output: `✅ Connection test PASSED!`

---

## Test Credentials

### User 1 (Loja A Admin)
```
Email: gerente_a@loja-a.com
Password: senha123
Role: admin
Dealership: Loja A - Premium Motors
```

### User 2 (Loja B Admin)
```
Email: gerente_b@loja-b.com
Password: senha123
Role: admin
Dealership: Loja B - Luxury Auto
```

### User 3 (Owner/Admin)
```
Email: owner@garagem.com
Password: senha123
Role: owner
Dealership: Loja A - Premium Motors
```

---

## Database Connection

### Environment Variable
Already set in `.env.production`:
```
DATABASE_URL=postgresql://neondb_owner:npg_mds7WZwg2iIj@ep-dawn-lab-amomzzff.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Direct Connection (psql)
```bash
psql "postgresql://neondb_owner:npg_mds7WZwg2iIj@ep-dawn-lab-amomzzff.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Neon Console
Visit: https://console.neon.tech → Select project → SQL Editor

---

## Common Queries

### Check if tables exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Check users
```sql
SELECT id, email, role, dealership_id FROM users;
```

### Check vehicles
```sql
SELECT vehicle_id, make, model, source, score FROM vehicles_cache;
```

### Test login (as app would do)
```sql
SELECT id, email, role, dealership_id, password 
FROM users 
WHERE email = 'gerente_a@loja-a.com' 
LIMIT 1;
```

### Count all data
```sql
SELECT 
  (SELECT COUNT(*) FROM dealerships) as dealerships,
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM vehicles_cache) as vehicles,
  (SELECT COUNT(*) FROM interested_vehicles) as interested,
  (SELECT COUNT(*) FROM search_queries) as searches,
  (SELECT COUNT(*) FROM vehicle_validations) as validations;
```

---

## Troubleshooting

### Error: "relation 'users' does not exist"
→ Run `node deploy-schema-final.js` to create tables

### Error: "connection timeout"
→ Check DATABASE_URL in .env
→ Check Neon project is active
→ Try: `node test-db-connection.js`

### Error: "password authentication failed"
→ Verify credentials in DATABASE_URL
→ Check Neon console for correct user/password

### Password hash mismatch during login
→ Ensure backend uses bcrypt.compare() for validation
→ Password hash: `$2b$10$SdmJThwT07/kypymfOANYuz3UFv7ZGYcarMm.yaxA0oAjngTHhBXW` = `senha123`

---

## Files Reference

| File | Purpose |
|------|---------|
| `deploy-schema-final.js` | Main deployment script |
| `test-db-connection.js` | Test Neon connection |
| `test-final-validation.js` | Validate all tables & data |
| `test-schema.js` | Deprecated (v3 only) |
| `SCHEMA_FIX_REPORT.md` | Detailed fix report |
| `DB_SETUP_INSTRUCTIONS.md` | This file |

---

## Backend Integration

The backend already has the connection configured in:
- `src/config/database.js` - Pool configuration
- `src/server.js` - Connection test on startup
- `src/routes/auth.js` - Login endpoint using pool

Just make sure `.env.production` is loaded and you're good to go!

---

## Production Deployment

When deploying to production:

1. Update `.env.production` with Neon connection string
2. Run migrations: `node deploy-schema-final.js`
3. Verify: `node test-final-validation.js`
4. Deploy backend to Railway/Render
5. Deploy frontend to Vercel

Backend will automatically connect on startup.

---

Last updated: 2026-03-30
Status: ✅ OPERATIONAL
