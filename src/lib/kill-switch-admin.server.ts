// Compatibility-only no-op admin client.
// The app now uses Turso for data and R2 for files. This object intentionally
// does not import or call any legacy backend client; it only keeps old compat
// middleware from crashing if a leftover `.from()` / `.rpc()` chain is reached.

const emptyResult = { data: null, error: null, count: 0 };

const chainable: any = new Proxy(() => undefined, {
  get(_target, prop) {
    if (prop === "then") return (resolve: (value: typeof emptyResult) => void) => resolve(emptyResult);
    if (prop === Symbol.toPrimitive || prop === "toJSON") return () => undefined;
    return () => chainable;
  },
  apply() {
    return chainable;
  },
});

export const supabaseAdmin: any = new Proxy({}, {
  get() {
    return () => chainable;
  },
});