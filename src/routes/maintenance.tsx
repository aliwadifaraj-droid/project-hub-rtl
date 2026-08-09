import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import { getMaintenance } from "@/lib/maintenance.functions";

export const Route = createFileRoute("/maintenance")({
  component: MaintenancePage,
  head: () => ({
    meta: [
      { title: "الموقع تحت الصيانة" },
      { name: "description", content: "الموقع في وضع الصيانة مؤقتًا. سنعود قريبًا." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function useCountdown(target: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!target) return null;
  const end = new Date(target).getTime();
  if (Number.isNaN(end)) return null;
  const diff = Math.max(0, end - now);
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: diff === 0,
  };
}

function MaintenancePage() {
  const fetchMaintenance = useServerFn(getMaintenance);
  const { data } = useQuery({
    queryKey: ["maintenance-public"],
    queryFn: () => fetchMaintenance(),
    refetchInterval: 30000,
  });
  const cd = useCountdown(data?.endAt ?? null);

  return (
    <div className="min-h-screen bg-secondary/40 flex items-center justify-center px-4" dir="rtl">
      <div className="max-w-lg w-full rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <Wrench className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">الموقع تحت الصيانة</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          نعمل حاليًا على تحسين الخدمة. نعتذر عن الإزعاج وسنعود قريبًا بإذن الله.
        </p>

        {data?.endAt && cd && !cd.done && (
          <div className="mt-6">
            <div className="text-xs text-muted-foreground mb-2">الوقت المتبقي</div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { l: "يوم", v: cd.days },
                { l: "ساعة", v: cd.hours },
                { l: "دقيقة", v: cd.minutes },
                { l: "ثانية", v: cd.seconds },
              ].map((x) => (
                <div key={x.l} className="rounded-lg bg-secondary p-3">
                  <div className="text-2xl font-bold tabular-nums">{String(x.v).padStart(2, "0")}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{x.l}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              العودة المتوقعة: {new Date(data.endAt).toLocaleString("ar")}
            </div>
          </div>
        )}

        {data?.endAt && cd?.done && (
          <div className="mt-6 text-sm text-primary">انتهى وقت الصيانة، يمكنك تحديث الصفحة الآن.</div>
        )}
      </div>
    </div>
  );
}
