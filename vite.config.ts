import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isVercel = process.env.VERCEL === "1";
const isNetlify = process.env.NETLIFY === "true";
const nitroPreset = isVercel ? "vercel" : isNetlify ? "netlify" : undefined;

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },
  },
  ...(nitroPreset
    ? {
        nitro: {
          preset: nitroPreset,
        },
      }
    : {}),
});
