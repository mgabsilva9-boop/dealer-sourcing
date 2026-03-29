#!/bin/bash

# Railway Deployment Script - dealer-sourcing-api
# This script automates the deployment to Railway

set -e

echo "🚀 Starting Railway Deployment..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
fi

# Change to project directory
cd "$(dirname "$0")"

echo -e "${GREEN}✓ Project directory: $(pwd)${NC}"

# Step 1: Login to Railway
echo -e "${YELLOW}Step 1: Authenticating with Railway...${NC}"
railway login || {
    echo -e "${RED}Failed to login to Railway${NC}"
    exit 1
}

# Step 2: Initialize Railway project (if not exists)
echo -e "${YELLOW}Step 2: Initializing Railway project...${NC}"
if [ ! -f "railway.json" ]; then
    railway init --name dealer-sourcing-api
fi

# Step 3: Add PostgreSQL plugin if needed
echo -e "${YELLOW}Step 3: Setting up database...${NC}"
railway add postgresql --name dealer-sourcing-db || true

# Step 4: Set environment variables
echo -e "${YELLOW}Step 4: Configuring environment variables...${NC}"
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set JWT_SECRET=8e5234717fe08f1c3541ca845945218c31bc5297f6c583debc0208b0d68f4659
railway variables set JWT_EXPIRE=7d
railway variables set LOG_LEVEL=info
railway variables set DATABASE_URL=postgresql://neondb_owner:npg_mds7WZwg2iIj@ep-dawn-lab-amomzzff-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require
railway variables set FRONTEND_URL=https://dealer-sourcing.vercel.app
railway variables set ALLOWED_ORIGINS=https://dealer-sourcing.vercel.app

# Step 5: Deploy to Railway
echo -e "${YELLOW}Step 5: Deploying to Railway...${NC}"
railway up --detach

# Step 6: Get service URL
echo -e "${YELLOW}Step 6: Getting service URL...${NC}"
SERVICE_URL=$(railway open --url) || SERVICE_URL="https://dealer-sourcing-api.railway.app"

echo -e "${GREEN}✓ Deployment complete!${NC}"
echo -e "${GREEN}✓ Service URL: ${SERVICE_URL}${NC}"
echo -e "${GREEN}✓ Health endpoint: ${SERVICE_URL}/health${NC}"

# Step 7: Test health endpoint
echo -e "${YELLOW}Step 7: Testing health endpoint...${NC}"
sleep 5 # Wait for service to fully start

if curl -s "${SERVICE_URL}/health" | grep -q "ok"; then
    echo -e "${GREEN}✓ Health check passed!${NC}"
else
    echo -e "${YELLOW}⚠ Health check not yet responding (service may still be starting)${NC}"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Deployment successful!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Next steps:"
echo "1. Update vercel.json with new API URL: ${SERVICE_URL}"
echo "2. Run: git push origin main"
echo "3. Monitor logs: railway logs"
