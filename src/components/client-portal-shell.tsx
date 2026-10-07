import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type MouseEvent } from "react";
import { Crown, Ticket, X, BadgeCheck, Copy, Loader2, ChevronLeft } from "lucide-react";
import { ClientPortal } from "@/components/client-portal";
import { listMyClientTickets } from "@/lib/client-tickets.functions";
import { getTicketUnreadCount } from "@/lib/client-ticket-unread";
import { getClientVipStatus } from "@/lib/client-vip.functions";
import { submitApprovalReceipt } from "@/lib/tameed.functions";
import { uploadFile } from "@/lib/files.functions";
import { validateReceiptOcr } from "@/lib/receipt-ocr";
import { toast } from "sonner";

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
  const [tameedResult, setTameedResult] = useState<{
    token_id: string;
    approved: boolean;
    amount: number;
    allowed_payment_now: number;
    bank_name: string;
    holder_name: string;
    iban: string;
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
      setTameedResult({
        token_id: String(result.data.token_id ?? ""),
        approved: false,
        amount: Number(result.data.amount ?? 0),
        allowed_payment_now: Number(result.data.allowed_payment_now ?? result.data.amount ?? 0),
        bank_name: String(result.data.bankAccount?.bank_name ?? result.data.bank_name ?? ""),
        holder_name: String(result.data.bankAccount?.holder_name ?? result.data.holder_name ?? ""),
        iban: String(result.data.bankAccount?.iban ?? result.data.iban ?? ""),
      });
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
      const imageData = await fileToBase64(file);
      const result = await verifyReceipt({
        data: { imageData, expectedAmount: tameedResult.allowed_payment_now },
      });
      setReceiptAmount(result.result.amount);
      if (!result.approved) {
        setReceiptError(result.result.amount !== tameedResult.allowed_payment_now
          ? "المبلغ في الإيصال غير مطابق للمبلغ المطلوب"
          : result.reason);
        return;
      }
      setReceiptApproved(true);
    } catch {
      setReceiptError("تعذر فحص الإيصال");
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
        data: { filename: receiptFile.name, mime: receiptFile.type, purpose: "other", data: imageData },
      });
      await submitReceipt({
        data: { token_id: tameedResult.token_id, receipt_path: uploaded.key, amount: receiptAmount ?? tameedResult.allowed_payment_now },
      });
      setReceiptSent(true);
    } catch {
      setReceiptError("تعذر إرسال التعميد");
    } finally {
      setReceiptSubmitting(false);
    }
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

  return (
    <div className="relative">
      <ClientPortal />
      <div className="pointer-events-none absolute left-2 top-[184px] z-50 flex flex-col gap-2 sm:left-4 sm:top-[200px]">
        <Link to="/client-support/tickets" className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-lg transition hover:bg-emerald-100">
          <Ticket className="h-4 w-4" />
          تذاكر الدعم
          {unreadCount > 0 && <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-700 px-1.5 py-0.5 text-xs font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        </Link>
        <button type="button" onClick={openTameed} className="pointer-events-auto absolute -top-24 left-0 inline-flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-800 shadow-lg transition hover:bg-blue-100">
          <BadgeCheck className="h-4 w-4" />
          تعميد
        </button>
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
                        <span className="font-mono text-sm font-bold text-foreground" dir="ltr">{tameedResult.iban}</span>
                        <button type="button" onClick={(e) => void copyToClipboard(e, tameedResult.iban)} style={{ pointerEvents: "auto", zIndex: 10 }} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium transition hover:bg-secondary">
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
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center font-bold text-emerald-800">
                      تم ارسال اعتمادكم بنجاح سيتم اشعاركم لاحقا
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
