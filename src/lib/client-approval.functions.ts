import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./auth-middleware.server";
import { db, rowsToObjects } from "./db";
import { resolveStoredFileUrl } from "./storage-url";
import { listAllClientProfiles } from "./client.repo";
import { listAllProjects } from "./projects.repo";

export type ApprovalClient = { id: string; name: string; email: string };
export type ApprovalProject = { id: string; name: string };
export type ApprovalReceipt = {
  id: string;
  client_name: string;
  token: string;
  amount: number;
  ocr_result: string;
  receipt_image: string | null;
  status: string;
};

export const listApprovalOptions = createServerFn({ method: "GET" }).middleware([requireAdmin]).handler(async () => {
  const [clients, projects] = await Promise.all([listAllClientProfiles(), listAllProjects()]);
  return {
    clients: clients.map((client) => ({ id: client.user_id, name: client.company_name || client.email, email: client.email })),
    projects: projects.map((project) => ({ id: project.id, name: project.name })),
  };
});

export const getApprovalBankInfo = createServerFn({ method: "GET" }).middleware([requireAdmin]).handler(async () => {
  const result = await db.execute("SELECT value FROM site_settings WHERE key = ? LIMIT 1", ["vip_bank_info"]);
  const row = rowsToObjects<{ value: string | null }>(result)[0];
  return { value: row?.value ?? "" };
});

const createTokenSchema = z.object({
  client_id: z.string().min(1),
  project_id: z.string().min(1),
  total_commission: z.number().positive(),
  allowed_amount: z.number().positive(),
});

function createApprovalCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return `AOM-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
}

export const createApprovalToken = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: unknown) => createTokenSchema.parse(data))
  .handler(async ({ data }) => {
    const token = createApprovalCode();
    await db.execute(
      `INSERT INTO approval_tokens (id, token, client_id, project_id, total_commission, allowed_amount, paid_amount, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, 'active', datetime('now'))`,
      [crypto.randomUUID(), token, data.client_id, data.project_id, data.total_commission, data.allowed_amount],
    );
    return { token };
  });

export const listApprovalReceipts = createServerFn({ method: "GET" }).middleware([requireAdmin]).handler(async () => {
  const result = await db.execute(
    `SELECT ar.id, ar.amount, ar.ocr_result, ar.receipt_image, ar.status,
            at.token, COALESCE(NULLIF(cp.company_name, ''), cp.email, at.client_id) AS client_name
     FROM approval_receipts ar
     JOIN approval_tokens at ON at.id = ar.approval_token_id
     LEFT JOIN client_profiles cp ON cp.user_id = at.client_id
     ORDER BY ar.created_at DESC`,
  );
  const rows = rowsToObjects<Omit<ApprovalReceipt, "receipt_image"> & { receipt_image: string | null }>(result);
  return Promise.all(rows.map(async (row) => ({ ...row, amount: Number(row.amount ?? 0), receipt_image: row.receipt_image ? await resolveStoredFileUrl(row.receipt_image).catch(() => null) : null })));
});

const approveSchema = z.object({ receipt_id: z.string().min(1) });

export const approveReceipt = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: unknown) => approveSchema.parse(data))
  .handler(async ({ data }) => {
    const result = await db.execute(
      `SELECT ar.amount, ar.status, at.id AS token_id, at.total_commission, at.paid_amount
       FROM approval_receipts ar JOIN approval_tokens at ON at.id = ar.approval_token_id
       WHERE ar.id = ? LIMIT 1`,
      [data.receipt_id],
    );
    const row = rowsToObjects<{ amount: number; status: string; token_id: string; total_commission: number; paid_amount: number }>(result)[0];
    if (!row) throw new Error("الإيصال غير موجود");
    if (row.status === "approved") return { ok: true, status: "approved" };
    const paid = Number(row.paid_amount ?? 0) + Number(row.amount ?? 0);
    const status = paid >= Number(row.total_commission) ? "completed" : "active";
    await db.batch([
      { sql: "UPDATE approval_receipts SET status = 'approved' WHERE id = ? AND status <> 'approved'", args: [data.receipt_id] },
      { sql: "UPDATE approval_tokens SET paid_amount = ?, status = ? WHERE id = ?", args: [paid, status, row.token_id] },
    ]);
    return { ok: true, status, paid_amount: paid };
  });
