import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminListClients, adminGetClientDetail } from "@/lib/admin.functions";
import { Loader2, Search, ArrowRight, FileText, ClipboardList, Star, Mail, MapPin, Calendar } from "lucide-react";

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
                    <td className="p-3 font-medium">{c.email}</td>
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
    </div>
  );
}

function ClientDetail({ email, onBack }: { email: string; onBack: () => void }) {
  const getDetail = useServerFn(adminGetClientDetail);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-client-detail", email],
    queryFn: () => getDetail({ data: { email } }),
  });

  if (isLoading)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );

  if (!data) return <div className="text-center text-slate-400 py-10">لا توجد بيانات</div>;

  return (
    <div dir="rtl" className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowRight className="h-4 w-4" /> العودة لقائمة العملاء
      </button>

      <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-lg">
        <h1 className="text-xl font-bold text-slate-100">{data.email}</h1>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-slate-400" /> {data.email}
          </span>
        </div>
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
