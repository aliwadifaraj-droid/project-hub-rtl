import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminListProjectOwners, adminToggleBanProjectOwner, adminDeleteProjectOwner } from "@/lib/project-owner-admin.functions";
import { Loader2, Search, Ban, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/project-owners")({
  component: ProjectOwnersPage,
});

type Owner = {
  id: string;
  email: string;
  company_name: string;
  phone: string;
  city: string;
  bio: string;
  created_at: string;
  banned: number;
};

function ProjectOwnersPage() {
  const list = useServerFn(adminListProjectOwners);
  const toggleBan = useServerFn(adminToggleBanProjectOwner);
  const deleteOwner = useServerFn(adminDeleteProjectOwner);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-project-owners"], queryFn: () => list() });
  const [q, setQ] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Owner | null>(null);

  const rows =
    (data ?? []).filter((o: Owner) => {
      if (!q.trim()) return true;
      const term = q.trim().toLowerCase();
      return (
        o.email.toLowerCase().includes(term) ||
        (o.company_name ?? "").toLowerCase().includes(term)
      );
    }) ?? [];

  async function handleToggleBan(owner: Owner) {
    const newBanned = owner.banned === 0;
    try {
      await toggleBan({ data: { owner_id: owner.id, banned: newBanned } });
      toast.success(newBanned ? "تم حظر صاحب المشروع مؤقتاً من النشر" : "تم رفع الحظر عن صاحب المشروع");
      qc.invalidateQueries({ queryKey: ["admin-project-owners"] });
    } catch (e: any) {
      toast.error(e?.message ?? "حدث خطأ");
    }
  }

  async function handleDelete(owner: Owner) {
    try {
      await deleteOwner({ data: { owner_id: owner.id } });
      toast.success("تم حذف الحساب نهائياً");
      setConfirmDelete(null);
      qc.invalidateQueries({ queryKey: ["admin-project-owners"] });
    } catch (e: any) {
      toast.error(e?.message ?? "حدث خطأ");
    }
  }

  if (isLoading)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );

  return (
    <div dir="rtl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl md:text-2xl font-bold">أصحاب المشاريع ({rows.length})</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالاسم أو الإيميل..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full sm:w-72 rounded-md border border-slate-600 bg-slate-800 py-2 pr-9 pl-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-lg">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-800 text-slate-200">
              <tr>
                <th className="p-3 font-semibold">الاسم</th>
                <th className="p-3 font-semibold">البريد</th>
                <th className="p-3 font-semibold">الهاتف</th>
                <th className="p-3 font-semibold">المدينة</th>
                <th className="p-3 font-semibold">تاريخ الإنشاء</th>
                <th className="p-3 font-semibold">الحالة</th>
                <th className="p-3 font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o: Owner) => (
                <tr key={o.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                  <td className="p-3 font-medium">{o.company_name || "لا يوجد اسم"}</td>
                  <td className="p-3">{o.email}</td>
                  <td className="p-3 text-slate-400">{o.phone || "—"}</td>
                  <td className="p-3 text-slate-400">{o.city || "—"}</td>
                  <td className="p-3 text-slate-400 text-xs">{new Date(o.created_at).toLocaleDateString("ar")}</td>
                  <td className="p-3">
                    {o.banned === 1 ? (
                      <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs text-red-400">محظور</span>
                    ) : (
                      <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs text-green-400">نشط</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleBan(o)}
                        title={o.banned === 1 ? "رفع الحظر" : "حظر مؤقت من النشر"}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                          o.banned === 1
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                        }`}
                      >
                        {o.banned === 1 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                        {o.banned === 1 ? "رفع الحظر" : "حظر"}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(o)}
                        title="حذف نهائي للحساب"
                        className="inline-flex items-center gap-1 rounded-md bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    لا يوجد أصحاب مشاريع
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-slate-800">
          {rows.map((o: Owner) => (
            <div key={o.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold">{o.company_name || "لا يوجد اسم"}</div>
                {o.banned === 1 ? (
                  <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">محظور</span>
                ) : (
                  <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">نشط</span>
                )}
              </div>
              <div className="text-sm text-slate-300">{o.email}</div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{o.phone || "—"}</span>
                <span>•</span>
                <span>{o.city || "—"}</span>
                <span>•</span>
                <span>{new Date(o.created_at).toLocaleDateString("ar")}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleToggleBan(o)}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    o.banned === 1
                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                  }`}
                >
                  {o.banned === 1 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                  {o.banned === 1 ? "رفع الحظر" : "حظر"}
                </button>
                <button
                  onClick={() => setConfirmDelete(o)}
                  className="inline-flex items-center gap-1 rounded-md bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  حذف
                </button>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="p-8 text-center text-slate-400">لا يوجد أصحاب مشاريع</div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setConfirmDelete(null)}>
          <div
            className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-red-500/20">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-lg font-bold">تأكيد الحذف النهائي</h2>
            </div>
            <p className="mb-2 text-sm text-slate-300">
              هل أنت متأكد من حذف حساب صاحب المشروع التالي نهائياً؟
            </p>
            <div className="mb-4 rounded-lg bg-slate-800 p-3 text-sm">
              <div className="font-semibold">{confirmDelete.company_name || "لا يوجد اسم"}</div>
              <div className="text-slate-400">{confirmDelete.email}</div>
            </div>
            <p className="mb-6 text-xs text-red-400">
              لن يتمكن هذا المستخدم من تسجيل الدخول مرة أخرى. لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                حذف نهائي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
