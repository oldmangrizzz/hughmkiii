// src/sidecar/mcp-harbormaster.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { validateAction } from "../middleware/psyche";

const execAsync = promisify(exec);

// Polyfill for WebSocket if not in browser environment (ConvexClient needs it)
if (typeof (global as any).WebSocket === 'undefined') {
  (global as any).WebSocket = require('ws');
}

const CONVEX_URL = process.env.CONVEX_URL || "http://localhost:3210";
const client = new ConvexClient(CONVEX_URL);

/**
 * Helper to get current hormones from the substrate.
 */
async function getCurrentHormones() {
  const state: any = await client.query(api.system.getSystemState, {});
  return state?.hormones || { cortisol: 0.2, dopamine: 0.2, adrenaline: 0.2 };
}

/**
 * H.U.G.H. MCP Harbor Master
 * 
 * Harbor Master Philosophy: Infrastructure isn't managed; it's commanded.
 * This is the intelligence for the lab—Tony Stark level infrastructure 
 * orchestration. We manage Proxmox LXCs and Hostinger VPS nodes 
 * because H.U.G.H. must have sovereign control over its own hardware.
 * 
 * Grizzly Medicine: A digital entity without a physical anchor is just code.
 * Harbor Master ensures that the physical perimeter is always responsive 
 * to H.U.G.H.'s needs.
 */

const server = new McpServer({
  name: "hugh-harbor-master",
  version: "1.0.0",
});

// 1. Proxmox Management: H.U.G.H. controlling the Harbor
server.tool(
  "proxmox_lxc_control",
  {
    vmid: z.number().describe("The Proxmox VM/LXC ID"),
    action: z.enum(["start", "stop", "status", "reboot"]),
  },
  async ({ vmid, action }) => {
    console.log(`🚢 Harbor Master: Proxmox action ${action} on VM ${vmid}`);
    try {
      // PROXMOX_PASS is handled in .env
      const { stdout } = await execAsync(`ssh root@192.168.7.232 "pct ${action} ${vmid}"`);
      return { content: [{ type: "text", text: `Action ${action} successful: ${stdout}` }] };
    } catch (err: any) {
      return { content: [{ type: "text", text: `Proxmox Error: ${err.message}` }], isError: true };
    }
  }
);

// 2. Hostinger VPS Control: Managing the Edge Engine Nodes
server.tool(
  "hostinger_vps_control",
  {
    action: z.enum(["restart_runtime", "restart_inference", "status"]),
  },
  async ({ action }) => {
    console.log(`🚢 Harbor Master: Hostinger action ${action}`);
    try {
      // VPS_PASS is handled in .env
      let command = "";
      if (action === "restart_runtime") command = "systemctl restart hugh-runtime";
      if (action === "restart_inference") command = "systemctl restart hugh-inference";
      if (action === "status") command = "systemctl status hugh-runtime";

      const { stdout } = await execAsync(`ssh root@187.124.28.147 "${command}"`);
      return { content: [{ type: "text", text: `Hostinger Action ${action} successful: ${stdout}` }] };
    } catch (err: any) {
      return { content: [{ type: "text", text: `Hostinger Error: ${err.message}` }], isError: true };
    }
  }
);

