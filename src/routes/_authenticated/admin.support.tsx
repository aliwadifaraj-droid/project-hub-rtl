import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { adminListChats, adminListChatMessages, adminReplyChat, adminCloseChat, adminDeleteAllSupport } from "@/lib/support.functions";
import { Send, Headphones, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/support")({
  component: AdminSupportPage,
});

function AdminSupportPage() {
  const qc = useQueryClient();
  const listChats = useServerFn(adminListChats);
  const listMsgs = useServerFn(adminListChatMessages);
  const reply = useServerFn(adminReplyChat);
  const closeFn = useServerFn(adminCloseChat);
  const delAllFn = useServerFn(adminDeleteAllSupport);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: chats = [] } = useQuery({
    queryKey: ["admin-support-chats"],
    queryFn: () => listChats(),
    refetchInterval: 5000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["admin-support-msgs", activeId],
    queryFn: () => listMsgs({ data: { chatId: activeId! } }),
    enabled: !!activeId,
    refetchInterval: activeId ? 3000 : false,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, activeId]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!activeId || !body.trim() || sending) return;
    setSending(true);
    try {
      await reply({ data: { chatId: activeId, body: body.trim() } });
      setBody("");
      qc.invalidateQueries({ queryKey: ["admin-support-msgs", activeId] });
    } catch (err: any) {
      toast.error(err?.message ?? "تعذر الإرسال");
    } finally { setSending(false); }
  }

  async function handleClose() {
    if (!activeId) return;
    await closeFn({ data: { chatId: activeId } });
    qc.invalidateQueries({ queryKey: ["admin-support-chats"] });
    toast.success("تم إغلاق المحادثة");
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
            <Headphones className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold">دعم العملاء</h1>
            <p className="text-xs text-muted-foreground">كل محادثات العملاء والبوت</p>
          </div>
        </div>
        {chats.length > 0 && (
          <button
            onClick={async () => {
              if (!confirm("حذف جميع محادثات ورسائل الدعم؟ لا يمكن التراجع.")) return;
              try {
                await delAllFn();
                setActiveId(null);
                qc.invalidateQueries({ queryKey: ["admin-support-chats"] });
                qc.invalidateQueries({ queryKey: ["admin-support-msgs"] });
                toast.success("تم حذف جميع الرسائل");
              } catch (err: any) {
                toast.error(err?.message ?? "تعذر الحذف");
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-600/30"
          >
            <Trash2 className="h-3.5 w-3.5" /> حذف الكل
          </button>
        )}
      </div>


      <div className="grid h-[calc(100vh-220px)] min-h-[500px] grid-cols-1 gap-3 md:grid-cols-[280px_1fr]">
        {/* Chat list */}
        <div className="overflow-y-auto rounded-xl border border-border bg-background">
          {chats.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">لا توجد محادثات</p>
          ) : chats.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`block w-full border-b border-border px-3 py-2 text-right text-sm transition ${activeId === c.id ? "bg-secondary" : "hover:bg-secondary/50"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {c.visitor_name || `زائر ${c.id.slice(0, 6)}`}
                </span>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  c.status === "escalated" ? "bg-accent text-accent-foreground"
                  : c.status === "closed" ? "bg-muted text-muted-foreground"
                  : "bg-secondary text-secondary-foreground"
                }`}>
                  {c.status === "escalated" ? "بحاجة موظف" : c.status === "closed" ? "مغلق" : "بوت"}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {new Date(c.last_message_at).toLocaleString("ar")}
              </div>
            </button>
          ))}
        </div>

        {/* Conversation */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-background">
          {!activeId ? (
            <div className="grid flex-1 place-items-center text-sm text-muted-foreground">اختر محادثة لعرضها</div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-3 py-2">
                <div className="text-sm font-semibold">المحادثة</div>
                <button onClick={handleClose} className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-secondary">
                  <CheckCircle2 className="h-3.5 w-3.5" /> إغلاق
                </button>
              </div>
              <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
                {messages.map((m) => {
                  if (m.sender === "system") {
                    return <div key={m.id} className="mx-auto max-w-[80%] rounded-md bg-accent/15 px-3 py-1.5 text-center text-[11px] text-foreground/70">{m.body}</div>;
                  }
                  const isAdminMsg = m.sender === "admin";
                  return (
                    <div key={m.id} className={`flex ${isAdminMsg ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                        isAdminMsg ? "bg-primary text-primary-foreground"
                        : m.sender === "bot" ? "bg-secondary" : "bg-background border border-border"
                      }`}>
                        <div className="mb-0.5 text-[10px] font-semibold opacity-70">
                          {m.sender === "admin" ? "موظف" : m.sender === "bot" ? "بوت" : "عميل"} · {new Date(m.created_at).toLocaleString("ar")}
                        </div>
                        <div className="whitespace-pre-wrap break-words">{m.body}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-border bg-secondary/30 p-3">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  rows={1}
                  maxLength={4000}
                  placeholder="اكتب ردك…"
                  className="max-h-32 flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <button type="submit" disabled={sending || !body.trim()} className="inline-flex h-10 items-center gap-1.5 rounded-md bg-foreground px-3 text-sm font-medium text-background disabled:opacity-50">
                  <Send className="h-4 w-4" /> إرسال
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
