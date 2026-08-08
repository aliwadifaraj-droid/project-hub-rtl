// Simple key/value store for global app settings (Turso).
// Used e.g. for the default "exclusive hours" applied to new exclusive projects.
import { db, rowsToObjects } from "./db";

let _ready: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!_ready) {
    _ready = db
      .execute(
        `CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value TEXT,
          updated_at TEXT
        )`,
      )
      .then(() => undefined)
      .catch(() => undefined);
  }
  return _ready;
}

export async function getSetting(key: string): Promise<string | null> {
  await ensureTable();
  const r = await db.execute(`SELECT value FROM app_settings WHERE key = ? LIMIT 1`, [key]);
  const row = rowsToObjects<any>(r)[0];
  return row ? (row.value ?? null) : null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await ensureTable();
  await db.execute(
    `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, value, new Date().toISOString()],
  );
}

const DEFAULT_EXCLUSIVE_HOURS_KEY = "default_exclusive_hours";
export const FALLBACK_EXCLUSIVE_HOURS = 6;

/** Global default number of exclusive hours for newly-exclusive projects. */
export async function getDefaultExclusiveHours(): Promise<number> {
  const v = await getSetting(DEFAULT_EXCLUSIVE_HOURS_KEY);
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : FALLBACK_EXCLUSIVE_HOURS;
}

export async function setDefaultExclusiveHours(hours: number): Promise<void> {
  const safe = Math.min(240, Math.max(1, Math.floor(hours)));
  await setSetting(DEFAULT_EXCLUSIVE_HOURS_KEY, String(safe));
}
