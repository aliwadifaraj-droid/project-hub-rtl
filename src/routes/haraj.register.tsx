import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { registerTeacher } from "@/lib/haraj.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Loader2, Check, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/haraj/register")({
  head: () => ({
    meta: [
      { title: "تسجيل معلم — حراج المعلمين" },
      { name: "description", content: "سجّل بياناتك كمعلم أو حرفي في المنصة." },
    ],
  }),
  component: HarajRegisterPage,
});

const PROFESSIONS = [
  "مهندس مدني",
  "مهندس معماري",
  "حداد",
  "نجار",
  "بناء",
  "كهربائي",
  "سباك",
  "مليس",
  "دهان",
  "أخرى",
];

const HARAJ_CITIES = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام", "الخبر",
  "الظهران", "الجبيل", "الأحساء", "الهفوف", "القطيف", "حفر الباطن",
  "الخرج", "بريدة", "عنيزة", "الرس", "تبوك", "أبها", "خميس مشيط", "نجران",
  "جازان", "صبيا", "حائل", "سكاكا", "عرعر", "رفحاء", "الباحة", "بلجرشي",
  "الطائف", "ينبع", "القنفذة", "الليث", "القريات", "طريف", "وادي الدواسر",
  "بيشة", "محايل عسير", "الزلفي", "المجمعة", "الدوادمي", "عفيف", "شرورة",
  "تثليث",
];

function HarajRegisterPage() {
  const navigate = useNavigate();
  const register = useServerFn(registerTeacher);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    city: "",
    profession: "",
    profession_other: "",
    email: "",
    password: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = "الاسم الكامل مطلوب";
    else if (form.full_name.trim().length < 2) e.full_name = "الاسم قصير جداً";

    if (!form.phone.trim()) e.phone = "رقم الهاتف مطلوب";
    else if (!/^05\d{8}$/.test(form.phone.trim()))
      e.phone = "يجب أن يبدأ بـ 05 ويتكون من 10 أرقام";

    if (!form.city) e.city = "المدينة مطلوبة";
    if (!form.profession) e.profession = "المهنة مطلوبة";
    else if (form.profession === "أخرى" && !form.profession_other.trim())
      e.profession_other = "يرجى كتابة المهنة";

    if (!form.email.trim()) e.email = "البريد الإلكتروني مطلوب";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = "بريد إلكتروني غير صحيح";

    if (!form.password) e.password = "كلمة السر مطلوبة";
    else if (form.password.length < 6) e.password = "6 أحرف على الأقل";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSubmitError("");
    if (!validate()) {
      setSubmitError("يرجى تصحيح الحقول المحددة بالأحمر ثم المحاولة مرة أخرى");
      return;
    }
    setSubmitting(true);
    try {
      await register({
        data: {
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          city: form.city,
          profession: form.profession,
          profession_other: form.profession_other.trim() || "",
          email: form.email.trim(),
          password: form.password,
        },
      });
      toast.success("تم التسجيل بنجاح! سيتم تحويلك لصفحة المعلمين.");
      navigate({ to: "/haraj", replace: true });
    } catch (err) {
      console.error("Teacher registration failed", err);
      setSubmitError(
        err instanceof Error && err.message
          ? `فشل التسجيل: ${err.message}`
          : "فشل التسجيل: حدث خطأ غير متوقع في الخادم، حاول مرة أخرى",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = (field: string) =>
    `w-full rounded-lg border bg-card px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
      errors[field]
        ? "border-destructive focus:border-destructive focus:ring-destructive/20"
        : "border-border focus:border-primary focus:ring-primary/20"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <SiteHeader />
      <main className="container mx-auto flex-1 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500/15 text-amber-600">
              <UserPlus className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold">تسجيل معلم جديد</h1>
              <p className="text-sm text-muted-foreground">
                املأ الحقول التالية للتسجيل في منصة حراج المعلمين
              </p>
            </div>
          </div>

          <form
            noValidate
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                الاسم كاملاً <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                className={inputCls("full_name")}
                placeholder="مثال: محمد عبدالله"
              />
              {errors.full_name && (
                <p className="mt-1 text-xs text-destructive">{errors.full_name}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                رقم الهاتف <span className="text-destructive">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={inputCls("phone")}
                placeholder="05xxxxxxxx"
                dir="ltr"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                المدينة <span className="text-destructive">*</span>
              </label>
              <select
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                className={inputCls("city")}
              >
                <option value="">اختر المدينة</option>
                {HARAJ_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.city && (
                <p className="mt-1 text-xs text-destructive">{errors.city}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                المهنة <span className="text-destructive">*</span>
              </label>
              <select
                value={form.profession}
                onChange={(e) => update("profession", e.target.value)}
                className={inputCls("profession")}
              >
                <option value="">اختر المهنة</option>
                {PROFESSIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.profession && (
                <p className="mt-1 text-xs text-destructive">{errors.profession}</p>
              )}

              {form.profession === "أخرى" && (
                <input
                  type="text"
                  value={form.profession_other}
                  onChange={(e) => update("profession_other", e.target.value)}
                  className={`mt-2 ${inputCls("profession_other")}`}
                  placeholder="اكتب مهنتك هنا"
                />
              )}
              {errors.profession_other && (
                <p className="mt-1 text-xs text-destructive">{errors.profession_other}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                البريد الإلكتروني <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={inputCls("email")}
                placeholder="example@email.com"
                dir="ltr"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                كلمة السر <span className="text-destructive">*</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className={inputCls("password")}
                placeholder="6 أحرف على الأقل"
                dir="ltr"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            {submitError ? (
              <p
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
              >
                {submitError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {submitting ? "جارٍ التسجيل..." : "تسجيل"}
            </button>

            <div className="text-center text-sm text-muted-foreground">
              مسجل مسبقاً؟{" "}
              <Link to="/haraj" className="font-medium text-amber-600 hover:underline">
                تصفح المعلمين
              </Link>
            </div>
          </form>
        </div>
      </main>
      <SiteFooter />
      <Toaster />
    </div>
  );
}
