// Server functions for blocking/unblocking companies (admin only).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./auth-middleware.server";
import * as blockedRepo from "./blocked.repo";

export const BLOCKED_MESSAGE = "تم حظرك من تقديم الطلبات بسبب مخالفة سياسة استخدام المنصة";

export const adminListBlocked = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => blockedRepo.listBlocked());

export const adminBlockCompany = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      email: z.string().trim().max(255).optional().default(""),
      company_name: z.string().trim().max(200).optional().default(""),
      block_type: z.string().trim().max(100).optional().default("حظر بالبريد والمؤسسة"),
    }).parse(d))
  .handler(async ({ data }) => {
    const email = data.email || "";
    const companyName = data.company_name || "";
    if (!email) throw new Error("البريد الإلكتروني مطلوب");
    if (!companyName) throw new Error("اسم المؤسسة مطلوب");
    const id = await blockedRepo.addBlockedUser({
      email,
      company_name: companyName,
      block_type: data.block_type,
    });
    return { ok: true, id };
  });

export const adminUnblockCompany = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ email: z.string().trim().min(1) }).parse(d))
  .handler(async ({ data }) => {
    await blockedRepo.removeBlockedUser({ email: data.email });
    return { ok: true };
  });
