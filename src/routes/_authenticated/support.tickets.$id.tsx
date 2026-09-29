import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTicketMessages, replyToTicket, closeTicket } from "@/lib/tickets.functions";
import { Loader2, Send, XCircle, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";

export const Route = createFileRoute("/_authenticated/support/tickets/$id")({
  ssr: false,
  head: () => ({
    meta: [{ title: "تفاصيل التذكرة | العمران" }],
  }),
  component: TicketDetailPage,
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

function TicketDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getTicketMessages);
  const replyFn = useServerFn(replyToTicket);
  const closeFn = useServerFn(closeTicket);
  const [body, setBody] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ticket-detail", id],
    queryFn: () => getFn({ data: { id } }),
    refetchInterval: 5000,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [data?.messages.length]);

  const replyMut = useMutation({
    mutationFn: () => replyFn({ data: { id, message: body.trim() } }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["ticket-detail", id] });
    },
    onError: (e: Error) => toast.error(e.message || "تعذر إرسال الرد"),
  });

  const closeMut = useMutation({
    mutationFn: () => closeFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم إغلاق التذكرة");
      qc.invalidateQueries({ queryKey: ["ticket-detail", id] });
      qc.invalidateQueries({ queryKey: ["my-tickets"] });
    },
    onError: (e: Error) => toast.error(e.message || "تعذر إغلاق التذكرة"),
  });

  function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    replyMut.mutate();
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { ticket, messages } = data;
  const isClosed = ticket.status === "closed";

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <button
          onClick={() => navigate({ to: "/support/tickets" })}
          className="mb-4 text-sm text-muted-foreground transition hover:text-foreground"
        >
          ← رجوع لتذاكري
        </button>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{ticket.subject}</h1>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status] ?? STATUS_COLORS.open}`}>
              {STATUS_LABELS[ticket.status] ?? ticket.status}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>التصنيف: {ticket.category}</span>
            {ticket.order_id && <span>رقم الطلب: {ticket.order_id}</span>}
            <span>الأولوية: {ticket.priority}</span>
            <span>{new Date(ticket.created_at * 1000).toLocaleDateString("ar-SA")}</span>
          </div>
        </div>

        <div ref={scrollRef} className="mt-6 space-y-3" style={{ maxHeight: "500px", overflowY: "auto" }}>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender_type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  m.sender_type === "user"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-secondary text-secondary-foreground"
                }`}
              >
                <p className="whitespace-pre-line">{m.message}</p>
                {m.attachment_url && (
                  <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs underline">
                    <Paperclip className="h-3 w-3" />
                    مرفق
                  </a>
                )}
                <p className="mt-1 text-[10px] opacity-60" dir="ltr">
                  {new Date(m.created_at * 1000).toLocaleString("ar-SA")}
                </p>
              </div>
            </div>
          ))}
        </div>

        {!isClosed ? (
          <form onSubmit={handleReply} className="mt-4 flex items-center gap-2">
            <input
              type="text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="اكتب ردك..."
              maxLength={5000}
              className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={replyMut.isPending || !body.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {replyMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => closeMut.mutate()}
              disabled={closeMut.isPending}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              aria-label="إغلاق التذكرة"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <div className="mt-4 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-center text-sm text-muted-foreground">
            هذه التذكرة مغلقة. يمكنك فتح تذكرة جديدة إذا لزم الأمر.
          </div>
        )}
      </div>
    </div>
  );
}
