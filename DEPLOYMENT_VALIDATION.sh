#!/bin/bash

################################################################################
# DEALER SOURCING - DEPLOYMENT VALIDATION SCRIPT
# Técnica de Execução: Validação pré-deploy obrigatória
# Uso: ./DEPLOYMENT_VALIDATION.sh [--stage production|staging|local]
################################################################################

set -e

STAGE=${1:-local}
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  DEALER SOURCING - DEPLOYMENT VALIDATION                   ║${NC}"
echo -e "${BLUE}║  Stage: $STAGE                                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

# ===== CHECKLIST VARIABLES =====
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_TOTAL=0

check() {
  local name=$1
  local cmd=$2
  local required=${3:-true}

  CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
  echo -n "  [$CHECKS_TOTAL] $name ... "

  if eval "$cmd" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    if [ "$required" = "true" ]; then
      echo -e "${RED}❌ FAIL (REQUIRED)${NC}"
      CHECKS_FAILED=$((CHECKS_FAILED + 1))
    else
      echo -e "${YELLOW}⚠️  WARN (optional)${NC}"
    fi
  fi
}

# ===== 1. ENVIRONMENT CHECKS =====
echo -e "${BLUE}▶ 1. ENVIRONMENT CHECKS${NC}"
check "Node.js installed" "node --version" true
check "npm installed" "npm --version" true
check ".git directory exists" "test -d .git" true
check "package.json exists" "test -f package.json" true

# ===== 2. DEPENDENCIES CHECKS =====
echo -e "\n${BLUE}▶ 2. DEPENDENCIES${NC}"
check "node_modules exists" "test -d node_modules" false
check "package-lock.json exists" "test -f package-lock.json" true

if [ ! -d node_modules ]; then
  echo -e "  ${YELLOW}⚠️  Installing dependencies...${NC}"
  npm install --legacy-peer-deps
fi

# ===== 3. ENVIRONMENT VARIABLES =====
echo -e "\n${BLUE}▶ 3. ENVIRONMENT VARIABLES${NC}"

if [ "$STAGE" = "production" ] || [ "$STAGE" = "staging" ]; then
  # Production/Staging env checks
  check "DATABASE_URL in .env.production" "grep -q 'DATABASE_URL' .env.production" true
  check "FRONTEND_URL in .env.production" "grep -q 'FRONTEND_URL' .env.production" true
  check "JWT_SECRET in .env.production" "grep -q 'JWT_SECRET' .env.production" true

  # Load and validate env
  set -a
  source .env.production 2>/dev/null || true
  set +a

  if [ -z "$DATABASE_URL" ]; then
    echo -e "    ${RED}ERROR: DATABASE_URL is empty in .env.production${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
  else
    echo -e "    DATABASE_URL is set (${GREEN}✅${NC})"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  fi
  CHECKS_TOTAL=$((CHECKS_TOTAL + 1))

elif [ "$STAGE" = "local" ]; then
  # Local env checks
  check "DATABASE_URL in .env or .env.local" "grep -q 'DATABASE_URL' .env.local || grep -q 'DATABASE_URL' .env" true

  set -a
  source .env.local 2>/dev/null || source .env 2>/dev/null || true
  set +a
fi

# ===== 4. GIT CHECKS =====
echo -e "\n${BLUE}▶ 4. GIT REPOSITORY${NC}"
check "Git remote origin configured" "git remote -v | grep -q origin" true
check "No uncommitted changes (working tree clean)" "git status --porcelain | wc -l | grep -q '^0$'" false

if ! git status --porcelain | grep -q '^'; then
  echo -e "    ${GREEN}✅ Working tree is clean${NC}"
else
  echo -e "    ${YELLOW}⚠️  Uncommitted changes detected:${NC}"
  git status --short | sed 's/^/       /'
fi

# ===== 5. BUILD CHECKS =====
echo -e "\n${BLUE}▶ 5. BUILD VALIDATION${NC}"

if [ -f vite.config.js ] || [ -f vite.config.ts ]; then
  check "Vite config exists" "test -f vite.config.js || test -f vite.config.ts" true

  echo -e "    ${YELLOW}Testing build (dry-run)...${NC}"
  if npm run build > /dev/null 2>&1; then
    echo -e "    ${GREEN}✅ Build successful${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "    ${RED}❌ Build failed${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
  fi
  CHECKS_TOTAL=$((CHECKS_TOTAL + 1))

  # Check dist folder
  if [ -d dist ]; then
    DIST_SIZE=$(du -sh dist | cut -f1)
    echo -e "    dist folder size: $DIST_SIZE ${GREEN}✅${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "    ${RED}❌ dist folder not found after build${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
  fi
  CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
fi

# ===== 6. DATABASE CHECKS (if DATABASE_URL is set) =====
if [ ! -z "$DATABASE_URL" ]; then
  echo -e "\n${BLUE}▶ 6. DATABASE CONNECTION${NC}"

  # Test connection using node script
  cat > /tmp/test-db.js << 'EOF'
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('DB_ERROR:', err.message);
    process.exit(1);
  } else {
    console.log('DB_OK');
    process.exit(0);
  }
});
EOF

  if node /tmp/test-db.js > /dev/null 2>&1; then
    echo -e "  Database connection... ${GREEN}✅ OK${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "  Database connection... ${RED}❌ FAILED${NC}"
    echo -e "    Check DATABASE_URL and network connectivity"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
  fi
  CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
  rm -f /tmp/test-db.js
fi

# ===== FINAL REPORT =====
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  VALIDATION REPORT                                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "  ${GREEN}✅ Passed: $CHECKS_PASSED${NC}"
echo -e "  ${RED}❌ Failed: $CHECKS_FAILED${NC}"
echo -e "  📊 Total:  $CHECKS_TOTAL\n"

if [ $CHECKS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL CHECKS PASSED - READY FOR DEPLOYMENT${NC}\n"

  # Show next steps
  echo -e "${BLUE}▶ NEXT STEPS:${NC}"
  if [ "$STAGE" = "production" ]; then
    echo "  1. Review git status: git status"
    echo "  2. Commit changes: git commit -m 'feat: description'"
    echo "  3. Push to GitHub: git push origin main"
    echo "  4. Monitor Vercel deploy: https://vercel.com/dashboard"
    echo "  5. Monitor Railway logs: railway logs"
  else
    echo "  1. Run: npm run dev"
    echo "  2. Test locally: http://localhost:5173"
  fi
  exit 0
else
  echo -e "${RED}❌ DEPLOYMENT BLOCKED - FIX FAILED CHECKS BEFORE PROCEEDING${NC}\n"
  echo -e "${YELLOW}Common fixes:${NC}"
  echo "  - .env variables: Check .env.production has all required vars"
  echo "  - DATABASE_URL: Must be a valid PostgreSQL connection string"
  echo "  - Build errors: Run 'npm install' and check for errors"
  echo "  - Git: Commit all changes before deploying"
  exit 1
fi
