import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { getProject, getMyRoles, getExclusiveStatus } from "@/lib/admin.functions";
import { getMyVipStatus } from "@/lib/vip.functions";
import { hasAdminRole } from "@/lib/role-label";
import { resolveImage } from "@/data/projects";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { ArrowRight, MapPin, Clock, FileDown } from "lucide-react";
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
  const getRoles = useServerFn(getMyRoles);
  const getVipStatus = useServerFn(getMyVipStatus);
  const navigate = Route.useNavigate();
  const { data: roles } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => getRoles(),
    retry: false,
  });
  const isAdmin = hasAdminRole(roles);

  const projectExclusiveUntil = (project as { exclusive_until?: string | null }).exclusive_until ?? null;
  const isExclusive = !!(project as { is_exclusive?: boolean }).is_exclusive && projectExclusiveUntil
    ? new Date(projectExclusiveUntil).getTime() > Date.now()
    : false;
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
    ? !!vipStatus?.isVip && (vipStatus?.city ?? "").trim().toLowerCase() === projectCity.toLowerCase()
    : false;
  const showExclusiveGate = isExclusive && !isVipInCity && !exclusiveStatus?.showForm;

  const [remainingMs, setRemainingMs] = useState(0);
  useEffect(() => {
    if (!projectExclusiveUntil) return;
    const end = new Date(projectExclusiveUntil).getTime();
    const tick = () => setRemainingMs(Math.max(0, end - Date.now()));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [projectExclusiveUntil);
  const hoursLeft = Math.floor(remainingMs / 3600_000);
  const minutesLeft = Math.floor((remainingMs % 3600_000) / 60_000);
  const secondsLeft = Math.floor((remainingMs % 60_000) / 1000);
  const countdownLabel = `${String(hoursLeft).padStart(2, "0")}:${String(minutesLeft).padStart(2, "0")}:${String(secondsLeft).padStart(2, "0")}`;

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
        ) : (
          <section id="apply" className="mt-16 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-10 shadow-[var(--shadow-card)] text-center">
              <h2 className="text-2xl font-bold">تقديم عرض سعر للمشروع</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                سجّل دخولك إلى لوحة العملاء أو أنشئ حساباً جديداً لتقديم عرض السعر.
              </p>
              <Link
                to="/client-login"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-[image:var(--gradient-accent)] px-8 py-3.5 text-base font-bold text-accent-foreground transition hover:opacity-90"
              >
                تقديم عرض السعر
              </Link>
            </div>
          </section>
        )}
      </article>

      <SiteFooter />
    </div>
  );
}
