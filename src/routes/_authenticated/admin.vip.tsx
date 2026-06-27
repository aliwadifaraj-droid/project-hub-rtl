import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listVipSubscribers, approveVipSubscriber, rejectVipSubscriber } from "@/lib/vip.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/vip")({
  component: AdminVipPage,
});

function statusBadge(s: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  const labels: Record<string, string> = { pending: "قيد المراجعة", active: "مفعّل", rejected: "مرفوض" };
  return <span className={`rounded px-2 py-0.5 text-xs ${map[s] ?? "bg-secondary"}`}>{labels[s] ?? s}</span>;
}

function AdminVipPage() {
  const fn = useServerFn(listVipSubscribers);
  const approveFn = useServerFn(approveVipSubscriber);
  const rejectFn = useServerFn(rejectVipSubscriber);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["vip-subscribers"],
    queryFn: () => fn(),
  });
  const approve = useMutation({
    mutationFn: (id: string) => approveFn({ data: { id } }),
    onSuccess: () => { toast.success("تم التفعيل"); qc.invalidateQueries({ queryKey: ["vip-subscribers"] }); },
    onError: (e) => toast.error((e as Error).message),
  });
  const reject = useMutation({
    mutationFn: (id: string) => rejectFn({ data: { id } }),
    onSuccess: () => { toast.success("تم الرفض"); qc.invalidateQueries({ queryKey: ["vip-subscribers"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-4" dir="rtl">
      <h1 className="text-2xl font-bold">العملاء المميزون</h1>
      {isLoading ? (
        <p className="text-muted-foreground">جارٍ التحميل...</p>
      ) : error ? (
        <p className="text-destructive">حصل خطأ: {(error as Error).message}</p>
      ) : (data ?? []).length === 0 ? (
        <p className="text-muted-foreground">لا يوجد مشتركون.</p>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>البريد</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإيصال</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>{statusBadge(s.status)}</TableCell>
                  <TableCell>
                    {s.receipt_url ? (
                      <a href={s.receipt_url} target="_blank" rel="noreferrer" className="text-primary underline">
                        عرض
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">لا يوجد</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{new Date(s.created_at).toLocaleString("ar")}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {s.status !== "active" && (
                        <Button size="sm" onClick={() => approve.mutate(s.id)} disabled={approve.isPending}>
                          تفعيل
                        </Button>
                      )}
                      {s.status !== "rejected" && (
                        <Button size="sm" variant="outline" onClick={() => reject.mutate(s.id)} disabled={reject.isPending}>
                          رفض
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
