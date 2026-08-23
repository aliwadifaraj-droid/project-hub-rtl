import process from "node:process";
const LEGACY_PUBLIC_MARKERS = [
  "/storage/v1/object/public/project-images/",
  "/storage/v1/object/public/projects/",
  "/storage/v1/object/public/files/"
];
function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}
function stripLegacyPublicPrefix(value) {
  for (const marker of LEGACY_PUBLIC_MARKERS) {
    const index = value.indexOf(marker);
    if (index >= 0) return decodeURIComponent(value.slice(index + marker.length));
  }
  return null;
}
function storageKeyCandidates(raw) {
  const value = raw.trim();
  if (!value) return { keys: [] };
  if (value.startsWith("data:")) return { direct: value, keys: [] };
  if (value.startsWith("http://") || value.startsWith("https://")) {
    const legacyKey2 = stripLegacyPublicPrefix(value);
    if (legacyKey2) return { keys: unique([legacyKey2]) };
    return { direct: value, keys: [] };
  }
  const legacyKey = stripLegacyPublicPrefix(value);
  if (legacyKey) return { keys: unique([legacyKey]) };
  if (value.startsWith("/")) return { direct: value, keys: [] };
  if (!value.includes("/")) return { direct: value, keys: [] };
  const withoutOldBucket = value.replace(/^(project-images|projects|files)\//, "");
  return { keys: unique([value, withoutOldBucket]) };
}
async function resolveStoredFileUrl(raw, expiresIn = 60 * 60) {
  if (!raw) return "";
  const { direct, keys } = storageKeyCandidates(raw);
  const { getPublicUrl } = await import("./r2-CJ2zxhhj.mjs");
  if (direct !== void 0) {
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
    }
  }
  return "";
}
export {
  resolveStoredFileUrl as r
};
