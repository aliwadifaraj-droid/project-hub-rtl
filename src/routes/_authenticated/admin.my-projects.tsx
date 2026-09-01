import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMyProjects, deleteMyProject } from "@/lib/my-projects.functions";
import { deleteMyAd } from "@/lib/ads.functions";
import { getMyRoles, getProject } from "@/lib/admin.functions";
import { hasAdminRole } from "@/lib/role-label";
import { buildR2Url } from "@/data/projects";
import { Loader2, Trash2, Globe, FolderKanban, Megaphone, MapPin, Clock, FileText, X, Download } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/my-projects")({
  component: MyProjectsPage,
});

function MyProjectsPage() {
  const list = useServerFn(listMyProjects);
  const delProject = useServerFn(deleteMyProject);
  const delAd = useServerFn(deleteMyAd);
  const getRoles = useServerFn(getMyRoles);
  const getProjectFn = useServerFn(getProject);
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

  const [detailId, setDetailId] = useState<string | null>(null);
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["project-detail", detailId],
    queryFn: () => getProjectFn({ data: { id: detailId! } }),
    enabled: !!detailId,
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
              {(() => {
                const fallback = buildR2Url(p.cover_image ?? null);
                const src = p.cover_url || fallback || "";
                return src ? (
                  <img src={src} alt={p.name} className="aspect-video w-full object-cover" />
                ) : (
                  <div className="aspect-video w-full bg-secondary" />
                );
              })()}
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
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setDetailId(p.id)}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary transition"
                  >
                    <FileText className="h-3.5 w-3.5" /> عرض التفاصيل
                  </button>
                  {isAdmin ? (
                    <>
                      <button
                        onClick={() => { if (confirm("حذف هذا المشروع؟")) delProjectMut.mutate(p.id); }}
                        disabled={delProjectMut.isPending}
                        className="inline-flex items-center justify-center gap-1 rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> حذف
                      </button>
                      {p.ad_id ? (
                        <button
                          onClick={() => { if (confirm("حذف الإعلان المرتبط؟")) delAdMut.mutate(p.ad_id!); }}
                          disabled={delAdMut.isPending}
                          className="inline-flex items-center justify-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-60"
                        >
                          <Megaphone className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetailId(null)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border border-border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-3">
              <h2 className="text-lg font-bold">تفاصيل المشروع</h2>
              <button onClick={() => setDetailId(null)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
            {detailLoading ? (
              <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : detail ? (
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-xl font-extrabold">{detail.name}</h3>
                </div>
                {detail.description ? (
                  <div>
                    <span className="mb-1 block text-xs font-semibold text-muted-foreground">الوصف</span>
                    <p className="text-sm leading-relaxed">{detail.description}</p>
                  </div>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  {detail.location ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                      <MapPin className="h-4 w-4 text-primary" />
                      <div>
                        <div className="text-[10px] font-semibold text-muted-foreground">الموقع</div>
                        <div className="text-sm font-medium">{detail.location}</div>
                      </div>
                    </div>
                  ) : null}
                  {detail.duration ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <div className="text-[10px] font-semibold text-muted-foreground">المدة</div>
                        <div className="text-sm font-medium">{detail.duration}</div>
                      </div>
                    </div>
                  ) : null}
                </div>
                {detail.cover_url ? (
                  <div>
                    <span className="mb-1 block text-xs font-semibold text-muted-foreground">صورة الغلاف</span>
                    <img src={detail.cover_url} alt={detail.name} className="w-full rounded-lg border border-border object-cover max-h-64" />
                  </div>
                ) : null}
                {detail.image_urls && detail.image_urls.length > 0 ? (
                  <div>
                    <span className="mb-1 block text-xs font-semibold text-muted-foreground">الصور ({detail.image_urls.length})</span>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {detail.image_urls.map((url, i) => (
                        <img key={i} src={url} alt={`صورة ${i + 1}`} className="aspect-video w-full rounded-md border border-border object-cover" />
                      ))}
                    </div>
                  </div>
                ) : null}
                {detail.pdf_url ? (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">ملف المشروع (PDF)</span>
                      <a
                        href={detail.pdf_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary transition"
                      >
                        <Download className="h-3.5 w-3.5" /> تحميل
                      </a>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-border">
                      <iframe
                        src={detail.pdf_url}
                        title="معاينة ملف PDF"
                        className="h-[500px] w-full"
                        style={{ border: "none" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-6 text-center text-sm text-muted-foreground">
                    لا يوجد ملف PDF مرفق بهذا المشروع
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-muted-foreground">تعذر تحميل تفاصيل المشروع</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
