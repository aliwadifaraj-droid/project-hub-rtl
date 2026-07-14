// New Turso-backed auth middleware for createServerFn.
// Replaces the Supabase-based `requireSupabaseAuth`.
// Provides context: { userId, email, roles, claims }.

import { createMiddleware } from "@tanstack/react-start";
import { getSessionClaims } from "./auth.server";

export const requireAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const claims = await getSessionClaims();
  if (!claims) throw new Error("Unauthorized");
  return next({
    context: {
      userId: claims.sub,
      email: claims.email,
      roles: claims.roles,
      claims,
    },
  });
});

export const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireAuth])
  .server(async ({ next, context }) => {
    if (!context.roles?.includes("admin")) throw new Error("Forbidden");
    return next();
  });
