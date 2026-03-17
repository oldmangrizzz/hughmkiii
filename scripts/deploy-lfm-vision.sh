#!/bin/bash
# scripts/deploy-lfm-vision.sh
# Target: Engine Node (CT102)
echo "Deploying LFM 2.5 Vision to CT102 (Engine)..."
ssh root@ct102 "docker run -d --name hugh-vision -p 8081:8081 liquidai/lfm-vl-1.6b:latest"
