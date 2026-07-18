// Cloudflare R2 client — uses aws4fetch (works on Workers/Node/Vercel).
// Server-only.
import { AwsClient } from "aws4fetch";

let _client: AwsClient | null = null;

function getClient(): AwsClient {
  if (_client) return _client;
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
    throw new Error("R2 credentials missing (R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)");
  }
  _client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: "auto",
  });
  return _client;
}

export function getBucket(): string {
  const b =
    process.env.R2_BUCKET ||
    process.env.R2_BUCKET_NAME ||
    process.env.VITE_R2_BUCKET ||
    "turso";
  return b;
}


function getEndpoint(): string {
  const e = process.env.R2_ENDPOINT || process.env.VITE_R2_ENDPOINT;
  if (e) return e.replace(/\/+$/, "");
  const acc =
    process.env.R2_ACCOUNT_ID ||
    process.env.VITE_R2_ACCOUNT_ID ||
    process.env.CF_ACCOUNT_ID;
  if (acc) return `https://${acc}.r2.cloudflarestorage.com`;
  throw new Error("R2_ENDPOINT or R2_ACCOUNT_ID is not set");
}

function encodeKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

function objectUrl(key: string): string {
  return `${getEndpoint()}/${getBucket()}/${encodeKey(key)}`;
}

/** Upload a file to R2. */
export async function uploadToR2(params: {
  key: string;
  body: Uint8Array | ArrayBuffer | Buffer;
  contentType?: string;
}): Promise<{ key: string; bucket: string }> {
  const body =
    params.body instanceof Uint8Array
      ? params.body
      : new Uint8Array(params.body as ArrayBuffer);
  const url = objectUrl(params.key);
  const res = await getClient().fetch(url, {
    method: "PUT",
    body: body as BodyInit,
    headers: params.contentType ? { "content-type": params.contentType } : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 PUT ${res.status}: ${text.slice(0, 300)}`);
  }
  return { key: params.key, bucket: getBucket() };
}

/** Generate a signed GET URL valid for `expiresIn` seconds (default 1h). */
export async function signGetUrl(key: string, expiresIn = 60 * 60): Promise<string> {
  const url = new URL(objectUrl(key));
  url.searchParams.set("X-Amz-Expires", String(Math.min(Math.max(expiresIn, 1), 60 * 60 * 24 * 7)));
  const signed = await getClient().sign(
    new Request(url.toString(), { method: "GET" }),
    { aws: { signQuery: true } },
  );
  return signed.url;
}

export async function deleteFromR2(key: string): Promise<void> {
  const res = await getClient().fetch(objectUrl(key), { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 DELETE ${res.status}: ${text.slice(0, 300)}`);
  }
}

/** Build a deterministic object key: <prefix>/<uuid>-<filename>. */
export function makeKey(prefix: string, filename: string): string {
  const clean = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const id = crypto.randomUUID();
  return `${prefix.replace(/^\/+|\/+$/g, "")}/${id}-${clean}`;
}
