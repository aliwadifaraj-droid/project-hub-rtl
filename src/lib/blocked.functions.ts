// Server functions for blocking/unblocking companies (admin only).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./auth-middleware.server";
import * as blockedRepo from "./blocked.repo";
import type { BlockType } from "./blocked.repo";

export const BLOCKED_MESSAGE = "تم حظرك من تقديم الطلبات بسبب مخالفة سياسة استخدام المنصة";

export const adminListBlocked = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => blockedRepo.listBlocked());

export const adminBlockCompany = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      company_name: z.string().trim().max(200).optional().default(""),
      email: z.string().trim().max(255).optional().default(""),
      block_type: z.enum(["email", "company", "both"]).optional().default("both"),
    }).parse(d))
  .handler(async ({ data }) => {
    const companyName = data.company_name || null;
    const email = data.email || null;
    const blockType = data.block_type as BlockType;
    if (!companyName && !email) throw new Error("يرجى تحديد اسم الشركة أو البريد الإلكتروني");
    const id = await blockedRepo.insertBlocked({ company_name: companyName, email, block_type: blockType });
    return { ok: true, id };
  });

export const adminUnblockCompany = createServerFn({ method: "POST" })
.middleware([requireAdmin])
.inputValidator((d: unknown) => z.object({ id: z.union([z.string(), z.number()]) }).parse(d))
.handler(async ({ data }) => {
    try {
      await blockedRepo.removeBlocked(String(data.id?.id ?? data.id));
    const list = await blockedRepo.listBlocked();
    return list;
  } catch (e: any) {
    console.error("adminUnblockCompany error:", e);
    throw new Error(e.message);
    }
  });
