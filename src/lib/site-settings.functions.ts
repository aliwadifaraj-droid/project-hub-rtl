import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./auth-middleware.server";
import { db, rowsToObjects } from "./db";

export const getVipMaintenance = createServerFn({ method: "GET" }).handler(async () => {
  const result = await db.execute("SELECT value FROM site_settings WHERE key = ? LIMIT 1", ["vip_maintenance"]);
  const row = rowsToObjects<{ value: string | null }>(result)[0];
  const v = row?.value ? (JSON.parse(row.value) as { enabled?: boolean }) : {};
  return { enabled: !!v.enabled };
});

export const setVipMaintenance = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ enabled: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    await db.execute(
      `INSERT INTO site_settings (id, key, value, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [crypto.randomUUID(), "vip_maintenance", JSON.stringify({ enabled: data.enabled }), new Date().toISOString()],
    );
    return { ok: true, enabled: data.enabled };
  });

export const getHideSupportChat = createServerFn({ method: "GET" }).handler(async () => {
  const result = await db.execute("SELECT value FROM site_settings WHERE key = ? LIMIT 1", ["hide_support_chat"]);
  const row = rowsToObjects<{ value: string | null }>(result)[0];
  const v = row?.value ? (JSON.parse(row.value) as { enabled?: boolean }) : {};
  return { enabled: !!v.enabled };
});

export const setHideSupportChat = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ enabled: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    await db.execute(
      `INSERT INTO site_settings (id, key, value, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [crypto.randomUUID(), "hide_support_chat", JSON.stringify({ enabled: data.enabled }), new Date().toISOString()],
    );
    return { ok: true, enabled: data.enabled };
  });
