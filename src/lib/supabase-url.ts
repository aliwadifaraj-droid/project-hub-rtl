export function normalizeSupabaseUrl(rawUrl: string | null | undefined) {
  const value = rawUrl?.trim().replace(/^['"]|['"]$/g, "");
  if (!value) return "";

  const projectRef = value.match(/^[a-z0-9]{20}$/i)?.[0];
  let candidate = projectRef ? `https://${projectRef}.supabase.co` : value;
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return candidate;
  }

  const dashboardProject = url.pathname.match(/\/dashboard\/project\/([a-z0-9-]+)/i)?.[1];
  if (url.hostname === "supabase.com" && dashboardProject) {
    return `https://${dashboardProject}.supabase.co`;
  }

  const apiPathSuffixes = ["/auth/v1", "/rest/v1", "/storage/v1", "/functions/v1", "/realtime/v1"];
  let pathname = url.pathname.replace(/\/+$/g, "");
  let changed = true;

  while (changed) {
    changed = false;
    for (const suffix of apiPathSuffixes) {
      if (pathname === suffix || pathname.endsWith(suffix)) {
        pathname = pathname.slice(0, -suffix.length).replace(/\/+$/g, "");
        changed = true;
      }
    }
  }

  url.pathname = pathname || "/";
  url.search = "";
  url.hash = "";

  return url.toString().replace(/\/$/, "");
}