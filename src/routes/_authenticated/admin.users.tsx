import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listEmployees } from "@/lib/admin.functions";
import { Loader2, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersPage,
});

function UsersPage() {
  const list = useServerFn(listEmployees);
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });
  const [q, setQ] = useState("");

  const rows =
    (data ?? []).filter((u) => {
      if (!q.trim()) return true;
      return u.email.toLowerCase().includes(q.trim().toLowerCase());
    }) ?? [];

  if (isLoading)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );

  return (
    <div dir="rtl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl md:text-2xl font-bold">المستخدمون ({rows.length})</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالبريد..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full sm:w-64 rounded-md border border-slate-600 bg-slate-800 py-2 pr-9 pl-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-lg">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-800 text-slate-200">
              <tr>
                <th className="p-3 font-semibold">البريد</th>
                <th className="p-3 font-semibold">الدور</th>
                <th className="p-3 font-semibold">تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.user_id} className="border-t border-slate-800 hover:bg-slate-800/50">
                  <td className="p-3 font-medium">{u.email}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">
                      {u.role === "admin" ? "أدمن" : "موظف"}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString("ar")}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-400">
                    لا يوجد مستخدمون
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-slate-800">
          {rows.map((u) => (
            <div key={u.user_id} className="p-4 space-y-1">
              <div className="font-bold">{u.email}</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-secondary px-2 py-0.5">
                  {u.role === "admin" ? "أدمن" : "موظف"}
                </span>
                <span className="text-slate-500">{new Date(u.created_at).toLocaleDateString("ar")}</span>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="p-8 text-center text-slate-400">لا يوجد مستخدمون</div>
          )}
        </div>
      </div>
    </div>
  );
}
