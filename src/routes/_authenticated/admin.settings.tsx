import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Settings2, Save, MessageCircleOff, Database, AlertTriangle, Star, Ban, Trash2, Loader2, Building2 } from "lucide-react";
import { getMaintenance, setMaintenance } from "@/lib/maintenance.functions";
import { getHideSupportChat, setHideSupportChat, getVipMaintenance, setVipMaintenance } from "@/lib/site-settings.functions";
import { getMyRoles } from "@/lib/admin.functions";
import { getDatabaseSize } from "@/lib/db-stats.functions";
import { hasAdminRole } from "@/lib/role-label";
import { adminListBlocked, adminBlockCompany, adminUnblockCompany } from "@/lib/blocked.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

// Convert ISO to value for <input type="datetime-local"> (local time)
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function AdminSettings() {
  const qc = useQueryClient();
  const getRoles = useServerFn(getMyRoles);
  const fetchMaintenance = useServerFn(getMaintenance);
  const saveMaintenance = useServerFn(setMaintenance);

  const { data: roles } = useQuery({ queryKey: ["my-roles"], queryFn: () => getRoles() });
  const isAdmin = hasAdminRole(roles);

  const fetchHideChat = useServerFn(getHideSupportChat);
  const saveHideChat = useServerFn(setHideSupportChat);
  const fetchVipMx = useServerFn(getVipMaintenance);
  const saveVipMx = useServerFn(setVipMaintenance);
  const fetchDbSize = useServerFn(getDatabaseSize);

  const { data: dbSize, isLoading: dbSizeLoading } = useQuery({
    queryKey: ["db-size-admin"],
    queryFn: () => fetchDbSize(),
    enabled: hasAdminRole(roles),
    refetchInterval: 5 * 60_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["maintenance-admin"],
    queryFn: () => fetchMaintenance(),
  });

  const { data: hideChatData, isLoading: hideChatLoading } = useQuery({
    queryKey: ["hide-support-chat-admin"],
    queryFn: () => fetchHideChat(),
  });

  const { data: vipMxData, isLoading: vipMxLoading } = useQuery({
    queryKey: ["vip-maintenance-admin"],
    queryFn: () => fetchVipMx(),
  });

  const [enabled, setEnabled] = useState(false);
  const [endAt, setEndAt] = useState("");
  const [hideChat, setHideChat] = useState(false);
  const [vipMx, setVipMx] = useState(false);
  const [saving, setSaving] = useState(false);

  // ---- Institution Management (blocked_users) ----
  const blockedListFn = useServerFn(adminListBlocked);
  const blockFn = useServerFn(adminBlockCompany);
  const unblockFn = useServerFn(adminUnblockCompany);

  const { data: blockedList = [], isLoading: blockedLoading } = useQuery({
    queryKey: ["admin-blocked"],
    queryFn: () => blockedListFn(),
  });

  const [blkEmail, setBlkEmail] = useState("");
  const [blkCompany, setBlkCompany] = useState("");
  const [blkType, setBlkType] = useState("حظر بالبريد والمؤسسة");

  const BLOCK_TYPE_OPTIONS = [
    "حظر بالبريد فقط",
    "حظر بالمؤسسة فقط",
    "حظر بالبريد والمؤسسة",
  ] as const;

  const blockMut = useMutation({
    mutationFn: (v: { email: string; company_name: string; block_type: string }) =>
      blockFn({ data: v }),
    onSuccess: () => {
      toast.success("تمت الإضافة إلى قائمة الحظر");
      setBlkEmail("");
      setBlkCompany("");
      setBlkType("حظر بالبريد والمؤسسة");
      qc.invalidateQueries({ queryKey: ["admin-blocked"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unblockMut = useMutation({
    mutationFn: (email: string) => unblockFn({ data: { email } }),
    onSuccess: () => {
      toast.success("تم رفع الحظر");
      qc.invalidateQueries({ queryKey: ["admin-blocked"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (data) {
      setEnabled(!!data.enabled);
      setEndAt(toLocalInput(data.endAt));
    }
  }, [data]);

  useEffect(() => {
    if (hideChatData) {
      setHideChat(!!hideChatData.enabled);
    }
  }, [hideChatData]);

  useEffect(() => {
    if (vipMxData) {
      setVipMx(!!vipMxData.enabled);
    }
  }, [vipMxData]);

  if (!isAdmin) {
    return <div className="text-sm text-muted-foreground">هذه الصفحة للأدمن فقط.</div>;
  }

  async function onSave() {
    setSaving(true);
    const tId = toast.loading("جارٍ الحفظ...");
    try {
      const iso = fromLocalInput(endAt);
      await saveMaintenance({ data: { enabled, endAt: iso } });
      await saveHideChat({ data: { enabled: hideChat } });
      await saveVipMx({ data: { enabled: vipMx } });
      await qc.invalidateQueries({ queryKey: ["maintenance-admin"] });
      await qc.invalidateQueries({ queryKey: ["maintenance-public"] });
      await qc.invalidateQueries({ queryKey: ["hide-support-chat-admin"] });
      await qc.invalidateQueries({ queryKey: ["hide-support-chat-public"] });
      await qc.invalidateQueries({ queryKey: ["vip-maintenance-admin"] });
      await qc.invalidateQueries({ queryKey: ["vip-maintenance"] });
      toast.success("تم الحفظ", { id: tId });
    } catch (e: any) {
      toast.error(`فشل الحفظ: ${e?.message ?? "خطأ غير معروف"}`, { id: tId });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-2">
        <Settings2 className="h-5 w-5" />
        <h1 className="text-xl font-bold">إعدادات الموقع</h1>
      </div>


      <div className="mb-6 rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-5 w-5" />
          <h2 className="text-base font-semibold">مساحة قاعدة البيانات</h2>
        </div>
        {dbSizeLoading || !dbSize ? (
          <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{dbSize.sizeMB.toFixed(2)} MB</span>
              <span className="text-sm text-muted-foreground">
                من {dbSize.limitMB.toFixed(0)} MB
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full transition-all ${
                  dbSize.percent >= 80
                    ? "bg-destructive"
                    : dbSize.percent >= 60
                    ? "bg-yellow-500"
                    : "bg-primary"
                }`}
                style={{ width: `${Math.min(100, dbSize.percent).toFixed(1)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">نسبة الاستهلاك</span>
              <span className="font-semibold">{dbSize.percent.toFixed(1)}%</span>
            </div>
            {dbSize.percent >= 80 && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <div>
                  <div className="font-semibold">تنبيه: تجاوزت مساحة قاعدة البيانات 80%</div>
                  <div className="mt-1 opacity-90">يُنصح بمراجعة البيانات وحذف غير الضروري أو ترقية الخطة.</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold">وضع الصيانة</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            عند التفعيل، يتم توجيه جميع المستخدمين (باستثناء الأدمن) إلى صفحة الصيانة مع عدّاد تنازلي.
          </p>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 accent-primary"
            disabled={isLoading}
          />
          <span className="text-sm font-medium">تفعيل وضع الصيانة (MAINTENANCE_MODE)</span>
        </label>

        <div>
          <label className="block text-sm font-medium mb-2">
            وقت انتهاء الصيانة (MAINTENANCE_END)
          </label>
          <input
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-muted-foreground">اتركه فارغًا لعرض صفحة الصيانة بدون عدّاد.</p>
        </div>

        <div className="border-t border-border pt-4">
          <div className="mb-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Star className="h-4 w-4" />
              صيانة العملاء المميزون
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              عند التفعيل، تظهر صفحة "العملاء المميزون" تحت الصيانة للزوار العاديين، ويمنع تقديم طلبات اشتراك جديدة.
            </p>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={vipMx}
              onChange={(e) => setVipMx(e.target.checked)}
              className="h-4 w-4 accent-primary"
              disabled={vipMxLoading}
            />
            <span className="text-sm font-medium">تفعيل صيانة صفحة العملاء المميزون</span>
          </label>
        </div>

        <div className="border-t border-border pt-4">
          <div className="mb-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <MessageCircleOff className="h-4 w-4" />
              إخفاء بوت الدعم
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              عند التفعيل، لن يظهر زر بوت الدعم في الصفحة الرئيسية للعملاء.
            </p>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={hideChat}
              onChange={(e) => setHideChat(e.target.checked)}
              className="h-4 w-4 accent-primary"
              disabled={hideChatLoading}
            />
            <span className="text-sm font-medium">إخفاء بوت الدعم من الصفحة الرئيسية</span>
          </label>
        </div>

        <button
          onClick={onSave}
          disabled={saving || isLoading}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>

      {/* ===== Institution Management ===== */}
      <div className="mt-6 rounded-lg border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          <h2 className="text-base font-semibold">إدارة حظر المؤسسات</h2>
        </div>

        {/* Add Block Form */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="blk-email">البريد الإلكتروني</Label>
            <Input
              id="blk-email"
              type="email"
              placeholder="example@company.com"
              value={blkEmail}
              onChange={(e) => setBlkEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="blk-company">اسم المؤسسة</Label>
            <Input
              id="blk-company"
              type="text"
              placeholder="اسم المؤسسة"
              value={blkCompany}
              onChange={(e) => setBlkCompany(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>نوع الحظر</Label>
            <Select value={blkType} onValueChange={(v) => setBlkType(v)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع الحظر" />
              </SelectTrigger>
              <SelectContent>
                {BLOCK_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={blockMut.isPending || !blkEmail.trim() || !blkCompany.trim()}
              onClick={() =>
                blockMut.mutate({
                  email: blkEmail.trim(),
                  company_name: blkCompany.trim(),
                  block_type: blkType,
                })
              }
            >
              {blockMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
              إضافة إلى قائمة الحظر
            </Button>
          </div>
        </div>

        {/* Blocked Users Table */}
        {blockedLoading ? (
          <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
        ) : blockedList.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا يوجد محظورون حالياً.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>اسم المؤسسة</TableHead>
                  <TableHead>نوع الحظر</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blockedList.map((b) => (
                  <TableRow key={b.email}>
                    <TableCell>{b.email || "—"}</TableCell>
                    <TableCell>{b.company_name || "—"}</TableCell>
                    <TableCell>{b.block_type}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {b.created_at ? new Date(b.created_at).toLocaleString("ar") : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={unblockMut.isPending}
                        onClick={() => unblockMut.mutate(b.email)}
                      >
                        {unblockMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        رفع الحظر
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
