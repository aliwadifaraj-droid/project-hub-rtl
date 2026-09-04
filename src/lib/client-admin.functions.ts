import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./auth-middleware.server";
import { deleteUser as deleteUserRow } from "./users.repo";
import * as clientRepo from "./client.repo";

export const adminDeleteClient = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { email: string }) =>
    z.object({ email: z.string().trim().email() }).parse(d))
  .handler(async ({ data }) => {
    const userId = await clientRepo.deleteClientProfileByEmail(data.email);
    if (userId) await deleteUserRow(userId);
    return { ok: true as const };
  });

export const adminToggleClientPush = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { email: string; push_enabled: boolean }) =>
    z.object({ email: z.string().trim().email(), push_enabled: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    await clientRepo.updateClientPushByEmail(data.email, data.push_enabled);
    return { ok: true as const, push_enabled: data.push_enabled };
  });

export const adminToggleAllClientsPush = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { push_enabled: boolean }) =>
    z.object({ push_enabled: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    await clientRepo.updateAllClientsPush(data.push_enabled);
    return { ok: true as const, push_enabled: data.push_enabled };
  });
