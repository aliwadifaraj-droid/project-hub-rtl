import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  closeMyOwnerTicket,
  createOwnerTicket,
  getMyOwnerTicket,
  listMyOwnerTickets,
  markMyOwnerTicketRead,
  replyToMyOwnerTicket,
  closeMyOwnerTicket,
} from "@/lib/owner-tickets.functions";
import { ArrowRight, ChevronDown, Loader2, MessageSquare, Plus, Send, Ticket, X, XCircle } from "lucide-react";

export const Route = createFileRoute("/project-owner/tickets")({
  ssr: false,
  beforeLoad: async () => {
    const { getProjectOwnerSession } = await import("@/lib/project-owner.functions");
    const session = await getProjectOwnerSession();
    if (!session) throw await import("@tanstack/react-router").then((m) => m.redirect({ to: "/project-owner-login" }));
  },
  component: OwnerTicketsPage,
});

const statusLabels: Record<string, string> = { open: "مفتوحة", pending: "قيد المعالجة", resolved: "تم الحل", closed: "مغلقة" };
const statusColors: Record<string, string> = { open: "bg-blue-100 text-blue-800", pending: "bg-yellow-100 text-yellow-800", resolved: "bg-green-100 text-green-800", closed: "bg-gray-100 text-gray-600" };

