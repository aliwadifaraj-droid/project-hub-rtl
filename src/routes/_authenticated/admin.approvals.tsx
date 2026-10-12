import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BadgeCheck, X, Loader2, Check, Building2, FolderKanban, Coins, Wallet, Receipt, Image as ImageIcon, CheckCircle2, XCircle, Trash2, PenTool, Clock } from "lucide-react";
import { adminAddApprovalInstallment, adminListApprovalTokens, adminListApprovalReceipts, adminGetApprovalClients, adminGetApprovalProjects, adminApproveReceipt, adminRejectReceipt, adminGetBankInfo, adminDeleteApprovalToken, adminDeleteApprovalReceipt, adminSetTokenAmount } from "@/lib/approvals.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/approvals")({ component: AdminApprovalsPage });

type ClientOption = { id: string; client_id: string; name: string; email: string };
type ProjectOption = { id: string; name: string };

function AdminApprovalsPage() {
  const fetchTokens = useServerFn(adminListApprovalTokens);
  const fetchReceipts = useServerFn(adminListApprovalReceipts);
  const fetchClients = useServerFn(adminGetApprovalClients);
  const fetchProjects = useServerFn(adminGetApprovalProjects);
  const fetchBankInfo = useServerFn(adminGetBankInfo);
  const doAddInstallment = useServerFn(adminAddApprovalInstallment);
  const doApprove = useServerFn(adminApproveReceipt);
  const doReject = useServerFn(adminRejectReceipt);
  const doDeleteToken = useServerFn(adminDeleteApprovalToken);
  const doDeleteReceipt = useServerFn(adminDeleteApprovalReceipt);
  const doSetTokenAmount = useServerFn(adminSetTokenAmount);
  const qc = useQueryClient();
  const [addTokenId, setAddTokenId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [amountModalToken, setAmountModalToken] = useState<{ id: string; token_code: string; client_name: string; project_name: string; signature_image: string | null } | null>(null);
  const [amountValue, setAmountValue] = useState("");
  const [firstDueValue, setFirstDueValue] = useState("");
  const [amountSaving, setAmountSaving] = useState(false);

  const { data: tokens, isLoading: tokensLoading } = useQuery({ queryKey: ["approval-tokens"], queryFn: () => fetchTokens() });
  const { data: receipts, isLoading: receiptsLoading } = useQuery({ queryKey: ["approval-receipts"], queryFn: () => fetchReceipts() });
  const { data: bankInfo } = useQuery({ queryKey: ["approval-bank-info"], queryFn: () => fetchBankInfo() });

  async function handleAddInstallment(e: React.FormEvent) {
    e.preventDefault();
    if (!addTokenId || !addAmount) return;
    try { await doAddInstallment({ data: { token_id: addTokenId, amount: addAmount } }); toast.success("تمت إضافة الدفعة"); setAddTokenId(null); setAddAmount(""); qc.invalidateQueries({ queryKey: ["approval-tokens"] }); }
    catch (error: any) { toast.error(error?.message ?? "تعذر إضافة الدفعة"); }
  }

  async function handleDeleteToken(tokenId: string) {
    if (!window.confirm("سيتم حذف رمز التعميد وجميع دفعاته وإيصالاته وملفاتها من التخزين. هل تريد المتابعة؟")) return;
    try { await doDeleteToken({ data: { id: tokenId } }); toast.success("تم حذف رمز التعميد وملحقاته"); qc.invalidateQueries({ queryKey: ["approval-tokens"] }); qc.invalidateQueries({ queryKey: ["approval-receipts"] }); }
    catch (error: any) { toast.error(error?.message ?? "تعذر حذف رمز التعميد"); }
  }

  async function handleDeleteReceipt(receiptId: string) {
    if (!window.confirm("سيتم حذف الإيصال وملفه من التخزين نهائياً. هل تريد المتابعة؟")) return;
    try { await doDeleteReceipt({ data: { id: receiptId } }); toast.success("تم حذف الإيصال وملفه"); qc.invalidateQueries({ queryKey: ["approval-receipts"] }); }
    catch (error: any) { toast.error(error?.message ?? "تعذر حذف الإيصال"); }
  }

  async function handleApprove(receiptId: string) {
    try { const result = await doApprove({ data: { receipt_id: receiptId } }); toast.success(`تم اعتماد الإيصال. المتبقي: ${result.remaining.toFixed(2)} ريال`); qc.invalidateQueries({ queryKey: ["approval-receipts"] }); qc.invalidateQueries({ queryKey: ["approval-tokens"] }); }
    catch (error: any) { toast.error(error?.message ?? "فشل الاعتماد"); }
  }
  async function handleReject(receiptId: string) {
    try { await doReject({ data: { receipt_id: receiptId } }); toast.success("تم رفض الإيصال"); qc.invalidateQueries({ queryKey: ["approval-receipts"] }); }
    catch (error: any) { toast.error(error?.message ?? "فشل الرفض"); }
  }

  async function handleSetAmount(e: React.FormEvent) {
    e.preventDefault();
    if (!amountModalToken || !amountValue) { toast.error("أدخل المبلغ"); return; }
    if (!firstDueValue) { toast.error("أدخل مبلغ الدفعة الأولى"); return; }
    const val = Number(amountValue);
    const firstDue = Number(firstDueValue);
    if (!Number.isFinite(val) || val <= 0) { toast.error("المبلغ غير صحيح"); return; }
    if (!Number.isFinite(firstDue) || firstDue <= 0) { toast.error("مبلغ الدفعة الأولى غير صحيح"); return; }
    if (firstDue > val + 0.01) { toast.error("الدفعة الأولى لا يمكن أن تتجاوز الإجمالي"); return; }
    setAmountSaving(true);
    try {
      await doSetTokenAmount({ data: { token_id: amountModalToken.id, total_amount: amountValue, first_due_amount: firstDueValue } });
      toast.success(`تم تحديد المبلغ وتفعيل الرمز: ${amountValue} ريال`);
      setAmountModalToken(null); setAmountValue(""); setFirstDueValue("");
      qc.invalidateQueries({ queryKey: ["approval-tokens"] });
    } catch (error: any) {
      toast.error(error?.message ?? "تعذر تحديد المبلغ");
    } finally {
      setAmountSaving(false);
    }
  }

  function formatDate(value: string | null | undefined) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("ar-SA"); }

  function renderStatusBadge(status: string) {
    if (status === "بانتظار التسعير") {
      return <span className="inline-flex items-center gap-1 rounded-md bg-yellow-100 px-2 py-1 text-xs font-bold text-yellow-800"><Clock className="h-3 w-3" /> بانتظار تحديد المبلغ</span>;
    }
    if (status === "نشط" || status === "active") {
      return <span className="inline-flex items-center gap-1 text-blue-600"><Check className="h-3 w-3" /> نشط</span>;
    }
    if (status === "approved" || status === "معتمد") {
      return <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3 w-3" /> معتمد</span>;
    }
    return <span>{status}</span>;
  }

  return <div className="space-y-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground"><BadgeCheck className="h-5 w-5" /></span><div><h1 className="text-xl font-bold">اعتماد العملاء</h1><p className="text-sm text-muted-foreground">رموز التعميد والإيصالات</p></div></div></div>
    {bankInfo?.iban && <div className="rounded-lg border border-border bg-card p-4 text-sm"><div className="mb-1 font-semibold text-muted-foreground">معلومات البنك</div><div className="flex flex-wrap gap-4">{bankInfo.bank_name && <span><strong>البنك:</strong> {bankInfo.bank_name}</span>}{bankInfo.account_name && <span><strong>اسم الحساب:</strong> {bankInfo.account_name}</span>}<span><strong>IBAN:</strong> {bankInfo.iban}</span></div></div>}
    <section><h2 className="mb-3 text-lg font-bold">رموز التعميد</h2>{tokensLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : !(tokens ?? []).length ? <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">لا توجد رموز تعميد بعد.</div> : <div className="overflow-x-auto rounded-xl border border-border bg-card"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b border-border bg-secondary/50 text-right"><th className="px-3 py-3">الرمز</th><th className="px-3 py-3">العميل</th><th className="px-3 py-3">المشروع</th><th className="px-3 py-3">الإجمالي</th><th className="px-3 py-3">الدفعات</th><th className="px-3 py-3">المدفوع</th><th className="px-3 py-3">المتبقي</th><th className="px-3 py-3">الحالة</th></tr></thead><tbody>{(tokens ?? []).map((token) => { const paid = Number(token.paid_amount) || 0; const total = Number(token.total_commission) || 0; const isPricing = token.status === "بانتظار التسعير"; return <tr key={token.id} className="border-b border-border/50"><td className="px-3 py-3 font-mono font-bold text-primary">{token.token_code}</td><td className="px-3 py-3">{token.client_name}</td><td className="px-3 py-3">{token.project_name}</td><td className="px-3 py-3">{isPricing ? "—" : <span>{token.total_commission} ريال</span>}</td><td className="px-3 py-3"><div className="space-y-1 text-xs">{(token.installments ?? []).map((item: any) => <div key={item.id} className={item.status === "paid" ? "text-green-600" : "text-muted-foreground"}>د{item.installment_number}: {item.amount} ريال {item.status === "paid" ? "✓" : ""}</div>)}{(token.status === "نشط" || token.status === "active") && <button type="button" onClick={() => setAddTokenId(token.id)} className="mt-1 rounded-md border border-primary/30 px-2 py-1 font-semibold text-primary">+ إضافة دفعة</button>}</div></td><td className="px-3 py-3 text-green-600">{isPricing ? "—" : <span>{token.paid_amount} ريال</span>}</td><td className="px-3 py-3 text-orange-600">{isPricing ? "—" : <span>{Math.max(0, total - paid).toFixed(2)} ريال</span>}</td><td className="px-3 py-3"><div className="space-y-2">{renderStatusBadge(token.status)}{isPricing && <button type="button" onClick={() => setAmountModalToken({ id: token.id, token_code: token.token_code, client_name: token.client_name, project_name: token.project_name, signature_image: (token as any).signature_image ?? null })} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"><Coins className="h-3 w-3" /> تحديد المبلغ</button>}{!isPricing && <button type="button" onClick={() => handleDeleteToken(token.id)} className="inline-flex items-center gap-1 rounded-md border border-red-500/30 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/10"><Trash2 className="h-3 w-3" /> حذف الرمز</button>}</div></td></tr>; })}</tbody></table></div>}</section>
    <section><h2 className="mb-3 text-lg font-bold">إيصالات التحويل</h2>{receiptsLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : !(receipts ?? []).length ? <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">لا توجد إيصالات بعد.</div> : <div className="overflow-x-auto rounded-xl border border-border bg-card"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b border-border bg-secondary/50 text-right"><th className="px-3 py-3">العميل</th><th className="px-3 py-3">الرمز</th><th className="px-3 py-3">المبلغ</th><th className="px-3 py-3">الإيصال</th><th className="px-3 py-3">الحالة</th><th className="px-3 py-3">التاريخ</th><th className="px-3 py-3">إجراء</th></tr></thead><tbody>{(receipts ?? []).map((receipt) => <tr key={receipt.id} className="border-b border-border/50"><td className="px-3 py-3">{receipt.client_name}</td><td className="px-3 py-3 font-mono font-bold text-primary">{receipt.token_code}</td><td className="px-3 py-3">{receipt.amount} ريال</td><td className="px-3 py-3">{receipt.receipt_image_url ? <a href={receipt.receipt_image_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline"><ImageIcon className="h-3.5 w-3.5" /> عرض</a> : "—"}</td><td className="px-3 py-3">{receipt.status === "approved" ? <span className="text-green-600"><CheckCircle2 className="inline h-3 w-3" /> معتمد</span> : receipt.status === "rejected" ? <span className="text-red-600"><XCircle className="inline h-3 w-3" /> مرفوض</span> : "قيد الانتظار"}</td><td className="px-3 py-3">{formatDate(receipt.approved_at)}</td><td className="px-3 py-3">{receipt.status === "pending" && <div className="flex gap-1"><button onClick={() => handleApprove(receipt.id)} className="rounded-md bg-green-600 px-2 py-1 text-xs font-bold text-white">اعتماد</button><button onClick={() => handleReject(receipt.id)} className="rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-600">رفض</button></div>}<button onClick={() => handleDeleteReceipt(receipt.id)} className="mt-1 inline-flex items-center gap-1 rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-600"><Trash2 className="h-3 w-3" /> حذف</button></td></tr>)}</tbody></table></div>}</section>
    {addTokenId && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3"><form onSubmit={handleAddInstallment} className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-lg"><h2 className="mb-2 text-lg font-bold">إضافة دفعة</h2><p className="mb-4 text-sm text-muted-foreground">ستبقى مرتبطة بنفس رمز التعميد.</p><input autoFocus type="number" min="0.01" step="0.01" required value={addAmount} onChange={(e) => setAddAmount(e.target.value)} placeholder="مبلغ الدفعة بالريال" className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base" /><div className="mt-4 flex gap-2"><button type="submit" className="flex-1 rounded-lg bg-foreground px-4 py-3 text-sm font-bold text-background">حفظ</button><button type="button" onClick={() => { setAddTokenId(null); setAddAmount(""); }} className="rounded-lg border border-border px-4 py-3 text-sm font-semibold">إلغاء</button></div></form></div>}
    {amountModalToken && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3"><div className="my-auto max-h-[calc(100vh-24px)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-lg sm:p-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">تحديد مبلغ التعميد</h2><button onClick={() => { setAmountModalToken(null); setAmountValue(""); setFirstDueValue(""); }} className="text-muted-foreground"><X className="h-5 w-5" /></button></div><div className="mb-4 space-y-2 rounded-lg border border-border bg-secondary/30 p-3 text-sm"><div><span className="text-muted-foreground">الرمز:</span> <span className="font-mono font-bold text-primary">{amountModalToken.token_code}</span></div><div><span className="text-muted-foreground">العميل:</span> <span className="font-semibold">{amountModalToken.client_name}</span></div><div><span className="text-muted-foreground">المشروع:</span> <span className="font-semibold">{amountModalToken.project_name}</span></div></div>{amountModalToken.signature_image && <div className="mb-4"><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground"><PenTool className="h-4 w-4" /> توقيع العميل</div><div className="rounded-lg border border-border bg-white p-2"><img src={amountModalToken.signature_image} alt="توقيع العميل" className="mx-auto max-h-32 w-auto" /></div></div>}<form onSubmit={handleSetAmount} className="space-y-4"><label className="block text-sm font-semibold">إجمالي مبلغ العمولة (ريال)<div className="relative mt-1"><Coins className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="number" min="0.01" step="0.01" required autoFocus value={amountValue} onChange={(e) => setAmountValue(e.target.value)} className="w-full rounded-lg border border-input bg-background px-4 py-3 ps-10 text-base" /></div></label><label className="block text-sm font-semibold">مبلغ الدفعة الأولى (ريال)<div className="relative mt-1"><Wallet className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="number" min="0.01" step="0.01" required value={firstDueValue} onChange={(e) => setFirstDueValue(e.target.value)} className="w-full rounded-lg border border-input bg-background px-4 py-3 ps-10 text-base" /></div></label><p className="text-xs text-muted-foreground">سيتم تفعيل الرمز وتغيير حالته إلى «نشط» مع إنشاء دفعة أولى بمبلغ الدفعة الأولى.</p><div className="flex gap-2 pt-2"><button type="submit" disabled={amountSaving} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-foreground px-5 py-3 text-sm font-bold text-background disabled:opacity-60">{amountSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}تفعيل الرمز</button><button type="button" onClick={() => { setAmountModalToken(null); setAmountValue(""); setFirstDueValue(""); }} className="rounded-lg border border-border px-5 py-3 text-sm font-semibold">إلغاء</button></div></form></div></div>}
  </div>;
}
