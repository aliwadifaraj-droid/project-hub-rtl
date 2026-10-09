import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BadgeCheck, Plus, X, Loader2, Check, Building2, FolderKanban, Coins, Wallet, Receipt, Image as ImageIcon, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { adminCreateApprovalToken, adminAddApprovalInstallment, adminListApprovalTokens, adminListApprovalReceipts, adminGetApprovalClients, adminGetApprovalProjects, adminApproveReceipt, adminRejectReceipt, adminGetBankInfo, adminDeleteApprovalToken, adminDeleteApprovalReceipt } from "@/lib/approvals.functions";
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
  const doCreateToken = useServerFn(adminCreateApprovalToken);
  const doAddInstallment = useServerFn(adminAddApprovalInstallment);
  const doApprove = useServerFn(adminApproveReceipt);
  const doReject = useServerFn(adminRejectReceipt);
  const doDeleteToken = useServerFn(adminDeleteApprovalToken);
  const doDeleteReceipt = useServerFn(adminDeleteApprovalReceipt);
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [addTokenId, setAddTokenId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [totalCommission, setTotalCommission] = useState("");
  const [allowedAmount, setAllowedAmount] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: tokens, isLoading: tokensLoading } = useQuery({ queryKey: ["approval-tokens"], queryFn: () => fetchTokens() });
  const { data: receipts, isLoading: receiptsLoading } = useQuery({ queryKey: ["approval-receipts"], queryFn: () => fetchReceipts() });
  const { data: clients } = useQuery({ queryKey: ["approval-clients"], queryFn: () => fetchClients(), enabled: showModal }) as { data?: ClientOption[] };
  const { data: projects } = useQuery({ queryKey: ["approval-projects"], queryFn: () => fetchProjects(), enabled: showModal }) as { data?: ProjectOption[] };
  const { data: bankInfo } = useQuery({ queryKey: ["approval-bank-info"], queryFn: () => fetchBankInfo() });

  function resetCreateForm() { setShowModal(false); setClientId(""); setClientName(""); setProjectId(""); setProjectName(""); setTotalCommission(""); setAllowedAmount(""); }

  async function handleCreateToken(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !projectId || !totalCommission || !allowedAmount) { toast.error("جميع الحقول مطلوبة"); return; }
    const client = (clients ?? []).find((item) => item.id === clientId);
    if (!client) { toast.error("يرجى اختيار العميل مرة أخرى"); return; }
    setCreating(true);
    try { const token = await doCreateToken({ data: { client_id: client.client_id, client_name: clientName, project_id: projectId, project_name: projectName, total_commission: totalCommission, allowed_amount: allowedAmount } }); toast.success(`تم إنشاء رمز التعميد: ${token.token_code}`); resetCreateForm(); qc.invalidateQueries({ queryKey: ["approval-tokens"] }); }
    catch (error: any) { toast.error(error?.message ?? "فشل إنشاء الرمز"); } finally { setCreating(false); }
  }

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
  function formatDate(value: string | null | undefined) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("ar-SA"); }

  return <div className="space-y-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground"><BadgeCheck className="h-5 w-5" /></span><div><h1 className="text-xl font-bold">اعتماد العملاء</h1><p className="text-sm text-muted-foreground">رموز التعميد والإيصالات</p></div></div><button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-3 text-sm font-bold text-background"><Plus className="h-4 w-4" /> إنشاء رمز تعميد</button></div>
    {bankInfo?.iban && <div className="rounded-lg border border-border bg-card p-4 text-sm"><div className="mb-1 font-semibold text-muted-foreground">معلومات البنك</div><div className="flex flex-wrap gap-4">{bankInfo.bank_name && <span><strong>البنك:</strong> {bankInfo.bank_name}</span>}{bankInfo.account_name && <span><strong>اسم الحساب:</strong> {bankInfo.account_name}</span>}<span><strong>IBAN:</strong> {bankInfo.iban}</span></div></div>}
    <section><h2 className="mb-3 text-lg font-bold">رموز التعميد</h2>{tokensLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : !(tokens ?? []).length ? <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">لا توجد رموز تعميد بعد.</div> : <div className="overflow-x-auto rounded-xl border border-border bg-card"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b border-border bg-secondary/50 text-right"><th className="px-3 py-3">الرمز</th><th className="px-3 py-3">العميل</th><th className="px-3 py-3">المشروع</th><th className="px-3 py-3">الإجمالي</th><th className="px-3 py-3">الدفعات</th><th className="px-3 py-3">المدفوع</th><th className="px-3 py-3">المتبقي</th><th className="px-3 py-3">الحالة</th></tr></thead><tbody>{(tokens ?? []).map((token) => { const paid = Number(token.paid_amount) || 0; const total = Number(token.total_commission) || 0; return <tr key={token.id} className="border-b border-border/50"><td className="px-3 py-3 font-mono font-bold text-primary">{token.token_code}</td><td className="px-3 py-3">{token.client_name}</td><td className="px-3 py-3">{token.project_name}</td><td className="px-3 py-3">{token.total_commission} ريال</td><td className="px-3 py-3"><div className="space-y-1 text-xs">{(token.installments ?? []).map((item) => <div key={item.id} className={item.status === "paid" ? "text-green-600" : "text-muted-foreground"}>د{item.installment_number}: {item.amount} ريال {item.status === "paid" ? "✓" : ""}</div>)}{token.status !== "approved" && <button type="button" onClick={() => setAddTokenId(token.id)} className="mt-1 rounded-md border border-primary/30 px-2 py-1 font-semibold text-primary">+ إضافة دفعة</button>}</div></td><td className="px-3 py-3 text-green-600">{token.paid_amount} ريال</td><td className="px-3 py-3 text-orange-600">{Math.max(0, total - paid).toFixed(2)} ريال</td><td className="px-3 py-3"><div>{token.status === "approved" ? <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3 w-3" /> معتمد</span> : "نشط"}</div><button type="button" onClick={() => handleDeleteToken(token.id)} className="mt-2 inline-flex items-center gap-1 rounded-md border border-red-500/30 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/10"><Trash2 className="h-3 w-3" /> حذف الرمز</button></td></tr>; })}</tbody></table></div>}</section>
    <section><h2 className="mb-3 text-lg font-bold">إيصالات التحويل</h2>{receiptsLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : !(receipts ?? []).length ? <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">لا توجد إيصالات بعد.</div> : <div className="overflow-x-auto rounded-xl border border-border bg-card"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b border-border bg-secondary/50 text-right"><th className="px-3 py-3">العميل</th><th className="px-3 py-3">الرمز</th><th className="px-3 py-3">المبلغ</th><th className="px-3 py-3">الإيصال</th><th className="px-3 py-3">الحالة</th><th className="px-3 py-3">التاريخ</th><th className="px-3 py-3">إجراء</th></tr></thead><tbody>{(receipts ?? []).map((receipt) => <tr key={receipt.id} className="border-b border-border/50"><td className="px-3 py-3">{receipt.client_name}</td><td className="px-3 py-3 font-mono font-bold text-primary">{receipt.token_code}</td><td className="px-3 py-3">{receipt.amount} ريال</td><td className="px-3 py-3">{receipt.receipt_image_url ? <a href={receipt.receipt_image_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline"><ImageIcon className="h-3.5 w-3.5" /> عرض</a> : "—"}</td><td className="px-3 py-3">{receipt.status === "approved" ? <span className="text-green-600"><CheckCircle2 className="inline h-3 w-3" /> معتمد</span> : receipt.status === "rejected" ? <span className="text-red-600"><XCircle className="inline h-3 w-3" /> مرفوض</span> : "قيد الانتظار"}</td><td className="px-3 py-3">{formatDate(receipt.approved_at)}</td><td className="px-3 py-3">{receipt.status === "pending" && <div className="flex gap-1"><button onClick={() => handleApprove(receipt.id)} className="rounded-md bg-green-600 px-2 py-1 text-xs font-bold text-white">اعتماد</button><button onClick={() => handleReject(receipt.id)} className="rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-600">رفض</button></div>}<button onClick={() => handleDeleteReceipt(receipt.id)} className="mt-1 inline-flex items-center gap-1 rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-600"><Trash2 className="h-3 w-3" /> حذف</button></td></tr>)}</tbody></table></div>}</section>
    {addTokenId && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3"><form onSubmit={handleAddInstallment} className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-lg"><h2 className="mb-2 text-lg font-bold">إضافة دفعة</h2><p className="mb-4 text-sm text-muted-foreground">ستبقى مرتبطة بنفس رمز التعميد.</p><input autoFocus type="number" min="0.01" step="0.01" required value={addAmount} onChange={(e) => setAddAmount(e.target.value)} placeholder="مبلغ الدفعة بالريال" className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base" /><div className="mt-4 flex gap-2"><button type="submit" className="flex-1 rounded-lg bg-foreground px-4 py-3 text-sm font-bold text-background">حفظ</button><button type="button" onClick={() => { setAddTokenId(null); setAddAmount(""); }} className="rounded-lg border border-border px-4 py-3 text-sm font-semibold">إلغاء</button></div></form></div>}
    {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3"><div className="my-auto max-h-[calc(100vh-24px)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-lg sm:p-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">إنشاء رمز تعميد</h2><button onClick={resetCreateForm} className="text-muted-foreground"><X className="h-5 w-5" /></button></div><form onSubmit={handleCreateToken} className="space-y-4"><label className="block text-sm font-semibold">العميل<div className="relative mt-1"><Building2 className="absolute end-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><select required value={clientId} onChange={(e) => { setClientId(e.target.value); const client = (clients ?? []).find((item) => item.id === e.target.value); setClientName(client?.name ?? ""); }} className="w-full rounded-lg border border-input bg-background px-4 py-3 ps-10 text-base"><option value="" disabled>اختر العميل</option>{(clients ?? []).map((client) => <option key={client.id} value={client.id}>{client.name} ({client.email})</option>)}</select></div></label><label className="block text-sm font-semibold">المشروع<div className="relative mt-1"><FolderKanban className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><select required value={projectId} onChange={(e) => { setProjectId(e.target.value); const project = (projects ?? []).find((item) => item.id === e.target.value); setProjectName(project?.name ?? ""); }} className="w-full rounded-lg border border-input bg-background px-4 py-3 ps-10 text-base"><option value="" disabled>اختر المشروع</option>{(projects ?? []).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div></label><label className="block text-sm font-semibold">إجمالي العمولة (ريال)<div className="relative mt-1"><Coins className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="number" min="0.01" step="0.01" required value={totalCommission} onChange={(e) => setTotalCommission(e.target.value)} className="w-full rounded-lg border border-input bg-background px-4 py-3 ps-10 text-base" /></div></label><label className="block text-sm font-semibold">المبلغ المسموح الآن — الدفعة الأولى (ريال)<div className="relative mt-1"><Wallet className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="number" min="0.01" step="0.01" required value={allowedAmount} onChange={(e) => setAllowedAmount(e.target.value)} className="w-full rounded-lg border border-input bg-background px-4 py-3 ps-10 text-base" /></div></label><p className="text-xs text-muted-foreground">بعد إنشاء الرمز يمكنك إضافة باقي الدفعات من زر «إضافة دفعة».</p><div className="flex gap-2 pt-2"><button type="submit" disabled={creating} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-foreground px-5 py-3 text-sm font-bold text-background disabled:opacity-60">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}توليد الرمز</button><button type="button" onClick={resetCreateForm} className="rounded-lg border border-border px-5 py-3 text-sm font-semibold">إلغاء</button></div></form></div></div>}
  </div>;
}
