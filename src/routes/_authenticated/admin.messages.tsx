import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminListMessages } from "@/lib/admin.functions";
import { Loader2, Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: MessagesPage,
});

function MessagesPage() {
  const list = useServerFn(adminListMessages);
  const { data, isLoading } = useQuery({ queryKey: ["admin-messages"], queryFn: () => list() });

  if (isLoading)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );

  const rows = data ?? [];

  return (
    <div dir="rtl">
      <h1 className="mb-4 text-xl md:text-2xl font-bold">رسائل التواصل ({rows.length})</h1>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-lg">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-800 text-slate-200">
              <tr>
                <th className="p-3 font-semibold">الاسم</th>
                <th className="p-3 font-semibold">الإيميل</th>
                <th className="p-3 font-semibold">الرسالة</th>
                <th className="p-3 font-semibold">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-t border-slate-800 hover:bg-slate-800/50 align-top">
                  <td className="p-3 font-medium">{m.name}</td>
                  <td className="p-3">
                    <a href={`mailto:${m.email}`} className="text-sky-400 hover:underline">{m.email}</a>
                  </td>
                  <td className="p-3 text-slate-300 max-w-md whitespace-pre-wrap">{m.message}</td>
                  <td className="p-3 text-slate-400 text-xs whitespace-nowrap">{new Date(m.created_at).toLocaleDateString("ar")}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">لا توجد رسائل بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-slate-800">
          {rows.map((m) => (
            <div key={m.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold">{m.name}</div>
                <span className="text-xs text-slate-500 shrink-0">{new Date(m.created_at).toLocaleDateString("ar")}</span>
              </div>
              <a href={`mailto:${m.email}`} className="block text-sm text-sky-400 hover:underline">
                <Mail className="inline h-3.5 w-3.5 ml-1" />{m.email}
              </a>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{m.message}</p>
            </div>
          ))}
          {rows.length === 0 && <div className="p-8 text-center text-slate-400">لا توجد رسائل بعد</div>}
        </div>
      </div>
    </div>
  );
}
