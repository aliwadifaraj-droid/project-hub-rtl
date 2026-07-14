import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPendingAds, approveAd, rejectAd } from "@/lib/ads.functions";
import { Loader2, Check, X, Megaphone, ExternalLink, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/ads")({
  component: AdminAdsPage,
});

function AdminAdsPage() {
  const list = useServerFn(listPendingAds);
  const approve = useServerFn(approveAd);
  const reject = useServerFn(rejectAd);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-ads"],
    queryFn: () => list(),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => approve({ data: { id } }),
    onSuccess: () => {
      toast.success("تمت الموافقة");
      qc.invalidateQueries({ queryKey: ["pending-ads"] });
      qc.invalidateQueries({ queryKey: ["pending-ads-count"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => reject({ data: { id, reason: "تم الإلغاء من قبل الأدمن" } }),
    onSuccess: () => {
      toast.success("تم إلغاء الإعلان");
      qc.invalidateQueries({ queryKey: ["pending-ads"] });
      qc.invalidateQueries({ queryKey: ["pending-ads-count"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (error) return <p className="text-destructive">{(error as Error).message}</p>;

  const rows = data?.rows ?? [];
  const isAdmin = data?.isAdmin ?? false;

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Megaphone className="h-5 w-5" />
        <h1 className="text-2xl font-bold">الإعلانات المعلقة ({rows.length})</h1>
        {!isAdmin && (
          <span className="ms-2 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            عرض فقط
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          لا توجد إعلانات بانتظار الموافقة.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((ad) => (
            <div key={ad.id} className="overflow-hidden rounded-xl border border-border bg-card">
              {ad.image_signed_url ? (
                <img src={ad.image_signed_url} alt={ad.title} className="h-44 w-full object-cover" />
              ) : null}
              <div className="p-4">
                <h3 className="mb-1 font-bold">{ad.title}</h3>
                {ad.description ? (
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-3">{ad.description}</p>
                ) : null}
                {ad.link_url ? (
                  <a
                    href={ad.link_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mb-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> {ad.link_url}
                  </a>
                ) : null}
                <div className="mb-3 flex items-center gap-1.5 text-xs">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">المُرسِل:</span>
                  <span className={`font-semibold ${ad.created_by ? "text-foreground" : "text-amber-600"}`}>
                    {(ad as { submitter_label?: string }).submitter_label ?? (ad.created_by ? "موظف" : "زائر")}
                  </span>
                </div>
                {(ad as { contact_email?: string | null }).contact_email ? (
                  <div className="mb-3 text-xs text-muted-foreground">
                    بريد الزائر: <span className="font-semibold text-foreground">{(ad as { contact_email?: string }).contact_email}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(ad.created_at).toLocaleDateString("ar")}
                  </span>
                  {isAdmin ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (confirm("إلغاء هذا الإعلان؟")) cancelMut.mutate(ad.id);
                        }}
                        disabled={approveMut.isPending || cancelMut.isPending}
                        className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
                      >
                        <X className="h-3.5 w-3.5" /> إلغاء
                      </button>
                      <button
                        onClick={() => approveMut.mutate(ad.id)}
                        disabled={approveMut.isPending || cancelMut.isPending}
                        className="inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90 disabled:opacity-60"
                      >
                        <Check className="h-3.5 w-3.5" /> موافقة
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">بانتظار الأدمن</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
