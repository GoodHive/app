# GoodHive Production Deployment Guide

## Overview

This project uses automated CI/CD with GitHub Actions to deploy to GCP production VM.

## Deployment Methods

### 1. Automatic Deployment (Recommended)

Every push to `main` branch automatically triggers a deployment.

**How it works:**
1. Push code to `main` branch
2. GitHub Actions builds the Next.js app
3. Uploads build to GCP VM
4. Restarts app with PM2
5. Verifies deployment

### 2. Manual Deployment

Use the deployment script for manual deployments:

```bash
./deploy-production.sh
```

## Initial Setup (One-time)

### 1. Set up PM2 on Production Server

SSH into the production server and run the setup script:

```bash
# Upload the setup script
gcloud compute scp scripts/setup-pm2-production.sh goodhive-prod-vm:/tmp/ --zone=europe-west9-b

# SSH into the server
gcloud compute ssh goodhive-prod-vm --zone=europe-west9-b

# Run the setup
bash /tmp/setup-pm2-production.sh
```

### 2. Configure GitHub Actions Secrets

Add the following secrets to your GitHub repository:

1. Go to: Settings → Secrets and variables → Actions → New repository secret

2. Add `GCP_SA_KEY`:
   - Create a service account key with these permissions:
     - Compute Instance Admin (v1)
     - Service Account User
   - Download the JSON key
   - Copy the entire JSON content as the secret value

**Create Service Account:**
```bash
# Create service account
gcloud iam service-accounts create github-actions-deployer \
  --display-name="GitHub Actions Deployer"

# Grant permissions
gcloud projects add-iam-policy-binding goodhive-1706112296263 \
  --member="serviceAccount:github-actions-deployer@goodhive-1706112296263.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"

gcloud projects add-iam-policy-binding goodhive-1706112296263 \
  --member="serviceAccount:github-actions-deployer@goodhive-1706112296263.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create and download key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions-deployer@goodhive-1706112296263.iam.gserviceaccount.com

# Copy content of github-actions-key.json to GitHub secret GCP_SA_KEY
cat github-actions-key.json
```

### 3. Environment Variables on Production

The `.env` file on the production server contains all environment variables.

**Location:** `/home/juhan/goodhive-web/.env`

**To update:**
```bash
# Option 1: Edit directly
gcloud compute ssh goodhive-prod-vm --zone=europe-west9-b
nano /home/juhan/goodhive-web/.env

# Option 2: Copy from local
gcloud compute scp .env.production goodhive-prod-vm:/home/juhan/goodhive-web/.env --zone=europe-west9-b

# Restart after changes
gcloud compute ssh goodhive-prod-vm --zone=europe-west9-b --command="pm2 restart goodhive-web"
```

## PM2 Commands (On Production Server)

```bash
# View status
pm2 status

# View logs
pm2 logs goodhive-web

# Restart
pm2 restart goodhive-web

# Stop
pm2 stop goodhive-web

# View detailed info
pm2 show goodhive-web

# Monitor
pm2 monit
```

## Deployment Workflow

```
┌──────────────┐
│ Push to main │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ GitHub Actions   │
│ - Install deps   │
│ - Build Next.js  │
│ - Create package │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Upload to GCP VM │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Extract & Install│
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Restart with PM2 │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Verify & Done ✅ │
└──────────────────┘
```

## Troubleshooting

### Check deployment logs
```bash
# GitHub Actions logs
Go to: GitHub → Actions → Latest workflow run

# Server logs
gcloud compute ssh goodhive-prod-vm --zone=europe-west9-b --command="pm2 logs goodhive-web --lines 100"
```

### App not starting
```bash
# SSH into server
gcloud compute ssh goodhive-prod-vm --zone=europe-west9-b

# Check PM2 status
pm2 status

# Check logs
pm2 logs goodhive-web

# Manually restart
cd /home/juhan/goodhive-web
pm2 restart ecosystem.config.js
```

### Build failing
- Check GitHub Actions logs
- Verify all environment variables are set
- Ensure dependencies are correct in package.json

## Production URLs

- **Production App:** http://34.155.128.27:3000
- **Domain:** (Configure your domain to point to this IP)

## Next Steps

1. ✅ Set up GitHub Actions secret (`GCP_SA_KEY`)
2. ✅ Run initial PM2 setup on production server
3. ✅ Test deployment by pushing to main
4. 🔲 Set up custom domain with HTTPS
5. 🔲 Configure Nginx reverse proxy (optional)
6. 🔲 Set up monitoring and alerts
