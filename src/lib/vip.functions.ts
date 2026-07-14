import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listVipSubscribers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: myRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (!myRoles?.some((r) => r.role === "admin")) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("vip_subscribers")
      .select("id,name,email,status,receipt_path,notes,plan,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // Generate signed URLs for receipts
    const rows = await Promise.all(
      (data ?? []).map(async (r: typeof data[number] & { plan?: string | null }) => {
        let receipt_url: string | null = null;
        if (r.receipt_path) {
          const { data: signed } = await supabaseAdmin.storage
            .from("vip-receipts")
            .createSignedUrl(r.receipt_path, 3600);
          receipt_url = signed?.signedUrl ?? null;
        }
        return { ...r, receipt_url };
      }),
    );
    return rows;
  });

export const submitVipSubscription = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; email: string; receipt_path: string; plan: string }) => {
    if (!data?.name?.trim() || !data?.email?.trim()) throw new Error("الاسم والبريد مطلوبان");
    if (!data?.receipt_path?.trim()) throw new Error("إيصال التحويل مطلوب");
    if (!data?.plan?.trim()) throw new Error("اختر الباقة");
    return { name: data.name.trim(), email: data.email.trim(), receipt_path: data.receipt_path.trim(), plan: data.plan.trim() };
  })
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: inserted, error } = await sb
      .from("vip_subscribers")
      .insert({ name: data.name, email: data.email, status: "pending", receipt_path: data.receipt_path })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (admins && admins.length > 0) {
      const { insertMany } = await import("./notifications.repo");
      await insertMany(
        admins.map((a) => ({
          user_id: a.user_id,
          title: "طلب اشتراك VIP جديد",
          body: "تم رفع إيصال جديد بانتظار الموافقة",
          link: "/admin/vip",
        })),
      );
    }
    return { id: inserted.id };
  });

export const attachVipReceipt = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; receipt_path: string }) => {
    if (!data?.id || !data?.receipt_path) throw new Error("بيانات ناقصة");
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("vip_subscribers")
      .update({ receipt_path: data.receipt_path })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    // Notify all admins
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (admins && admins.length > 0) {
      const { insertMany } = await import("./notifications.repo");
      await insertMany(
        admins.map((a) => ({
          user_id: a.user_id,
          title: "طلب اشتراك VIP جديد",
          body: "تم رفع إيصال جديد بانتظار الموافقة",
          link: "/admin/vip",
        })),
      );
    }
    return { ok: true };
  });

export const approveVipSubscriber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("vip_subscribers")
      .update({ status: "active" })
      .eq("id", data.id)
      .select("email,name,plan")
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (row?.email) {
      try {
        const { sendResendEmail } = await import("./resend-send.server");
        const planText = row.plan ? ` (${row.plan})` : "";
        await sendResendEmail({
          to: row.email,
          subject: "تم تفعيل اشتراك VIP ✅",
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><h2>مرحباً ${row.name ?? ""},</h2><p>تم <strong>تفعيل</strong> اشتراكك في باقة VIP${planText} بنجاح.</p><p>يمكنك الآن الاستفادة من جميع مزايا الاشتراك.</p><p>شكراً لثقتك بنا.</p></div>`,
        });
      } catch (e) {
        console.error("vip approval email error", e);
      }
    }
    return { ok: true };
  });

export const rejectVipSubscriber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("vip_subscribers")
      .update({ status: "rejected" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
