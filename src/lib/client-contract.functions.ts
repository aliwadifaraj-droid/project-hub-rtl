import { createServerFn } from "@tanstack/react-start";
import { getSessionClaims } from "./auth.server";
import { db, rowsToObjects } from "./db";

export const getClientContractDetails = createServerFn({ method: "GET" })
  .handler(async () => {
    const claims = await getSessionClaims();
    if (!claims) throw new Error("يجب تسجيل الدخول");

    const result = await db.execute(
      `SELECT company_name, cr_number, phone
       FROM clients
       WHERE id = ?
       LIMIT 1`,
      [claims.sub],
    );
    const row = rowsToObjects<{
      company_name: string | null;
      cr_number: string | null;
      phone: string | null;
    }>(result)[0];

    return {
      company_name: String(row?.company_name ?? ""),
      cr_number: String(row?.cr_number ?? ""),
      phone: String(row?.phone ?? ""),
    };
  });
