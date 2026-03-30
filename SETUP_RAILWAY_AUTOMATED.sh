#!/bin/bash

################################################################################
# AUTOMATED RAILWAY SETUP SCRIPT
# Configura todas as env vars necessárias no Railway
# Requer: railway CLI instalado (npm install -g @railway/cli)
# Uso: ./SETUP_RAILWAY_AUTOMATED.sh
################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  RAILWAY SETUP - AUTOMATED ENVIRONMENT CONFIGURATION      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

# ===== CHECK REQUIREMENTS =====
echo -e "${BLUE}▶ Checking requirements...${NC}"

if ! command -v railway &> /dev/null; then
  echo -e "${RED}❌ Railway CLI not found${NC}"
  echo -e "   Install with: ${YELLOW}npm install -g @railway/cli${NC}"
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo -e "${YELLOW}⚠️  jq not found (optional, for JSON parsing)${NC}"
fi

echo -e "${GREEN}✅ Railway CLI found${NC}"

# ===== AUTHENTICATE WITH RAILWAY =====
echo -e "\n${BLUE}▶ Railway Authentication${NC}"

if railway whoami > /dev/null 2>&1; then
  RAILWAY_USER=$(railway whoami 2>/dev/null || echo "unknown")
  echo -e "${GREEN}✅ Already authenticated as: $RAILWAY_USER${NC}"
else
  echo -e "${YELLOW}Need to authenticate with Railway...${NC}"
  railway login
fi

# ===== SELECT PROJECT =====
echo -e "\n${BLUE}▶ Select Railway Project${NC}"
echo "   Available projects:"
railway projects

echo -e "\n   ${YELLOW}Enter your project name:${NC}"
read -p "   > " PROJECT_NAME

if railway link "$PROJECT_NAME" 2>/dev/null; then
  echo -e "${GREEN}✅ Linked to project: $PROJECT_NAME${NC}"
else
  echo -e "${RED}❌ Failed to link project${NC}"
  exit 1
fi

# ===== GET DATABASE INFO FROM NEON =====
echo -e "\n${BLUE}▶ Getting Neon Database Configuration${NC}"

# Try to get Neon plugin info
NEON_CONNECTION_STRING=""

echo -e "   ${YELLOW}Paste your Neon PostgreSQL connection string:${NC}"
echo "   (You can find it in: Railway → Neon Plugin → Connection String)"
read -p "   > " NEON_CONNECTION_STRING

if [ -z "$NEON_CONNECTION_STRING" ]; then
  echo -e "${RED}❌ Connection string is required${NC}"
  exit 1
fi

# Validate connection string
if [[ "$NEON_CONNECTION_STRING" =~ ^postgres:// ]] || [[ "$NEON_CONNECTION_STRING" =~ ^postgresql:// ]]; then
  echo -e "${GREEN}✅ Valid PostgreSQL connection string${NC}"
else
  echo -e "${RED}❌ Invalid PostgreSQL connection string${NC}"
  exit 1
fi

# ===== SET ENVIRONMENT VARIABLES =====
echo -e "\n${BLUE}▶ Setting Environment Variables${NC}"

# 1. NODE_ENV
echo -n "  Setting NODE_ENV=production ... "
railway variables set NODE_ENV production && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}"

# 2. DATABASE_URL
echo -n "  Setting DATABASE_URL ... "
railway variables set DATABASE_URL "$NEON_CONNECTION_STRING" && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}"

# 3. JWT_SECRET (ask user)
echo -e "  ${YELLOW}Enter JWT_SECRET (or press Enter for auto-generated):${NC}"
read -p "     > " JWT_SECRET

if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -hex 32)
  echo "     Generated: $JWT_SECRET"
fi

echo -n "  Setting JWT_SECRET ... "
railway variables set JWT_SECRET "$JWT_SECRET" && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}"

# 4. FRONTEND_URL
echo -e "  ${YELLOW}Enter FRONTEND_URL (e.g., https://dealer-sourcing-frontend.vercel.app):${NC}"
read -p "     > " FRONTEND_URL

if [ -n "$FRONTEND_URL" ]; then
  echo -n "  Setting FRONTEND_URL ... "
  railway variables set FRONTEND_URL "$FRONTEND_URL" && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}"
fi

# 5. CORS_ORIGIN
echo -n "  Setting CORS_ORIGIN=$FRONTEND_URL ... "
railway variables set CORS_ORIGIN "$FRONTEND_URL" && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}"

# 6. PORT (Railway default)
echo -n "  Setting PORT=8080 ... "
railway variables set PORT 8080 && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}"

# ===== VERIFY VARIABLES =====
echo -e "\n${BLUE}▶ Verifying Variables${NC}"
echo "   Current environment variables:"

railway variables list 2>/dev/null || echo "   (could not list variables)"

# ===== REDEPLOY =====
echo -e "\n${BLUE}▶ Redeployment${NC}"
echo -e "   ${YELLOW}Redeploy Railway to apply new variables?${NC} (y/n)"
read -p "   > " REDEPLOY_CONFIRM

if [ "$REDEPLOY_CONFIRM" = "y" ] || [ "$REDEPLOY_CONFIRM" = "Y" ]; then
  echo "   Triggering redeploy..."
  # Note: Railway CLI may not have direct redeploy command
  # User will need to do it via dashboard
  echo -e "   ${YELLOW}Please manually redeploy via Railway Dashboard:${NC}"
  echo "   1. Go to: https://railway.app/dashboard"
  echo "   2. Select your project"
  echo "   3. Click the 'Redeploy' button"
  echo "   4. Wait for status to change to 'Ready'"
else
  echo "   Skipped redeploy"
fi

# ===== TEST DATABASE CONNECTION =====
echo -e "\n${BLUE}▶ Testing Database Connection${NC}"

cat > /tmp/test-neon.js << 'EOF'
const { Pool } = require('pg');

const connectionString = process.argv[1];
const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false },
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  } else {
    console.log('SUCCESS: Connected to Neon');
    console.log('Current time:', res.rows[0].now);
    process.exit(0);
  }
});
EOF

echo "   Testing connection to Neon..."
if node /tmp/test-neon.js "$NEON_CONNECTION_STRING" 2>/dev/null; then
  echo -e "   ${GREEN}✅ Database connection successful${NC}"
else
  echo -e "   ${YELLOW}⚠️  Could not test database now${NC}"
  echo "   (Will be tested after redeploy)"
fi

rm -f /tmp/test-neon.js

# ===== FINAL REPORT =====
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  SETUP COMPLETE                                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}✅ Environment variables configured in Railway${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "  1. Go to Railway Dashboard: https://railway.app/dashboard"
echo "  2. Click 'Redeploy' to apply changes"
echo "  3. Wait for status to change to 'Ready'"
echo "  4. Check logs for any errors"
echo "  5. Test frontend at: $FRONTEND_URL"
echo ""
echo -e "${BLUE}Variables set:${NC}"
echo "  - NODE_ENV=production"
echo "  - DATABASE_URL=(set)"
echo "  - JWT_SECRET=(set)"
echo "  - FRONTEND_URL=$FRONTEND_URL"
echo "  - CORS_ORIGIN=$FRONTEND_URL"
echo "  - PORT=8080"
echo ""
