import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyRoles, updateProjectStatus } from "@/lib/admin.functions";
import { hasAdminRole } from "@/lib/role-label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  const updateStatus = useServerFn(updateProjectStatus);
  const qc = useQueryClient();
  
  const { data: roles } = useQuery({ queryKey: ["my-roles"], queryFn: () => getRoles(), retry: false });
  const isAdmin = hasAdminRole(roles);

  const mut = useMutation({
    mutationFn: (status: string) => updateStatus({ data: { id: projectId, status } }),
    onSuccess: () => {
      toast.success("تم تحديث حالة المشروع");
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin) return null;

  return (
    <div className="mt-5 border-t border-border/60 pt-4">
      <div className="mb-3 text-xs font-semibold text-muted-foreground">
        تغيير حالة المشروع
      </div>
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          disabled={mut.isPending || currentStatus === 'active'}
          onClick={() => mut.mutate('active')}
          className={`flex-1 px-3 py-2 text-xs font-bold rounded-md transition ${
            currentStatus === 'active' 
            ? 'bg-yellow-500 text-white' 
            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
          } disabled:opacity-50`}
        >
          {mut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" /> : null}
          مفتوح للعرض
        </button>
        <button
          type="button"
          disabled={mut.isPending || currentStatus === 'delivered'}
          onClick={() => mut.mutate('delivered')}
          className={`flex-1 px-3 py-2 text-xs font-bold rounded-md transition ${
            currentStatus === 'delivered' 
            ? 'bg-emerald-500 text-white' 
            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
          } disabled:opacity-50`}
        >
          {mut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" /> : null}
          تم التسليم
        </button>
        <button
          type="button"
          disabled={mut.isPending || currentStatus === 'cancelled'}
          onClick={() => mut.mutate('cancelled')}
          className={`flex-1 px-3 py-2 text-xs font-bold rounded-md transition ${
            currentStatus === 'cancelled' 
            ? 'bg-red-500 text-white' 
            : 'bg-red-100 text-red-800 hover:bg-red-200'
          } disabled:opacity-50`}
        >
          {mut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" /> : null}
          ملغي
        </button>
      </div>
    </div>
  );
}
