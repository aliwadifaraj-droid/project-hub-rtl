import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminListTeachers, deleteTeacher, toggleBanTeacher } from "@/lib/haraj.functions";
import { Loader2, Hammer, Trash2, Ban, Unlock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/haraj")({
  component: AdminHarajPage,
});

function AdminHarajPage() {
  const list = useServerFn(adminListTeachers);
  const remove = useServerFn(deleteTeacher);
  const toggleBan = useServerFn(toggleBanTeacher);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-haraj-teachers"],
    queryFn: () => list(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("تم حذف المعلم");
      qc.invalidateQueries({ queryKey: ["admin-haraj-teachers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const banMut = useMutation({
    mutationFn: (id: string) => toggleBan({ data: { id } }),
    onSuccess: (res: { ok: boolean; status: string }) => {
      toast.success(res.status === "banned" ? "تم حظر المعلم" : "تم فك الحظر");
      qc.invalidateQueries({ queryKey: ["admin-haraj-teachers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  if (error) return <p className="text-destructive">{(error as Error).message}</p>;

  const rows = data?.rows ?? [];
  const isAdmin = data?.isAdmin ?? false;

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Hammer className="h-5 w-5 text-amber-600" />
        <h1 className="text-2xl font-bold">حراج المعلمين</h1>
        <span className="rounded-full bg-amber-500/15 px-3 py-0.5 text-xs font-medium text-amber-600">
          {rows.length} معلم
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          لا يوجد معلمون مسجلون حالياً.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-right">
                <th className="px-4 py-3 font-semibold">الاسم</th>
                <th className="px-4 py-3 font-semibold">الجوال</th>
                <th className="px-4 py-3 font-semibold">المدينة</th>
                <th className="px-4 py-3 font-semibold">المهنة</th>
                <th className="px-4 py-3 font-semibold">البريد</th>
                <th className="px-4 py-3 font-semibold">تاريخ التسجيل</th>
                <th className="px-4 py-3 font-semibold">الحالة</th>
                {isAdmin && <th className="px-4 py-3 font-semibold">إجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-border/60 last:border-0 hover:bg-secondary/20 transition"
                >
                  <td className="px-4 py-3 font-medium text-foreground">{t.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground" dir="ltr">{t.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.city}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                      {t.profession}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" dir="ltr">{t.email}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(t.created_at).toLocaleDateString("ar")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.status === "banned"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-green-500/15 text-green-600"
                      }`}
                    >
                      {t.status === "banned" ? "محظور" : "نشط"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (confirm("حذف هذا المعلم نهائياً؟")) deleteMut.mutate(t.id);
                          }}
                          disabled={deleteMut.isPending || banMut.isPending}
                          className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2.5 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                          title="حذف"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> حذف
                        </button>
                        <button
                          onClick={() => banMut.mutate(t.id)}
                          disabled={deleteMut.isPending || banMut.isPending}
                          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                            t.status === "banned"
                              ? "border-green-500/40 text-green-600 hover:bg-green-500/10"
                              : "border-orange-500/40 text-orange-600 hover:bg-orange-500/10"
                          }`}
                          title={t.status === "banned" ? "فك الحظر" : "حظر"}
                        >
                          {t.status === "banned" ? (
                            <>
                              <Unlock className="h-3.5 w-3.5" /> فك الحظر
                            </>
                          ) : (
                            <>
                              <Ban className="h-3.5 w-3.5" /> حظر
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
