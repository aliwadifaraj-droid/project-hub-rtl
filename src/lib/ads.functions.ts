import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  if (!roles.includes("admin") && !roles.includes("employee")) {
    throw new Error("غير مصرح");
  }
  return roles as string[];
}

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!(data ?? []).some((r: { role: string }) => r.role === "admin")) {
    throw new Error("هذه العملية للأدمن فقط");
  }
}

async function resolveImage(path: string | null): Promise<string> {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage
    .from("project-images")
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? "";
}

const adSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().default(""),
  image_url: z.string().trim().max(1000).optional().default(""),
});

export const createAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => adSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("ads")
      .insert({
        title: data.title,
        description: data.description || null,
        image_url: data.image_url || null,
        status: "pending",
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const linkUrl = `/ads/${row.id}`;
    await supabaseAdmin.from("ads").update({ link_url: linkUrl }).eq("id", row.id);
    return { id: row.id, link_url: linkUrl };
  });


export const listPendingAds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const roles = await assertStaff(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("ads")
      .select("id,title,description,image_url,link_url,status,created_by,created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = Array.from(new Set((data ?? []).map((a) => a.created_by).filter(Boolean) as string[]));
    const emailById = new Map<string, string>();
    if (ids.length) {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id,email").in("id", ids);
      (profs ?? []).forEach((p: { id: string; email: string | null }) => {
        if (p.email) emailById.set(p.id, p.email);
      });
    }
    const rows = await Promise.all(
      (data ?? []).map(async (a) => ({
        ...a,
        image_signed_url: await resolveImage(a.image_url),
        submitter_label: a.created_by ? (emailById.get(a.created_by) ?? "موظف") : "زائر",
      })),
    );
    return { rows, isAdmin: roles.includes("admin") };
  });

export const countPendingAds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error } = await supabaseAdmin
      .from("ads")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    if (error) throw new Error(error.message);
    return count ?? 0;
  });

export const approveAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("ads")
      .update({ status: "approved", rejection_reason: null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const rejectAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      reason: z.string().trim().min(1, "السبب مطلوب").max(500),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("ads")
      .update({ status: "rejected", rejection_reason: data.reason })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().max(2000).optional().default(""),
      image_url: z.string().trim().max(1000).optional().default(""),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("ads")
      .update({
        title: data.title,
        description: data.description || null,
        image_url: data.image_url || null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("ads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Public — anyone can list approved ads
export const listApprovedAds = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("ads")
      .select("id,title,description,image_url,link_url,created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    const rows = await Promise.all(
      (data ?? []).map(async (a) => ({ ...a, image_signed_url: await resolveImage(a.image_url) })),
    );
    return rows;
  });

export const getApprovedAd = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("ads")
      .select("id,title,description,image_url,link_url,created_at,status")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row || row.status !== "approved") return null;
    return { ...row, image_signed_url: await resolveImage(row.image_url) };
  });

// Public — visitors can submit a pending ad without sign-in
export const submitVisitorAd = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().max(2000).optional().default(""),
      image_path: z.string().trim().max(500).optional().default(""),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const safePath = data.image_path && data.image_path.startsWith("submissions/") ? data.image_path : "";
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("ads")
      .insert({
        title: data.title,
        description: data.description || null,
        image_url: safePath || null,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const linkUrl = `/ads/${row.id}`;
    await supabaseAdmin.from("ads").update({ link_url: linkUrl }).eq("id", row.id);
    return { id: row.id };
  });
