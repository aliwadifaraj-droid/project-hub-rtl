import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Settings2, Save } from "lucide-react";
import { toast } from "sonner";
import { getBotSettings, updateBotSettings } from "@/lib/bot-settings.functions";

export const Route = createFileRoute("/_authenticated/admin/bot-settings")({
  component: BotSettingsPage,
});

const DAYS: Array<{ key: "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri"; label: string }> = [
  { key: "sat", label: "السبت" },
  { key: "sun", label: "الأحد" },
  { key: "mon", label: "الاثنين" },
  { key: "tue", label: "الثلاثاء" },
  { key: "wed", label: "الأربعاء" },
  { key: "thu", label: "الخميس" },
  { key: "fri", label: "الجمعة" },
];

type Days = Record<(typeof DAYS)[number]["key"], boolean>;

function trimSec(t: string) {
  return t?.length >= 5 ? t.slice(0, 5) : t;
}

function BotSettingsPage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getBotSettings);
  const saveFn = useServerFn(updateBotSettings);

  const { data, isLoading } = useQuery({
    queryKey: ["bot-settings"],
    queryFn: () => getFn(),
  });

  const [workDays, setWorkDays] = useState<Days>({
    sat: false, sun: true, mon: true, tue: true, wed: true, thu: true, fri: false,
  });
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("17:00");
  const [offMsg, setOffMsg] = useState("نحن خارج ساعات العمل حالياً. سنرد عليك في أقرب وقت.");
  const [allowEsc, setAllowEsc] = useState(true);
  const [showSuggested, setShowSuggested] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setWorkDays(data.work_days as Days);
    setWorkStart(trimSec(data.work_start));
    setWorkEnd(trimSec(data.work_end));
    setOffMsg(data.off_hours_message);
    setAllowEsc(data.allow_escalation);
    setShowSuggested(data.show_suggested_questions ?? true);
  }, [data]);

  async function save() {
    setSaving(true);
    try {
      await saveFn({
        data: {
          work_days: workDays,
          work_start: workStart,
          work_end: workEnd,
          off_hours_message: offMsg,
          allow_escalation: allowEsc,
          show_suggested_questions: showSuggested,
        },
      });
      qc.invalidateQueries({ queryKey: ["bot-settings"] });
      qc.invalidateQueries({ queryKey: ["bot-settings-public"] });
      toast.success("تم حفظ الإعدادات");
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
          <Settings2 className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold">إعدادات البوت</h1>
          <p className="text-xs text-muted-foreground">تحكم في ساعات عمل البوت ورسائل خارج الدوام</p>
        </div>
      </div>

      {isLoading ? (
        <p className="p-4 text-center text-sm text-muted-foreground">جاري التحميل…</p>
      ) : (
        <div className="space-y-4">
          {/* Work days */}
          <section className="rounded-xl border border-border bg-background p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-bold">ساعات العمل</h2>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold">أيام العمل</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DAYS.map((d) => (
                  <label key={d.key} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={workDays[d.key]}
                      onChange={(e) => setWorkDays({ ...workDays, [d.key]: e.target.checked })}
                    />
                    {d.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold">من</label>
                <input
                  type="time"
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">إلى</label>
                <input
                  type="time"
                  value={workEnd}
                  onChange={(e) => setWorkEnd(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </section>

          {/* Off-hours message */}
          <section className="rounded-xl border border-border bg-background p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-bold">رسالة خارج الدوام</h2>
            <textarea
              rows={4}
              value={offMsg}
              onChange={(e) => setOffMsg(e.target.value)}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </section>

          {/* Allow escalation */}
          <section className="rounded-xl border border-border bg-background p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold">تفعيل التحويل للدعم</h2>
                <p className="text-xs text-muted-foreground">السماح للعملاء بطلب التحدث مع موظف</p>
              </div>
              <button
                onClick={() => setAllowEsc(!allowEsc)}
                role="switch"
                aria-checked={allowEsc}
                className={`relative h-6 w-11 rounded-full transition ${allowEsc ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${
                    allowEsc ? "start-0.5" : "end-0.5"
                  }`}
                />
              </button>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ…" : "حفظ الإعدادات"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
