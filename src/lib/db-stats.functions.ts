import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Free tier default limit (bytes). Adjust if your plan differs.
const DEFAULT_LIMIT_BYTES = 500 * 1024 * 1024; // 500 MB

export const getDatabaseSize = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await (supabase as any).rpc("get_database_size");
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    const sizeBytes = Number(row?.size_bytes ?? 0);
    const limitBytes = DEFAULT_LIMIT_BYTES;
    const sizeMB = sizeBytes / (1024 * 1024);
    const limitMB = limitBytes / (1024 * 1024);
    const percent = limitBytes > 0 ? (sizeBytes / limitBytes) * 100 : 0;
    return { sizeBytes, sizeMB, limitBytes, limitMB, percent };
  });
