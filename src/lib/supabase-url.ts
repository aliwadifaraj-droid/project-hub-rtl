/**
 * Normalize Supabase URL
 * Removes trailing slashes and ensures the URL is properly formatted
 */
export function normalizeSupabaseUrl(
  url: string | undefined | null
): string | undefined {
  if (!url) {
    return undefined;
  }

  return url.trim().replace(/\/$/, '');
}
