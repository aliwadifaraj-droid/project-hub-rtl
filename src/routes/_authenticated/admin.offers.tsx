import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { adminListOffers, adminUpdateOfferStatus, adminGetOfferPdfUrl } from "@/lib/offers.functions";

export const Route = createFileRoute("/_authenticated/admin/offers")({
  head: () => ({
    meta: [
      { title: "عروض الأسعار | لوحة العمران" },
      { name: "description", content: "إدارة عروض الأسعار المقدمة من الشركات على مشاريع العمران." },
      { property: "og:title", content: "عروض الأسعار | لوحة العمران" },
      { property: "og:description", content: "إدارة عروض الأسعار المقدمة من الشركات على مشاريع العمران." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminOffersPage,
});

const STATUS_LABEL: Record<string, string> = {
  new: "جديد", reviewing: "قيد المراجعة", accepted: "مقبول", rejected: "مرفوض",
};

function AdminOffersPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListOffers);
  const updateFn = useServerFn(adminUpdateOfferStatus);
  const pdfFn = useServerFn(adminGetOfferPdfUrl);

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["admin-offers"],
    queryFn: () => listFn(),
  });

  async function openPdf(key: string) {
    const { url } = await pdfFn({ data: { key } });
    window.open(url, "_blank", "noopener");
  }

  async function setStatus(id: string, status: "new" | "reviewing" | "accepted" | "rejected") {
    await updateFn({ data: { id, status } });
    qc.invalidateQueries({ queryKey: ["admin-offers"] });
  }

  return (
    <div className="space-y-4" dir="rtl">
      <h1 className="text-xl font-bold">عروض الأسعار</h1>
      {isLoading && <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>}
      {!isLoading && offers.length === 0 && (
        <p className="text-sm text-muted-foreground">لا توجد عروض حتى الآن.</p>
      )}
      <div className="grid gap-3">
        {offers.map((o) => (
          <div key={o.id} className="rounded-xl border border-border bg-card p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold">{o.company_name}</div>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px]">
                {STATUS_LABEL[o.status] ?? o.status}
              </span>
            </div>
            <div className="mt-1 grid gap-0.5 text-muted-foreground">
              <span>المشروع: {o.project_name}</span>
              <span>القيمة: {o.amount}</span>
              {o.duration && <span>مدة المشروع: {o.duration}</span>}
              <span>البريد: {o.email}</span>
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
                  onClick={() => setStatus(o.id, s)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
