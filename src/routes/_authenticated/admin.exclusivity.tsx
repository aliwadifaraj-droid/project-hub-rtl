import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  searchProjectByName,
  updateExclusivityHours,
  toggleExclusivityOn,
  toggleExclusivityOff,
} from "@/lib/admin.functions";
import { Search, Loader2, Save, Play, Square, Clock, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_authenticated/admin/exclusivity")({
  component: ExclusivityPage,
});

type ExclusivityResult = {
  id: string;
  name: string;
  location: string | null;
  exclusive_hours: number;
  is_exclusive: boolean;
  exclusive_until: string | null;
  has_exclusive: boolean;
  vip_end_at: string | null;
  remaining_hours: number;
  active: boolean;
};

function ExclusivityPage() {
  const qc = useQueryClient();
  const searchFn = useServerFn(searchProjectByName);
  const updateHoursFn = useServerFn(updateExclusivityHours);
  const toggleOnFn = useServerFn(toggleExclusivityOn);
  const toggleOffFn = useServerFn(toggleExclusivityOff);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ExclusivityResult[]>([]);
  const [hoursMap, setHoursMap] = useState<Record<string, string>>({});

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const rows = await searchFn({ data: { q: query.trim() } });
      setResults(rows as ExclusivityResult[]);
      const map: Record<string, string> = {};
      for (const r of rows) map[r.id] = String(r.exclusive_hours ?? 6);
      setHoursMap(map);
    } catch {
      toast.error("تعذر البحث، حاول مرة أخرى.");
    } finally {
      setSearching(false);
    }
  }

  const saveHoursMut = useMutation({
    mutationFn: (vars: { projectId: string; hours: number }) =>
      updateHoursFn({ data: { projectId: vars.projectId, hours: vars.hours } }),
    onSuccess: () => {
      toast.success("تم حفظ عدد الساعات");
      qc.invalidateQueries({ queryKey: ["exclusivity-search"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleOnMut = useMutation({
    mutationFn: (vars: { projectId: string; hours: number }) =>
      toggleOnFn({ data: { projectId: vars.projectId, hours: vars.hours } }),
    onSuccess: () => {
      toast.success("تم تشغيل الحصرية");
      refreshResults();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleOffMut = useMutation({
    mutationFn: (projectId: string) =>
      toggleOffFn({ data: { projectId } }),
    onSuccess: () => {
      toast.success("تم إيقاف الحصرية");
      refreshResults();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function refreshResults() {
    if (!query.trim()) return;
    try {
      const rows = await searchFn({ data: { q: query.trim() } });
      setResults(rows as ExclusivityResult[]);
      const map: Record<string, string> = {};
      for (const r of rows) map[r.id] = String(r.exclusive_hours ?? 6);
      setHoursMap(map);
    } catch {}
  }

  return (
    <div dir="rtl">
      <Toaster position="top-center" dir="rtl" />
      <h1 className="text-2xl font-bold mb-2">لوحة تحكم الحصرية</h1>
      <p className="text-sm text-muted-foreground mb-6">
        ابحث عن مشروع لتعديل ساعات الحصرية الافتراضية أو تشغيل/إيقاف الحصرية يدوياً.
      </p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث باسم المشروع..."
            className="w-full rounded-lg border border-input bg-background pr-10 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          بحث
        </button>
      </form>

      {results.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          لا توجد نتائج. ابحث عن مشروع بالاسم.
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((r) => {
            const hours = hoursMap[r.id] ?? String(r.exclusive_hours ?? 6);
            const busy = saveHoursMut.isPending || toggleOnMut.isPending || toggleOffMut.isPending;
            return (
              <div
                key={r.id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base truncate">{r.name}</h3>
                    {r.location ? (
                      <p className="text-xs text-muted-foreground mt-0.5">{r.location}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          r.active
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {r.active ? (
                          <><Lock className="h-3 w-3" /> حصري - متبقي {r.remaining_hours} ساعة</>
                        ) : (
                          <><Unlock className="h-3 w-3" /> مفتوح للجميع</>
                        )}
                      </span>
                      {r.vip_end_at ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          ينتهي: {new Date(r.vip_end_at).toLocaleString("ar")}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={720}
                        value={hours}
                        onChange={(e) =>
                          setHoursMap((m) => ({ ...m, [r.id]: e.target.value }))
                        }
                        className="w-20 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-center"
                      />
                      <span className="text-xs text-muted-foreground">ساعة</span>
                    </div>
                    <button
                      onClick={() => {
                        const n = Number(hours);
                        if (!Number.isFinite(n) || n < 1 || n > 720) {
                          toast.error("الساعات يجب أن تكون بين 1 و 720");
                          return;
                        }
                        saveHoursMut.mutate({ projectId: r.id, hours: n });
                      }}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      <Save className="h-3.5 w-3.5" /> حفظ
                    </button>
                    <button
                      onClick={() => {
                        const n = Number(hours);
                        const h = Number.isFinite(n) && n > 0 ? n : 6;
                        toggleOnMut.mutate({ projectId: r.id, hours: h });
                      }}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      <Play className="h-3.5 w-3.5" /> تشغيل
                    </button>
                    <button
                      onClick={() => toggleOffMut.mutate(r.id)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      <Square className="h-3.5 w-3.5" /> إيقاف
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
