import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminListMessages, adminDeleteContactMessage, adminReplyContactMessage, adminSendCustomEmail } from "@/lib/admin.functions";
import { Loader2, Mail, Trash2, Bell, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: MessagesPage,
});

function MessagesPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminListMessages);
  const delFn = useServerFn(adminDeleteContactMessage);
  const replyFn = useServerFn(adminReplyContactMessage);
  const { data, isLoading } = useQuery({ queryKey: ["admin-messages"], queryFn: () => list() });

  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [newMsg, setNewMsg] = useState({ to: "", subject: "", message: "" });
  const [sendingNew, setSendingNew] = useState(false);
  const sendNewEmailFn = useServerFn(adminSendCustomEmail);

  async function handleSendNewEmail(e: React.FormEvent) {
    e.preventDefault();
    setSendingNew(true);
    try {
      await sendNewEmailFn({ data: { to: newMsg.to, subject: newMsg.subject, message: newMsg.message } });
      toast.success("تم ارسال الايميل بنجاح");
      setShowNewMessageModal(false);
      setNewMsg({ to: "", subject: "", message: "" });
    } catch (err: any) {
      toast.error(err?.message ?? "تعذر إرسال الإيميل");
    } finally {
      setSendingNew(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل تريد حذف هذه الرسالة؟")) return;
    try {
      await delFn({ data: { id } });
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
      toast.success("تم حذف الرسالة");
    } catch (err: any) {
      toast.error(err?.message ?? "تعذر الحذف");
    }
  }

  async function handleReply(id: string) {
    const text = (replyText[id] ?? "").trim();
    if (!text) {
      toast.error("اكتب الرد أولاً");
      return;
    }
    setSending((s) => ({ ...s, [id]: true }));
    try {
      await replyFn({ data: { id, reply: text } });
      toast.success("تم إرسال الرد بنجاح");
      setReplyText((r) => ({ ...r, [id]: "" }));
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
    } catch (err: any) {
      toast.error(err?.message ?? "تعذر إرسال الرد");
    } finally {
      setSending((s) => ({ ...s, [id]: false }));
    }
  }

  if (isLoading)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );

  const rows = data ?? [];

  return (
    <div dir="rtl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold">الرسائل</h1>
          <Button onClick={() => setShowNewMessageModal(true)}>
            إرسال رسالة جديدة
          </Button>
        </div>
        <button
          aria-label="إشعارات الرسائل"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
        >
          <Bell className="h-5 w-5" />
          {rows.length > 0 && (
            <span className="absolute -top-1.5 -start-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {rows.length > 99 ? "99+" : rows.length}
            </span>
          )}
        </button>
      </div>

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
                <th className="p-3 font-semibold">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <>
                  <tr key={m.id} className="border-t border-slate-800 hover:bg-slate-800/50 align-top">
                    <td className="p-3 font-medium">{m.name}</td>
                    <td className="p-3">
                      <a href={`mailto:${m.email}`} className="text-sky-400 hover:underline">{m.email}</a>
                    </td>
                    <td className="p-3 text-slate-300 max-w-md whitespace-pre-wrap">{m.message}</td>
                    <td className="p-3 text-slate-400 text-xs whitespace-nowrap">{new Date(m.created_at).toLocaleDateString("ar")}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-red-600/20 px-2 py-1 text-xs text-red-300 hover:bg-red-600/30"
                        aria-label="حذف"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> حذف
                      </button>
                    </td>
                  </tr>
                  <tr key={m.id + "-reply"} className="border-t border-slate-800/50 bg-slate-900/60">
                    <td colSpan={5} className="p-3">
                      {m.reply ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>تم الرد في {m.replied_at ? new Date(m.replied_at).toLocaleDateString("ar") : ""}</span>
                          </div>
                          <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-3 text-sm text-slate-300 whitespace-pre-wrap">
                            {m.reply}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <textarea
                            value={replyText[m.id] ?? ""}
                            onChange={(e) => setReplyText((r) => ({ ...r, [m.id]: e.target.value }))}
                            placeholder="اكتب الرد هنا..."
                            rows={3}
                            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                          <button
                            onClick={() => handleReply(m.id)}
                            disabled={sending[m.id]}
                            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {sending[m.id] ? (
                              <><Loader2 className="h-4 w-4 animate-spin" /> جارٍ الإرسال...</>
                            ) : (
                              <><Send className="h-4 w-4" /> إرسال الرد</>
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                </>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">لا توجد رسائل بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-slate-800">
          {rows.map((m) => (
            <div key={m.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold">{m.name}</div>
                <span className="text-xs text-slate-500 shrink-0">{new Date(m.created_at).toLocaleDateString("ar")}</span>
              </div>
              <a href={`mailto:${m.email}`} className="block text-sm text-sky-400 hover:underline">
                <Mail className="inline h-3.5 w-3.5 ml-1" />{m.email}
              </a>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{m.message}</p>

              {m.reply ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>تم الرد في {m.replied_at ? new Date(m.replied_at).toLocaleDateString("ar") : ""}</span>
                  </div>
                  <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-3 text-sm text-slate-300 whitespace-pre-wrap">
                    {m.reply}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={replyText[m.id] ?? ""}
                    onChange={(e) => setReplyText((r) => ({ ...r, [m.id]: e.target.value }))}
                    placeholder="اكتب الرد هنا..."
                    rows={3}
                    className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    onClick={() => handleReply(m.id)}
                    disabled={sending[m.id]}
                    className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {sending[m.id] ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> جارٍ الإرسال...</>
                    ) : (
                      <><Send className="h-4 w-4" /> إرسال الرد</>
                    )}
                  </button>
                </div>
              )}

              <button
                onClick={() => handleDelete(m.id)}
                className="inline-flex items-center gap-1 rounded-md bg-red-600/20 px-2 py-1 text-xs text-red-300 hover:bg-red-600/30"
              >
                <Trash2 className="h-3.5 w-3.5" /> حذف
              </button>
            </div>
          ))}
          {rows.length === 0 && <div className="p-8 text-center text-slate-400">لا توجد رسائل بعد</div>}
        </div>
      </div>

      <Dialog open={showNewMessageModal} onOpenChange={setShowNewMessageModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إرسال رسالة جديدة</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendNewEmail} className="space-y-4">
            <div className="space-y-2">
              <input
                type="email"
                name="to"
                placeholder="ايميل المستلم"
                required
                value={newMsg.to}
                onChange={(e) => setNewMsg((s) => ({ ...s, to: e.target.value }))}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="space-y-2">
              <input
                type="text"
                name="subject"
                placeholder="الموضوع"
                required
                value={newMsg.subject}
                onChange={(e) => setNewMsg((s) => ({ ...s, subject: e.target.value }))}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="space-y-2">
              <textarea
                name="message"
                placeholder="نص الرسالة"
                required
                rows={5}
                value={newMsg.message}
                onChange={(e) => setNewMsg((s) => ({ ...s, message: e.target.value }))}
                className="w-full resize-y rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewMessageModal(false)} disabled={sendingNew}>
                إلغاء
              </Button>
              <Button type="submit" disabled={sendingNew}>
                {sendingNew ? <><Loader2 className="h-4 w-4 animate-spin" /> جارٍ الإرسال...</> : <><Send className="h-4 w-4" /> إرسال</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
