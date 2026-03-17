#!/usr/bin/env bash
# start-portal.sh — Launch H.U.G.H. OmniCanvas PWA on NetBird
#
# Binds backend services to the NetBird interface so the phone can reach them.
#   socat  : Convex substrate (port 3210) — handles TCP + WebSocket upgrades
#   Vite   : serves the PWA + proxies LFM /v1/* → localhost:8081
#
# Usage: bash scripts/start-portal.sh

set -e

NETBIRD_IP="100.98.81.78"
CONVEX_PORT=3210
VITE_PORT=5173

cleanup() {
  echo ""
  echo "🛑 Shutting down portal..."
  [[ -n "$SOCAT_PID" ]] && kill "$SOCAT_PID" 2>/dev/null && echo "  socat stopped"
  exit 0
}
trap cleanup INT TERM

# --- Convex bridge (socat: NetBird → localhost) ---
echo "🔗 Binding Convex to NetBird ($NETBIRD_IP:$CONVEX_PORT → 127.0.0.1:$CONVEX_PORT)..."
socat TCP-LISTEN:$CONVEX_PORT,bind=$NETBIRD_IP,reuseaddr,fork TCP:127.0.0.1:$CONVEX_PORT &
SOCAT_PID=$!
echo "   socat PID: $SOCAT_PID"

# Brief pause to let socat bind
sleep 0.5

# --- Vite dev server (0.0.0.0 so NetBird + localhost both work) ---
echo ""
echo "🌐 Starting OmniCanvas PWA on http://$NETBIRD_IP:$VITE_PORT"
echo "   LFM proxy:  /v1/* → localhost:8081"
echo "   Convex:     $NETBIRD_IP:$CONVEX_PORT (via socat)"
echo ""
echo "📱 On your phone (NetBird connected):"
echo "   http://$NETBIRD_IP:$VITE_PORT"
echo ""

cd /root/omni-canvas
npm run dev -- --host 0.0.0.0 --port $VITE_PORT
