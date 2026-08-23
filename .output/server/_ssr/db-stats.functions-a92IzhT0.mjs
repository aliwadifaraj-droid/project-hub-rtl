import process from "node:process";
import { c as createServerRpc } from "./createServerRpc-DYLDSQ_Q.mjs";
import { c as createServerFn } from "./server-COznR7QB.mjs";
import { a as requireAdmin } from "./auth-middleware.server-B9hAjfqi.mjs";
import { r as rowsToObjects, d as db } from "./db-D5OYORU-.mjs";

import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/h3-v2.mjs";
import "../_libs/unenv.mjs";


import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";





import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";

import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
import "../_libs/libsql__client.mjs";
import "../_libs/libsql__core.mjs";
import "../_libs/js-base64.mjs";
import "../_libs/jose.mjs";

const DEFAULT_LIMIT_BYTES = 500 * 1024 * 1024;
const getDatabaseSize_createServerFn_handler = createServerRpc({
  id: "34e0e060549e3a4623590222947527fe754689016441c6d314a18fdeac1a7e25",
  name: "getDatabaseSize",
  filename: "src/lib/db-stats.functions.ts"
}, (opts) => getDatabaseSize.__executeServer(opts));
const getDatabaseSize = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(getDatabaseSize_createServerFn_handler, async () => {
  let sizeBytes = 0;
  try {
    const pageCount = rowsToObjects(await db.execute("PRAGMA page_count"))[0];
    const pageSize = rowsToObjects(await db.execute("PRAGMA page_size"))[0];
    const count = Number(Object.values(pageCount ?? {})[0] ?? 0);
    const size = Number(Object.values(pageSize ?? {})[0] ?? 0);
    sizeBytes = Number.isFinite(count * size) ? count * size : 0;
  } catch {
    sizeBytes = 0;
  }
  const limitBytes = DEFAULT_LIMIT_BYTES;
  const sizeMB = sizeBytes / (1024 * 1024);
  const limitMB = limitBytes / (1024 * 1024);
  const percent = limitBytes > 0 ? sizeBytes / limitBytes * 100 : 0;
  let tableCount = 0;
  let totalRows = 0;
  try {
    const tables = rowsToObjects(await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"));
    tableCount = tables.length;
    for (const t of tables) {
      try {
        const r = rowsToObjects(await db.execute(`SELECT COUNT(*) as c FROM "${t.name}"`));
        totalRows += Number(Object.values(r[0] ?? {})[0] ?? 0);
      } catch {
      }
    }
  } catch {
  }
  return {
    sizeBytes,
    sizeMB,
    limitBytes,
    limitMB,
    percent,
    tableCount,
    totalRows
  };
});
const getR2StorageStats_createServerFn_handler = createServerRpc({
  id: "d4cc3b2e092015738ff48f621162da3e6d01d1d9c5a377a0ce06fdf793953857",
  name: "getR2StorageStats",
  filename: "src/lib/db-stats.functions.ts"
}, (opts) => getR2StorageStats.__executeServer(opts));
const getR2StorageStats = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(getR2StorageStats_createServerFn_handler, async () => {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    return {
      connected: false,
      sizeBytes: 0,
      sizeGB: 0,
      limitGB: 10,
      percent: 0,
      fileCount: 0
    };
  }
  const {
    AwsClient
  } = await import("../_libs/aws4fetch.mjs");
  const bucket = process.env.R2_BUCKET || "turso";
  const endpoint = process.env.R2_ENDPOINT;
  const accountId = process.env.R2_ACCOUNT_ID;
  const baseEndpoint = endpoint ? endpoint.replace(/\/+$/, "") : accountId ? `https://${accountId}.r2.cloudflarestorage.com` : null;
  if (!baseEndpoint) {
    return {
      connected: false,
      sizeBytes: 0,
      sizeGB: 0,
      limitGB: 10,
      percent: 0,
      fileCount: 0
    };
  }
  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: "auto"
  });
  let totalBytes = 0;
  let fileCount = 0;
  let continuationToken;
  try {
    do {
      const listUrl = new URL(`${baseEndpoint}/${bucket}?list-type=2&max-keys=1000`);
      if (continuationToken) {
        listUrl.searchParams.set("continuation-token", continuationToken);
      }
      const res = await client.fetch(listUrl.toString(), {
        method: "GET"
      });
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
      continuationToken = isTruncated && ctMatch ? ctMatch[1] : void 0;
    } while (continuationToken);
  } catch {
    return {
      connected: false,
      sizeBytes: 0,
      sizeGB: 0,
      limitGB: 10,
      percent: 0,
      fileCount: 0
    };
  }
  const limitGB = 10;
  const sizeGB = totalBytes / (1024 * 1024 * 1024);
  const percent = limitGB > 0 ? sizeGB / limitGB * 100 : 0;
  return {
    connected: true,
    sizeBytes: totalBytes,
    sizeGB,
    limitGB,
    percent,
    fileCount
  };
});
export {
  getDatabaseSize_createServerFn_handler,
  getR2StorageStats_createServerFn_handler
};
