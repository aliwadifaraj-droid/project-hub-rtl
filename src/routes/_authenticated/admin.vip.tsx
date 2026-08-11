import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listVipSubscribers, approveVipByProject, cancelVipByProject, approveVipSubscriber, rejectVipSubscriber } from "@/lib/vip.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/vip")({
  component: AdminVipPage,
});

function statusBadge(s: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  const labels: Record<string, string> = {
    pending: "قيد المراجعة",
    active: "مفعّل",
    approved: "مفعّل",
    rejected: "مرفوض",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[s] ?? "bg-secondary"}`}>
      {labels[s] ?? s}
    </span>
  );
}

function daysRemaining(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 3600_000));
}

function AdminVipPage() {
  const fn = useServerFn(listVipSubscribers);
  const approveProjectFn = useServerFn(approveVipByProject);
  const cancelProjectFn = useServerFn(cancelVipByProject);
  const approveFn = useServerFn(approveVipSubscriber);
  const rejectFn = useServerFn(rejectVipSubscriber);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["vip-subscribers"],
    queryFn: () => fn(),
  });

  const approveProject = useMutation({
    mutationFn: (projectId: string) => approveProjectFn({ data: { project_id: projectId } }),
    onSuccess: () => {
      toast.success("تم تفعيل الحصرية لمدة 30 يوماً");
      qc.invalidateQueries({ queryKey: ["vip-subscribers"] });
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const cancelProject = useMutation({
    mutationFn: (projectId: string) => cancelProjectFn({ data: { project_id: projectId } }),
    onSuccess: () => {
      toast.success("تم إلغاء الحصرية");
      qc.invalidateQueries({ queryKey: ["vip-subscribers"] });
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const approve = useMutation({
    mutationFn: (id: string) => approveFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم التفعيل");
      qc.invalidateQueries({ queryKey: ["vip-subscribers"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const reject = useMutation({
    mutationFn: (id: string) => rejectFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم الرفض");
      qc.invalidateQueries({ queryKey: ["vip-subscribers"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <Star className="h-6 w-6 text-amber-500" />
        <h1 className="text-2xl font-bold">العملاء المميزون — إدارة الحصرية</h1>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-destructive">حصل خطأ: {(error as Error).message}</p>
      ) : (data ?? []).length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Star className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-muted-foreground">لا يوجد مشتركون مميزون حتى الآن.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>البريد</TableHead>
                <TableHead>المشروع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>ينتهي خلال</TableHead>
                <TableHead>الإيصال</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((s) => {
                const days = daysRemaining((s as { expires_at?: string | null }).expires_at ?? null);
                const isApproved = s.status === "approved" || s.status === "active";
                const hasProject = !!(s as { project_id?: string | null }).project_id;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name ?? "—"}</TableCell>
                    <TableCell className="text-xs">{s.email ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      {(s as { project_name?: string | null }).project_name ?? "—"}
                    </TableCell>
                    <TableCell>{statusBadge(s.status)}</TableCell>
                    <TableCell>
                      {isApproved && days !== null ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          days > 7 ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                        }`}>
                          {days === 0 ? "منتهٍ اليوم" : `${days} يوم`}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.receipt_url ? (
                        <a
                          href={s.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary text-xs underline"
                        >
                          عرض
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">لا يوجد</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        {hasProject && !isApproved && (
                          <Button
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            disabled={approveProject.isPending}
                            onClick={() => approveProject.mutate((s as { project_id: string }).project_id!)}
                          >
                            <Check className="h-3 w-3" /> تفعيل
                          </Button>
                        )}
                        {hasProject && isApproved && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2 text-xs"
                            disabled={cancelProject.isPending}
                            onClick={() => cancelProject.mutate((s as { project_id: string }).project_id!)}
                          >
                            <X className="h-3 w-3" /> إلغاء
                          </Button>
                        )}
                        {!hasProject && s.status !== "active" && (
                          <Button
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            disabled={approve.isPending}
                            onClick={() => approve.mutate(s.id)}
                          >
                            موافقة
                          </Button>
                        )}
                        {!hasProject && s.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2 text-xs"
                            disabled={reject.isPending}
                            onClick={() => reject.mutate(s.id)}
                          >
                            رفض
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
