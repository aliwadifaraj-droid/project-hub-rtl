// Upload / sign / delete file server functions.
// Files travel as base64 over the RPC boundary.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware.server";
import { uploadToR2, signGetUrl, deleteFromR2, makeKey } from "./r2";
import { insertFile, getFileById, deleteFileRow, getFileByKey } from "./files.repo";

const uploadSchema = z.object({
  filename: z.string().min(1).max(200),
  mime: z.string().max(200).optional(),
  purpose: z.enum(["project-image", "bid-pdf", "vip-receipt", "other"]).default("other"),
  /** Base64-encoded file bytes. */
  data: z.string().min(1),
});

function b64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/^data:[^;]+;base64,/, "");
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Upload a file: any authenticated user. Returns file id + key. */
export const uploadFile = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => uploadSchema.parse(d))
  .handler(async ({ data, context }) => {
    const bytes = b64ToBytes(data.data);
    if (bytes.length > 20 * 1024 * 1024) throw new Error("الملف أكبر من 20MB");
    const key = makeKey(data.purpose, data.filename);
    await uploadToR2({ key, body: bytes, contentType: data.mime });
    const id = await insertFile({
      r2_key: key,
      filename: data.filename,
      mime: data.mime ?? null,
      size: bytes.length,
      purpose: data.purpose,
      uploaded_by: context.userId,
    });
    return { id, key };
  });

/** Get a short-lived signed URL for a stored file by id or key. */
export const getFileUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      key: z.string().min(1).max(500).optional(),
      expiresIn: z.number().int().min(60).max(60 * 60 * 24 * 7).default(60 * 60),
    }).refine((v) => v.id || v.key, "id or key required").parse(d),
  )
  .handler(async ({ data }) => {
    let key = data.key;
    if (!key && data.id) {
      const row = await getFileById(data.id);
      if (!row) return { url: "" };
      key = row.r2_key;
    }
    if (!key) return { url: "" };
    const url = await signGetUrl(key, data.expiresIn);
    return { url };
  });

/** Delete a file by id (owner or admin). */
export const deleteFile = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const row = await getFileById(data.id);
    if (!row) return { ok: true };
    const isAdmin = context.roles.includes("admin");
    if (!isAdmin && row.uploaded_by !== context.userId) throw new Error("غير مصرح");
    await deleteFromR2(row.r2_key);
    await deleteFileRow(data.id);
    return { ok: true };
  });

export { getFileByKey };
