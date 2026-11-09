import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Phone } from "lucide-react";
import { HarajTeacherHeader } from "@/components/haraj-teacher-header";
import { getMyHarajTasks } from "@/lib/haraj.functions";

export const Route = createFileRoute("/haraj/tasks")({
  head: () => ({ meta: [{ title: "مهامي — حراج المعلمين" }] }),
  component: TeacherTasksPage,
});

type HarajTask = {
  id: string;
  work_name: string;
  description: string;
  city: string;
  owner_phone: string;
  status: string;
  created_at: string;
  images: string[];
};

function TeacherTasksPage() {
  const navigate = useNavigate();
  const fetchTasks = useServerFn(getMyHarajTasks);
  const [ready, setReady] = useState(false);
  const [tasks, setTasks] = useState<HarajTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("teacher_name") === null) {
      navigate({ to: "/haraj", replace: true });
      return;
    }
    setReady(true);
  }, [navigate]);

  useEffect(() => {
    if (!ready) return;
    void loadTasks();
  }, [ready]);

  async function loadTasks() {
    setLoading(true);
    setError("");
    try {
      const res = await fetchTasks();
      setTasks(res.rows as HarajTask[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل المهام");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <HarajTeacherHeader />
      <main className="container mx-auto px-4 pb-14 pt-4">
        <div className="mx-auto max-w-xl space-y-6">
          <Link
            to="/haraj/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowRight className="h-4 w-4" />
            العودة إلى لوحة المعلم
          </Link>
          <section className="space-y-4">
            <h1 className="text-xl font-bold">مهامي</h1>
            {loading && (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> جاري التحميل...
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>
            )}
            {!loading && !error && tasks.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                لا توجد مشاريع مثبتة عليك حالياً
              </div>
            )}
            {tasks.map((task) => (
              <div key={task.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h2 className="font-bold">{task.work_name}</h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                    <CheckCircle2 className="h-3 w-3" /> مثبت
                  </span>
                </div>
                <p className="mb-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{task.description}</p>
                {task.images.length > 0 && (
                  <div className="mb-3 grid grid-cols-3 gap-2">
                    {task.images.slice(0, 6).map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`صورة ${i + 1}`}
                        className="aspect-square w-full rounded-lg object-cover"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
                <div className="rounded-lg bg-secondary/40 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold" dir="ltr">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {task.owner_phone}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">رقم جوال صاحب العمل — متاح بعد التثبيت</p>
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
