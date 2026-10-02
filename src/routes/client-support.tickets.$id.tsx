import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { closeMyClientTicket, getMyClientTicket, replyToMyClientTicket } from "@/lib/client-tickets.functions";
import { ArrowRight, Loader2, Send } from "lucide-react";

export const Route = createFileRoute("/client-support/tickets/$id")({
  ssr: false,
  component: ClientTicketDetailsPage,
});

function ClientTicketDetailsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getTicket = useServerFn(getMyClientTicket);
  const reply = useServerFn(replyToMyClientTicket);
  const close = useServerFn(closeMyClientTicket);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["client-support-ticket", id],
    queryFn: () => getTicket({ data: { id } }),
    refetchInterval: 5000,
  });

  useEffect(() => { if (isError) setError("تعذر تحميل التذكرة."); }, [isError]);

  async function handleReply(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSending(true);
    setError("");
    try { await reply({ data: { id, message } }); setMessage(""); await queryClient.invalidateQueries({ queryKey: ["client-support-ticket", id] }); } catch { setError("تعذر إرسال الرد حالياً."); } finally { setSending(false); }
  }

  async function handleClose(): Promise<void> {
    try { await close({ data: { id } }); await navigate({ to: "/client-support/tickets" }); } catch { setError("تعذر إغلاق التذكرة حالياً."); }
  }

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!data) return <div className="p-8 text-center text-destructive">{error || "التذكرة غير موجودة"}</div>;

  return <div className="min-h-screen bg-background" dir="rtl"><div className="border-b border-border bg-secondary/30"><div className="container mx-auto px-4 py-4"><Link to="/client-support/tickets" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowRight className="h-4 w-4" /> العودة لتذاكري</Link></div></div><main className="container mx-auto max-w-3xl px-4 py-8"><div className="rounded-2xl border border-border bg-card p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold">{data.ticket.subject}</h1><p className="mt-2 text-sm text-muted-foreground">الحالة: {data.ticket.status}</p></div>{data.ticket.status !== "closed" && <button onClick={handleClose} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold transition hover:bg-secondary">إغلاق التذكرة</button>}</div><div className="mt-6 space-y-3">{data.messages.map((item) => <div key={item.id} className={`rounded-xl p-4 ${item.sender_type === "admin" ? "bg-secondary" : "bg-primary/10"}`}><p className="text-xs font-semibold text-muted-foreground">{item.sender_type === "admin" ? "فريق الدعم" : "أنت"}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.message}</p></div>)}</div>{data.ticket.status !== "closed" && <form onSubmit={handleReply} className="mt-6 flex gap-2"><textarea value={message} onChange={(event) => setMessage(event.target.value)} required minLength={1} maxLength={5000} rows={3} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5" placeholder="اكتب ردك هنا" /><button type="submit" disabled={sending} className="inline-flex h-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} إرسال</button></form>}{error && <p className="mt-3 text-sm text-destructive">{error}</p>}</div></main></div>;
}
