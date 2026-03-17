#!/bin/bash
# scripts/deploy-bitnet-swarm.sh
# Target: Distributed (KVM2 & KVM4)
echo "Deploying BitNet Swarm Workers to Engine Nodes..."
for host in kvm2 kvm4; do
  echo "Targeting $host..."
  ssh root@$host "docker run -d --name hugh-worker liquidai/bitnet-1.58b:latest"
done
