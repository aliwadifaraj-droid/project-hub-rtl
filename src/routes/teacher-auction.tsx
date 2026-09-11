import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { registerTeacher } from "@/lib/teacher-market.functions";
import { SAUDI_CITIES } from "@/lib/saudi-cities";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  GraduationCap,
  Bell,
  CheckCircle2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher-auction")({
  head: () => ({
    meta: [
      { title: "حراج المعلمين — العمران" },
      {
        name: "description",
        content: "سجّل في حراج المعلمين وفعّل إشعاراتك",
      },
    ],
  }),
  component: TeacherAuctionPage,
});

function TeacherAuctionPage() {
  const register = useServerFn(registerTeacher);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    city: "",
    phone: "",
    cv: "",
  });

  const registerMut = useMutation({
    mutationFn: async (data: typeof form) => {
      return await register({ data });
    },
    onSuccess: () => {
      toast.success("تم التسجيل بنجاح في حراج المعلمين");
      setRegistered(true);
      setTeacherEmail(form.email);
    },
    onError: (err: Error) => {
      toast.error(err.message || "حدث خطأ أثناء التسجيل");
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.city || !form.phone) {
      toast.error("الرجاء تعبئة جميع الحقول المطلوبة");
      return;
    }
    setSubmitting(true);
    await registerMut.mutateAsync(form);
    setSubmitting(false);
  }

  async function handleEnableNotifications() {
    try {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          setNotificationsOn(true);
          toast.success("تم تفعيل الإشعارات بنجاح");
        } else {
          toast.error("لم يتم السماح بالإشعارات");
        }
      } else {
        toast.error("المتصفح لا يدعم الإشعارات");
      }
    } catch {
      toast.error("تعذر تفعيل الإشعارات");
    }
  }

  return (
    <div className="min-h-screen bg-secondary/30" dir="rtl">
      <SiteHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[image:var(--gradient-accent)] text-accent-foreground">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              حراج المعلمين
            </h1>
            <p className="mt-2 text-muted-foreground">
              سجّل بياناتك وانضم إلى حراج المعلمين
            </p>
          </div>

          {!registered ? (
            <div className="rounded-xl border border-border bg-background p-6 shadow-sm md:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-1.5">
                    <User className="h-4 w-4" /> الاسم الكامل
                  </Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="أدخل اسمك الكامل"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" /> البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="example@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> مدينة الإقامة
                  </Label>
                  <Select
                    value={form.city}
                    onValueChange={(v) => setForm({ ...form, city: v })}
                  >
                    <SelectTrigger id="city">
                      <SelectValue placeholder="اختر مدينتك" />
                    </SelectTrigger>
                    <SelectContent>
                      {SAUDI_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" /> رقم الجوال
                  </Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="05xxxxxxxx"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cv" className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4" /> رابط السيرة الذاتية (CV)
                  </Label>
                  <Input
                    id="cv"
                    value={form.cv}
                    onChange={(e) => setForm({ ...form, cv: e.target.value })}
                    placeholder="https://example.com/cv.pdf"
                  />
                  <p className="text-xs text-muted-foreground">
                    أدخل رابط السيرة الذاتية (اختياري)
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> جاري التسجيل...
                    </>
                  ) : (
                    "تسجيل"
                  )}
                </Button>
              </form>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-background p-6 shadow-sm md:p-8">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-600">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  تم التسجيل بنجاح
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  تم تسجيلك في حراج المعلمين بريد: {teacherEmail}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">
                      تفعيل الإشعارات
                    </p>
                    <p className="text-sm text-muted-foreground">
                      احصل على تنبيهات فورية عند توفر فرص جديدة
                    </p>
                  </div>
                  <Button
                    onClick={handleEnableNotifications}
                    disabled={notificationsOn}
                    variant={notificationsOn ? "secondary" : "default"}
                  >
                    {notificationsOn ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> مفعّل
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4" /> تفعيل الإشعارات
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
