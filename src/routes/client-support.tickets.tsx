import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyClientTickets } from "@/lib/client-tickets.functions";
import { MessageSquare, Plus, Loader2, ArrowRight, Ticket } from "lucide-react";

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

function NewTicketLink({ className }: { className: string }) {
  return (
    <a href="/client-support/tickets/new" className={className}>
      <Plus className="h-4 w-4" />
      تذكرة جديدة
    </a>
  );
}

function ClientTicketsPage() {
  const listTickets = useServerFn(listMyClientTickets);
  const { data: tickets = [], isLoading, isError } = useQuery({
    queryKey: ["client-support-tickets"],
    queryFn: () => listTickets(),
  });

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="border-b border-border bg-secondary/30">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-4">
          <Link to="/client-portal" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowRight className="h-4 w-4" />
            العودة للوحة العميل
          </Link>
          <h1 className="text-xl font-bold">تذاكر الدعم</h1>
          <NewTicketLink className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90" />
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
            <NewTicketLink className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-primary transition hover:bg-secondary" />
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
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
