import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  adminListVisitorRequests,
  updateRequestStatus,
  getBidPdfUrl,
  getMyRoles,
  sendRequestMessage,
} from "@/lib/admin.functions";
import { FileDown, Loader2, Bell, Mail, X, Ban } from "lucide-react";
import { toast } from "sonner";
import { adminBlockCompany } from "@/lib/blocked.functions";


export const Route = createFileRoute("/_authenticated/admin/visitor-bids")({
  component: VisitorBidsPage,
});

const STATUS = {
  new: { label: "جديد", cls: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  reviewing: { label: "قيد المراجعة", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  accepted: { label: "مقبول", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  rejected: { label: "مرفوض", cls: "bg-red-500/15 text-red-700 dark:text-red-300" },
} as const;

type Status = keyof typeof STATUS;

function VisitorBidsPage() {
  const list = useServerFn(adminListVisitorRequests);
  const update = useServerFn(updateRequestStatus);
  const getUrl = useServerFn(getBidPdfUrl);
  const getRoles = useServerFn(getMyRoles);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-visitor-bids"], queryFn: () => list() });
  const { data: roles } = useQuery({ queryKey: ["my-roles"], queryFn: () => getRoles() });
  const isAdmin = roles?.includes("admin");
  const [msgTarget, setMsgTarget] = useState<{ email: string; company: string } | null>(null);


  const [noteTarget, setNoteTarget] = useState<{ id: string; status: Status; note: string } | null>(null);
  const blockFn = useServerFn(adminBlockCompany);
  const blockMut = useMutation({
    mutationFn: (v: { company_name?: string; email?: string }) => blockFn({ data: v }),
    onSuccess: () => { toast.success("تم حظر الشركة"); qc.invalidateQueries({ queryKey: ["admin-visitor-bids"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const mut = useMutation({
    mutationFn: (v: { id: string; status: Status; note?: string }) => update({ data: v }),
    onSuccess: () => {
      toast.success("تم تحديث الحالة");
      setNoteTarget(null);
      qc.invalidateQueries({ queryKey: ["admin-visitor-bids"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function openPdf(path: string) {
    try {
      const url = await getUrl({ data: { path } });
      window.open(url, "_blank");
    } catch {
      toast.error("تعذر فتح الملف");
    }
  }

  if (isLoading)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );

  const rows = data ?? [];
  const newCount = rows.filter((r) => r.status === "new").length;

  return (
    <div dir="rtl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold">طلبات أضف مشروعك ({rows.length})</h1>
        <button
          aria-label="طلبات جديدة"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
        >
          <Bell className="h-5 w-5" />
          {newCount > 0 && (
            <span className="absolute -top-1.5 -start-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {newCount > 99 ? "99+" : newCount}
            </span>
          )}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-lg">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-800 text-slate-200">
              <tr>
                <th className="p-3 font-semibold">الشركة</th>
                <th className="p-3 font-semibold">المشروع</th>
                <th className="p-3 font-semibold">البريد</th>
                <th className="p-3 font-semibold">موقع المنشأة</th>
                <th className="p-3 font-semibold">التاريخ</th>
                <th className="p-3 font-semibold">الحالة</th>
                <th className="p-3 font-semibold">عرض السعر</th>
                <th className="p-3 font-semibold">حظر</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                  <td className="p-3 font-medium">{r.company_name}</td>
                  <td className="p-3 text-slate-300">
                    <div>{(r.projects as { name: string } | null)?.name ?? "-"}</div>
                    {r.submitter_type && <SubmitterBadge type={r.submitter_type as "guest" | "user"} />}
                  </td>
                  <td className="p-3 text-slate-300 ltr text-left" dir="ltr">
                    {r.email ? (
                      <a href={`mailto:${r.email}`} className="text-blue-300 hover:underline">{r.email}</a>
                    ) : "-"}
                  </td>
                  <td className="p-3 text-slate-300">
                    <div>{r.facility_location}</div>
                    {r.note ? <div className="mt-1 text-xs text-amber-300">📝 {r.note}</div> : null}
                  </td>
                  <td className="p-3 text-slate-400 text-xs">{new Date(r.created_at).toLocaleDateString("ar")}</td>
                  <td className="p-3">
                    {(isAdmin || r.can_manage) ? (
                      <select
                        value={r.status}
                        onChange={(e) => setNoteTarget({ id: r.id, status: e.target.value as Status, note: r.note ?? "" })}
                        className={`rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs font-medium ${STATUS[r.status as Status].cls}`}
                      >
                        {Object.entries(STATUS).map(([k, v]) => (
                          <option key={k} value={k} className="bg-slate-800 text-slate-100">{v.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS[r.status as Status].cls}`}>
                        {STATUS[r.status as Status].label}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                    {(isAdmin || r.can_manage) ? (
                      <button onClick={() => openPdf(r.pdf_url ?? "")} className="inline-flex items-center gap-1 rounded-md bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-600">
                        <FileDown className="h-4 w-4" /> فتح PDF
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-700/50 px-2.5 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed">
                        <FileDown className="h-4 w-4" /> غير مصرح
                      </span>
                    )}
                    {(isAdmin || r.can_manage) && r.email ? (
                      <button onClick={() => setMsgTarget({ email: String(r.email), company: String(r.company_name ?? "") })} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-500">
                        <Mail className="h-4 w-4" /> رسالة خاصة
                      </button>
                    ) : null}
                    </div>
                  </td>
                  <td className="p-3">
                    {isAdmin ? (
                      <button
                        disabled={blockMut.isPending}
                        onClick={() => blockMut.mutate({ company_name: r.company_name ?? "", email: r.email ?? "" })}
                        className="inline-flex items-center gap-1 rounded-md bg-red-600/80 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-60"
                      >
                        <Ban className="h-4 w-4" /> حظر
                      </button>
                    ) : "-"}
                  </td>

                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">لا توجد طلبات بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-slate-800">
          {rows.map((r) => (
            <div key={r.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold">{r.company_name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{(r.projects as { name: string } | null)?.name ?? "-"}</div>
                  {r.submitter_type && <SubmitterBadge type={r.submitter_type as "guest" | "user"} />}
                </div>
                {(isAdmin || r.can_manage) ? (
                  <select
                    value={r.status}
                    onChange={(e) => setNoteTarget({ id: r.id, status: e.target.value as Status, note: r.note ?? "" })}
                    className={`shrink-0 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs font-medium ${STATUS[r.status as Status].cls}`}
                  >
                    {Object.entries(STATUS).map(([k, v]) => (
                      <option key={k} value={k} className="bg-slate-800 text-slate-100">{v.label}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS[r.status as Status].cls}`}>
                    {STATUS[r.status as Status].label}
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-300">📍 {r.facility_location}</div>
              {r.note ? <div className="text-xs text-amber-300">📝 {r.note}</div> : null}
              {r.email && (
                <div className="text-xs text-slate-300 ltr text-left" dir="ltr">
                  ✉️ <a href={`mailto:${r.email}`} className="text-blue-300 hover:underline">{r.email}</a>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString("ar")}</span>
                {(isAdmin || r.can_manage) ? (
                  <button onClick={() => openPdf(r.pdf_url ?? "")} className="inline-flex items-center gap-1 rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium hover:bg-slate-600">
                    <FileDown className="h-4 w-4" /> فتح PDF
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed">
                    <FileDown className="h-4 w-4" /> غير مصرح
                  </span>
                )}
              </div>
              {(isAdmin || r.can_manage) && r.email ? (
                <button
                  onClick={() => setMsgTarget({ email: String(r.email), company: String(r.company_name ?? "") })}
                  className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500"
                >
                  <Mail className="h-4 w-4" /> رسالة خاصة
                </button>
              ) : null}
            </div>
          ))}
          {rows.length === 0 && <div className="p-8 text-center text-slate-400">لا توجد طلبات بعد</div>}
        </div>
      </div>

      {noteTarget && (
        <NoteModal
          target={noteTarget}
          required={!isAdmin}
          pending={mut.isPending}
          onClose={() => setNoteTarget(null)}
          onSubmit={(note) => mut.mutate({ id: noteTarget.id, status: noteTarget.status, note })}
        />
      )}

      {msgTarget && <MessageModal target={msgTarget} onClose={() => setMsgTarget(null)} />}
    </div>
  );

}

function NoteModal({
  target,
  required,
  pending,
  onClose,
  onSubmit,
}: {
  target: { status: Status; note: string };
  required: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (note: string) => void;
}) {
  const [note, setNote] = useState(target.note ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (required && !note.trim()) {
      toast.error("الملاحظة إجبارية");
      return;
    }
    onSubmit(note.trim());
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" dir="rtl" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">ملاحظة تغيير الحالة</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              الحالة الجديدة: <span className="font-semibold">{STATUS[target.status].label}</span>
              {" — "}
              {required ? "الملاحظة إجبارية" : "الملاحظة اختيارية"}
            </p>
          </div>
          <button aria-label="إغلاق" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="اكتب الملاحظة..."
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-500">الملاحظة تظهر للإدارة وفي رد البوت فقط، ولا تُرسل في بريد العميل.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-md border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} حفظ الحالة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SubmitterBadge({ type }: { type: "guest" | "user" }) {
  const isUser = type === "user";
  return (
    <span
      className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        isUser
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-amber-500/15 text-amber-300"
      }`}
    >
      {isUser ? "👤 مستخدم" : "🔔 زائر"}
    </span>
  );
}

function MessageModal({ target, onClose }: { target: { email: string; company: string }; onClose: () => void }) {
  const send = useServerFn(sendRequestMessage);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("اكتب نص الرسالة");
      return;
    }
    setSending(true);
    try {
      await send({ data: { to: target.email, message: message.trim() } });
      toast.success("تم إرسال الرسالة");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر إرسال الرسالة");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" dir="rtl" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">رسالة خاصة</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {target.company} — <span dir="ltr">{target.email}</span>
            </p>
          </div>
          <button aria-label="إغلاق" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            maxLength={3000}
            placeholder="اكتب رسالتك هنا..."
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-md border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">إلغاء</button>
            <button type="submit" disabled={sending} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} إرسال
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