export function OwnerTicketsPage() {
  const listTickets = useServerFn(listMyOwnerTickets);
  const createTicket = useServerFn(createOwnerTicket);
  const getTicket = useServerFn(getMyOwnerTicket);
  const markRead = useServerFn(markMyOwnerTicketRead);
  const reply = useServerFn(replyToMyOwnerTicket);
  const closeTicket = useServerFn(closeMyOwnerTicket);
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyError, setReplyError] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { data: tickets = [], isLoading, isError } = useQuery({ queryKey: ["owner-support-tickets"], queryFn: () => listTickets(), refetchInterval: 5000 });
  const expandedTicketQuery = useQuery({ queryKey: ["owner-support-ticket", expandedId], queryFn: () => getTicket({ data: { id: expandedId! } }), enabled: Boolean(expandedId), refetchInterval: expandedId ? 5000 : false });

  useEffect(() => {
    if (!expandedId || !expandedTicketQuery.data) return;
    void markRead({ data: { id: expandedId } }).then(() => {
      void queryClient.invalidateQueries({ queryKey: ["owner-support-tickets"] });
    }).catch(() => undefined);
  }, [expandedId, expandedTicketQuery.data, markRead, queryClient]);

  function toggleTicket(ticketId: string): void {
    setExpandedId((currentId) => currentId === ticketId ? null : ticketId);
    setReplyMessage("");
    setReplyError("");
  }

  async function handleReply(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!expandedId || !replyMessage.trim()) return;
    setSendingReply(true);
    setReplyError("");
    try {
      await reply({ data: { id: expandedId, message: replyMessage.trim() } });
      setReplyMessage("");
      await queryClient.invalidateQueries({ queryKey: ["owner-support-ticket", expandedId] });
      await queryClient.invalidateQueries({ queryKey: ["owner-support-tickets"] });
    } catch (e) {
      setReplyError(e instanceof Error ? e.message : "تعذر إرسال الرد حالياً.");
    } finally {
      setSendingReply(false);
    }
  }

  async function handleCloseTicket(): Promise<void> {
    if (!expandedId) return;
    setReplyError("");
    try {
      await closeTicket({ data: { id: expandedId } });
      await queryClient.invalidateQueries({ queryKey: ["owner-support-ticket", expandedId] });
      await queryClient.invalidateQueries({ queryKey: ["owner-support-tickets"] });
    } catch (e) {
      setReplyError(e instanceof Error ? e.message : "تعذر إغلاق التذكرة حالياً.");
    }
  }

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
      await queryClient.invalidateQueries({ queryKey: ["owner-support-tickets"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر فتح التذكرة. تحقق من البيانات وحاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b border-border bg-secondary/30"><div className="container mx-auto flex items-center justify-between gap-4 px-4 py-5"><Link to="/project-owner" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowRight className="h-4 w-4" /> العودة للوحة صاحب المشروع</Link><button type="button" onClick={openNewTicket} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"><Plus className="h-4 w-4" /> تذكرة جديدة</button></div></header>
      <main className="container mx-auto max-w-3xl px-4 py-8"><div className="mb-6 flex items-center gap-3"><Ticket className="h-7 w-7 text-primary" /><h1 className="text-2xl font-bold">تذاكر الدعم</h1></div>
        {isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> : isError ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">تعذر تحميل تذاكرك حالياً.</div> : tickets.length === 0 ? <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-muted-foreground">لا توجد تذاكر حالياً</div> : <div className="space-y-4">{tickets.map((ticket) => { const isExpanded = expandedId === ticket.id; const detail = isExpanded ? expandedTicketQuery.data : undefined; return <article key={ticket.id} className={`overflow-hidden rounded-2xl border bg-card shadow-sm transition ${isExpanded ? "border-primary/50 ring-2 ring-primary/10" : "border-emerald-200"}`}><button type="button" onClick={() => toggleTicket(ticket.id)} className="w-full p-4 text-right transition hover:bg-secondary/30" aria-expanded={isExpanded}><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><MessageSquare className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[ticket.status] ?? statusColors.open}`}>{statusLabels[ticket.status] ?? ticket.status}</span><span className="text-xs text-muted-foreground">{new Date(ticket.created_at * 1000).toLocaleDateString("ar-SA")}</span></div><h2 className="mt-2 truncate text-lg font-semibold">{ticket.subject}</h2></div></div><ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} /></div></button>{isExpanded && <div className="border-t border-border bg-secondary/10 px-4 pb-5 pt-4">{expandedTicketQuery.isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : expandedTicketQuery.isError || !detail ? <p className="py-6 text-center text-sm text-destructive">تعذر تحميل تفاصيل التذكرة.</p> : <><div className="max-h-[420px] space-y-3 overflow-y-auto rounded-xl border border-border bg-background p-3">{detail.messages.map((item) => <div key={item.id} className={`flex ${item.sender_type === "admin" ? "justify-start" : "justify-end"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${item.sender_type === "admin" ? "rounded-bl-sm bg-blue-50 text-blue-900" : "rounded-br-sm bg-emerald-600 text-white"}`}><p className="text-xs font-semibold opacity-70">{item.sender_type === "admin" ? "فريق الدعم" : "أنت"}</p><p className="mt-1 whitespace-pre-wrap leading-6">{item.message}</p><p className="mt-1 text-[10px] opacity-60" dir="ltr">{new Date(item.created_at * 1000).toLocaleString("ar-SA")}</p></div></div>)}</div><form onSubmit={handleReply} className="mt-4 space-y-3"><textarea value={replyMessage} onChange={(event) => setReplyMessage(event.target.value)} required minLength={1} maxLength={5000} rows={3} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" placeholder={detail.ticket.status === "closed" ? "اكتب رداً لإعادة فتح التذكرة" : "اكتب ردك هنا"} /><div className="flex flex-wrap items-center justify-between gap-3"><button type="submit" disabled={sendingReply || !replyMessage.trim()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60">{sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} إرسال الرد</button>{detail.ticket.status !== "closed" && <button type="button" onClick={() => void handleCloseTicket()} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary"><XCircle className="h-4 w-4" /> إغلاق التذكرة</button>}</div>{detail.ticket.status === "closed" && <p className="text-xs text-muted-foreground">سيتم إعادة فتح التذكرة تلقائياً عند إرسال رد جديد.</p>}{replyError && <p className="text-sm text-destructive">{replyError}</p>}</form></>}</div>}</article>; })}</div>}
      </main>
      {showNewTicket && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="فتح تذكرة دعم"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-bold">فتح تذكرة دعم</h2><button type="button" onClick={closeNewTicket} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary" aria-label="إغلاق"><X className="h-5 w-5" /></button></div><form onSubmit={handleSubmit} className="mt-6 space-y-4"><label className="block text-sm font-medium">الموضوع<input value={subject} onChange={(event) => setSubject(event.target.value)} required minLength={3} maxLength={200} className="mt-2 g-full rounded-lg border border-border bg-background px-3 py-2.5" /></label><label className="block text-sm font-medium">التصنيف<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5"><option value="general">استفسار عام</option><option value="order">طلب</option><option value="payment">دفع</option><option value="technical">فني</option></select></label><label className="block text-sm font-medium">الرسالة<textarea value={message} onChange={(event) => setMessage(event.target.value)} required minLength={3} maxLength={5000} rows={6} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5" /></label>{error && <p className="text-sm text-destructive">{error}</p>}<button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />} إرسال التذكرة</button></form></div></div>}
    </div>
  );
}
