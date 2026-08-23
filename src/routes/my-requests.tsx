import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { searchRequests } from "@/lib/admin.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Search, Loader2, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/my-requests")({
  component: MyRequests,
});

const STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "جديد", cls: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  reviewing: { label: "قيد المراجعة", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  accepted: { label: "مقبول", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  rejected: { label: "مرفوض", cls: "bg-red-500/15 text-red-700 dark:text-red-300" },
};

type Row = {
  id: string;
  company_name: string;
  facility_location: string;
  status: string;
  created_at: string;
  projects: { name: string } | null;
};

function MyRequests() {
  const search = useServerFn(searchRequests);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const r = await search({ data: { q: q.trim() } });
      setRows(r as Row[]);
      setSearched(true);
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-[image:var(--gradient-accent)] text-accent-foreground">
              <ClipboardList className="h-7 w-7" />
            </span>
            <h1 className="mt-4 text-3xl md:text-4xl font-extrabold">طلباتي</h1>
            <p className="mt-2 text-muted-foreground">ابحث باسم شركتك لعرض جميع العروض التي قدّمتها وحالتها الحالية.</p>
          </div>

          <form onSubmit={onSearch} className="mt-8 flex gap-2">
            <input
              type="text" required value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="اكتب اسم الشركة..."
              className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button type="submit" disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-5 py-3 text-sm font-bold text-background hover:bg-foreground/90 disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} بحث
            </button>
          </form>

          <div className="mt-8">
            {searched && rows && rows.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                لا توجد طلبات باسم "{q}"
              </div>
            ) : null}
            {rows && rows.length > 0 ? (
              <div className="space-y-3">
                {rows.map((r) => {
                  const s = STATUS[r.status] ?? STATUS.new;
                  return (
                    <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold">{r.projects?.name ?? "مشروع"}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{r.company_name}</span> • {r.facility_location}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("ar")}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.cls}`}>{s.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
