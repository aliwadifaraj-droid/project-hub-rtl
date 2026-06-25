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

export default defineConfig(({ mode }) => {
  // Load all env vars (including server-only, no prefix filter) so that
  // process.env in server routes can access SUPABASE_SERVICE_ROLE_KEY etc.
  const env = loadEnv(mode ?? "development", process.cwd(), "");
  for (const [k, v] of Object.entries(env)) {
    if (process.env[k] === undefined) process.env[k] = v;
  }

  return {
    vite: {
      envPrefix: ["VITE_", "NEXT_PUBLIC_"],
      resolve: {
        alias: {
          // Force the same `entities` version everywhere so react-email's
          // dependency tree resolves consistently.
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
  };
});
