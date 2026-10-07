import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  adminCreateApprovalToken,
  adminListApprovalTokens,
  adminListApprovalReceipts,
  adminApproveReceipt,
} from "@/lib/tameed.functions";
import { adminListClients } from "@/lib/admin.functions";
import { listProjects } from "@/lib/admin.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, X, Plus, BadgeCheck, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/approvals")({
  component: AdminApprovalsPage,
});

function AdminApprovalsPage() {
  const listClients = useServerFn(adminListClients);
  const listProjectsFn = useServerFn(listProjects);
  const createToken = useServerFn(adminCreateApprovalToken);
  const listTokens = useServerFn(adminListApprovalTokens);
  const listReceipts = useServerFn(adminListApprovalReceipts);
  const approveReceipt = useServerFn(adminApproveReceipt);
  const qc = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [totalCommission, setTotalCommission] = useState("");
  const [allowedNow, setAllowedNow] = useState("");
  const [creating, setCreating] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);

  const { data: clients = [] } = useQuery({
    queryKey: ["admin-clients-approvals"],
    queryFn: () => listClients(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["admin-projects-approvals"],
    queryFn: () => listProjectsFn(),
  });

  const { data: tokens = [], refetch: refetchTokens } = useQuery({
    queryKey: ["approval-tokens"],
    queryFn: () => listTokens(),
    refetchInterval: 10000,
  });

  const { data: receipts = [], refetch: refetchReceipts } = useQuery({
    queryKey: ["approval-receipts"],
    queryFn: () => listReceipts(),
    refetchInterval: 10000,
  });

  async function handleCreate() {
    if (!selectedClient || !selectedProject || !totalCommission || !allowedNow) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    setCreating(true);
    try {
      const res = await createToken({
        data: {
          user_id: selectedClient,
          project_id: selectedProject,
          total_commission: parseFloat(totalCommission),
          allowed_payment_now: parseFloat(allowedNow),
        },
      });
      toast.success(`تم إنشاء الرمز: ${res.token}`);
      setShowCreate(false);
      setSelectedClient("");
      setSelectedProject("");
      setTotalCommission("");
      setAllowedNow("");
      refetchTokens();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setCreating(false);
    }
  }

  async function handleApprove(receiptId: string) {
    try {
      const res = await approveReceipt({ data: { receipt_id: receiptId } });
      if (res.completed) {
        toast.success("تم الاعتماد وإكمال التوكن");
      } else {
        toast.success(`تم الاعتماد. المبلغ المدفوع: ${res.newPaid} ريال`);
      }
      refetchTokens();
      refetchReceipts();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    }
  }

  function statusBadge(s: string) {
    const map: Record<string, string> = {
      active: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      used: "bg-gray-100 text-gray-800",
      approved: "bg-green-100 text-green-800",
    };
    const labels: Record<string, string> = {
      active: "نشط",
      completed: "مكتمل",
      used: "مستخدم",
      approved: "معتمد",
    };
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[s] ?? "bg-secondary"}`}>
        {labels[s] ?? s}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">اعتماد العملاء</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 ms-1" />
          إنشاء رمز تعميد
        </Button>
      </div>

      {/* Tokens Table */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">رموز التعميد</h2>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العميل</TableHead>
                <TableHead>الرمز</TableHead>
                <TableHead>إجمالي العمولة</TableHead>
                <TableHead>المدفوع</TableHead>
                <TableHead>المتبقي</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    لا توجد رموز تعميد
                  </TableCell>
                </TableRow>
              ) : (
                tokens.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.company_name ?? t.client_email ?? t.user_id}</TableCell>
                    <TableCell className="font-mono font-bold" dir="ltr">{t.token}</TableCell>
                    <TableCell>{t.amount.toLocaleString("ar-SA")} ريال</TableCell>
                    <TableCell>{(t.paid_amount ?? 0).toLocaleString("ar-SA")} ريال</TableCell>
                    <TableCell>{(t.amount - (t.paid_amount ?? 0)).toLocaleString("ar-SA")} ريال</TableCell>
                    <TableCell>{statusBadge(t.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Receipts Table */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">الإيصالات</h2>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العميل</TableHead>
                <TableHead>الرمز</TableHead>
                <TableHead>المبلغ المحول</TableHead>
                <TableHead>OCR</TableHead>
                <TableHead>الإيصال</TableHead>
                <TableHead>إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    لا توجد إيصالات
                  </TableCell>
                </TableRow>
              ) : (
                receipts.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.company_name ?? r.client_email ?? r.user_id}</TableCell>
                    <TableCell className="font-mono font-bold" dir="ltr">{r.token ?? "—"}</TableCell>
                    <TableCell>{r.amount.toLocaleString("ar-SA")} ريال</TableCell>
                    <TableCell>
                      {r.ocr_status === "مطابق" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          <Check className="h-3 w-3" /> مطابق
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                          <X className="h-3 w-3" /> غير مطابق
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.receipt_path ? (
                        <button
                          onClick={() => setPreviewReceipt(r.receipt_path)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Eye className="h-4 w-4" /> عرض
                        </button>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {r.ocr_status === "مطابق" ? (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(r.id)}
                        >
                          <BadgeCheck className="h-4 w-4 ms-1" />
                          اعتماد
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">غير متاح</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Token Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              aria-label="إغلاق"
              className="absolute left-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-secondary"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">إنشاء رمز تعميد</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="client-select">العميل</Label>
                <select
                  id="client-select"
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                >
                  <option value="">اختر العميل</option>
                  {clients.map((c) => (
                    <option key={c.user_id} value={c.user_id}>
                      {c.display_name ?? c.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="project-select">المشروع</Label>
                <select
                  id="project-select"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                >
                  <option value="">اختر المشروع</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="total-commission">إجمالي العمولة (ريال)</Label>
                <Input
                  id="total-commission"
                  type="number"
                  value={totalCommission}
                  onChange={(e) => setTotalCommission(e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="allowed-now">المبلغ المسموح الآن (ريال)</Label>
                <Input
                  id="allowed-now"
                  type="number"
                  value={allowedNow}
                  onChange={(e) => setAllowedNow(e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="w-full"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ms-1" />
                    جارٍ الإنشاء...
                  </>
                ) : (
                  "إنشاء الرمز"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {previewReceipt && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewReceipt(null)}
        >
          <div className="relative max-w-2xl">
            <button
              type="button"
              onClick={() => setPreviewReceipt(null)}
              aria-label="إغلاق"
              className="absolute -top-2 -left-2 z-10 rounded-full bg-card p-2 shadow-lg"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewReceipt}
              alt="إيصال"
              className="max-h-[80vh] rounded-lg shadow-2xl"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
