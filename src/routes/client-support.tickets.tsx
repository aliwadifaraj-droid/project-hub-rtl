import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createClientTicket, listMyClientTickets } from "@/lib/client-tickets.functions";
import { MessageSquare, Plus, Loader2, ArrowRight, Ticket, X } from "lucide-react";

export const Route = createFileRoute("/client-support/tickets")({
  ssr: false,
  component: ClientTicketsPage,
});

const statusLabels: Record<string, string> = {
  open: "مفتوحة",
  pending: "قيد المعالجة",
  resolved: "تم الحل",
  closed: "مغلقة",
};

function ClientTicketsPage() {
  const listTickets = useServerFn(listMyClientTickets);
  const createTicket = useServerFn(createClientTicket);
  const queryClient = useQueryClient();
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { data: tickets = [], isLoading, isError } = useQuery({
    queryKey: ["client-support-tickets"],
    queryFn: () => listTickets(),
    refetchInterval: 5000,
  });

  function openNewTicket(): void {
    setError("");
    setShowNewTicket(true);
  }

  function closeNewTicket(): void {
    if (saving) return;
    setShowNewTicket(false);
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createTicket({ data: { subject, category, message } });
      setSubject("");
      setCategory("general");
      setMessage("");
      setShowNewTicket(false);
      await queryClient.invalidateQueries({ queryKey: ["client-support-tickets"] });
    } catch {
      setError("تعذر فتح التذكرة. تحقق من البيانات وحاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="border-b border-border bg-secondary/30">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-4">
          <Link to="/client-portal" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowRight className="h-4 w-4" />
            العودة للوحة العميل
          </Link>
          <h1 className="text-xl font-bold">تذاكر الدعم</h1>
          <button type="button" onClick={openNewTicket} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            تذكرة جديدة
          </button>
        </div>
      </div>
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">تعذر تحميل تذاكرك حالياً.</div>
        ) : tickets.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center text-center">
            <Ticket className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-sm text-muted-foreground">لا توجد تذاكر حالياً</p>
            <button type="button" onClick={openNewTicket} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-primary transition hover:bg-secondary">
              <Plus className="h-4 w-4" />
              افتح تذكرة جديدة
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {tickets.map((ticket) => (
              <Link key={ticket.id} to="/client-support/tickets/$id" params={{ id: ticket.id }} className="block rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground"><MessageSquare className="h-4 w-4" /> {statusLabels[ticket.status] ?? ticket.status}</span>
                  <span className="text-xs text-muted-foreground">{new Date(ticket.created_at * 1000).toLocaleDateString("ar-SA")}</span>
                </div>
                <h2 className="mt-2 text-sm font-semibold">{ticket.subject}</h2>
                {ticket.latest_message && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {ticket.latest_message_sender === "admin" ? "رد الدعم: " : "رسالتك: "}
                    {ticket.latest_message}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
      {showNewTicket && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="new-ticket-title">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h2 id="new-ticket-title" className="text-2xl font-bold">فتح تذكرة دعم</h2>
              <button type="button" onClick={closeNewTicket} className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground" aria-label="إغلاق"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <label className="block text-sm font-medium">الموضوع<input value={subject} onChange={(event) => setSubject(event.target.value)} required minLength={3} maxLength={200} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5" /></label>
              <label className="block text-sm font-medium">التصنيف<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5"><option value="general">استفسار عام</option><option value="order">طلب</option><option value="payment">دفع</option><option value="technical">فني</option></select></label>
              <label className="block text-sm font-medium">الرسالة<textarea value={message} onChange={(event) => setMessage(event.target.value)} required minLength={3} maxLength={5000} rows={7} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5" /></label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />} إرسال التذكرة</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
