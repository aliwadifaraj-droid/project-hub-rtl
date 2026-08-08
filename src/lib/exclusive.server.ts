// Server-only helpers for the "المشاريع الحصرية" (exclusive projects) feature.
// A project is exclusive when there is at least one ACTIVE VIP subscriber in the
// same city. During the exclusive window only those VIP subscribers may apply.
import * as vipRepo from "./vip.repo";
import { getDefaultExclusiveHours } from "./app-settings.repo";

export type Exclusivity = {
  is_exclusive: 0 | 1;
  exclusive_hours: number;
  exclusive_until: string | null;
};

/**
 * Decide whether a project should be exclusive based on its city and the pool
 * of active VIP subscribers. If VIPs exist in that city, the project is locked
 * for `hours` (override) or the global default.
 */
export async function computeExclusivity(
  city: string | null | undefined,
  hoursOverride?: number,
): Promise<Exclusivity> {
  const hours =
    hoursOverride && Number.isFinite(hoursOverride) && hoursOverride > 0
      ? Math.floor(hoursOverride)
      : await getDefaultExclusiveHours();

  const c = (city ?? "").trim();
  if (!c) return { is_exclusive: 0, exclusive_hours: hours, exclusive_until: null };

  const subs = await vipRepo.listActiveByCity(c).catch(() => []);
  if (!subs.length) return { is_exclusive: 0, exclusive_hours: hours, exclusive_until: null };

  const until = new Date(Date.now() + hours * 3600_000).toISOString();
  return { is_exclusive: 1, exclusive_hours: hours, exclusive_until: until };
}

/** True when the exclusive window is currently active. */
export function isExclusiveActive(
  isExclusive: boolean | number | null | undefined,
  exclusiveUntil: string | null | undefined,
): boolean {
  if (!isExclusive || !exclusiveUntil) return false;
  const t = new Date(exclusiveUntil).getTime();
  return Number.isFinite(t) && t > Date.now();
}

/** True when the given viewer email is an active VIP subscriber in the city. */
export async function isViewerEligibleForExclusive(
  email: string | null | undefined,
  city: string | null | undefined,
): Promise<boolean> {
  const c = (city ?? "").trim();
  const e = (email ?? "").trim().toLowerCase();
  if (!c || !e) return false;
  const subs = await vipRepo.listActiveByCity(c).catch(() => []);
  return subs.some((s) => (s.email ?? "").trim().toLowerCase() === e);
}
