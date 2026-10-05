import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createClientTicket } from "@/lib/client-tickets.functions";
import { ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/client-support/tickets/new")({
  ssr: false,
  component: NewClientTicketPage,
});

function NewClientTicketPage() {
  const navigate = useNavigate();
  const createTicket = useServerFn(createClientTicket);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await createTicket({ data: { subject, category, message } });
      await navigate({ to: "/client-support/tickets/$id", params: { id: result.id } });
    } catch {
      setError("تعذر فتح التذكرة. تحقق من البيانات وحاول مرة أخرى.");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="border-b border-border bg-secondary/30"><div className="container mx-auto px-4 py-4"><Link to="/client-support/tickets" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowRight className="h-4 w-4" /> العودة لتذاكري</Link></div></div>
      <main className="container mx-auto max-w-2xl px-4 py-8"><div className="rounded-2xl border border-border bg-card p-6 shadow-sm"><h1 className="text-2xl font-bold">فتح تذكرة دعم</h1><form onSubmit={handleSubmit} className="mt-6 space-y-5"><label className="block text-sm font-medium">الموضوع<input value={subject} onChange={(event) => setSubject(event.target.value)} required minLength={3} maxLength={200} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5" /></label><label className="block text-sm font-medium">التصنيف<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5"><option value="general">استفسار عام</option><option value="order">طلب</option><option value="payment">دفع</option><option value="technical">فني</option></select></label><label className="block text-sm font-medium">الرسالة<textarea value={message} onChange={(event) => setMessage(event.target.value)} required minLength={3} maxLength={5000} rows={7} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5" /></label>{error && <p className="text-sm text-destructive">{error}</p>}<button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />} إرسال التذكرة</button></form></div></main>
    </div>
  );
}
