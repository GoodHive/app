#!/bin/bash
# Initial setup script for staging VM

set -e

echo "🚀 Setting up GoodHive Staging VM..."

# Create app directory
echo "📁 Creating app directory..."
mkdir -p /home/juhan/goodhive-web
cd /home/juhan/goodhive-web

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install pnpm if not present
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    sudo npm install -g pnpm
fi

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

echo "✅ Staging VM setup complete!"
echo "📍 App directory: /home/juhan/goodhive-web"
echo "📍 Node version: $(node --version)"
echo "📍 pnpm version: $(pnpm --version)"
echo "📍 PM2 version: $(pm2 --version)"
