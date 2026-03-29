# Neon PostgreSQL Setup

**Status:** ⏳ Ready to Configure

---

## Step 1: Create Neon Project

1. Go to: **https://neon.tech**
2. Sign in with GitHub
3. Click **"Create New Project"**
4. Choose:
   - Region: `us-east-1` (closest to you)
   - PostgreSQL: `15`
5. Click **"Create Project"**

---

## Step 2: Get Connection String

After project created:
1. Click on the project
2. Go to **"Connection string"** tab
3. Copy the **"Connection string"** (looks like):
   ```
   postgresql://user:password@ep-xxx.us-east-1.neon.tech/dbname?sslmode=require
   ```

---

## Step 3: Create Database Schema

In Neon SQL Editor:

```sql
-- Create interested_vehicles table
CREATE TABLE interested_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vehicle_id TEXT NOT NULL,
  vehicle_data JSONB,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'interested',
  saved_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, vehicle_id)
);

-- Create search_queries table (analytics)
CREATE TABLE search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  query_params JSONB,
  results_count INTEGER,
  searched_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE interested_vehicles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: users can only see their own data
CREATE POLICY user_isolation ON interested_vehicles
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::UUID)
  WITH CHECK (user_id = current_setting('app.current_user_id')::UUID);
```

---

## Step 4: Add to Vercel

1. Go to: **https://vercel.com/dashboard**
2. Click **"dealer-sourcing"** project
3. Go to **Settings → Environment Variables**
4. Add:
   ```
   DATABASE_URL = [paste-neon-connection-string]
   JWT_SECRET = your-secret-key
   VITE_API_URL = https://dealer-sourcing.vercel.app
   ```
5. Click **Save**
6. Vercel auto-redeploys

---

## Done!

- ✅ Neon database created
- ✅ Schema initialized
- ✅ RLS policies enabled
- ✅ Connected to Vercel

Database ready for backend to use!
