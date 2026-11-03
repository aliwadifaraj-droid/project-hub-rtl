import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listTeachers } from "@/lib/haraj.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Loader2, Hammer, MapPin, Phone, UserPlus, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/haraj")({
  head: () => ({
    meta: [
      { title: "حراج المعلمين — منصة حرفيين" },
      { name: "description", content: "تصفح المعلمين والحرفيين المسجلين في المنصة." },
    ],
  }),
  component: HarajListPage,
});

function HarajListPage() {
  const list = useServerFn(listTeachers);
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["haraj-teachers"],
    queryFn: () => list(),
  });

  const filtered = (data ?? []).filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.full_name.toLowerCase().includes(q) ||
      t.city.toLowerCase().includes(q) ||
      t.profession.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <SiteHeader />
      <main className="container mx-auto flex-1 px-4 py-10">
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-l from-amber-500/10 to-orange-500/5 border border-amber-500/20 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-amber-500/15 text-amber-600">
                <Hammer className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-foreground">حراج المعلمين</h1>
                <p className="text-sm text-muted-foreground">منصة لعرض المعلمين والحرفيين في المملكة</p>
              </div>
            </div>
            <Link
              to="/haraj/register"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:bg-foreground/90"
            >
              <UserPlus className="h-4 w-4" /> سجّل كمعلم
            </Link>
          </div>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، المدينة، أو المهنة..."
            className="w-full rounded-lg border border-border bg-card py-2.5 pr-10 pl-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
          />
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-destructive">{(error as Error).message}</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            {data && data.length > 0
              ? "لا توجد نتائج مطابقة لبحثك."
              : "لا يوجد معلمون مسجلون حالياً. كن أول من يسجّل!"}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="group overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-lg hover:border-amber-500/30"
              >
                <div className="flex items-center gap-3 border-b border-border/60 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-500/15 text-amber-600 font-bold text-sm">
                    {t.full_name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-foreground">{t.full_name}</h3>
                    <span className="text-xs text-amber-600 font-medium">{t.profession}</span>
                  </div>
                </div>
                <div className="space-y-2 p-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0 text-amber-500/70" />
                    <span>{t.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0 text-amber-500/70" />
                    <span dir="ltr">{t.phone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
