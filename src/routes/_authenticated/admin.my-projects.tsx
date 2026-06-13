import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMyProjects, deleteMyProject } from "@/lib/my-projects.functions";
import { deleteMyAd } from "@/lib/ads.functions";
import { getMyRoles } from "@/lib/admin.functions";
import { hasAdminRole } from "@/lib/role-label";
import { Loader2, Trash2, Globe, FolderKanban, Megaphone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/my-projects")({
  component: MyProjectsPage,
});

function MyProjectsPage() {
  const list = useServerFn(listMyProjects);
  const delProject = useServerFn(deleteMyProject);
  const delAd = useServerFn(deleteMyAd);
  const getRoles = useServerFn(getMyRoles);
  const qc = useQueryClient();
  const { data: roles } = useQuery({ queryKey: ["my-roles"], queryFn: () => getRoles() });
  const isAdmin = hasAdminRole(roles);

  const { data, isLoading } = useQuery({
    queryKey: ["my-projects"],
    queryFn: () => list(),
  });

  const delProjectMut = useMutation({
    mutationFn: (id: string) => delProject({ data: { id } }),
    onSuccess: () => {
      toast.success("تم حذف المشروع");
      qc.invalidateQueries({ queryKey: ["my-projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delAdMut = useMutation({
    mutationFn: (id: string) => delAd({ data: { id } }),
    onSuccess: () => {
      toast.success("تم حذف الإعلان المرتبط");
      qc.invalidateQueries({ queryKey: ["my-projects"] });
      qc.invalidateQueries({ queryKey: ["pending-ads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const rows = data ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <FolderKanban className="h-5 w-5" />
        <h1 className="text-2xl font-bold">مشاريعي ({rows.length})</h1>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          لا توجد مشاريع بعد. سيتم إنشاء المشروع تلقائياً عند موافقة الأدمن على إعلانك.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-card">
              {p.cover_url ? (
                <img src={p.cover_url} alt={p.name} className="aspect-video w-full object-cover" />
              ) : (
                <div className="aspect-video w-full bg-secondary" />
              )}
              <div className="p-4">
                <h3 className="font-bold line-clamp-1">{p.name}</h3>
                {p.description ? (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                ) : null}
                {p.domain ? (
                  <div className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
                    <Globe className="h-3 w-3" /> {p.domain}
                  </div>
                ) : null}
                {isAdmin ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => { if (confirm("حذف هذا المشروع؟")) delProjectMut.mutate(p.id); }}
                      disabled={delProjectMut.isPending}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> حذف المشروع
                    </button>
                    {p.ad_id ? (
                      <button
                        onClick={() => { if (confirm("حذف الإعلان المرتبط؟")) delAdMut.mutate(p.ad_id!); }}
                        disabled={delAdMut.isPending}
                        className="inline-flex items-center justify-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-60"
                      >
                        <Megaphone className="h-3.5 w-3.5" /> حذف الإعلان
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
