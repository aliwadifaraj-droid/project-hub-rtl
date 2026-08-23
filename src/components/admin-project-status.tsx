import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyRoles, updateProjectStatus } from "@/lib/admin.functions";
import { hasAdminRole } from "@/lib/role-label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Status = "active" | "delivered" | "cancelled";

const statusButtons: { status: Status; label: string; icon: string; color: string }[] = [
  { status: "cancelled", label: "ملغي", icon: "❌", color: "#dc3545" },
  { status: "delivered", label: "تم التسليم", icon: "✅", color: "#28a745" },
  { status: "active", label: "مفتوح للعروض", icon: "🟡", color: "#ffc107" },
];

const statusLabels: Record<Status, string> = {
  active: "مفتوح للعروض",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

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
  const { data: roles } = useQuery({ queryKey: ["my-roles"], queryFn: () => getRoles(), retry: false });
  const isAdmin = hasAdminRole(roles);

  const mut = useMutation({
    mutationFn: (status: Status) => update({ data: { id: projectId, status } }),
    onSuccess: (_r, status) => {
      toast.success(`تم تحديث الحالة إلى: ${statusLabels[status]}`);
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

  const currentLabel = currentStatus ? (statusLabels[currentStatus as Status] ?? null) : null;

  return (
    <div className="mt-5 border-t border-border/60 pt-4">
      <div className="mb-2 text-xs font-semibold text-muted-foreground">
        إجراءات المشرف {currentLabel ? `• الحالة الحالية: ${currentLabel}` : ""}
      </div>
      <div className="flex gap-2.5">
        {statusButtons.map((btn) => (
          <button
            key={btn.status}
            type="button"
            disabled={mut.isPending}
            onClick={() => confirmAnd(btn.status, btn.label)}
            style={{
              backgroundColor: btn.color,
              color: "#ffffff",
              fontWeight: "bold",
              fontSize: "14px",
              padding: "10px 14px",
              borderRadius: "8px",
              width: "auto",
            }}
            className="inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <span style={{ fontSize: "16px" }}>{btn.icon}</span>}
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
