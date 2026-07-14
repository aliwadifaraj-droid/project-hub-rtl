// TEMP kill-switch: short-circuits any `.from(...)` table access on the
// Supabase browser client so Supabase outages / table failures never bubble
// up as 500s. Auth, Storage, RPC pass through to the real client untouched.
// Remove once all tables are on Turso.

import { supabase as realSupabase } from "@/integrations/supabase/client";

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

function wrap<T extends object>(client: T): T {
  return new Proxy(client, {
    get(target: any, prop) {
      if (prop === "from") return (_table: string) => chainable;
      return target[prop];
    },
  }) as T;
}

export const supabase = wrap(realSupabase);
