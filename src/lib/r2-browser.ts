// Browser-side direct upload to Cloudflare R2 using VITE_ credentials.
// NOTE: exposing R2 keys to the browser is intentional here (per product
// decision). Use an R2 Access Key restricted to PUT on the target bucket.
import { AwsClient } from "aws4fetch";

const ACCESS_KEY = import.meta.env.VITE_R2_ACCESS_KEY_ID as string | undefined;
const SECRET_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY as string | undefined;
const ENDPOINT = (import.meta.env.VITE_R2_ENDPOINT as string | undefined)?.replace(/\/+$/, "");
const BUCKET = import.meta.env.VITE_R2_BUCKET as string | undefined;
const PUBLIC_URL = (import.meta.env.VITE_R2_PUBLIC_URL as string | undefined)?.replace(/\/+$/, "");

let _client: AwsClient | null = null;
function client(): AwsClient {
  if (_client) return _client;
  if (!ACCESS_KEY || !SECRET_KEY || !ENDPOINT || !BUCKET) {
    throw new Error("R2 غير مهيأ في المتصفح (VITE_R2_* مفقودة)");
  }
  _client = new AwsClient({
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
    service: "s3",
    region: "auto",
  });
  return _client;
}

function encodeKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export function makeBrowserKey(prefix: string, filename: string): string {
  const p = prefix.replace(/^\/+|\/+$/g, "");
  return `${p}/${crypto.randomUUID()}-${sanitizeName(filename)}`;
}

export type BrowserUploadResult = {
  key: string;
  bucket: string;
  /** Public URL (works when the R2 bucket has a public dev/custom domain). */
  publicUrl: string;
};

/** Upload a File/Blob directly to R2 from the browser. */
export async function uploadToR2Browser(params: {
  file: File | Blob;
  key: string;
  contentType?: string;
}): Promise<BrowserUploadResult> {
  const c = client();
  const url = `${ENDPOINT}/${BUCKET}/${encodeKey(params.key)}`;
  const buf = await params.file.arrayBuffer();
  const res = await c.fetch(url, {
    method: "PUT",
    body: buf,
    headers: params.contentType
      ? { "content-type": params.contentType }
      : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`فشل رفع R2 (${res.status}): ${text.slice(0, 200)}`);
  }
  const publicUrl = PUBLIC_URL
    ? `${PUBLIC_URL}/${encodeKey(params.key)}`
    : `${ENDPOINT}/${BUCKET}/${encodeKey(params.key)}`;
  return { key: params.key, bucket: BUCKET!, publicUrl };
}
