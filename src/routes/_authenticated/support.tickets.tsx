import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyTickets } from "@/lib/tickets.functions";
import { Plus, MessageSquare, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/support/tickets")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "تذاكري | العمران" },
      { name: "description", content: "عرض وإدارة تذاكر الدعم الخاصة بك" },
    ],
  }),
  component: MyTicketsPage,
});

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: "bg-blue-100", text: "text-blue-800", label: "مفتوحة" },
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "قيد المعالجة" },
  resolved: { bg: "bg-green-100", text: "text-green-800", label: "تم الحل" },
  closed: { bg: "bg-gray-100", text: "text-gray-600", label: "مغلقة" },
};

const CATEGORY_LABELS: Record<string, string> = {
  order: "طلب",
  payment: "دفع",
  technical: "فني",
  general: "استفسار عام",
};

function MyTicketsPage() {
  const navigate = useNavigate();
  const listFn = useServerFn(listMyTickets);
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["my-tickets"],
    queryFn: () => listFn(),
  });

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">تذاكري</h1>
          <button
            onClick={() => navigate({ to: "/support/tickets/new" })}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            تذكرة جديدة
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-sm text-muted-foreground">لا توجد تذاكر بعد</p>
            <Link
              to="/support/tickets/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-primary transition hover:bg-secondary"
            >
              <Plus className="h-4 w-4" />
              افتح تذكرة جديدة
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {tickets.map((t) => {
              const st = STATUS_STYLES[t.status] ?? STATUS_STYLES.open;
              return (
                <Link
                  key={t.id}
                  to="/support/tickets/$id"
                  params={{ id: t.id }}
                  className="block rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {CATEGORY_LABELS[t.category] ?? t.category}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground/70">
                      {new Date(t.created_at * 1000).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold">{t.subject}</h3>
                  {t.order_id && (
                    <p className="mt-1 text-xs text-muted-foreground">رقم الطلب: {t.order_id}</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
