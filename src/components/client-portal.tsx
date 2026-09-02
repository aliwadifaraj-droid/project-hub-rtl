import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyClientProfile,
  getMyOffers,
  searchProjectsForClient,
  submitClientOffer,
  getClientSession,
  getAllProjectsForClient,
  saveClientPushSubscription,
  removeClientPushSubscription,
} from "@/lib/client.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  Building2, User, FileText, Search, Upload, LogOut, Lock,
  Loader2, CheckCircle2, Clock, XCircle, AlertCircle,
  TrendingUp, Briefcase, MapPin, Phone, MapPin as MapPinIcon, FileText as FileTextIcon,
  FolderKanban, Calendar, Crown, Images, Bell, X, ExternalLink,
} from "lucide-react";

type Tab = "projects" | "profile" | "offers" | "submit";

export function ClientPortal() {
  const [tab, setTab] = useState<Tab>("projects");
  const [notifStatus, setNotifStatus] = useState<"idle" | "subscribing" | "error">("idle");
  const [notifEnabled, setNotifEnabled] = useState(false);
  const fetchSession = useServerFn(getClientSession);
  const doSaveSub = useServerFn(saveClientPushSubscription);
  const doRemoveSub = useServerFn(removeClientPushSubscription);

  const { data: session } = useQuery({
    queryKey: ["client-session"],
    queryFn: () => fetchSession(),
  });

  async function checkNotifPermission() {
    if (typeof window === "undefined" ||!("serviceWorker" in navigator) ||!("PushManager" in window)) {
      setNotifEnabled(false);
      return;
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        setNotifEnabled(false);
        return;
      }
      const sub = await reg.pushManager.getSubscription();
      setNotifEnabled(!!sub);
    } catch {
      setNotifEnabled(false);
    }
  }

  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function handleToggleNotifications() {
    if (typeof window === "undefined" ||!("serviceWorker" in navigator) ||!("PushManager" in window)) {
      setNotifStatus("error");
      return;
    }
    if (notifEnabled) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            await sub.unsubscribe();
            await doRemoveSub({ data: { endpoint: sub.endpoint } });
          }
        }
        setNotifEnabled(false);
      } catch {
        setNotifStatus("error");
      }
      return;
    }

    setNotifStatus("subscribing");
    try {
      const permission = await Notification.requestPermission();
      if (permission!== "granted") {
        setNotifStatus("error");
        return;
      }

      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;

      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setNotifStatus("error");
        return;
      }

      const existing = await registration.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const json = sub.toJSON();
      if (!json.endpoint ||!json.keys?.p256dh ||!json.keys?.auth) {
        setNotifStatus("error");
        return;
      }

      await doSaveSub({
        data: {
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
      });

      setNotifEnabled(true);
      setNotifStatus("idle");
    } catch {
      setNotifStatus("error");
    }
  }

  function handleLogout() {
    window.location.href = "/client-logout";
  }

  useEffect(() => {
    checkNotifPermission();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6 rounded-2xl border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-[image:var(--gradient-accent)] text-accent-foreground">
                <Building2 className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-xl font-bold">لوحة العملاء</h1>
                <p className="text-sm text-muted-foreground">
                  {session?.company_name || session?.email || ""}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={handleToggleNotifications}
                disabled={notifStatus === "subscribing"}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                  notifEnabled
                   ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "border-border bg-background hover:bg-secondary"
                }`}
              >
                {notifStatus === "subscribing"? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                {notifEnabled? "الإشعارات مفعّلة" : "تفعيل الإشعارات"}
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-secondary"
              >
                <LogOut className="h-4 w-4" /> تسجيل الخروج
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 flex-wrap gap-2">
          <TabButton active={tab === "projects"} onClick={() => setTab("projects")} icon={<FolderKanban className="h-4 w-4" />}>
            المشاريع
          </TabButton>
          <TabButton active={tab === "profile"} onClick={() => setTab("profile")} icon={<User className="h-4 w-4" />}>
            بياناتي
          </TabButton>
          <TabButton active={tab === "offers"} onClick={() => setTab("offers")} icon={<TrendingUp className="h-4 w-4" />}>
            تتبع عروضي
          </TabButton>
          <TabButton active={tab === "submit"} onClick={() => setTab("submit")} icon={<FileText className="h-4 w-4" />}>
            تقديم عرض سعر
          </TabButton>
        </div>

        {tab === "projects" && <ProjectsTab />}
        {tab === "profile" && <ProfileTab />}
        {tab === "offers" && <OffersTab />}
        {tab === "submit" && <SubmitOfferTab />}
      </div>
      <SiteFooter />
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
        active
         ? "bg-foreground text-background"
          : "border border-border bg-background text-muted-foreground hover:bg-secondary"
      }`}
    >
      {icon} {children}
    </button>
  );
}

