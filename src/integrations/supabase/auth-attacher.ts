// COMPAT SHIM: bearer-token attacher used to send the Supabase access token
// with every server-fn RPC. Auth is now cookie-based (httpOnly), so the
// browser attaches the session cookie automatically. This middleware is a
// no-op kept only so any leftover imports keep type-checking.
import { createMiddleware } from "@tanstack/react-start";

export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => next(),
);
