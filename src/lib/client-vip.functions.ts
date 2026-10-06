import { createServerFn } from "@tanstack/react-start";
import { getSessionClaims } from "./auth.server";
import { db, rowsToObjects } from "./db";

type VipStatusRow = {
  status: string;
  expires_at: string | null;
};

export const getClientVipStatus = createServerFn({ method: "GET" }).handler(async () => {
  const claims = await getSessionClaims();
  if (!claims?.email) return { isPremium: false, status: null };

  const result = await db.execute(
    `SELECT status, expires_at
     FROM vip_subscribers
     WHERE lower(trim(email)) = lower(trim(?))
       AND status IN ('pending', 'active', 'approved')
     ORDER BY created_at DESC
     LIMIT 1`,
    [claims.email],
  );
  const row = rowsToObjects<VipStatusRow>(result)[0];
  if (!row) return { isPremium: false, status: null };

  const expired = row.status !== "pending" && row.expires_at
    ? new Date(row.expires_at).getTime() < Date.now()
    : false;

  return { isPremium: !expired, status: row.status };
});
