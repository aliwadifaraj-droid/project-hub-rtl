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

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["client-profile"],
    queryFn: () => fetchProfile(),
    enabled: tab === "profile",
  });
  const fetchProfile = useServerFn(getMyClientProfile);

  const { data: offers, refetch: refetchOffers } = useQuery({
    queryKey: ["client-offers"],
    queryFn: () => fetchOffers(),
    enabled: tab === "offers",
  });
  const fetchOffers = useServerFn(getMyOffers);

  const { data: allProjects } = useQuery({
    queryKey: ["client-all-projects"],
    queryFn: () => fetchAllProjects(),
    enabled: tab === "projects",
  });
  const fetchAllProjects = useServerFn(getAllProjectsForClient);

  const { data: searchResults, refetch: refetchSearch } = useQuery({
    queryKey: ["client-search", searchQuery],
    queryFn: () => doSearch({ q: searchQuery }),
    enabled: !!searchQuery && tab === "projects",
  });
  const doSearch = useServerFn(searchProjectsForClient);

  const [searchQuery, setSearchQuery] = useState("");

  const { data: myOffer } = useQuery({
    queryKey: ["client-offer", selectedProjectId],
    queryFn: () => fetchMyOffer({ projectId: selectedProjectId }),
    enabled: !!selectedProjectId && tab === "submit",
  });
  const fetchMyOffer = useServerFn(getMyOffer);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const doSubmit = useServerFn(submitClientOffer);
  const queryClient = useQueryClient();

  useEffect(() => {
    checkNotifPermission();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fffbeb]">
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

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setTab("projects")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tab === "projects"
                   ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "border border-border bg-background hover:bg-secondary"
                }`}
              >
                <FolderKanban className="h-4 w-4" />
                المشاريع المتاحة
              </button>
              <button
                onClick={() => setTab("offers")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tab === "offers"
                   ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "border border-border bg-background hover:bg-secondary"
                }`}
              >
                <FileText className="h-4 w-4" />
                عروضي
              </button>
              <button
                onClick={() => setTab("submit")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tab === "submit"
                   ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "border border-border bg-background hover:bg-secondary"
                }`}
              >
                <Upload className="h-4 w-4" />
                تقديم عرض
              </button>
              <button
                onClick={() => setTab("profile")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tab === "profile"
                   ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "border border-border bg-background hover:bg-secondary"
                }`}
              >
                <User className="h-4 w-4" />
                ملفي
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-secondary"
              >
                <LogOut className="h-4 w-4" />
                خروج
              </button>
            </div>
          </div>
        </div>
