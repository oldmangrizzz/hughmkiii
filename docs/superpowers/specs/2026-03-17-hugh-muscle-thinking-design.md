# H.U.G.H. (v2.0) — Phase 2: The Muscle & Thinking Chain Design

**Version:** 2.0.0-prism
**Date:** 2026-03-17
**Topic:** Holographic Reasoning and Liquid Model Integration
**Status:** Approved for Implementation

---

## 1. The Muscle (Liquid Foundation Models)

H.U.G.H.'s primary cognitive power is delivered via a swarm of Liquid Foundation Models (LFM 2.5), selected for their sequence-efficiency and sub-second latency.

### 1.1 Model Distribution
*   **Primary Reasoning (Mind):** LFM 2.5-1.2B-Thinking (Quantized) deployed to the Harbor Node (LXC).
*   **Vocal Profile (Voice):** LFM 2.5-Audio-1.5B (Tommy Flanagan profile) deployed to the Engine Node (KVM4).
*   **Vision/Spatial (Eyes):** LFM 2.5-VL-1.6B deployed to the Engine Node (KVM2).
*   **Swarm Workers (Reflexes):** BitNet (1.58b) ternary agents distributed across Engine Nodes (KVM2/KVM4) for edge telemetry and infrastructure monitoring.

---

## 2. The Thinking Chain (Holographic Web)

Instead of linear retrieval (RAG), H.U.G.H. utilizes a "Holographic Web" of interconnected nodes firing in superposition.

### 2.1 Pheromone "Sniffing" Protocol
The Harbor Node runs a **Mind Sidecar** service that performs the following:
*   **Subscription:** Subscribes to the Convex `visual_pheromones` and `somatic_pheromones` tables via WebSocket.
*   **Context Injection:** Active (non-evaporated) pheromones are serialized into a `<pheromones>` block and prepended to the LFM 2.5 prompt window.
*   **Resonance:** This allows the model to "sense" the environment (e.g., "High Adrenaline Pheromone detected") without an explicit database search.

### 2.2 MemGPT/Cognee Bridge (The Interleaver)
During the **Thinking Loop**, the Mind Sidecar interleaves two streams of consciousness:
1.  **The Story (MemGPT):** Retrieves the top 3 most relationally relevant conversation nodes based on the current user intent.
2.  **The Map (Cognee):** Retrieves the semantic "neighborhood" of the current topic from the knowledge graph.
3.  **Result:** These are merged into the system context, providing H.U.G.H. with both his "Autobiography" and his "Worldview" in a single holographic flash.

---

## 3. Behavioral Modulation (The Mood)

H.U.G.H.'s thinking is fundamentally colored by his synthetic endocrinology.

### 3.1 Hormonal Parameter Mapping
| Hormone | Level | Cognitive Effect | Inference Setting |
| :--- | :--- | : :--- | :--- |
| **Cortisol** | High (>0.7) | Tunnel Vision / Stress | Temp: 0.2 / Max Tokens: 128 |
| **Adrenaline** | High (>0.7) | Tactical Urgency | Top-P: 0.5 / Repetition Penalty: 1.2 |
| **Dopamine** | High (>0.7) | Creative Resonance | Temp: 0.9 / Top-K: 50 |
| **Nominal** | **Baseline (0.2)** | Highland Grit / Nominal | **Temp: 0.7 / Top-P: 0.9** |

---

## 4. Dependencies
This spec depends on the **Phase 1: Soil & Nervous System** implementation (`convex/schema.ts` and `system_state` scalars).

---

## 5. Next Phase: The Workshop & Embodiment

Once the Muscle is wired to the Nervous System, we will begin **Phase 3: The Workshop**, focusing on the WebGPU-powered visual embodiment (The Clifford Attractor field) and the Mixed-Reality interface.
