import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  getTeacherData,
  getTeacherNotifications,
  markTeacherNotifRead,
  markAllTeacherNotifsRead,
} from "@/lib/teacher-market.functions";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  User,
  Mail,
  MapPin,
  Phone,
  FileText,
  Briefcase,
  Bell,
  Calendar,
  CalendarClock,
  LogOut,
  CheckCheck,
  Circle,
  Check,
  GraduationCap,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

type TeacherData = {
  id: number;
  name: string;
  email: string;
  city: string;
  phone: string;
  profession: string;
  cv: string | null;
  entry_date: string;
  exit_date: string | null;
  status: string;
};

type TeacherNotification = {
  id: number;
  teacher_email: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
};

export const Route = createFileRoute("/dashboard-teacher")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة المعلم — العمران" },
      { name: "description", content: "بياناتي وإشعاراتي" },
    ],
  }),
  component: TeacherDashboardPage,
});

function statusBadge(s: string) {
  const map: Record<
    string,
    { class: string; icon: typeof ShieldCheck; label: string }
  > = {
    active: {
      class: "bg-green-100 text-green-800 border-green-200",
      icon: ShieldCheck,
      label: "نشط",
    },
    inactive: {
      class: "bg-red-100 text-red-800 border-red-200",
      icon: ShieldX,
      label: "غير نشط",
    },
    suspended: {
      class: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: ShieldAlert,
      label: "موقوف",
    },
  };
  const info =
    map[s] ?? {
      class: "bg-secondary text-secondary-foreground",
      icon: ShieldCheck,
      label: s,
    };
  const Icon = info.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${info.class}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {info.label}
    </span>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  ltr,
}: {
  icon: typeof User;
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p
        className="text-sm font-semibold text-foreground"
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function TeacherDashboardPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [showData, setShowData] = useState(false);

  useEffect(() => {
    const e = localStorage.getItem("teacher_email");
    if (!e) {
      navigate({ to: "/teacher-auction", replace: true });
      return;
    }
    setEmail(e);
    setChecked(true);
  }, [navigate]);

  const getTeacher = useServerFn(getTeacherData);
  const getNotifs = useServerFn(getTeacherNotifications);
  const markRead = useServerFn(markTeacherNotifRead);
  const markAllRead = useServerFn(markAllTeacherNotifsRead);
  const qc = useQueryClient();

  const { data: teacher, isLoading: teacherLoading } = useQuery({
    queryKey: ["teacher-data", email],
    queryFn: () => getTeacher({ data: { email: email! } }),
    enabled: !!email,
  });

  const { data: notifications = [], isLoading: notifsLoading } = useQuery({
    queryKey: ["teacher-notifications", email],
    queryFn: () => getNotifs({ data: { email: email! } }),
    enabled: !!email,
  });

  const markReadMut = useMutation({
    mutationFn: (id: number) => markRead({ data: { email: email!, id } }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["teacher-notifications", email] }),
  });

  const markAllReadMut = useMutation({
    mutationFn: () => markAllRead({ data: { email: email! } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-notifications", email] });
      toast.success("تم تحديد جميع الإشعارات كمقروءة");
    },
  });

  function handleLogout() {
    localStorage.removeItem("teacher_email");
    navigate({ to: "/teacher-auction", replace: true });
  }

  if (!checked || !email) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background"
        dir="rtl"
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const unreadCount = notifications.filter((n: TeacherNotification) => !n.read).length;

  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      {/* SiteHeader hidden on teacher dashboard */}
      <main className="flex-1">
        {/* Hero with bell + counter */}
        <section className="border-b border-border/60 bg-[image:var(--gradient-hero,none)]">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[image:var(--gradient-accent)] text-accent-foreground">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    لوحة المعلم
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {teacher ? `مرحباً، ${teacher.name}` : "مرحباً بك"}
                  </p>
                </div>
              </div>

              {/* Bell + counter */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("notifications-card");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:bg-secondary"
                  aria-label="الإشعارات"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="container mx-auto px-4 py-8 sm:py-12">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Card 1: My Data — collapsed by default */}
            <Card className="overflow-hidden border-border/60 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-secondary/30">
                <button
                  type="button"
                  onClick={() => setShowData((v) => !v)}
                  className="flex w-full items-center justify-between text-right"
                >
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-primary" />
                    بياناتي
                  </CardTitle>
                  {showData ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </CardHeader>
              <CardContent className="p-0">
                {showData ? (
                  <div className="p-6">
                    {teacherLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : teacher ? (
                      <div className="space-y-5">
                        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/20 px-4 py-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            الحالة
                          </span>
                          {statusBadge(teacher.status)}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <InfoRow
                            icon={User}
                            label="الاسم"
                            value={teacher.name}
                          />
                          <InfoRow
                            icon={Mail}
                            label="البريد الإلكتروني"
                            value={teacher.email}
                            ltr
                          />
                          <InfoRow
                            icon={MapPin}
                            label="المدينة"
                            value={teacher.city}
                          />
                          <InfoRow
                            icon={Phone}
                            label="رقم الجوال"
                            value={teacher.phone}
                            ltr
                          />
                          <InfoRow
                            icon={Briefcase}
                            label="المهنة"
                            value={teacher.profession || "غير محدد"}
                          />
                          <InfoRow
                            icon={Calendar}
                            label="تاريخ التسجيل"
                            value={teacher.entry_date}
                          />
                          <InfoRow
                            icon={CalendarClock}
                            label="تاريخ الخروج"
                            value={teacher.exit_date ?? "—"}
                          />
                        </div>
                        {teacher.cv ? (
                          <a
                            href={teacher.cv}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-secondary"
                          >
                            <FileText className="h-4 w-4" />
                            عرض السيرة الذاتية
                          </a>
                        ) : null}
                      </div>
                    ) : (
                      <p className="py-12 text-center text-sm text-muted-foreground">
                        لم يتم العثور على بياناتك
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-6 py-5 text-sm text-muted-foreground">
                    <User className="h-5 w-5 text-muted-foreground/50" />
                    اضغط على البطاقة لعرض بياناتك
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 2: Notifications */}
            <Card id="notifications-card" className="overflow-hidden border-border/60 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-secondary/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bell className="h-5 w-5 text-primary" />
                    إشعاراتي
                    {unreadCount > 0 ? (
                      <Badge variant="default" className="mr-1">
                        {unreadCount} جديد
                      </Badge>
                    ) : null}
                  </CardTitle>
                  {unreadCount > 0 ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAllReadMut.mutate()}
                      disabled={markAllReadMut.isPending}
                      className="gap-1.5 text-xs"
                    >
                      {markAllReadMut.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCheck className="h-3.5 w-3.5" />
                      )}
                      تحديد الكل كمقروء
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {notifsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Bell className="h-10 w-10 text-muted-foreground/40" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      لا توجد إشعارات حالياً
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <div className="divide-y divide-border/40">
                      {notifications.map((n: TeacherNotification) => (
                        <div
                          key={n.id}
                          className={`flex items-start gap-3 p-4 transition hover:bg-secondary/20 ${
                            !n.read ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className="mt-1.5 flex-shrink-0">
                            {n.read ? (
                              <Circle className="h-2 w-2 text-muted-foreground/30" />
                            ) : (
                              <Circle className="h-2 w-2 fill-primary text-primary" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">
                              {n.title}
                            </p>
                            {n.body ? (
                              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                                {n.body}
                              </p>
                            ) : null}
                            <p
                              className="mt-1.5 text-xs text-muted-foreground/70"
                              dir="ltr"
                            >
                              {n.created_at}
                            </p>
                          </div>
                          {!n.read ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markReadMut.mutate(n.id)}
                              disabled={markReadMut.isPending}
                              className="flex-shrink-0 text-xs"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
