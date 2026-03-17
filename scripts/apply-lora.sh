#!/bin/bash
# scripts/apply-lora.sh
# Applies the custom personality training (Highland Grit v3 from Kaggle)
echo "Applying H.U.G.H. Personality LoRA (v3)..."
docker exec hugh-thinking /bin/bash -c "python3 apply_lora.py --base /models --lora /opt/hugh/lora/v3"
