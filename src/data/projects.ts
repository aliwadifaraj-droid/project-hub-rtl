import tower from "@/assets/project-tower.jpg";
import mall from "@/assets/project-mall.jpg";
import bridge from "@/assets/project-bridge.jpg";
import hospital from "@/assets/project-hospital.jpg";
import villa from "@/assets/project-villa.jpg";
import school from "@/assets/project-school.jpg";

export const projectImageMap: Record<string, string> = {
  tower,
  mall,
  bridge,
  hospital,
  villa,
  school,
};

export function resolveImage(key: string) {
  return projectImageMap[key] ?? tower;
}

/**
 * Build a public R2 URL from a stored key.
 * Handles legacy Supabase paths, /turso/ prefixes, and raw R2 keys.
 * Returns null if the key doesn't look like a valid R2 path.
 */
export function buildR2Url(coverImage: string | null): string | null {
  if (!coverImage) return null;
  if (coverImage.startsWith("http://") || coverImage.startsWith("https://")) return coverImage;
  if (coverImage.startsWith("data:")) return coverImage;

  let key = coverImage;
  // Strip legacy Supabase storage paths.
  const legacyMatch = key.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  if (legacyMatch) key = legacyMatch[1];
  // Strip leading slashes and turso/ prefix.
  key = key.replace(/^\/+/, "").replace(/^turso\//, "");
  // Strip old bucket prefixes.
  key = key.replace(/^(project-images|projects|files)\//, "");
  // Must contain a path separator to be a valid R2 key.
  if (!key.includes("/")) return null;

  const publicBase = (import.meta.env.VITE_R2_PUBLIC_URL || "").replace(/\/+$/, "");
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  if (publicBase) return `${publicBase}/${encoded}`;

  const bucket = import.meta.env.VITE_R2_BUCKET_NAME || "turso";
  return `https://${bucket}.r2.dev/${encoded}`;
}
