#!/bin/bash
set -e

LIGHTHOUSE_USER="root"
LIGHTHOUSE_HOST="43.160.238.74"
DEPLOY_DIR="/root/imopenclawdemo"
SSH="ssh ${LIGHTHOUSE_USER}@${LIGHTHOUSE_HOST}"

echo "==> Building frontend..."
cd "$(dirname "$0")/frontend"
npm run build

echo "==> Compiling backend..."
cd "$(dirname "$0")/backend"
npx tsc

echo "==> Uploading frontend dist..."
ssh "${LIGHTHOUSE_USER}@${LIGHTHOUSE_HOST}" "mkdir -p ${DEPLOY_DIR}/frontend"
scp -r "$(dirname "$0")/frontend/dist" "${LIGHTHOUSE_USER}@${LIGHTHOUSE_HOST}:${DEPLOY_DIR}/frontend/"

echo "==> Uploading backend..."
scp -r \
  "$(dirname "$0")/backend/dist" \
  "$(dirname "$0")/backend/package.json" \
  "$(dirname "$0")/backend/package-lock.json" \
  "$(dirname "$0")/backend/.env" \
  "${LIGHTHOUSE_USER}@${LIGHTHOUSE_HOST}:${DEPLOY_DIR}/backend/"

echo "==> Installing backend dependencies on Lighthouse..."
$SSH "cd ${DEPLOY_DIR}/backend && npm install --omit=dev"

echo "==> Starting backend with pm2..."
$SSH "
  cd ${DEPLOY_DIR}/backend
  # Install pm2 if not present
  which pm2 || npm install -g pm2
  # Restart or start
  pm2 describe imopenclawdemo-backend > /dev/null 2>&1 \
    && pm2 restart imopenclawdemo-backend \
    || pm2 start dist/app.js --name imopenclawdemo-backend
  pm2 save
"

echo "==> Copying frontend to /var/www/..."
$SSH "cp -r ${DEPLOY_DIR}/frontend/dist /var/www/imopenclawdemo && echo 'Frontend copied'"

echo "==> Reloading Nginx..."
$SSH "nginx -t && systemctl reload nginx"

echo ""
echo "✓ Deployed! Visit: http://${LIGHTHOUSE_HOST}"
echo "✓ Remember to update IM Console callback URL to: http://${LIGHTHOUSE_HOST}/api/im/callback"
