import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2, Hammer, HardHat, House, Layers3, Ruler } from "lucide-react";

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
      { title: "منصة العمران | كل أطراف البناء في مكان واحد" },
      { name: "description", content: "منصة تجمع أصحاب المشاريع والعملاء والمعلمين في مكان واحد." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
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
    <div dir="rtl" className="min-h-screen bg-stone-50 text-slate-900">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:h-24 sm:px-8">
        <a href="https://ali-alhaddad.com" className="flex items-center gap-3" aria-label="منصة العمران">
          <span className="grid size-11 place-items-center rounded-2xl border-2 border-emerald-600 text-emerald-700"><House size={24} /></span>
          <span><strong className="block text-lg font-bold text-slate-800 sm:text-xl">منصة العمران</strong><small className="block text-right font-sans text-[10px] tracking-wider text-slate-500">ali-alhaddad.com</small></span>
        </a>
        <span className="hidden items-center gap-2 text-sm text-slate-500 sm:flex"><Ruler size={16} /> نبني الفرص معاً</span>
      </header>

      <main className="mx-auto max-w-7xl px-3 pb-8 sm:px-5">
        <section
          className={`relative min-h-[650px] overflow-hidden rounded-[2rem] bg-gradient-to-br ${slide.color} px-6 py-12 text-white shadow-2xl shadow-slate-900/15 transition-colors duration-700 sm:px-14 sm:py-16 lg:px-24`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          aria-label="السلايدر الرئيسي"
        >
          <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="pointer-events-none absolute -left-24 -top-32 size-[34rem] rounded-full border border-white/15" />
          <div className="pointer-events-none absolute -bottom-48 -right-24 size-[30rem] rounded-full border border-white/15" />

          <div className="relative z-10 flex min-h-[440px] flex-col items-center justify-center gap-8 text-center lg:flex-row lg:justify-between lg:gap-16 lg:text-right">
            <div key={active} className="max-w-3xl animate-in fade-in slide-in-from-bottom-3 duration-700">
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
      </main>
    </div>
  );
}
