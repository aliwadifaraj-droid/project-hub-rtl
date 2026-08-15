import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitBidRequest } from "@/lib/admin.functions";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Upload, X, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";

export function BidFormAddProject() {
  const submit = useServerFn(submitBidRequest);
  const [companyName, setCompanyName] = useState("");
  const [facilityLocation, setFacilityLocation] = useState("");
  const [email, setEmail] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!companyName.trim()) {
      toast.error("اسم الشركة إجباري");
      return;
    }
    if (!facilityLocation.trim()) {
      toast.error("موقع المنشأة إجباري");
      return;
    }
    if (!email.trim() || !emailRegex.test(email.trim())) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }
    if (!pdfFile) {
      toast.error("الرجاء رفع ملف PDF");
      return;
    }
    if (pdfFile.size > 10 * 1024 * 1024) {
      toast.error("حجم ملف PDF يجب أن يكون أقل من 10 ميغابايت");
      return;
    }
    setSubmitting(true);
    try {
      const fileBase64 = await fileToBase64(pdfFile);
      const result = await submit({
        data: {
          company_name: companyName.trim(),
          facility_location: facilityLocation.trim(),
          email: email.trim(),
          file_name: pdfFile.name,
          file_base64: fileBase64,
          vip_token: "add_project",
          project_name: companyName.trim(),
        },
      });
      if (result?.ok) {
        setDone(true);
      } else {
        throw new Error("لم يتم حفظ الطلب");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر إرسال الطلب");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <SiteHeader />
      <Toaster position="top-center" dir="rtl" />
      <main className="flex-1 container mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition mb-6">
          <ArrowRight className="h-4 w-4" /> العودة للرئيسية
        </Link>

        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 md:p-10 shadow-[var(--shadow-card)]">
          {done ? (
            <div className="text-center py-8">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent/15 text-accent">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h1 className="mt-4 text-2xl font-bold">تم استلام طلبكم بنجاح</h1>
              <p className="mt-2 text-muted-foreground">سيتم التواصل معكم لاحقاً.</p>
              <Link
                to="/"
                className="mt-6 inline-flex rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90"
              >
                العودة للرئيسية
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl md:text-3xl font-extrabold">أضف مشروعك</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                املأ التفاصيل وسيتم مراجعة طلبكم قبل النشر.
              </p>
              <form onSubmit={onSubmit} className="mt-6 space-y-5">
                <Field label="اسم الشركة / المنشأة">
                  <input
                    required
                    maxLength={200}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>

                <Field label="موقع المنشأة">
                  <input
                    required
                    maxLength={300}
                    value={facilityLocation}
                    onChange={(e) => setFacilityLocation(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>

                <Field label="البريد الإلكتروني">
                  <input
                    type="email"
                    required
                    maxLength={255}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="example@email.com"
                  />
                </Field>

                <Field label="ملف المشروع PDF">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border bg-secondary/40 px-4 py-5 text-sm hover:bg-secondary transition">
                    <Upload className="h-5 w-5 text-accent" />
                    <span className="flex-1 text-muted-foreground">
                      {pdfFile ? pdfFile.name : "ارفع ملف PDF واحد إجباري (الحد الأقصى 10 ميغابايت)"}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      required
                      onChange={(e) => { setPdfFile(e.target.files?.[0] ?? null); }}
                      className="hidden"
                    />
                  </label>
                  {pdfFile && (
                    <button
                      type="button"
                      onClick={() => setPdfFile(null)}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                    >
                      <X className="h-3.5 w-3.5" /> إزالة الملف
                    </button>
                  )}
                </Field>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[image:var(--gradient-accent)] px-6 py-3 text-base font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  إرسال الطلب
                </button>
              </form>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold">{label}</label>
      {children}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const base64 = result.split(",")[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
