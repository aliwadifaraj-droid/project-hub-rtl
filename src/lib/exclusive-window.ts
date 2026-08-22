// Shared exclusivity-window logic: after a project is created or approved,
// check vip_subscribers for the same city and — if any exist — lock the project
// for the number of hours configured in site_settings.exclusive_hours (default 6).
import { db } from "./db";

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
  } catch { /* ignore */ }
  return DEFAULT_HOURS;
}

/**
 * After inserting/approving a project, check vip_subscribers on the same city.
 * If subscribers exist, set the project's is_exclusive / exclusive_from /
 * exclusive_until / exclusive_hours columns.
 *
 * @param projectId  The project id (already in the `projects` table).
 * @param location   Free-text location of the project (used to detect the city).
 * @param city       The detected city, or null to auto-detect from location.
 */
export async function applyExclusiveWindow(
  projectId: string,
  location: string | null | undefined,
  city?: string | null,
): Promise<void> {
  const { detectCity } = await import("./vip-notify.server");
  const detected = city ?? detectCity(location);
  if (!detected) return;

  const { listActiveByCity } = await import("./vip.repo");
  const subs = await listActiveByCity(detected).catch(() => []);
  if (subs.length === 0) return;

  const hours = await getExclusiveHours();
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + hours * 3600_000);

  const { updateProject } = await import("./projects.repo");
  await updateProject(projectId, {
    is_exclusive: true,
    exclusive_from: now.toISOString(),
    exclusive_until: lockedUntil.toISOString(),
    exclusive_hours: hours,
  }).catch(() => undefined);
}
