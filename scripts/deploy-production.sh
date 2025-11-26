#!/usr/bin/env bash
set -euo pipefail

# Defaults can be overridden via env vars without editing the script.
SSH_USER=${SSH_USER:-ubuntu}
PROD_IP=${PROD_IP:-34.155.128.27}
BRANCH=${BRANCH:-main}
REMOTE_PATH=${REMOTE_PATH:-/app/goodhive}
SERVICE_NAME=${SERVICE_NAME:-goodhive-prod}

echo "Deploying branch '${BRANCH}' to ${SERVICE_NAME} on ${PROD_IP}..."

ssh "${SSH_USER}@${PROD_IP}" <<EOF
set -euo pipefail
cd "${REMOTE_PATH}"

echo "Checking out ${BRANCH}..."
git fetch origin
git checkout "${BRANCH}"
git pull origin "${BRANCH}"

echo "Installing dependencies..."
pnpm install --frozen-lockfile

echo "Building application..."
pnpm build

echo "Reloading PM2 process ${SERVICE_NAME}..."
pm2 reload "${SERVICE_NAME}" --update-env || pm2 start pnpm --name "${SERVICE_NAME}" -- start
pm2 save
EOF

echo "Deployment to ${SERVICE_NAME} completed."
