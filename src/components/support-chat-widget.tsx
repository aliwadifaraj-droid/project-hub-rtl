import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, X, Send, Headphones, PowerOff, FileUp, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import {
  listBotQuestions, startVisitorChat, visitorGetMessages,
  visitorSendMessage, visitorEndSession,
} from "@/lib/support.functions";
import { getBotSettings } from "@/lib/bot-settings.functions";
import { submitOffer } from "@/lib/offers.functions";
import { submitVipSubscription } from "@/lib/vip.functions";
import { SAUDI_CITIES } from "@/lib/saudi-cities";


const TOKEN_KEY = "support_visitor_token_v1";
const IDLE_MS = 5 * 60 * 1000;
const OFFER_FLOW_MARKER = "__OFFER_FLOW__";
const VIP_FLOW_MARKER = "__VIP_FLOW__";
const OFFER_WARN_DELIVERED_MARKER = "__OFFER_WARN_DELIVERED__";
const OFFER_WARN_CANCELLED_MARKER = "__OFFER_WARN_CANCELLED__";

const VIP_PLANS = [
  { value: "100-30", label: "100 ريال — 30 يوم" },
  { value: "200-60", label: "200 ريال — 60 يوم" },
  { value: "300-90", label: "300 ريال — 90 يوم" },
] as const;

const VALID_PLAN_AMOUNTS = [100, 200, 300];
const VIP_IBAN = "SA35 1000 0065 5000 4711 0807";

function normalizeArabicDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function extractAmountFromOcr(text: string): string {
  const normalized = normalizeArabicDigits(text);
  const patterns = [
    /(?:المبلغ|amount|التحويل|transfer|قيمة|value|مبلغ)\s*[:：]?\s*(\d+(?:[.,]\d{1,2})?)/i,
    /(\d+(?:[.,]\d{1,2})?)\s*(?:ريال|sar|ر\.س|sr)/i,
    /(\d{3,})\s*(?:ريال|sar|ر\.س|sr)/i,
  /\b(\d{2,3}(?:[.,]\d{1,2})?)\s*(?:ريال|sar|ر\.س|sr)/i,
  /\b(\d{2,3}(?:[.,]\d{1,2})?)\b/,
  ];
  for (const p of patterns) {
    const m = normalized.match(p);
    if (m && m[1]) {
      const num = Number(m[1].replace(/[,]/g, ""));
      if (VALID_PLAN_AMOUNTS.includes(num)) return String(num);
    }
  }
  for (const p of patterns) {
    const m = normalized.match(p);
    if (m && m[1]) {
      const num = Number(m[1].replace(/[,]/g, ""));
      if (Number.isFinite(num) && num > 0) return String(num);
    }
  }
  return "";
}

function extractDateFromOcr(text: string): string {
  const normalized = normalizeArabicDigits(text);
  const isoMatch = normalized.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  }
  const dmyMatch = normalized.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;
  }
  const dateKeywords = /(?:التاريخ|date|تاريخ|التحويل|transfer)\s*[:：]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i;
  const kwMatch = normalized.match(dateKeywords);
  if (kwMatch && kwMatch[1]) {
    const parts = kwMatch[1].split(/[-\/]/);
    if (parts.length === 3) {
      let [y, m, d] = parts[2].length === 4 ? [parts[2], parts[1], parts[0]] : [parts[2].length === 2 ? `20${parts[2]}` : parts[2], parts[1], parts[0]];
      if (parts[2].length === 4) { y = parts[2]; m = parts[1]; d = parts[0]; }
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }
  return "";
}

