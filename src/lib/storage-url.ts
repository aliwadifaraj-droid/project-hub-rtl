/**
 * Resolve stored file references to browser-usable URLs.
 *
 * New uploads are R2 object keys. Older rows may still contain legacy
 * `/storage/v1/object/public/...` paths, full public-storage URLs,
 * `turso/`-prefixed keys, or bare asset names.
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

  // Strip leading slashes and turso/ bucket prefix
  let cleaned = value.replace(/^\/+/, "").replace(/^turso\//, "");

  // Strip old bucket prefixes
  const withoutOldBucket = cleaned.replace(/^(project-images|projects|files)\//, "");

  // Bare filename (no /) — likely a bundled asset key, let client-side resolveImage handle it
  if (!cleaned.includes("/")) return { direct: cleaned, keys: [] };

  // Has a path separator — treat as R2 key (try both with and without bucket prefix)
  return { keys: unique([cleaned, withoutOldBucket]) };
}

export async function resolveStoredFileUrl(raw: string | null | undefined, expiresIn = 60 * 60): Promise<string> {
  if (!raw) return "";
  const { direct, keys } = storageKeyCandidates(raw);
  const { getPublicUrl } = await import("./r2");

  if (direct !== undefined) {
    if (!direct.startsWith("http://") && !direct.startsWith("https://")) return direct;
    try {
      const url = new URL(direct);
      const publicBase = (process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL || "").replace(/\/+$/, "");
      const isR2PublicUrl = publicBase && direct.startsWith(publicBase + "/");
      if (isR2PublicUrl) {
        const key = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
        if (key) return getPublicUrl(key);
      }
    } catch {
      return "";
    }
    return direct;
  }
  if (!keys.length) return "";

  for (const key of keys) {
    try {
      return getPublicUrl(key);
    } catch {
      // Try the next candidate. This handles old rows that kept a bucket
      // prefix while the migrated R2 object used only the inner object key.
    }
  }
  return "";
}
