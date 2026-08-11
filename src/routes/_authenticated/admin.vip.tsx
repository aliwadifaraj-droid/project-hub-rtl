import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Bell, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  listVipSubscribers,
  approveVipSubscriber,
  rejectVipSubscriber,
  testVipExpiry,
} from "@/lib/vip.functions";
import { requireAdmin } from "@/lib/auth-middleware.server";

export const Route = createFileRoute("/_authenticated/admin/vip")({
  head: () => ({
    meta: [{ title: "العملاء المميزون — منصة العمران" }],
  }),
  beforeLoad: () => requireAdmin(),
});

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "قيد المراجعة", variant: "secondary" },
    active: { label: "نشط", variant: "default" },
    rejected: { label: "مرفوض", variant: "destructive" },
    expired: { label: "منتهي", variant: "outline" },
  };
  const cfg = map[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function VipPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listVipSubscribers);
  const approveFn = useServerFn(approveVipSubscriber);
  const rejectFn = useServerFn(rejectVipSubscriber);

  const { data, isLoading } = useQuery({
    queryKey: ["vip-subscribers"],
    queryFn: () => listFn(),
  });

  const approve = useMutation({
    mutationFn: (id: string) => approveFn({ data: { id } }),
    onSuccess: () => { toast.success("تم تفعيل المشترك"); qc.invalidateQueries({ queryKey: ["vip-subscribers"] }); },
    onError: (e) => toast.error((e as Error).message),
  });
  const reject = useMutation({
    mutationFn: (id: string) => rejectFn({ data: { id } }),
    onSuccess: () => { toast.success("تم الرفض"); qc.invalidateQueries({ queryKey: ["vip-subscribers"] }); },
    onError: (e) => toast.error((e as Error).message),
  });
  const testFn = useServerFn(testVipExpiry);
  const testExpiry = useMutation({
    mutationFn: () => testFn(),
    onSuccess: (res) => {
      toast.success(`تم فحص اشعارات انتهاء VIP — تمت معالجة ${res.processed}، انتهاء ${res.expired}، إرسال ${res.emailed}`);
      qc.invalidateQueries({ queryKey: ["vip-subscribers"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const subscribers = data ?? [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">العملاء المميزون</h1>
        <Button onClick={() => testExpiry.mutate()} disabled={testExpiry.isPending}>
          {testExpiry.isPending ? "جارٍ الفحص..." : "اختبار اشعارات VIP"}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">جارٍ التحميل...</p>
      ) : subscribers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            لا يوجد مشتركون مميزون بعد.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {subscribers.map((sub) => (
            <Card key={sub.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{sub.name || "بدون اسم"}</CardTitle>
                  <StatusBadge status={sub.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {sub.email && <p className="text-muted-foreground">{sub.email}</p>}
                {sub.plan && <p>الخطة: {sub.plan}</p>}
                {sub.city && <p>المدينة: {sub.city}</p>}
                {sub.receipt_path && (
                  <a href={sub.receipt_path} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    عرض إيصال الدفع
                  </a>
                )}
                {sub.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={() => approve.mutate(sub.id)} disabled={approve.isPending}>
                      <Check className="h-4 w-4 ml-1" /> تفعيل
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => reject.mutate(sub.id)} disabled={reject.isPending}>
                      <X className="h-4 w-4 ml-1" /> رفض
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default VipPage;
