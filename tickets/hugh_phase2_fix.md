# Ticket: [HUGH-PHASE2-FIX] - Wiring the Psyche & Fixing the Substrate Bridge

## Status: Research Completed
## Phase: Plan

## Description:
The H.U.G.H. system has been partially refactored to use a Convex substrate, but several components are still lagging in "old design" patterns. 
1. The Interleaver Bridge tests are broken because they mock Axios instead of Convex.
2. The Digital Psyche middleware exists but is not integrated into the thinking loop.
3. The LFM chain is missing the "Roger Protocol" (auditable logging).

## Tasks:
- [ ] Fix `src/interleaver/bridge.test.ts` to mock Convex.
- [ ] Integrate `src/middleware/psyche.ts` into `src/sidecar/index.ts`.
- [ ] Update `src/interleaver/bridge.ts` to factor in Hormonal Resonance.
- [ ] Implement "Roger Protocol" logging for pheromone emissions.
