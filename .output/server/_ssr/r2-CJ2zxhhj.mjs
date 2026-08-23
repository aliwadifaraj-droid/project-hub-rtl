import process from "node:process";
import { AwsClient } from "../_libs/aws4fetch.mjs";
let _client = null;
function getClient() {
  if (_client) return _client;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY || process.env.VITE_R2_ACCESS_KEY_ID || process.env.VITE_R2_ACCESS_KEY;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET || process.env.VITE_R2_SECRET_ACCESS_KEY || process.env.VITE_R2_SECRET;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials missing (R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)");
  }
  _client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: "auto"
  });
  return _client;
}
function getBucket() {
  const b = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME || process.env.VITE_R2_BUCKET || "turso";
  return b;
}
function getEndpoint() {
  const e = process.env.R2_ENDPOINT || process.env.VITE_R2_ENDPOINT || process.env.R2_S3_ENDPOINT || process.env.VITE_R2_S3_ENDPOINT;
  if (e) return e.replace(/\/+$/, "");
  const acc = process.env.R2_ACCOUNT_ID || process.env.VITE_R2_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
  if (acc) return `https://${acc}.r2.cloudflarestorage.com`;
  throw new Error("R2_ENDPOINT or R2_ACCOUNT_ID is not set");
}
function encodeKey(key) {
  return key.split("/").map(encodeURIComponent).join("/");
}
function objectUrl(key) {
  return `${getEndpoint()}/${getBucket()}/${encodeKey(key)}`;
}
async function uploadToR2(params) {
  const body = params.body instanceof Uint8Array ? params.body : new Uint8Array(params.body);
  const url = objectUrl(params.key);
  const res = await getClient().fetch(url, {
    method: "PUT",
    body,
    headers: params.contentType ? { "content-type": params.contentType } : void 0
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 PUT ${res.status}: ${text.slice(0, 300)}`);
  }
  return { key: params.key, bucket: getBucket() };
}
async function signGetUrl(key, expiresIn = 60 * 60) {
  const url = new URL(objectUrl(key));
  url.searchParams.set("X-Amz-Expires", String(Math.min(Math.max(expiresIn, 1), 60 * 60 * 24 * 7)));
  const signed = await getClient().sign(
    new Request(url.toString(), { method: "GET" }),
    { aws: { signQuery: true } }
  );
  return signed.url;
}
async function deleteFromR2(key) {
  const res = await getClient().fetch(objectUrl(key), { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 DELETE ${res.status}: ${text.slice(0, 300)}`);
  }
}
function getPublicUrl(key) {
  const base = (process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL || "").replace(/\/+$/, "");
  if (!base) throw new Error("R2_PUBLIC_URL is not set");
  return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
}
function makeKey(prefix, filename) {
  const clean = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const id = crypto.randomUUID();
  return `${prefix.replace(/^\/+|\/+$/g, "")}/${id}-${clean}`;
}
export {
  deleteFromR2,
  getBucket,
  getEndpoint,
  getPublicUrl,
  makeKey,
  signGetUrl,
  uploadToR2
};
