import { db, rowsToObjects } from "./db";
import { ensureOfferColumns } from "./notifications.repo";

export const DUPLICATE_OFFER_MESSAGE = "لم نتمكن من معالجة طلبكم يرجى التواصل مع الدعم الفني";

const COMPANY_PREFIXES = ["مؤسسة", "شركة", "لل", "ل"];

export function normalizeCompanyName(name: string): string {
  let n = (name ?? "").trim().toLowerCase();
  for (const prefix of COMPANY_PREFIXES) {
    if (n.startsWith(prefix)) n = n.slice(prefix.length);
  }
  return n.replace(/\s+/g, "").trim();
}

export function normalizeEmail(email: string): string {
  return (email ?? "").trim().toLowerCase();
}

/**
 * Unified duplicate-offer check across both submission paths (bot + form).
 *
 * - When projectId is provided (form flow), matches notifications by
 *   project_id OR by project_name (so bot offers with null project_id
 *   but the same project name are also caught).
 * - When projectId is null (bot flow), matches by project_name.
 * - Always checks both `notifications` (non-rejected offer_status) and
 *   `project_requests` (non-rejected status).
 * - Match is determined by: same project AND (normalized company name OR email).
 */
export async function existsDuplicateOffer(
  projectId: string | null,
  companyName: string,
  email: string,
  projectName?: string | null,
): Promise<boolean> {
  await ensureOfferColumns();
  const pid = (projectId ?? "").trim();
  const normCompany = normalizeCompanyName(companyName);
  const normEmail = normalizeEmail(email);
  const normProjectName = (projectName ?? "").trim().toLowerCase();

  // --- Check notifications table (all non-rejected offer statuses) ---
  let notifRows: { company_name: string | null; email: string | null; project_name: string | null; project_id: string | null }[];

  if (pid) {
    // Form flow: match by project_id OR by project_name (catches bot offers)
    const notifR = await db.execute(
      `SELECT company_name, email, project_name, project_id FROM notifications
       WHERE offer_status IS NOT NULL
         AND offer_status != 'rejected'
         AND (COALESCE(project_id, '') = ? OR LOWER(TRIM(COALESCE(project_name,''))) = ?)
       LIMIT 200`,
      [pid, normProjectName],
    );
    notifRows = rowsToObjects(notifR);
  } else {
    // Bot flow: no project_id, match by project_name
    const notifR = await db.execute(
      `SELECT company_name, email, project_name, project_id FROM notifications
       WHERE offer_status IS NOT NULL
         AND offer_status != 'rejected'
         AND COALESCE(project_id, '') = ''
         AND LOWER(TRIM(COALESCE(project_name,''))) = ?
       LIMIT 200`,
      [normProjectName],
    );
    notifRows = rowsToObjects(notifR);
  }

  for (const r of notifRows) {
    const rowCompany = normalizeCompanyName(r.company_name ?? "");
    const rowEmail = normalizeEmail(r.email ?? "");
    if (rowCompany === normCompany || rowEmail === normEmail) return true;
  }

  // --- Check project_requests table (all non-rejected statuses) ---
  let reqRows: { company_name: string | null; email: string | null }[];

  if (pid) {
    const reqR = await db.execute(
      `SELECT company_name, email FROM project_requests
       WHERE status != 'rejected'
         AND COALESCE(project_id, '') = ?
       LIMIT 200`,
      [pid],
    );
    reqRows = rowsToObjects(reqR);
  } else {
    // Bot flow: match by company name or email alone (no project_id to match)
    const reqR = await db.execute(
      `SELECT company_name, email FROM project_requests
       WHERE status != 'rejected'
       LIMIT 200`,
    );
    reqRows = rowsToObjects(reqR);
  }

  for (const r of reqRows) {
    const rowCompany = normalizeCompanyName(r.company_name ?? "");
    const rowEmail = normalizeEmail(r.email ?? "");
    if (rowCompany === normCompany || rowEmail === normEmail) return true;
  }

  return false;
}
