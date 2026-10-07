// Server functions for client approvals (اعتماد العملاء).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./auth-middleware.server";
import {
  createApprovalToken,
  listAllApprovalTokens,
  listAllApprovalReceipts,
  getReceiptWithToken,
  updateReceiptStatus,
  updateTokenPaidAmount,
  getVipBankInfo,
} from "./approvals.repo";
import { listAllClientProfiles } from "./client.repo";
import { findClientByEmail } from "./clients.repo";
import { listAllProjects } from "./projects.repo";

const createTokenSchema = z.object({
  client_id: z.string().min(1),
  client_name: z.string().min(1),
  project_id: z.string().min(1),
  project_name: z.string().min(1),
  total_commission: z.string().min(1),
  allowed_amount: z.string().min(1),
});

export const adminCreateApprovalToken = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => createTokenSchema.parse(d))
  .handler(async ({ data }) => {
    const token = await createApprovalToken(data);
    return token;
  });

export const adminListApprovalTokens = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    return listAllApprovalTokens();
  });

export const adminListApprovalReceipts = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    return listAllApprovalReceipts();
  });

export const adminGetApprovalClients = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const profiles = await listAllClientProfiles();
    return Promise.all(profiles.map(async (p) => {
      const client = await findClientByEmail(p.email);
      return {
        id: client?.id ?? p.user_id,
        name: p.company_name || p.email,
        email: p.email,
      };
    }));
  });

export const adminGetApprovalProjects = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const rows = await listAllProjects();
    return rows.map((p) => ({
      id: p.id,
      name: p.name,
    }));
  });

export const adminGetBankInfo = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const raw = await getVipBankInfo();
    if (!raw) return { iban: "", bank_name: "", account_name: "" };
    try {
      const parsed = JSON.parse(raw);
      return {
        iban: String(parsed.iban ?? ""),
        bank_name: String(parsed.bank_name ?? ""),
        account_name: String(parsed.account_name ?? ""),
      };
    } catch {
      return { iban: "", bank_name: "", account_name: "" };
    }
  });

const approveReceiptSchema = z.object({
  receipt_id: z.string().min(1),
});

export const adminApproveReceipt = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => approveReceiptSchema.parse(d))
  .handler(async ({ data }) => {
    const pair = await getReceiptWithToken(data.receipt_id);
    if (!pair) throw new Error("الإيصال غير موجود");
    const { receipt, token } = pair;
    if (receipt.status !== "pending") throw new Error("تمت معالجة هذا الإيصال مسبقاً");

    const receiptAmount = parseFloat(receipt.amount) || 0;
    const currentPaid = parseFloat(token.paid_amount) || 0;
    const totalCommission = parseFloat(token.total_commission) || 0;
    const newPaid = currentPaid + receiptAmount;
    const newStatus = newPaid >= totalCommission ? "completed" : "active";

    await updateReceiptStatus(receipt.id, "approved");
    await updateTokenPaidAmount(token.id, String(newPaid), newStatus);

    return {
      ok: true,
      new_paid: newPaid,
      total_commission: totalCommission,
      remaining: Math.max(0, totalCommission - newPaid),
      token_status: newStatus,
    };
  });

export const adminRejectReceipt = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => approveReceiptSchema.parse(d))
  .handler(async ({ data }) => {
    await updateReceiptStatus(data.receipt_id, "rejected");
    return { ok: true };
  });
