// src/interleaver/bridge.test.ts
import { interleave } from "./bridge";

/**
 * Interleaver Bridge Tests (v2.0 Substrate Edition)
 */

// Mock the generated API module
jest.mock("../../convex/_generated/api", () => ({
  api: {
    pheromones: {
      searchKnowledge: "pheromones:searchKnowledge",
      heartbeatAgent: "pheromones:heartbeatAgent"
    }
  }
}), { virtual: true });

describe("Interleaver Bridge", () => {
  const mockHormones = { cortisol: 0.2, dopamine: 0.2, adrenaline: 0.2 };
  const mockPheromones = [{ type: "visual", intent: "idle", weight: 0.8 }] as any;

  // Mock Convex Client with minimal necessary implementation
  const createMockClient = (results: any[]) => ({
    query: jest.fn().mockResolvedValue(results),
    mutation: jest.fn().mockResolvedValue(true)
  } as any);

  it("should assemble context from the substrate knowledge base", async () => {
    const mockData = [
      { category: 'memory', title: 'User Memory', content: 'Met Architect in 2022' },
      { category: 'fact', title: 'EMS Protocol', content: 'Grit Highland origin' }
    ];
    
    const client = createMockClient(mockData);
    const ctx = await interleave("test query", mockHormones, mockPheromones, client);

    expect(ctx.relationalHistory).toContain("User Memory: Met Architect in 2022");
    expect(ctx.semanticFacts).toContain("EMS Protocol: Grit Highland origin");
    expect(client.query).toHaveBeenCalled();
  });

  it("should partition history and facts correctly", async () => {
    const mockData = [
      { category: 'relational', title: 'History', content: 'Node A' },
      { category: 'graph', title: 'Graph', content: 'Node B' }
    ];

    const client = createMockClient(mockData);
    const ctx = await interleave("test query", mockHormones, mockPheromones, client);

    expect(ctx.relationalHistory).toEqual(["History: Node A"]);
    expect(ctx.semanticFacts).toEqual(["Graph: Node B"]);
  });

  it("should handle substrate failures gracefully", async () => {
    const client = {
      query: jest.fn().mockRejectedValue(new Error("Substrate dry")),
      mutation: jest.fn()
    } as any;

    const ctx = await interleave("test query", mockHormones, mockPheromones, client);

    expect(ctx.relationalHistory).toEqual([]);
    expect(ctx.semanticFacts).toEqual([]);
    expect(ctx.hormones).toEqual(mockHormones);
  });
});
