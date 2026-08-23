// COMPAT SHIM: this file used to hold the Supabase-auth middleware.
// It now delegates to the new Turso cookie-based session, keeping a no-op
// `context.supabase` compatibility object so old callers still compile.
// Two operations are intercepted so RBAC checks work off the JWT claims:
//   - `.from("user_roles").select("role").eq("user_id", <id>)`
//   - `.rpc("has_role", { _user_id, _role })`
//
// New code should import `requireAuth` from `@/lib/auth-middleware.server`.
import { createMiddleware } from "@tanstack/react-start";
import { getSessionClaims, type SessionClaims } from "@/lib/auth.server";

const emptyResult = { data: null, error: null, count: 0 };
const chainable: any = new Proxy(() => undefined, {
  get(_target, prop) {
    if (prop === "then") return (resolve: (value: typeof emptyResult) => void) => resolve(emptyResult);
    return () => chainable;
  },
  apply() {
    return chainable;
  },
});
const compatClient: any = new Proxy({}, { get: () => () => chainable });

function makeCompatSupabase(claims: SessionClaims) {
  const rolesRows = claims.roles.map((role) => ({ role }));
  return new Proxy(compatClient, {
    get(target, prop, receiver) {
      if (prop === "from") {
        return (table: string) => {
          if (table === "user_roles") {
            const p = Promise.resolve({ data: rolesRows, error: null });
            return {
              select: () => ({
                eq: () => p,
              }),
            };
          }
          return (target as any).from(table);
        };
      }
      if (prop === "rpc") {
        return (name: string, args?: any) => {
          if (name === "has_role") {
            const has = claims.roles.includes(args?._role);
            return Promise.resolve({ data: has, error: null });
          }
          return (target as any).rpc(name, args);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const claims = await getSessionClaims();
  if (!claims) throw new Error("Unauthorized");
  return next({
    context: {
      supabase: makeCompatSupabase(claims),
      userId: claims.sub,
      claims: { sub: claims.sub, email: claims.email, roles: claims.roles },
    },
  });
});
