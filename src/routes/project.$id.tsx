import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { getProject, submitBidRequest, getMyRoles, getExclusiveStatus } from "@/lib/admin.functions";
import { hasAdminRole } from "@/lib/role-label";
import { resolveImage } from "@/data/projects";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { ArrowRight, MapPin, Clock, Upload, Loader2, FileDown, Lock } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { AdminProjectStatus } from "@/components/admin-project-status";

function statusLabel(s?: string | null) {
  if (s === "delivered") return "تم التسليم";
  if (s === "cancelled") return "ملغي";
  return "مفتوح للعروض";
}

const projectQuery = (id: string) =>
  queryOptions({
    queryKey: ["project", id],
    queryFn: async () => {
      const data = await getProject({ data: { id } });
      if (!data) throw notFound();
      return data;
    },
  });

function pickImage(p: { cover_url?: string; cover_image: string | null }) {
  if (p.cover_url && (p.cover_url.startsWith("http") || p.cover_url.startsWith("/"))) return p.cover_url;
  return resolveImage(p.cover_image ?? "");
}

export const Route = createFileRoute("/project/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(projectQuery(params.id)),
  component: ProjectDetail,
});

function useCountdown(targetIso: string | null) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!targetIso) { setRemaining(null); return; }
    const target = new Date(targetIso).getTime();
    const tick = () => { const diff = target - Date.now(); setRemaining(diff > 0 ? diff : 0); };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [targetIso]);
  return remaining;
}

