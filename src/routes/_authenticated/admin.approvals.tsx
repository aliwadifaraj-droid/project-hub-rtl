import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  adminCreateApprovalToken,
  adminListApprovalTokens,
  adminListApprovalReceipts,
  adminGetApprovalClients,
  adminGetApprovalProjects,
  adminApproveReceipt,
  adminRejectReceipt,
  adminGetBankInfo,
} from "@/lib/approvals.functions";
import {
  BadgeCheck,
  Plus,
  X,
  Loader2,
  Check,
  Building2,
  FolderKanban,
  Coins,
  Wallet,
  Receipt,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/approvals")({
  component: AdminApprovalsPage,
});

function AdminApprovalsPage() {
  const fetchTokens = useServerFn(adminListApprovalTokens);
  const fetchReceipts = useServerFn(adminListApprovalReceipts);
  const fetchClients = useServerFn(adminGetApprovalClients);
  const fetchProjects = useServerFn(adminGetApprovalProjects);
  const fetchBankInfo = useServerFn(adminGetBankInfo);
  const doCreateToken = useServerFn(adminCreateApprovalToken);
  const doApprove = useServerFn(adminApproveReceipt);
  const doReject = useServerFn(adminRejectReceipt);
  const qc = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [totalCommission, setTotalCommission] = useState("");
  const [allowedAmount, setAllowedAmount] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: tokens, isLoading: tokensLoading } = useQuery({
    queryKey: ["approval-tokens"],
    queryFn: () => fetchTokens(),
  });

  const { data: receipts, isLoading: receiptsLoading } = useQuery({
    queryKey: ["approval-receipts"],
    queryFn: () => fetchReceipts(),
  });

  const { data: clients } = useQuery({
    queryKey: ["approval-clients"],
    queryFn: () => fetchClients(),
    enabled: showModal,
  });

  const { data: projects } = useQuery({
    queryKey: ["approval-projects"],
    queryFn: () => fetchProjects(),
    enabled: showModal,
  });

  const { data: bankInfo } = useQuery({
    queryKey: ["approval-bank-info"],
    queryFn: () => fetchBankInfo(),
  });

  async function handleCreateToken(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !projectId || !totalCommission || !allowedAmount) {
      toast.error("جميع الحقول مطلوبة");
      return;
    }
    setCreating(true);
    try {
      const token = await doCreateToken({
        data: {
          client_id: clientId,
          client_name: clientName,
          project_id: projectId,
          project_name: projectName,
          total_commission: totalCommission,
          allowed_amount: allowedAmount,
        },
      });
      toast.success(`تم إنشاء رمز التعميد: ${token.token_code}`);
      setShowModal(false);
      setClientId("");
      setClientName("");
      setProjectId("");
      setProjectName("");
      setTotalCommission("");
      setAllowedAmount("");
      qc.invalidateQueries({ queryKey: ["approval-tokens"] });
    } catch (e: any) {
      toast.error(e?.message ?? "فشل إنشاء الرمز");
    } finally {
      setCreating(false);
    }
  }

  async function handleApprove(receiptId: string) {
    try {
      const result = await doApprove({ data: { receipt_id: receiptId } });
      if (result.token_status === "completed") {
        toast.success(`تم الاعتماد! اكتملت العمولة بالكامل. المتبقي: 0 ريال`);
      } else {
        toast.success(`تم الاعتماد! المتبقي: ${result.remaining.toFixed(2)} ريال`);
      }
      qc.invalidateQueries({ queryKey: ["approval-receipts"] });
      qc.invalidateQueries({ queryKey: ["approval-tokens"] });
    } catch (e: any) {
      toast.error(e?.message ?? "فشل الاعتماد");
    }
  }

  async function handleReject(receiptId: string) {
    try {
      await doReject({ data: { receipt_id: receiptId } });
      toast.success("تم رفض الإيصال");
      qc.invalidateQueries({ queryKey: ["approval-receipts"] });
    } catch (e: any) {
      toast.error(e?.message ?? "فشل الرفض");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
            <BadgeCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold">اعتماد العملاء</h1>
            <p className="text-sm text-muted-foreground">رموز التعميد والإيصالات</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-background hover:bg-foreground/90"
        >
          <Plus className="h-4 w-4" /> إنشاء رمز تعميد
        </button>
      </div>

      {/* Bank Info Display */}
      {bankInfo && bankInfo.iban && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4 text-sm">
          <div className="mb-1 font-semibold text-muted-foreground">معلومات البنك (من site_settings)</div>
          <div className="flex flex-wrap gap-4">
            {bankInfo.bank_name && <span><strong>البنك:</strong> {bankInfo.bank_name}</span>}
            {bankInfo.account_name && <span><strong>اسم الحساب:</strong> {bankInfo.account_name}</span>}
            {bankInfo.iban && <span><strong>IBAN:</strong> {bankInfo.iban}</span>}
          </div>
        </div>
      )}

      {/* Tokens Table */}
      <div className="mb-8">
        <h2 className="mb-3 text-lg font-bold">رموز التعميد</h2>
        {tokensLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (tokens ?? []).length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            لا توجد رموز تعميد بعد.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-right">
                  <th className="px-4 py-3 font-semibold">الرمز</th>
                  <th className="px-4 py-3 font-semibold">العميل</th>
                  <th className="px-4 py-3 font-semibold">المشروع</th>
                  <th className="px-4 py-3 font-semibold">العمولة الإجمالية</th>
                  <th className="px-4 py-3 font-semibold">المدفوع</th>
                  <th className="px-4 py-3 font-semibold">المتبقي</th>
                  <th className="px-4 py-3 font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {(tokens ?? []).map((t) => {
                  const paid = parseFloat(t.paid_amount) || 0;
                  const total = parseFloat(t.total_commission) || 0;
                  const remaining = Math.max(0, total - paid);
                  return (
                    <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="px-4 py-3 font-mono font-bold text-primary">{t.token_code}</td>
                      <td className="px-4 py-3">{t.client_name}</td>
                      <td className="px-4 py-3">{t.project_name}</td>
                      <td className="px-4 py-3 font-medium">{t.total_commission} ريال</td>
                      <td className="px-4 py-3 text-green-600 font-medium">{t.paid_amount} ريال</td>
                      <td className="px-4 py-3 text-orange-600 font-medium">{remaining.toFixed(2)} ريال</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          t.status === "completed"
                            ? "bg-green-500/15 text-green-600"
                            : t.status === "active"
                            ? "bg-blue-500/15 text-blue-600"
                            : "bg-slate-200 text-slate-500"
                        }`}>
                          {t.status === "completed" ? <CheckCircle2 className="h-3 w-3" /> : null}
                          {t.status === "completed" ? "مكتمل" : t.status === "active" ? "نشط" : "ملغي"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipts Table */}
      <div>
        <h2 className="mb-3 text-lg font-bold">إيصالات التحويل</h2>
        {receiptsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (receipts ?? []).length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            لا توجد إيصالات بعد.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-right">
                  <th className="px-4 py-3 font-semibold">العميل</th>
                  <th className="px-4 py-3 font-semibold">الرمز</th>
                  <th className="px-4 py-3 font-semibold">المبلغ المحوّل</th>
                  <th className="px-4 py-3 font-semibold">نتيجة OCR</th>
                  <th className="px-4 py-3 font-semibold">صورة الإيصال</th>
                  <th className="px-4 py-3 font-semibold">الحالة</th>
                  <th className="px-4 py-3 font-semibold">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {(receipts ?? []).map((r) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="px-4 py-3">{r.client_name}</td>
                    <td className="px-4 py-3 font-mono font-bold text-primary">{r.token_code}</td>
                    <td className="px-4 py-3 font-medium">{r.amount} ريال</td>
                    <td className="px-4 py-3">
                      {r.ocr_result === "match" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-600">
                          <Check className="h-3 w-3" /> مطابق
                        </span>
                      ) : r.ocr_result === "mismatch" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-600">
                          <X className="h-3 w-3" /> غير مطابق
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.receipt_image_url ? (
                        <a href={r.receipt_image_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary underline">
                          <ImageIcon className="h-3.5 w-3.5" /> عرض
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        r.status === "approved"
                          ? "bg-green-500/15 text-green-600"
                          : r.status === "rejected"
                          ? "bg-red-500/15 text-red-600"
                          : "bg-yellow-500/15 text-yellow-600"
                      }`}>
                        {r.status === "approved" ? <CheckCircle2 className="h-3 w-3" /> : null}
                        {r.status === "rejected" ? <XCircle className="h-3 w-3" /> : null}
                        {r.status === "approved" ? "معتمد" : r.status === "rejected" ? "مرفوض" : "قيد الانتظار"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "pending" ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleApprove(r.id)}
                            className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-green-700"
                          >
                            <Check className="h-3 w-3" /> اعتماد
                          </button>
                          <button
                            onClick={() => handleReject(r.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/5 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-500/15"
                          >
                            <X className="h-3 w-3" /> رفض
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Token Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">إنشاء رمز تعميد</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateToken} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">العميل</label>
                <div className="relative">
                  <Building2 className="absolute end-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Select
                    value={clientId}
                    onValueChange={(value) => {
                      setClientId(value);
                      const c = (clients ?? []).find((client) => client.id === value);
                      setClientName(c?.name ?? "");
                    }}
                    required
                  >
                    <SelectTrigger className="w-full rounded-lg border border-input bg-background px-4 py-2.5 ps-10 text-sm outline-none focus:ring-2 focus:ring-ring">
                      <SelectValue placeholder="اختر العميل" />
                    </SelectTrigger>
                    <SelectContent>
                      {(clients ?? []).map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">المشروع</label>
                <div className="relative">
                  <FolderKanban className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    required value={projectId}
                    onChange={(e) => {
                      setProjectId(e.target.value);
                      const p = (projects ?? []).find((x) => x.id === e.target.value);
                      setProjectName(p?.name ?? "");
                    }}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 ps-10 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="" disabled>اختر المشروع</option>
                    {(projects ?? []).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">إجمالي العمولة (ريال)</label>
                <div className="relative">
                  <Coins className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number" step="0.01" required value={totalCommission}
                    onChange={(e) => setTotalCommission(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 ps-10 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">المبلغ المسموح الآن (ريال)</label>
                <div className="relative">
                  <Wallet className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number" step="0.01" required value={allowedAmount}
                    onChange={(e) => setAllowedAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 ps-10 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit" disabled={creating}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-foreground px-5 py-2.5 text-sm font-bold text-background hover:bg-foreground/90 disabled:opacity-60"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                  توليد الرمز
                </button>
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold hover:bg-secondary"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
