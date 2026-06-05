import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminListSubmissions, approveSubmission, deleteSubmission } from "@/lib/admin.functions";
import { CheckCircle2, Trash2, Loader2, MapPin, Phone, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/submissions")({
  component: SubmissionsPage,
});

function SubmissionsPage() {
  const list = useServerFn(adminListSubmissions);
  const approve = useServerFn(approveSubmission);
  const remove = useServerFn(deleteSubmission);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-submissions"],
    queryFn: () => list(),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => approve({ data: { id } }),
    onSuccess: () => {
      toast.success("تم نشر المشروع");
      qc.invalidateQueries({ queryKey: ["admin-submissions"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin-submissions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">جارٍ التحميل...</div>;
  if (error) return <div className="p-8 text-center text-destructive">{(error as Error).message}</div>;

  const rows = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">طلبات إضافة المشاريع</h1>
        <span className="text-sm text-muted-foreground">{rows.length} طلب</span>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
          لا توجد طلبات حالياً.
        </p>
      ) : (
        <div className="grid gap-4">
          {rows.map((s) => (
            <article key={s.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold">{s.name}</h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      s.status === "approved"
                        ? "bg-accent/15 text-accent"
                        : "bg-secondary text-foreground"
                    }`}>
                      {s.status === "approved" ? "منشور" : "قيد المراجعة"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-foreground/85 whitespace-pre-wrap">{s.description}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{s.location}</span>
                    <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{s.contact_phone}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(s.created_at).toLocaleString("ar")}</span>
                  </div>
                  {s.image_urls.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {s.image_urls.map((u, i) => (
                        u ? <img key={i} src={u} alt="" className="aspect-square rounded-md object-cover" /> : null
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {s.status !== "approved" && (
                    <button
                      onClick={() => approveMut.mutate(s.id)}
                      disabled={approveMut.isPending}
                      className="inline-flex items-center gap-1.5 rounded-md bg-[image:var(--gradient-accent)] px-3 py-1.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-60"
                    >
                      {approveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      موافقة
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm("حذف الطلب نهائياً؟")) deleteMut.mutate(s.id); }}
                    disabled={deleteMut.isPending}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" /> حذف
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
