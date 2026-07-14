// Cloudflare R2 (S3-compatible) client. Server-only.
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials missing (R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)");
  }
  _client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
  return _client;
}

export function getBucket(): string {
  const b = process.env.R2_BUCKET;
  if (!b) throw new Error("R2_BUCKET is not set");
  return b;
}

/** Upload a file to R2 and return the object key. */
export async function uploadToR2(params: {
  key: string;
  body: Uint8Array | ArrayBuffer | Buffer;
  contentType?: string;
}): Promise<{ key: string; bucket: string }> {
  const bucket = getBucket();
  const body =
    params.body instanceof Uint8Array
      ? params.body
      : new Uint8Array(params.body as ArrayBuffer);
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: body,
      ContentType: params.contentType,
    }),
  );
  return { key: params.key, bucket };
}

/** Generate a signed GET URL valid for `expiresIn` seconds (default 1h). */
export async function signGetUrl(key: string, expiresIn = 60 * 60): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: getBucket(), Key: key });
  return getSignedUrl(getClient(), cmd, { expiresIn });
}

export async function deleteFromR2(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}

/** Build a deterministic object key: <prefix>/<uuid>-<filename>. */
export function makeKey(prefix: string, filename: string): string {
  const clean = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const id = crypto.randomUUID();
  return `${prefix.replace(/^\/+|\/+$/g, "")}/${id}-${clean}`;
}
