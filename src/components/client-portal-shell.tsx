import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Crown, Ticket, X, BadgeCheck, Copy, Loader2, ChevronLeft, CheckCircle2, Printer, FolderKanban, PenTool } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { ClientPortal } from "@/components/client-portal";
import { listMyClientTickets } from "@/lib/client-tickets.functions";
import { getTicketUnreadCount } from "@/lib/client-ticket-unread";
import { getClientVipStatus } from "@/lib/client-vip.functions";
import { submitApprovalReceipt, clientListMyProjects, clientCreateTameedRequest, clientListMyTameedCodes } from "@/lib/tameed.functions";
import { uploadFile } from "@/lib/files.functions";
import { validateReceiptOcr, scanReceiptFile } from "@/lib/receipt-ocr";
import { toast } from "sonner";

type ApprovedReceiptInfo = {
  receipt_id: string;
  project_name: string;
  paid_amount: number;
  approved_at: string;
};

type ClientInstallment = {
  id?: string | number;
  number: number;
  amount: number;
  paid_amount: number;
  status: string;
};

function getInstallmentState(status: string): "due" | "paid" | "disabled" {
  const normalized = status.trim().toLowerCase();
  if (normalized === "paid" || normalized === "مدفوع") return "paid";
  if (normalized === "disabled" || normalized === "inactive" || normalized === "معطل") return "disabled";
  return "due";
}

function isActiveTameedStatus(status: string): boolean {
  return !["مكتمل", "ملغي", "cancelled", "completed", "complete", "used"].includes(status.trim().toLowerCase());
}

