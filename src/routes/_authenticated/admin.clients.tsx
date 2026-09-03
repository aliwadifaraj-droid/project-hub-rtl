import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminListClients, adminGetClientDetail, adminToggleClientStatus } from "@/lib/admin.functions";
import { adminDeleteClient } from "@/lib/client-admin.functions";
import { Loader2, Search, ArrowRight, FileText, ClipboardList, Star, Mail, MapPin, Calendar, Phone, Building2, FileBadge, Hash, Ban, CheckCircle2, Trash2, Send, Users, User, Copy, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clients")({
  component: ClientsPage,
});

function ClientsPage() {
  const list = useServerFn(adminListClients);
  const [q, setQ] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: () => list(),
  });

  const rows = (data ?? []).filter((c) => {
    if (!q.trim()) return true;
    const query = q.trim().toLowerCase();
    return c.email.toLowerCase().includes(query) || (c.display_name ?? "").toLowerCase().includes(query);
  });

  if (selectedEmail) {
    return <ClientDetail email={selectedEmail} onBack={() => setSelectedEmail(null)} />;
  }

  return (
    <div dir="rtl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl md:text-2xl font-bold">متابعة العملاء ({rows.length})</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالبريد أو الاسم..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full sm:w-64 rounded-md border border-slate-600 bg-slate-800 py-2 pr-9 pl-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-lg">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-800 text-slate-200">
                <tr>
                  <th className="p-3 font-semibold">البريد</th>
                  <th className="p-3 font-semibold">الاسم</th>
                  <th className="p-3 font-semibold">العروض</th>
                  <th className="p-3 font-semibold">الطلبات</th>
                  <th className="p-3 font-semibold">حالة VIP</th>
                  <th className="p-3 font-semibold">آخر عرض</th>
                  <th className="p-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.email} className="border-t border-slate-800 hover:bg-slate-800/50">
                    <td className="p-3 font-medium">
                      <div className="flex flex-col gap-1">
                        <CopyableId id={c.user_id} />
                        <span>{c.email}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-300">{c.display_name || "—"}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs text-blue-300">{c.offers_count}</span>
                    </td>
                    <td className="p-3">
                      <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs text-amber-300">{c.requests_count}</span>
                    </td>
                    <td className="p-3">
                      {c.vip_status ? (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs ${c.vip_status === "active" || c.vip_status === "approved" ? "bg-green-500/20 text-green-300" : "bg-slate-600 text-slate-300"}`}>
                          {c.vip_status}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">لا يوجد</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400 text-xs">
                      {c.last_offer_at ? new Date(c.last_offer_at).toLocaleDateString("ar") : "—"}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedEmail(c.email)}
                        className="inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition hover:bg-foreground/90"
                      >
                        متابعة <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      لا يوجد عملاء
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-slate-800">
            {rows.map((c) => (
              <div key={c.email} className="p-4 space-y-2">
                <CopyableId id={c.user_id} />
                <div className="font-bold">{c.email}</div>
                <div className="text-sm text-slate-300">{c.display_name || "—"}</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-blue-300">عروض: {c.offers_count}</span>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-300">طلبات: {c.requests_count}</span>
                  {c.vip_status && (
                    <span className={`rounded-full px-2 py-0.5 ${c.vip_status === "active" || c.vip_status === "approved" ? "bg-green-500/20 text-green-300" : "bg-slate-600 text-slate-300"}`}>
                      VIP: {c.vip_status}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedEmail(c.email)}
                  className="inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition hover:bg-foreground/90"
                >
                  متابعة <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
            {rows.length === 0 && (
              <div className="p-8 text-center text-slate-400">لا يوجد عملاء</div>
            )}
          </div>
        </div>
      )}

      <PushNotificationsSection />
    </div>
  );
}

function CopyableId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-slate-700"
    >
      <Hash className="h-3 w-3 text-slate-400" />
      <span className="font-mono text-[11px]">{id.slice(0, 8)}…{id.slice(-4)}</span>
      {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3 text-slate-400" />}
    </button>
  );
}

function PushNotificationsSection() {
  const [broadcastTitle, setBroadcastTitle] = useState("إشعار من الإدارة");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [singleUserId, setSingleUserId] = useState("");
  const [singleTitle, setSingleTitle] = useState("");
  const [singleBody, setSingleBody] = useState("");
  const [sending, setSending] = useState<"idle" | "broadcast" | "single">("idle");
  const [broadcastResult, setBroadcastResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [singleResult, setSingleResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function sendBroadcast() {
    if (!broadcastBody.trim()) {
      setBroadcastResult({ ok: false, message: "الرجاء كتابة نص الإشعار" });
      return;
    }
    setSending("broadcast");
    setBroadcastResult(null);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: broadcastTitle.trim(), body: broadcastBody.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setBroadcastResult({ ok: true, message: `تم الإرسال بنجاح: ${data.sent} وصل، ${data.failed} فشل${data.cleaned ? `، ${data.cleaned} اشتراك منتهي تم حذفه` : ""}` });
      } else {
        setBroadcastResult({ ok: false, message: data.error ?? "فشل الإرسال" });
      }
    } catch (e) {
      setBroadcastResult({ ok: false, message: e instanceof Error ? e.message : "حدث خطأ" });
    } finally {
      setSending("idle");
    }
  }

  async function sendSingle() {
    if (!singleUserId.trim()) {
      setSingleResult({ ok: false, message: "الرجاء إدخال ID العميل" });
      return;
    }
    if (!singleBody.trim()) {
      setSingleResult({ ok: false, message: "الرجاء كتابة نص الإشعار" });
      return;
    }
    setSending("single");
    setSingleResult(null);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: singleTitle.trim(), body: singleBody.trim(), userId: singleUserId.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setSingleResult({ ok: true, message: data.sent > 0 ? `تم الإرسال للعميل: ${data.sent} وصل` : "لا توجد اشتراكات لهذا العميل" });
      } else {
        setSingleResult({ ok: false, message: data.error ?? "فشل الإرسال" });
      }
    } catch (e) {
      setSingleResult({ ok: false, message: e instanceof Error ? e.message : "حدث خطأ" });
    } finally {
      setSending("idle");
    }
  }

  return (
    <div className="mt-6 space-y-6">
      {/* الإرسال الجماعي */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-lg">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-100">
          <Send className="h-5 w-5 text-blue-400" /> إرسال إشعارات Push
        </h2>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Users className="h-4 w-4 text-blue-400" /> الإرسال الجماعي
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-200">عنوان الإشعار</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="عنوان الإشعار..."
                  className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-200">نص الإشعار</label>
                <textarea
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  placeholder="اكتب نص الإشعار هنا..."
                  rows={4}
                  className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
              <button
                onClick={sendBroadcast}
                disabled={sending !== "idle"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {sending === "broadcast" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                إرسال جماعي
              </button>
            </div>
          </div>

          {broadcastResult && (
            <div className={`rounded-lg px-4 py-3 text-sm ${broadcastResult.ok ? "bg-green-500/10 text-green-300 border border-green-500/20" : "bg-red-500/10 text-red-300 border border-red-500/20"}`}>
              {broadcastResult.message}
            </div>
          )}
        </div>
      </div>

      {/* إرسال إشعار فردي */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-lg">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-100">
          <User className="h-5 w-5 text-emerald-400" /> إرسال إشعار فردي
        </h2>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <User className="h-4 w-4 text-emerald-400" /> الإرسال الفردي
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-200">ID العميل</label>
                <input
                  type="text"
                  value={singleUserId}
                  onChange={(e) => setSingleUserId(e.target.value)}
                  placeholder="ألصق ID العميل هنا..."
                  className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-200">عنوان الإشعار</label>
                <input
                  type="text"
                  value={singleTitle}
                  onChange={(e) => setSingleTitle(e.target.value)}
                  placeholder="عنوان الإشعار..."
                  className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-200">نص الإشعار</label>
                <textarea
                  value={singleBody}
                  onChange={(e) => setSingleBody(e.target.value)}
                  placeholder="اكتب نص الإشعار هنا..."
                  rows={4}
                  className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>

              <button
                onClick={sendSingle}
                disabled={sending !== "idle"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {sending === "single" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                إرسال فردي
              </button>
            </div>
          </div>

          {singleResult && (
            <div className={`rounded-lg px-4 py-3 text-sm ${singleResult.ok ? "bg-green-500/10 text-green-300 border border-green-500/20" : "bg-red-500/10 text-red-300 border border-red-500/20"}`}>
              {singleResult.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClientDetail({ email, onBack }: { email: string; onBack: () => void }) {
  const getDetail = useServerFn(adminGetClientDetail);
  const toggleStatus = useServerFn(adminToggleClientStatus);
  const deleteClient = useServerFn(adminDeleteClient);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-client-detail", email],
    queryFn: () => getDetail({ data: { email } }),
  });

  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    if (!data?.profile) return;
    const newStatus = data.profile.status === "active" ? "blocked" : "active";
    setToggling(true);
    try {
      await toggleStatus({ data: { email, status: newStatus } });
      await queryClient.invalidateQueries({ queryKey: ["admin-client-detail", email] });
      await queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(false);
    }
  };

  if (isLoading)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );

  if (!data) return <div className="text-center text-slate-400 py-10">لا توجد بيانات</div>;

  const handleDelete = async () => {
    if (!window.confirm("سيتم حذف حساب العميل نهائياً ولا يمكن التراجع عن هذا الإجراء. هل تريد المتابعة؟")) return;
    setDeleting(true);
    try {
      await deleteClient({ data: { email } });
      await queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      onBack();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowRight className="h-4 w-4" /> العودة لقائمة العملاء
      </button>

      <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-100">
              {data.profile?.company_name || data.email}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-slate-400" /> {data.email}
              </span>
              {data.profile?.status && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  data.profile.status === "active" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                }`}>
                  {data.profile.status === "active" ? "نشط" : "موقوف"}
                </span>
              )}
            </div>
          </div>
          {data.profile && (
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                data.profile.status === "active"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {toggling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : data.profile.status === "active" ? (
                <Ban className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {data.profile.status === "active" ? "إيقاف الحساب" : "تنشيط الحساب"}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            حذف الحساب نهائياً
          </button>
        </div>

        {data.profile && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Building2 className="h-4 w-4 text-blue-400" /> بيانات التسجيل
              </div>
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-start gap-2">
                  <dt className="flex shrink-0 items-center gap-1.5 text-slate-400"><Building2 className="h-3.5 w-3.5" /> الشركة:</dt>
                  <dd className="text-slate-200">{data.profile.company_name || "—"}</dd>
                </div>
                <div className="flex items-start gap-2">
                  <dt className="flex shrink-0 items-center gap-1.5 text-slate-400"><Mail className="h-3.5 w-3.5" /> البريد:</dt>
                  <dd className="text-slate-200">{data.email}</dd>
                </div>
                <div className="flex items-start gap-2">
                  <dt className="flex shrink-0 items-center gap-1.5 text-slate-400"><Phone className="h-3.5 w-3.5" /> الجوال:</dt>
                  <dd className="text-slate-200">{data.profile.phone || "—"}</dd>
                </div>
                <div className="flex items-start gap-2">
                  <dt className="flex shrink-0 items-center gap-1.5 text-slate-400"><MapPin className="h-3.5 w-3.5" /> المدينة:</dt>
                  <dd className="text-slate-200">{data.profile.city || "—"}</dd>
                </div>
                <div className="flex items-start gap-2">
                  <dt className="flex shrink-0 items-center gap-1.5 text-slate-400"><FileBadge className="h-3.5 w-3.5" /> السجل التجاري:</dt>
                  <dd className="text-slate-200">{data.profile.cr_number || "—"}</dd>
                </div>
                <div className="flex items-start gap-2">
                  <dt className="flex shrink-0 items-center gap-1.5 text-slate-400"><Calendar className="h-3.5 w-3.5" /> تاريخ التسجيل:</dt>
                  <dd className="text-slate-200">{data.profile.created_at ? new Date(data.profile.created_at).toLocaleDateString("ar") : "—"}</dd>
                </div>
              </dl>
            </div>

            {data.profile.bio && (
              <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <FileText className="h-4 w-4 text-blue-400" /> النبذة التعريفية
                </div>
                <p className="text-sm leading-relaxed text-slate-300">{data.profile.bio}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-lg">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-100">
            <FileText className="h-5 w-5 text-blue-400" /> العروض المقدمة ({data.offers.length})
          </h2>
          <div className="space-y-3">
            {data.offers.length === 0 ? (
              <p className="text-sm text-slate-500">لا توجد عروض</p>
            ) : (
              data.offers.map((o) => (
                <div key={o.id} className="rounded-lg border border-slate-800 bg-slate-800/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-200">{o.project_name || "—"}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      o.status === "accepted" ? "bg-green-500/20 text-green-300" :
                      o.status === "rejected" ? "bg-red-500/20 text-red-300" :
                      o.status === "reviewing" ? "bg-amber-500/20 text-amber-300" :
                      "bg-slate-600 text-slate-300"
                    }`}>{o.status}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                    {o.company_name && <span>{o.company_name}</span>}
                    {o.amount && <span>المبلغ: {o.amount}</span>}
                    {o.facility_location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{o.facility_location}</span>}
                    {o.duration && <span>المدة: {o.duration}</span>}
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(o.created_at).toLocaleDateString("ar")}</span>
                  </div>
                  {o.pdf_key && (
                    <a
                      href={`#`}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
                    >
                      <FileText className="h-3 w-3" /> ملف PDF
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-lg">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-100">
            <ClipboardList className="h-5 w-5 text-amber-400" /> الطلبات ({data.requests.length})
          </h2>
          <div className="space-y-3">
            {data.requests.length === 0 ? (
              <p className="text-sm text-slate-500">لا توجد طلبات</p>
            ) : (
              data.requests.map((r) => (
                <div key={r.id} className="rounded-lg border border-slate-800 bg-slate-800/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-200">{r.company_name || "—"}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      r.status === "accepted" ? "bg-green-500/20 text-green-300" :
                      r.status === "rejected" ? "bg-red-500/20 text-red-300" :
                      r.status === "reviewing" ? "bg-amber-500/20 text-amber-300" :
                      "bg-slate-600 text-slate-300"
                    }`}>{r.status}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                    {r.facility_location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{r.facility_location}</span>}
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(r.created_at).toLocaleDateString("ar")}</span>
                    {r.project_type && <span>النوع: {r.project_type}</span>}
                  </div>
                  {r.note && <p className="mt-2 text-xs text-slate-400 border-t border-slate-800 pt-2">{r.note}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {data.vipSubs.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-lg">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-100">
            <Star className="h-5 w-5 text-yellow-400" /> اشتراكات VIP ({data.vipSubs.length})
          </h2>
          <div className="space-y-3">
            {data.vipSubs.map((v) => (
              <div key={v.id} className="rounded-lg border border-slate-800 bg-slate-800/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-200">{v.plan || "—"}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    v.status === "active" || v.status === "approved" ? "bg-green-500/20 text-green-300" :
                    v.status === "expired" ? "bg-red-500/20 text-red-300" :
                    "bg-slate-600 text-slate-300"
                  }`}>{v.status}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                  {v.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{v.city}</span>}
                  {v.expires_at && <span>ينتهي: {new Date(v.expires_at).toLocaleDateString("ar")}</span>}
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(v.created_at).toLocaleDateString("ar")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
