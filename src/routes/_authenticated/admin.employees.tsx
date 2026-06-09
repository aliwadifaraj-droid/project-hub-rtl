import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { listEmployees, createEmployee, deleteEmployee, listRoles } from "@/lib/admin.functions";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/employees")({
  component: EmployeesPage,
});

function EmployeesPage() {
  const list = useServerFn(listEmployees);
  const create = useServerFn(createEmployee);
  const del = useServerFn(deleteEmployee);
  const rolesFn = useServerFn(listRoles);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["employees"], queryFn: () => list() });
  const { data: roles } = useQuery({ queryKey: ["roles"], queryFn: () => rolesFn() });
  const [open, setOpen] = useState(false);

  const createMut = useMutation({
    mutationFn: (v: { email: string; password: string; role_id: string }) => create({ data: v }),
    onSuccess: () => { toast.success("تم الإنشاء"); qc.invalidateQueries({ queryKey: ["employees"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (user_id: string) => del({ data: { user_id } }),
    onSuccess: () => { toast.success("تم الحذف"); qc.invalidateQueries({ queryKey: ["employees"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (error) return <p className="text-destructive">{(error as Error).message}</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">الموظفون ({data?.length ?? 0})</h1>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background hover:bg-foreground/90">
          <Plus className="h-4 w-4" /> إضافة موظف
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-right">
            <tr><th className="p-3">البريد</th><th className="p-3">الدور</th><th className="p-3">تاريخ الإنشاء</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {(data ?? []).map((u) => (
              <tr key={u.user_id + u.role} className="border-t border-border">
                <td className="p-3 font-medium">{u.email}</td>
                <td className="p-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{u.role === "admin" ? "أدمن" : "موظف"}</span></td>
                <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString("ar")}</td>
                <td className="p-3 text-left">
                  <button
                    onClick={() => { if (confirm(`حذف ${u.email}؟`)) delMut.mutate(u.user_id); }}
                    className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                  ><Trash2 className="h-3.5 w-3.5" /> حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open ? (
        <NewEmployeeModal
          roles={roles ?? []}
          onClose={() => setOpen(false)}
          onSave={(v) => createMut.mutate(v)}
          saving={createMut.isPending}
        />
      ) : null}
    </div>
  );
}

function NewEmployeeModal({
  onClose, onSave, saving, roles,
}: {
  onClose: () => void;
  onSave: (v: { email: string; password: string; role_id: string }) => void;
  saving: boolean;
  roles: { id: string; name: string; label: string }[];
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  useEffect(() => {
    if (!roleId && roles.length > 0) {
      const employeeRole = roles.find((r) => r.name === "employee") ?? roles[0];
      setRoleId(employeeRole.id);
    }
  }, [roles, roleId]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">موظف جديد</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div><label className="mb-1.5 block text-sm font-semibold">البريد</label>
            <input type="email" className="inp" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="mb-1.5 block text-sm font-semibold">كلمة المرور</label>
            <input type="password" autoComplete="new-password" className="inp" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div><label className="mb-1.5 block text-sm font-semibold">الدور</label>
            <select className="inp" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select></div>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            disabled={saving || !email || password.length < 6 || !roleId}
            onClick={() => onSave({ email, password, role_id: roleId })}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-60"
          >{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} إنشاء</button>
          <button onClick={onClose} className="rounded-md border border-border px-4 py-2.5 text-sm">إلغاء</button>
        </div>
      </div>
    </div>
  );
}
