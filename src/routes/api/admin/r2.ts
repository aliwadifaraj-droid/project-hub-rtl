// GET /api/admin/r2 — returns R2 bucket storage stats for the admin dashboard.
// Uses @aws-sdk/client-s3 to list all objects and compute total size + file count.
// Requires admin session cookie. Does NOT touch image upload code.
import { createFileRoute } from "@tanstack/react-router";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSessionClaims } from "@/lib/auth.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

const QUOTA_MB = 10240; // 10 GB

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export const Route = createFileRoute("/api/admin/r2")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async () => {
        // Auth check — admin only
        const claims = await getSessionClaims();
        if (!claims) return json({ error: "Unauthorized" }, 401);
        if (!claims.roles?.includes("admin")) return json({ error: "Forbidden" }, 403);

        const accessKeyId =
          process.env.R2_ACCESS_KEY_ID ||
          process.env.R2_ACCESS_KEY ||
          process.env.VITE_R2_ACCESS_KEY_ID ||
          process.env.VITE_R2_ACCESS_KEY;
        const secretAccessKey =
          process.env.R2_SECRET_ACCESS_KEY ||
          process.env.R2_SECRET_KEY ||
          process.env.R2_SECRET ||
          process.env.VITE_R2_SECRET_ACCESS_KEY ||
          process.env.VITE_R2_SECRET_KEY;

        if (!accessKeyId || !secretAccessKey) {
          return json({ connected: false, usedMB: 0, quotaMB: QUOTA_MB, fileCount: 0 });
        }

        const bucket =
          process.env.R2_BUCKET ||
          process.env.R2_BUCKET_NAME ||
          process.env.VITE_R2_BUCKET ||
          "turso";
        const endpoint =
          process.env.R2_ENDPOINT ||
          process.env.VITE_R2_ENDPOINT ||
          process.env.R2_S3_ENDPOINT ||
          process.env.VITE_R2_S3_ENDPOINT ||
          (process.env.R2_ACCOUNT_ID ||
          process.env.VITE_R2_ACCOUNT_ID ||
          process.env.CF_ACCOUNT_ID
            ? `https://${process.env.R2_ACCOUNT_ID || process.env.VITE_R2_ACCOUNT_ID || process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`
            : null);

        if (!endpoint) {
          return json({ connected: false, usedMB: 0, quotaMB: QUOTA_MB, fileCount: 0 });
        }

        const client = new S3Client({
          region: "auto",
          endpoint: endpoint.replace(/\/+$/, ""),
          credentials: { accessKeyId, secretAccessKey },
          forcePathStyle: true,
        });

        let totalBytes = 0;
        let fileCount = 0;
        let continuationToken: string | undefined;

        try {
          do {
            const res = await client.send(
              new ListObjectsV2Command({
                Bucket: bucket,
                MaxKeys: 1000,
                ContinuationToken: continuationToken,
              }),
            );
            for (const obj of res.Contents ?? []) {
              totalBytes += obj.Size ?? 0;
              fileCount += 1;
            }
            continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
          } while (continuationToken);
        } catch {
          return json({ connected: false, usedMB: 0, quotaMB: QUOTA_MB, fileCount: 0 });
        }

        const usedMB = totalBytes / (1024 * 1024);

        return json({
          connected: true,
          usedMB: Math.round(usedMB * 100) / 100,
          quotaMB: QUOTA_MB,
          fileCount,
        });
      },
    },
  },
});
