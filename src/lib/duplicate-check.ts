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

export async function existsDuplicateOffer(
  projectId: string | null,
  companyName: string,
  email: string,
): Promise<boolean> {
  await ensureOfferColumns();
  const pid = (projectId ?? "").trim();
  const normCompany = normalizeCompanyName(companyName);
  const normEmail = normalizeEmail(email);

  const notifR = await db.execute(
    `SELECT company_name, email FROM notifications
     WHERE offer_status = 'pending'
       AND COALESCE(project_id, '') = ?
       AND LOWER(TRIM(COALESCE(email,''))) = ?
     LIMIT 50`,
    [pid, normEmail],
  );
  const notifRows = rowsToObjects<{ company_name: string | null; email: string | null }>(notifR);
  for (const r of notifRows) {
    if (normalizeCompanyName(r.company_name ?? "") === normCompany) return true;
  }

  const reqR = await db.execute(
    `SELECT company_name, email FROM project_requests
     WHERE status = 'accepted'
       AND COALESCE(project_id, '') = ?
       AND LOWER(TRIM(COALESCE(email,''))) = ?
     LIMIT 50`,
    [pid, normEmail],
  );
  const reqRows = rowsToObjects<{ company_name: string | null; email: string | null }>(reqR);
  for (const r of reqRows) {
    if (normalizeCompanyName(r.company_name ?? "") === normCompany) return true;
  }

  return false;
}
