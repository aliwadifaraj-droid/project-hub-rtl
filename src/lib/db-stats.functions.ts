import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "./auth-middleware.server";
import { db, rowsToObjects } from "./db";

// Free tier default limit (bytes). Adjust if your plan differs.
const DEFAULT_LIMIT_BYTES = 500 * 1024 * 1024; // 500 MB

export const getDatabaseSize = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    let sizeBytes = 0;
    try {
      const pageCount = rowsToObjects<Record<string, unknown>>(await db.execute("PRAGMA page_count"))[0];
      const pageSize = rowsToObjects<Record<string, unknown>>(await db.execute("PRAGMA page_size"))[0];
      const count = Number(Object.values(pageCount ?? {})[0] ?? 0);
      const size = Number(Object.values(pageSize ?? {})[0] ?? 0);
      sizeBytes = Number.isFinite(count * size) ? count * size : 0;
    } catch {
      sizeBytes = 0;
    }
    const limitBytes = DEFAULT_LIMIT_BYTES;
    const sizeMB = sizeBytes / (1024 * 1024);
    const limitMB = limitBytes / (1024 * 1024);
    const percent = limitBytes > 0 ? (sizeBytes / limitBytes) * 100 : 0;
    return { sizeBytes, sizeMB, limitBytes, limitMB, percent };
  });
