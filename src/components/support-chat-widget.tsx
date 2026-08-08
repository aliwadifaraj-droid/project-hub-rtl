import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, X, Send, Headphones, PowerOff, FileUp, CheckCircle2 } from "lucide-react";
import {
  listBotQuestions, startVisitorChat, visitorGetMessages,
  visitorSendMessage, visitorEndSession,
} from "@/lib/support.functions";
import { getBotSettings } from "@/lib/bot-settings.functions";
import { submitOffer } from "@/lib/offers.functions";
import { BotMessageBody } from "@/components/bot-message-body";


const TOKEN_KEY = "support_visitor_token_v1";
const IDLE_MS = 5 * 60 * 1000;
const OFFER_FLOW_MARKER = "__OFFER_FLOW__";


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

export function SupportChatWidget() {
  const qc = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [token, setToken] = useState<string>("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [offerStep, setOfferStep] = useState<"none" | "terms" | "form">("none");
  const [offerData, setOfferData] = useState({ projectName: "", companyId: "", facilityLocation: "", email: "", pdfFile: null as File | null });

  const listBotQuestionsFn = useServerFn(listBotQuestions);
  const startChatFn = useServerFn(startVisitorChat);
  const getMsgsFn = useServerFn(visitorGetMessages);
  const sendMsgFn = useServerFn(visitorSendMessage);
  const endSessionFn = useServerFn(visitorEndSession);
  const getBotSettingsFn = useServerFn(getBotSettings);
  const submitOfferFn = useServerFn(submitOffer);

  const { data: botSettings } = useQuery({
    queryKey: ["bot-settings"],
    queryFn: () => getBotSettingsFn(),
  });

  const visitorName = botSettings?.visitor_name || "زائر";

  const { data: messages = [], refetch } = useQuery({
    queryKey: ["visitor-messages", token],
    queryFn: () => getMsgsFn({ data: { token } }),
    enabled: !!token,
    refetchInterval: 3000,
  });

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
    } else {
      (async () => {
        try {
          const res = await startChatFn({ data: { name: visitorName } });
          if (res?.token) {
            setToken(res.token);
            localStorage.setItem(TOKEN_KEY, res.token);
          }
        } catch {}
      })();
    }
  }, [open]);

  useEffect(() => {
    if (open && !bubbleDismissed) setShowBubble(false);
  }, [open, bubbleDismissed]);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        if (!bubbleDismissed) setShowBubble(true);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [open, bubbleDismissed]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const askBot = useCallback(async (text: string) => {
    if (!text.trim() || sending) return;
    setSending(true);
    setSendError(null);
    try {
      await sendMsgFn({ data: { token, message: text } });
      setInput("");
      await refetch();
      scrollToBottom();
    } catch (e: any) {
      setSendError(e?.message ?? "تعذر الإرسال");
    } finally {
      setSending(false);
    }
  }, [token, sending, sendMsgFn, refetch, scrollToBottom]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("open-support-chat", onOpen);
    return () => window.removeEventListener("open-support-chat", onOpen);
  }, []);

  const quickQuestions = useMemo(() => {
    const list = botSettings?.quick_questions ?? [];
    return list.slice(0, 4);
  }, [botSettings]);

  const currentOfferProject = useMemo(() => {
    if (!offerData.projectName) return null;
    return { name: offerData.projectName, id: offerData.companyId };
  }, [offerData.projectName, offerData.companyId]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    const lower = text.toLowerCase().trim();
    if (lower === "عرض سعر" || lower === "تقديم عرض" || lower.includes("تقديم عرض سعر")) {
      setOfferStep("terms");
      return;
    }

    await askBot(text);
  }

  if (!mounted) return null;

  return (
    <>
      {showBubble && !open && (
        <div
          className="fixed bottom-6 left-6 z-50 max-w-xs rounded-2xl bg-foreground px-4 py-3 text-sm text-background shadow-lg animate-in fade-in slide-in-from-bottom-2"
          onClick={() => { setOpen(true); setShowBubble(false); }}
        >
          <div className="flex items-start gap-2">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div className="flex-1">
              <div className="font-semibold">{botSettings?.bubble_text || "محتاج مساعدة؟"}</div>
              <div className="mt-0.5 text-xs opacity-80">{botSettings?.bubble_subtext || "اسألني عن المشاريع أو الخدمات"}</div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setBubbleDismissed(true); setShowBubble(false); }}
              className="shrink-0 opacity-60 hover:opacity-100"
              aria-label="إغلاق"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-start sm:bottom-6 sm:left-6 sm:items-stretch sm:max-w-sm">
          <div className="absolute inset-0 bg-black/30 sm:hidden" onClick={() => setOpen(false)} />
          <div className="relative flex h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-card shadow-xl sm:h-[600px] sm:rounded-2xl border border-border">
            {/* Header */}
            <div className="flex items-center justify-between bg-[image:var(--gradient-accent)] px-4 py-3 text-accent-foreground">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold">دعم العمران</div>
                  <div className="text-[11px] opacity-80">
                    {status === "escalated" ? "متصل مع موظف" : status === "closed" ? "المحادثة مغلقة" : "المساعد الآلي"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {status === "escalated" && (
                  <button
                    onClick={async () => {
                      try { await endSessionFn({ data: { token } }); } catch {}
                      localStorage.removeItem(TOKEN_KEY);
                      setToken("");
                      setOpen(false);
                    }}
                    className="rounded-md p-1.5 hover:bg-white/20"
                    aria-label="إنهاء"
                  >
                    <PowerOff className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="rounded-md p-1.5 hover:bg-white/20" aria-label="إغلاق">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
                  <MessageCircle className="mb-2 h-8 w-8 opacity-40" />
                  <p>مرحباً! كيف أقدر أساعدك اليوم؟</p>
                </div>
              ) : (
                messages.map((m) => {
                  const mine = m.sender === "visitor";
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
                        <div className="whitespace-pre-wrap break-words"><BotMessageBody body={m.body.replace(OFFER_FLOW_MARKER, "").trim()} /></div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Offer (price quote) wizard */}
              {offerStep === "terms" && (
                <div className="rounded-xl border border-border bg-background p-3">
                  <button
                    onClick={() => setOfferStep("form")}
                    className="w-full rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    أوافق على الشروط
                  </button>
                </div>
              )}

              {offerStep === "form" && (
                <div className="space-y-2 rounded-xl border border-border bg-background p-3">
                  <div className="text-[11px] font-semibold text-muted-foreground">بيانات عرض السعر:</div>
                  <input
                    type="text"
                    placeholder="اسم المشروع"
                    value={offerData.projectName}
                    onChange={(e) => setOfferData((d) => ({ ...d, projectName: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="text"
                    placeholder="رقم السجل التجاري / الهوية"
                    value={offerData.companyId}
                    onChange={(e) => setOfferData((d) => ({ ...d, companyId: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="text"
                    placeholder="موقع المنشأة"
                    value={offerData.facilityLocation}
                    onChange={(e) => setOfferData((d) => ({ ...d, facilityLocation: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="email"
                    placeholder="البريد الإلكتروني"
                    value={offerData.email}
                    onChange={(e) => setOfferData((d) => ({ ...d, email: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border-2 border-dashed border-border px-3 py-2 text-xs hover:bg-secondary/50">
                    <FileUp className="h-4 w-4 text-accent" />
                    <span className="flex-1 text-muted-foreground">
                      {offerData.pdfFile ? offerData.pdfFile.name : "اضغط لاختيار ملف PDF"}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setOfferData((d) => ({ ...d, pdfFile: e.target.files?.[0] ?? null }))}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={async () => {
                      if (!offerData.projectName || !offerData.companyId || !offerData.facilityLocation || !offerData.email || !offerData.pdfFile) {
                        setSendError("جميع الحقول إجبارية");
                        return;
                      }
                      setSending(true);
                      try {
                        const buf = await offerData.pdfFile.arrayBuffer();
                        let binary = "";
                        const bytes = new Uint8Array(buf);
                        const chunk = 0x8000;
                        for (let i = 0; i < bytes.length; i += chunk) {
                          binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
                        }
                        const file_base64 = btoa(binary);
                        await submitOfferFn({ data: {
                          project_name: offerData.projectName,
                          company_id: offerData.companyId,
                          facility_location: offerData.facilityLocation,
                          email: offerData.email,
                          file_name: offerData.pdfFile.name,
                          file_base64,
                        }});
                        setOfferStep("none");
                        setOfferData({ projectName: "", companyId: "", facilityLocation: "", email: "", pdfFile: null });
                        setSendError(null);
                        await refetch();
                        scrollToBottom();
                      } catch (e: any) {
                        setSendError(e?.message ?? "تعذر إرسال العرض");
                      } finally {
                        setSending(false);
                      }
                    }}
                    disabled={sending}
                    className="w-full rounded-md bg-[image:var(--gradient-accent)] px-3 py-2 text-xs font-bold text-accent-foreground hover:opacity-90 disabled:opacity-60"
                  >
                    {sending ? "جاري الإرسال…" : "إرسال العرض"}
                  </button>
                </div>
              )}

              {sendError && (
                <div className="text-center text-xs text-destructive">{sendError}</div>
              )}
            </div>

            {/* Quick questions */}
            {quickQuestions.length > 0 && offerStep === "none" && (
              <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => askBot(q)}
                    className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-[11px] hover:bg-secondary"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-border p-3">
              {status === "closed" ? (
                <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  المحادثة مغلقة. ابدأ محادثة جديدة.
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="اكتب رسالتك…"
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                    aria-label="إرسال"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
