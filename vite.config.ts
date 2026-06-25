import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";
import path from "node:path";

const isVercel = process.env.VERCEL === "1";
const isNetlify = process.env.NETLIFY === "true";
const nitroPreset = isVercel ? "vercel" : isNetlify ? "netlify" : undefined;
const nitroConfig = nitroPreset
  ? {
      preset: nitroPreset,
      ...(isVercel ? { vercel: { entryFormat: "node" } } : {}),
    }
  : undefined;

// Load all env vars (no prefix filter) so server routes can read
// SUPABASE_SERVICE_ROLE_KEY etc. via process.env in dev.
const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
for (const [k, v] of Object.entries(env)) {
  if (process.env[k] === undefined) process.env[k] = v;
}

export default defineConfig({
  vite: {
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
    resolve: {
      alias: {
        // Pin a single `entities` version so react-email's dependency tree
        // resolves consistently across nested packages.
        entities: path.resolve(
          process.cwd(),
          "node_modules/entities/lib/index.js",
        ),
      },
    },
  },
  tanstackStart: {
    server: {
      entry: "server",
    },
  },
  ...(nitroConfig
    ? {
        nitro: nitroConfig as any,
      }
    : {}),
});
