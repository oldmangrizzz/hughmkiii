#!/usr/bin/env bash
# start-portal.sh — Launch H.U.G.H. OmniCanvas PWA on NetBird
#
# Convex is on the cloud (admired-goldfish-243.convex.cloud) — phone connects directly.
# Vite serves the PWA and proxies LFM inference (/v1/*) from the SSH tunnel.
#
# Usage: bash scripts/start-portal.sh

set -e

NETBIRD_IP="100.98.81.78"
VITE_PORT=5173

echo "🌐 Starting H.U.G.H. OmniCanvas on NetBird"
echo ""
echo "  Convex : https://admired-goldfish-243.convex.cloud (cloud, direct)"
echo "  LFM    : /v1/* proxied → localhost:8081"
echo ""
echo "📱 On your phone (NetBird connected):"
echo "   http://$NETBIRD_IP:$VITE_PORT"
echo ""

cd /root/omni-canvas
npm run dev -- --host 0.0.0.0 --port $VITE_PORT
