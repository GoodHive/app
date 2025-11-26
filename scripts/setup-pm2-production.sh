#!/bin/bash
# Setup script to run on production server

set -e
cd /home/juhan/goodhive-web

echo "🛑 Stopping current dev server..."
pkill -f 'next dev' || true
sleep 2

echo "🏗️  Building production bundle..."
NODE_OPTIONS='--max-old-space-size=4096' pnpm build

echo "🚀 Starting app with PM2..."
pm2 delete goodhive-web 2>/dev/null || true
pm2 start ecosystem.config.js

echo "💾 Saving PM2 configuration..."
pm2 save

echo "🔧 Setting up PM2 to start on boot..."
pm2 startup systemd -u juhan --hp /home/juhan | grep '^sudo' | bash || true

echo "✅ Setup complete! Application status:"
pm2 status

echo ""
echo "📊 Checking application health..."
sleep 3
curl -I http://localhost:3000 || echo "App might still be starting..."
