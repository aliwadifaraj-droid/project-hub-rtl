import { createServerFn } from "@tanstack/react-start";
import { requireAuth, requireAdmin } from "./auth-middleware.server";
import * as vipRepo from "./vip.repo";
import { db, rowsToObjects } from "./db";

export const listVipSubscribers = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => vipRepo.listVipSubscribers());

export const approveVipSubscriber = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await vipRepo.updateVipStatus(data.id, "active");
    return { ok: true };
  });

export const rejectVipSubscriber = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await vipRepo.updateVipStatus(data.id, "rejected");
    return { ok: true };
  });

export const listAllProjectVipStatus = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async () => {
    const r = await db.execute(
      `SELECT id AS project_id, exclusive_until FROM projects WHERE exclusive_until IS NOT NULL`,
    );
    return rowsToObjects<{ project_id: string; exclusive_until: string }>(r);
  });

export const adminStopVip = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: { city: string }) => {
    if (!data?.city?.trim()) throw new Error("المدينة مطلوبة");
    return { city: data.city.trim() };
  })
  .handler(async ({ data }) => {
    const count = await vipRepo.stopVipByCity(data.city);
    return { ok: true, count };
  });

export const adminStartVip = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: { city: string; hours: number }) => {
    if (!data?.city?.trim()) throw new Error("المدينة مطلوبة");
    const hours = Number(data.hours);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 720) throw new Error("الساعات غير صالحة");
    return { city: data.city.trim(), hours };
  })
  .handler(async ({ data }) => {
    const count = await vipRepo.startVipByCity(data.city, data.hours);
    return { ok: true, count };
  });

export const adminExtendVip = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: { city: string; hours: number }) => {
    if (!data?.city?.trim()) throw new Error("المدينة مطلوبة");
    const hours = Number(data.hours);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 720) throw new Error("الساعات غير صالحة");
    return { city: data.city.trim(), hours };
  })
  .handler(async ({ data }) => {
    const count = await vipRepo.extendVipByCity(data.city, data.hours);
    return { ok: true, count };
  });
