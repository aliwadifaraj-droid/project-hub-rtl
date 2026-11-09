import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Hammer,
  HardHat,
  House,
  Layers3,
  Ruler,
} from 'lucide-react';

type Accent = 'green' | 'blue' | 'orange' | 'navy';

type Slide = {
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  href: string;
  accent: Accent;
  icon: typeof House;
};

const slides: Slide[] = [
  {
    eyebrow: 'لوحة صاحب المشروع',
    title: 'عندك مشروع؟ اعرضه مجاناً',
    description: 'سجل مجاناً، تابع عروض الأسعار، واختر المقاول بالسعر اللي يناسبك',
    action: 'اعرض مشروعك مجاناً',
    href: 'https://ali-alhaddad.com/owner-login',
    accent: 'green',
    icon: House,
  },
  {
    eyebrow: 'لوحة العملاء · للمقاولين والمؤسسات',
    title: 'قدّم عروض أسعار على مشاريع حقيقية',
    description: 'اكتشف مشاريع جديدة في مدينتك، وقدّم عرضك بثقة ووصل لعملاء جادين',
    action: 'سجّل كعميل',
    href: 'https://ali-alhaddad.com/client-login',
    accent: 'blue',
    icon: BriefcaseBusiness,
  },
  {
    eyebrow: 'لوحة المعلم · حراج المعلمين',
    title: 'خل مهنتك تفتح لك باب رزق',
    description: 'سجّل بمهنتك: نجار، حداد، بناء، كهربائي، مليّس، واحصل على فرصة عمل',
    action: 'سجّل كمعلم',
    href: 'https://ali-alhaddad.com/haraj',
    accent: 'orange',
    icon: Hammer,
  },
  {
    eyebrow: 'منصة العمران',
    title: 'كل أطراف البناء في مكان واحد',
    description: 'نربط أصحاب المشاريع بالمقاولين والمعلمين الحرفيين بسهولة وشفافية',
    action: 'اكتشف المنصة',
    href: 'https://ali-alhaddad.com',
    accent: 'navy',
    icon: Layers3,
  },
];

const cards = [
  {
    label: 'صاحب المشروع',
    description: 'اعرض مشروعك مجاناً واختر العرض المناسب',
    action: 'اعرض مشروعك',
    href: 'https://ali-alhaddad.com/owner-login',
    accent: 'green' as Accent,
    icon: House,
  },
  {
    label: 'العملاء والمؤسسات',
    description: 'قدّم عروضاً على مشاريع حقيقية',
    action: 'سجّل كعميل',
    href: 'https://ali-alhaddad.com/client-login',
    accent: 'blue' as Accent,
    icon: BriefcaseBusiness,
  },
  {
    label: 'المعلم الحرفي',
    description: 'سجّل مهنتك واحصل على فرصة عمل',
    action: 'سجّل كمعلم',
    href: 'https://ali-alhaddad.com/haraj',
    accent: 'orange' as Accent,
    icon: Hammer,
  },
];

function App() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDotPause, setIsDotPause] = useState(false);
  const dotPauseTimeout = useRef<number | undefined>(undefined);

  const goToSlide = useCallback((index: number, pauseAfterDot = false) => {
    setActiveSlide((index + slides.length) % slides.length);
    if (pauseAfterDot) {
      setIsDotPause(true);
      window.clearTimeout(dotPauseTimeout.current);
      dotPauseTimeout.current = window.setTimeout(() => setIsDotPause(false), 10000);
    }
  }, []);

  useEffect(() => {
    if (isPaused || isDotPause) return undefined;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isPaused, isDotPause]);

  useEffect(() => () => window.clearTimeout(dotPauseTimeout.current), []);

  const active = slides[activeSlide];
  const ActiveIcon = active.icon;

  return (
    <main dir="rtl" className="site-shell">
      <header className="topbar">
        <a className="brand" href="https://ali-alhaddad.com" aria-label="منصة العمران">
          <span className="brand-mark"><House size={23} strokeWidth={2.3} /></span>
          <span>
            <strong>منصة العمران</strong>
            <small>ali-alhaddad.com</small>
          </span>
        </a>
        <div className="topbar-note"><Ruler size={16} /> نبني الفرص معاً</div>
      </header>

      <section
        className={`hero hero-${active.accent}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        aria-roledescription="carousel"
        aria-label="بوابات منصة العمران"
      >
        <div className="hero-grid" />
        <div className="hero-orbit hero-orbit-one" />
        <div className="hero-orbit hero-orbit-two" />

        <div className="hero-content">
          <div className="hero-copy" key={activeSlide}>
            <div className="eyebrow"><ActiveIcon size={18} /> {active.eyebrow}</div>
            <h1>{active.title}</h1>
            <p>{active.description}</p>
            {activeSlide < 3 && (
              <a className="hero-action" href={active.href} target="_blank" rel="noreferrer">
                {active.action}
                <ArrowLeft size={19} />
              </a>
            )}
            {activeSlide === 3 && <div className="hero-trust"><CheckCircle2 size={19} /> فرص أوضح، تواصل أسرع، ونتائج أفضل</div>}
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="blueprint-card">
              <div className="blueprint-top"><span>ALI / 2026</span><span className="status-dot" /></div>
              <div className="blueprint-house"><House size={100} strokeWidth={1.15} /></div>
              <div className="blueprint-lines"><i /><i /><i /></div>
              <div className="blueprint-badge"><HardHat size={19} /> نبنيها صح</div>
            </div>
          </div>
        </div>

        {activeSlide === 3 && (
          <div className="role-cards">
            {cards.map((card) => {
              const CardIcon = card.icon;
              return (
                <a className={`role-card role-${card.accent}`} href={card.href} target="_blank" rel="noreferrer" key={card.label}>
                  <span className="role-icon"><CardIcon size={22} /></span>
                  <span className="role-text"><strong>{card.label}</strong><small>{card.description}</small></span>
                  <ArrowLeft className="role-arrow" size={18} />
                </a>
              );
            })}
          </div>
        )}

        <button className="slider-arrow slider-next" onClick={() => goToSlide(activeSlide + 1)} aria-label="الشريحة التالية"><ArrowRight size={22} /></button>
        <button className="slider-arrow slider-prev" onClick={() => goToSlide(activeSlide - 1)} aria-label="الشريحة السابقة"><ArrowLeft size={22} /></button>

        <div className="slider-footer">
          <div className="slider-dots" role="tablist" aria-label="اختيار الشريحة">
            {slides.map((slide, index) => (
              <button
                className={`slider-dot ${index === activeSlide ? 'is-active' : ''}`}
                key={slide.title}
                onClick={() => goToSlide(index, true)}
                aria-label={`انتقل إلى الشريحة ${index + 1}`}
                aria-selected={index === activeSlide}
                role="tab"
              />
            ))}
          </div>
          <span className="slide-count">0{activeSlide + 1} <b>/</b> 04</span>
        </div>
      </section>

      <footer className="page-footer"><span>منصة العمران</span><span>مساحتك تبدأ من هنا</span></footer>
    </main>
  );
}

export default App;
