#!/bin/bash

# GoodHive Cloud SQL Auth Proxy Startup Script
# This script starts the Cloud SQL Auth Proxy for secure database access
# No more IP whitelisting needed!

echo "🚀 Starting Cloud SQL Auth Proxy for GoodHive..."

# Kill any existing proxy processes
pkill -f cloud_sql_proxy

# Start the proxy in background on port 5433 to avoid conflicts
./cloud_sql_proxy -instances=goodhive-1706112296263:europe-west9:goodhive-prod-db=tcp:5433 &

PROXY_PID=$!
echo "✅ Cloud SQL Auth Proxy started (PID: $PROXY_PID)"
echo "📡 Database accessible at: 127.0.0.1:5433"
echo "🔒 Secure connection via Google Cloud authentication"
echo ""
echo "To stop the proxy: pkill -f cloud_sql_proxy"
echo "To check status: ps aux | grep cloud_sql_proxy"
echo ""
echo "Now you can run: pnpm dev"