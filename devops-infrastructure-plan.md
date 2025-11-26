# GoodHive DevOps Infrastructure Plan

## 🎯 Project Overview

**Application**: GoodHive - Web3 Job Platform
**Domain**: goodhive.io
**Tech Stack**: Next.js, PostgreSQL, Web3 (Thirdweb, Polygon)
**Target Users**: French/EU market
**Current Status**: Migration from Vercel to Google Cloud VMs

## 📊 Current Infrastructure Status

### ✅ Completed Infrastructure
- **Production VM**: `goodhive-prod-vm`
  - Type: `e2-standard-2` (2 vCPU, 8GB RAM)
  - Zone: `europe-west9-b` (Paris)
  - IP: `34.155.107.137`
  - Disk: 50GB SSD
  - Status: ✅ RUNNING

- **Staging VM**: `goodhive-staging-vm`
  - Type: `e2-micro` (0.25 vCPU, 1GB RAM)
  - Zone: `europe-west9-b` (Paris)
  - IP: `34.163.149.168`
  - Disk: 20GB Standard
  - Provisioning: SPOT (70% cheaper)
  - Status: ✅ RUNNING

- **Database**: `goodhive-prod-db`
  - Type: Cloud SQL PostgreSQL 15
  - Instance: `db-f1-micro`
  - Location: `europe-west9` (Paris)
  - Databases:
    - `goodhive-prod-database` (production data)
    - `goodhive-dev-database` (development/dummy data)
  - Status: ✅ RUNNING

## 💰 Budget & Cost Analysis

### Monthly Costs
```yaml
Database (Cloud SQL db-f1-micro): $45/month
Production VM (e2-standard-2): $50/month
Staging VM (e2-micro spot): $3/month
Storage (70GB total): $6/month
Static IPs (when reserved): $6/month

Estimated Total: $110/month
```

### Budget Allocation
- **Available Credits**: $1,800 (Google for Startups)
- **Runtime**: ~16.4 months at $110/month
- **Reserved for Testing**: $300
- **Credit Expiry**: 24 months

## 🚀 Implementation Roadmap

### Phase 1: Network & Security Configuration

#### 1.1 Reserve Static IP Addresses
**Status**: ⏳ PENDING

**Production Static IP**:
```bash
gcloud compute addresses create goodhive-prod-ip \
  --region=europe-west9
```

**Staging Static IP**:
```bash
gcloud compute addresses create goodhive-staging-ip \
  --region=europe-west9
```

#### 1.2 Configure Firewall Rules
**Status**: ⏳ PENDING

**Web Traffic Rules**:
```bash
# HTTP/HTTPS for both environments
gcloud compute firewall-rules create allow-goodhive-web \
  --allow tcp:80,tcp:443 \
  --source-ranges 0.0.0.0/0 \
  --target-tags goodhive-prod,goodhive-staging

# SSH access (restricted to admin IPs)
gcloud compute firewall-rules create allow-goodhive-ssh \
  --allow tcp:22 \
  --source-ranges YOUR_IP/32 \
  --target-tags goodhive-prod,goodhive-staging
```

### Phase 2: CI/CD Pipeline Setup

#### 2.1 Google Cloud Build Integration
**Status**: ⏳ PENDING

**Enable APIs**:
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable container.googleapis.com
```

**GitHub Integration**:
```bash
# Connect GitHub repository
gcloud builds triggers create github \
  --repo-name=GoodHive/app \
  --branch-pattern=^main$ \
  --build-config=cloudbuild.yaml
```

#### 2.2 Create CI/CD Configuration
**Status**: ⏳ PENDING

**File**: `cloudbuild.yaml`
```yaml
steps:
  # Install dependencies
  - name: 'node:18-alpine'
    entrypoint: 'sh'
    args: ['-c', 'npm install -g pnpm && pnpm install']

  # Build application
  - name: 'node:18-alpine'
    entrypoint: 'sh'
    args: ['-c', 'pnpm build']

  # Deploy to staging first
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'bash'
    args: ['deploy-staging.sh']

  # Deploy to production (manual approval)
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'bash'
    args: ['deploy-production.sh']
    waitFor: ['deploy-staging']

options:
  machineType: 'E2_HIGHCPU_8'
  substitution_option: 'ALLOW_LOOSE'
```

### Phase 3: Domain & SSL Configuration

> **Note**: Initial rollout will use the production (`34.155.128.27`) and staging (`34.163.149.168`) IPs directly. DNS and SSL work can be executed later without blocking the remaining phases.

#### 3.1 Google Cloud DNS Setup
**Status**: ⏳ PENDING

**Create DNS Zone**:
```bash
gcloud dns managed-zones create goodhive-zone \
  --description="GoodHive production DNS" \
  --dns-name=goodhive.io
```

**DNS Records**:
```bash
# Production A record
gcloud dns record-sets create goodhive.io. \
  --zone=goodhive-zone \
  --type=A \
  --ttl=300 \
  --rrdatas=PRODUCTION_STATIC_IP

