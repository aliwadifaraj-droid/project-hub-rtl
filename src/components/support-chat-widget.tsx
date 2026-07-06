import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, X, Send, Headphones } from "lucide-react";
import {
  listBotQuestions, startVisitorChat, visitorGetMessages,
  visitorSendMessage,
} from "@/lib/support.functions";

const TOKEN_KEY = "support_visitor_token_v1";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function generateUuid(): string {
  const browserCrypto = globalThis.crypto;
  if (browserCrypto?.randomUUID) {
    return browserCrypto.randomUUID();
  }
  if (!browserCrypto?.getRandomValues) {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
      (Number(c) ^ (Math.random() * 16 >> (Number(c) / 4))).toString(16),
    );
  }
  const bytes = new Uint8Array(16);
  browserCrypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

function getOrCreateToken(): string {
  if (typeof window === "undefined") return "";
  let t = localStorage.getItem(TOKEN_KEY);
  if (!t || !UUID_RE.test(t)) {
    t = generateUuid();
    localStorage.setItem(TOKEN_KEY, t);
  }
  return t;
}

export function SupportChatWidget() {
  const qc = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string>("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const listQa = useServerFn(listBotQuestions);
  const startFn = useServerFn(startVisitorChat);
  const getMsgs = useServerFn(visitorGetMessages);
  const sendFn = useServerFn(visitorSendMessage);
  const escalateFn = useServerFn(visitorEscalate);

  useEffect(() => { setMounted(true); setToken(getOrCreateToken()); }, []);


  // Start chat on first open
  useEffect(() => {
    if (open && token) {
      startFn({ data: { visitorToken: token } }).catch(() => {});
    }
  }, [open, token, startFn]);

  const { data: qaList = [] } = useQuery({
    queryKey: ["bot-qa-public"],
    queryFn: () => listQa(),
    enabled: open,
    staleTime: 60_000,
  });

  const { data: chatData } = useQuery({
    queryKey: ["support-visitor-chat", token],
    queryFn: () => getMsgs({ data: { visitorToken: token, sinceIso: null } }),
    enabled: open && !!token,
    refetchInterval: open ? 3000 : false,
  });

  const messages = chatData?.messages ?? [];
  const status = chatData?.chat?.status ?? "bot";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, open]);

  async function handleSend(text: string, qaId?: string | null) {
    if (!token || !text.trim() || sending) return;
    const body = text.trim();
    setSending(true);
    setSendError(null);
    try {
      await startFn({ data: { visitorToken: token } });
      await sendFn({ data: { visitorToken: token, body, qaId: qaId != null ? String(qaId) : null } });
      setInput("");
      qc.invalidateQueries({ queryKey: ["support-visitor-chat", token] });
    } catch {
      setSendError("تعذر إرسال الرسالة، حاول مرة أخرى.");
    } finally {
      setSending(false);
    }
  }

  async function handleEscalate() {
    if (!token) return;
    await escalateFn({ data: { visitorToken: token } });
    qc.invalidateQueries({ queryKey: ["support-visitor-chat", token] });
  }

  const canShowQuickQuestions = useMemo(
    () => status === "bot" && qaList.length > 0,
    [status, qaList.length],
  );

  if (!mounted) return null;

  return (
    <>

      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="افتح شات الدعم"
          className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[image:var(--gradient-accent)] text-accent-foreground shadow-[var(--shadow-elegant)] transition hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[560px] max-h-[85vh] w-[360px] max-w-[95vw] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-[var(--shadow-elegant)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-[image:var(--gradient-hero)] px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15">
                <Headphones className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-bold">دعم العمران</div>
                <div className="text-[11px] opacity-80">
                  {status === "escalated" ? "متصل مع موظف" : status === "closed" ? "المحادثة مغلقة" : "المساعد الآلي"}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-white/10" aria-label="إغلاق">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-secondary/30 p-3">
            {messages.map((m) => {
              const mine = m.sender === "visitor";
              const isSystem = m.sender === "system";
              if (isSystem) {
                return (
                  <div key={m.id} className="mx-auto max-w-[85%] rounded-md bg-accent/15 px-3 py-1.5 text-center text-[11px] text-foreground/70">
                    {m.body}
                  </div>
                );
              }
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    mine ? "bg-primary text-primary-foreground"
                         : m.sender === "admin" ? "bg-accent text-accent-foreground"
                         : "bg-background border border-border"
                  }`}>
                    {m.sender === "admin" && (
                      <div className="mb-0.5 text-[10px] font-semibold opacity-80">موظف الدعم</div>
                    )}
                    <div className="whitespace-pre-wrap break-words">{m.body}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick questions */}
          {canShowQuickQuestions && (
            <div className="border-t border-border bg-background/60 p-2">
              <div className="mb-1 text-[11px] font-semibold text-muted-foreground">اختر سؤالًا:</div>
              <div className="flex flex-wrap gap-1.5">
                {qaList.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleSend(q.question, q.id)}
                    disabled={sending}
                    className="rounded-full border border-border bg-secondary px-3 py-1 text-[11px] hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                  >
                    {q.question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input + escalate */}
          <div className="border-t border-border bg-background p-2">
            {status !== "escalated" && status !== "closed" && (
              <button
                onClick={handleEscalate}
                className="mb-2 w-full rounded-md border border-accent/50 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent/20"
              >
                كلم موظف
              </button>
            )}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
              className="flex items-center gap-1.5"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={2000}
                placeholder="اكتب رسالتك…"
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-foreground text-background disabled:opacity-50"
                aria-label="إرسال"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            {sendError && <div className="mt-1 text-[11px] text-destructive">{sendError}</div>}
          </div>
        </div>
      )}
    </>
  );
}
