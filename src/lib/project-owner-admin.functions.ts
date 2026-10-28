import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, rowsToObjects } from "./db";
import { requireAdmin } from "./auth-middleware.server";

type OwnerWithProfile = {
  id: string;
  email: string;
  company_name: string;
  phone: string;
  city: string;
  bio: string;
  created_at: string;
  banned: number;
};

async function ensureBannedColumn(): Promise<void> {
  await db.execute(
    `ALTER TABLE project_owners ADD COLUMN banned INTEGER NOT NULL DEFAULT 0`,
  ).catch(() => {});
}

export const adminListProjectOwners = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    await ensureBannedColumn();
    const result = await db.execute(
      `SELECT po.id, po.email, po.created_at, po.banned,
              COALESCE(pop.company_name, '') AS company_name,
              COALESCE(pop.phone, '') AS phone,
              COALESCE(pop.city, '') AS city,
              COALESCE(pop.bio, '') AS bio
       FROM project_owners po
       LEFT JOIN project_owner_profiles pop ON pop.owner_id = po.id
       ORDER BY po.created_at DESC`,
    );
    return rowsToObjects<OwnerWithProfile>(result).map((r) => ({
      id: String(r.id),
      email: String(r.email ?? ""),
      company_name: String(r.company_name ?? ""),
      phone: String(r.phone ?? ""),
      city: String(r.city ?? ""),
      bio: String(r.bio ?? ""),
      created_at: String(r.created_at ?? ""),
      banned: Number(r.banned ?? 0),
    }));
  });

export const adminToggleBanProjectOwner = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(
    (d: { owner_id: string; banned: boolean }) =>
      z.object({ owner_id: z.string().min(1), banned: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    await ensureBannedColumn();
    await db.execute(
      `UPDATE project_owners SET banned = ? WHERE id = ?`,
      [data.banned ? 1 : 0, data.owner_id],
    );
    if (data.banned) {
      await db.execute(
        `UPDATE project_owner_sessions SET revoked_at = ? WHERE owner_id = ? AND revoked_at IS NULL`,
        [new Date().toISOString(), data.owner_id],
      ).catch(() => {});
    }
    return { ok: true as const };
  });

export const adminDeleteProjectOwner = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(
    (d: { owner_id: string }) =>
      z.object({ owner_id: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    await db.execute(`DELETE FROM project_owner_sessions WHERE owner_id = ?`, [data.owner_id]).catch(() => {});
    await db.execute(`DELETE FROM project_owner_profiles WHERE owner_id = ?`, [data.owner_id]).catch(() => {});
    await db.execute(`DELETE FROM project_owners WHERE id = ?`, [data.owner_id]);
    return { ok: true as const };
  });
