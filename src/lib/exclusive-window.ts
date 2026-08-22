// Shared exclusivity-window logic: after a project is created or approved,
// check vip_subscribers for the same city and — if any exist — lock the project
// for the number of hours configured in site_settings.exclusive_hours (default 6).
import { db, rowsToObjects } from "./db";

const DEFAULT_HOURS = 6;

async function getExclusiveHours(): Promise<number> {
  try {
    const r = await db.execute(
      `SELECT value FROM site_settings WHERE key = 'exclusive_hours' LIMIT 1`,
    );
    const row = rowsToObjects<{ value: string | null }>(r)[0];
    if (row?.value) {
      const n = Number(JSON.parse(row.value));
      if (Number.isFinite(n) && n > 0) return Math.min(n, 720);
    }
  } catch { /* ignore */ }
  return DEFAULT_HOURS;
}

/**
 * After inserting/approving a project, check vip_subscribers on the same city.
 * If subscribers exist, create a row in `project_vip_windows` and set the
 * project's is_exclusive / exclusive_until / exclusive_hours columns.
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

  await ensureVipWindowsTable();
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO project_vip_windows (id, project_id, locked_from, locked_until)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(project_id) DO UPDATE SET locked_from = excluded.locked_from, locked_until = excluded.locked_until`,
    [id, projectId, now.toISOString(), lockedUntil.toISOString()],
  ).catch(() => undefined);

  const { updateProject } = await import("./projects.repo");
  await updateProject(projectId, {
    is_exclusive: true,
    exclusive_until: lockedUntil.toISOString(),
    exclusive_hours: hours,
  }).catch(() => undefined);
}

// ---------- project_vip_windows table ----------

let _vipWindowsReady: Promise<void> | null = null;
function ensureVipWindowsTable(): Promise<void> {
  if (_vipWindowsReady) return _vipWindowsReady;
  _vipWindowsReady = db.execute(
    `CREATE TABLE IF NOT EXISTS project_vip_windows (
       id           TEXT PRIMARY KEY,
       project_id   TEXT NOT NULL UNIQUE,
       locked_from  TEXT NOT NULL,
       locked_until TEXT NOT NULL,
       created_at   TEXT NOT NULL DEFAULT (datetime('now'))
     )`,
  )
    .then(() => db.execute(`CREATE INDEX IF NOT EXISTS idx_project_vip_windows_project ON project_vip_windows(project_id)`).catch(() => undefined))
    .then(() => undefined)
    .catch(() => undefined);
  return _vipWindowsReady;
}

export async function getVipWindow(projectId: string): Promise<{
  locked_from: string;
  locked_until: string;
} | null> {
  await ensureVipWindowsTable();
  const r = await db.execute(
    `SELECT locked_from, locked_until FROM project_vip_windows WHERE project_id = ? LIMIT 1`,
    [projectId],
  );
  const row = rowsToObjects<{ locked_from: string; locked_until: string }>(r)[0];
  return row
    ? { locked_from: String(row.locked_from), locked_until: String(row.locked_until) }
    : null;
}

export async function setVipWindow(
  projectId: string,
  lockedFrom: string,
  lockedUntil: string,
): Promise<void> {
  await ensureVipWindowsTable();
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO project_vip_windows (id, project_id, locked_from, locked_until)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(project_id) DO UPDATE SET locked_from = excluded.locked_from, locked_until = excluded.locked_until`,
    [id, projectId, lockedFrom, lockedUntil],
  );
}
