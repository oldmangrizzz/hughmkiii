#!/bin/bash
# scripts/deploy-lfm-thinking.sh
# Target: Harbor Node (Local LXC)
echo "Deploying Primary Reasoning Node (LFM 2.5-Thinking) to Harbor Node..."
docker run -d --name hugh-thinking -p 8080:8080 liquidai/lfm-1.2b-thinking:latest
