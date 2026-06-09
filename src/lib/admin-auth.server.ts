import { createClient } from "@supabase/supabase-js";
import process from "node:process";
import type { Database } from "@/integrations/supabase/types";
import { normalizeSupabaseUrl } from "@/lib/supabase-url";

function readServerEnv(name: string) {
  return process.env[name] || globalThis.process?.env?.[name];
}

export function createAdminAuthClient() {
  const supabaseUrl =
    normalizeSupabaseUrl(
      readServerEnv("SUPABASE_URL") ||
      readServerEnv("NEXT_PUBLIC_SUPABASE_URL") ||
      readServerEnv("VITE_SUPABASE_URL")
    );
  const serviceRoleKey = readServerEnv("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    const missing = [
      ...(!supabaseUrl ? ["SUPABASE_URL أو NEXT_PUBLIC_SUPABASE_URL"] : []),
      ...(!serviceRoleKey ? ["SUPABASE_SERVICE_ROLE_KEY"] : []),
    ];
    throw new Error(
      `إعدادات قاعدة البيانات ناقصة في بيئة تشغيل Vercel: ${missing.join(", ")}. تأكد أن المتغير مضاف لنفس البيئة التي نشرت عليها ثم أعد النشر بدون Build Cache.`
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}