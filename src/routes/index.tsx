import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listProjects } from "@/lib/admin.functions";
import { resolveImage, buildR2Url } from "@/data/projects";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2, Clock, Hammer, House, Layers3, MapPin } from "lucide-react";

const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: () => listProjects(),
});

const slides = [
  { eyebrow: "لوحة صاحب المشروع", title: "عندك مشروع؟ اعرضه مجاناً", description: "سجل مجاناً، تابع عروض الأسعار، واختر المقاول بالسعر اللي يناسبك", action: "اعرض مشروعك مجاناً", href: "https://ali-alhaddad.com/owner-login", color: "from-emerald-800 via-emerald-600 to-emerald-950", icon: House },
  { eyebrow: "لوحة العملاء · للمقاولين والمؤسسات", title: "قدّم عروض أسعار على مشاريع حقيقية", description: "قدّم عروض أسعار على مشاريع حقيقية في مدينتك ووصل إلى عملاء جادين", action: "سجّل كعميل", href: "https://ali-alhaddad.com/client-login", color: "from-blue-900 via-blue-700 to-blue-950", icon: BriefcaseBusiness },
  { eyebrow: "لوحة المعلم · حراج المعلمين", title: "لوحة المعلم - حراج المعلمين", description: "سجّل بمهنتك: نجار، حداد، بناء، كهربائي، مليّس، واحصل على فرصة عمل", action: "سجّل كمعلم", href: "https://ali-alhaddad.com/haraj", color: "from-orange-800 via-orange-500 to-orange-950", icon: Hammer },
  { eyebrow: "منصة العمران", title: "كل أطراف البناء في مكان واحد", description: "نربط أصحاب المشاريع بالمقاولين والمعلمين الحرفيين بسهولة وشفافية", action: "اكتشف المنصة", href: "https://ali-alhaddad.com", color: "from-slate-900 via-cyan-900 to-slate-950", icon: Layers3 },
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
  const [paused, setPaused] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const slide = slides[active];
  const SlideIcon = slide.icon;

  useEffect(() => {
    if (paused || manualPause) return undefined;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [paused, manualPause]);

  const selectSlide = (index: number) => {
    setActive(index);
    setManualPause(true);
    window.setTimeout(() => setManualPause(false), 10000);
  };

  return (
    <section
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${slide.color} px-5 py-5 text-white shadow-lg shadow-slate-900/10 transition-colors duration-700 sm:px-8 sm:py-7`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="الإعلانات الرئيسية"
    >
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.3)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="relative z-10 flex min-h-[210px] items-center justify-between gap-4 sm:min-h-[220px] sm:gap-8">
        <div key={active} className="max-w-3xl animate-in fade-in duration-700">
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-white/80 sm:text-sm"><SlideIcon size={16} /> {slide.eyebrow}</div>
          <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{slide.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85 sm:mt-3 sm:text-base">{slide.description}</p>
          <a href={slide.href} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-3 rounded-xl border border-white/25 bg-white/15 px-4 py-2.5 text-sm font-bold shadow-lg transition hover:-translate-y-0.5 hover:bg-white/25 sm:mt-5">
            {slide.action}<ArrowLeft size={17} />
          </a>
        </div>
        <div className="hidden shrink-0 items-center justify-center sm:flex" aria-hidden="true"><div className="grid size-32 place-items-center rounded-[1.5rem] border border-white/25 bg-white/10"><House className="size-16 text-white/65" strokeWidth={1.2} /></div></div>
      </div>

      {active === 3 && <div className="relative z-10 mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3">{roles.map((role) => { const Icon = role.icon; return <a key={role.title} href={role.href} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-2 py-2 text-center text-xs font-semibold transition hover:bg-white/20 sm:justify-start sm:px-3"><span className={`grid size-7 shrink-0 place-items-center rounded-lg ${role.color}`}><Icon size={14} /></span>{role.title}<ArrowLeft className="hidden opacity-70 sm:block" size={14} /></a>; })}</div>}

      <button type="button" onClick={() => setActive((active + 1) % slides.length)} aria-label="الشريحة التالية" className="absolute right-2 top-3 z-20 grid size-8 place-items-center rounded-full border border-white/25 bg-black/10 transition hover:bg-black/25 sm:right-4 sm:top-1/2 sm:-translate-y-1/2"><ArrowRight size={17} /></button>
      <button type="button" onClick={() => setActive((active - 1 + slides.length) % slides.length)} aria-label="الشريحة السابقة" className="absolute left-2 top-3 z-20 grid size-8 place-items-center rounded-full border border-white/25 bg-black/10 transition hover:bg-black/25 sm:left-4 sm:top-1/2 sm:-translate-y-1/2"><ArrowLeft size={17} /></button>
      <div className="relative z-20 mt-3 flex items-center justify-center gap-3"><div className="flex gap-1.5" role="tablist" aria-label="شرائح الإعلانات">{slides.map((item, index) => <button key={item.title} type="button" role="tab" aria-selected={index === active} aria-label={`الإعلان ${index + 1}`} onClick={() => selectSlide(index)} className={`h-1.5 rounded-full transition-all ${index === active ? "w-7 bg-white" : "w-1.5 bg-white/40"}`} />)}</div><span className="font-sans text-[10px] text-white/60">0{active + 1} / 04</span></div>
    </section>
  );
}

function HomePage() {
  const { data: projects } = useSuspenseQuery(projectsQuery);

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-3 pt-3 sm:px-4 sm:pt-5"><HeroSlider /></div>
        <section className="border-b border-border/60 bg-[image:var(--gradient-hero,none)]">
          <div className="container mx-auto px-4 py-7 sm:py-10"><h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">مشاريع المقاولات المتاحة</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">تصفح أحدث الفرص وقدّم عرضك مباشرة من خلال المنصة.</p></div>
        </section>
        <section className="container mx-auto px-4 py-7 sm:py-10">
          {projects.length === 0 ? <p className="py-14 text-center text-muted-foreground">لا توجد مشاريع متاحة حالياً.</p> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{projects.map((p) => <Link key={p.id} to="/project/$id" params={{ id: p.id }} className="group overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition hover:shadow-lg"><div className="aspect-[4/3] overflow-hidden bg-muted"><img src={pickImage(p)} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div><div className="space-y-2 p-4"><h2 className="line-clamp-1 text-lg font-bold text-foreground">{p.name}</h2><p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p><div className="flex flex-wrap gap-3 pt-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{p.location}</span><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{p.duration}</span></div><div className="inline-flex items-center gap-1 pt-3 text-sm font-semibold text-foreground">عرض التفاصيل <ArrowLeft className="h-4 w-4" /></div></div></Link>)}</div>}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
