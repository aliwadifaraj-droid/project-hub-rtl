import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listTeamMessages, sendTeamMessage, deleteTeamMessage, deleteAllTeamMessages } from "@/lib/chat.functions";
import { getMyRoles } from "@/lib/admin.functions";
import { getRoleLabel } from "@/lib/role-label";
import { Send, Trash2, MessagesSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/chat")({
  component: TeamChatPage,
});

function TeamChatPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listTeamMessages);
  const sendFn = useServerFn(sendTeamMessage);
  const delFn = useServerFn(deleteTeamMessage);
  const delAllFn = useServerFn(deleteAllTeamMessages);

  const rolesFn = useServerFn(getMyRoles);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["team-messages"],
    queryFn: () => listFn(),
    refetchOnWindowFocus: false,
  });
  const { data: myRoles = [] } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => rolesFn(),
  });
  const isAdmin = myRoles.includes("admin");

  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [meId, setMeId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    const ch = supabase
      .channel("team_messages_room")
      .on("postgres_changes", { event: "*", schema: "public", table: "team_messages" }, () => {
        qc.invalidateQueries({ queryKey: ["team-messages"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (typeof window !== "undefined") {
      localStorage.setItem("team_chat_last_seen", new Date().toISOString());
      qc.setQueryData(["chat-unread-count"], 0);
    }
  }, [messages.length, qc]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await sendFn({ data: { body: text } });
      setBody("");
      qc.invalidateQueries({ queryKey: ["team-messages"] });
      inputRef.current?.focus();
    } catch (err: any) {
      toast.error(err?.message ?? "تعذر إرسال الرسالة");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await delFn({ data: { id } });
      qc.invalidateQueries({ queryKey: ["team-messages"] });
    } catch (err: any) {
      toast.error(err?.message ?? "تعذر حذف الرسالة");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
            <MessagesSquare className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold">غرفة شات الفريق</h1>
            <p className="text-xs text-muted-foreground">محادثة مشتركة بين الأدمن وجميع المستخدمين</p>
          </div>
        </div>
        {isAdmin && messages.length > 0 && (
          <button
            onClick={async () => {
              if (!confirm("حذف جميع رسائل شات الفريق؟ لا يمكن التراجع.")) return;
              try {
                await delAllFn();
                qc.invalidateQueries({ queryKey: ["team-messages"] });
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


      <div className="flex h-[calc(100vh-220px)] min-h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground">جاري التحميل…</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">لا توجد رسائل بعد. ابدأ المحادثة!</p>
          ) : (
            messages.map((m) => {
              const mine = m.user_id === meId;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`group max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                    <div className="mb-0.5 flex items-center gap-2 text-[11px] opacity-80">
                      <span className="font-medium">{m.sender_email}</span>
                      <span className="rounded-full bg-background/30 px-1.5 py-0.5 text-[10px]">
                        {getRoleLabel(m.sender_role)}
                      </span>
                      <span>·</span>
                      <span>{new Date(m.created_at).toLocaleString("ar")}</span>
                    </div>
                    <div className="whitespace-pre-wrap break-words">{m.body}</div>
                    {(mine || isAdmin) && (
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] opacity-0 transition group-hover:opacity-80"
                        aria-label="حذف"
                      >
                        <Trash2 className="h-3 w-3" /> حذف
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-border bg-secondary/30 p-3">
          <textarea
            ref={inputRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            maxLength={4000}
            placeholder="اكتب رسالتك… (Enter للإرسال، Shift+Enter لسطر جديد)"
            className="max-h-32 flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-foreground px-3 text-sm font-medium text-background disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> إرسال
          </button>
        </form>
      </div>
    </div>
  );
}
