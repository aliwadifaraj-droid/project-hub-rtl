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

function stripLegacyPublicPrefix(value: string): string | null {
  for (const marker of LEGACY_PUBLIC_MARKERS) {
    const index = value.indexOf(marker);
    if (index >= 0) return decodeURIComponent(value.slice(index + marker.length));
  }
  return null;
}

function storageKeyCandidates(raw: string): { direct?: string; keys: string[] } {
  const value = raw.trim();
  if (!value) return { keys: [] };
  if (value.startsWith("data:")) return { direct: value, keys: [] };

  if (value.startsWith("http://") || value.startsWith("https://")) {
    const legacyKey = stripLegacyPublicPrefix(value);
    if (legacyKey) return { keys: unique([legacyKey]) };
    return { direct: value, keys: [] };
  }

  const legacyKey = stripLegacyPublicPrefix(value);
  if (legacyKey) return { keys: unique([legacyKey]) };

  if (value.startsWith("/")) return { direct: value, keys: [] };
  if (!value.includes("/")) return { direct: value, keys: [] };

  const withoutOldBucket = value.replace(/^(project-images|projects|files)\//, "");
  return { keys: unique([value, withoutOldBucket]) };
}

export async function resolveStoredFileUrl(raw: string | null | undefined, expiresIn = 60 * 60): Promise<string> {
  if (!raw) return "";
  const { direct, keys } = storageKeyCandidates(raw);
  if (direct !== undefined) return direct;
  if (!keys.length) return "";

  const { signGetUrl } = await import("./r2");
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