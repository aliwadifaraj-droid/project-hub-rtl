import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminListTeachers } from "@/lib/teachers.functions";
import { Loader2, Search, HardHat, Mail, MapPin, Briefcase, Calendar, Check, Clock, CreditCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/teachers")({
  component: AdminTeachersPage,
});

function AdminTeachersPage() {
  const fetchTeachers = useServerFn(adminListTeachers);
  const [search, setSearch] = useState("");

  const { data: teachers, isLoading } = useQuery({
    queryKey: ["admin-teachers"],
    queryFn: () => fetchTeachers(),
  });

  const filtered = (teachers ?? []).filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.full_name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.city.toLowerCase().includes(q) ||
      t.profession.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
          <HardHat className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold">حراج المعلمين</h1>
          <p className="text-sm text-muted-foreground">جميع المعلمين المسجلين</p>
        </div>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم، البريد، المدينة، أو المهنة..."
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 ps-10 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          لا يوجد معلمون مسجلون بعد.
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            العدد الكلي: <span className="font-bold text-foreground">{filtered.length}</span> معلم
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50 text-right">
                    <th className="px-4 py-3 font-semibold">الاسم</th>
                    <th className="px-4 py-3 font-semibold">البريد</th>
                    <th className="px-4 py-3 font-semibold">المدينة</th>
                    <th className="px-4 py-3 font-semibold">المهنة</th>
                    <th className="px-4 py-3 font-semibold">الاشتراك</th>
                    <th className="px-4 py-3 font-semibold">تاريخ التسجيل</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const isActive = t.subscription_status === "active";
                    const expiresAt = t.subscription_expires_at
                      ? new Date(t.subscription_expires_at).toLocaleDateString("ar-SA")
                      : null;
                    return (
                      <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="px-4 py-3 font-medium">{t.full_name}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" /> {t.email}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" /> {t.city}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" /> {t.profession}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-600">
                              <Check className="h-3 w-3" />
                              {t.subscription_plan === "month" ? "شهر" : "شهرين"} - {expiresAt}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                              <Clock className="h-3 w-3" /> غير مشترك
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> {new Date(t.created_at).toLocaleDateString("ar")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
