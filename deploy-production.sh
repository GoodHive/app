#!/bin/bash

# GoodHive Production Deployment Script
# This script builds and deploys the app to GCP production VM

set -e  # Exit on error

echo "🚀 Starting GoodHive Production Deployment..."

# Configuration
VM_NAME="goodhive-prod-vm"
ZONE="europe-west9-b"
APP_DIR="/home/juhan/goodhive-web"
BUILD_DIR=".next"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Building production bundle locally...${NC}"
NODE_OPTIONS='--max-old-space-size=4096' pnpm build

echo -e "${YELLOW}Step 2: Creating deployment package...${NC}"
tar -czf goodhive-build.tar.gz \
  .next \
  public \
  package.json \
  pnpm-lock.yaml \
  ecosystem.config.js \
  next.config.js

echo -e "${YELLOW}Step 3: Uploading to production server...${NC}"
gcloud compute scp goodhive-build.tar.gz $VM_NAME:~/ --zone=$ZONE

echo -e "${YELLOW}Step 4: Deploying on production server...${NC}"
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
  set -e
  cd $APP_DIR

  echo '📦 Extracting build...'
  tar -xzf ~/goodhive-build.tar.gz

  echo '📥 Installing dependencies...'
  pnpm install --prod --frozen-lockfile

  echo '🔄 Restarting application with PM2...'
  pm2 delete goodhive-web 2>/dev/null || true
  pm2 start ecosystem.config.js
  pm2 save

  echo '✅ Deployment complete!'
  pm2 status

  # Cleanup
  rm ~/goodhive-build.tar.gz
"

# Cleanup local build artifact
rm goodhive-build.tar.gz

echo -e "${GREEN}✅ Production deployment completed successfully!${NC}"
echo ""
echo "To view logs: gcloud compute ssh $VM_NAME --zone=$ZONE --command='pm2 logs goodhive-web'"
echo "To check status: gcloud compute ssh $VM_NAME --zone=$ZONE --command='pm2 status'"
