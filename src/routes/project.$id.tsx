import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { getProject, submitBidRequest, getMyRoles, getExclusiveStatus } from "@/lib/admin.functions";
import { getMyVipStatus } from "@/lib/vip.functions";
import { hasAdminRole } from "@/lib/role-label";
import { resolveImage, buildR2Url } from "@/data/projects";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { ArrowRight, MapPin, Clock, Upload, Loader2, FileDown } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { AdminProjectStatus } from "@/components/admin-project-status";
import { SAUDI_CITIES } from "@/lib/saudi-cities";

function CountdownTimer({ target }: { target: string }) {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) return setTime('انتهى');
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime(`${h}س ${m}د ${s}ث`);
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [target]);
  return <p className="text-2xl font-bold text-amber-600 mt-2">{time}</p>;
}

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
  const r2 = buildR2Url(p.cover_image ?? "");
  if (r2) return r2;
  return resolveImage(p.cover_image ?? "");
}

export const Route = createFileRoute("/project/$id")({
  validateSearch: (search: Record<string, unknown>) => ({
    vip_token: typeof search.vip_token === "string" ? search.vip_token : undefined,
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(projectQuery(params.id)),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const vipToken = (search as { vip_token?: string }).vip_token ?? null;
  const { data: project } = useSuspenseQuery(projectQuery(id));
  const submit = useServerFn(submitBidRequest);
  const getRoles = useServerFn(getMyRoles);
  const getVipStatus = useServerFn(getMyVipStatus);
  const navigate = Route.useNavigate();
  const { data: roles } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => getRoles(),
    retry: false,
  });
  const isAdmin = hasAdminRole(roles);

  const vipEndAt = (project as { vip_end_at?: string | null }).vip_end_at ?? null;
  const isExclusive = !!(project as { is_exclusive?: boolean }).is_exclusive;
  const projectCity = (project.location ?? "").split("-")[0].trim();

  const { data: exclusiveStatus } = useQuery({
    queryKey: ["exclusive-status", id, vipToken],
    queryFn: () => getExclusiveStatus({ data: { projectId: id, vip_token: vipToken } }),
    enabled: isExclusive,
    retry: false,
  });
  const { data: vipStatus } = useQuery({
    queryKey: ["my-vip-status", id],
    queryFn: () => getVipStatus({ data: { project_id: id } }),
    enabled: isExclusive,
    retry: false,
  });
  const isVipInCity = isExclusive
    ? !!vipStatus?.isVip && (vipStatus?.city ?? "").trim() === projectCity
    : false;
  const hasVipAccess = isVipInCity || !!exclusiveStatus?.vipBypass;
  const showExclusiveGate = isExclusive && !hasVipAccess && !exclusiveStatus?.showForm;

  const [remainingMs, setRemainingMs] = useState(0);
  useEffect(() => {
    if (!vipEndAt) return;
    const end = new Date(vipEndAt).getTime();
    const tick = () => setRemainingMs(Math.max(0, end - Date.now()));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [vipEndAt]);
  const hoursLeft = Math.floor(remainingMs / 3600_000);
  const minutesLeft = Math.floor((remainingMs % 3600_000) / 60_000);
  const secondsLeft = Math.floor((remainingMs % 60_000) / 1000);
  const countdownLabel = `${String(hoursLeft).padStart(2, "0")}:${String(minutesLeft).padStart(2, "0")}:${String(secondsLeft).padStart(2, "0")}`;

  const [companyName, setCompanyName] = useState("");
  const [facilityLocation, setFacilityLocation] = useState("");
  const [email, setEmail] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!companyName.trim() || !facilityLocation.trim() || !email.trim() || !pdfFile) {
      toast.error("جميع الحقول إجبارية");
      return;
    }
    if (!emailRegex.test(email.trim())) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }
    if (pdfFile.size > 10 * 1024 * 1024) {
      toast.error("حجم الملف يجب أن يكون أقل من 10 ميغابايت");
      return;
    }

    setSubmitting(true);
    try {
      const buf = await pdfFile.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      const file_base64 = btoa(binary);

      await submit({
        data: {
          project_id: project.id,
          company_name: companyName.trim().slice(0, 200),
          facility_location: facilityLocation.trim().slice(0, 300),
          email: email.trim().slice(0, 255),
          file_name: pdfFile.name,
          file_base64,
          vip_token: vipToken,
        },
      });

      navigate({ to: "/thank-you" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء إرسال الطلب";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
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
          <img
            src={pickImage(project)}
            alt={project.name}
            width={1600}
            height={900}
            className="aspect-[16/9] w-full object-cover"
          />
        </div>

        <div className="mt-8 grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <h1 className="text-3xl md:text-4xl font-extrabold">{project.name}</h1>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm">
                <MapPin className="h-4 w-4 text-accent" /> {project.location}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm">
                <Clock className="h-4 w-4 text-accent" /> المدة المتوقعة: {project.duration}
              </span>
            </div>
            <p className="mt-6 text-lg leading-loose text-foreground/85">{project.description}</p>
            {project.pdf_url ? (
              <a
                href={project.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90"
              >
                <FileDown className="h-4 w-4" /> تحميل ملف PDF
              </a>
            ) : null}
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-xl font-bold">معلومات المشروع</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <dt className="text-muted-foreground">الموقع</dt>
                  <dd className="font-medium">{project.location}</dd>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <dt className="text-muted-foreground">المدة المتوقعة</dt>
                  <dd className="font-medium">{project.duration}</dd>
                </div>
                {isAdmin ? (
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground">الحالة</dt>
                    <dd><ProjectStatusBadge status={(project as { status?: string }).status} /></dd>
                  </div>
                ) : null}
              </dl>
              <AdminProjectStatus
                projectId={project.id}
                currentStatus={(project as { status?: string }).status}
                queryKey={["project", id]}
              />
            </div>

          </aside>
        </div>

        {showExclusiveGate ? (
          <section className="mt-16 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
              <p className="text-base font-bold text-amber-900">
                🔒 حصري لمشتركي {projectCity}
              </p>
              <p className="mt-3 text-3xl font-mono font-bold text-amber-900 tabular-nums tracking-wider">
                {countdownLabel}
              </p>
              <p className="mt-1 text-xs text-amber-700/80">الوقت المتبقي لانتهاء الحصرية</p>
              <p className="mt-2 text-sm text-amber-800/80">
                هذا المشروع متاح حالياً حصرياً لمشتركي VIP في {projectCity}.
              </p>
            </div>
          </section>
        ) : isExclusive && vipEndAt ? (
          <section className="mt-10 max-w-3xl mx-auto">
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-center shadow-sm">
              <p className="text-sm font-semibold text-amber-900">
                ⏳ هذا المشروع حصري — الوقت المتبقي:
              </p>
              <p className="mt-2 text-2xl font-mono font-bold text-amber-700 tabular-nums tracking-wider">
                {countdownLabel}
              </p>
            </div>
          </section>
        ) : null}
        {(project as { offers_enabled?: boolean }).offers_enabled === false && !showExclusiveGate ? (
          <section className="mt-16 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 text-center shadow-sm">
              <p className="text-sm font-semibold text-orange-900">
                تقديم عروض الاسعار عبر النموذج متوقف حاليا
              </p>
              <p className="mt-1 text-xs text-orange-800/80">
                يمكنك تقديم عرضك بسرعة عبر المساعد الآلي.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("open-support-chat"));
                  }
                }}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700"
              >
                قدم الآن
              </button>
            </div>
          </section>
        ) : (
        <div className="relative mt-16 max-w-3xl mx-auto">
          <section id="apply">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-10 shadow-[var(--shadow-card)]">
            <h2 className="text-2xl font-bold">تقديم عرض سعر للمشروع</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              املأ النموذج التالي وأرفق ملف PDF لعرض السعر الخاص بك.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <Field label="اسم الشركة / المؤسسة">
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="مثال: شركة البناء الحديث للمقاولات"
                />
              </Field>

              <Field label="موقع المنشأة">
                <select
                  required
                  value={facilityLocation}
                  onChange={(e) => setFacilityLocation(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="" disabled>اختر المدينة</option>
                  {SAUDI_CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </Field>

              <Field label="البريد الإلكتروني">
                <input
                  type="email"
                  required
                  maxLength={255}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="example@company.com"
                />
              </Field>

              <Field label="ملف PDF لعرض السعر">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border bg-secondary/40 px-4 py-5 text-sm hover:bg-secondary transition">
                  <Upload className="h-5 w-5 text-accent" />
                  <span className="flex-1 text-muted-foreground">
                    {pdfFile ? pdfFile.name : "اضغط لاختيار ملف PDF (الحد الأقصى 10 ميغابايت)"}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    required
                    onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </label>
              </Field>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[image:var(--gradient-accent)] px-6 py-3 text-base font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                تقديم الطلب
              </button>
            </form>
          </div>
        </section>
        </div>
        )}
      </article>

      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold">
        {label} <span className="text-destructive">*</span>
      </label>
      {children}
    </div>
  );
}
