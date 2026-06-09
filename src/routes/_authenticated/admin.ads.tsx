import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPendingAds, approveAd } from "@/lib/ads.functions";
import { Loader2, Check, Megaphone, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/ads")({
  component: AdminAdsPage,
});

function AdminAdsPage() {
  const list = useServerFn(listPendingAds);
  const approve = useServerFn(approveAd);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-ads"],
    queryFn: () => list(),
  });

  const mut = useMutation({
    mutationFn: (id: string) => approve({ data: { id } }),
    onSuccess: () => {
      toast.success("تمت الموافقة");
      qc.invalidateQueries({ queryKey: ["pending-ads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (error) return <p className="text-destructive">{(error as Error).message}</p>;

  const rows = data ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Megaphone className="h-5 w-5" />
        <h1 className="text-2xl font-bold">الإعلانات المعلقة ({rows.length})</h1>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          لا توجد إعلانات بانتظار الموافقة.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((ad) => (
            <div key={ad.id} className="overflow-hidden rounded-xl border border-border bg-card">
              {ad.image_url ? (
                <img src={ad.image_url} alt={ad.title} className="h-44 w-full object-cover" />
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
                <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(ad.created_at).toLocaleDateString("ar")}
                  </span>
                  <button
                    onClick={() => mut.mutate(ad.id)}
                    disabled={mut.isPending}
                    className="inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90 disabled:opacity-60"
                  >
                    <Check className="h-3.5 w-3.5" /> موافقة
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
