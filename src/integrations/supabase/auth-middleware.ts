// COMPAT SHIM: this file used to hold the Supabase-auth middleware.
// It now delegates to the new Turso cookie-based session and provides a
// minimal `context.supabase` compatibility surface so existing callers that
// do `context.supabase.from("user_roles")...` or `.rpc("has_role", ...)`
// keep working during the multi-batch migration to Turso.
//
// New code should import `requireAuth` from `@/lib/auth-middleware.server`.
import { createMiddleware } from "@tanstack/react-start";
import { getSessionClaims, type SessionClaims } from "@/lib/auth.server";

function makeCompatSupabase(claims: SessionClaims) {
  const rolesRows = claims.roles.map((role) => ({ role }));
  const rolesResult = Promise.resolve({ data: rolesRows, error: null });

  return {
    from(table: string) {
      if (table === "user_roles") {
        // .select("role").eq("user_id", <id>) → { data: [{role}], error: null }
        return {
          select: () => ({
            eq: () => rolesResult,
          }),
        };
      }
      // Everything else: empty result (kill-switch behavior).
      const empty = Promise.resolve({ data: null, error: null });
      const chain: any = new Proxy(function () {}, {
        get() { return () => chain; },
        apply() { return empty; },
      });
      return chain;
    },
    rpc(name: string, args?: any) {
      if (name === "has_role") {
        const has = claims.roles.includes(args?._role);
        return Promise.resolve({ data: has, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    },
    auth: {
      admin: {
        listUsers: () => Promise.resolve({ data: { users: [] }, error: null }),
        getUserById: () => Promise.resolve({ data: { user: null }, error: null }),
        deleteUser: () => Promise.resolve({ data: null, error: null }),
        updateUserById: () => Promise.resolve({ data: null, error: null }),
        createUser: () => Promise.resolve({ data: { user: null }, error: null }),
      },
    },
    storage: {
      from: () => ({
        createSignedUrl: () => Promise.resolve({ data: { signedUrl: "" }, error: null }),
        upload: () => Promise.resolve({ data: null, error: null }),
        remove: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
  };
}

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const claims = await getSessionClaims();
  if (!claims) throw new Error("Unauthorized");
  return next({
    context: {
      supabase: makeCompatSupabase(claims) as any,
      userId: claims.sub,
      claims: { sub: claims.sub, email: claims.email, roles: claims.roles },
    },
  });
});
