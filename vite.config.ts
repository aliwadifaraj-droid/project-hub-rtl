// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Use TanStack Start's built-in server entry so Nitro adapts the handler
  // to the target preset (Vercel Node serverless), instead of the
  // Cloudflare Workers-style `fetch(request, env, ctx)` wrapper in src/server.ts.
  nitro: {
    preset: "vercel",
  },
});
