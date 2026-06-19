import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminListRequests, updateRequestStatus, getBidPdfUrl, getMyRoles } from "@/lib/admin.functions";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/requests")({
  component: RequestsPage,
});

const STATUS = {
  new: { label: "جديد", cls: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  reviewing: { label: "قيد المراجعة", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  accepted: { label: "مقبول", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  rejected: { label: "مرفوض", cls: "bg-red-500/15 text-red-700 dark:text-red-300" },
} as const;

type Status = keyof typeof STATUS;

function RequestsPage() {
  const list = useServerFn(adminListRequests);
  const update = useServerFn(updateRequestStatus);
  const getUrl = useServerFn(getBidPdfUrl);
  const getRoles = useServerFn(getMyRoles);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-requests"], queryFn: () => list() });
  const { data: roles } = useQuery({ queryKey: ["my-roles"], queryFn: () => getRoles() });
  const isAdmin = roles?.includes("admin");

  const mut = useMutation({
    mutationFn: (v: { id: string; status: Status }) => update({ data: v }),
    onSuccess: () => {
      toast.success("تم تحديث الحالة");
      qc.invalidateQueries({ queryKey: ["admin-requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function openPdf(path: string) {
    try {
      const url = await getUrl({ data: { path } });
      window.open(url, "_blank");
    } catch {
      toast.error("تعذر فتح الملف");
    }
  }

  if (isLoading)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );

  const rows = data ?? [];

  return (
    <div dir="rtl">
      <h1 className="mb-4 text-xl md:text-2xl font-bold">الطلبات الواردة ({rows.length})</h1>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-lg">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-800 text-slate-200">
              <tr>
                <th className="p-3 font-semibold">الشركة</th>
                <th className="p-3 font-semibold">المشروع</th>
                <th className="p-3 font-semibold">موقع المنشأة</th>
                <th className="p-3 font-semibold">التاريخ</th>
                <th className="p-3 font-semibold">الحالة</th>
                <th className="p-3 font-semibold">عرض السعر</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                  <td className="p-3 font-medium">{r.company_name}</td>
                  <td className="p-3 text-slate-300">
                    <div>{(r.projects as { name: string } | null)?.name ?? "-"}</div>
                    {r.submitter_type && <SubmitterBadge type={r.submitter_type as "guest" | "user"} />}
                  </td>
                  <td className="p-3 text-slate-300">{r.facility_location}</td>
                  <td className="p-3 text-slate-400 text-xs">{new Date(r.created_at).toLocaleDateString("ar")}</td>
                  <td className="p-3">
                    {isAdmin ? (
                      <select
                        value={r.status}
                        onChange={(e) => mut.mutate({ id: r.id, status: e.target.value as Status })}
                        className={`rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs font-medium ${STATUS[r.status as Status].cls}`}
                      >
                        {Object.entries(STATUS).map(([k, v]) => (
                          <option key={k} value={k} className="bg-slate-800 text-slate-100">{v.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS[r.status as Status].cls}`}>
                        {STATUS[r.status as Status].label}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <button onClick={() => openPdf(r.pdf_url)} className="inline-flex items-center gap-1 rounded-md bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-600">
                      <FileDown className="h-4 w-4" /> فتح PDF
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">لا توجد طلبات بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-slate-800">
          {rows.map((r) => (
            <div key={r.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold">{r.company_name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{(r.projects as { name: string } | null)?.name ?? "-"}</div>
                  {r.submitter_type && <SubmitterBadge type={r.submitter_type as "guest" | "user"} />}
                </div>
                {isAdmin ? (
                  <select
                    value={r.status}
                    onChange={(e) => mut.mutate({ id: r.id, status: e.target.value as Status })}
                    className={`shrink-0 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs font-medium ${STATUS[r.status as Status].cls}`}
                  >
                    {Object.entries(STATUS).map(([k, v]) => (
                      <option key={k} value={k} className="bg-slate-800 text-slate-100">{v.label}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS[r.status as Status].cls}`}>
                    {STATUS[r.status as Status].label}
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-300">📍 {r.facility_location}</div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString("ar")}</span>
                <button onClick={() => openPdf(r.pdf_url)} className="inline-flex items-center gap-1 rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium hover:bg-slate-600">
                  <FileDown className="h-4 w-4" /> فتح PDF
                </button>
              </div>
            </div>
          ))}
          {rows.length === 0 && <div className="p-8 text-center text-slate-400">لا توجد طلبات بعد</div>}
        </div>
      </div>
    </div>
  );
}

function SubmitterBadge({ type }: { type: "guest" | "user" }) {
  const isUser = type === "user";
  return (
    <span
      className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        isUser
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-amber-500/15 text-amber-300"
      }`}
    >
      {isUser ? "👤 مستخدم" : "🔔 زائر"}
    </span>
  );
}
