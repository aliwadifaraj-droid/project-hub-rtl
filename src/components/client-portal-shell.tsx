import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Crown, Ticket, X, BadgeCheck, Copy, Loader2, ChevronLeft, CheckCircle2, Info, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { ClientPortal } from "@/components/client-portal";
import { listMyClientTickets } from "@/lib/client-tickets.functions";
import { getTicketUnreadCount } from "@/lib/client-ticket-unread";
import { getClientVipStatus } from "@/lib/client-vip.functions";
import { submitApprovalReceipt } from "@/lib/tameed.functions";
import { uploadFile } from "@/lib/files.functions";
import { validateReceiptOcr, scanReceiptFile } from "@/lib/receipt-ocr";
import { toast } from "sonner";

type ApprovedReceiptInfo = {
  receipt_id: string;
  project_name: string;
  paid_amount: number;
  approved_at: string;
};

export function ClientPortalShell() {
  const listTickets = useServerFn(listMyClientTickets);
  const getVipStatus = useServerFn(getClientVipStatus);
  const uploadReceipt = useServerFn(uploadFile);
  const verifyReceipt = useServerFn(validateReceiptOcr);
  const submitReceipt = useServerFn(submitApprovalReceipt);
  const queryClient = useQueryClient();
  const [showVipIntro, setShowVipIntro] = useState(false);
  const [showTameed, setShowTameed] = useState(false);
  const [tameedCode, setTameedCode] = useState("");
  const [tameedStep, setTameedStep] = useState<"input" | "payment">("input");
  const [tameedLoading, setTameedLoading] = useState(false);
  const [tameedError, setTameedError] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptSubmitting, setReceiptSubmitting] = useState(false);
  const [receiptApproved, setReceiptApproved] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState<number | null>(null);
  const [receiptError, setReceiptError] = useState("");
  const [receiptSent, setReceiptSent] = useState(false);
  const [approvalButtonState, setApprovalButtonState] = useState<"idle" | "pending" | "approved">("idle");
  const [approvedInfo, setApprovedInfo] = useState<ApprovedReceiptInfo | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptModalData, setReceiptModalData] = useState<{ code: string; amount: number } | null>(null);
  const approvalPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [tameedResult, setTameedResult] = useState<{
    token_id: string;
    approved: boolean;
    amount: number;
    allowed_payment_now: number;
    bank_name: string;
    holder_name: string;
    iban: string;
    account_number: string;
  } | null>(null);

  const { data: tickets = [] } = useQuery({
    queryKey: ["client-support-tickets"],
    queryFn: () => listTickets(),
    refetchInterval: 5000,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });
  const { data: vipStatus } = useQuery({
    queryKey: ["client-vip-status"],
    queryFn: () => getVipStatus(),
    refetchInterval: 10000,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });
  const unreadCount = tickets.reduce((total, ticket) => total + getTicketUnreadCount(ticket), 0);

  useEffect(() => {
    let cancelled = false;
    const code = localStorage.getItem("approval_token")?.trim();
    if (!code) return () => undefined;

    async function restoreApprovalState(): Promise<void> {
      try {
        const response = await fetch("/api/approvals/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await response.json();
        if (cancelled || !data.valid) return;

        if (data.receipt_status === "pending") {
          setReceiptSent(true);
          setApprovalButtonState("pending");
          return;
        }

        if (data.status === "approved" || data.status === "completed" || data.receipt_status === "approved") {
          const receiptId = String(data.receipt_id ?? data.token_id ?? "");
          if (localStorage.getItem("lastSeenApprovedId") === receiptId) return;
          setApprovedInfo({
            receipt_id: receiptId,
            project_name: String(data.project_name ?? ""),
            paid_amount: Number(data.receipt_paid_amount ?? data.paid_amount ?? data.amount ?? 0),
            approved_at: String(data.approved_at ?? new Date().toISOString()),
          });
          setApprovalButtonState("approved");
        }
      } catch {
        return;
      }
    }

    void restoreApprovalState();
    return () => {
      cancelled = true;
      if (approvalPollRef.current) clearInterval(approvalPollRef.current);
    };
  }, []);

  function stopApprovalPolling(): void {
    if (approvalPollRef.current) {
      clearInterval(approvalPollRef.current);
      approvalPollRef.current = null;
    }
  }

  function resetApprovalButton(): void {
    stopApprovalPolling();
    setApprovalButtonState("idle");
    setApprovedInfo(null);
  }

  function closeVipIntro(): void {
    setShowVipIntro(false);
    void queryClient.invalidateQueries({ queryKey: ["client-vip-status"] });
  }

  function openTameed(): void {
    setShowTameed(true);
    setTameedStep("input");
    setTameedCode("");
    setTameedError("");
    setReceiptFile(null);
    setReceiptApproved(false);
    setReceiptAmount(null);
    setReceiptError("");
    setReceiptSent(false);
    setTameedResult(null);
  }

  function closeTameed(): void {
    setShowTameed(false);
    setTameedStep("input");
    setTameedCode("");
    setTameedError("");
    setReceiptFile(null);
    setReceiptApproved(false);
    setReceiptAmount(null);
    setReceiptError("");
    setReceiptSent(false);
    setTameedResult(null);
  }

  async function handleValidateToken(): Promise<void> {
    if (!tameedCode.trim()) {
      toast.error("أدخل رمز التعميد");
      return;
    }
    setTameedLoading(true);
    try {
      const res = await fetch("/api/approvals/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: tameedCode.trim() }),
      });
      const result = { data: await res.json() };

      if (!result.data.valid) {
        const msg = result.data.error || "رمز التعميد غير صحيح";
        toast.error(msg);
        setTameedError(msg);
        return;
      }

      localStorage.setItem('approval_token', tameedCode.trim());
      localStorage.setItem('approval_data', JSON.stringify(result.data));
      const bankAccount = result.data.bankAccount ?? {};
      const iban = String(bankAccount.iban ?? result.data.iban ?? "");
      const accountNumber = String(bankAccount.account_number ?? result.data.account_number ?? iban ?? "");
      setTameedResult({
        token_id: String(result.data.token_id ?? ""),
        approved: result.data.status === "approved" || result.data.status === "completed",
        amount: Number(result.data.amount ?? 0),
        allowed_payment_now: Number(result.data.allowed_payment_now ?? result.data.amount ?? 0),
        bank_name: String(bankAccount.bank_name ?? result.data.bank_name ?? ""),
        holder_name: String(bankAccount.holder_name ?? result.data.holder_name ?? ""),
        iban,
        account_number: accountNumber,
      });
      if (result.data.receipt_status === "pending") {
        setReceiptSent(true);
        setApprovalButtonState("pending");
      } else if (result.data.status === "approved" || result.data.status === "completed" || result.data.receipt_status === "approved") {
        setApprovalButtonState("approved");
      }
      setTameedStep('payment');
      setTameedError('');
      toast.success("تم التحقق من الرمز بنجاح");
    } catch {
      const msg = "تعذر التحقق من رمز التعميد";
      toast.error(msg);
      setTameedError(msg);
    } finally {
      setTameedLoading(false);
    }
  }

  async function handleReceiptUpload(file: File | null): Promise<void> {
    setReceiptFile(file);
    setReceiptApproved(false);
    setReceiptAmount(null);
    setReceiptError("");
    setReceiptSent(false);
    if (!file || !tameedResult) return;
    if (!file.type.startsWith("image/")) {
      setReceiptError("يجب رفع صورة الإيصال");
      return;
    }

    setReceiptLoading(true);
    try {
      const ocrResult = await scanReceiptFile(file);
      const requiredAmount = Number(tameedResult.allowed_payment_now);
      setReceiptAmount(ocrResult.amount);
      const result = await verifyReceipt({
        data: { amount: ocrResult.amount, date: ocrResult.date, expectedAmount: requiredAmount },
      });
      if (!result.approved) {
        setReceiptError(result.reason || "المبلغ في الإيصال غير مطابق للمبلغ المطلوب");
        return;
      }
      setReceiptApproved(true);
    } catch {
      setReceiptError("تعذر فحص الإيصال. حاول برفع صورة أوضح.");
    } finally {
      setReceiptLoading(false);
    }
  }

  async function handleSubmitReceipt(): Promise<void> {
    if (!receiptFile || !receiptApproved || !tameedResult) return;
    setReceiptSubmitting(true);
    setReceiptError("");
    try {
      const imageData = await fileToBase64(receiptFile);
      const uploaded = await uploadReceipt({
        data: { filename: receiptFile.name, mime: receiptFile.type, purpose: "vip-receipt", data: imageData },
      });
      await submitReceipt({
        data: { token_id: tameedResult.token_id, receipt_path: uploaded.key, amount: receiptAmount ?? tameedResult.allowed_payment_now },
      });
      setReceiptSent(true);
      setApprovalButtonState("pending");
      setReceiptModalData({ code: tameedCode.trim(), amount: receiptAmount ?? tameedResult.allowed_payment_now });
      setShowReceiptModal(true);
      startApprovalPolling(tameedCode.trim());
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : "سبب غير معروف";
      setReceiptError(`تعذر إرسال التعميد: ${detail}`);
    } finally {
      setReceiptSubmitting(false);
    }
  }

  function startApprovalPolling(code: string): void {
    stopApprovalPolling();
    if (!code) return;

    const checkApproval = async (): Promise<void> => {
      try {
        const response = await fetch("/api/approvals/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await response.json();
        if (!data.valid || (data.status !== "approved" && data.status !== "completed")) return;

        stopApprovalPolling();

        const receiptId = String(data.receipt_id ?? data.token_id ?? "");
        const lastSeen = localStorage.getItem("lastSeenApprovedId");

        if (lastSeen === receiptId) {
          resetApprovalButton();
          return;
        }

        setApprovedInfo({
          receipt_id: receiptId,
          project_name: String(data.project_name ?? ""),
          paid_amount: Number(data.paid_amount ?? data.amount ?? 0),
          approved_at: String(data.approved_at ?? new Date().toISOString()),
        });
        setApprovalButtonState("approved");
      } catch {
        return;
      }
    };

    void checkApproval();
    approvalPollRef.current = setInterval(() => void checkApproval(), 3000);
  }

  function closeApprovalModal(): void {
    if (approvedInfo) {
      localStorage.setItem("lastSeenApprovedId", approvedInfo.receipt_id);
    }
    setShowApprovalModal(false);
    resetApprovalButton();
  }

  async function copyToClipboard(e: MouseEvent<HTMLButtonElement>, text: string): Promise<void> {
    e.preventDefault();
    e.stopPropagation();
    const cleanText = String(text || "").trim();
    if (!cleanText) return;

    try {
      await navigator.clipboard.writeText(cleanText);
      alert(`تم النسخ: ${cleanText}`);
      return;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = cleanText;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, cleanText.length);
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(textarea);
      }
      alert(`تم النسخ: ${cleanText}`);
    }
  }

  function formatGregorianDate(isoString: string): string {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  }

  return (
    <div className="relative">
      <ClientPortal />
      <div className="pointer-events-none absolute left-2 top-[184px] z-50 flex flex-col gap-2 sm:left-4 sm:top-[200px]">
        <Link to="/client-support/tickets" className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-lg transition hover:bg-emerald-100">
          <Ticket className="h-4 w-4" />
          تذاكر الدعم
          {unreadCount > 0 && <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-700 px-1.5 py-0.5 text-xs font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        </Link>
        {approvalButtonState === "approved" ? (
          <div className="pointer-events-auto absolute -top-24 left-0 flex flex-col gap-1.5">
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-100 px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-lg">
              <CheckCircle2 className="h-4 w-4" />
              تم اعتماد العمولة
            </div>
            <button
              type="button"
              onClick={() => setShowApprovalModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
            >
              <Info className="h-3.5 w-3.5" />
              اضغط للتفاصيل
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={openTameed}
            disabled={approvalButtonState === "pending"}
            className={`pointer-events-auto absolute -top-24 left-0 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg transition ${
              approvalButtonState === "pending"
                ? "cursor-wait border border-yellow-300 bg-yellow-100 text-yellow-800"
                : "border border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100"
            }`}
          >
            <BadgeCheck className="h-4 w-4" />
            {approvalButtonState === "pending" ? "قيد المراجعة" : "تعميد"}
          </button>
        )}
        {vipStatus?.isPremium ? (
          <div className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 shadow-lg">
            <Crown className="h-4 w-4" />
            عميل مميز
          </div>
        ) : (
          <button type="button" onClick={() => setShowVipIntro(true)} className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 shadow-lg transition hover:bg-amber-100">
            <Crown className="h-4 w-4" />
            كن عميلاً مميزاً
          </button>
        )}
      </div>

      {showApprovalModal && approvedInfo && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="approval-modal-title">
          <div className="relative w-full max-w-md rounded-3xl border border-emerald-200 bg-card p-6 shadow-2xl sm:p-8">
            <button type="button" onClick={closeApprovalModal} aria-label="إغلاق" className="absolute left-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 id="approval-modal-title" className="mt-5 text-center text-2xl font-extrabold text-emerald-800">تفاصيل اعتماد العمولة</h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground">اسم المشروع</p>
                <p className="mt-1 text-sm font-bold text-foreground">{approvedInfo.project_name || "—"}</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground">المبلغ المدفوع</p>
                <p className="mt-1 text-lg font-extrabold text-emerald-700">
                  {approvedInfo.paid_amount.toLocaleString("en-US")} <span className="text-sm font-medium text-muted-foreground">ر.س</span>
                </p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground">تاريخ الاعتماد</p>
                <p className="mt-1 text-sm font-bold text-foreground" dir="ltr">{formatGregorianDate(approvedInfo.approved_at)}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeApprovalModal}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              إغلاق ومتابعة
            </button>
          </div>
        </div>
      )}

      {showVipIntro && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="vip-intro-title">
          <div className="relative w-full max-w-lg rounded-3xl border border-amber-200 bg-card p-6 shadow-2xl sm:p-8">
            <button type="button" onClick={closeVipIntro} aria-label="إغلاق" className="absolute left-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700">
              <Crown className="h-7 w-7" />
            </div>
            <h2 id="vip-intro-title" className="mt-5 text-center text-2xl font-extrabold">كن من عملاء منصة العمران المميزين</h2>
            <p className="mt-4 text-center leading-8 text-muted-foreground">
              كعميل مميز، لن تبحث عن المشاريع، بل المشاريع هي من ستصلك.
              <br />
              ستصلك مشاريع حصرية ومفلترة حسب مدينتك فقط، مع دعم فني فوري يرد عليك في ثوانٍ، لتكون تجربتك أسرع وأوضح.
            </p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
              <button type="button" onClick={closeVipIntro} className="inline-flex flex-1 items-center justify-center rounded-xl border border-border bg-background px-5 py-3 font-semibold text-foreground transition hover:bg-secondary">
                لاحقاً
              </button>
              <Link to="/vip/" onClick={closeVipIntro} className="inline-flex flex-1 items-center justify-center rounded-xl bg-amber-600 px-5 py-3 font-bold text-white transition hover:bg-amber-700">
                نعم، أريد أن أكون مميزاً
              </Link>
            </div>
          </div>
        </div>
      )}

      {showTameed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="tameed-title">
          <div className="relative w-full max-w-md rounded-3xl border border-blue-200 bg-card p-6 shadow-2xl sm:p-8">
            <button type="button" onClick={closeTameed} aria-label="إغلاق" className="absolute left-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-100 text-blue-700">
              <BadgeCheck className="h-7 w-7" />
            </div>
            <h2 id="tameed-title" className="mt-5 text-center text-2xl font-extrabold">تعميد العميل</h2>

            {tameedStep === "input" && (
              <div className="mt-6">
                <label htmlFor="tameed-token" className="mb-2 block text-sm font-semibold text-foreground">
                  أدخل رمز التعميد
                </label>
                <input
                  id="tameed-token"
                  type="text"
                  value={tameedCode}
                  onChange={(e) => { setTameedCode(e.target.value); setTameedError(""); }}
                  placeholder="AOM-XXXXXX"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-lg font-bold tracking-wider outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  dir="ltr"
                  autoComplete="off"
                />
                {tameedError && (
                  <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive">
                    {tameedError}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleValidateToken}
                  disabled={tameedLoading || !tameedCode.trim()}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {tameedLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جارٍ التحقق...
                    </>
                  ) : (
                    <>
                      <ChevronLeft className="h-4 w-4" />
                      متابعة
                    </>
                  )}
                </button>
              </div>
            )}

            {tameedStep === "payment" && tameedResult && (
              tameedResult.approved ? (
                <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center text-xl font-extrabold text-emerald-800">
                  تم الاعتماد
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="mb-3">
                      <div className="text-xs font-medium text-muted-foreground">اسم صاحب الحساب</div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="font-bold text-foreground" dir="ltr">{tameedResult.holder_name}</span>
                        <button type="button" onClick={(e) => void copyToClipboard(e, tameedResult.holder_name)} style={{ pointerEvents: "auto", zIndex: 10 }} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium transition hover:bg-secondary">
                          <Copy className="h-3 w-3" />
                          نسخ
                        </button>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="text-xs font-medium text-muted-foreground">رقم الحساب (IBAN)</div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-bold text-foreground" dir="ltr">{tameedResult.iban || tameedResult.account_number}</span>
                        <button type="button" onClick={(e) => void copyToClipboard(e, tameedResult.iban || tameedResult.account_number)} style={{ pointerEvents: "auto", zIndex: 10 }} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium transition hover:bg-secondary">
                          <Copy className="h-3 w-3" />
                          نسخ
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-muted-foreground">المبلغ المطلوب</div>
                      <div className="mt-1 text-2xl font-extrabold text-blue-700">
                        {tameedResult.amount.toLocaleString("en-US")} <span className="text-sm font-medium text-muted-foreground">ريال</span>
                        <div className="mt-1 text-sm font-semibold text-muted-foreground">
                          المبلغ المسموح الآن: {tameedResult.allowed_payment_now.toLocaleString("en-US")} ريال
                        </div>
                      </div>
                    </div>
                  </div>

                  {receiptSent ? (
                    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-center font-bold text-yellow-800">
                      شكراً لك، تم رفع الإيصال بنجاح وهو الآن قيد المراجعة.
                    </div>
                  ) : (
                    <>
                      <label htmlFor="tameed-receipt" className="block text-sm font-semibold text-foreground">صورة الإيصال
                        <input id="tameed-receipt" type="file" accept="image/*" onChange={(event) => void handleReceiptUpload(event.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-xl border border-border bg-background px-3 py-3 text-sm" />
                      </label>
                      {receiptLoading && <p className="text-sm text-muted-foreground">جارٍ فحص الإيصال...</p>}
                      {receiptAmount !== null && receiptApproved && <p className="text-sm font-semibold text-emerald-700">تم مطابقة مبلغ الإيصال</p>}
                      {receiptError && <p className="text-sm font-semibold text-destructive">{receiptError}</p>}
                      <button type="button" onClick={() => void handleSubmitReceipt()} disabled={!receiptApproved || receiptSubmitting || receiptLoading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                        {receiptSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        إرسال التعميد
                      </button>
                    </>
                  )}
                  <button type="button" onClick={closeTameed} className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-background px-5 py-3 font-semibold text-foreground transition hover:bg-secondary">
                    تم
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {showReceiptModal && receiptModalData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 print:bg-none print:p-0" role="dialog" aria-modal="true" aria-labelledby="receipt-modal-title">
          <div className="receipt-card relative w-[90vw] max-w-sm rounded-2xl border border-border bg-white p-4 shadow-2xl print:shadow-none sm:p-6">
            <button
              type="button"
              onClick={() => setShowReceiptModal(false)}
              aria-label="إغلاق الإيصال"
              className="absolute left-3 top-3 rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 print:hidden"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 id="receipt-modal-title" className="mb-6 text-center text-xl font-bold text-emerald-600">
              إيصال معتمد ✓
            </h2>

            <div className="space-y-2 text-center">
              <p className="text-lg font-bold text-gray-800">منصة العمران</p>
              <p className="text-sm text-gray-500" dir="ltr">ali-alhaddad.com</p>
              <div className="my-3 border-t border-dashed border-gray-200" />
              <p className="text-sm text-gray-600">
                رقم العملية: <span className="font-bold text-gray-800" dir="ltr">{receiptModalData.code}</span>
              </p>
              <p className="text-sm text-gray-600">
                المبلغ: <span className="font-bold text-gray-800">{receiptModalData.amount.toLocaleString("en-US")} ر.س</span>
              </p>
              <p className="text-sm text-gray-600">
                التاريخ: <span className="font-bold text-gray-800">{new Date().toLocaleString("ar-SA")}</span>
              </p>
            </div>

            <div className="my-4 border-t border-dashed border-gray-200" />

            <div className="flex flex-row items-center justify-center gap-4 px-2">
              <div className="order-2 flex flex-shrink-0 flex-col items-center">
                <img src="/seal.svg" alt="ختم" className="h-[38px] w-[38px] opacity-80 sm:h-[70px] sm:w-[70px]" />
                <span className="text-[7px] text-gray-500">
                  {new Date().toLocaleDateString('ar-EG', {day:'2-digit', month:'2-digit'})}
                </span>
              </div>
              <div className="order-1 flex-shrink-0">
                <QRCodeSVG
                  value={`https://ali-alhaddad.com/verify/${receiptModalData.code}`}
                  size={90}
                  level="M"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowReceiptModal(false)}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 font-bold text-gray-700 transition hover:bg-gray-50 print:hidden"
            >
              العودة للمنصة
            </button>

            <p className="mt-4 text-center text-xs text-gray-400">
              وثيقة صادرة إلكترونياً ويمكن التحقق عبر QR
            </p>

            <button
              type="button"
              onClick={() => window.print()}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700 print:hidden"
            >
              <Printer className="h-4 w-4" />
              طباعة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
