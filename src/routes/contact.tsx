import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { submitContactMessage } from "@/lib/public.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CheckCircle2, FileText, Loader2, Mail, MessageSquare, User } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل بنا — العمران" },
      { name: "description", content: "تواصل مع فريق منصة العمران لمشاريع المقاولات." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "الاسم مطلوب").max(100),
  email: z.string().trim().email("بريد إلكتروني غير صحيح").max(200),
  message: z.string().trim().min(1, "الرسالة مطلوبة").max(2000),
  wantsPdf: z.enum(["no", "yes"]),
});

function ContactPage() {
  const submitContact = useServerFn(submitContactMessage);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [wantsPdf, setWantsPdf] = useState<"no" | "yes">("no");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (wantsPdf === "yes" && !pdfFile) {
      toast.error("الرجاء إرفاق ملف PDF");
      return;
    }
    if (
      pdfFile &&
      (pdfFile.type !== "application/pdf" || !pdfFile.name.toLowerCase().endsWith(".pdf"))
    ) {
      toast.error("يسمح بإرفاق ملفات PDF فقط");
      return;
    }
    if (pdfFile && pdfFile.size > 5 * 1024 * 1024) {
      toast.error("الحد الأقصى لحجم ملف PDF هو 5 ميغابايت");
      return;
    }
    const parsed = schema.safeParse({ name, email, message, wantsPdf });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
      return;
    }
    setSubmitting(true);
    try {
      const pdf = pdfFile
        ? { filename: pdfFile.name, mime: pdfFile.type, data: await fileToBase64(pdfFile) }
        : undefined;
      await submitContact({ data: { ...parsed.data, pdf } });
      setDone(true);
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ، حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Toaster position="top-center" dir="rtl" />

      <section className="container mx-auto px-4 py-16 max-w-2xl">
        <h1 className="text-4xl font-extrabold text-center">تواصل بنا</h1>
        <p className="mt-3 text-center text-muted-foreground">
          نرحب باستفساراتكم ومقترحاتكم، سنرد عليكم في أقرب وقت.
        </p>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 md:p-10 shadow-[var(--shadow-card)]">
          {done ? (
            <div className="text-center py-8">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent/15 text-accent">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h2 className="mt-4 text-2xl font-bold">تم استلام رسالتكم بنجاح</h2>
              <Link
                to="/"
                className="mt-6 inline-flex rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90"
              >
                العودة للرئيسية
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Field label="الاسم" icon={<User className="h-4 w-4" />}>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
              <Field label="البريد الإلكتروني" icon={<Mail className="h-4 w-4" />}>
                <input
                  type="email"
                  required
                  maxLength={200}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
              <Field label="الرسالة" icon={<MessageSquare className="h-4 w-4" />}>
                <textarea
                  required
                  maxLength={2000}
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full resize-none rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
              <Field
                label="هل تود إرفاق ملف PDF؟"
                icon={<FileText className="h-4 w-4" />}
                required={false}
              >
                <div className="flex gap-6" role="radiogroup" aria-label="هل تود إرفاق ملف PDF؟">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="wantsPdf"
                      value="no"
                      checked={wantsPdf === "no"}
                      onChange={() => {
                        setWantsPdf("no");
                        setPdfFile(null);
                      }}
                    />
                    لا
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="wantsPdf"
                      value="yes"
                      checked={wantsPdf === "yes"}
                      onChange={() => setWantsPdf("yes")}
                    />
                    نعم
                  </label>
                </div>
              </Field>
              {wantsPdf === "yes" && (
                <Field label="ارفاق الملف" icon={<FileText className="h-4 w-4" />} required={false}>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    PDF فقط، بحد أقصى 5 ميغابايت{pdfFile ? ` — ${pdfFile.name}` : ""}
                  </p>
                </Field>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[image:var(--gradient-accent)] px-6 py-3 text-base font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                إرسال
              </button>
            </form>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  icon,
  children,
  required = true,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
        <span className="text-accent">{icon}</span>
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
