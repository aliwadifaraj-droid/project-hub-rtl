/**
 * Resolve stored file references to browser-usable URLs.
 *
 * Preference order:
 * 1. Signed URL via R2 credentials (signGetUrl) — always works when keys are set.
 * 2. R2 public dev URL (https://<bucket>.r2.dev/<key>) — works when public access is enabled.
 * 3. Legacy Supabase storage paths are converted to R2 keys.
 */
const LEGACY_PUBLIC_MARKERS = [
  "/storage/v1/object/public/turso/",
  "/storage/v1/object/public/project-images/",
  "/storage/v1/object/public/projects/",
  "/storage/v1/object/public/files/",
];

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function bucketFromMarker(marker: string): string {
  const parts = marker.split("/").filter(Boolean);
  return parts[parts.length - 1];
}

function stripLegacyPublicPrefix(value: string): { key: string; bucket: string } | null {
  for (const marker of LEGACY_PUBLIC_MARKERS) {
    const index = value.indexOf(marker);
    if (index >= 0) {
      return {
        key: decodeURIComponent(value.slice(index + marker.length)),
        bucket: bucketFromMarker(marker),
      };
    }
  }
  return null;
}

function storageKeyCandidates(raw: string): { direct?: string; keys: string[] } {
  const value = raw.trim();
  if (!value) return { keys: [] };
  if (value.startsWith("data:")) return { direct: value, keys: [] };

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return { direct: value, keys: [] };
  }

  const legacy = stripLegacyPublicPrefix(value);
  if (legacy) return { keys: unique([legacy.key, `${legacy.bucket}/${legacy.key}`]) };

  if (value.startsWith("/turso/")) return { keys: unique([value.slice("/turso/".length), value.slice(1)]) };
  if (value.startsWith("/")) return { direct: value, keys: [] };
  if (!value.includes("/")) return { direct: value, keys: [] };

  if (value.startsWith("turso/")) {
    return { keys: unique([value.slice("turso/".length), value]) };
  }

  // Handle both singular (project-image) and plural (project-images) prefixes.
  return { keys: unique([value, value.replace(/^(project-images?|projects|files)\//, "")]) };
}

function getR2PublicUrl(): string | null {
  const u = process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL;
  if (u) return u.replace(/\/+$/, "");
  const bucket = process.env.R2_BUCKET_NAME || process.env.VITE_R2_BUCKET_NAME || process.env.R2_BUCKET || process.env.VITE_R2_BUCKET;
  if (bucket) return `https://${bucket}.r2.dev`;
  return null;
}

function buildPublicUrl(key: string): string {
  const base = getR2PublicUrl();
  if (!base) return "";
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return `${base}/${encoded}`;
}

export async function resolveStoredFileUrl(raw: string | null | undefined, expiresIn = 60 * 60): Promise<string> {
  if (!raw) return "";
  const { direct, keys } = storageKeyCandidates(raw);

  if (direct !== undefined) {
    if (!direct.startsWith("http://") && !direct.startsWith("https://")) return direct;
    return direct;
  }

  if (!keys.length) return "";

  for (const key of keys) {
    // Try signed URL first — always works when R2 credentials are available.
    try {
      const { signGetUrl } = await import("./r2");
      const signed = await signGetUrl(key, expiresIn);
      if (signed) return signed;
    } catch {
      // Signing failed (credentials missing or invalid) — fall through to public URL.
    }
    // Fall back to public URL if signing failed.
    const pub = buildPublicUrl(key);
    if (pub) return pub;
  }
  return "";
}
