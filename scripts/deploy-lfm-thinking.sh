#!/bin/bash
# scripts/deploy-lfm-thinking.sh
# Target: Harbor Node (Local LXC)
# Using DavidAU/LFM2.5-1.2B-Thinking-Claude-4.6-Opus-Heretic-Uncensored-DISTIL
echo "Deploying Primary Reasoning Node (Heretic Uncensored) to Harbor Node..."
docker run -d --name hugh-thinking -p 8080:8080 \
  -e MODEL_ID="DavidAU/LFM2.5-1.2B-Thinking-Claude-4.6-Opus-Heretic-Uncensored-DISTIL" \
  -v /opt/hugh/models:/models \
  liquidai/lfm-1.2b-thinking:latest
