#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const home = os.homedir();

const CACHE_PATHS = [
  "~/Library/Caches",
  "~/Library/Logs",
  "~/Library/Safari",
  "~/Library/Application Support/Google/Chrome/Default/Cache",
  "~/Library/Application Support/Google/Chrome/Default/Code Cache",
  "~/Library/Application Support/Google/Chrome/Default/GPUCache",
  "~/Library/Application Support/Firefox/Profiles",
  "~/Library/Containers/com.apple.Safari/Data/Library/Caches",
  "~/Downloads"
];

function expandUser(inputPath) {
  if (inputPath === "~") return home;
  if (inputPath.startsWith("~/")) return path.join(home, inputPath.slice(2));
  return inputPath;
}

function insideHome(inputPath) {
  const resolved = path.resolve(expandUser(inputPath));
  return resolved === home || resolved.startsWith(`${home}${path.sep}`);
}

function isAllowlistedCleanupPath(inputPath) {
  const resolved = path.resolve(expandUser(inputPath));
  return CACHE_PATHS.map(expandUser).some((allowed) => {
    const allowedResolved = path.resolve(allowed);
    return resolved === allowedResolved || resolved.startsWith(`${allowedResolved}${path.sep}`);
  });
}

function assertSafeReadPath(inputPath) {
  const resolved = path.resolve(expandUser(inputPath));
  if (!insideHome(resolved)) {
    throw new Error(`Refusing to inspect paths outside the current home directory: ${resolved}`);
  }
  return resolved;
}

function assertSafeCleanupPath(inputPath) {
  const resolved = assertSafeReadPath(inputPath);
  if (!isAllowlistedCleanupPath(resolved)) {
    throw new Error(`Cleanup is limited to known cache/log/download paths. Refused: ${resolved}`);
  }
  return resolved;
}

function parseDuOutput(stdout) {
  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [sizeKb, ...rest] = line.trim().split(/\s+/);
      const filePath = rest.join(" ");
      return {
        path: filePath,
        sizeKb: Number(sizeKb),
        sizeMb: Math.round((Number(sizeKb) / 1024) * 10) / 10
      };
    });
}

async function pathExists(inputPath) {
  try {
    await fs.access(inputPath);
    return true;
  } catch {
    return false;
  }
}

async function du(paths, depth = 0) {
  const existing = [];
  for (const inputPath of paths) {
    const resolved = assertSafeReadPath(inputPath);
    if (await pathExists(resolved)) existing.push(resolved);
  }

  if (existing.length === 0) return [];

  const args = ["-k"];
  if (depth > 0) args.push("-d", String(depth));
  args.push(...existing);

  const { stdout } = await execFileAsync("/usr/bin/du", args, {
    maxBuffer: 1024 * 1024 * 20
  });
  return parseDuOutput(stdout).sort((a, b) => b.sizeKb - a.sizeKb);
}

async function trashPath(inputPath) {
  const resolved = assertSafeCleanupPath(inputPath);
  if (!(await pathExists(resolved))) {
    return { path: resolved, moved: false, reason: "Path does not exist" };
  }

  const trashDir = path.join(home, ".Trash");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const destination = path.join(trashDir, `${path.basename(resolved)}.${stamp}`);

  await fs.rename(resolved, destination);
  return { path: resolved, moved: true, destination };
}

const server = new McpServer({
  name: "privacy-audit-mcp",
  version: "0.1.0"
});

server.registerTool(
  "system_profile",
  {
    title: "System Profile",
    description: "Return basic, non-secret local system information for cleanup planning.",
    inputSchema: {}
  },
  async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            platform: os.platform(),
            release: os.release(),
            arch: os.arch(),
            hostname: os.hostname(),
            home,
            freeMemoryMb: Math.round(os.freemem() / 1024 / 1024),
            totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024)
          },
          null,
          2
        )
      }
    ]
  })
);

server.registerTool(
  "known_cleanup_locations",
  {
    title: "Known Cleanup Locations",
    description: "List cache, log, browser, and Downloads locations this server can inspect.",
    inputSchema: {}
  },
  async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          CACHE_PATHS.map((p) => ({ path: p, resolvedPath: expandUser(p) })),
          null,
          2
        )
      }
    ]
  })
);

server.registerTool(
  "estimate_cleanup_locations",
  {
    title: "Estimate Cleanup Locations",
    description: "Estimate disk usage for allowlisted cache/log/download locations. Read-only.",
    inputSchema: {
      depth: z.number().int().min(0).max(2).default(0)
    }
  },
  async ({ depth }) => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(await du(CACHE_PATHS, depth), null, 2)
      }
    ]
  })
);

server.registerTool(
  "scan_home_usage",
  {
    title: "Scan Home Usage",
    description: "Read-only disk usage scan for a path inside the current user's home directory.",
    inputSchema: {
      path: z.string().default("~"),
      depth: z.number().int().min(0).max(2).default(1),
      limit: z.number().int().min(1).max(100).default(25)
    }
  },
  async ({ path: inputPath, depth, limit }) => {
    const results = await du([inputPath], depth);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results.slice(0, limit), null, 2)
        }
      ]
    };
  }
);

server.registerTool(
  "cleanup_plan",
  {
    title: "Cleanup Plan",
    description: "Build a human-reviewable cleanup plan. This does not delete anything.",
    inputSchema: {
      paths: z.array(z.string()).optional()
    }
  },
  async ({ paths }) => {
    const targets = paths?.length ? paths : CACHE_PATHS;
    const estimates = await du(targets, 0);
    const plan = {
      mode: "review-only",
      warning: "No files are deleted by this tool. Use move_to_trash only after reviewing each path.",
      candidates: estimates.map((item) => ({
        ...item,
        cleanupAllowed: isAllowlistedCleanupPath(item.path)
      }))
    };

    return {
      content: [{ type: "text", text: JSON.stringify(plan, null, 2) }]
    };
  }
);

server.registerTool(
  "move_to_trash",
  {
    title: "Move To Trash",
    description: "Move explicit allowlisted cache/log/download paths to ~/.Trash. Requires confirm=true.",
    inputSchema: {
      paths: z.array(z.string()).min(1).max(20),
      confirm: z.boolean().default(false)
    }
  },
  async ({ paths, confirm }) => {
    if (!confirm) {
      throw new Error("Refusing to move files without confirm=true.");
    }

    const results = [];
    for (const inputPath of paths) {
      results.push(await trashPath(inputPath));
    }

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
