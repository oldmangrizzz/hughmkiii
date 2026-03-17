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

  constructor(
    private convexUrl: string = import.meta.env.VITE_CONVEX_URL ?? "",
    private lfmUrl: string    = import.meta.env.VITE_LFM_URL ?? ""
  ) {}

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

    // 2. Mycelial Growth: Exponential backoff probing for stable connections
    await this.grow();

    this.checkTransition();
  }

  /**
   * Grow: The fungal expansion phase. Retries with exponential backoff
   * until specific "nutrient" endpoints (LFM, Convex) are found.
   */
  private async grow() {
    const lfmTarget    = this.lfmUrl;
    const convexTarget = this.convexUrl;

    const nutrientProbe = async (url: string | undefined, type: 'lfm' | 'convex', maxRetries = 5) => {
      if (!url) return;
      let delay = 1000;

      for (let i = 0; i < maxRetries; i++) {
        try {
          if (type === 'lfm') {
            const res = await fetch(`${url}/health`);
            if (res.ok) {
              this.connections.lfmInference = true;
              console.log(`🧠 Mycelium: LFM Inference Node online at ${url}.`);
              return;
            }
          } else if (type === 'convex') {
            new ConvexClient(url);
            this.connections.convex = true;
            console.log(`🔗 Mycelium: Convex Substrate linked at ${url}.`);
            return;
          }
        } catch (e) {
          console.warn(`🌱 Mycelium: Growth stalled at ${url}. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
          await new Promise(res => setTimeout(res, delay));
          delay *= 2;
        }
      }
      console.error(`❌ Mycelium: Nutrient at ${url} is unreachable. Root rot detected.`);
    };

    await Promise.all([
      nutrientProbe(lfmTarget, 'lfm'),
      nutrientProbe(convexTarget, 'convex')
    ]);
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
