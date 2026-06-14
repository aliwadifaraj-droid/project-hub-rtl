import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPendingProjects, approveProject, rejectProject } from "@/lib/project-approval.functions";
import { Loader2, Check, X, ClipboardCheck, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/pending-projects")({
  component: PendingProjectsPage,
});

function PendingProjectsPage() {
  const list = useServerFn(listPendingProjects);
  const approve = useServerFn(approveProject);
  const reject = useServerFn(rejectProject);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["pending-projects"],
    queryFn: () => list(),
    refetchInterval: 30000,
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => approve({ data: { id } }),
    onSuccess: () => {
      toast.success("تمت الموافقة وإرسال إشعار للمنشئ");
      qc.invalidateQueries({ queryKey: ["pending-projects"] });
      qc.invalidateQueries({ queryKey: ["pending-projects-count"] });
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const rejectMut = useMutation({
    mutationFn: (v: { id: string; reason?: string }) => reject({ data: v }),
    onSuccess: () => {
      toast.success("تم الرفض");
      qc.invalidateQueries({ queryKey: ["pending-projects"] });
      qc.invalidateQueries({ queryKey: ["pending-projects-count"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  const rows = data ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5" />
        <h1 className="text-2xl font-bold">مشاريع بانتظار الموافقة ({rows.length})</h1>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          لا توجد مشاريع معلقة.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-card p-4">
              <h3 className="font-bold line-clamp-1">{p.name}</h3>
              {p.description ? <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{p.description}</p> : null}
              <div className="mt-2 text-xs text-muted-foreground">
                {p.location ? <span>📍 {p.location}</span> : null}
              </div>
              {p.creator_email ? (
                <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" /> {p.creator_email}
                </div>
              ) : null}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => approveMut.mutate(p.id)}
                  disabled={approveMut.isPending}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90 disabled:opacity-60"
                >
                  <Check className="h-3.5 w-3.5" /> موافقة
                </button>
                <button
                  onClick={() => {
                    const reason = prompt("سبب الرفض (اختياري):") ?? undefined;
                    rejectMut.mutate({ id: p.id, reason: reason || undefined });
                  }}
                  disabled={rejectMut.isPending}
                  className="inline-flex items-center justify-center gap-1 rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" /> رفض
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
