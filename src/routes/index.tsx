import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listProjects } from "@/lib/admin.functions";
import { resolveImage, buildR2Url } from "@/data/projects";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2, Clock, Hammer, HardHat, House, Layers3, MapPin, Ruler } from "lucide-react";

const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: () => listProjects(),
});

const slides = [
  {
    eyebrow: "لوحة صاحب المشروع",
    title: "عندك مشروع؟ اعرضه مجاناً",
    description: "سجل مجاناً، تابع عروض الأسعار، واختر المقاول بالسعر اللي يناسبك",
    action: "اعرض مشروعك مجاناً",
    href: "https://ali-alhaddad.com/owner-login",
    color: "from-emerald-800 via-emerald-600 to-emerald-950",
    icon: House,
  },
  {
    eyebrow: "لوحة العملاء · للمقاولين والمؤسسات",
    title: "قدّم عروض أسعار على مشاريع حقيقية",
    description: "قدّم عروض أسعار على مشاريع حقيقية في مدينتك ووصل إلى عملاء جادين",
    action: "سجّل كعميل",
    href: "https://ali-alhaddad.com/client-login",
    color: "from-blue-900 via-blue-700 to-blue-950",
    icon: BriefcaseBusiness,
  },
  {
    eyebrow: "لوحة المعلم · حراج المعلمين",
    title: "لوحة المعلم - حراج المعلمين",
    description: "سجّل بمهنتك: نجار، حداد، بناء، كهربائي، مليّس، واحصل على فرصة عمل",
    action: "سجّل كمعلم",
    href: "https://ali-alhaddad.com/haraj",
    color: "from-orange-800 via-orange-500 to-orange-950",
    icon: Hammer,
  },
  {
    eyebrow: "منصة العمران",
    title: "كل أطراف البناء في مكان واحد",
    description: "نربط أصحاب المشاريع بالمقاولين والمعلمين الحرفيين بسهولة وشفافية",
    action: "اكتشف المنصة",
    href: "https://ali-alhaddad.com",
    color: "from-slate-900 via-cyan-900 to-slate-950",
    icon: Layers3,
  },
] as const;