function isWithinLast7Days(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = Date.now();
  const diff = now - d.getTime();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

async function runOcrOnImage(file: File): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("ara+eng");
  const { data: { text } } = await worker.recognize(file);
  await worker.terminate();
  return text;
}


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
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Offer (price quote) wizard state
  const [offerMsgId, setOfferMsgId] = useState<string | null>(null);
  const [offerStep, setOfferStep] = useState<"warning" | "terms" | "form" | "done" | null>(null);
  const [offerWarnType, setOfferWarnType] = useState<"delivered" | "cancelled" | null>(null);
  const [offerForm, setOfferForm] = useState({ projectName: "", companyName: "", email: "", amount: "" });
  const [offerFile, setOfferFile] = useState<File | null>(null);
  const [offerBusy, setOfferBusy] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);

  // VIP subscription wizard state
  const [vipMsgId, setVipMsgId] = useState<string | null>(null);
  const [vipStep, setVipStep] = useState<"terms" | "form" | "done" | null>(null);
  const [vipForm, setVipForm] = useState({ name: "", email: "", city: "", plan: "" });
  const [vipFile, setVipFile] = useState<File | null>(null);
  const [vipBusy, setVipBusy] = useState(false);
  const [vipError, setVipError] = useState<string | null>(null);

  // VIP OCR state
  const [vipOcrAmount, setVipOcrAmount] = useState("");
  const [vipOcrDate, setVipOcrDate] = useState("");
  const [vipOcrBusy, setVipOcrBusy] = useState(false);
  const [vipOcrText, setVipOcrText] = useState("");
  const [vipOcrFailed, setVipOcrFailed] = useState(false);

  const listQa = useServerFn(listBotQuestions);
  const startFn = useServerFn(startVisitorChat);
  const getMsgs = useServerFn(visitorGetMessages);
  const sendFn = useServerFn(visitorSendMessage);
  const endFn = useServerFn(visitorEndSession);
  const getSettings = useServerFn(getBotSettings);
  const submitOfferFn = useServerFn(submitOffer);
  const submitVipFn = useServerFn(submitVipSubscription);


  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || bubbleDismissed) return;
    const showTimer = setTimeout(() => setShowBubble(true), 1500);
    const hideTimer = setTimeout(() => setShowBubble(false), 61500);
    bubbleTimer.current = hideTimer;
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [mounted, bubbleDismissed]);

  const dismissBubble = useCallback(() => {
    setShowBubble(false);
    setBubbleDismissed(true);
    if (bubbleTimer.current) { clearTimeout(bubbleTimer.current); bubbleTimer.current = null; }
  }, []);

  const openFromBubble = useCallback(() => {
    dismissBubble();
    setOpen(true);
  }, [dismissBubble]);

  useEffect(() => {
    const handler = () => setOpen(true);
    if (typeof window !== "undefined") {
      window.addEventListener("open-support-chat", handler);
      return () => window.removeEventListener("open-support-chat", handler);
    }
  }, []);

  const endSession = useCallback(async (opts?: { silent?: boolean }) => {
    if (idleTimer.current) { clearTimeout(idleTimer.current); idleTimer.current = null; }
    const t = token;
    setToken("");
    setInput("");
    setSendError(null);
    if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
    if (t) {
      try { await endFn({ data: { visitorToken: t } }); } catch {}
      qc.removeQueries({ queryKey: ["support-visitor-chat", t] });
    }
    if (!opts?.silent) {
    }
  }, [token, endFn, qc]);

  const resetIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (!open || !token) return;
    idleTimer.current = setTimeout(() => { endSession({ silent: true }); }, IDLE_MS);
  }, [open, token, endSession]);

  useEffect(() => {
    if (!open || !mounted) return;
    if (token) return;
    const t = generateUuid();
    if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    startFn({ data: { visitorToken: t } }).catch(() => {});
  }, [open, mounted, token, startFn]);

  useEffect(() => {
    if (!token) return;
    const onUnload = () => {
      try {
        if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        }
      } catch {}
      if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [token]);

  const { data: qaList = [] } = useQuery({
    queryKey: ["bot-qa-public"],
    queryFn: () => listQa(),
    enabled: open,
    staleTime: 60_000,
  });

  const { data: botSettings } = useQuery({
    queryKey: ["bot-settings-public"],
    queryFn: () => getSettings(),
    enabled: open,
    staleTime: 60_000,
  });

  const { data: chatData } = useQuery({
    queryKey: ["support-visitor-chat", token],
    queryFn: () => getMsgs({ data: { visitorToken: token, sinceIso: null } }),
    enabled: open && !!token,
    refetchInterval: open && !!token ? 3000 : false,
  });

  const messages = chatData?.messages ?? [];
  const status = chatData?.chat?.status ?? "bot";
  const lastMsg = messages[messages.length - 1];
  const showEndAfterBot = !!lastMsg && (lastMsg.sender === "bot" || lastMsg.sender === "admin");

  const offerTriggerId = useMemo(() => {
    const m = [...messages].reverse().find((x) => x.sender === "bot" && x.body.includes(OFFER_FLOW_MARKER));
    return m?.id ?? null;
  }, [messages]);

  useEffect(() => {
    if (!offerTriggerId) return;
    if (offerMsgId === offerTriggerId) return;
    setOfferMsgId(offerTriggerId);
    setOfferError(null);
    setOfferFile(null);
    setOfferForm({ projectName: "", companyName: "", email: "", amount: "" });
    const triggerMsg = messages.find((m) => m.id === offerTriggerId);
    if (triggerMsg?.body.includes(OFFER_WARN_DELIVERED_MARKER)) {
      setOfferWarnType("delivered");
      setOfferStep("warning");
    } else if (triggerMsg?.body.includes(OFFER_WARN_CANCELLED_MARKER)) {
      setOfferWarnType("cancelled");
      setOfferStep("warning");
    } else {
      setOfferWarnType(null);
      setOfferStep("terms");
    }
  }, [offerTriggerId, offerMsgId, messages]);

  const vipTriggerId = useMemo(() => {
    const m = [...messages].reverse().find((x) => x.sender === "bot" && x.body.includes(VIP_FLOW_MARKER));
    return m?.id ?? null;
  }, [messages]);

  useEffect(() => {
    if (!vipTriggerId) return;
    if (vipMsgId === vipTriggerId) return;
    setVipMsgId(vipTriggerId);
    setVipStep("terms");
    setVipError(null);
    setVipFile(null);
    setVipForm({ name: "", email: "", city: "", plan: "" });
    setVipOcrAmount("");
    setVipOcrDate("");
    setVipOcrText("");
    setVipOcrFailed(false);
  }, [vipTriggerId, vipMsgId]);

  async function handleVipFileChange(file: File | null) {
    setVipFile(file);
    setVipOcrAmount("");
    setVipOcrDate("");
    setVipOcrText("");
    setVipOcrFailed(false);
    setVipError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setVipOcrBusy(true);
    try {
      const text = await runOcrOnImage(file);
      const amount = extractAmountFromOcr(text);
      const date = extractDateFromOcr(text);
      setVipOcrText(text.trim());
      setVipOcrAmount(amount);
      setVipOcrDate(date);
      if (!amount || !date) {
        setVipOcrFailed(true);
      }
    } catch (e) {
      console.error("OCR failed", e);
      setVipOcrFailed(true);
    } finally {
      setVipOcrBusy(false);
    }
  }

  function validateVipReceipt(): boolean {
    if (vipOcrFailed) return false;
    const amount = Number(vipOcrAmount);
    const planAmount = Number(vipForm.plan.split("-")[0]);
    if (!vipOcrAmount || !vipOcrDate) return false;
    if (!VALID_PLAN_AMOUNTS.includes(amount)) return false;
    if (Number.isFinite(planAmount) && amount !== planAmount) return false;
    if (!isWithinLast7Days(vipOcrDate)) return false;
    return true;
  }

  const vipReceiptValid = validateVipReceipt();

  async function handleVipSubmit() {
    if (vipBusy) return;
    const { name, email, city, plan } = vipForm;
    if (!name.trim() || !email.trim() || !city.trim() || !plan.trim()) {
      setVipError("يرجى إكمال جميع الحقول.");
      return;
    }
    if (!vipFile) {
      setVipError("يرجى رفع صورة الإيصال.");
      return;
    }
    if (!validateVipReceipt()) {
      setVipError("الإيصال غير صالح. تأكد من المبلغ وتاريخ الدفع");
      return;
    }
    setVipBusy(true);
    setVipError(null);
    try {
      const fd = new FormData();
      fd.append("file", vipFile);
      fd.append("purpose", "vip-receipt");
      const res = await fetch("/api/public/upload", { method: "POST", body: fd });
      const json = (await res.json()) as { key?: string; error?: string };
      if (!res.ok || !json.key) throw new Error(json.error || "تعذر رفع الملف");
      await submitVipFn({
        data: {
          name: name.trim(),
          email: email.trim(),
          receipt_path: json.key,
          plan: plan.trim(),
          city: city.trim(),
        },
      });
      setVipStep("done");
      qc.invalidateQueries({ queryKey: ["support-visitor-chat", token] });
    } catch (e) {
      setVipError(e instanceof Error ? e.message : "تعذر إرسال الطلب، حاول مرة أخرى.");
    } finally {
      setVipBusy(false);
    }
  }

  async function handleOfferSubmit() {
    if (offerBusy) return;
    const { projectName, companyName, email, amount } = offerForm;
    if (!projectName.trim() || !companyName.trim() || !email.trim() || !amount.trim()) {
      setOfferError("يرجى إكمال جميع الحقول.");
      return;
    }
    if (!offerFile) {
      setOfferError("يرجى رفع ملف العرض بصيغة PDF.");
      return;
    }
    const isPdf = offerFile.type === "application/pdf" || offerFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setOfferError("الملف يجب أن يكون PDF.");
      return;
    }
    setOfferBusy(true);
    setOfferError(null);
    try {
      const fd = new FormData();
      fd.append("file", offerFile);
      fd.append("purpose", "bid-pdf");
      const res = await fetch("/api/public/upload", { method: "POST", body: fd });
      const json = (await res.json()) as { key?: string; error?: string };
      if (!res.ok || !json.key) throw new Error(json.error || "تعذر رفع الملف");
      const vipToken = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("vip_token")
        : null;
      const result = await submitOfferFn({
        data: {
          projectName: projectName.trim(),
          companyName: companyName.trim(),
          email: email.trim(),
          amount: amount.trim(),
          pdfKey: json.key,
          pdfFilename: offerFile.name,
          visitorToken: token || null,
          vipToken: vipToken || null,
        },
      });
      if (!result?.ok) {
        setOfferError(result?.message ?? "المشروع غير موجود");
        return;
      }
      setOfferStep("done");
      qc.invalidateQueries({ queryKey: ["support-visitor-chat", token] });
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      let msg = "تعذر إرسال العرض، حاول مرة أخرى.";
      if (raw.includes("is not a function") || raw.includes("undefined")) {
        msg = "تعذر معالجة الطلب حالياً. يرجى المحاولة مرة أخرى لاحقاً.";
      } else if (raw.length > 0 && raw.length < 200) {
        msg = raw;
      }
      setOfferError(msg);
    } finally {
      setOfferBusy(false);
    }
  }



  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, open]);

  useEffect(() => { resetIdle(); }, [messages.length, resetIdle]);
  useEffect(() => () => { if (idleTimer.current) clearTimeout(idleTimer.current); }, []);

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
      resetIdle();
    } catch {
      setSendError("تعذر إرسال الرسالة، حاول مرة أخرى.");
    } finally {
      setSending(false);
    }
  }

  const canShowQuickQuestions = useMemo(
    () => status === "bot" && qaList.length > 0 && (botSettings?.show_suggested_questions ?? true),
    [status, qaList.length, botSettings?.show_suggested_questions],
  );

  if (!mounted) return null;

  return (
    <>
      {!open && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
          {showBubble && (
            <button
              onClick={openFromBubble}
              className="relative mb-1 mr-1 max-w-[260px] rounded-2xl rounded-br-md bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-[var(--shadow-elegant)] ring-1 ring-border animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <span className="block pr-5">تحتاج مساعدة؟ 👋</span>
              <span
                onClick={(e) => { e.stopPropagation(); dismissBubble(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="إغلاق"
                role="button"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            </button>
          )}
          <button
            onClick={() => setOpen(true)}
            aria-label="افتح شات الدعم"
            className="grid h-14 w-14 place-items-center rounded-full bg-[image:var(--gradient-accent)] text-accent-foreground shadow-[var(--shadow-elegant)] transition hover:scale-105"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
        </div>
      )}

      {open && (
        <div
          onMouseMove={resetIdle}
          onKeyDown={resetIdle}
          className="fixed bottom-5 right-5 z-50 flex h-[560px] max-h-[85vh] w-[360px] max-w-[95vw] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-[var(--shadow-elegant)]"
        >
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
                    <div className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: m.body.replace(OFFER_FLOW_MARKER, "").replace(VIP_FLOW_MARKER, "").replace(OFFER_WARN_DELIVERED_MARKER, "").replace(OFFER_WARN_CANCELLED_MARKER, "").trim() }} />
                  </div>
                </div>
              );
            })}

            {offerStep === "warning" && (
              <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {offerWarnType === "delivered"
                    ? "⚠️ تنبيه: هذا المشروع تم تسليمه. هل تريد المتابعة؟"
                    : "⚠️ تنبيه: هذا المشروع ملغي. هل تريد المتابعة؟"}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOfferStep("terms")}
                    className="flex-1 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    متابعة
                  </button>
                  <button
                    onClick={() => { setOfferStep(null); setOfferWarnType(null); setOfferError(null); }}
                    className="rounded-md border border-border px-3 py-2 text-xs hover:bg-secondary"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

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
                {([
                  ["projectName", "اسم المشروع"],
                  ["companyName", "اسم الشركة"],
                  ["email", "البريد الإلكتروني"],
                  ["amount", "قيمة العرض"],
                ] as const).map(([field, label]) => (
                  <input
                    key={field}
                    value={offerForm[field]}
                    onChange={(e) => setOfferForm((f) => ({ ...f, [field]: e.target.value }))}
                    placeholder={label}
                    type={field === "email" ? "email" : "text"}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                ))}
                <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-secondary/40 px-3 py-2 text-[11px] font-medium hover:bg-secondary">
                  <FileUp className="h-3.5 w-3.5" />
                  {offerFile ? offerFile.name : "رفع ملف العرض (PDF)"}
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setOfferFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {offerError && <div className="text-[11px] text-destructive">{offerError}</div>}
                <div className="flex gap-2">
                  <button
                    onClick={handleOfferSubmit}
                    disabled={offerBusy}
                    className="flex-1 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {offerBusy ? "جارٍ الإرسال…" : "إرسال العرض"}
                  </button>
                  <button
                    onClick={() => { setOfferStep(null); setOfferWarnType(null); setOfferError(null); }}
                    className="rounded-md border border-border px-3 py-2 text-xs hover:bg-secondary"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {offerStep === "done" && (
              <div className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background p-3 text-[11px] font-semibold text-foreground/80">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                تم استلام عرضك بنجاح. سيتم اشعاركم بأي تحديث
              </div>
            )}

            {vipStep === "terms" && (
              <div className="rounded-xl border border-border bg-background p-3">
                <div className="mb-2 space-y-1 text-[11px] text-muted-foreground">
                  {VIP_PLANS.map((p) => (
                    <div key={p.value} className="font-semibold text-foreground">{p.label}</div>
                  ))}
                  <div className="pt-1">تستقبل مشاريع خاصة عبر الإيميل بلا منافس + دعم فني VIP</div>
                  <div className="pt-1">IBAN: SA35 1000 0065 5000 4711 0807</div>
                </div>
                <button
                  onClick={() => setVipStep("form")}
                  className="w-full rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                >
                  أرغب بالاشتراك
                </button>
              </div>
            )}

            {vipStep === "form" && (
              <div className="space-y-2 rounded-xl border border-border bg-background p-3">
                <div className="text-[11px] font-semibold text-muted-foreground">بيانات الاشتراك:</div>
                <input
                  value={vipForm.name}
                  onChange={(e) => setVipForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="الاسم"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  value={vipForm.email}
                  onChange={(e) => setVipForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="البريد الإلكتروني"
                  type="email"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                />
                <select
                  value={vipForm.city}
                  onChange={(e) => setVipForm((f) => ({ ...f, city: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">اختر المدينة</option>
                  {SAUDI_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={vipForm.plan}
                  onChange={(e) => setVipForm((f) => ({ ...f, plan: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">اختر الباقة</option>
                  {VIP_PLANS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-secondary/40 px-3 py-2 text-[11px] font-medium hover:bg-secondary">
                  {vipOcrBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
                  {vipFile ? vipFile.name : "رفع صورة الإيصال"}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleVipFileChange(e.target.files?.[0] ?? null)}
                  />
                </label>
                {vipOcrBusy && (
                  <div className="text-[11px] text-muted-foreground text-center">جارٍ قراءة الإيصال…</div>
                )}
                {!vipOcrBusy && vipFile && (() => {
                  const amountNum = Number(vipOcrAmount);
                  const planAmount = Number(vipForm.plan.split("-")[0]);
                  const amountValid = VALID_PLAN_AMOUNTS.includes(amountNum) && (!Number.isFinite(planAmount) || amountNum === planAmount);
                  const dateValid = isWithinLast7Days(vipOcrDate);
                  const hasData = !vipOcrFailed && (!!vipOcrAmount || !!vipOcrDate);

                  if (!hasData) {
                    return (
                      <>
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-center">
                          <div className="text-[11px] font-semibold text-destructive">لم يتم العثور على بيانات</div>
                        </div>
                        <div className="text-[11px] text-destructive">
                          لم نتمكن من قراءة الإيصال. تأكد ان الصورة واضحة وفيها المبلغ والتاريخ
                        </div>
                        <button
                          onClick={() => {
                            setVipFile(null);
                            setVipOcrAmount("");
                            setVipOcrDate("");
                            setVipOcrText("");
                            setVipOcrFailed(false);
                            setVipError(null);
                          }}
                          className="w-full rounded-md border border-border px-3 py-1.5 text-[11px] hover:bg-secondary"
                        >
                          إعادة رفع الإيصال
                        </button>
                      </>
                    );
                  }

                  if (!vipReceiptValid) {
                    const reasons: string[] = [];
                    if (!VALID_PLAN_AMOUNTS.includes(amountNum)) {
                      reasons.push("المبلغ المستخرج غير صالح");
                    } else if (Number.isFinite(planAmount) && amountNum !== planAmount) {
                      reasons.push(`المبلغ المستخرج (${amountNum}) لا يطابق قيمة الباقة (${planAmount})`);
                    }
                    if (!dateValid) {
                      reasons.push("تاريخ الإيصال ليس ضمن آخر 7 أيام");
                    }
                    return (
                      <>
                        <div className="rounded-md border border-border bg-secondary/30 p-2.5 space-y-1.5">
                          <div className="text-[10px] font-semibold text-muted-foreground">ملخص البيانات:</div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">حساب البنك (IBAN)</span>
                            <span className="text-muted-foreground font-medium">{VIP_IBAN}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">المبلغ</span>
                            <span className={`font-semibold ${amountValid ? "text-green-600" : "text-destructive"}`}>
                              {vipOcrAmount ? `${vipOcrAmount} ريال` : "غير موجود"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">التاريخ</span>
                            <span className={`font-semibold ${dateValid ? "text-green-600" : "text-destructive"}`}>
                              {vipOcrDate || "غير موجود"}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          {reasons.map((r, i) => (
                            <div key={i} className="flex items-center gap-1 text-[11px] text-destructive">
                              <XCircle className="h-3 w-3 shrink-0" />
                              {r}
                            </div>
                          ))}
                        </div>
                        <div className="text-[11px] font-semibold text-destructive">
                          الإيصال غير صالح. تأكد من المبلغ وتاريخ الدفع
                        </div>
                        <button
                          onClick={() => {
                            setVipFile(null);
                            setVipOcrAmount("");
                            setVipOcrDate("");
                            setVipOcrText("");
                            setVipOcrFailed(false);
                            setVipError(null);
                          }}
                          className="w-full rounded-md border border-border px-3 py-1.5 text-[11px] hover:bg-secondary"
                        >
                          إعادة رفع الإيصال
                        </button>
                      </>
                    );
                  }

                  return (
                    <>
                      <div className="rounded-md border border-green-500/30 bg-green-500/5 p-2.5 space-y-1.5">
                        <div className="text-[10px] font-semibold text-green-600">ملخص البيانات:</div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">حساب البنك (IBAN)</span>
                          <span className="text-green-600 font-medium">{VIP_IBAN}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">المبلغ</span>
                          <span className="text-green-600 font-semibold">{vipOcrAmount} ريال</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">التاريخ</span>
                          <span className="text-green-600 font-semibold">{vipOcrDate}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        الإيصال صالح ومطابق للباقة المختارة
                      </div>
                    </>
                  );
                })()}
                {vipError && <div className="text-[11px] text-destructive">{vipError}</div>}
                <div className="flex gap-2">
                  {vipReceiptValid && (
                    <button
                      onClick={handleVipSubmit}
                      disabled={vipBusy}
                      className="flex-1 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {vipBusy ? "جارٍ الإرسال…" : "إرسال الطلب"}
                    </button>
                  )}
                  <button
                    onClick={() => { setVipStep(null); setVipError(null); }}
                    className="rounded-md border border-border px-3 py-2 text-xs hover:bg-secondary"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {vipStep === "done" && (
              <div className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background p-3 text-[11px] font-semibold text-foreground/80">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                تم استلام طلبك. سيتم إرسال تأكيد على إيميلك بعد الموافقة
              </div>
            )}

            {showEndAfterBot && token && !offerStep && !vipStep && (
              <div className="flex justify-start pt-1">
                <button
                  onClick={() => endSession()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-[11px] font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground transition"
                >
                  <PowerOff className="h-3 w-3" />
                  إنهاء المحادثة
                </button>
              </div>
            )}

          </div>

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

          <div className="border-t border-border bg-background p-2">
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
