// Cloudflare R2 server-side client — uses AWS SDK (reliable on Vercel/Node).
// Server-only.
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials missing (R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)");
  }
  const endpoint = process.env.R2_ENDPOINT || (() => {
    const acc = process.env.R2_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
    if (!acc) throw new Error("R2_ENDPOINT or R2_ACCOUNT_ID is not set");
    return `https://${acc}.r2.cloudflarestorage.com`;
  })();
  _client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

export function getBucket(): string {
  return process.env.R2_BUCKET || "turso";
}

export function getPublicUrl(): string | null {
  const u = process.env.R2_PUBLIC_URL;
  return u ? u.replace(/\/+$/, "") : null;
}

function encodeKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
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
  const cmd = new PutObjectCommand({
    Bucket: getBucket(),
    Key: params.key,
    Body: body,
    ContentType: params.contentType,
  });
  await getClient().send(cmd);
  return { key: params.key, bucket: getBucket() };
}

/** Generate a signed GET URL valid for `expiresIn` seconds (default 1h). */
export async function signGetUrl(key: string, expiresIn = 60 * 60): Promise<string> {
  const pub = getPublicUrl();
  if (pub) {
    return `${pub}/${encodeKey(key)}`;
  }
  const cmd = new GetObjectCommand({ Bucket: getBucket(), Key: key });
  return awsGetSignedUrl(getClient(), cmd, { expiresIn });
}

export async function deleteFromR2(key: string): Promise<void> {
  try {
    const cmd = new DeleteObjectCommand({ Bucket: getBucket(), Key: key });
    await getClient().send(cmd);
  } catch (e: any) {
    if (e?.name !== "NoSuchKey" && e?.$metadata?.httpStatusCode !== 404) throw e;
  }
}

/** Build a deterministic object key: <prefix>/<uuid>-<filename>. */
export function makeKey(prefix: string, filename: string): string {
  const clean = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const id = crypto.randomUUID();
  return `${prefix.replace(/^\/+|\/+$/g, "")}/${id}-${clean}`;
}
