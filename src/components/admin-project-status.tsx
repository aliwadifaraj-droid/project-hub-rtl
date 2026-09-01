import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyRoles } from "@/lib/admin.functions";
import { getNotificationsEnabled, setNotificationsEnabled } from "@/lib/site-settings.functions";
import { hasAdminRole } from "@/lib/role-label";
import { Loader2, Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

export function AdminProjectStatus({
  queryKey,
}: {
  projectId: string;
  currentStatus?: string | null;
  queryKey: readonly unknown[];
}) {
  const getRoles = useServerFn(getMyRoles);
  const getNotif = useServerFn(getNotificationsEnabled);
  const toggleNotif = useServerFn(setNotificationsEnabled);
  const qc = useQueryClient();
  const { data: roles } = useQuery({ queryKey: ["my-roles"], queryFn: () => getRoles(), retry: false });
  const isAdmin = hasAdminRole(roles);

  const { data: notifState } = useQuery({
    queryKey: ["notifications-enabled"],
    queryFn: () => getNotif(),
  });

  const mut = useMutation({
    mutationFn: (enabled: boolean) => toggleNotif({ data: { enabled } }),
    onSuccess: (_r, enabled) => {
      toast.success(enabled ? "تم تشغيل الإشعارات للجميع" : "تم إيقاف الإشعارات للجميع");
      qc.invalidateQueries({ queryKey: ["notifications-enabled"] });
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin) return null;

  const enabled = notifState?.enabled ?? true;

  return (
    <div className="mt-5 border-t border-border/60 pt-4">
      <div className="mb-2 text-xs font-semibold text-muted-foreground">
        إجراءات المشرف
      </div>
      <button
        type="button"
        disabled={mut.isPending}
        onClick={() => mut.mutate(!enabled)}
        style={{
          backgroundColor: enabled ? "#16a34a" : "#dc2626",
          color: "#ffffff",
          fontWeight: "bold",
          padding: "10px 20px",
          borderRadius: "8px",
        }}
        className="inline-flex w-full items-center justify-center gap-1.5 disabled:opacity-60"
      >
        {mut.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : enabled ? (
          <BellOff className="h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        {enabled ? "إيقاف الإشعارات للجميع" : "تشغيل الإشعارات للجميع"}
      </button>
    </div>
  );
}
