import { a as createMiddleware } from "./server-BNqJEEJz.mjs";
import { g as getSessionClaims } from "./db-BSVZwhof.mjs";
const requireAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const claims = await getSessionClaims();
  if (!claims) throw new Error("Unauthorized");
  return next({
    context: {
      userId: claims.sub,
      email: claims.email,
      roles: claims.roles,
      claims
    }
  });
});
const requireAdmin = createMiddleware({ type: "function" }).middleware([requireAuth]).server(async ({ next, context }) => {
  if (!context.roles?.includes("admin")) throw new Error("Forbidden");
  return next();
});
export {
  requireAdmin as a,
  requireAuth as r
};
