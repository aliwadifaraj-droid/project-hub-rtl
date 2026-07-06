import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { startVisitorChat, visitorSendMessage, visitorGetMessages, listBotQuestions } from "@/lib/support.functions";
import { Bot, Send, RefreshCw, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/bot-test")({
  component: BotTestPage,
});

function generateUuid() {
  const c: any = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16);
  c.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0"));
  return `${h.slice(0, 4).join("")}-${h.slice(4, 6).join("")}-${h.slice(6, 8).join("")}-${h.slice(8, 10).join("")}-${h.slice(10, 16).join("")}`;
}

type Msg = { id: string; sender: string; body: string; created_at: string };
type Qa = { id: string; question: string; answer: string };

function BotTestPage() {
  const startFn = useServerFn(startVisitorChat);
  const sendFn = useServerFn(visitorSendMessage);
  const getFn = useServerFn(visitorGetMessages);
  const listQaFn = useServerFn(listBotQuestions);

  const [token, setToken] = useState<string>(() => generateUuid());
  const [messages, setMessages] = useState<Msg[]>([]);
  const [qas, setQas] = useState<Qa[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<Array<{ ts: string; type: "info" | "error" | "ok"; msg: string }>>([]);

  function pushLog(type: "info" | "error" | "ok", msg: string) {
    setLog((l) => [{ ts: new Date().toLocaleTimeString("ar"), type, msg }, ...l].slice(0, 50));
  }

  async function refresh(t = token) {
    try {
      const r = await getFn({ data: { visitorToken: t } });
      setMessages((r.messages ?? []) as Msg[]);
      pushLog("ok", `تحديث الرسائل (${r.messages?.length ?? 0})`);
    } catch (e: any) {
      pushLog("error", `فشل التحديث: ${e?.message ?? e}`);
    }
  }

  async function init() {
    setError(null);
    try {
      pushLog("info", `بدء جلسة جديدة (${token.slice(0, 8)}…)`);
      await startFn({ data: { visitorToken: token, visitorName: "أدمن-تجريبي" } });
      pushLog("ok", "تم إنشاء الجلسة");
      const qa = await listQaFn();
      setQas((qa ?? []) as Qa[]);
      pushLog("ok", `تحميل الأسئلة المُدرَّبة (${qa?.length ?? 0})`);
      await refresh(token);
    } catch (e: any) {
      const m = e?.message ?? String(e);
      setError(m);
      pushLog("error", `فشل بدء الجلسة: ${m}`);
    }
  }

  async function send(body: string, qaId?: string) {
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    try {
      pushLog("info", `إرسال: ${body}`);
      await sendFn({ data: { visitorToken: token, body, qaId: qaId != null ? String(qaId) : null } });
      pushLog("ok", "تم الإرسال، جارٍ جلب الرد…");
      setInput("");
      await refresh();
    } catch (e: any) {
      const m = e?.message ?? String(e);
      setError(m);
      pushLog("error", `فشل الإرسال: ${m}`);
    } finally {
      setSending(false);
    }
  }

  function newSession() {
    const t = generateUuid();
    setToken(t);
    setMessages([]);
    setError(null);
    pushLog("info", `توليد توكن جديد ${t.slice(0, 8)}…`);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold">تجربة البوت</h1>
            <p className="text-xs text-muted-foreground">اختبر الإرسال واعرض أي خطأ يظهر</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={init} className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background">
            <RefreshCw className="h-4 w-4" /> بدء الجلسة
          </button>
          <button onClick={newSession} className="rounded-md border border-border px-3 py-2 text-sm">توكن جديد</button>
        </div>
      </div>

      <div className="mb-3 rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
        <span className="font-semibold">Visitor Token:</span> <code className="ltr" dir="ltr">{token}</code>
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1 break-words">{error}</div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-background">
          <div className="border-b border-border px-3 py-2 text-sm font-bold">المحادثة</div>
          <div className="h-80 space-y-2 overflow-auto p-3">
            {messages.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground">لا رسائل بعد — اضغط "بدء الجلسة"</p>
            ) : messages.map((m) => (
              <div key={m.id} className={`rounded-md p-2 text-sm ${m.sender === "visitor" ? "bg-primary/10 ms-8" : m.sender === "bot" ? "bg-secondary me-8" : "bg-accent/20 text-center text-xs"}`}>
                <div className="mb-0.5 text-[10px] text-muted-foreground">{m.sender}</div>
                {m.body}
              </div>
            ))}
          </div>
          <div className="border-t border-border p-2">
            {qas.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {qas.map((q) => (
                  <button key={q.id} onClick={() => send(q.question, q.id)} disabled={sending} className="rounded-full border border-border px-2 py-1 text-[11px] hover:bg-secondary disabled:opacity-50">
                    {q.question}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
                placeholder="اكتب رسالة تجريبية…"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button onClick={() => send(input)} disabled={sending || !input.trim()} className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50">
                <Send className="h-4 w-4" /> {sending ? "..." : "إرسال"}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-bold">سجل التنفيذ</span>
            <button onClick={() => setLog([])} className="text-xs text-muted-foreground hover:text-foreground">مسح</button>
          </div>
          <div className="h-[26rem] overflow-auto p-2 font-mono text-xs" dir="ltr">
            {log.length === 0 ? (
              <p className="p-2 text-center text-muted-foreground">لا يوجد سجل</p>
            ) : log.map((l, i) => (
              <div key={i} className={`border-b border-border/50 px-2 py-1 ${l.type === "error" ? "text-destructive" : l.type === "ok" ? "text-emerald-600" : "text-muted-foreground"}`}>
                <span className="opacity-60">[{l.ts}]</span> {l.msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
