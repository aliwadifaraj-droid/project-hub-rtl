import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CheckCircle2, Loader2, Mail, MessageSquare, User } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل بنا — إنشاء" },
      { name: "description", content: "تواصل مع فريق منصة إنشاء لمشاريع المقاولات." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "الاسم مطلوب").max(100),
  email: z.string().trim().email("بريد إلكتروني غير صحيح").max(200),
  message: z.string().trim().min(1, "الرسالة مطلوبة").max(2000),
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, message });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({ name: parsed.data.name, email: parsed.data.email, message: parsed.data.message });
      if (error) throw error;
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

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
        <span className="text-accent">{icon}</span>
        {label} <span className="text-destructive">*</span>
      </label>
      {children}
    </div>
  );
}
