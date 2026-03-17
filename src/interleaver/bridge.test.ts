// src/interleaver/bridge.test.ts
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { interleave } from "./bridge";

const mock = new MockAdapter(axios);

describe("Interleaver Bridge", () => {
  afterEach(() => {
    mock.reset();
  });

  it("should assemble context from MemGPT and Cognee", async () => {
    mock.onPost(/.*\/search/).reply(200, { results: ["relational node"] });
    mock.onPost(/.*\/explore/).reply(200, { nodes: ["semantic node"] });

    const hormones = { cortisol: 0.2, dopamine: 0.2, adrenaline: 0.2 };
    const ctx = await interleave("test query", hormones, []);

    expect(ctx.relationalHistory).toContain("relational node");
    expect(ctx.semanticFacts).toContain("semantic node");
  });

  it("should handle service failures gracefully", async () => {
    mock.onPost(/.*\/search/).networkError();
    mock.onPost(/.*\/explore/).reply(500);

    const hormones = { cortisol: 0.2, dopamine: 0.2, adrenaline: 0.2 };
    const ctx = await interleave("test query", hormones, []);

    expect(ctx.relationalHistory).toEqual([]);
    expect(ctx.semanticFacts).toEqual([]);
  });
});
