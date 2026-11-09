import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listProjects } from "@/lib/admin.functions";
import { resolveImage, buildR2Url } from "@/data/projects";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Clock, Hammer, House, Layers3, MapPin } from "lucide-react";

const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: () => listProjects(),
});

const slides = [
  { eyebrow: "لوحة صاحب المشروع", title: "اعرض مشروعك مجاناً", description: "تابع العروض واختر المقاول المناسب.", action: "دخول المالك", href: "https://ali-alhaddad.com/owner-login", color: "from-emerald-800 via-emerald-600 to-emerald-950", icon: House },
  { eyebrow: "لوحة العملاء", title: "قدّم عرضك على مشاريع حقيقية", description: "وصل إلى عملاء جادين في مدينتك.", action: "دخول العملاء", href: "https://ali-alhaddad.com/client-login", color: "from-blue-900 via-blue-700 to-blue-950", icon: BriefcaseBusiness },
  { eyebrow: "لوحة المعلم", title: "اعرض مهنتك واحصل على فرص", description: "نجار، حداد، بناء، كهربائي وأكثر.", action: "دخول المعلم", href: "https://ali-alhaddad.com/haraj", color: "from-orange-800 via-orange-500 to-orange-950", icon: Hammer },
  { eyebrow: "منصة العمران", title: "المالك والعميل والمعلم معاً", description: "كل أطراف البناء في مكان واحد.", action: "اكتشف المنصة", href: "https://ali-alhaddad.com", color: "from-slate-900 via-cyan-900 to-slate-950", icon: Layers3 },
] as const;

const roles = [
  { title: "صاحب المشروع", href: "https://ali-alhaddad.com/owner-login", color: "bg-emerald-600", icon: House },
  { title: "العملاء", href: "https://ali-alhaddad.com/client-login", color: "bg-blue-600", icon: BriefcaseBusiness },
  { title: "المعلم", href: "https://ali-alhaddad.com/haraj", color: "bg-orange-500", icon: Hammer },
] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "العمران — منصة مشاريع المقاولات" },
      { name: "description", content: "تصفح أحدث مشاريع المقاولات وقدّم عرض السعر الخاص بك مباشرة." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery),
  component: HomePage,
});

function pickImage(p: { cover_url?: string; cover_image: string | null }) {
  if (p.cover_url && (p.cover_url.startsWith("http") || p.cover_url.startsWith("/"))) return p.cover_url;
  const r2 = buildR2Url(p.cover_image ?? "");
  if (r2) return r2;
  return resolveImage(p.cover_image ?? "");
}

function HeroSlider() {
  const [active, setActive] = useState(0);
  const slide = slides[active];
  const SlideIcon = slide.icon;

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 10000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      className={`relative h-[180px] w-full overflow-hidden rounded-2xl bg-gradient-to-br ${slide.color} px-4 py-4 text-white shadow-lg shadow-slate-900/10 transition-colors duration-700 sm:h-[220px] sm:px-8 sm:py-6`}
      aria-label="الإعلانات الرئيسية"
    >
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.3)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="relative z-10 flex h-full items-center justify-between gap-3 pb-7 sm:gap-8 sm:pb-8">
        <div key={active} className="max-w-3xl animate-in fade-in duration-700">
          <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/80 sm:text-xs"><SlideIcon size={14} /> {slide.eyebrow}</div>
          <h1 className="text-xl font-bold leading-tight tracking-tight sm:text-3xl">{slide.title}</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-white/85 sm:text-sm">{slide.description}</p>
          <a href={slide.href} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-bold shadow-lg transition hover:-translate-y-0.5 hover:bg-white/25">
            {slide.action}<ArrowLeft size={14} />
          </a>
        </div>
        <div className="hidden shrink-0 items-center justify-center sm:flex" aria-hidden="true"><div className="grid size-24 place-items-center rounded-2xl border border-white/25 bg-white/10"><House className="size-12 text-white/65" strokeWidth={1.2} /></div></div>
      </div>

      {active === 3 && <div className="absolute bottom-8 left-4 right-4 z-10 grid grid-cols-3 gap-1.5 sm:bottom-9 sm:left-8 sm:right-8 sm:gap-2">{roles.map((role) => { const Icon = role.icon; return <a key={role.title} href={role.href} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 rounded-lg border border-white/20 bg-white/10 px-1.5 py-1 text-center text-[10px] font-semibold transition hover:bg-white/20 sm:justify-start sm:px-2 sm:text-xs"><span className={`grid size-5 shrink-0 place-items-center rounded-md ${role.color}`}><Icon size={12} /></span>{role.title}</a>; })}</div>}

      <button type="button" onClick={() => setActive((active + 1) % slides.length)} aria-label="الشريحة التالية" className="absolute right-2 top-3 z-20 grid size-7 place-items-center rounded-full border border-white/25 bg-black/10 transition hover:bg-black/25 sm:right-4 sm:top-1/2 sm:-translate-y-1/2"><ArrowRight size={15} /></button>
      <button type="button" onClick={() => setActive((active - 1 + slides.length) % slides.length)} aria-label="الشريحة السابقة" className="absolute left-2 top-3 z-20 grid size-8 place-items-center rounded-full border border-white/25 bg-black/10 transition hover:bg-black/25 sm:left-4 sm:top-1/2 sm:-translate-y-1/2"><ArrowLeft size={17} /></button>
      <div className="absolute bottom-1.5 left-0 right-0 z-20 flex items-center justify-center gap-3"><div className="flex gap-1.5" role="tablist" aria-label="شرائح الإعلانات">{slides.map((item, index) => <button key={item.title} type="button" role="tab" aria-selected={index === active} aria-label={`الإعلان ${index + 1}`} onClick={() => setActive(index)} className={`h-1.5 rounded-full transition-all ${index === active ? "w-7 bg-white" : "w-1.5 bg-white/40"}`} />)}</div><span className="font-sans text-[10px] text-white/60">0{active + 1} / 04</span></div>
    </section>
  );
}

function HomePage() {
  const { data: projects } = useSuspenseQuery(projectsQuery);

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <SiteHeader />
      <main className="flex-1 pt-[180px] sm:pt-[220px]">
        <section className="fixed inset-x-0 top-16 z-50 border-b border-border/60 bg-background">
          <div className="container mx-auto px-3 sm:px-4"><HeroSlider /></div>
        </section>
        <section className="container mx-auto px-4 py-7 sm:py-10">
          {projects.length === 0 ? <p className="py-14 text-center text-muted-foreground">لا توجد مشاريع متاحة حالياً.</p> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{projects.map((p) => <Link key={p.id} to="/project/$id" params={{ id: p.id }} className="group overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition hover:shadow-lg"><div className="aspect-[4/3] overflow-hidden bg-muted"><img src={pickImage(p)} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div><div className="space-y-2 p-4"><h2 className="line-clamp-1 text-lg font-bold text-foreground">{p.name}</h2><p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p><div className="flex flex-wrap gap-3 pt-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{p.location}</span><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{p.duration}</span></div><div className="inline-flex items-center gap-1 pt-3 text-sm font-semibold text-foreground">عرض التفاصيل <ArrowLeft className="h-4 w-4" /></div></div></Link>)}</div>}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
