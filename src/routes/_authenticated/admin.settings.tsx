import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Settings2, Save } from "lucide-react";
import { getMaintenance, setMaintenance } from "@/lib/maintenance.functions";
import { getMyRoles } from "@/lib/admin.functions";
import { hasAdminRole } from "@/lib/role-label";

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

  const { data, isLoading } = useQuery({
    queryKey: ["maintenance-admin"],
    queryFn: () => fetchMaintenance(),
  });

  const [enabled, setEnabled] = useState(false);
  const [endAt, setEndAt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setEnabled(!!data.enabled);
      setEndAt(toLocalInput(data.endAt));
    }
  }, [data]);

  if (!isAdmin) {
    return <div className="text-sm text-muted-foreground">هذه الصفحة للأدمن فقط.</div>;
  }

  async function onSave() {
    setSaving(true);
    const tId = toast.loading("جارٍ الحفظ...");
    try {
      const iso = fromLocalInput(endAt);
      await saveMaintenance({ data: { enabled, endAt: iso } });
      await qc.invalidateQueries({ queryKey: ["maintenance-admin"] });
      await qc.invalidateQueries({ queryKey: ["maintenance-public"] });
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

        <button
          onClick={onSave}
          disabled={saving || isLoading}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>
    </div>
  );
}
