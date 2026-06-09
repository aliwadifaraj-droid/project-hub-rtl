import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isVercel = process.env.VERCEL === "1";
const isNetlify = process.env.NETLIFY === "true";
const nitroPreset = isVercel ? "vercel" : isNetlify ? "netlify" : undefined;
const nitroConfig = nitroPreset
  ? {
      preset: nitroPreset,
      ...(isVercel ? { vercel: { entryFormat: "node" } } : {}),
    }
  : undefined;

export default defineConfig({
  vite: {
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
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
