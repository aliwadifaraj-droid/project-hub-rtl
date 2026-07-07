import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyRoles, updateProjectStatus } from "@/lib/admin.functions";
import { hasAdminRole } from "@/lib/role-label";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Status = "active" | "delivered" | "cancelled";

export function AdminProjectStatus({
  projectId,
  currentStatus,
  queryKey,
}: {
  projectId: string;
  currentStatus?: string | null;
  queryKey: readonly unknown[];
}) {
  const getRoles = useServerFn(getMyRoles);
  const update = useServerFn(updateProjectStatus);
  const qc = useQueryClient();
  const { data: roles } = useQuery({ queryKey: ["my-roles"], queryFn: () => getRoles() });
  const isAdmin = hasAdminRole(roles);

  const mut = useMutation({
    mutationFn: (status: Status) => update({ data: { id: projectId, status } }),
    onSuccess: (_r, status) => {
      toast.success(status === "delivered" ? "تم تحديث الحالة إلى: تم التسليم" : "تم تحديث الحالة إلى: ملغي");
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin) return null;

  function confirmAnd(status: Status, label: string) {
    if (confirm(`تأكيد تغيير حالة المشروع إلى: ${label}؟`)) mut.mutate(status);
  }

  return (
    <div className="mt-5 border-t border-border/60 pt-4">
      <div className="mb-2 text-xs font-semibold text-muted-foreground">
        إجراءات المشرف {currentStatus && currentStatus !== "active" ? `• الحالة الحالية: ${currentStatus === "delivered" ? "تم التسليم" : "ملغي"}` : ""}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={mut.isPending}
          onClick={() => confirmAnd("delivered", "تم التسليم")}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {mut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          ✅ تم التسليم
        </button>
        <button
          type="button"
          disabled={mut.isPending}
          onClick={() => confirmAnd("cancelled", "ملغي")}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {mut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
          ❌ ملغي
        </button>
      </div>
    </div>
  );
}
