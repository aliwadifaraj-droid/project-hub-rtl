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
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      ["vip_maintenance", JSON.stringify({ enabled: data.enabled }), new Date().toISOString()],
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
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      ["hide_support_chat", JSON.stringify({ enabled: data.enabled }), new Date().toISOString()],
    );
    return { ok: true, enabled: data.enabled };
  });

export type AgoraSettings = {
  appId: string;
  appCertificate: string;
};

export async function readAgoraSettings(): Promise<AgoraSettings> {
  const result = await db.execute("SELECT value FROM site_settings WHERE key = ? LIMIT 1", ["agora_settings"]);
  const row = rowsToObjects<{ value: string | null }>(result)[0];
  if (!row?.value) return { appId: "", appCertificate: "" };

  try {
    const value = JSON.parse(row.value) as Partial<AgoraSettings>;
    return {
      appId: typeof value.appId === "string" ? value.appId.trim() : "",
      appCertificate: typeof value.appCertificate === "string" ? value.appCertificate.trim() : "",
    };
  } catch {
    return { appId: "", appCertificate: "" };
  }
}

export const getAgoraSettings = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const settings = await readAgoraSettings();
    return {
      appId: settings.appId,
      certificateConfigured: Boolean(settings.appCertificate),
    };
  });

export const setAgoraSettings = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      appId: z.string().trim().max(64),
      appCertificate: z.string().trim().max(128),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const current = await readAgoraSettings();
    const settings = {
      appId: data.appId,
      appCertificate: data.appCertificate || current.appCertificate,
    };
    await db.execute(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      ["agora_settings", JSON.stringify(settings), new Date().toISOString()],
    );
    return {
      ok: true,
      appId: settings.appId,
      certificateConfigured: Boolean(settings.appCertificate),
    };
  });

export const getNotificationsEnabled = createServerFn({ method: "GET" }).handler(async () => {
  const result = await db.execute("SELECT value FROM site_settings WHERE key = ? LIMIT 1", ["notifications_enabled"]);
  const row = rowsToObjects<{ value: string | null }>(result)[0];
  const v = row?.value ? (JSON.parse(row.value) as { enabled?: boolean }) : {};
  return { enabled: v.enabled !== false };
});

export const setNotificationsEnabled = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ enabled: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    await db.execute(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      ["notifications_enabled", JSON.stringify({ enabled: data.enabled }), new Date().toISOString()],
    );
    return { ok: true, enabled: data.enabled };
  });
