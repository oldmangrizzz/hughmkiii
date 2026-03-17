#!/bin/bash
# scripts/deploy-lfm-audio.sh
# Target: Engine Node (KVM4)
echo "Deploying LFM 2.5 Audio to KVM4..."
ssh root@kvm4 "docker run -d --name hugh-audio -p 8083:8083 liquidai/lfm-audio-1.5b:latest --profile tommy_flanagan"
