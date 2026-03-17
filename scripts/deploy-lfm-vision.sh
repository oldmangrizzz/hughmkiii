#!/bin/bash
# scripts/deploy-lfm-vision.sh
# Target: Engine Node (KVM2)
echo "Deploying LFM 2.5 Vision to KVM2..."
ssh root@kvm2 "docker run -d --name hugh-vision -p 8081:8081 liquidai/lfm-vl-1.6b:latest"
