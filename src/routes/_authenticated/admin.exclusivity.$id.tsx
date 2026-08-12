import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getExclusivityConfig, updateExclusivity } from "@/lib/admin.functions";
import { Loader2, ArrowRight, Crown, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/exclusivity/$id")({
  component: ExclusivityPage,
});

function ExclusivityPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchConfig = useServerFn(getExclusivityConfig);
  const saveFn = useServerFn(updateExclusivity);

  const { data, isLoading } = useQuery({
    queryKey: ["exclusivity-config", id],
    queryFn: () => fetchConfig({ data: { projectId: id } }),
  });

  const [hours, setHours] = useState("6");

  const currentHours = data?.durationHours ?? 6;
  const startDate = data?.vipStartAt ? new Date(data.vipStartAt) : null;
  const endDate = data?.vipEndAt ? new Date(data.vipEndAt) : null;

  const saveMut = useMutation({
    mutationFn: (h: number) => saveFn({ data: { projectId: id, durationHours: h } }),
    onSuccess: () => {
      toast.success("تم تحديث مدة الحصرية");
      qc.invalidateQueries({ queryKey: ["exclusivity-config", id] });
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
      qc.invalidateQueries({ queryKey: ["admin-project-vip"] });
      navigate({ to: "/admin/projects" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <Crown className="mx-auto mb-3 h-10 w-10 text-amber-500" />
        <h2 className="text-lg font-bold">لا يوجد سجل حصرية</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          لم يتم تفعيل الحصرية لهذا المشروع بعد. فعّلها من صفحة المشاريع.
        </p>
        <Link
          to="/admin/projects"
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-foreground/90"
        >
          <ArrowRight className="h-4 w-4" /> العودة للمشاريع
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <Link
          to="/admin/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4" /> العودة للمشاريع
        </Link>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold">
          <Crown className="h-6 w-6 text-amber-500" /> تعديل مدة الحصرية
        </h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5 space-y-3 rounded-lg bg-secondary/40 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">تاريخ البداية:</span>
            <span className="font-medium" dir="ltr">
              {startDate ? startDate.toLocaleString("ar") : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">تاريخ النهاية الحالي:</span>
            <span className="font-medium" dir="ltr">
              {endDate ? endDate.toLocaleString("ar") : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">المدة الحالية:</span>
            <span className="font-semibold text-amber-600">{currentHours} ساعة</span>
          </div>
        </div>

        <label className="mb-1.5 block text-sm font-semibold">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> المدة الجديدة (بالساعات)
          </span>
        </label>
        <input
          type="number"
          min={0}
          max={720}
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="mb-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="أدخل عدد الساعات"
        />
        <p className="mb-5 text-xs text-muted-foreground">
          أدخل 0 لإيقاف الحصرية فوراً. الحد الأقصى 720 ساعة (30 يوم).
        </p>

        <div className="flex gap-2">
          <button
            disabled={saveMut.isPending}
            onClick={() => {
              const n = Number(hours);
              if (!Number.isFinite(n) || n < 0 || n > 720) {
                toast.error("أدخل قيمة صحيحة بين 0 و 720");
                return;
              }
              saveMut.mutate(Math.round(n));
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-60"
          >
            {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            حفظ التغييرات
          </button>
          <Link
            to="/admin/projects"
            className="rounded-md border border-border px-4 py-2.5 text-sm hover:bg-secondary"
          >
            إلغاء
          </Link>
        </div>
      </div>
    </div>
  );
}
