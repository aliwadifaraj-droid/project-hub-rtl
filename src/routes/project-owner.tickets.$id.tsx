import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { closeMyOwnerTicket, getMyOwnerTicket, markMyOwnerTicketRead, replyToMyOwnerTicket } from "@/lib/owner-tickets.functions";
import { ArrowRight, Loader2, Send, XCircle } from "lucide-react";

export const Route = createFileRoute("/project-owner/tickets/$id")({
  ssr: false,
  beforeLoad: async () => {
    const { getProjectOwnerSession } = await import("@/lib/project-owner.functions");
    const session = await getProjectOwnerSession();
    if (!session) throw await import("@tanstack/react-router").then((m) => m.redirect({ to: "/project-owner-login" }));
  },
  component: OwnerTicketDetailsPage,
});

const STATUS_LABELS: Record<string, string> = {
  open: "مفتوحة", pending: "قيد المعالجة", resolved: "تم الحل", closed: "مغلقة",
};
const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-600",
};

export function OwnerTicketDetailsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getTicket = useServerFn(getMyOwnerTicket);
  const markRead = useServerFn(markMyOwnerTicketRead);
  const reply = useServerFn(replyToMyOwnerTicket);
  const close = useServerFn(closeMyOwnerTicket);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError } = useQuery({ queryKey: ["owner-support-ticket", id], queryFn: () => getTicket({ data: { id } }), refetchInterval: 5000 });

  useEffect(() => {
    if (isError) setError("تعذر تحميل التذكرة.");
    if (!data) return;
    void markRead({ data: { id } }).then(() => {
      queryClient.setQueryData(["owner-support-tickets"], (current: Array<{ id: string; unread_admin_message_count: number }> | undefined) => current?.map((ticket) => ticket.id === id ? { ...ticket, unread_admin_message_count: 0 } : ticket));
      return queryClient.invalidateQueries({ queryKey: ["owner-support-tickets"] });
    }).catch(() => undefined);
  }, [data, id, isError, markRead, queryClient]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [data?.messages.length]);

  async function handleReply(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError("");
    try {
      await reply({ data: { id, message } });
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: ["owner-support-ticket", id] });
      await queryClient.invalidateQueries({ queryKey: ["owner-support-tickets"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر إرسال الرد حالياً.");
    } finally {
      setSending(false);
    }
  }

  async function handleClose(): Promise<void> {
    try {
      await close({ data: { id } });
      await navigate({ to: "/project-owner/tickets" });
    } catch {
      setError("تعذر إغلاق التذكرة حالياً.");
    }
  }

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!data) return <div className="p-8 text-center text-destructive">{error || "التذكرة غير موجودة"}</div>;

  const isClosed = data.ticket.status === "closed";

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="border-b border-border bg-secondary/30">
        <div className="container mx-auto px-4 py-4">
          <Link to="/project-owner/tickets" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowRight className="h-4 w-4" /> العودة لتذاكري
          </Link>
        </div>
      </div>
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{data.ticket.subject}</h1>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium ${STATUS_COLORS[data.ticket.status] ?? STATUS_COLORS.open}`}>
                  {STATUS_LABELS[data.ticket.status] ?? data.ticket.status}
                </span>
                <span>التصنيف: {data.ticket.category}</span>
                {data.ticket.order_id && <span>رقم الطلب: {data.ticket.order_id}</span>}
                <span>{new Date(data.ticket.created_at * 1000).toLocaleDateString("ar-SA")}</span>
              </div>
            </div>
            {!isClosed && (
              <button onClick={handleClose} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold transition hover:bg-secondary">
                <XCircle className="h-4 w-4" /> إغلاق التذكرة
              </button>
            )}
          </div>

          <div ref={scrollRef} className="mt-6 space-y-3" style={{ maxHeight: "500px", overflowY: "auto" }}>
            {data.messages.map((item) => (
              <div key={item.id} className={`flex ${item.sender_type === "admin" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  item.sender_type === "admin"
                    ? "rounded-bl-sm bg-blue-50 text-blue-900"
                    : "rounded-br-sm bg-emerald-600 text-white"
                }`}>
                  <p className="text-xs font-semibold opacity-70">
                    {item.sender_type === "admin" ? "فريق الدعم" : "أنت"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap leading-6">{item.message}</p>
                  <p className="mt-1 text-[10px] opacity-50" dir="ltr">
                    {new Date(item.created_at * 1000).toLocaleString("ar-SA")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleReply} className="mt-6 flex gap-2">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
              minLength={1}
              maxLength={5000}
              rows={3}
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5"
              placeholder={isClosed ? "اكتب رداً لإعادة فتح التذكرة" : "اكتب ردك هنا"}
            />
            <button type="submit" disabled={sending || !message.trim()} className="inline-flex h-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} إرسال
            </button>
          </form>
          {isClosed && <p className="mt-2 text-xs text-muted-foreground">سيتم إعادة فتح التذكرة تلقائياً عند إرسال رد جديد.</p>}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
      </main>
    </div>
  );
}
