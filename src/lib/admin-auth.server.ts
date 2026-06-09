import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export function createAdminAuthClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    const missing = [
      ...(!supabaseUrl ? ["SUPABASE_URL أو NEXT_PUBLIC_SUPABASE_URL"] : []),
      ...(!serviceRoleKey ? ["SUPABASE_SERVICE_ROLE_KEY"] : []),
    ];
    throw new Error(`إعدادات قاعدة البيانات ناقصة في Vercel: ${missing.join(", ")}`);
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}