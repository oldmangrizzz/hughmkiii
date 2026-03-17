#!/bin/bash
# scripts/deploy-mind-sidecar.sh
# Target: Harbor Node (Local LXC)
echo "Building and Deploying Mind Sidecar..."
npm run build
pm2 start dist/sidecar/index.js --name hugh-mind-sidecar || node dist/sidecar/index.js