type ClientProject = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  duration: string | null;
  cover_url: string;
  pdf_url: string;
  status: string;
  is_exclusive: boolean;
  vip_end_at: string | null;
  created_at: string;
};

function ProjectsTab() {
  const fetchProjects = useServerFn(getAllProjectsForClient);
  const [selected, setSelected] = useState<ClientProject | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["client-all-projects"],
    queryFn: () => fetchProjects(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="rounded-2xl border-border bg-card p-12 text-center shadow-[var(--shadow-card)]">
        <Images className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-bold">لا توجد مشاريع حالياً</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          لم يتم نشر أي مشاريع بعد. يرجى العودة لاحقاً.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <FolderKanban className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-bold">جميع المشاريع</h2>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
          {projects.length}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p: ClientProject) => {
          return (
            <article
              key={p.id}
              onClick={() => setSelected(p)}
              className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                {p.cover_url? (
                  <img
                    src={p.cover_url}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-muted-foreground/40">
                    <Images className="h-10 w-10" />
                  </div>
                )}
                {p.is_exclusive && (
                  <span className="absolute top-3 end-3 inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100/90 px-2.5 py-1 text-[11px] font-bold text-amber-700 backdrop-blur-sm">
                    <Crown className="h-3 w-3" /> حصري VIP
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-3 p-5">
                <h3 className="text-base font-bold leading-snug">{p.name}</h3>

                {p.description && (
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                )}

                <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  {p.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {p.location}
                    </span>
                  )}
                  {p.duration && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {p.duration}
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {selected && (
        <ProjectDetailModal project={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function ProjectDetailModal({ project, onClose }: { project: ClientProject; onClose: () => void }) {
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="flex-1">
            <h2 className="text-lg font-bold">{project.name}</h2>
            <div className="mt-1.5 flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {project.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {project.location}
                </span>
              )}
              {project.duration && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> {project.duration}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {new Date(project.created_at).toLocaleDateString("ar")}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="shrink-0 rounded-lg border border-border bg-background p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {project.cover_url && (
            <div className="mb-5 overflow-hidden rounded-xl border-border">
              <img src={project.cover_url} alt={project.name} className="h-64 w-full object-cover" />
            </div>
          )}

          {project.description && (
            <div className="mb-5">
              <h3 className="mb-2 text-sm font-bold">تفاصيل المشروع</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {project.description}
              </p>
            </div>
          )}

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {project.location && (
              <div className="rounded-lg border-border bg-background px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground">الموقع</p>
                <p className="mt-0.5 text-sm font-medium">{project.location}</p>
              </div>
            )}
            {project.duration && (
              <div className="rounded-lg border-border bg-background px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground">المدة</p>
                <p className="mt-0.5 text-sm font-medium">{project.duration}</p>
              </div>
            )}
          </div>

          {project.pdf_url? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold">ملف المشروع (PDF)</h3>
                <a
                  href={project.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> فتح في نافذة جديدة
                </a>
              </div>
              <div className="overflow-hidden rounded-xl border border-border">
                <iframe
                  src={project.pdf_url}
                  title={project.name}
                  className="h-[60vh] w-full"
                  style={{ border: "none" }}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-border bg-secondary/40 px-4 py-6 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">لا يوجد ملف PDF لهذا المشروع</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileTab() {
  const fetchProfile = useServerFn(getMyClientProfile);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["client-profile"],
    queryFn: () => fetchProfile(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const fields = [
    { icon: <Building2 className="h-4 w-4 text-muted-foreground" />, label: "اسم الشركة / المنشأة", value: profile?.company_name || "—" },
    { icon: <FileTextIcon className="h-4 w-4 text-muted-foreground" />, label: "البريد الإلكتروني", value: profile?.email || "—", locked: true },
    { icon: <Phone className="h-4 w-4 text-muted-foreground" />, label: "رقم الجوال", value: profile?.phone || "—" },
    { icon: <MapPinIcon className="h-4 w-4 text-muted-foreground" />, label: "المدينة", value: profile?.city || "—" },
    { icon: <FileText className="h-4 w-4 text-muted-foreground" />, label: "رقم السجل التجاري", value: profile?.cr_number || "غير متوفر" },
  ];

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="mb-5 flex items-center gap-2">
          <User className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold">بيانات التسجيل</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            <Lock className="h-3 w-3" /> للعرض فقط
          </span>
        </div>

        <div className="space-y-3">
          {fields.map((f, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-background px-4 py-3">
              <span className="mt-0.5 shrink-0">{f.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">{f.label}</p>
                <p className="mt-0.5 truncate text-sm font-medium">{f.value}</p>
              </div>
              {f.locked && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-600 border-amber-200">
                  <Lock className="h-3 w-3" /> ثابت
                </span>
              )}
            </div>
          ))}
        </div>

        {profile?.bio && (
          <div className="mt-3 rounded-lg border-border bg-background px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground">نبذة عن الشركة</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">{profile.bio}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-sm font-bold text-blue-900">لتعديل بياناتك</p>
            <p className="mt-1 text-sm text-blue-700">
              لا يمكن تعديل البيانات ذاتياً بعد التسجيل. لطلب أي تعديل يرجى التواصل مع الإدارة عبر صفحة "تواصل بنا".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OffersTab() {
  const fetchOffers = useServerFn(getMyOffers);

  const { data: offers, isLoading } = useQuery({
    queryKey: ["my-offers"],
    queryFn: () => fetchOffers(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-[var(--shadow-card)]">
        <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-bold">لا توجد عروض بعد</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          لم تقم بتقديم أي عرض سعر حتى الآن. استخدم تبويب "تقديم عرض سعر" للبدء.
        </p>
      </div>
    );
  }

  const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    new: { label: "جديد", color: "text-blue-600 bg-blue-50 border-blue-200", icon: <Clock className="h-3.5 w-3.5" /> },
    reviewing: { label: "قيد المراجعة", color: "text-amber-600 bg-amber-50 border-amber-200", icon: <Clock className="h-3.5 w-3.5" /> },
    pending: { label: "قيد الانتظار", color: "text-amber-600 bg-amber-50 border-amber-200", icon: <Clock className="h-3.5 w-3.5" /> },
    accepted: { label: "مقبول", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    rejected: { label: "مرفوض", color: "text-destructive bg-destructive/5 border-destructive/20", icon: <XCircle className="h-3.5 w-3.5" /> },
  };

  return (
    <div className="space-y-3">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-bold">عروضي المقدمة</h2>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
          {offers.length}
        </span>
      </div>

      {offers.map((offer: any) => {
        const s = statusMap[offer.status]?? statusMap.new;
        return (
          <div key={offer.id} className="rounded-xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">{offer.project_name || "—"}</h3>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${s.color}`}>
                    {s.icon} {s.label}
                  </span>
                </div>
                <div className="mt-2 flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> {offer.company_name}</span>
                  {offer.amount && <span className="inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {offer.amount}</span>}
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(offer.created_at).toLocaleDateString("ar")}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {offer.is_accepted && (
                  <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-600">
                    عرض مقبول
                  </span>
                )}
                {offer.pdf_filename && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" /> {offer.pdf_filename}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SubmitOfferTab() {
  const fetchSession = useServerFn(getClientSession);
  const doSearch = useServerFn(searchProjectsForClient);
  const doSubmit = useServerFn(submitClientOffer);
  const qc = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ["client-session"],
    queryFn: () => fetchSession(),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [amount, setAmount] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfKey, setPdfKey] = useState("");
  const [pdfFilename, setPdfFilename] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearched(true);
    setResult(null);
    try {
      const results = await doSearch({ data: { q: searchQuery.trim() } });
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function selectProject(project: any) {
    setSelectedProject(project);
    setResult(null);
    setSearchQuery("");
    setSearchResults([]);
    setSearched(false);
  }

  function clearSelection() {
    setSelectedProject(null);
    setAmount("");
    setPdfFile(null);
    setPdfKey("");
    setPdfFilename("");
    setResult(null);
  }

  // التعديل الوحيد كان هنا
  async function handlePdfUpload(file: File) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setResult({ ok: false, message: "حجم الملف يجب أن يكون أقل من 20 ميغابايت" });
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type!== "application/pdf") {
      setResult({ ok: false, message: "يجب أن يكون الملف بصيغة PDF" });
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", "bid-pdf");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok ||!json?.key) {
        throw new Error(json?.error || "فشل رفع الملف");
      }
      setPdfKey(json.key);
      setPdfFilename(file.name);
      setPdfFile(file);
      setResult({ ok: true, message: "تم رفع الملف بنجاح" });
    } catch (err) {
      setPdfKey("");
      setResult({ ok: false, message: err instanceof Error? err.message : "فشل رفع الملف" });
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProject) return;
    if (!amount.trim()) {
      setResult({ ok: false, message: "السعر مطلوب" });
      return;
    }
    if (!pdfKey) {
      setResult({ ok: false, message: "يجب رفع ملف PDF" });
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const res = await doSubmit({
        data: {
          projectId: selectedProject.id,
          projectName: selectedProject.name,
          amount,
          pdfKey,
          pdfFilename: pdfFilename || "offer.pdf",
        },
      });
      setResult({ ok: res.ok, message: res.message });
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ["my-offers"] });
        clearSelection();
      }
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error? err.message : "حدث خطأ" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-bold">تقديم عرض سعر</h2>
      </div>

      {session && (
        <div className="rounded-xl border-border bg-secondary/40 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1 font-semibold">
              <Building2 className="h-4 w-4 text-accent" /> {session.company_name}
            </span>
            <span className="text-muted-foreground">{session.email}</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            سيتم تقديم العرض باسم الشركة والبريد المسجل أعلاه (لا يمكن تغييرهما)
          </p>
        </div>
      )}

      {!selectedProject? (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h3 className="mb-4 text-sm font-bold">ابحث عن المشروع</h3>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 end-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="اكتب اسم المشروع..."
                className="inp ps-4 pe-10"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={searching ||!searchQuery.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-bold text-background transition hover:bg-foreground/90 disabled:opacity-60"
            >
              {searching? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              بحث
            </button>
          </form>

          {searched &&!searching && searchResults.length === 0 && (
            <p className="mt-4 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة</p>
          )}

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectProject(p)}
                  className="block w-full rounded-lg border border-border bg-background p-4 text-right transition hover:border-accent hover:bg-secondary/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm">{p.name}</h4>
                      {p.location && (
                        <p className="mt-0.5 text-xs text-muted-foreground inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {p.location}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {p.is_exclusive && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600 border-amber-200">
                          حصري VIP
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="mb-5 rounded-lg border border-border bg-secondary/40 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold">{selectedProject.name}</h3>
                {selectedProject.location &&
