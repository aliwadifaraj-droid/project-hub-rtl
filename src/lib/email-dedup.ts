import { db, rowsToObjects } from "./db";

export type PanelName =
  | "لوحة التحكم"
  | "لوحة العملاء"
  | "لوحة أصحاب المشاريع"
  | "حراج المعلمين";

export const CROSS_PANEL_MESSAGE =
  "هذا الإيميل مسجل مسبقاً في لوحة {panel}، لا يمكنك التسجيل به في لوحة أخرى، استخدم إيميلاً مختلفاً أو سجل دخول للوحة المسجل بها";

export const SAME_PANEL_MESSAGE = "هذا الإيميل مسجل مسبقاً، سجل دخول";

/**
 * Cleans email with trim + toLowerCase, then searches all four panel tables.
 * Returns the panel name where the email was found, or null if not found.
 */
export async function checkEmailExists(email: string): Promise<PanelName | null> {
  const cleaned = (email ?? "").trim().toLowerCase();
  if (!cleaned) return null;

  const checks: Array<{ sql: string; panel: PanelName }> = [
    { sql: "SELECT 1 FROM users WHERE lower(email) = lower(?) LIMIT 1", panel: "لوحة التحكم" },
    { sql: "SELECT 1 FROM clients WHERE lower(email) = lower(?) LIMIT 1", panel: "لوحة العملاء" },
    { sql: "SELECT 1 FROM project_owners WHERE lower(email) = lower(?) LIMIT 1", panel: "لوحة أصحاب المشاريع" },
    { sql: "SELECT 1 FROM teachers WHERE lower(email) = lower(?) LIMIT 1", panel: "حراج المعلمين" },
  ];

  for (const { sql, panel } of checks) {
    try {
      const result = await db.execute(sql, [cleaned]);
      if (rowsToObjects(result).length > 0) return panel;
    } catch {
      // Table might not exist yet (e.g. ensureOwnerTables not called) — skip
    }
  }

  return null;
}

/**
 * Convenience helper: throws the appropriate error if the email is already
 * registered in any panel. Pass the CURRENT panel name to distinguish
 * same-panel vs cross-panel duplicates.
 */
export async function assertEmailAvailable(
  email: string,
  currentPanel: PanelName,
): Promise<void> {
  const foundPanel = await checkEmailExists(email);
  if (!foundPanel) return;
  if (foundPanel === currentPanel) {
    throw new Error(SAME_PANEL_MESSAGE);
  }
  throw new Error(CROSS_PANEL_MESSAGE.replace("{panel}", foundPanel));
}
