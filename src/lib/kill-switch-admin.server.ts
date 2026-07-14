// TEMP kill-switch for supabaseAdmin. `.from(...)` returns empty results.
// Storage/auth-admin pass through so file uploads and auth admin still work.
// Remove once all tables are on Turso.

import { supabaseAdmin as realAdmin } from "@/integrations/supabase/client.server";

const noop = () => {};
const chainable: any = new Proxy(noop, {
  get(_t, prop) {
    if (prop === "then") {
      return (resolve: (v: unknown) => void) =>
        resolve({ data: null, error: null, count: 0 });
    }
    if (prop === Symbol.toPrimitive || prop === "toJSON") return () => undefined;
    return () => chainable;
  },
  apply() {
    return chainable;
  },
});

const wrapped: typeof realAdmin = new Proxy(realAdmin, {
  get(target: any, prop) {
    if (prop === "from") return (_table: string) => chainable;
    return target[prop];
  },
}) as typeof realAdmin;

export const supabaseAdmin = wrapped;
