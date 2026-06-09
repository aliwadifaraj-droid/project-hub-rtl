import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { listPendingAds, approveAd, rejectAd } from "@/lib/ads.functions";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, X, Megaphone, ExternalLink, Bell } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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

  const [rejectTarget, setRejectTarget] = useState<{ id: string; title: string } | null>(null);
  const [reason, setReason] = useState("");
  const initialCount = useRef<number | null>(null);

  // Realtime: notify admin when a new pending ad arrives
  useEffect(() => {
    const channel = supabase
      .channel("ads-pending-admin")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ads" },
        (payload) => {
          const row = payload.new as { status?: string; title?: string };
          if (row?.status === "pending") {
            toast.success("إعلان جديد بانتظار الموافقة", {
              description: row.title ?? "",
              icon: <Bell className="h-4 w-4" />,
            });
            qc.invalidateQueries({ queryKey: ["pending-ads"] });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ads" },
        () => qc.invalidateQueries({ queryKey: ["pending-ads"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const approveMut = useMutation({
    mutationFn: (id: string) => approve({ data: { id } }),
    onSuccess: () => {
      toast.success("تمت الموافقة");
      qc.invalidateQueries({ queryKey: ["pending-ads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMut = useMutation({
    mutationFn: (vars: { id: string; reason: string }) => reject({ data: vars }),
    onSuccess: () => {
      toast.success("تم رفض الإعلان");
      setRejectTarget(null);
      setReason("");
      qc.invalidateQueries({ queryKey: ["pending-ads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (error) return <p className="text-destructive">{(error as Error).message}</p>;

  const rows = data ?? [];
  if (initialCount.current === null) initialCount.current = rows.length;

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
                <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(ad.created_at).toLocaleDateString("ar")}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRejectTarget({ id: ad.id, title: ad.title })}
                      disabled={approveMut.isPending || rejectMut.isPending}
                      className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
                    >
                      <X className="h-3.5 w-3.5" /> رفض
                    </button>
                    <button
                      onClick={() => approveMut.mutate(ad.id)}
                      disabled={approveMut.isPending || rejectMut.isPending}
                      className="inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90 disabled:opacity-60"
                    >
                      <Check className="h-3.5 w-3.5" /> موافقة
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setReason("");
          }
        }}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>رفض الإعلان</DialogTitle>
            <DialogDescription>
              {rejectTarget ? `"${rejectTarget.title}" — اذكر سبب الرفض` : ""}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="مثال: الصورة غير مناسبة، الرابط معطّل، تكرار..."
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setRejectTarget(null);
                setReason("");
              }}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || rejectMut.isPending}
              onClick={() =>
                rejectTarget && rejectMut.mutate({ id: rejectTarget.id, reason: reason.trim() })
              }
            >
              {rejectMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