# Staging subdomain
gcloud dns record-sets create staging.goodhive.io. \
  --zone=goodhive-zone \
  --type=A \
  --ttl=300 \
  --rrdatas=STAGING_STATIC_IP
```

#### 3.2 SSL Certificate Configuration
**Status**: ⏳ PENDING

**Let's Encrypt Setup** (on each VM):
```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d goodhive.io -d www.goodhive.io
sudo certbot --nginx -d staging.goodhive.io

# Auto-renewal
sudo systemctl enable certbot.timer
```

### Phase 4: VM Environment Setup

#### 4.1 Production VM Configuration
**VM**: `goodhive-prod-vm` (34.155.107.137)

**Installation Script**:
```bash
#!/bin/bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2
npm install -g pm2

# Install Nginx
sudo apt install nginx -y
sudo systemctl enable nginx

# Install PostgreSQL client
sudo apt install postgresql-client -y

# Configure PM2 startup
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

#### 4.2 Staging VM Configuration
**VM**: `goodhive-staging-vm` (34.163.149.168)
- Same setup as production but with smaller resource allocation
- Configured for development environment variables

### Phase 5: Application Deployment

#### 5.1 Environment Configuration

**Production Environment** (`.env.production`):
```env
NODE_ENV=production
DATABASE_URL=postgres://web3jobfair:PASSWORD@34.155.158.237:5432/goodhive-prod-database
NEXT_PUBLIC_ENVIRONMENT=production
# ... other production configs
```

**Staging Environment** (`.env.staging`):
```env
NODE_ENV=staging
DATABASE_URL=postgres://web3jobfair:PASSWORD@34.155.158.237:5432/goodhive-dev-database
NEXT_PUBLIC_ENVIRONMENT=staging
# ... other staging configs
```

#### 5.2 Deployment Scripts

**Production Deploy** (`deploy-production.sh`):
```bash
#!/bin/bash
set -e

# SSH to production VM
ssh ubuntu@PRODUCTION_STATIC_IP << 'EOF'
  cd /app/goodhive
  git pull origin main
  pnpm install --frozen-lockfile
  pnpm build
  pm2 reload goodhive-prod --update-env
  pm2 save
EOF
```

**Health Check**:
```bash
# Verify deployment
curl -f https://goodhive.io/health || exit 1
```

### Phase 6: Monitoring & Logging

#### 6.1 Google Cloud Operations
**Status**: ⏳ PENDING

**Monitoring Dashboards**:
- VM performance (CPU, Memory, Disk)
- Application metrics
- Database connection health
- SSL certificate expiration

**Alerting Policies**:
- High CPU usage (>80% for 5 min)
- High memory usage (>90% for 5 min)
- Application downtime
- SSL certificate expiration (7 days)

#### 6.2 Application Logging
```bash
# PM2 logs
pm2 logs goodhive-prod

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
```

## 🔧 Testing & Validation

### Pre-Production Checklist
- [ ] Staging deployment working
- [ ] Database connectivity confirmed
- [ ] SSL certificates valid
- [ ] Health checks passing
- [ ] Performance metrics baseline
- [ ] Backup procedures tested

### Go-Live Checklist
- [ ] DNS propagation complete
- [ ] Production deployment successful
- [ ] All services healthy
- [ ] Monitoring alerts configured
- [ ] Rollback plan ready

## 🆘 Rollback Procedures

### Emergency Rollback to Vercel
1. Update DNS to point back to Vercel
2. Revert database connection if needed
3. Monitor for 24 hours
4. Investigate and fix issues

### Application Rollback
```bash
# Rollback to previous version
pm2 list
pm2 reload goodhive-prod --update-env
```

## 📈 Future Optimizations

### Performance Improvements
- [ ] CDN integration for static assets
- [ ] Redis caching layer
- [ ] Database connection pooling
- [ ] Auto-scaling groups

### Cost Optimizations
- [ ] Committed use discounts
- [ ] Preemptible instances for dev/test
- [ ] Storage lifecycle management
- [ ] Resource right-sizing

## 🔐 Security Considerations

### Network Security
- [ ] VPC configuration
- [ ] Private subnets for database
- [ ] Cloud Armor (if needed)
- [ ] Regular security updates

### Application Security
- [ ] Environment variable encryption
- [ ] API rate limiting
- [ ] HTTPS enforcement
- [ ] Regular dependency updates

---

## 📋 Next Immediate Steps

1. **Reserve static IP addresses** for both VMs
2. **Configure firewall rules** for secure access
3. **Set up GitHub integration** with Cloud Build
4. **Create deployment scripts** and test on staging
5. **Configure DNS** and prepare for domain migration

**Estimated Timeline**: 3-4 days for complete implementation
**Risk Level**: Low (can rollback to Vercel anytime)
**Benefits**: Full control, better performance, cost optimization
**Benefits**: Full control, better performance, cost optimization
