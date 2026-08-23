// Shared exclusivity-window logic for project_exclusive.
import { db } from "./db";
import { setExclusiveWindow } from "./project-exclusive.repo";

const DEFAULT_HOURS = 6;

async function getExclusiveHours(): Promise<number> {
  try {
    const r = await db.execute(
      `SELECT value FROM site_settings WHERE key = 'exclusive_hours' LIMIT 1`,
    );
    const row = r.rows[0] as { value: string | null } | undefined;
    if (row?.value) {
      const n = Number(JSON.parse(row.value));
      if (Number.isFinite(n) && n > 0) return Math.min(n, 720);
    }
  } catch {
    return DEFAULT_HOURS;
  }
  return DEFAULT_HOURS;
}

export async function applyExclusiveWindow(
  projectId: string,
  location: string | null | undefined,
  city?: string | null,
): Promise<void> {
  const { detectCity } = await import("./vip-notify.server");
  const detected = city ?? detectCity(location);
  if (!detected) return;

  const { listActiveByCity } = await import("./vip.repo");
  const subscribers = await listActiveByCity(detected).catch(() => []);
  if (subscribers.length === 0) return;

  const durationHours = await getExclusiveHours();
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + durationHours * 3600000);

  await setExclusiveWindow({
    project_id: projectId,
    vip_start_at: startedAt.toISOString(),
    vip_end_at: expiresAt.toISOString(),
    duration_hours: durationHours,
  });
}
