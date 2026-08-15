import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Ban, Loader2 } from "lucide-react";
import { adminListAddProjectOffers, adminUpdateOfferStatus, adminGetOfferPdfUrl } from "@/lib/offers.functions";
import { adminBlockCompany } from "@/lib/blocked.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/submissions")({
  component: SubmissionsPage,
});

const STATUS_LABEL: Record<string, string> = {
  new: "جديد",
  reviewing: "قيد المراجعة",
  accepted: "مقبول",
  rejected: "مرفوض",
};

function SubmissionsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListAddProjectOffers);
  const updateFn = useServerFn(adminUpdateOfferStatus);
  const pdfFn = useServerFn(adminGetOfferPdfUrl);
  const blockFn = useServerFn(adminBlockCompany);

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["admin-submissions-offers"],
    queryFn: () => listFn(),
  });

  async function openPdf(key: string) {
    const { url } = await pdfFn({ data: { key } });
    window.open(url, "_blank", "noopener");
  }

  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: "new" | "reviewing" | "accepted" | "rejected" }) =>
      updateFn({ data: v }),
    onSuccess: () => {
      toast.success("تم تحديث الحالة");
      qc.invalidateQueries({ queryKey: ["admin-submissions-offers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const blockMut = useMutation({
    mutationFn: (v: { company_name?: string; email?: string }) => blockFn({ data: v }),
    onSuccess: () => {
      toast.success("تم حظر الشركة");
      qc.invalidateQueries({ queryKey: ["admin-submissions-offers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading)
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">طلبات أضف مشروعك</h1>
        <span className="text-sm text-muted-foreground">{offers.length} طلب</span>
      </div>

      {offers.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
          لا توجد طلبات حالياً.
        </p>
      ) : (
        <div className="grid gap-4">
          {offers.map((o) => (
            <article key={o.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold text-lg">{o.company_name}</div>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
              </div>
              <div className="mt-2 grid gap-0.5 text-sm text-muted-foreground">
                <span>المشروع: {o.project_name}</span>
                <span>القيمة: {o.amount}</span>
                {o.duration && <span>مدة المشروع: {o.duration}</span>}
                <span dir="ltr" className="text-left">البريد: {o.email}</span>
                <span className="text-xs text-muted-foreground/70">
                  {new Date(o.created_at).toLocaleString("ar")}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {o.pdf_key && (
                  <button
                    onClick={() => openPdf(o.pdf_key!)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {o.pdf_filename ?? "عرض الملف"}
                  </button>
                )}
                {(["reviewing", "accepted", "rejected"] as const).map((s) => (
                  <button
                    key={s}
                    disabled={statusMut.isPending}
                    onClick={() => statusMut.mutate({ id: o.id, status: s })}
                    className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-60"
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
                <button
                  disabled={blockMut.isPending}
                  onClick={() => blockMut.mutate({ company_name: o.company_name, email: o.email })}
                  className="inline-flex items-center gap-1.5 rounded-md bg-red-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-60"
                >
                  {blockMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                  حظر
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
