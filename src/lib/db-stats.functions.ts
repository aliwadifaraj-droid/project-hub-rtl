import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "./auth-middleware.server";
import { db, rowsToObjects } from "./db";

// Free tier default limit (bytes). Adjust if your plan differs.
const DEFAULT_LIMIT_BYTES = 500 * 1024 * 1024; // 500 MB

export const getDatabaseSize = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    let sizeBytes = 0;
    try {
      const pageCount = rowsToObjects<Record<string, unknown>>(await db.execute("PRAGMA page_count"))[0];
      const pageSize = rowsToObjects<Record<string, unknown>>(await db.execute("PRAGMA page_size"))[0];
      const count = Number(Object.values(pageCount ?? {})[0] ?? 0);
      const size = Number(Object.values(pageSize ?? {})[0] ?? 0);
      sizeBytes = Number.isFinite(count * size) ? count * size : 0;
    } catch {
      sizeBytes = 0;
    }
    const limitBytes = DEFAULT_LIMIT_BYTES;
    const sizeMB = sizeBytes / (1024 * 1024);
    const limitMB = limitBytes / (1024 * 1024);
    const percent = limitBytes > 0 ? (sizeBytes / limitBytes) * 100 : 0;

    let tableCount = 0;
    let totalRows = 0;
    try {
      const tables = rowsToObjects<{ name: string }>(
        await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"),
      );
      tableCount = tables.length;
      for (const t of tables) {
        try {
          const r = rowsToObjects<Record<string, unknown>>(await db.execute(`SELECT COUNT(*) as c FROM "${t.name}"`));
          totalRows += Number(Object.values(r[0] ?? {})[0] ?? 0);
        } catch {
          // skip unreadable table
        }
      }
    } catch {
      // ignore
    }

    return { sizeBytes, sizeMB, limitBytes, limitMB, percent, tableCount, totalRows };
  });

export const getR2StorageStats = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const accessKeyId =
      process.env.R2_ACCESS_KEY_ID ||
      process.env.R2_ACCESS_KEY ||
      process.env.VITE_R2_ACCESS_KEY_ID ||
      process.env.VITE_R2_ACCESS_KEY;
    const secretAccessKey =
      process.env.R2_SECRET_ACCESS_KEY ||
      process.env.R2_SECRET ||
      process.env.VITE_R2_SECRET_ACCESS_KEY ||
      process.env.VITE_R2_SECRET;

    if (!accessKeyId || !secretAccessKey) {
      return { connected: false, sizeBytes: 0, sizeGB: 0, limitGB: 10, percent: 0, fileCount: 0 };
    }

    const { AwsClient } = await import("aws4fetch");
    const bucket =
      process.env.R2_BUCKET ||
      process.env.R2_BUCKET_NAME ||
      process.env.VITE_R2_BUCKET ||
      "turso";
    const endpoint =
      process.env.R2_ENDPOINT || process.env.VITE_R2_ENDPOINT;
    const accountId =
      process.env.R2_ACCOUNT_ID ||
      process.env.VITE_R2_ACCOUNT_ID ||
      process.env.CF_ACCOUNT_ID;
    const baseEndpoint = endpoint
      ? endpoint.replace(/\/+$/, "")
      : accountId
      ? `https://${accountId}.r2.cloudflarestorage.com`
      : null;

    if (!baseEndpoint) {
      return { connected: false, sizeBytes: 0, sizeGB: 0, limitGB: 10, percent: 0, fileCount: 0 };
    }

    const client = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: "s3",
      region: "auto",
    });

    let totalBytes = 0;
    let fileCount = 0;
    let continuationToken: string | undefined;

    try {
      do {
        const listUrl = new URL(`${baseEndpoint}/${bucket}?list-type=2&max-keys=1000`);
        if (continuationToken) {
          listUrl.searchParams.set("continuation-token", continuationToken);
        }
        const res = await client.fetch(listUrl.toString(), { method: "GET" });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`R2 LIST ${res.status}: ${text.slice(0, 300)}`);
        }
        const xml = await res.text();

        const sizeMatches = xml.matchAll(/<Size>(\d+)<\/Size>/g);
        for (const m of sizeMatches) {
          totalBytes += Number(m[1]);
        }

        fileCount += (xml.match(/<Key>/g) ?? []).length;

        const ctMatch = xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/);
        const isTruncated = xml.includes("<IsTruncated>true</IsTruncated>");
        continuationToken = isTruncated && ctMatch ? ctMatch[1] : undefined;
      } while (continuationToken);
    } catch {
      return { connected: false, sizeBytes: 0, sizeGB: 0, limitGB: 10, percent: 0, fileCount: 0 };
    }

    const limitGB = 10; // R2 free tier
    const sizeGB = totalBytes / (1024 * 1024 * 1024);
    const percent = limitGB > 0 ? (sizeGB / limitGB) * 100 : 0;

    return { connected: true, sizeBytes: totalBytes, sizeGB, limitGB, percent, fileCount };
  });