function formatCountdown(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function ProjectDetail() {
  const { id } = Route.useParams();
  const { data: project } = useSuspenseQuery(projectQuery(id));
  const submit = useServerFn(submitBidRequest);
  const getRoles = useServerFn(getMyRoles);
  const getExclusive = useServerFn(getExclusiveStatus);
  const navigate = Route.useNavigate();
  const { data: roles } = useQuery({ queryKey: ["my-roles"], queryFn: () => getRoles(), retry: false });
  const isAdmin = hasAdminRole(roles);

  const { data: exclusive } = useQuery({
    queryKey: ["exclusive-status", id],
    queryFn: () => getExclusive({ data: { projectId: id } }),
    refetchInterval: 10_000,
    retry: false,
  });
  const showForm = exclusive?.showForm ?? true;
  const vipEndAt = exclusive?.vipEndAt ?? null;
  const remaining = useCountdown(vipEndAt);

  const [companyName, setCompanyName] = useState("");
  const [facilityLocation, setFacilityLocation] = useState("");
  const [email, setEmail] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!companyName.trim() || !facilityLocation.trim() || !email.trim() || !pdfFile) { toast.error("جميع الحقول إجبارية"); return; }
    if (!emailRegex.test(email.trim())) { toast.error("يرجى إدخال بريد إلكتروني صحيح"); return; }
    if (pdfFile.size > 10 * 1024 * 1024) { toast.error("حجم الملف يجب أن يكون أقل من 10 ميغابايت"); return; }
    setSubmitting(true);
    try {
      const buf = await pdfFile.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) { binary += String.fromCharCode(...bytes.subarray(i, i + chunk)); }
      const file_base64 = btoa(binary);
      await submit({ data: { project_id: project.id, company_name: companyName.trim().slice(0, 200), facility_location: facilityLocation.trim().slice(0, 300), email: email.trim().slice(0, 255), file_name: pdfFile.name, file_base64 } });
      navigate({ to: "/thank-you" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء إرسال الطلب";
      toast.error(msg);
    } finally { setSubmitting(false); }
  }

  return (
    <div className="min-h-screen" dir="rtl">
      <SiteHeader />
      <Toaster position="top-center" dir="rtl" />
      <article className="container mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition mb-6">
          <ArrowRight className="h-4 w-4" /> العودة للمشاريع
        </Link>
        <div className="overflow-hidden rounded-2xl shadow-[var(--shadow-elegant)]">
          <img src={pickImage(project)} alt={project.name} width={1600} height={900} className="aspect-[16/9] w-full object-cover" />
        </div>
        <div className="mt-8 grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <h1 className="text-3xl md:text-4xl font-extrabold">{project.name}</h1>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm"><MapPin className="h-4 w-4 text-accent" /> {project.location}</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm"><Clock className="h-4 w-4 text-accent" /> المدة المتوقعة: {project.duration}</span>
            </div>
            <p className="mt-6 text-lg leading-loose text-foreground/85">{project.description}</p>
            {project.pdf_url ? (
              <a href={project.pdf_url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90"><FileDown className="h-4 w-4" /> تحميل ملف PDF</a>
            ) : null}
          </div>
          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-xl font-bold">معلومات المشروع</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between border-b border-border/60 pb-2"><dt className="text-muted-foreground">الموقع</dt><dd className="font-medium">{project.location}</dd></div>
                <div className="flex justify-between border-b border-border/60 pb-2"><dt className="text-muted-foreground">المدة المتوقعة</dt><dd className="font-medium">{project.duration}</dd></div>
                {isAdmin ? (<div className="flex justify-between items-center"><dt className="text-muted-foreground">الحالة</dt><dd><ProjectStatusBadge status={(project as { status?: string }).status} /></dd></div>) : null}
              </dl>
              <AdminProjectStatus projectId={project.id} currentStatus={(project as { status?: string }).status} queryKey={["project", id]} />
            </div>
          </aside>
        </div>
        {!showForm ? (
          <section className="mt-16 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100"><Lock className="h-7 w-7 text-amber-600" /></div>
              <p className="text-lg font-bold text-amber-900">هذا المشروع حصري مؤقتاً</p>
              <p className="mt-2 text-sm text-amber-800/80">سيكون نموذج تقديم عرض السعر متاحاً للجميع بعد انتهاء فترة الحصرية.</p>
              {remaining !== null && remaining > 0 ? (
                <div className="mt-6">
                  <p className="text-sm font-medium text-amber-700 mb-2">الوقت المتبقي لفتح النموذج:</p>
                  <div className="inline-flex items-center gap-2 rounded-xl bg-amber-900 px-6 py-3 text-2xl font-bold text-amber-50 tabular-nums" dir="ltr">{formatCountdown(remaining)}</div>
                </div>
              ) : (<p className="mt-4 text-sm text-amber-700">سيتم فتح النموذج خلال لحظات...</p>)}
            </div>
          </section>
        ) : (project as { offers_enabled?: boolean }).offers_enabled === false ? (
          <section className="mt-16 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 text-center shadow-sm">
              <p className="text-sm font-semibold text-orange-900">تقديم عروض الاسعار عبر النموذج متوقف حاليا</p>
              <p className="mt-1 text-xs text-orange-800/80">يمكنك تقديم عرضك بسرعة عبر المساعد الآلي.</p>
              <button type="button" onClick={() => { if (typeof window !== "undefined") { window.dispatchEvent(new CustomEvent("open-support-chat")); } }} className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700">قدم الآن</button>
            </div>
          </section>
        ) : (
          <section id="apply" className="mt-16 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-10 shadow-[var(--shadow-card)]">
              <h2 className="text-2xl font-bold">تقديم عرض سعر للمشروع</h2>
              <p className="mt-1 text-sm text-muted-foreground">املأ النموذج التالي وأرفق ملف PDF لعرض السعر الخاص بك.</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <Field label="اسم الشركة / المؤسسة">
                  <input type="text" required maxLength={200} value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="مثال: شركة البناء الحديث للمقاولات" />
                </Field>
                <Field label="موقع المنشأة">
                  <input type="text" required maxLength={300} value={facilityLocation} onChange={(e) => setFacilityLocation(e.target.value)} className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="مثال: الرياض - حي العليا - شارع الملك فهد" />
                </Field>
                <Field label="البريد الإلكتروني">
                  <input type="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="example@company.com" />
                </Field>
                <Field label="ملف PDF لعرض السعر">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border bg-secondary/40 px-4 py-5 text-sm hover:bg-secondary transition">
                    <Upload className="h-5 w-5 text-accent" />
                    <span className="flex-1 text-muted-foreground">{pdfFile ? pdfFile.name : "اضغط لاختيار ملف PDF (الحد الأقصى 10 ميغابايت)"}</span>
                    <input type="file" accept="application/pdf" required onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} className="hidden" />
                  </label>
                </Field>
                <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[image:var(--gradient-accent)] px-6 py-3 text-base font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-60">
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null} تقديم الطلب
                </button>
              </form>
            </div>
          </section>
        )}
      </article>
      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold">{label} <span className="text-destructive">*</span></label>
      {children}
    </div>
  );
}