const roles = [
  { title: "لوحة صاحب المشروع", text: "اعرض مشروعك مجاناً واختر العرض المناسب", href: "https://ali-alhaddad.com/owner-login", color: "bg-emerald-600", icon: House },
  { title: "لوحة العملاء", text: "قدّم عروضاً على مشاريع حقيقية", href: "https://ali-alhaddad.com/client-login", color: "bg-blue-600", icon: BriefcaseBusiness },
  { title: "لوحة المعلم", text: "سجّل مهنتك واحصل على فرصة عمل", href: "https://ali-alhaddad.com/haraj", color: "bg-orange-500", icon: Hammer },
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
      className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${slide.color} px-6 py-12 text-white shadow-2xl shadow-slate-900/15 transition-colors duration-700 sm:px-14 sm:py-16 lg:px-24`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="السلايدر الرئيسي"
    >
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="pointer-events-none absolute -left-24 -top-32 size-[34rem] rounded-full border border-white/15" />
      <div className="pointer-events-none absolute -bottom-48 -right-24 size-[30rem] rounded-full border border-white/15" />

      <div className="relative z-10 flex min-h-[440px] flex-col items-center justify-center gap-8 text-center lg:flex-row lg:justify-between lg:gap-16 lg:text-right">
        <div key={active} className="max-w-3xl animate-in fade-in duration-700">
          <div className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-white/80"><SlideIcon size={19} /> {slide.eyebrow}</div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">{slide.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85 sm:text-xl">{slide.description}</p>
          <a href={slide.href} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-4 rounded-2xl border border-white/25 bg-white/15 px-5 py-4 font-bold shadow-xl shadow-black/10 transition hover:-translate-y-1 hover:bg-white/25">
            {slide.action}<ArrowLeft size={20} />
          </a>
          {active === 3 && <div className="mt-7 inline-flex items-center gap-2 text-sm text-white/80"><CheckCircle2 size={18} /> فرص أوضح، تواصل أسرع، ونتائج أفضل</div>}
        </div>

        <div className="relative grid size-64 shrink-0 place-items-center sm:size-80" aria-hidden="true">
          <div className="absolute inset-5 rotate-6 rounded-[2rem] border border-white/30 bg-white/10 shadow-2xl backdrop-blur-sm" />
          <div className="relative grid size-52 place-items-center rounded-[1.75rem] border border-white/25 bg-white/10 sm:size-64"><House className="size-28 text-white/70 sm:size-36" strokeWidth={1} /><span className="absolute bottom-5 flex items-center gap-2 text-xs font-semibold text-white/80"><HardHat size={17} /> نبنيها صح</span></div>
        </div>
      </div>

      {active === 3 && <div className="relative z-10 grid gap-3 md:grid-cols-3">{roles.map((role) => { const Icon = role.icon; return <a key={role.title} href={role.href} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 text-right transition hover:-translate-y-1 hover:bg-white/20"><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${role.color}`}><Icon size={22} /></span><span><strong className="block text-sm">{role.title}</strong><small className="mt-1 block text-xs text-white/70">{role.text}</small></span><ArrowLeft className="mr-auto opacity-70" size={18} /></a>; })}</div>}

      <button type="button" onClick={() => setActive((active + 1) % slides.length)} aria-label="الشريحة التالية" className="absolute right-4 top-7 z-20 grid size-10 place-items-center rounded-full border border-white/25 bg-black/10 transition hover:bg-black/25 sm:right-6 sm:top-1/2 sm:-translate-y-1/2"><ArrowRight size={20} /></button>
      <button type="button" onClick={() => setActive((active - 1 + slides.length) % slides.length)} aria-label="الشريحة السابقة" className="absolute left-4 top-7 z-20 grid size-10 place-items-center rounded-full border border-white/25 bg-black/10 transition hover:bg-black/25 sm:left-6 sm:top-1/2 sm:-translate-y-1/2"><ArrowLeft size={20} /></button>

      <div className="relative z-20 mt-8 flex items-center justify-center gap-5"><div className="flex gap-2" role="tablist" aria-label="شرائح السلايدر">{slides.map((item, index) => <button key={item.title} type="button" role="tab" aria-selected={index === active} aria-label={`الشريحة ${index + 1}`} onClick={() => selectSlide(index)} className={`h-2 rounded-full transition-all ${index === active ? "w-8 bg-white" : "w-2 bg-white/40"}`} />)}</div><span className="font-sans text-xs text-white/60">0{active + 1} / 04</span></div>
    </section>
  );
}

function HomePage() {
  const { data: projects } = useSuspenseQuery(projectsQuery);

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 pt-6 sm:pt-10"><HeroSlider /></div>

        <section className="border-b border-border/60 bg-[image:var(--gradient-hero,none)]">
          <div className="container mx-auto px-4 py-12 sm:py-16">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">مشاريع المقاولات المتاحة</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">تصفح أحدث الفرص وقدّم عرضك مباشرة من خلال المنصة.</p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10">
          {projects.length === 0 ? (
            <p className="text-center text-muted-foreground py-20">لا توجد مشاريع متاحة حالياً.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <Link key={p.id} to="/project/$id" params={{ id: p.id }} className="group overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition hover:shadow-lg">
                  <div className="aspect-[4/3] overflow-hidden bg-muted"><img src={pickImage(p)} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>
                  <div className="space-y-2 p-4"><h2 className="line-clamp-1 text-lg font-bold text-foreground">{p.name}</h2><p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p><div className="flex flex-wrap gap-3 pt-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{p.location}</span><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{p.duration}</span></div><div className="inline-flex items-center gap-1 pt-3 text-sm font-semibold text-foreground">عرض التفاصيل <ArrowLeft className="h-4 w-4" /></div></div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
