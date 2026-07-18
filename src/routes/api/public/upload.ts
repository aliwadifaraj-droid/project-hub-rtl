// Public server-side upload endpoint. Accepts multipart/form-data,
// uploads the file to Cloudflare R2 using server-side R2 keys, and returns
// { key, url, publicUrl }. Supports images and PDFs. Handles CORS.
import { createFileRoute } from "@tanstack/react-router";
import { uploadToR2, signGetUrl, makeKey, getBucket } from "@/lib/r2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
} as const;

const ALLOWED_MIME = new Set<string>([
  "image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "image/svg+xml",
  "application/pdf",
]);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export const Route = createFileRoute("/api/public/upload")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        try {
          const form = await request.formData();
          const file = form.get("file");
          const purpose = String(form.get("purpose") ?? "other");
          if (!(file instanceof File)) return jsonResponse({ error: "file is required" }, 400);

          const mime = file.type || "application/octet-stream";
          const isImage = mime.startsWith("image/");
          const isPdf = mime === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
          if (!ALLOWED_MIME.has(mime) && !isImage && !isPdf) {
            return jsonResponse({ error: "نوع الملف غير مدعوم" }, 415);
          }
          const maxBytes = isPdf ? 20 * 1024 * 1024 : 10 * 1024 * 1024;
          if (file.size > maxBytes) return jsonResponse({ error: "حجم الملف كبير جداً" }, 413);

          const prefix =
            purpose === "bid-pdf" ? "bids" :
            purpose === "vip-receipt" ? "vip-receipts" :
            purpose === "project-image" ? "project-image" :
            "uploads";
          const key = makeKey(prefix, file.name || "file");
          const bytes = new Uint8Array(await file.arrayBuffer());
          await uploadToR2({ key, body: bytes, contentType: mime });

          const publicBase =
            process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL || "";
          const publicUrl = publicBase
            ? `${publicBase.replace(/\/+$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}`
            : "";
          const signedUrl = await signGetUrl(key, 60 * 60 * 24);

          return jsonResponse({
            ok: true,
            key,
            bucket: getBucket(),
            url: publicUrl || signedUrl,
            publicUrl,
            signedUrl,
            mime,
            size: file.size,
            filename: file.name,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "upload failed";
          return jsonResponse({ error: msg }, 500);
        }
      },
    },
  },
});
