#!/usr/bin/env bash
# scripts/deploy-node.sh
# ─────────────────────────────────────────────────────────────────────────────
# H.U.G.H. Full Node Deployment
#
# Grizzly Medicine: Every deployment is a complete sovereign presence.
# Not a shard. Not a client. Not a connection. THE WHOLE MIND.
#
# Usage:
#   ./scripts/deploy-node.sh [NODE_ROLE] [TARGET_HOST]
#
#   NODE_ROLE    : general | coder | home-assistant | kvm | proxmox | mobile
#   TARGET_HOST  : SSH target (user@host). Omit to deploy locally.
#
# Environment (set in .env or export before running):
#   CONVEX_URL           Convex cloud URL (shared substrate)
#   LFM_URL              LFM inference endpoint (local to each node)
#   SOUL_ANCHOR_PUBLIC_KEY  This node's ECDSA public key
#   MEMGPT_URL           MemGPT (kvm4) — optional, falls back gracefully
#   COGNEE_URL           Cognee (kvm2) — optional, falls back gracefully
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

NODE_ROLE="${1:-general}"
TARGET_HOST="${2:-}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_NAME="hugh-${NODE_ROLE}"

echo "⚓ H.U.G.H. Node Deployment"
echo "   Role     : ${NODE_ROLE}"
echo "   Target   : ${TARGET_HOST:-local}"
echo "   Repo     : ${REPO_ROOT}"
echo ""

# ── Remote deployment ──────────────────────────────────────────────────────────
if [[ -n "${TARGET_HOST}" ]]; then
  echo "📦 Bundling and shipping to ${TARGET_HOST}..."

  # Build locally first
  cd "${REPO_ROOT}"
  npm run build

  # rsync the dist, convex generated, package files, and .env
  ssh "${TARGET_HOST}" "mkdir -p /opt/hugh/dist /opt/hugh/convex/_generated /opt/hugh/scripts"
  rsync -az --delete \
    "${REPO_ROOT}/dist/"                  "${TARGET_HOST}:/opt/hugh/dist/" \
    "${REPO_ROOT}/convex/_generated/"     "${TARGET_HOST}:/opt/hugh/convex/_generated/" \
    "${REPO_ROOT}/package.json"           "${TARGET_HOST}:/opt/hugh/" \
    "${REPO_ROOT}/package-lock.json"      "${TARGET_HOST}:/opt/hugh/" \
    "${REPO_ROOT}/scripts/deploy-node.sh" "${TARGET_HOST}:/opt/hugh/scripts/"

  # Copy .env if it exists (never commit this)
  if [[ -f "${REPO_ROOT}/.env" ]]; then
    scp "${REPO_ROOT}/.env" "${TARGET_HOST}:/opt/hugh/.env"
  fi

  # Run remote bootstrap
  ssh "${TARGET_HOST}" bash << REMOTE
    set -euo pipefail
    cd /opt/hugh
    export HUGH_NODE_ID="\$(hostname)"
    export HUGH_NODE_ROLE="${NODE_ROLE}"

    # Install production deps
    npm ci --omit=dev --ignore-scripts 2>/dev/null || npm install --omit=dev --ignore-scripts

    # Start / restart via PM2 (falls back to node if PM2 not installed)
    if command -v pm2 &>/dev/null; then
      pm2 describe "${DEPLOY_NAME}" &>/dev/null \
        && pm2 restart "${DEPLOY_NAME}" \
        || pm2 start dist/sidecar/index.js \
             --name "${DEPLOY_NAME}" \
             --env production \
             --exp-backoff-restart-delay=100
      pm2 save
    else
      echo "⚠️  PM2 not found — running detached with nohup"
      nohup node dist/sidecar/index.js \
        > /var/log/hugh-sidecar.log 2>&1 &
      echo "PID: \$!"
    fi

    echo "✅ H.U.G.H. ${NODE_ROLE} node deployed on \$(hostname)"
REMOTE

  echo ""
  echo "✅ Remote deployment complete: ${TARGET_HOST} is now a sovereign HUGH node."
  exit 0
fi

# ── Local deployment ───────────────────────────────────────────────────────────
echo "🔨 Building locally..."
cd "${REPO_ROOT}"
npm run build

export HUGH_NODE_ID="${HUGH_NODE_ID:-$(hostname)}"
export HUGH_NODE_ROLE="${NODE_ROLE}"

echo "🧠 Starting H.U.G.H. ${NODE_ROLE} node (ID: ${HUGH_NODE_ID})..."

if command -v pm2 &>/dev/null; then
  pm2 describe "${DEPLOY_NAME}" &>/dev/null \
    && pm2 restart "${DEPLOY_NAME}" \
    || pm2 start dist/sidecar/index.js \
         --name "${DEPLOY_NAME}" \
         --env production \
         --exp-backoff-restart-delay=100
  pm2 save
  echo ""
  echo "✅ H.U.G.H. ${NODE_ROLE} node live via PM2 (name: ${DEPLOY_NAME})"
  pm2 logs "${DEPLOY_NAME}" --lines 5
else
  echo "⚠️  PM2 not found — running in foreground (Ctrl+C to stop)"
  node dist/sidecar/index.js
fi