export function ClientPortalShell() {
  const listTickets = useServerFn(listMyClientTickets);
  const getVipStatus = useServerFn(getClientVipStatus);
  const uploadReceipt = useServerFn(uploadFile);
  const verifyReceipt = useServerFn(validateReceiptOcr);
  const submitReceipt = useServerFn(submitApprovalReceipt);
  const fetchMyProjects = useServerFn(clientListMyProjects);
  const fetchTameedCodes = useServerFn(clientListMyTameedCodes);
  const createTameed = useServerFn(clientCreateTameedRequest);
  const queryClient = useQueryClient();
  const [showVipIntro, setShowVipIntro] = useState(false);
  const [showTameed, setShowTameed] = useState(false);
  const [tameedCode, setTameedCode] = useState("");
  const [tameedStep, setTameedStep] = useState<"list" | "input" | "payment">("list");
  const [showNewTameedForm, setShowNewTameedForm] = useState(false);
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

  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [contractAgreed, setContractAgreed] = useState(false);
  const [tameedSubmitting, setTameedSubmitting] = useState(false);
  const [tameedToken, setTameedToken] = useState("");
  const [installmentsByCode, setInstallmentsByCode] = useState<Record<string, ClientInstallment[]>>({});
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);

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
  const { data: myProjects } = useQuery({
    queryKey: ["client-my-projects-tameed"],
    queryFn: () => fetchMyProjects(),
    enabled: showContractModal || showTameed,
  });
  const { data: myTameedCodes = [], refetch: refetchTameedCodes } = useQuery({
    queryKey: ["client-tameed-codes"],
    queryFn: () => fetchTameedCodes(),
    refetchOnMount: "always",
  });
  const unreadCount = tickets.reduce((total, ticket) => total + getTicketUnreadCount(ticket), 0);
  const allProjectsHaveActiveTameed = Boolean(myProjects && myProjects.length > 0 && myProjects.every((project) => myTameedCodes.some((code) => code.projectId === project.id && isActiveTameedStatus(code.status))));

  useEffect(() => {
    if (!showTameed || myTameedCodes.length === 0) return;
    let cancelled = false;

    async function loadInstallments(): Promise<void> {
      const entries = await Promise.all(myTameedCodes.map(async (tameedCode) => {
        const response = await fetch("/api/approvals/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: tameedCode.code }),
        });
        if (!response.ok) return [tameedCode.code, []] as const;
        const payload: { installments?: Array<Partial<ClientInstallment>> } = await response.json();
        const installments = (payload.installments ?? []).map((installment, index) => ({
          id: installment.id ?? installment.number ?? index + 1,
          number: Number(installment.number ?? index + 1),
          amount: Number(installment.amount ?? 0),
          paid_amount: Number(installment.paid_amount ?? 0),
          status: String(installment.status ?? "disabled"),
        }));
        return [tameedCode.code, installments] as const;
      }));

      if (!cancelled) setInstallmentsByCode(Object.fromEntries(entries));
    }

    void loadInstallments();
    return () => {
      cancelled = true;
    };
  }, [myTameedCodes, showTameed]);

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
    setTameedStep("list");
    setShowNewTameedForm(false);
    setTameedCode("");
    setTameedError("");
    setReceiptFile(null);
    setReceiptApproved(false);
    setReceiptAmount(null);
    setReceiptError("");
    setReceiptSent(false);
    setTameedResult(null);
    void refetchTameedCodes();
  }

  function closeTameed(): void {
    setShowTameed(false);
    setTameedStep("list");
    setShowNewTameedForm(false);
    setTameedCode("");
    setTameedError("");
    setReceiptFile(null);
    setReceiptApproved(false);
    setReceiptAmount(null);
    setReceiptError("");
    setReceiptSent(false);
    setTameedResult(null);
  }

  function openContractModal(): void {
    setShowContractModal(true);
    setSelectedProjectId("");
    setContractAgreed(false);
    setTameedToken("");
    if (sigCanvasRef.current) sigCanvasRef.current.clear();
  }

  function closeContractModal(): void {
    setShowContractModal(false);
    setShowNewTameedForm(false);
    setSelectedProjectId("");
    setContractAgreed(false);
    setTameedToken("");
    if (sigCanvasRef.current) sigCanvasRef.current.clear();
  }

  async function handleCreateTameed(): Promise<void> {
    if (!selectedProjectId) { toast.error("يرجى اختيار مشروع"); return; }
    if (myTameedCodes.some((code) => code.projectId === selectedProjectId && isActiveTameedStatus(code.status))) {
      toast.error("لديك تعميد فعال لهذا المشروع - لا يمكن إنشاء تعميد مكرر");
      return;
    }
    if (!contractAgreed) { toast.error("يرجى الموافقة على الالتزام"); return; }
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) { toast.error("يرجى التوقيع على العقد"); return; }

    const signatureDataUrl = sigCanvasRef.current.toDataURL("image/png");
    setTameedSubmitting(true);
    try {
      const result = await createTameed({ data: { project_id: selectedProjectId, signature_image: signatureDataUrl } });
      setTameedToken(result.token);
      setShowNewTameedForm(false);
      toast.success(`تم إنشاء طلب التعميد بنجاح: ${result.token}`);
      void queryClient.invalidateQueries({ queryKey: ["client-tameed-codes"] });
      void refetchTameedCodes();
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : "";
      toast.error(detail.startsWith("DUPLICATE_TAMEED:") ? "لديك تعميد فعال لهذا المشروع - لا يمكن إنشاء تعميد مكرر" : "تعذر إنشاء طلب التعميد");
    } finally {
      setTameedSubmitting(false);
    }
  }

  async function handleValidateToken(codeOverride?: string): Promise<void> {
    const codeToValidate = (codeOverride ?? tameedCode).trim();
    if (!codeToValidate) {
      toast.error("أدخل رمز التعميد");
      return;
    }
    setTameedLoading(true);
    try {
      const res = await fetch("/api/approvals/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToValidate }),
      });
      const result = { data: await res.json() };

      if (!result.data.valid) {
        const msg = result.data.error || "رمز التعميد غير صحيح";
        toast.error(msg);
        setTameedError(msg);
        return;
      }

      localStorage.setItem('approval_token', codeToValidate);
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

            {tameedStep === "list" && (
              <div className="mt-6 max-h-[60vh] space-y-3 overflow-y-auto">
                {myTameedCodes.length > 0 ? (
                  <>
                    {myTameedCodes.map((tc) => {
                      const installments = installmentsByCode[tc.code] ?? [];
                      const dueInstallments = installments.filter((installment) => getInstallmentState(installment.status) === "due");

                      return (
                      <div key={tc.id} className="rounded-xl border border-border bg-secondary/30 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <BadgeCheck className="h-4 w-4 text-blue-600" />
                            <span className="text-lg font-extrabold tracking-wider text-foreground" dir="ltr">{tc.code}</span>
                          </div>
                          <button type="button" onClick={(e) => void copyToClipboard(e, tc.code)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium transition hover:bg-secondary">
                            <Copy className="h-3 w-3" />
                            نسخ
                          </button>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">{tc.project_name || "—"}</div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          <span className="text-muted-foreground">الإجمالي: <span className="font-bold text-foreground">{tc.total.toLocaleString("en-US")} ر.س</span></span>
                          <span className="text-muted-foreground">المدفوع: <span className="font-bold text-emerald-700">{tc.paid.toLocaleString("en-US")} ر.س</span></span>
                          <span className="text-muted-foreground">المتبقي: <span className="font-bold text-foreground">{tc.remaining.toLocaleString("en-US")} ر.س</span></span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                            tc.status === "بانتظار التسعير"
                              ? "bg-yellow-100 text-yellow-800"
                              : tc.status === "نشط"
                              ? "bg-blue-100 text-blue-800"
                              : tc.status === "approved" || tc.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {tc.status === "بانتظار التسعير" ? "بانتظار التسعير" : tc.status === "نشط" ? "نشط" : tc.status}
                          </span>
                        </div>

                        {tc.status === "بانتظار التسعير" && (
                          <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2.5 text-sm font-semibold text-yellow-800">
                            طلبك قيد التسعير من الإدارة
                          </div>
                        )}

                        {dueInstallments.length > 0 && (
                          <div className="mt-3 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-800">
                            يوجد دفعة مستحقة
                          </div>
                        )}

                        {installments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {installments.map((installment) => {
                              const state = getInstallmentState(installment.status);
                              return (
                                <div key={`${tc.id}-${installment.number}`} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2">
                                  <div className="text-sm">
                                    <span className="font-bold">الدفعة {installment.number}</span>
                                    <span className="ms-2 text-muted-foreground">{installment.amount.toLocaleString("en-US")} ر.س</span>
                                  </div>
                                  {state === "paid" ? (
                                    <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">مدفوع</span>
                                  ) : state === "disabled" ? (
                                    <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">معطل</span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => { setTameedCode(tc.code); setTameedStep("input"); void handleValidateToken(tc.code); }}
                                      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
                                    >
                                      سداد الآن
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {installments.length === 0 && tc.remaining > 0 && (
                          <button
                            type="button"
                            onClick={() => { setTameedCode(tc.code); setTameedStep("input"); void handleValidateToken(tc.code); }}
                            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                          >
                            متابعة التعميد
                          </button>
                        )}
                      </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => { setShowNewTameedForm(true); openContractModal(); }}
                      disabled={allProjectsHaveActiveTameed}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-5 py-3 font-semibold text-blue-800 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-muted-foreground"
                    >
                      <BadgeCheck className="h-4 w-4" />
                      {allProjectsHaveActiveTameed ? "لا توجد مشاريع متاحة لتعميد جديد" : "تعميد جديد"}
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">لا يوجد لديك طلبات تعميد حالياً</p>
                    <button
                      type="button"
                      onClick={() => openContractModal()}
                      disabled={allProjectsHaveActiveTameed}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground"
                    >
                      <BadgeCheck className="h-4 w-4" />
                      {allProjectsHaveActiveTameed ? "لا توجد مشاريع متاحة لتعميد جديد" : "إنشاء تعميد جديد"}
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={closeTameed}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-background px-5 py-3 font-semibold text-foreground transition hover:bg-secondary"
                >
                  العودة للمنصة
                </button>
              </div>
            )}

            {tameedStep === "input" && (
              <div className="mt-6">
                {!showNewTameedForm && myTameedCodes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTameedStep("list")}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
                  >
                    <ChevronLeft className="h-4 w-4 rotate-180" />
                    العودة لقائمة التعميدات
                  </button>
                )}

                <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                  <p className="mb-2 font-bold">لإنشاء طلب تعميد جديد لمشروع:</p>
                  <button type="button" onClick={openContractModal} disabled={allProjectsHaveActiveTameed} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground">
                    <FolderKanban className="h-4 w-4" />
                    إنشاء طلب تعميد بمشروع
                  </button>
                </div>
                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border"></div>
                  <span className="text-xs text-muted-foreground">أو أدخل رمز تعميد موجود</span>
                  <div className="h-px flex-1 bg-border"></div>
                </div>
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
                <button
                  type="button"
                  onClick={closeTameed}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-border bg-background px-5 py-3 font-semibold text-foreground transition hover:bg-secondary"
                >
                  العودة للمنصة
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
                    العودة للمنصة
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {showContractModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="contract-modal-title">
          <div className="relative max-h-[calc(100vh-32px)] w-full max-w-lg overflow-y-auto rounded-3xl border border-blue-200 bg-card p-6 shadow-2xl sm:p-8">
            <button type="button" onClick={closeContractModal} aria-label="إغلاق" className="absolute left-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            {tameedToken ? (
              <>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h2 id="contract-modal-title" className="mt-5 text-center text-2xl font-extrabold text-emerald-800">تم إنشاء طلب التعميد</h2>
                <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                  <p className="text-sm font-semibold text-emerald-800">رمز التعميد الخاص بك</p>
                  <p className="mt-3 text-3xl font-extrabold tracking-wider text-emerald-900" dir="ltr">{tameedToken}</p>
                  <button type="button" onClick={(e) => void copyToClipboard(e, tameedToken)} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50">
                    <Copy className="h-4 w-4" />
                    نسخ الرمز
                  </button>
                </div>
                <p className="mt-4 text-center text-sm text-muted-foreground">سيقوم المسؤول بتحديد المبلغ وتفعيل الرمز قريباً.</p>
                <button type="button" onClick={() => { closeContractModal(); setTameedStep("list"); void refetchTameedCodes(); }} className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  تم
                </button>
              </>
            ) : (
              <>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                  <PenTool className="h-7 w-7" />
                </div>
                <h2 id="contract-modal-title" className="mt-5 text-center text-2xl font-extrabold">عقد التزام بدفع عمولة 2.5% لمنصة العمران</h2>

            <div className="mt-6 space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">اختر المشروع</p>
                <div className="space-y-2">
                  {(myProjects ?? []).map((project) => {
                    const activeTameed = myTameedCodes.find((code) => code.projectId === project.id && isActiveTameedStatus(code.status));
                    return (
                      <div key={project.id} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${selectedProjectId === project.id ? "border-blue-500 bg-blue-50" : "border-border bg-background"}`}>
                        <div className="flex min-w-0 items-center gap-2">
                          <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate text-sm font-semibold text-foreground">{project.name}</span>
                        </div>
                        {activeTameed ? (
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">لديك تعميد فعال</span>
                            <button type="button" onClick={() => { closeContractModal(); setShowTameed(true); setTameedStep("input"); setTameedCode(activeTameed.code); void handleValidateToken(activeTameed.code); }} className="text-xs font-bold text-blue-700 underline underline-offset-2">{activeTameed.code}</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setSelectedProjectId(project.id)} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700">
                            <BadgeCheck className="h-3.5 w-3.5" />
                            تعميد
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-secondary/30 p-4 text-sm leading-7 text-foreground">
                <p className="mb-3 font-bold">نص العقد:</p>
                <p>أتعهد وألتزم بأن أدفع لمنصة العمران عمولة بنسبة 2.5% من إجمالي قيمة المشروع المحدد، وذلك مقابل خدمات المنصة في ربط العملاء بالمشاريع وإدارتها.</p>
                <p className="mt-2">أقر بأنني اطلعت على شروط المنصة وأوافق عليها، وأن توقيعي أدناه يمثل موافقتي على هذا الالتزام.</p>
              </div>

              <label className="flex items-start gap-3 text-sm font-semibold text-foreground">
                <input
                  type="checkbox"
                  checked={contractAgreed}
                  onChange={(e) => setContractAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border"
                />
                <span>أوافق على عقد الالتزام بدفع عمولة 2.5% لمنصة العمران</span>
              </label>

              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">التوقيع</label>
                <div className="rounded-xl border-2 border-border bg-white">
                  <SignatureCanvas
                    ref={sigCanvasRef}
                    canvasProps={{
                      width: 400,
                      height: 150,
                      className: "w-full rounded-xl",
                      style: { touchAction: "none" },
                    }}
                  />
                </div>
                {sigCanvasRef.current && (
                  <button type="button" onClick={() => sigCanvasRef.current?.clear()} className="mt-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
                    مسح التوقيع
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => void handleCreateTameed()}
                disabled={tameedSubmitting || !selectedProjectId || !contractAgreed}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {tameedSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                إنشاء طلب التعميد
              </button>
              <button type="button" onClick={closeContractModal} className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-background px-5 py-3 font-semibold text-foreground transition hover:bg-secondary">
                إلغاء
              </button>
            </div>
              </>
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
