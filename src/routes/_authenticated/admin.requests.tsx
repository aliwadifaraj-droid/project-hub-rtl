import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminListRequests, updateRequestStatus, getBidPdfUrl } from "@/lib/admin.functions";
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

function RequestsPage() {
  const list = useServerFn(adminListRequests);
  const update = useServerFn(updateRequestStatus);
  const getUrl = useServerFn(getBidPdfUrl);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-requests"], queryFn: () => list() });

  const mut = useMutation({
    mutationFn: (v: { id: string; status: "new" | "reviewing" | "accepted" | "rejected" }) =>
      update({ data: v }),
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
    } catch (e) {
      toast.error("تعذر فتح الملف");
    }
  }

  if (isLoading) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">الطلبات الواردة ({data?.length ?? 0})</h1>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-right">
              <tr>
                <th className="p-3 font-semibold">الشركة</th>
                <th className="p-3 font-semibold">المشروع</th>
                <th className="p-3 font-semibold">الموقع</th>
                <th className="p-3 font-semibold">الحالة</th>
                <th className="p-3 font-semibold">ملف PDF</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 font-medium">{r.company_name}</td>
                  <td className="p-3 text-muted-foreground">{(r.projects as { name: string } | null)?.name ?? "-"}</td>
                  <td className="p-3 text-muted-foreground">{r.facility_location}</td>
                  <td className="p-3">
                    <select
                      value={r.status}
                      onChange={(e) => mut.mutate({ id: r.id, status: e.target.value as "new" | "reviewing" | "accepted" | "rejected" })}
                      className={`rounded-md border border-border px-2 py-1 text-xs font-medium ${STATUS[r.status as keyof typeof STATUS].cls}`}
                    >
                      {Object.entries(STATUS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <button onClick={() => openPdf(r.pdf_url)} className="inline-flex items-center gap-1 text-accent hover:underline">
                      <FileDown className="h-4 w-4" /> فتح
                    </button>
                  </td>
                </tr>
              ))}
              {(data ?? []).length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">لا توجد طلبات بعد</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
