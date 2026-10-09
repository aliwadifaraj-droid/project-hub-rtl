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
  approveTokenWithPaidAmount,
  addApprovalInstallment,
  getVipBankInfo,
} from "./approvals.repo";
import { deleteApprovalToken, deleteApprovalReceipt } from "./approvals.delete";
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
  installments: z.array(z.string().min(1)).optional(),
}).superRefine((data, ctx) => {
  const total = Number(data.total_commission);
  const installments = data.installments?.length ? data.installments : [data.allowed_amount];
  const installmentsTotal = installments.reduce((sum, amount) => sum + Number(amount), 0);
  if (!Number.isFinite(total) || total <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["total_commission"], message: "إجمالي العمولة غير صحيح" });
  }
  if (installments.some((amount) => !Number.isFinite(Number(amount)) || Number(amount) <= 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["installments"], message: "مبالغ الدفعات يجب أن تكون أكبر من صفر" });
  }
  if (data.installments?.length && Math.abs(installmentsTotal - total) > 0.01) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["installments"], message: "مجموع الدفعات يجب أن يساوي إجمالي العمولة" });
  }
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
  .handler(async () => listAllApprovalTokens());

const addInstallmentSchema = z.object({ token_id: z.string().min(1), amount: z.string().min(1) });

export const adminAddApprovalInstallment = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => addInstallmentSchema.parse(d))
  .handler(async ({ data }) => addApprovalInstallment(data.token_id, data.amount));

const deleteApprovalSchema = z.object({ id: z.string().min(1) });

export const adminDeleteApprovalToken = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => deleteApprovalSchema.parse(d))
  .handler(async ({ data }) => {
    await deleteApprovalToken(data.id);
    return { ok: true };
  });

export const adminDeleteApprovalReceipt = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => deleteApprovalSchema.parse(d))
  .handler(async ({ data }) => {
    await deleteApprovalReceipt(data.id);
    return { ok: true };
  });

export const adminListApprovalReceipts = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => listAllApprovalReceipts());

export const adminGetApprovalClients = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const profiles = await listAllClientProfiles();
    return Promise.all(profiles.map(async (p) => {
      const client = await findClientByEmail(p.email);
      return { id: p.id, client_id: client?.id ?? p.user_id, name: p.company_name || p.email, email: p.email };
    }));
  });

export const adminGetApprovalProjects = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => (await listAllProjects()).map((p) => ({ id: p.id, name: p.name })));

export const adminGetBankInfo = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const raw = await getVipBankInfo();
    if (!raw) return { iban: "", bank_name: "", account_name: "" };
    try {
      const parsed = JSON.parse(raw);
      return { iban: String(parsed.iban ?? ""), bank_name: String(parsed.bank_name ?? ""), account_name: String(parsed.account_name ?? "") };
    } catch {
      return { iban: "", bank_name: "", account_name: "" };
    }
  });

const approveReceiptSchema = z.object({ receipt_id: z.string().min(1) });

export const adminApproveReceipt = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => approveReceiptSchema.parse(d))
  .handler(async ({ data }) => {
    const pair = await getReceiptWithToken(data.receipt_id);
    if (!pair) throw new Error("الإيصال غير موجود");
    const { receipt, token } = pair;
    if (receipt.status !== "pending") throw new Error("تمت معالجة هذا الإيصال مسبقاً");
    const receiptAmount = parseFloat(receipt.amount) || 0;
    if (receiptAmount <= 0) throw new Error("مبلغ الإيصال غير صحيح");
    const currentPaid = parseFloat(token.paid_amount) || 0;
    const totalCommission = parseFloat(token.total_commission) || 0;
    const newPaid = currentPaid + receiptAmount;
    if (newPaid > totalCommission + 0.01) throw new Error("مبلغ الإيصالات يتجاوز إجمالي العمولة");
    await updateReceiptStatus(receipt.id, "approved");
    await approveTokenWithPaidAmount(token.id, String(newPaid));
    return { ok: true, project_name: token.project_name, receipt_amount: receiptAmount, new_paid: newPaid, total_commission: totalCommission, remaining: Math.max(0, totalCommission - newPaid), token_status: newPaid >= totalCommission - 0.01 ? "approved" : "active" };
  });

export const adminRejectReceipt = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => approveReceiptSchema.parse(d))
  .handler(async ({ data }) => {
    await updateReceiptStatus(data.receipt_id, "rejected");
    return { ok: true };
  });