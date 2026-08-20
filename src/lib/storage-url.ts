/**
 * Resolve stored file references to browser-usable URLs.
 *
 * Preference order:
 * 1. R2_PUBLIC_URL (if set) — direct public URL, no signing needed.
 * 2. Signed URL via R2 credentials (signGetUrl).
 * 3. Legacy Supabase storage paths are converted to R2 keys.
 *
 * Older rows may contain legacy `/storage/v1/object/public/...` paths,
 * `/turso/` prefixed paths, or full public-storage URLs. Those paths must
 * not be returned directly on Vercel because they resolve as app routes.
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

  return { keys: unique([value, value.replace(/^(project-images|projects|files)\//, "")]) };
}

function getR2PublicUrl(): string | null {
  const u = process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL;
  return u ? u.replace(/\/+$/, "") : null;
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
    const publicBase = getR2PublicUrl();
    if (publicBase && direct.startsWith(publicBase + "/")) return direct;
    return direct;
  }

  if (!keys.length) return "";

  for (const key of keys) {
    const pub = buildPublicUrl(key);
    if (pub) return pub;
    try {
      const { signGetUrl } = await import("./r2");
      return await signGetUrl(key, expiresIn);
    } catch {
      // Try the next candidate when signing fails.
    }
  }
  return "";
}
