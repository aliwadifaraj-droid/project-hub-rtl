/**
 * Resolve stored file references to browser-usable URLs.
 *
 * New uploads are R2 object keys. Older rows may still contain legacy
 * `/storage/v1/object/public/...` paths or full public-storage URLs. Those
 * paths must not be returned directly on Vercel, because they resolve as app
 * routes and show the 404 page instead of an image.
 */
const LEGACY_PUBLIC_MARKERS = [
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
    const legacy = stripLegacyPublicPrefix(value);
    if (legacy) return { keys: unique([legacy.key, `${legacy.bucket}/${legacy.key}`]) };
    return { direct: value, keys: [] };
  }

  const legacy = stripLegacyPublicPrefix(value);
  if (legacy) return { keys: unique([legacy.key, `${legacy.bucket}/${legacy.key}`]) };

  if (value.startsWith("/")) return { direct: value, keys: [] };
  if (!value.includes("/")) return { direct: value, keys: [] };

  const withoutOldBucket = value.replace(/^(project-images|projects|files)\//, "");
  return { keys: unique([value, withoutOldBucket]) };
}

export async function resolveStoredFileUrl(raw: string | null | undefined, expiresIn = 60 * 60): Promise<string> {
  if (!raw) return "";
  const { direct, keys } = storageKeyCandidates(raw);
  const { signGetUrl, getBucket, getEndpoint } = await import("./r2");

  if (direct !== undefined) {
    if (!direct.startsWith("http://") && !direct.startsWith("https://")) return direct;
    try {
      const url = new URL(direct);
      const endpoint = new URL(getEndpoint());
      const publicBase = process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL;
      const isR2Endpoint = url.origin === endpoint.origin;
      const isR2PublicUrl = publicBase && direct.startsWith(publicBase.replace(/\/+$/, "") + "/");
      if (isR2Endpoint || isR2PublicUrl) {
        let key = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
        if (isR2Endpoint) key = key.replace(new RegExp(`^${getBucket()}/`), "");
        if (key) return await signGetUrl(key, expiresIn);
      }
    } catch {
      return "";
    }
    return direct;
  }
  if (!keys.length) return "";

  for (const key of keys) {
    try {
      return await signGetUrl(key, expiresIn);
    } catch {
      // Try the next candidate. This handles old rows that kept a bucket
      // prefix while the migrated R2 object used only the inner object key.
    }
  }
  return "";
}
