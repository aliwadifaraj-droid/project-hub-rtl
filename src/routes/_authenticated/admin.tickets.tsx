import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminListTickets, adminGetTicket, adminUpdateTicketStatus, adminUpdateTicketPriority, replyToTicket } from "@/lib/tickets.functions";
import { Loader2, Send, Inbox } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";

export const Route = createFileRoute("/_authenticated/admin/tickets")({
  ssr: false,
  head: () => ({
    meta: [{ title: "تذاكر الدعم | لوحة العمران" }],
  }),
  component: AdminTicketsPage,
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
const PRIORITY_LABELS: Record<string, string> = {
  low: "منخفضة", medium: "متوسطة", high: "عالية",
};
const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-600", medium: "bg-blue-100 text-blue-800", high: "bg-red-100 text-red-800",
};

function AdminTicketsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListTickets);
  const getFn = useServerFn(adminGetTicket);
  const statusFn = useServerFn(adminUpdateTicketStatus);
  const priorityFn = useServerFn(adminUpdateTicketPriority);
  const replyFn = useServerFn(replyToTicket);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: () => listFn(),
    refetchInterval: 10000,
  });

  const { data: detail } = useQuery({
    queryKey: ["admin-ticket-detail", activeId],
    queryFn: () => getFn({ data: { id: activeId! } }),
    enabled: !!activeId,
    refetchInterval: activeId ? 5000 : false,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [detail?.messages.length]);

  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: string }) => statusFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
      qc.invalidateQueries({ queryKey: ["admin-ticket-detail", activeId] });
      toast.success("تم تحديث حالة التذكرة");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const priorityMut = useMutation({
    mutationFn: (v: { id: string; priority: string }) => priorityFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
      qc.invalidateQueries({ queryKey: ["admin-ticket-detail", activeId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const replyMut = useMutation({
    mutationFn: () => replyFn({ data: { id: activeId!, message: body.trim() } }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["admin-ticket-detail", activeId] });
    },
    onError: (e: Error) => toast.error(e.message || "تعذر إرسال الرد"),
  });

  function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    replyMut.mutate();
  }

  return (
    <div className="space-y-4" dir="rtl">
      <h1 className="text-xl font-bold">تذاكر الدعم</h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-sm text-muted-foreground">لا توجد تذاكر حالياً</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Sidebar list */}
          <div className="space-y-2 lg:max-h-[600px] lg:overflow-y-auto">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={`block w-full rounded-xl border p-3 text-right transition ${
                  activeId === t.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[t.status] ?? STATUS_COLORS.open}`}>
                    {STATUS_LABELS[t.status] ?? t.status}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${PRIORITY_COLORS[t.priority] ?? PRIORITY_COLORS.medium}`}>
                    {PRIORITY_LABELS[t.priority] ?? t.priority}
                  </span>
                </div>
                <h3 className="mt-1.5 truncate text-sm font-semibold">{t.subject}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(t.created_at * 1000).toLocaleDateString("ar-SA")}
                </p>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          {activeId && detail ? (
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border/60 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">{detail.ticket.subject}</h2>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[detail.ticket.status] ?? STATUS_COLORS.open}`}>
                    {STATUS_LABELS[detail.ticket.status] ?? detail.ticket.status}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>التصنيف: {detail.ticket.category}</span>
                  {detail.ticket.order_id && <span>رقم الطلب: {detail.ticket.order_id}</span>}
                  <span>المستخدم: {detail.ticket.user_id}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <select
                    value={detail.ticket.status}
                    onChange={(e) => statusMut.mutate({ id: activeId, status: e.target.value })}
                    disabled={statusMut.isPending}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                  >
                    <option value="open">مفتوحة</option>
                    <option value="pending">قيد المعالجة</option>
                    <option value="resolved">تم الحل</option>
                    <option value="closed">مغلقة</option>
                  </select>
                  <select
                    value={detail.ticket.priority}
                    onChange={(e) => priorityMut.mutate({ id: activeId, priority: e.target.value })}
                    disabled={priorityMut.isPending}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                  </select>
                </div>
              </div>

              <div ref={scrollRef} className="space-y-3 p-4" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {detail.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender_type === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        m.sender_type === "admin"
                          ? "rounded-br-sm bg-primary text-primary-foreground"
                          : "rounded-bl-sm bg-secondary text-secondary-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.message}</p>
                      <p className="mt-1 text-[10px] opacity-60" dir="ltr">
                        {new Date(m.created_at * 1000).toLocaleString("ar-SA")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {detail.ticket.status !== "closed" && (
                <form onSubmit={handleReply} className="flex items-center gap-2 border-t border-border/60 p-3">
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
                </form>
              )}
            </div>
          ) : (
            <div className="hidden items-center justify-center rounded-xl border border-border bg-card py-20 lg:flex">
              <p className="text-sm text-muted-foreground">اختر تذكرة لعرض التفاصيل</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