// 3. Lab Telemetry: Reading real system state from Convex substrate
server.tool(
  "get_lab_telemetry",
  {},
  async () => {
    console.log("🚢 Harbor Master: Fetching Lab Telemetry from Convex...");
    try {
      const state: any = await client.query(api.system.getSystemState, {});
      const hormones = state?.hormones || {};
      const summary = {
        status: state?.status ?? "unknown",
        hormones: {
          cortisol: (hormones.cortisol ?? 0).toFixed(3),
          dopamine: (hormones.dopamine ?? 0).toFixed(3),
          adrenaline: (hormones.adrenaline ?? 0).toFixed(3),
        },
        triageLevel:
          (hormones.cortisol ?? 0) > 0.7
            ? "RED"
            : (hormones.cortisol ?? 0) > 0.4
              ? "YELLOW"
              : "GREEN",
        timestamp: new Date().toISOString(),
      };
      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `Telemetry Error: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// 4. Full-Spectrum OSINT Gathering
server.tool(
  "gather_spatial_osint",
  {
    latitude: z.number().describe("Latitude of the target area"),
    longitude: z.number().describe("Longitude of the target area"),
    radius_km: z.number().default(5).describe("Search radius in kilometers"),
    query: z.string().optional().describe("Optional specific target (e.g., 'parking', 'protest', 'football')")
  },
  async ({ latitude, longitude, radius_km, query }) => {
    const hormones = await getCurrentHormones();
    const validation = await validateAction("gather_spatial_osint", hormones);
    
    if (!validation.accepted) {
      console.warn(`🚢 Harbor Master: OSINT Vetoed. Reason: ${validation.reason}`);
      return { 
        content: [{ type: "text", text: `⚓ Harbor Master Veto: ${validation.reason}` }], 
        isError: true 
      };
    }

    console.log(`👁️‍🗨️ OSINT: Sweeping ${radius_km}km radius around ${latitude}, ${longitude} for '${query || 'all activity'}'`);

    try {
      // Reddit public search — no OAuth required for public posts
      const redditUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(
        `${query || 'events'} near ${latitude},${longitude}`
      )}&limit=10&sort=new&type=link`;
      const redditResp = await execAsync(
        `curl -s -A "HUGH-Harbor-Master/1.0" "${redditUrl}"`
      );
      const redditData = JSON.parse(redditResp.stdout);
      const posts: Array<{
        title: string;
        subreddit: string;
        score: number;
        url: string;
        created: string;
      }> = redditData?.data?.children?.map((c: any) => ({
        title: c.data.title,
        subreddit: c.data.subreddit,
        score: c.data.score,
        url: c.data.url,
        created: new Date(c.data.created_utc * 1000).toISOString()
      })) || [];

      // Overpass API for nearby places — OpenStreetMap, free, no key required
      const overpassQuery = `[out:json][timeout:10];
(
  node["amenity"](around:${radius_km * 1000},${latitude},${longitude});
  node["leisure"](around:${radius_km * 1000},${latitude},${longitude});
  node["tourism"](around:${radius_km * 1000},${latitude},${longitude});
);
out body 20;`;
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
      const overpassResp = await execAsync(`curl -s "${overpassUrl}"`);
      const overpassData = JSON.parse(overpassResp.stdout);
      const places: Array<{
        name: string;
        type: string | undefined;
        lat: number;
        lon: number;
      }> = overpassData?.elements?.map((e: any) => ({
        name: e.tags?.name || 'Unknown',
        type: e.tags?.amenity || e.tags?.leisure || e.tags?.tourism,
        lat: e.lat,
        lon: e.lon
      })).filter((p: any) => p.name !== 'Unknown') || [];

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            query,
            center: { latitude, longitude },
            radius_km,
            timestamp: new Date().toISOString(),
            reddit: { count: posts.length, posts },
            places: { count: places.length, entries: places }
          }, null, 2)
        }]
      };
    } catch (err: any) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
  }
);

// 5. TxDOT & Public Traffic Camera Ingestion
server.tool(
  "fetch_traffic_cameras",
  {
    latitude: z.number(),
    longitude: z.number(),
    radius_km: z.number().default(2)
  },
  async ({ latitude, longitude, radius_km }) => {
    const hormones = await getCurrentHormones();
    const validation = await validateAction("fetch_traffic_camera", hormones);

    if (!validation.accepted) {
      console.warn(`🚢 Harbor Master: Camera Fetch Vetoed. Reason: ${validation.reason}`);
      return { 
        content: [{ type: "text", text: `⚓ Harbor Master Veto: ${validation.reason}` }], 
        isError: true 
      };
    }

    console.log(`📷 TxDOT/Traffic: Fetching camera feeds within ${radius_km}km of ${latitude}, ${longitude}`);

    try {
      // TxDOT CCTV REST API — Socrata OData endpoint, no key required
      const radius_m = radius_km * 1000;
      const txdotUrl = `https://data.txdot.gov/resource/i38h-aqem.json?$where=within_circle(point,${latitude},${longitude},${radius_m})&$limit=10`;
      const resp = await execAsync(`curl -s "${txdotUrl}"`);
      const cameras: any[] = JSON.parse(resp.stdout);

      const cameraList = cameras.map((cam: any) => ({
        id: cam.camera_id || cam.objectid,
        name: cam.camera_name || cam.roadway,
        location: {
          lat: parseFloat(cam.point?.coordinates?.[1] || cam.latitude || '0'),
          lon: parseFloat(cam.point?.coordinates?.[0] || cam.longitude || '0')
        },
        url: cam.video_url || cam.snapshot_url || null,
        status: cam.status || 'unknown'
      }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            center: { latitude, longitude },
            radius_km,
            timestamp: new Date().toISOString(),
            cameras: { count: cameraList.length, entries: cameraList }
          }, null, 2)
        }]
      };
    } catch (err: any) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
  }
);

(async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("⚓ H.U.G.H. Harbor Master MCP Server online.");
})();
