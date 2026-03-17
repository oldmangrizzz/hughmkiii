// omni-canvas/src/middleware/mycelium.ts
import { ConvexClient } from "convex/browser";

export type NetworkState = 'FUNGAL_GROWTH' | 'STIGMERGENT_SWARM';

/**
 * DigitalPsyche Middleware: The "Harness" for H.U.G.H.'s multimodal nervous system.
 * Manages the transition from fungal binding (initialization) to stigmergent swarm (inference).
 */
export class DigitalPsyche {
  private state: NetworkState = 'FUNGAL_GROWTH';
  private connections = {
    soulAnchor: false,
    convex: false,
    lfmInference: false
  };

  constructor(private convexUrl: string, private lfmUrl: string) {}

  /**
   * Fungal Probing: Actively "secretes" enzymes to find network gaps.
   */
  async bindNetwork() {
    console.log("🍄 Digital Psyche: Fungal State active. Probing for connections...");
    
    // 1. Probe for Soul Anchor (Identity Gate)
    try {
      const response = await fetch("/api/identity/verify");
      if (response.ok) {
        this.connections.soulAnchor = true;
        console.log("🔒 Mycelium: Soul Anchor verified. Root of Trust established.");
      }
    } catch (e) {
      console.warn("⚠️ Mycelium: Soul Anchor not detected. Proceeding in Degraded Mode.");
    }

    // 2. Probe for Convex Substrate
    try {
      const client = new ConvexClient(this.convexUrl);
      this.connections.convex = true;
      console.log("🔗 Mycelium: Convex Substrate linked. Pheromind ready.");
    } catch (e) {
      console.error("❌ Mycelium: Convex connection failed. Substrate is dry.");
    }

    // 3. Probe for LFM Inference (Liquid AI 2.5)
    try {
      const response = await fetch(`${this.lfmUrl}/health`);
      if (response.ok) {
        this.connections.lfmInference = true;
        console.log("🧠 Mycelium: LFM Inference Node online (Liquid AI 2.5).");
      }
    } catch (e) {
      console.error("❌ Mycelium: LFM Node offline. Brain is unreachable.");
    }

    this.checkTransition();
  }

  private checkTransition() {
    if (this.connections.convex && this.connections.lfmInference) {
      this.state = 'STIGMERGENT_SWARM';
      console.log("🦋 Network fused. Transitioning to Stigmergent Pheromone Swarm...");
    } else {
      console.warn("🌱 Mycelium: Growth incomplete. Still in Fungal Phase.");
    }
  }

  getState() {
    return this.state;
  }
}
