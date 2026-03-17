// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "evaporate stale pheromones",
  { seconds: 2 },
  internal.evaporation.sweep
);

crons.interval(
  "homeostatic pulse",
  { minutes: 1 },
  internal.system.pulse
);

export default crons;
