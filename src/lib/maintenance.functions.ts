import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "./auth-middleware.server";
import { db, rowsToObjects } from "./db";

export const getMaintenance = createServerFn({ method: "GET" }).handler(async () => {
  const key = "maintenance_mode";
  const result = await db.execute("SELECT value FROM site_settings WHERE key = ? LIMIT 1", [key]);
  const row = rowsToObjects<{ value: string | null }>(result)[0];
  const v = row?.value ? (JSON.parse(row.value) as { enabled?: boolean; endAt?: string | null }) : {};
  let enabled = !!v.enabled;
  const endAt = v.endAt ?? null;

  // Auto-disable when countdown has ended
  if (enabled && endAt) {
    const endMs = new Date(endAt).getTime();
    if (!Number.isNaN(endMs) && endMs <= Date.now()) {
      enabled = false;
      try {
        await db.execute(
          `INSERT INTO site_settings (id, key, value, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
          [crypto.randomUUID(), key, JSON.stringify({ enabled: false, endAt }), new Date().toISOString()],
        );
      } catch {
        // best-effort; still return disabled to the client
      }
    }
  }

  return { enabled, endAt };
});


export const setMaintenance = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { enabled: boolean; endAt: string | null }) => ({
    enabled: !!d?.enabled,
    endAt: d?.endAt ? String(d.endAt) : null,
  }))
  .handler(async ({ data }) => {
    const key = "maintenance_mode";
    const normalizedEndAt = data.enabled && data.endAt && new Date(data.endAt).getTime() <= Date.now()
      ? null
      : data.endAt;
    await db.execute(
      `INSERT INTO site_settings (id, key, value, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [crypto.randomUUID(), key, JSON.stringify({ enabled: data.enabled, endAt: normalizedEndAt }), new Date().toISOString()],
    );
    return { ok: true, enabled: data.enabled, endAt: normalizedEndAt };
  });
